"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, toSelectItems } from "@/lib/utils";
import type { DeviceStatus } from "@/generated/prisma/client";
import { DEVICE_STATUS_LABEL, DEVICE_STATUS_ORDER } from "@/lib/device-status";

type DeviceTypeOption = { id: string; name: string };
type CustomerOption = { id: string; name: string };

export const DEVICE_UNMAPPED_FILTER_VALUE = "__unmapped__";
const ALL_VALUE = "__all__";

export function DeviceFilters({
  initialQuery,
  initialStatuses,
  initialTypeIds,
  initialCustomerFilter,
  deviceTypeOptions,
  customerOptions,
}: {
  initialQuery: string;
  initialStatuses: DeviceStatus[];
  initialTypeIds: string[];
  initialCustomerFilter: string;
  deviceTypeOptions: DeviceTypeOption[];
  customerOptions: CustomerOption[];
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

  function toggleParam(key: "status" | "type", value: string) {
    pushParams((params) => {
      const current = params.getAll(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      params.delete(key);
      next.forEach((v) => params.append(key, v));
    });
  }

  function handleCustomerChange(value: unknown) {
    pushParams((params) => {
      if (value === ALL_VALUE) params.delete("customer");
      else params.set("customer", String(value));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="디바이스명, 디바이스아이디, 시리얼로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <Select
        value={initialCustomerFilter || ALL_VALUE}
        onValueChange={handleCustomerChange}
        items={{
          [ALL_VALUE]: "전체",
          [DEVICE_UNMAPPED_FILTER_VALUE]: "미매핑",
          ...toSelectItems(customerOptions),
        }}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="고객사 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체</SelectItem>
          <SelectItem value={DEVICE_UNMAPPED_FILTER_VALUE}>미매핑</SelectItem>
          {customerOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-2">
        {deviceTypeOptions.map((type) => {
          const isActive = initialTypeIds.includes(type.id);
          return (
            <Button
              key={type.id}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={cn(!isActive && "text-muted-foreground")}
              onClick={() => toggleParam("type", type.id)}
            >
              {type.name}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {DEVICE_STATUS_ORDER.map((status) => {
          const isActive = initialStatuses.includes(status);
          return (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={cn(!isActive && "text-muted-foreground")}
              onClick={() => toggleParam("status", status)}
            >
              {DEVICE_STATUS_LABEL[status]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
