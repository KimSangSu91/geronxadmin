import { createClient } from "@supabase/supabase-js";

// 서버 전용 관리자 클라이언트 — RLS를 우회하므로 절대 클라이언트 번들에 포함하지 마세요.
// Storage 업로드/서명 URL 발급처럼 서비스 롤 권한이 필요한 서버 액션에서만 사용합니다.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
