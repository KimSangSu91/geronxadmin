"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerStatus } from "@/generated/prisma/client";
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_ORDER,
} from "@/lib/customer-status";
import { updateCustomerStatus } from "@/app/customers/[customerId]/actions";

export function CustomerStatusSelect({
  customerId,
  currentStatus,
  currentRemainingUsagePeriod,
}: {
  customerId: string;
  currentStatus: CustomerStatus;
  currentRemainingUsagePeriod: string | null;
}) {
  const [value, setValue] = useState<CustomerStatus>(currentStatus);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function commitStatus(status: CustomerStatus, formData?: FormData) {
    const data = formData ?? new FormData();
    data.set("customerId", customerId);
    data.set("status", status);
    startTransition(async () => {
      await updateCustomerStatus(data);
      setValue(status);
    });
  }

  function handleChange(next: unknown) {
    const status = String(next) as CustomerStatus;
    if (status === "COMPLETED") {
      // 서비스 이용중으로 전환할 때는 남은 이용 기간 입력을 먼저 받는다
      setCompleteDialogOpen(true);
      return;
    }
    commitStatus(status);
  }

  return (
    <>
      <Select value={value} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CUSTOMER_STATUS_ORDER.map((status) => (
            <SelectItem key={status} value={status}>
              {CUSTOMER_STATUS_LABEL[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            action={(formData: FormData) => {
              setCompleteDialogOpen(false);
              commitStatus("COMPLETED", formData);
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>서비스 이용중으로 변경</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="remainingUsagePeriod">남은 이용 기간 *</Label>
              <Input
                id="remainingUsagePeriod"
                name="remainingUsagePeriod"
                placeholder="예: 12개월"
                defaultValue={currentRemainingUsagePeriod ?? ""}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">변경</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
