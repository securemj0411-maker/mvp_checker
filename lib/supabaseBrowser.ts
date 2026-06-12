"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 브라우저용 Supabase 클라이언트 (Auth OAuth + 세션 쿠키). @supabase/ssr
 *  detectSessionInUrl=false: /auth/callback 에서 우리가 명시적으로
 *  exchangeCodeForSession 을 호출하므로, 자동 교환과 경쟁하지 않게 끈다. */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { detectSessionInUrl: false, flowType: "pkce" } },
  );
}
