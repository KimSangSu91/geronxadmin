import { prisma } from "@/lib/prisma";
import type { DeviceStatus, Prisma } from "@/generated/prisma/client";
import { DEVICE_STATUS_ORDER } from "@/lib/device-status";
import {
  DeviceFilters,
  DEVICE_UNMAPPED_FILTER_VALUE,
} from "@/components/devices/device-filters";
import { DeviceCreateDialog } from "@/components/devices/device-create-dialog";
import { DeviceBulkImportDialog } from "@/components/devices/device-bulk-import-dialog";
import { DeviceTable } from "@/components/devices/device-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 20;

function parseStatuses(raw: string[]): DeviceStatus[] {
  return raw.filter((s): s is DeviceStatus =>
    DEVICE_STATUS_ORDER.includes(s as DeviceStatus),
  );
}

export default async function DevicesPage(props: PageProps<"/devices">) {
  const searchParams = await props.searchParams;

  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const statusParam = searchParams.status;
  const statuses = parseStatuses(
    Array.isArray(statusParam) ? statusParam : statusParam ? [statusParam] : [],
  );
  const typeParam = searchParams.type;
  const typeIds = Array.isArray(typeParam)
    ? typeParam
    : typeParam
      ? [typeParam]
      : [];
  const customerFilter =
    typeof searchParams.customer === "string" ? searchParams.customer : "";
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where: Prisma.DeviceWhereInput = {
    ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
    ...(typeIds.length > 0 ? { deviceTypeId: { in: typeIds } } : {}),
    ...(q
      ? {
          OR: [
            { deviceName: { contains: q, mode: "insensitive" } },
            { deviceUid: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(customerFilter === DEVICE_UNMAPPED_FILTER_VALUE
      ? { mappings: { none: { unmappedAt: null } } }
      : customerFilter
        ? { mappings: { some: { unmappedAt: null, customerId: customerFilter } } }
        : {}),
  };

  const [totalCount, devices, deviceTypeOptions, customerOptions] =
    await Promise.all([
      prisma.device.count({ where }),
      prisma.device.findMany({
        where,
        include: {
          deviceType: true,
          mappings: {
            where: { unmappedAt: null },
            include: { customer: true },
            take: 1,
          },
        },
        orderBy: { registeredDate: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.deviceTypeMaster.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.customer.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    statuses.forEach((s) => params.append("status", s));
    typeIds.forEach((t) => params.append("type", t));
    if (customerFilter) params.set("customer", customerFilter);
    params.set("page", String(targetPage));
    return `/devices?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">내부장비 관리</h1>
          <p className="text-muted-foreground">
            전체 {totalCount.toLocaleString()}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeviceBulkImportDialog />
          <DeviceCreateDialog deviceTypeOptions={deviceTypeOptions} />
        </div>
      </div>

      <DeviceFilters
        initialQuery={q}
        initialStatuses={statuses}
        initialTypeIds={typeIds}
        initialCustomerFilter={customerFilter}
        deviceTypeOptions={deviceTypeOptions}
        customerOptions={customerOptions}
      />

      <DeviceTable
        devices={devices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          deviceUid: d.deviceUid,
          serialNumber: d.serialNumber,
          receivedDate: d.receivedDate,
          registeredDate: d.registeredDate,
          status: d.status,
          deviceType: { name: d.deviceType.name },
          currentCustomerName: d.mappings[0]?.customer.name ?? null,
        }))}
        customerOptions={customerOptions}
      />

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
