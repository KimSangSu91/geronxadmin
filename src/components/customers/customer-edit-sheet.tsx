"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCustomerInfo } from "@/app/customers/[customerId]/actions";

type StaffOption = { id: string; name: string };

type CustomerEditData = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactDepartment: string | null;
  facilityScale: string | null;
  assignedStaffId: string | null;
  contractedDeviceCount: number;
  businessRegistrationNumber: string | null;
  corporateRegistrationNumber: string | null;
  representativeEmail: string | null;
  taxInvoiceEmail: string | null;
  domainKey: string | null;
  remainingUsagePeriod: string | null;
};

export function CustomerEditSheet({
  customer,
  staffOptions,
}: {
  customer: CustomerEditData;
  staffOptions: StaffOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline">수정</Button>} />
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <form
          action={async (formData: FormData) => {
            await updateCustomerInfo(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <input type="hidden" name="customerId" value={customer.id} />
          <SheetHeader className="px-0">
            <SheetTitle>고객사 정보 수정</SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-3">
            <Field label="고객사코드 *" name="code" defaultValue={customer.code} required />
            <Field label="시설명 *" name="name" defaultValue={customer.name} required />
          </div>

          <Field label="주소" name="address" defaultValue={customer.address} />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="담당자명"
              name="contactName"
              defaultValue={customer.contactName}
            />
            <Field
              label="담당자 연락처"
              name="contactPhone"
              defaultValue={customer.contactPhone}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="담당자 이메일"
              name="contactEmail"
              type="email"
              defaultValue={customer.contactEmail}
            />
            <Field
              label="담당자 부서명"
              name="contactDepartment"
              defaultValue={customer.contactDepartment}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="시설규모"
              name="facilityScale"
              defaultValue={customer.facilityScale}
            />
            <Field
              label="계약 기반 제공 장비 수"
              name="contractedDeviceCount"
              type="number"
              defaultValue={String(customer.contractedDeviceCount)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assignedStaffId">담당자</Label>
            <Select
              name="assignedStaffId"
              defaultValue={customer.assignedStaffId ?? undefined}
            >
              <SelectTrigger id="assignedStaffId" className="w-full">
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="사업자등록번호"
              name="businessRegistrationNumber"
              defaultValue={customer.businessRegistrationNumber}
            />
            <Field
              label="법인등록번호"
              name="corporateRegistrationNumber"
              defaultValue={customer.corporateRegistrationNumber}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="대표이메일"
              name="representativeEmail"
              type="email"
              defaultValue={customer.representativeEmail}
            />
            <Field
              label="세금계산서 수신 이메일"
              name="taxInvoiceEmail"
              type="email"
              defaultValue={customer.taxInvoiceEmail}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="도메인키"
              name="domainKey"
              defaultValue={customer.domainKey}
            />
            <Field
              label="남은 이용 기간"
              name="remainingUsagePeriod"
              defaultValue={customer.remainingUsagePeriod}
              placeholder="예: 12개월"
            />
          </div>

          <SheetFooter className="px-0">
            <Button type="submit">저장</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
