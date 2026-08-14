"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DeviceStatus } from "@/generated/prisma/client";
import { DEVICE_STATUS_LABEL } from "@/lib/device-status";

export async function createDevice(formData: FormData) {
  const deviceTypeId = String(formData.get("deviceTypeId") ?? "");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const deviceUid = String(formData.get("deviceUid") ?? "").trim();
  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null;
  const receivedDateRaw = String(formData.get("receivedDate") ?? "");
  const registeredDateRaw = String(formData.get("registeredDate") ?? "");

  if (!deviceTypeId || !deviceName || !deviceUid) {
    throw new Error("디바이스구분, 디바이스명, 디바이스아이디는 필수입니다.");
  }

  await prisma.device.create({
    data: {
      deviceTypeId,
      deviceName,
      deviceUid,
      serialNumber,
      receivedDate: receivedDateRaw ? new Date(receivedDateRaw) : null,
      registeredDate: registeredDateRaw ? new Date(registeredDateRaw) : null,
    },
  });

  revalidatePath("/devices");
}

export async function bulkMapDevices(formData: FormData) {
  const deviceIds = formData.getAll("deviceIds").map(String);
  const customerId = String(formData.get("customerId") ?? "");

  if (deviceIds.length === 0 || !customerId) {
    throw new Error("잘못된 요청입니다.");
  }

  const devices = await prisma.device.findMany({
    where: { id: { in: deviceIds }, status: DeviceStatus.IN_STOCK },
    select: { id: true, status: true },
  });

  await prisma.$transaction(
    devices.flatMap((device) => [
      prisma.deviceMapping.create({
        data: { deviceId: device.id, customerId },
      }),
      prisma.device.update({
        where: { id: device.id },
        data: { status: DeviceStatus.MAPPING },
      }),
      prisma.deviceStatusLog.create({
        data: {
          deviceId: device.id,
          fromStatus: device.status,
          toStatus: DeviceStatus.MAPPING,
        },
      }),
    ]),
  );

  revalidatePath("/devices");
  revalidatePath(`/customers/${customerId}`);
}

export async function bulkUnmapDevices(formData: FormData) {
  const deviceIds = formData.getAll("deviceIds").map(String);
  if (deviceIds.length === 0) throw new Error("잘못된 요청입니다.");

  const devices = await prisma.device.findMany({
    where: { id: { in: deviceIds }, status: DeviceStatus.MAPPING },
    select: { id: true, status: true },
  });

  const affectedCustomerIds = (
    await prisma.deviceMapping.findMany({
      where: { deviceId: { in: devices.map((d) => d.id) }, unmappedAt: null },
      select: { customerId: true },
      distinct: ["customerId"],
    })
  ).map((m) => m.customerId);

  await prisma.$transaction(
    devices.flatMap((device) => [
      prisma.deviceMapping.updateMany({
        where: { deviceId: device.id, unmappedAt: null },
        data: { unmappedAt: new Date() },
      }),
      prisma.device.update({
        where: { id: device.id },
        data: { status: DeviceStatus.RETURN_PENDING },
      }),
      prisma.deviceStatusLog.create({
        data: {
          deviceId: device.id,
          fromStatus: device.status,
          toStatus: DeviceStatus.RETURN_PENDING,
        },
      }),
    ]),
  );

  revalidatePath("/devices");
  affectedCustomerIds.forEach((id) => revalidatePath(`/customers/${id}`));
}

export async function changeDeviceStatus(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const toStatus = String(formData.get("status") ?? "") as DeviceStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!deviceId || !Object.values(DeviceStatus).includes(toStatus)) {
    throw new Error("잘못된 요청입니다.");
  }

  const device = await prisma.device.findUniqueOrThrow({
    where: { id: deviceId },
    select: { status: true },
  });

  await prisma.$transaction([
    prisma.device.update({ where: { id: deviceId }, data: { status: toStatus } }),
    prisma.deviceStatusLog.create({
      data: { deviceId, fromStatus: device.status, toStatus, note },
    }),
  ]);

  revalidatePath("/devices");
}

export async function addSanitization(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const result = String(formData.get("result") ?? "").trim() || null;
  if (!deviceId) throw new Error("잘못된 요청입니다.");

  await prisma.deviceSanitization.create({ data: { deviceId, result } });

  revalidatePath("/devices");
}

