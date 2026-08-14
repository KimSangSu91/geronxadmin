"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerStatus } from "@/generated/prisma/client";
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_ORDER,
} from "@/lib/customer-status";
import { updateCustomerStatus } from "@/app/customers/[customerId]/actions";

export function CustomerStatusSelect({
  customerId,
  currentStatus,
}: {
  customerId: string;
  currentStatus: CustomerStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: unknown) {
    const formData = new FormData();
    formData.set("customerId", customerId);
    formData.set("status", String(value));
    startTransition(() => {
      updateCustomerStatus(formData);
    });
  }

  return (
    <Select
      defaultValue={currentStatus}
      onValueChange={handleChange}
      disabled={isPending}
    >
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
  );
}
