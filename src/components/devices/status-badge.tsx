import { Badge } from "@/components/ui/badge";
import type { DeviceStatus } from "@/generated/prisma/client";
import {
  DEVICE_STATUS_BADGE_VARIANT,
  DEVICE_STATUS_LABEL,
} from "@/lib/device-status";

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  return (
    <Badge variant={DEVICE_STATUS_BADGE_VARIANT[status]}>
      {DEVICE_STATUS_LABEL[status]}
    </Badge>
  );
}
