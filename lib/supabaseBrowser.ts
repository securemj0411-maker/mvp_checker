"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 브라우저용 Supabase 클라이언트 (Auth OAuth + 세션 쿠키). @supabase/ssr
 *  - detectSessionInUrl=false: /auth/callback 에서 우리가 명시적으로
 *    exchangeCodeForSession 을 호출하므로 자동 교환과 경쟁하지 않게 끈다.
 *  - lock=no-op: supabase-js 기본 navigator.locks 락은 다른 탭/멈춘
 *    세션이 락을 안 놓으면 signInWithOAuth 가 영원히 대기(버튼 "이동 중..."
 *    무한)한다. 우리 플로우는 동시성이 없으니 락을 무력화해 데드락을 없앤다. */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        detectSessionInUrl: false,
        flowType: "pkce",
        lock: (_name, _acquireTimeout, fn) => fn(),
      },
    },
  );
}
