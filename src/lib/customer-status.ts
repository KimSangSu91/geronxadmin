import { CustomerStatus } from "@/generated/prisma/client";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  INQUIRY: "문의접수",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  STOPPED: "진행중지",
  PENDING: "진행대기",
};

// 상세 화면 탭 순서 및 리스트 상태 필터 노출 순서
export const CUSTOMER_STATUS_ORDER: CustomerStatus[] = [
  "INQUIRY",
  "IN_PROGRESS",
  "COMPLETED",
  "STOPPED",
  "PENDING",
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
};
