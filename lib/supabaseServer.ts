import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버용 Supabase 클라이언트 — 쿠키 기반 세션.
 * PKCE OAuth 콜백의 exchangeCodeForSession + 로그인 사용자 조회에 사용.
 */
export async function getSupabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            // Server Component에서 set 호출 시 무시 (route/action에서만 가능)
          }
        },
      },
    },
  );
}
