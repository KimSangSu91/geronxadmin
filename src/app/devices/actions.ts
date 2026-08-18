"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DeviceStatus, type Prisma } from "@/generated/prisma/client";
import {
  DEVICE_STATUS_LABEL,
  DEVICE_STATUSES_REQUIRING_UNMAP,
  DEVICE_STATUSES_ELIGIBLE_FOR_MAPPING,
} from "@/lib/device-status";

export async function createDevice(formData: FormData) {
  const deviceTypeId = String(formData.get("deviceTypeId") ?? "");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const deviceUid = String(formData.get("deviceUid") ?? "").trim();
  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null;
  const manufacturingNumber =
    String(formData.get("manufacturingNumber") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
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
      manufacturingNumber,
      description,
      receivedDate: receivedDateRaw ? new Date(receivedDateRaw) : null,
      registeredDate: registeredDateRaw ? new Date(registeredDateRaw) : null,
    },
  });

  revalidatePath("/devices");
}

export async function updateDevice(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const deviceTypeId = String(formData.get("deviceTypeId") ?? "");
  const deviceName = String(formData.get("deviceName") ?? "").trim();
  const deviceUid = String(formData.get("deviceUid") ?? "").trim();
  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null;
  const manufacturingNumber =
    String(formData.get("manufacturingNumber") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const receivedDateRaw = String(formData.get("receivedDate") ?? "");
  const registeredDateRaw = String(formData.get("registeredDate") ?? "");

  if (!deviceId || !deviceTypeId || !deviceName || !deviceUid) {
    throw new Error("디바이스구분, 디바이스명, 디바이스아이디는 필수입니다.");
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: {
      deviceTypeId,
      deviceName,
      deviceUid,
      serialNumber,
      manufacturingNumber,
      description,
      receivedDate: receivedDateRaw ? new Date(receivedDateRaw) : null,
      registeredDate: registeredDateRaw ? new Date(registeredDateRaw) : null,
    },
  });

  revalidatePath("/devices");
  revalidatePath(`/devices/${deviceId}`);
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
  devices.forEach((d) => revalidatePath(`/devices/${d.id}`));
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
  devices.forEach((d) => revalidatePath(`/devices/${d.id}`));
  affectedCustomerIds.forEach((id) => revalidatePath(`/customers/${id}`));
}

export type MappingConflict = {
  deviceId: string;
  deviceLabel: string;
  currentCustomerName: string;
};

// 매핑 실행 전 사전 확인 — 선택한 장비 중 "다른" 고객사에 이미 매핑된 것이 있는지 조회
export async function checkDeviceMappingConflicts(
  deviceIds: string[],
  targetCustomerId: string,
): Promise<MappingConflict[]> {
  if (deviceIds.length === 0) return [];

  const activeMappings = await prisma.deviceMapping.findMany({
    where: {
      deviceId: { in: deviceIds },
      unmappedAt: null,
      NOT: { customerId: targetCustomerId },
    },
    include: {
      device: { include: { deviceType: true } },
      customer: true,
    },
  });

  return activeMappings.map((m) => ({
    deviceId: m.deviceId,
    deviceLabel: `${m.device.deviceType.name} · ${m.device.deviceName} (${m.device.deviceUid})`,
    currentCustomerName: m.customer.name,
  }));
}

