"use client";

import { Fragment, useState, useTransition } from "react";
import { Check } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/generated/prisma/client";
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_ORDER,
} from "@/lib/customer-status";
import { updateCustomerStatus } from "@/app/customers/[customerId]/actions";

export function CustomerStatusStepper({
  customerId,
  currentStatus,
  currentRemainingUsagePeriod,
}: {
  customerId: string;
  currentStatus: CustomerStatus;
  currentRemainingUsagePeriod: string | null;
}) {
  const [status, setStatus] = useState<CustomerStatus>(currentStatus);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentIndex = CUSTOMER_STATUS_ORDER.indexOf(status);

  function commit(next: CustomerStatus, formData?: FormData) {
    const data = formData ?? new FormData();
    data.set("customerId", customerId);
    data.set("status", next);
    startTransition(async () => {
      await updateCustomerStatus(data);
      setStatus(next);
    });
  }

  function handleSelect(next: CustomerStatus) {
    if (next === status || isPending) return;
    if (next === "COMPLETED") {
      // 서비스 이용중으로 전환할 때는 남은 이용 기간 입력을 먼저 받는다
      setCompleteDialogOpen(true);
      return;
    }
    commit(next);
  }

  return (
    <Card>
      <CardContent className="flex items-center py-6">
        {CUSTOMER_STATUS_ORDER.map((step, i) => (
          <Fragment key={step}>
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i <= currentIndex ? "bg-emerald-500" : "bg-border",
                )}
              />
            )}
            <button
              type="button"
              onClick={() => handleSelect(step)}
              disabled={isPending}
              className="flex cursor-pointer flex-col items-center gap-1.5 px-1 disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  i < currentIndex && "border-emerald-500 bg-emerald-500 text-white",
                  i === currentIndex && "border-blue-500 bg-blue-500",
                  i > currentIndex && "border-border bg-muted",
                )}
              >
                {i < currentIndex && <Check className="size-4" />}
                {i === currentIndex && (
                  <span className="size-2 rounded-full bg-white" />
                )}
              </span>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  i === currentIndex
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {CUSTOMER_STATUS_LABEL[step]}
              </span>
            </button>
          </Fragment>
        ))}
      </CardContent>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            action={(formData: FormData) => {
              setCompleteDialogOpen(false);
              commit("COMPLETED", formData);
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
    </Card>
  );
}
