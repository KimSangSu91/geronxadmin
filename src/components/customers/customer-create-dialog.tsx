"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomer } from "@/app/customers/actions";

export function CustomerCreateDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>새 고객사 등록</Button>} />
      <DialogContent className="sm:max-w-sm">
        <form action={createCustomer} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>새 고객사 등록</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">시설명 *</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">주소</Label>
            <Input id="address" name="address" />
          </div>

          <p className="text-xs text-muted-foreground">
            고객사코드는 자동으로 발급됩니다. 나머지 정보는 등록 후 상세페이지에서
            입력할 수 있습니다.
          </p>

          <DialogFooter>
            <Button type="submit">등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