// 장비 리스트 화면의 "장비 매핑하기" 흐름 전용 — 재고 장비는 새로 매핑하고,
// 이미 다른 고객사에 매핑된 장비는(사용자가 변경을 확인한 뒤) 기존 매핑을 해제하고 재매핑한다.
export async function mapDevicesToCustomer(
  formData: FormData,
): Promise<{ mappedCount: number }> {
  const deviceIds = formData.getAll("deviceIds").map(String);
  const customerId = String(formData.get("customerId") ?? "");

  if (deviceIds.length === 0 || !customerId) {
    throw new Error("잘못된 요청입니다.");
  }

  const devices = await prisma.device.findMany({
    where: {
      id: { in: deviceIds },
      status: { in: DEVICE_STATUSES_ELIGIBLE_FOR_MAPPING },
    },
    include: { mappings: { where: { unmappedAt: null } } },
  });

  const operations: Prisma.PrismaPromise<unknown>[] = [];
  const affectedCustomerIds = new Set<string>([customerId]);
  let mappedCount = 0;

  for (const device of devices) {
    const activeMapping = device.mappings[0];
    if (activeMapping && activeMapping.customerId === customerId) {
      continue; // 이미 동일 고객사에 매핑되어 있어 변경 없음
    }

    if (activeMapping) {
      operations.push(
        prisma.deviceMapping.update({
          where: { id: activeMapping.id },
          data: { unmappedAt: new Date() },
        }),
      );
      affectedCustomerIds.add(activeMapping.customerId);
    }

    operations.push(
      prisma.deviceMapping.create({ data: { deviceId: device.id, customerId } }),
    );

    if (device.status !== DeviceStatus.MAPPING) {
      operations.push(
        prisma.device.update({
          where: { id: device.id },
          data: { status: DeviceStatus.MAPPING },
        }),
      );
    }

    operations.push(
      prisma.deviceStatusLog.create({
        data: {
          deviceId: device.id,
          fromStatus: device.status,
          toStatus: DeviceStatus.MAPPING,
          note: activeMapping ? "고객사 재매핑" : null,
        },
      }),
    );

    mappedCount += 1;
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  revalidatePath("/devices");
  devices.forEach((d) => revalidatePath(`/devices/${d.id}`));
  affectedCustomerIds.forEach((id) => revalidatePath(`/customers/${id}`));

  return { mappedCount };
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
    select: {
      status: true,
      mappings: { where: { unmappedAt: null }, select: { id: true, customerId: true } },
    },
  });

  const activeMapping = device.mappings[0];
  // 재고/회수완료/폐기 상태의 장비는 고객사에 매핑된 채로 존재할 수 없다 — 자동으로 매핑 해제
  const shouldAutoUnmap =
    DEVICE_STATUSES_REQUIRING_UNMAP.includes(toStatus) && Boolean(activeMapping);

  await prisma.$transaction([
    prisma.device.update({ where: { id: deviceId }, data: { status: toStatus } }),
    prisma.deviceStatusLog.create({
      data: {
        deviceId,
        fromStatus: device.status,
        toStatus,
        note: shouldAutoUnmap
          ? [note, "상태 변경으로 고객사 매핑 자동 해제"].filter(Boolean).join(" / ")
          : note,
      },
    }),
    ...(shouldAutoUnmap
      ? [
          prisma.deviceMapping.update({
            where: { id: activeMapping!.id },
            data: { unmappedAt: new Date() },
          }),
        ]
      : []),
  ]);

  revalidatePath("/devices");
  revalidatePath(`/devices/${deviceId}`);
  if (shouldAutoUnmap && activeMapping) {
    revalidatePath(`/customers/${activeMapping.customerId}`);
  }
}

export async function addSanitization(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const result = String(formData.get("result") ?? "").trim() || null;
  if (!deviceId) throw new Error("잘못된 요청입니다.");

  await prisma.deviceSanitization.create({ data: { deviceId, result } });

  revalidatePath("/devices");
  revalidatePath(`/devices/${deviceId}`);
}

export async function addAsHistory(formData: FormData) {
  const deviceId = String(formData.get("deviceId") ?? "");
  const issueDescription = String(formData.get("issueDescription") ?? "").trim();
  if (!deviceId || !issueDescription) {
    throw new Error("문제 내용을 입력해주세요.");
  }

  await prisma.deviceAsHistory.create({ data: { deviceId, issueDescription } });

  revalidatePath("/devices");
  revalidatePath(`/devices/${deviceId}`);
}

export async function resolveAsHistory(formData: FormData) {
  const asHistoryId = String(formData.get("asHistoryId") ?? "");
  const resolution = String(formData.get("resolution") ?? "").trim() || null;
  if (!asHistoryId) throw new Error("잘못된 요청입니다.");

  const asHistory = await prisma.deviceAsHistory.update({
    where: { id: asHistoryId },
    data: { resolvedAt: new Date(), resolution },
  });

  revalidatePath("/devices");
  revalidatePath(`/devices/${asHistory.deviceId}`);
}

export type DeviceTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description?: string;
};

