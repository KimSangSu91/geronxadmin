import { CustomerStatus } from "@/generated/prisma/client";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  INQUIRY: "문의접수",
  IN_PROGRESS: "진행중",
  COMPLETED: "서비스 이용중",
  STOPPED: "진행중지",
  PENDING: "진행대기",
  WITHDRAWN: "이용중단",
};

// 고객사 리스트 상태 필터 등에서 사용하는 전체 상태 노출 순서
export const CUSTOMER_STATUS_ORDER: CustomerStatus[] = [
  "INQUIRY",
  "IN_PROGRESS",
  "COMPLETED",
  "STOPPED",
  "PENDING",
  "WITHDRAWN",
];

// 메인 프로세스 — 문의접수 → 진행중 → 서비스 이용중 순으로 이어지는 단계
export const CUSTOMER_MAIN_PROCESS_ORDER: CustomerStatus[] = [
  "INQUIRY",
  "IN_PROGRESS",
  "COMPLETED",
];

// 별도 상태 — 메인 프로세스 흐름에 속하지 않는 예외 상태
export const CUSTOMER_SIDE_STATUS_ORDER: CustomerStatus[] = [
  "STOPPED",
  "PENDING",
  "WITHDRAWN",
];

export const CUSTOMER_STATUS_BADGE_VARIANT: Record<
  CustomerStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  INQUIRY: "outline",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  STOPPED: "destructive",
  PENDING: "outline",
  WITHDRAWN: "destructive",
};
