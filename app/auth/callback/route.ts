import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseRoute } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Supabase OAuth 콜백 — 카카오 로그인 후 Supabase가 여기로 보낸다.
 * PKCE code를 세션으로 교환하고, ?link=CODE 가 있으면 그 신청을 계정에 연결.
 *
 * 세션 쿠키는 아래 `response` 객체에 직접 심는다(getSupabaseRoute).
 * raw Response.redirect 로는 Set-Cookie 가 유실돼 로그인이 안 풀린다.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/d/me";
  const linkCode = url.searchParams.get("link");

  if (!code) {
    return NextResponse.redirect(new URL("/d?login_error=no_code", url.origin));
  }

  // 성공 시 돌려보낼 응답을 먼저 만들고, 여기에 세션 쿠키를 심는다.
  const response = NextResponse.redirect(new URL(next, url.origin));
  const supabase = getSupabaseRoute(request, response);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth callback]", error?.message);
    return NextResponse.redirect(new URL("/d?login_error=server", url.origin));
  }

  // 설계서 직후 들어온 경우, 그 신청을 이 계정(auth user)에 자동 연결
  if (linkCode) {
    const admin = getSupabaseAdmin();
    const { data: lead } = await admin
      .from("o2o_leads")
      .select("id, account_id")
      .eq("access_code", linkCode.toUpperCase().slice(0, 12))
      .maybeSingle();
    if (lead?.id && !lead.account_id) {
      await admin
        .from("o2o_leads")
        .update({ account_id: data.user.id })
        .eq("id", lead.id);
    }
  }

  return response;
}
