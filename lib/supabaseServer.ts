import "server-only";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Route Handler 전용 Supabase 클라이언트.
 * 세션 쿠키(Set-Cookie)를 **반환할 응답 객체에 직접** 심는다.
 * raw Response.redirect 는 next/headers 의 cookies().set() 을 싣지 못해
 * 로그인 직후 세션이 유실되므로, OAuth 콜백/로그아웃은 반드시 이 헬퍼를 쓴다.
 */
export function getSupabaseRoute(request: NextRequest, response: NextResponse) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
}

/**
 * 서버용 Supabase 클라이언트 — 쿠키 기반 세션(읽기 위주).
 * Server Component 에서 로그인 사용자 조회에 사용.
 */
export async function getSupabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
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
