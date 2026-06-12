import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseRoute } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 세션 쿠키 삭제(Set-Cookie)를 이 응답에 직접 실어야 실제로 로그아웃된다.
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  const supabase = getSupabaseRoute(request, response);
  await supabase.auth.signOut();
  return response;
}
