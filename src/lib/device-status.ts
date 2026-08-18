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

// 이 상태로 전환되면 고객사 매핑이 존재해서는 안 된다 — changeDeviceStatus에서
// 활성 매핑을 자동으로 해제하는 데 사용 (재고 / 회수완료 / 폐기)
export const DEVICE_STATUSES_REQUIRING_UNMAP: DeviceStatus[] = [
  "IN_STOCK",
  "RETRIEVED",
  "DISPOSED",
];

// 고객사 매핑이 가능한 상태 — mapDevicesToCustomer에서 사용.
// 매핑 해제(반납대기) 직후에도 다른 고객사로 바로 재매핑할 수 있어야 하므로
// RETURN_PENDING도 포함한다. 파손입고/폐기 장비는 매핑 대상에서 제외한다.
export const DEVICE_STATUSES_ELIGIBLE_FOR_MAPPING: DeviceStatus[] = [
  "IN_STOCK",
  "MAPPING",
  "RETURN_PENDING",
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
