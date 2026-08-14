"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerStatus, DocumentType } from "@/generated/prisma/client";

const CUSTOMER_DOCUMENT_BUCKET = "customer-documents";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function updateCustomerStatus(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const status = String(formData.get("status") ?? "") as CustomerStatus;
  // COMPLETED(서비스 이용중)로 전환할 때만 함께 전달됨 — 값이 없으면 필드를 건드리지 않음
  const remainingUsagePeriod = formData.get("remainingUsagePeriod");

  if (!customerId || !Object.values(CustomerStatus).includes(status)) {
    throw new Error("잘못된 요청입니다.");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      status,
      ...(remainingUsagePeriod !== null
        ? { remainingUsagePeriod: String(remainingUsagePeriod).trim() || null }
        : {}),
    },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}

export async function updateCustomerInfo(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!customerId || !code || !name) {
    throw new Error("고객사코드와 시설명은 필수입니다.");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      code,
      name,
      address: optionalString(formData, "address"),
      contactName: optionalString(formData, "contactName"),
      contactPhone: optionalString(formData, "contactPhone"),
      contactEmail: optionalString(formData, "contactEmail"),
      contactDepartment: optionalString(formData, "contactDepartment"),
      facilityScale: optionalString(formData, "facilityScale"),
      assignedStaffId: optionalString(formData, "assignedStaffId"),
      contractedDeviceCount:
        Number(formData.get("contractedDeviceCount") ?? 0) || 0,
      businessRegistrationNumber: optionalString(
        formData,
        "businessRegistrationNumber",
      ),
      corporateRegistrationNumber: optionalString(
        formData,
        "corporateRegistrationNumber",
      ),
      representativeEmail: optionalString(formData, "representativeEmail"),
      taxInvoiceEmail: optionalString(formData, "taxInvoiceEmail"),
      domainKey: optionalString(formData, "domainKey"),
      remainingUsagePeriod: optionalString(formData, "remainingUsagePeriod"),
    },
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

// 계약서/인수증 등 최종본 업로드 — PDF만 허용, 업로드 성공 시 문서 레코드를 FINALIZED로 등록
export async function uploadCustomerDocument(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const docType = String(formData.get("docType") ?? "") as DocumentType;
  const file = formData.get("file");

  if (!customerId || !Object.values(DocumentType).includes(docType)) {
    throw new Error("잘못된 요청입니다.");
  }
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("파일을 선택해주세요.");
  }
  if (file.type !== "application/pdf") {
    throw new Error("PDF 파일만 업로드할 수 있습니다.");
  }

  const path = `${customerId}/${docType}-${Date.now()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(CUSTOMER_DOCUMENT_BUCKET)
    .upload(path, buffer, { contentType: "application/pdf" });

  if (error) {
    throw new Error(`업로드에 실패했습니다: ${error.message}`);
  }

  await prisma.customerDocument.create({
    data: {
      customerId,
      docType,
      finalFileUrl: path,
      status: "FINALIZED",
    },
  });

  revalidatePath(`/customers/${customerId}`);
}

// Storage private 버킷이므로 조회 시마다 만료되는 서명 URL을 새로 발급
export async function getDocumentSignedUrl(
  documentId: string,
): Promise<string | null> {
  const doc = await prisma.customerDocument.findUnique({
    where: { id: documentId },
  });
  if (!doc?.finalFileUrl) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(CUSTOMER_DOCUMENT_BUCKET)
    .createSignedUrl(doc.finalFileUrl, 60 * 10);

  if (error) return null;
  return data.signedUrl;
}
