"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bulkMapDevices, bulkUnmapDevices } from "@/app/devices/actions";
import { formatDate } from "@/lib/format";

type MappedDevice = {
  mappingId: string;
  deviceId: string;
  deviceName: string;
  deviceUid: string;
  deviceTypeName: string;
  mappedAt: string;
};

type AvailableDevice = {
  id: string;
  deviceName: string;
  deviceUid: string;
  deviceTypeName: string;
};

export function AssignedDevicesCard({
  customerId,
  mappedDevices,
  availableDevices,
}: {
  customerId: string;
  mappedDevices: MappedDevice[];
  availableDevices: AvailableDevice[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnassign(deviceId: string) {
    const formData = new FormData();
    formData.append("deviceIds", deviceId);
    startTransition(async () => {
      await bulkUnmapDevices(formData);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>할당된 디바이스 ({mappedDevices.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm">장비 할당</Button>} />
          <DialogContent className="sm:max-w-sm">
            <form
              action={(formData: FormData) => {
                formData.set("customerId", customerId);
                startTransition(async () => {
                  await bulkMapDevices(formData);
                  setOpen(false);
                });
              }}
              className="flex flex-col gap-4"
            >
              <DialogHeader>
                <DialogTitle>장비 할당</DialogTitle>
              </DialogHeader>
              {availableDevices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  할당 가능한 재고 장비가 없습니다.
                </p>
              ) : (
                <Select name="deviceIds" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="재고 장비 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDevices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.deviceTypeName} · {d.deviceName} ({d.deviceUid})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isPending || availableDevices.length === 0}>
                  할당
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {mappedDevices.length === 0 && (
          <p className="text-sm text-muted-foreground">
            할당된 디바이스가 없습니다.
          </p>
        )}
        {mappedDevices.map((d) => (
          <div
            key={d.mappingId}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">
                {d.deviceName}{" "}
                <span className="text-muted-foreground">
                  ({d.deviceTypeName})
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {d.deviceUid} · {formatDate(d.mappedAt)} 할당
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleUnassign(d.deviceId)}
            >
              해제
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
