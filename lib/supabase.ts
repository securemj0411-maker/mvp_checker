import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Lazy 초기화 — 모듈 import 시점이 아니라 *처음 호출 시*에 client 생성.
 * 환경변수가 빠진 빌드에서 페이지 자체가 깨지는 걸 방지.
 * (NEXT_PUBLIC_* 는 빌드 타임에 string 으로 inline 됨 — Vercel 에 박혀 있어야 함)
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase] Missing env vars — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Vercel → Settings → Environment Variables)",
    );
  }

  _client = createClient(url, key);
  return _client;
}
