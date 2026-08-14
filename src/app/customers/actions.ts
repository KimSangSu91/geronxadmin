"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const CUSTOMER_CODE_PREFIX = "C";
const CUSTOMER_CODE_DIGITS = 4;

async function generateNextCustomerCode(): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: { code: { startsWith: CUSTOMER_CODE_PREFIX } },
    select: { code: true },
  });

  const codePattern = new RegExp(`^${CUSTOMER_CODE_PREFIX}(\\d+)$`);
  const maxNumber = customers.reduce((max, { code }) => {
    const match = code.match(codePattern);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `${CUSTOMER_CODE_PREFIX}${String(maxNumber + 1).padStart(CUSTOMER_CODE_DIGITS, "0")}`;
}

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("시설명은 필수입니다.");
  }

  const address = String(formData.get("address") ?? "").trim() || null;
  const code = await generateNextCustomerCode();

  const activeChecklistItems = await prisma.checklistItemMaster.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const customer = await prisma.customer.create({
    data: {
      code,
      name,
      address,
      checklistItems: {
        create: activeChecklistItems.map((item) => ({ itemId: item.id })),
      },
    },
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}
