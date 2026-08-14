"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceStatusBadge } from "@/components/devices/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { DEVICE_STATUS_LABEL, DEVICE_STATUS_ORDER } from "@/lib/device-status";
import {
  getDeviceDetail,
  changeDeviceStatus,
  addSanitization,
  addAsHistory,
  resolveAsHistory,
  type DeviceDetail,
} from "@/app/devices/actions";

export function DeviceDetailSheet({
  deviceId,
  onOpenChange,
}: {
  deviceId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!deviceId) return;
    getDeviceDetail(deviceId).then(setDetail);
  }, [deviceId]);

  const loading = deviceId !== null && detail?.id !== deviceId;

  function refresh() {
    if (!deviceId) return;
    getDeviceDetail(deviceId).then(setDetail);
  }

  function handleStatusChange(value: unknown) {
    if (!deviceId) return;
    const formData = new FormData();
    formData.set("deviceId", deviceId);
    formData.set("status", String(value));
    startTransition(async () => {
      await changeDeviceStatus(formData);
      refresh();
    });
  }

  return (
    <Sheet open={deviceId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {loading && (
          <p className="p-4 text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {!loading && detail && (
          <>
            <SheetHeader>
              <SheetTitle>{detail.deviceName}</SheetTitle>
              <SheetDescription>
                {detail.deviceTypeName} · {detail.deviceUid}
                {detail.serialNumber ? ` · S/N ${detail.serialNumber}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex items-center justify-between">
                <Select
                  defaultValue={detail.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {DEVICE_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DeviceStatusBadge status={detail.status} />
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <InfoItem label="입고일" value={formatDate(detail.receivedDate)} />
                <InfoItem
                  label="등록일"
                  value={formatDate(detail.registeredDate)}
                />
                <InfoItem
                  label="현재 매핑 고객사"
                  value={detail.currentCustomerName ?? "-"}
                />
              </dl>

              {detail.status === "RETRIEVED" && (
                <SanitizationForm deviceId={detail.id} onDone={refresh} />
              )}

              {detail.status === "DAMAGED" &&
                (detail.activeAsIssue ? (
                  <ResolveAsForm
                    asHistoryId={detail.activeAsIssue.id}
                    onDone={refresh}
                  />
                ) : (
                  <AsHistoryForm deviceId={detail.id} onDone={refresh} />
                ))}

              <Separator />

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">타임라인</h3>
                {detail.timeline.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    기록이 없습니다.
                  </p>
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
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function SanitizationForm({
  deviceId,
  onDone,
}: {
  deviceId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-md border p-3"
      action={(formData: FormData) => {
        startTransition(async () => {
          await addSanitization(formData);
          onDone();
        });
      }}
    >
      <input type="hidden" name="deviceId" value={deviceId} />
      <Label htmlFor="result">소독 기록 추가</Label>
      <Input id="result" name="result" placeholder="소독 결과" />
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}

function AsHistoryForm({
  deviceId,
  onDone,
}: {
  deviceId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-md border p-3"
      action={(formData: FormData) => {
        startTransition(async () => {
          await addAsHistory(formData);
          onDone();
        });
      }}
    >
      <input type="hidden" name="deviceId" value={deviceId} />
      <Label htmlFor="issueDescription">AS 접수</Label>
      <Textarea
        id="issueDescription"
        name="issueDescription"
        placeholder="문제 내용"
        required
        rows={2}
      />
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "등록 중..." : "등록"}
      </Button>
    </form>
  );
}

function ResolveAsForm({
  asHistoryId,
  onDone,
}: {
  asHistoryId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-md border p-3"
      action={(formData: FormData) => {
        startTransition(async () => {
          await resolveAsHistory(formData);
          onDone();
        });
      }}
    >
      <input type="hidden" name="asHistoryId" value={asHistoryId} />
      <Label htmlFor="resolution">AS 처리 결과</Label>
      <Textarea id="resolution" name="resolution" placeholder="조치 내용" rows={2} />
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "저장 중..." : "완료 처리"}
      </Button>
    </form>
  );
}
