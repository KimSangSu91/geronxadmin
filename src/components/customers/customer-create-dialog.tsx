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
import { createCustomer } from "@/app/customers/actions";

type StaffOption = { id: string; name: string };

export function CustomerCreateDialog({
  staffOptions,
}: {
  staffOptions: StaffOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>새 고객사 등록</Button>} />
      <DialogContent className="sm:max-w-md">
        <form action={createCustomer} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>새 고객사 등록</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">고객사코드 *</Label>
              <Input id="code" name="code" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">시설명 *</Label>
              <Input id="name" name="name" required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">주소</Label>
            <Input id="address" name="address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactName">담당자명</Label>
              <Input id="contactName" name="contactName" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPhone">담당자 연락처</Label>
              <Input id="contactPhone" name="contactPhone" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facilityScale">시설규모</Label>
              <Input id="facilityScale" name="facilityScale" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contractedDeviceCount">계약 기반 제공 장비 수</Label>
              <Input
                id="contractedDeviceCount"
                name="contractedDeviceCount"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assignedStaffId">담당자</Label>
            <Select name="assignedStaffId">
              <SelectTrigger id="assignedStaffId" className="w-full">
                <SelectValue placeholder="담당자 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit">등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
