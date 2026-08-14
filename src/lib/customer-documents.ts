export const DOC_TYPE_LABEL: Record<string, string> = {
  CONTRACT: "계약서",
  HANDOVER: "인수증",
  AERIAL_VIEW: "조감도",
  OTHER: "기타",
};

// 서비스 이용중 상태에서 반드시 등록되어 있어야 하는 문서 종류
export const REQUIRED_DOC_TYPES_FOR_COMPLETED = ["CONTRACT", "HANDOVER"] as const;

export function getMissingRequiredDocLabels(
  status: string,
  registeredTypes: Set<string> | string[],
): string[] {
  if (status !== "COMPLETED") return [];
  const set =
    registeredTypes instanceof Set ? registeredTypes : new Set(registeredTypes);
  return REQUIRED_DOC_TYPES_FOR_COMPLETED.filter((t) => !set.has(t)).map(
    (t) => DOC_TYPE_LABEL[t],
  );
}
