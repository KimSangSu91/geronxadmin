import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { CustomerStatusStepper } from "@/components/customers/customer-status-stepper";
import { CustomerEditSheet } from "@/components/customers/customer-edit-sheet";
import { AssignedDevicesCard } from "@/components/customers/assigned-devices-card";
import { DocumentSection } from "@/components/customers/document-section";
import { MissingDocumentWarning } from "@/components/customers/missing-document-warning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMissingRequiredDocLabels } from "@/lib/customer-documents";

export default async function CustomerDetailPage(
  props: PageProps<"/customers/[customerId]">,
) {
  const { customerId } = await props.params;

  const [customer, staffOptions, availableDevices] = await Promise.all([
    prisma.customer.findUnique({
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
        deviceMappings: {
          where: { unmappedAt: null },
          include: { device: { include: { deviceType: true } } },
          orderBy: { mappedAt: "desc" },
        },
        documents: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.staff.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.device.findMany({
      where: { status: "IN_STOCK" },
      include: { deviceType: true },
      orderBy: { deviceName: "asc" },
    }),
  ]);

  if (!customer) notFound();

  const missingDocLabels = getMissingRequiredDocLabels(
    customer.status,
    customer.documents.filter((d) => d.finalFileUrl).map((d) => d.docType),
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
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xl">{customer.name}</CardTitle>
              <MissingDocumentWarning missingLabels={missingDocLabels} />
            </div>
            <p className="text-sm text-muted-foreground">{customer.code}</p>
          </div>
          <CustomerEditSheet customer={customer} staffOptions={staffOptions} />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <InfoItem label="주소" value={customer.address} />
            <InfoItem label="담당자" value={customer.contactName} />
            <InfoItem label="담당자 연락처" value={customer.contactPhone} />
            <InfoItem label="담당자 이메일" value={customer.contactEmail} />
            <InfoItem label="담당자 부서명" value={customer.contactDepartment} />
            <InfoItem label="시설규모" value={customer.facilityScale} />
            <InfoItem label="내부 담당자" value={customer.assignedStaff?.name} />
            <InfoItem
              label="계약 장비 수"
              value={String(customer.contractedDeviceCount)}
            />
            <InfoItem
              label="사업자등록번호"
              value={customer.businessRegistrationNumber}
            />
            <InfoItem
              label="법인등록번호"
              value={customer.corporateRegistrationNumber}
            />
            <InfoItem label="대표이메일" value={customer.representativeEmail} />
            <InfoItem
              label="세금계산서 수신 이메일"
              value={customer.taxInvoiceEmail}
            />
            <InfoItem label="도메인키" value={customer.domainKey} />
            <InfoItem
              label="남은 이용 기간"
              value={customer.remainingUsagePeriod}
            />
            <InfoItem label="등록일" value={formatDate(customer.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <CustomerStatusStepper
        customerId={customer.id}
        currentStatus={customer.status}
        currentRemainingUsagePeriod={customer.remainingUsagePeriod}
        actionLogs={customer.actionLogs.map((log) => ({
          id: log.id,
          actionDate: log.actionDate.toISOString(),
          authorStaffName: log.authorStaff?.name ?? null,
          content: log.content,
        }))}
        checklistItems={customer.checklistItems.map((item) => ({
          id: item.id,
          name: item.item.name,
          isChecked: item.isChecked,
          checkedAt: item.checkedAt ? item.checkedAt.toISOString() : null,
        }))}
      />

      <AssignedDevicesCard
        customerId={customer.id}
        mappedDevices={customer.deviceMappings.map((m) => ({
          mappingId: m.id,
          deviceId: m.device.id,
          deviceName: m.device.deviceName,
          deviceUid: m.device.deviceUid,
          deviceTypeName: m.device.deviceType.name,
          mappedAt: m.mappedAt.toISOString(),
        }))}
        availableDevices={availableDevices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          deviceUid: d.deviceUid,
          deviceTypeName: d.deviceType.name,
        }))}
      />

      <DocumentSection
        customerId={customer.id}
        documents={customer.documents.map((doc) => ({
          id: doc.id,
          docType: doc.docType,
          finalFileUrl: doc.finalFileUrl,
          createdAt: doc.createdAt.toISOString(),
        }))}
      />
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
