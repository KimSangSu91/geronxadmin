import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          고객사 진행 현황과 장비 재고 현황을 한눈에 확인하세요.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/customers">
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle>고객사 관리</CardTitle>
              <CardDescription>
                영업/설치 진행 상태, 체크리스트, 계약 문서를 관리합니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/devices">
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle>내부장비 관리</CardTitle>
              <CardDescription>
                늘밴드, 늘허브, 8구차저 등 하드웨어 재고와 매핑 이력을 관리합니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
