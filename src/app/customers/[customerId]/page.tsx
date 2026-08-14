import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { CustomerStatusBadge } from "@/components/customers/status-badge";
import { CustomerStatusSelect } from "@/components/customers/customer-status-select";
import { ActionLogForm } from "@/components/customers/action-log-form";
import { ChecklistItemRow } from "@/components/customers/checklist-item-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_ORDER,
} from "@/lib/customer-status";

export default async function CustomerDetailPage(
  props: PageProps<"/customers/[customerId]">,
) {
  const { customerId } = await props.params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      assignedStaff: true,
      actionLogs: {
        orderBy: { actionDate: "desc" },
        include: { authorStaff: true },
      },
      checklistItems: {
        include: { item: true },
        orderBy: { item: { sortOrder: "asc" } },
      },
    },
  });

  if (!customer) notFound();

  const checkedCount = customer.checklistItems.filter((i) => i.isChecked).length;
  const otherStatuses = CUSTOMER_STATUS_ORDER.filter(
    (status) => status !== "INQUIRY" && status !== "IN_PROGRESS",
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/customers"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 고객사 목록
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{customer.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{customer.code}</p>
          </div>
          <CustomerStatusSelect
            customerId={customer.id}
            currentStatus={customer.status}
          />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <InfoItem label="주소" value={customer.address} />
            <InfoItem label="담당자" value={customer.contactName} />
            <InfoItem label="담당자 연락처" value={customer.contactPhone} />
            <InfoItem label="시설규모" value={customer.facilityScale} />
            <InfoItem label="내부 담당자" value={customer.assignedStaff?.name} />
            <InfoItem
              label="계약 장비 수"
              value={String(customer.contractedDeviceCount)}
            />
            <InfoItem label="등록일" value={formatDate(customer.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue={customer.status}>
        <TabsList>
          {CUSTOMER_STATUS_ORDER.map((status) => (
            <TabsTrigger key={status} value={status}>
              {CUSTOMER_STATUS_LABEL[status]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="INQUIRY" className="flex flex-col gap-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>문의접수 히스토리</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ActionLogForm customerId={customer.id} />
              <div className="flex flex-col gap-2">
                {customer.actionLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    등록된 히스토리가 없습니다.
                  </p>
                )}
                {customer.actionLogs.map((log) => (
                  <div key={log.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDateTime(log.actionDate)}</span>
                      <span>{log.authorStaff?.name ?? "미지정"}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{log.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="IN_PROGRESS" className="flex flex-col gap-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                진행중 체크리스트 ({checkedCount}/{customer.checklistItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {customer.checklistItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  체크리스트 항목이 없습니다.
                </p>
              )}
              {customer.checklistItems.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  id={item.id}
                  customerId={customer.id}
                  name={item.item.name}
                  isChecked={item.isChecked}
                  checkedAt={item.checkedAt}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {otherStatuses.map((status) => (
          <TabsContent key={status} value={status} className="pt-4">
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <span>
                  {CUSTOMER_STATUS_LABEL[status]} 상태에 대한 별도 이력 화면은
                  아직 없습니다. 현재 상태:
                </span>
                <CustomerStatusBadge status={customer.status} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || "-"}</dd>
    </div>
  );
}
