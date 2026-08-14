# 제론엑스 내부 자산관리 시스템

고객사(영업/설치 진행) 및 내부 장비(재고/매핑/상태) 관리 시스템.

## 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma 7 (`driverAdapters`, PostgreSQL 드라이버 어댑터 `@prisma/adapter-pg`)
- Supabase (PostgreSQL / Auth / Storage)

## 시작하기

### 1. 환경 변수 설정

`.env.example`을 복사해 `.env`를 만들고, Supabase 프로젝트 값으로 채웁니다.

```bash
cp .env.example .env
```

- `DATABASE_URL`: Supabase Connection Pooling(6543, pgbouncer) URL — 앱 런타임(Prisma Client)이 사용
- `DIRECT_URL`: Supabase Direct Connection(5432) URL — `prisma migrate` 등 마이그레이션 전용
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 브라우저에서 사용하는 공개 값
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용, RLS를 우회하는 관리자 작업에만 사용 (절대 클라이언트에 노출 금지)

Supabase 대시보드 > Project Settings > Database / API 에서 값을 확인할 수 있습니다.

### 2. 의존성 설치 & Prisma 클라이언트 생성

```bash
npm install
```

`postinstall` 스크립트가 자동으로 `prisma generate`를 실행합니다. Prisma Client는
`src/generated/prisma`에 생성되며 저장소에는 커밋하지 않습니다(`.gitignore` 처리됨).

### 3. 스키마를 DB에 반영

```bash
npm run db:migrate   # 로컬/개발 — 마이그레이션 파일 생성 + 적용
# 또는
npm run db:push      # 마이그레이션 이력 없이 스키마만 즉시 동기화 (초기 프로토타이핑용)

npm run db:seed      # 장비구분(늘밴드/늘허브/8구차저), 체크리스트 항목 마스터 데이터 삽입
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## 주요 스크립트

| 명령어              | 설명                                  |
| -------------------- | ------------------------------------- |
| `npm run dev`         | 개발 서버 (Turbopack)                 |
| `npm run build`       | 프로덕션 빌드                          |
| `npm run lint`        | ESLint                                |
| `npm run db:migrate`  | Prisma 마이그레이션 생성 + 적용        |
| `npm run db:push`     | 마이그레이션 없이 스키마 동기화        |
| `npm run db:seed`     | 마스터 데이터(장비구분, 체크리스트) 삽입 |
| `npm run db:studio`   | Prisma Studio (DB GUI)                |

## 폴더 구조

```
prisma/
  schema.prisma         # 데이터 모델 (고객사 도메인 + 장비 도메인)
src/
  app/
    layout.tsx           # 루트 레이아웃 (상단 네비게이션 포함)
    page.tsx              # 대시보드
    customers/            # 고객사 관리 라우트
    devices/               # 내부장비 관리 라우트
  components/
    ui/                    # shadcn/ui 컴포넌트
    layout/                # 공통 레이아웃 컴포넌트 (네비게이션 등)
  lib/
    prisma.ts               # Prisma Client 싱글턴 (driver adapter)
    supabase/
      client.ts              # 브라우저용 Supabase 클라이언트
      server.ts               # 서버 컴포넌트/서버 액션용 Supabase 클라이언트
      proxy.ts                 # 세션 갱신 헬퍼 (src/proxy.ts에서 호출)
  proxy.ts                     # Next.js Proxy (구 middleware) — Supabase 세션 갱신
  generated/prisma/             # Prisma Client 생성 결과물 (git-ignored)
```

> **참고**: 이 프로젝트는 Next.js 16을 사용합니다. `middleware.ts`가 `proxy.ts`로 이름이
> 바뀌었고, Prisma 7부터는 `schema.prisma`가 아닌 `PrismaClient` 생성자에 driver adapter
> (`@prisma/adapter-pg`)로 커넥션을 주입합니다. 자세한 내용은 각 파일의 주석을 참고하세요.

## 다음 단계

이번 단계에서는 프로젝트 초기 세팅과 스키마 설계까지 진행했습니다. 고객사 리스트/상세,
장비 리스트/상세(사이드시트), 대시보드 집계, 엑셀 내보내기 등 화면 구현은 다음 단계에서
진행합니다.
