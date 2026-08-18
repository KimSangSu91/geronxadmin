"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  updateDevice,
  changeDeviceStatus,
  addSanitization,
  addAsHistory,
  resolveAsHistory,
  type DeviceDetail,
} from "@/app/devices/actions";
import { DEVICE_STATUS_LABEL, DEVICE_STATUS_ORDER } from "@/lib/device-status";

type DeviceTypeOption = { id: string; name: string };

export function DeviceEditSheet({
  detail,
  deviceTypeOptions,
}: {
  detail: DeviceDetail;
  deviceTypeOptions: DeviceTypeOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button>수정</Button>} />
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>장비 수정</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          <form
            action={async (formData: FormData) => {
              await updateDevice(formData);
              setOpen(false);
            }}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="deviceId" value={detail.id} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deviceTypeId">디바이스구분 *</Label>
              <Select
                name="deviceTypeId"
                defaultValue={detail.deviceTypeId}
                required
              >
                <SelectTrigger id="deviceTypeId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypeOptions.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deviceName">디바이스명 *</Label>
              <Input
                id="deviceName"
                name="deviceName"
                defaultValue={detail.deviceName}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deviceUid">디바이스아이디 *</Label>
                <Input
                  id="deviceUid"
                  name="deviceUid"
                  defaultValue={detail.deviceUid}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="serialNumber">시리얼번호</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  defaultValue={detail.serialNumber ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="manufacturingNumber">제조번호</Label>
                <Input
                  id="manufacturingNumber"
                  name="manufacturingNumber"
                  defaultValue={detail.manufacturingNumber ?? ""}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="receivedDate">입고일</Label>
                <Input
                  id="receivedDate"
                  name="receivedDate"
                  type="date"
                  defaultValue={detail.receivedDate?.slice(0, 10) ?? ""}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="registeredDate">등록일</Label>
              <Input
                id="registeredDate"
                name="registeredDate"
                type="date"
                defaultValue={detail.registeredDate?.slice(0, 10) ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={detail.description ?? ""}
                rows={3}
              />
            </div>

            <Button type="submit" className="self-end">
              기본정보 저장
            </Button>
          </form>

          <Separator />

          <StatusSection detail={detail} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusSection({ detail }: { detail: DeviceDetail }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(value: unknown) {
    const formData = new FormData();
    formData.set("deviceId", detail.id);
    formData.set("status", String(value));
    startTransition(async () => {
      await changeDeviceStatus(formData);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>상태</Label>
        <Select
          defaultValue={detail.status}
          onValueChange={handleStatusChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-40">
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
      </div>

      {detail.status === "RETRIEVED" && (
        <SanitizationForm deviceId={detail.id} />
      )}

      {detail.status === "DAMAGED" &&
        (detail.activeAsIssue ? (
          <ResolveAsForm asHistoryId={detail.activeAsIssue.id} />
        ) : (
          <AsHistoryForm deviceId={detail.id} />
        ))}
    </div>
  );
}

function SanitizationForm({ deviceId }: { deviceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-md border p-3"
      action={(formData: FormData) => {
        startTransition(async () => {
          await addSanitization(formData);
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

function AsHistoryForm({ deviceId }: { deviceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-md border p-3"
      action={(formData: FormData) => {
        startTransition(async () => {
          await addAsHistory(formData);
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

function ResolveAsForm({ asHistoryId }: { asHistoryId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-md border p-3"
      action={(formData: FormData) => {
        startTransition(async () => {
          await resolveAsHistory(formData);
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
