"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceStatusBadge } from "@/components/devices/status-badge";
import { formatDate } from "@/lib/format";
import {
  bulkUnmapDevices,
  checkDeviceMappingConflicts,
  mapDevicesToCustomer,
  type MappingConflict,
} from "@/app/devices/actions";
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
  currentCustomerName: string | null;
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
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [emptyAlertOpen, setEmptyAlertOpen] = useState(false);
  const [conflicts, setConflicts] = useState<MappingConflict[]>([]);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(
    null,
  );
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
      toast.success("선택한 장비의 매핑을 해제했습니다.");
    });
  }

  function handleMapButtonClick() {
    if (selectedIds.length === 0) {
      setEmptyAlertOpen(true);
      return;
    }
    setMapDialogOpen(true);
  }

  async function runMapping(customerId: string) {
    const formData = new FormData();
    selectedIds.forEach((id) => formData.append("deviceIds", id));
    formData.set("customerId", customerId);
    const result = await mapDevicesToCustomer(formData);
    setSelected(new Set());
    toast.success(`장비 ${result.mappedCount}건을 매핑했습니다.`);
  }

  function handleMapDialogSubmit(formData: FormData) {
    const customerId = String(formData.get("customerId") ?? "");
    if (!customerId) return;
    startTransition(async () => {
      const foundConflicts = await checkDeviceMappingConflicts(
        selectedIds,
        customerId,
      );
      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setPendingCustomerId(customerId);
        setMapDialogOpen(false);
        setConflictDialogOpen(true);
        return;
      }
      await runMapping(customerId);
      setMapDialogOpen(false);
    });
  }

  function handleConflictConfirm() {
    if (!pendingCustomerId) return;
    startTransition(async () => {
      await runMapping(pendingCustomerId);
      setConflictDialogOpen(false);
      setPendingCustomerId(null);
      setConflicts([]);
    });
  }

  function handleConflictCancel() {
    setConflictDialogOpen(false);
    setPendingCustomerId(null);
    setConflicts([]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {selected.size > 0 && (
          <span className="text-sm text-muted-foreground">
            {selected.size}건 선택됨
          </span>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleMapButtonClick}
          disabled={isPending}
        >
          장비 매핑하기
        </Button>
        {selected.size > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnmap}
            disabled={isPending}
          >
            선택 해제
          </Button>
        )}
      </div>

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
              <TableRow key={device.id}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(device.id)}
                    onCheckedChange={() => toggleOne(device.id)}
                  />
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block px-2 py-2"
                  >
                    {device.deviceType.name}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block px-2 py-2 font-medium"
                  >
                    {device.deviceName}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block px-2 py-2"
                  >
                    {device.deviceUid}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block px-2 py-2"
                  >
                    {device.serialNumber ?? "-"}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block px-2 py-2"
                  >
                    {formatDate(device.receivedDate)}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block px-2 py-2"
                  >
                    {formatDate(device.registeredDate)}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/devices/${device.id}`}
                    className="flex flex-col gap-0.5 px-2 py-2"
                  >
                    <DeviceStatusBadge status={device.status} />
                    {device.currentCustomerName && (
                      <span className="text-xs text-muted-foreground">
                        {device.currentCustomerName}
                      </span>
                    )}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 매핑 대상 미선택 안내 */}
      <Dialog open={emptyAlertOpen} onOpenChange={setEmptyAlertOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>안내</DialogTitle>
          </DialogHeader>
          <p className="text-sm">매핑할 기기를 먼저 선택해주세요.</p>
          <DialogFooter>
            <Button onClick={() => setEmptyAlertOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 고객사 선택 */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <form action={handleMapDialogSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{selected.size}건 매핑 — 고객사 선택</DialogTitle>
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
                {isPending ? "확인 중..." : "매핑"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 중복 매핑 경고 */}
      <Dialog
        open={conflictDialogOpen}
        onOpenChange={(open) => !open && handleConflictCancel()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이미 매핑된 장비가 있습니다</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
            {conflicts.map((c) => (
              <p key={c.deviceId} className="rounded-md border px-3 py-2">
                {c.deviceLabel} 기기가 이미 &apos;{c.currentCustomerName}
                &apos;에 매핑되어 있습니다. 변경하시겠습니까?
              </p>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleConflictCancel}
              disabled={isPending}
            >
              취소
            </Button>
            <Button onClick={handleConflictConfirm} disabled={isPending}>
              {isPending ? "처리 중..." : "변경 진행"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
