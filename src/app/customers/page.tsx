import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CustomerStatus, type Prisma } from "@/generated/prisma/client";
import { CUSTOMER_STATUS_ORDER } from "@/lib/customer-status";
import { formatDate } from "@/lib/format";
import { getMissingRequiredDocLabels } from "@/lib/customer-documents";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerCreateDialog } from "@/components/customers/customer-create-dialog";
import { CustomerStatusBadge } from "@/components/customers/status-badge";
import { MissingDocumentWarning } from "@/components/customers/missing-document-warning";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 20;

function parseStatuses(raw: string[]): CustomerStatus[] {
  return raw.filter((s): s is CustomerStatus =>
    CUSTOMER_STATUS_ORDER.includes(s as CustomerStatus),
  );
}

export default async function CustomersPage(props: PageProps<"/customers">) {
  const searchParams = await props.searchParams;

  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const statusParam = searchParams.status;
  const statuses = parseStatuses(
    Array.isArray(statusParam) ? statusParam : statusParam ? [statusParam] : [],
  );
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where: Prisma.CustomerWhereInput = {
    ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [totalCount, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const completedIds = customers
    .filter((c) => c.status === "COMPLETED")
    .map((c) => c.id);
  const registeredDocs =
    completedIds.length > 0
      ? await prisma.customerDocument.findMany({
          where: {
            customerId: { in: completedIds },
            finalFileUrl: { not: null },
          },
          select: { customerId: true, docType: true },
        })
      : [];
  const registeredTypesByCustomer = new Map<string, string[]>();
  for (const doc of registeredDocs) {
    const list = registeredTypesByCustomer.get(doc.customerId) ?? [];
    list.push(doc.docType);
    registeredTypesByCustomer.set(doc.customerId, list);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    statuses.forEach((s) => params.append("status", s));
    params.set("page", String(targetPage));
    return `/customers?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">고객사 관리</h1>
          <p className="text-muted-foreground">
            전체 {totalCount.toLocaleString()}건
          </p>
        </div>
        <CustomerCreateDialog />
      </div>

      <CustomerFilters initialQuery={q} initialStatuses={statuses} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">번호</TableHead>
              <TableHead>고객사명</TableHead>
              <TableHead>고객사코드</TableHead>
              <TableHead>도메인키</TableHead>
              <TableHead>서비스이용상태</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {customers.map((customer, index) => (
              <TableRow key={customer.id} className="cursor-pointer">
                <TableCell className="p-0">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="block px-2 py-2 text-muted-foreground"
                  >
                    {totalCount - ((page - 1) * PAGE_SIZE + index)}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex items-center gap-1.5 px-2 py-2 font-medium"
                  >
                    {customer.name}
                    <MissingDocumentWarning
                      missingLabels={getMissingRequiredDocLabels(
                        customer.status,
                        registeredTypesByCustomer.get(customer.id) ?? [],
                      )}
                    />
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link href={`/customers/${customer.id}`} className="block px-2 py-2">
                    {customer.code}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link href={`/customers/${customer.id}`} className="block px-2 py-2">
                    {customer.domainKey ?? "-"}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link href={`/customers/${customer.id}`} className="block px-2 py-2">
                    <CustomerStatusBadge status={customer.status} />
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link href={`/customers/${customer.id}`} className="block px-2 py-2">
                    {formatDate(customer.createdAt)}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageHref(Math.max(1, page - 1))}
                aria-disabled={page === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .map((p, i, arr) => (
                <PaginationItem key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 ? (
                    <span className="px-2 text-muted-foreground">…</span>
                  ) : null}
                  <PaginationLink href={buildPageHref(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                href={buildPageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
