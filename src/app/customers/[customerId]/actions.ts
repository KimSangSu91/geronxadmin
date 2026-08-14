"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CustomerStatus } from "@/generated/prisma/client";

export async function updateCustomerStatus(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const status = String(formData.get("status") ?? "") as CustomerStatus;

  if (!customerId || !Object.values(CustomerStatus).includes(status)) {
    throw new Error("잘못된 요청입니다.");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { status },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}

export async function addActionLog(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!customerId || !content) {
    throw new Error("내용을 입력해주세요.");
  }

  await prisma.customerActionLog.create({
    data: { customerId, content },
  });

  revalidatePath(`/customers/${customerId}`);
}

export async function toggleChecklistItem(formData: FormData) {
  const checklistItemId = String(formData.get("checklistItemId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  const nextChecked = formData.get("nextChecked") === "true";

  if (!checklistItemId || !customerId) {
    throw new Error("잘못된 요청입니다.");
  }

  await prisma.customerChecklistItem.update({
    where: { id: checklistItemId },
    data: {
      isChecked: nextChecked,
      checkedAt: nextChecked ? new Date() : null,
    },
  });

  revalidatePath(`/customers/${customerId}`);
}
