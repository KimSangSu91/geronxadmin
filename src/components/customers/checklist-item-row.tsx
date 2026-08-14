"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toggleChecklistItem } from "@/app/customers/[customerId]/actions";
import { formatDate } from "@/lib/format";

export function ChecklistItemRow({
  id,
  customerId,
  name,
  isChecked,
  checkedAt,
}: {
  id: string;
  customerId: string;
  name: string;
  isChecked: boolean;
  checkedAt: Date | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    const formData = new FormData();
    formData.set("checklistItemId", id);
    formData.set("customerId", customerId);
    formData.set("nextChecked", String(checked));
    startTransition(() => {
      toggleChecklistItem(formData);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={isChecked}
          onCheckedChange={handleChange}
          disabled={isPending}
        />
        <Label htmlFor={id} className="font-normal">
          {name}
        </Label>
      </div>
      {isChecked && checkedAt && (
        <span className="text-xs text-muted-foreground">
          {formatDate(checkedAt)} 완료
        </span>
      )}
    </div>
  );
}
