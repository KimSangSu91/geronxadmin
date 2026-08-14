"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DeviceStatusBadge } from "@/components/devices/status-badge";
import { DeviceDetailSheet } from "@/components/devices/device-detail-sheet";
import { formatDate } from "@/lib/format";
import { bulkMapDevices, bulkUnmapDevices } from "@/app/devices/actions";
import type { DeviceStatus } from "@/generated/prisma/client";

type DeviceRow = {
  id: string;
  deviceName: string;
  deviceUid: string;
  serialNumber: string | null;
  receivedDate: Date | null;
  registeredDate: Date | null;
  status: DeviceStatus;
  deviceType: { name: string };
};

type CustomerOption = { id: string; name: string };

export function DeviceTable({
  devices,
  customerOptions,
}: {
  devices: DeviceRow[];
  customerOptions: CustomerOption[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openDeviceId, setOpenDeviceId] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedIds = Array.from(selected);
  const allSelected = devices.length > 0 && selected.size === devices.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(devices.map((d) => d.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleUnmap() {
    const formData = new FormData();
    selectedIds.forEach((id) => formData.append("deviceIds", id));
    startTransition(async () => {
      await bulkUnmapDevices(formData);
      setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
          <span className="text-sm">{selected.size}건 선택됨</span>
          <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" variant="outline">
                  선택 매핑
                </Button>
              }
            />
            <DialogContent className="sm:max-w-sm">
              <form
                action={(formData: FormData) => {
                  selectedIds.forEach((id) => formData.append("deviceIds", id));
                  startTransition(async () => {
                    await bulkMapDevices(formData);
                    setSelected(new Set());
                    setMapDialogOpen(false);
                  });
                }}
                className="flex flex-col gap-4"
              >
                <DialogHeader>
                  <DialogTitle>{selected.size}건 매핑</DialogTitle>
                </DialogHeader>
                <Select name="customerId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="고객사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    매핑
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnmap}
            disabled={isPending}
          >
            선택 해제
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>디바이스구분</TableHead>
              <TableHead>디바이스명</TableHead>
              <TableHead>디바이스아이디</TableHead>
              <TableHead>시리얼</TableHead>
              <TableHead>입고일</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>매핑상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {devices.map((device) => (
              <TableRow key={device.id} className="cursor-pointer">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(device.id)}
                    onCheckedChange={() => toggleOne(device.id)}
                  />
                </TableCell>
                <TableCell onClick={() => setOpenDeviceId(device.id)}>
                  {device.deviceType.name}
                </TableCell>
                <TableCell
                  onClick={() => setOpenDeviceId(device.id)}
                  className="font-medium"
                >
                  {device.deviceName}
                </TableCell>
                <TableCell onClick={() => setOpenDeviceId(device.id)}>
                  {device.deviceUid}
                </TableCell>
                <TableCell onClick={() => setOpenDeviceId(device.id)}>
                  {device.serialNumber ?? "-"}
                </TableCell>
                <TableCell onClick={() => setOpenDeviceId(device.id)}>
                  {formatDate(device.receivedDate)}
                </TableCell>
                <TableCell onClick={() => setOpenDeviceId(device.id)}>
                  {formatDate(device.registeredDate)}
                </TableCell>
                <TableCell onClick={() => setOpenDeviceId(device.id)}>
                  <DeviceStatusBadge status={device.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeviceDetailSheet
        deviceId={openDeviceId}
        onOpenChange={(open) => !open && setOpenDeviceId(null)}
      />
    </div>
  );
}
