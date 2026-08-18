import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// shadcn/ui의 Select(Base UI)는 Root에 `items`(value -> label) 맵을 전달해야만
// 트리거에 선택된 항목의 라벨을 표시한다. 없으면 내부 value가 그대로 노출된다.
// https://base-ui.com/react/components/select#items
export function toSelectItems<T extends { id: string; name: string }>(
  options: readonly T[],
): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.id, o.name]))
}
