"use client";

import { Fragment, useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
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
import { ActionLogForm } from "@/components/customers/action-log-form";
import { ChecklistItemRow } from "@/components/customers/checklist-item-row";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { CustomerStatus } from "@/generated/prisma/client";
import {
  CUSTOMER_MAIN_PROCESS_ORDER,
  CUSTOMER_SIDE_STATUS_ORDER,
  CUSTOMER_STATUS_LABEL,
} from "@/lib/customer-status";
import { updateCustomerStatus } from "@/app/customers/[customerId]/actions";

type ActionLogEntry = {
  id: string;
  actionDate: string;
  authorStaffName: string | null;
  content: string;
};

type ChecklistEntry = {
  id: string;
  name: string;
  isChecked: boolean;
  checkedAt: string | null;
};

export function CustomerStatusStepper({
  customerId,
  currentStatus,
  currentRemainingUsagePeriod,
  actionLogs,
  checklistItems,
}: {
  customerId: string;
  currentStatus: CustomerStatus;
  currentRemainingUsagePeriod: string | null;
  actionLogs: ActionLogEntry[];
  checklistItems: ChecklistEntry[];
}) {
  const [status, setStatus] = useState<CustomerStatus>(currentStatus);
  const [expandedStep, setExpandedStep] = useState<CustomerStatus | null>(
    CUSTOMER_MAIN_PROCESS_ORDER.includes(currentStatus) ? currentStatus : null,
  );
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mainIndex = CUSTOMER_MAIN_PROCESS_ORDER.indexOf(status);
  const checkedCount = checklistItems.filter((i) => i.isChecked).length;

  function commit(
    next: CustomerStatus,
    formData: FormData | undefined,
    expandAfter: boolean,
  ) {
    const data = formData ?? new FormData();
    data.set("customerId", customerId);
    data.set("status", next);
    startTransition(async () => {
      await updateCustomerStatus(data);
      setStatus(next);
      if (expandAfter) setExpandedStep(next);
    });
  }

  function toggleExpand(step: CustomerStatus) {
    setExpandedStep((prev) => (prev === step ? null : step));
  }

  function handleMainStepClick(next: CustomerStatus) {
    if (isPending) return;
    if (next === status) {
      // 이미 현재 상태인 단계를 다시 클릭하면 상태 변경 없이 펼침만 토글
      toggleExpand(next);
      return;
    }
    if (next === "COMPLETED") {
      // 서비스 이용중으로 전환할 때는 남은 이용 기간 입력을 먼저 받는다
      setCompleteDialogOpen(true);
      return;
    }
    commit(next, undefined, true);
  }

  function handleSideStatusClick(next: CustomerStatus) {
    if (isPending || next === status) return;
    commit(next, undefined, false);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1">
            {CUSTOMER_MAIN_PROCESS_ORDER.map((step, i) => (
              <Fragment key={step}>
                {i > 0 && (
                  <div
                    className={cn(
                      "h-0.5 w-6 shrink-0 sm:w-10",
                      i <= mainIndex ? "bg-emerald-500" : "bg-border",
                    )}
                  />
                )}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMainStepClick(step)}
                    disabled={isPending}
                    className="flex cursor-pointer items-center gap-1.5 px-1 disabled:cursor-not-allowed"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        i < mainIndex &&
                          "border-emerald-500 bg-emerald-500 text-white",
                        i === mainIndex && "border-blue-500 bg-blue-500",
                        i > mainIndex && "border-border bg-muted",
                      )}
                    >
                      {i < mainIndex && <Check className="size-4" />}
                      {i === mainIndex && (
                        <span className="size-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs whitespace-nowrap",
                        i === mainIndex
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {CUSTOMER_STATUS_LABEL[step]}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(step)}
                    aria-label={expandedStep === step ? "접기" : "펼치기"}
                    className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        expandedStep === step && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </Fragment>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {CUSTOMER_SIDE_STATUS_ORDER.map((sideStatus) => (
              <Button
                key={sideStatus}
                type="button"
                size="sm"
                variant={status === sideStatus ? "default" : "outline"}
                disabled={isPending}
                onClick={() => handleSideStatusClick(sideStatus)}
              >
                {CUSTOMER_STATUS_LABEL[sideStatus]}
              </Button>
            ))}
          </div>
        </div>

        {expandedStep && (
          <div className="flex flex-col gap-4 border-t pt-4">
            {expandedStep === "INQUIRY" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">문의접수 히스토리</h3>
                <ActionLogForm customerId={customerId} />
                <div className="flex flex-col gap-2">
                  {actionLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      등록된 히스토리가 없습니다.
                    </p>
                  )}
                  {actionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDateTime(log.actionDate)}</span>
                        <span>{log.authorStaffName ?? "미지정"}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{log.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expandedStep === "IN_PROGRESS" && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">
                  진행중 체크리스트 ({checkedCount}/{checklistItems.length})
                </h3>
                {checklistItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    체크리스트 항목이 없습니다.
                  </p>
                )}
                {checklistItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    id={item.id}
                    customerId={customerId}
                    name={item.name}
                    isChecked={item.isChecked}
                    checkedAt={item.checkedAt ? new Date(item.checkedAt) : null}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <form
            action={(formData: FormData) => {
              setCompleteDialogOpen(false);
              commit("COMPLETED", formData, true);
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