export async function addAsHistory(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const issueDescription = String(formData.get("issueDescription") ?? "").trim();
  if (!deviceId || !issueDescription) {
    throw new Error("문제 내용을 입력해주세요.");
  }

  await prisma.deviceAsHistory.create({ data: { deviceId, issueDescription } });

  revalidatePath("/devices");
}

export async function resolveAsHistory(formData: FormData) {
  const asHistoryId = String(formData.get("asHistoryId") ?? "");
  const resolution = String(formData.get("resolution") ?? "").trim() || null;
  if (!asHistoryId) throw new Error("잘못된 요청입니다.");

  await prisma.deviceAsHistory.update({
    where: { id: asHistoryId },
    data: { resolvedAt: new Date(), resolution },
  });

  revalidatePath("/devices");
}

export type DeviceTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description?: string;
};

export type DeviceDetail = {
  id: string;
  deviceName: string;
  deviceUid: string;
  serialNumber: string | null;
  deviceTypeName: string;
  status: DeviceStatus;
  receivedDate: string | null;
  registeredDate: string | null;
  currentCustomerName: string | null;
  activeAsIssue: { id: string; issueDescription: string } | null;
  timeline: DeviceTimelineEntry[];
};

export async function getDeviceDetail(
  deviceId: string,
): Promise<DeviceDetail | null> {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      deviceType: true,
      mappings: { include: { customer: true }, orderBy: { mappedAt: "desc" } },
      statusLogs: {
        include: { changedByStaff: true },
        orderBy: { changedAt: "desc" },
      },
      sanitizations: { orderBy: { sanitizedAt: "desc" } },
      asHistories: { orderBy: { reportedAt: "desc" } },
    },
  });

  if (!device) return null;

  const timeline: DeviceTimelineEntry[] = [];

  for (const mapping of device.mappings) {
    timeline.push({
      id: `${mapping.id}-mapped`,
      date: mapping.mappedAt.toISOString(),
      title: `매핑됨 — ${mapping.customer.name}`,
    });
    if (mapping.unmappedAt) {
      timeline.push({
        id: `${mapping.id}-unmapped`,
        date: mapping.unmappedAt.toISOString(),
        title: `매핑 해제 — ${mapping.customer.name}`,
      });
    }
  }

  for (const log of device.statusLogs) {
    timeline.push({
      id: log.id,
      date: log.changedAt.toISOString(),
      title: `상태 변경 — ${
        log.fromStatus ? DEVICE_STATUS_LABEL[log.fromStatus] : "등록"
      } → ${DEVICE_STATUS_LABEL[log.toStatus]}`,
      description: log.note ?? undefined,
    });
  }

  for (const s of device.sanitizations) {
    timeline.push({
      id: s.id,
      date: s.sanitizedAt.toISOString(),
      title: "소독 완료",
      description: s.result ?? undefined,
    });
  }

  for (const as of device.asHistories) {
    timeline.push({
      id: `${as.id}-reported`,
      date: as.reportedAt.toISOString(),
      title: `AS 접수 — ${as.issueDescription}`,
    });
    if (as.resolvedAt) {
      timeline.push({
        id: `${as.id}-resolved`,
        date: as.resolvedAt.toISOString(),
        title: "AS 완료",
        description: as.resolution ?? undefined,
      });
    }
  }

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeMapping = device.mappings.find((m) => !m.unmappedAt);
  const unresolvedAs = device.asHistories.find((a) => !a.resolvedAt);

  return {
    id: device.id,
    deviceName: device.deviceName,
    deviceUid: device.deviceUid,
    serialNumber: device.serialNumber,
    deviceTypeName: device.deviceType.name,
    status: device.status,
    receivedDate: device.receivedDate ? device.receivedDate.toISOString() : null,
    registeredDate: device.registeredDate
      ? device.registeredDate.toISOString()
      : null,
    currentCustomerName: activeMapping?.customer.name ?? null,
    activeAsIssue: unresolvedAs
      ? { id: unresolvedAs.id, issueDescription: unresolvedAs.issueDescription }
      : null,
    timeline,
  };
}
