"use client";

import { CircleAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function MissingDocumentWarning({
  missingLabels,
}: {
  missingLabels: string[];
}) {
  if (missingLabels.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex text-destructive" aria-label="문서 누락 경고" />
        }
      >
        <CircleAlert className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{missingLabels.join(", ")}가 누락되었습니다</TooltipContent>
    </Tooltip>
  );
}
