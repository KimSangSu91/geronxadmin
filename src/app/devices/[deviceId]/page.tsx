import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDeviceDetail } from "@/app/devices/actions";
import { formatDate, formatDateTime } from "@/lib/format";
import { DeviceStatusBadge } from "@/components/devices/status-badge";
import { DeviceEditSheet } from "@/components/devices/device-edit-sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DeviceDetailPage(
  props: PageProps<"/devices/[deviceId]">,
) {
  const { deviceId } = await props.params;

  const [detail, deviceTypeOptions] = await Promise.all([
    getDeviceDetail(deviceId),
    prisma.deviceTypeMaster.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/devices"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 내부장비 목록
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{detail.deviceName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {detail.deviceTypeName} · {detail.deviceUid}
            </p>
          </div>
          <DeviceEditSheet detail={detail} deviceTypeOptions={deviceTypeOptions} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">현재 상태</span>
            <DeviceStatusBadge status={detail.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <InfoItem label="디바이스구분" value={detail.deviceTypeName} />
            <InfoItem label="디바이스아이디" value={detail.deviceUid} />
            <InfoItem label="시리얼번호" value={detail.serialNumber} />
            <InfoItem label="제조번호" value={detail.manufacturingNumber} />
            <InfoItem label="입고일" value={formatDate(detail.receivedDate)} />
            <InfoItem label="등록일" value={formatDate(detail.registeredDate)} />
            <InfoItem
              label="현재 매핑 고객사"
              value={detail.currentCustomerName}
            />
          </dl>

          <div>
            <dt className="text-sm text-muted-foreground">설명</dt>
            <dd className="mt-0.5 text-sm whitespace-pre-wrap">
              {detail.description || "-"}
            </dd>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>타임라인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {detail.timeline.length === 0 && (
            <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
          )}
          {detail.timeline.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-0.5 border-l-2 pl-3 text-sm"
            >
              <span className="text-xs text-muted-foreground">
                {formatDateTime(entry.date)}
              </span>
              <span>{entry.title}</span>
              {entry.description && (
                <span className="text-xs text-muted-foreground">
                  {entry.description}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
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
