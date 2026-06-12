import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { kakaoExchangeToken, kakaoGetUser } from "@/lib/kakao";
import { setAccountSession } from "@/lib/accountSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(
      new URL(`/d?login_error=${encodeURIComponent(error)}`, url.origin),
      302,
    );
  }
  if (!code) {
    return Response.redirect(new URL("/d?login_error=no_code", url.origin), 302);
  }

  // state 검증
  const store = await cookies();
  const savedState = store.get("kakao_oauth_state")?.value;
  store.delete("kakao_oauth_state");
  if (!savedState || savedState !== state) {
    return Response.redirect(
      new URL("/d?login_error=bad_state", url.origin),
      302,
    );
  }

  try {
    const token = await kakaoExchangeToken(code);
    const user = await kakaoGetUser(token.access_token);

    // 계정 upsert (kakao_id 기준)
    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from("accounts")
      .select("id")
      .eq("kakao_id", user.kakaoId)
      .maybeSingle();

    let accountId: string;
    if (existing?.id) {
      accountId = existing.id as string;
      await admin
        .from("accounts")
        .update({
          last_login_at: new Date().toISOString(),
          name: user.nickname,
          email: user.email,
        })
        .eq("id", accountId);
    } else {
      const { data: created, error: insErr } = await admin
        .from("accounts")
        .insert({
          kakao_id: user.kakaoId,
          name: user.nickname,
          email: user.email,
          last_login_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (insErr || !created) {
        throw new Error(`account insert failed: ${insErr?.message}`);
      }
      accountId = created.id as string;
    }

    await setAccountSession(accountId);

    // 설계서 직후 들어온 경우, 그 신청을 이 계정에 자동 연결
    const linkCode = store.get("kakao_link_code")?.value;
    store.delete("kakao_link_code");
    if (linkCode) {
      const { data: leadRow } = await admin
        .from("o2o_leads")
        .select("id, account_id")
        .eq("access_code", linkCode)
        .maybeSingle();
      if (leadRow?.id && !leadRow.account_id) {
        await admin
          .from("o2o_leads")
          .update({ account_id: accountId })
          .eq("id", leadRow.id);
      }
    }

    return Response.redirect(new URL("/d/me", url.origin), 302);
  } catch (e) {
    console.error("[kakao callback]", e);
    return Response.redirect(
      new URL("/d?login_error=server", url.origin),
      302,
    );
  }
}
