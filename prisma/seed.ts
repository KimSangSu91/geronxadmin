import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEVICE_TYPES = ["늘밴드", "늘허브", "8구충전기"];

const CHECKLIST_ITEMS = [
  "계약서/인수증 업로드",
  "입소자정보",
  "시설정보",
  "조감도정보",
  "조감도 그리기",
  "개인정보 동의",
  "내부테스트",
  "매핑",
  "계정생성",
  "밴드 라벨링",
];

async function main() {
  for (const name of DEVICE_TYPES) {
    await prisma.deviceTypeMaster.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const [index, name] of CHECKLIST_ITEMS.entries()) {
    await prisma.checklistItemMaster.upsert({
      where: { name },
      update: { sortOrder: index },
      create: { name, sortOrder: index },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
