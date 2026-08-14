"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/generated/prisma/client";
import {
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_ORDER,
} from "@/lib/customer-status";

export function CustomerFilters({
  initialQuery,
  initialStatuses,
}: {
  initialQuery: string;
  initialStatuses: CustomerStatus[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const isFirstRender = useRef(true);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      pushParams((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
      });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function toggleStatus(status: CustomerStatus) {
    pushParams((params) => {
      const current = params.getAll("status");
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      params.delete("status");
      next.forEach((s) => params.append("status", s));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="고객사명, 코드, 주소로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        {CUSTOMER_STATUS_ORDER.map((status) => {
          const isActive = initialStatuses.includes(status);
          return (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={cn(!isActive && "text-muted-foreground")}
              onClick={() => toggleStatus(status)}
            >
              {CUSTOMER_STATUS_LABEL[status]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
