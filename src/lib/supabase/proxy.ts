import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// src/proxy.ts에서 호출하는 세션 갱신 헬퍼.
// Supabase Auth 세션 쿠키를 매 요청마다 갱신합니다.
//
// TODO: 로그인 화면(app/login)을 만들 때, 미인증 사용자를 /login으로 리다이렉트하는
// 로직을 여기에 추가하세요 (참고: https://supabase.com/docs/guides/auth/server-side/nextjs).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 세션 쿠키를 최신 상태로 유지하기 위해 반드시 호출해야 합니다.
  await supabase.auth.getUser();

  return supabaseResponse;
}
