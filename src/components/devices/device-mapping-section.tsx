"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkUnmapDevices, mapDevicesToCustomer } from "@/app/devices/actions";
import { toSelectItems } from "@/lib/utils";

type CustomerOption = { id: string; name: string };

export function DeviceMappingSection({
  deviceId,
  currentCustomerName,
  customerOptions,
}: {
  deviceId: string;
  currentCustomerName: string | null;
  customerOptions: CustomerOption[];
}) {
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [unmapAlertOpen, setUnmapAlertOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleMapSubmit(formData: FormData) {
    const customerId = String(formData.get("customerId") ?? "");
    if (!customerId) return;
    startTransition(async () => {
      await mapDevicesToCustomer(formData);
      setMapDialogOpen(false);
      toast.success("고객사에 매핑했습니다.");
    });
  }

  function handleUnmap() {
    const formData = new FormData();
    formData.append("deviceIds", deviceId);
    startTransition(async () => {
      await bulkUnmapDevices(formData);
      setUnmapAlertOpen(false);
      toast.success("매핑을 해제했습니다.");
    });
  }

  if (!currentCustomerName) {
    return (
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogTrigger render={<Button>장비 매핑하기</Button>} />
        <DialogContent className="sm:max-w-sm">
          <form
            action={(formData: FormData) => {
              formData.set("deviceIds", deviceId);
              handleMapSubmit(formData);
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>고객사 선택</DialogTitle>
            </DialogHeader>
            <Select
              name="customerId"
              required
              items={toSelectItems(customerOptions)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="고객사 선택" />
              </SelectTrigger>
              <SelectContent>
                {customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "처리 중..." : "매핑"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm">
        매핑 고객사:{" "}
        <span className="font-medium text-foreground">
          {currentCustomerName}
        </span>
      </span>

      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogTrigger render={<Button size="sm" variant="outline">매핑 변경</Button>} />
        <DialogContent className="sm:max-w-sm">
          <form
            action={(formData: FormData) => {
              formData.set("deviceIds", deviceId);
              handleMapSubmit(formData);
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>매핑 고객사 변경</DialogTitle>
            </DialogHeader>
            <Select
              name="customerId"
              required
              items={toSelectItems(customerOptions)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="고객사 선택" />
              </SelectTrigger>
              <SelectContent>
                {customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "처리 중..." : "변경"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={unmapAlertOpen} onOpenChange={setUnmapAlertOpen}>
        <DialogTrigger render={<Button size="sm" variant="outline">매핑 해제</Button>} />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>매핑 해제</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            현재 &apos;{currentCustomerName}&apos;에 매핑된 장비입니다.
            <br />
            매핑을 해제하시겠습니까?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnmapAlertOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button onClick={handleUnmap} disabled={isPending}>
              {isPending ? "처리 중..." : "매핑 해제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
