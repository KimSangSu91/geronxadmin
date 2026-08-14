import { Badge } from "@/components/ui/badge";
import type { CustomerStatus } from "@/generated/prisma/client";
import {
  CUSTOMER_STATUS_BADGE_VARIANT,
  CUSTOMER_STATUS_LABEL,
} from "@/lib/customer-status";

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge variant={CUSTOMER_STATUS_BADGE_VARIANT[status]}>
      {CUSTOMER_STATUS_LABEL[status]}
    </Badge>
  );
}
