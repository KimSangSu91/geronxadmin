"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createCustomer(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!code || !name) {
    throw new Error("고객사코드와 시설명은 필수입니다.");
  }

  const address = String(formData.get("address") ?? "").trim() || null;
  const contactName = String(formData.get("contactName") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;
  const facilityScale = String(formData.get("facilityScale") ?? "").trim() || null;
  const assignedStaffId = String(formData.get("assignedStaffId") ?? "") || null;
  const contractedDeviceCount = Number(formData.get("contractedDeviceCount") ?? 0) || 0;

  const activeChecklistItems = await prisma.checklistItemMaster.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const customer = await prisma.customer.create({
    data: {
      code,
      name,
      address,
      contactName,
      contactPhone,
      facilityScale,
      assignedStaffId,
      contractedDeviceCount,
      checklistItems: {
        create: activeChecklistItems.map((item) => ({ itemId: item.id })),
      },
    },
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}
