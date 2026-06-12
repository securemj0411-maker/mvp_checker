"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 브라우저용 Supabase 클라이언트 (Auth OAuth + 세션 쿠키). @supabase/ssr */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