export type DeviceDetail = {
  id: string;
  deviceTypeId: string;
  deviceName: string;
  deviceUid: string;
  serialNumber: string | null;
  manufacturingNumber: string | null;
  description: string | null;
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
    deviceTypeId: device.deviceTypeId,
    deviceName: device.deviceName,
    deviceUid: device.deviceUid,
    serialNumber: device.serialNumber,
    manufacturingNumber: device.manufacturingNumber,
    description: device.description,
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

export type DeviceImportRowError = {
  row: number;
  messages: string[];
};

export type DeviceImportResult =
  | { success: true; insertedCount: number }
  | { success: false; errors: DeviceImportRowError[] };

// 엑셀 셀 값을 문자열로 정규화 (하이퍼링크/리치텍스트 객체, 숫자 등 모두 텍스트로 변환)
function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

// Excel(.xlsx) A~F열 일괄 등록 — 디바이스구분/디바이스명/디바이스아이디/시리얼/제조번호/설명
// 한 행이라도 검증에 실패하면 아무것도 등록하지 않는다 (전체 성공 또는 전체 실패)
export async function bulkImportDevices(
  formData: FormData,
): Promise<DeviceImportResult> {
  // 파싱/검증/DB 등록 중 예상치 못한 오류(파일 손상 등)도 화면에서 원인을 확인할 수
  // 있도록 절대 그대로 throw하지 않고 항상 결과 형태로 반환한다. revalidatePath는
  // DB 등록이 성공한 뒤에만 별도로 호출해 — 여기서 문제가 생겨도 이미 커밋된
  // 등록 성공 결과 자체는 그대로 사용자에게 전달되도록 분리한다.
  const result = await runBulkImportDevices(formData).catch(
    (e): DeviceImportResult => {
      const message =
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      return { success: false, errors: [{ row: 0, messages: [message] }] };
    },
  );

  if (result.success) {
    revalidatePath("/devices");
  }

  return result;
}

async function runBulkImportDevices(
  formData: FormData,
): Promise<DeviceImportResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, errors: [{ row: 0, messages: ["파일을 선택해주세요."] }] };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      success: false,
      errors: [{ row: 0, messages: [".xlsx 파일만 업로드할 수 있습니다."] }],
    };
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return {
      success: false,
      errors: [
        { row: 0, messages: ["엑셀 파일을 읽을 수 없습니다. 파일 형식을 확인해주세요."] },
      ],
    };
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { success: false, errors: [{ row: 0, messages: ["시트를 찾을 수 없습니다."] }] };
  }

  const [deviceTypes, existingDevices] = await Promise.all([
    prisma.deviceTypeMaster.findMany({ select: { id: true, name: true } }),
    prisma.device.findMany({ select: { deviceUid: true, serialNumber: true } }),
  ]);
  const typeByName = new Map(deviceTypes.map((t) => [t.name.trim(), t.id]));
  const existingUids = new Set(existingDevices.map((d) => d.deviceUid));
  const existingSerials = new Set(
    existingDevices
      .map((d) => d.serialNumber)
      .filter((s): s is string => Boolean(s)),
  );

  type ParsedRow = {
    deviceTypeId: string;
    deviceName: string;
    deviceUid: string;
    serialNumber: string | null;
    manufacturingNumber: string | null;
    description: string | null;
  };

  const parsedRows: ParsedRow[] = [];
  const errors: DeviceImportRowError[] = [];
  const seenUidsInFile = new Map<string, number>();
  const seenSerialsInFile = new Map<string, number>();

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // 1행은 헤더로 간주하고 건너뜀

    const typeNameRaw = cellToText(row.getCell(1).value);
    const deviceName = cellToText(row.getCell(2).value);
    const deviceUid = cellToText(row.getCell(3).value);
    const serialNumber = cellToText(row.getCell(4).value) || null;
    const manufacturingNumber = cellToText(row.getCell(5).value) || null;
    const description = cellToText(row.getCell(6).value) || null;

    const isEmptyRow =
      !typeNameRaw &&
      !deviceName &&
      !deviceUid &&
      !serialNumber &&
      !manufacturingNumber &&
      !description;
    if (isEmptyRow) return;

    const rowMessages: string[] = [];
    if (!typeNameRaw) rowMessages.push("디바이스 구분이 비어 있습니다.");
    if (!deviceName) rowMessages.push("디바이스명이 비어 있습니다.");
    if (!deviceUid) rowMessages.push("디바이스아이디가 비어 있습니다.");

    const deviceTypeId = typeNameRaw ? typeByName.get(typeNameRaw) : undefined;
    if (typeNameRaw && !deviceTypeId) {
      rowMessages.push(`알 수 없는 디바이스 구분입니다: "${typeNameRaw}"`);
    }

    if (deviceUid) {
      if (existingUids.has(deviceUid)) {
        rowMessages.push(`이미 등록된 디바이스아이디입니다: ${deviceUid}`);
      }
      if (seenUidsInFile.has(deviceUid)) {
        rowMessages.push(
          `파일 내에서 디바이스아이디가 중복됩니다: ${deviceUid} (${seenUidsInFile.get(deviceUid)}행과 중복)`,
        );
      } else {
        seenUidsInFile.set(deviceUid, rowNumber);
      }
    }

    if (serialNumber) {
      if (existingSerials.has(serialNumber)) {
        rowMessages.push(`이미 등록된 시리얼번호입니다: ${serialNumber}`);
      }
      if (seenSerialsInFile.has(serialNumber)) {
        rowMessages.push(
          `파일 내에서 시리얼번호가 중복됩니다: ${serialNumber} (${seenSerialsInFile.get(serialNumber)}행과 중복)`,
        );
      } else {
        seenSerialsInFile.set(serialNumber, rowNumber);
      }
    }

    if (rowMessages.length > 0) {
      errors.push({ row: rowNumber, messages: rowMessages });
      return;
    }

    parsedRows.push({
      deviceTypeId: deviceTypeId!,
      deviceName,
      deviceUid,
      serialNumber,
      manufacturingNumber,
      description,
    });
  });

  if (parsedRows.length === 0 && errors.length === 0) {
    return {
      success: false,
      errors: [{ row: 0, messages: ["등록할 데이터가 없습니다."] }],
    };
  }

  if (errors.length > 0) {
    return { success: false, errors: errors.sort((a, b) => a.row - b.row) };
  }

  await prisma.device.createMany({
    data: parsedRows.map((r) => ({
      deviceTypeId: r.deviceTypeId,
      deviceName: r.deviceName,
      deviceUid: r.deviceUid,
      serialNumber: r.serialNumber,
      manufacturingNumber: r.manufacturingNumber,
      description: r.description,
    })),
  });

  return { success: true, insertedCount: parsedRows.length };
}
