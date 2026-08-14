"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDevice } from "@/app/devices/actions";

type DeviceTypeOption = { id: string; name: string };

export function DeviceCreateDialog({
  deviceTypeOptions,
}: {
  deviceTypeOptions: DeviceTypeOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>새 장비 등록</Button>} />
      <DialogContent className="sm:max-w-md">
        <form action={createDevice} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>새 장비 등록</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deviceTypeId">디바이스구분 *</Label>
            <Select name="deviceTypeId" required>
              <SelectTrigger id="deviceTypeId" className="w-full">
                <SelectValue placeholder="구분 선택" />
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
            <Input id="deviceName" name="deviceName" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deviceUid">디바이스아이디 *</Label>
              <Input id="deviceUid" name="deviceUid" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serialNumber">시리얼번호</Label>
              <Input id="serialNumber" name="serialNumber" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receivedDate">입고일</Label>
              <Input id="receivedDate" name="receivedDate" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="registeredDate">등록일</Label>
              <Input id="registeredDate" name="registeredDate" type="date" />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
