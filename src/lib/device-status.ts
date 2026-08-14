import { DeviceStatus } from "@/generated/prisma/client";

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  IN_STOCK: "재고",
  MAPPING: "매핑중",
  RETURN_PENDING: "반납대기",
  RETRIEVED: "회수완료",
  DAMAGED: "파손입고",
  DISPOSED: "폐기",
};

export const DEVICE_STATUS_ORDER: DeviceStatus[] = [
  "IN_STOCK",
  "MAPPING",
  "RETURN_PENDING",
  "RETRIEVED",
  "DAMAGED",
  "DISPOSED",
];

export const DEVICE_STATUS_BADGE_VARIANT: Record<
  DeviceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  IN_STOCK: "secondary",
  MAPPING: "default",
  RETURN_PENDING: "outline",
  RETRIEVED: "outline",
  DAMAGED: "destructive",
  DISPOSED: "destructive",
};
