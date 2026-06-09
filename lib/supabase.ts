import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!url || !key) {
  // 빌드 시점에 환경변수가 없으면 빌드는 통과시키되 런타임에 명확히 실패
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

export const supabase = createClient(url, key);
