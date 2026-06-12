import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { kakaoAuthorizeUrl, kakaoConfigured } from "@/lib/kakao";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!kakaoConfigured()) {
    return new Response("kakao not configured", { status: 503 });
  }
  // CSRF 방지용 state
  const state = randomBytes(12).toString("hex");
  const store = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  store.set("kakao_oauth_state", state, cookieOpts);

  // 설계서 직후 진입이면 그 신청 코드를 로그인 후 자동 연결
  const link = request.nextUrl.searchParams.get("link");
  if (link) {
    store.set("kakao_link_code", link.toUpperCase().slice(0, 12), cookieOpts);
  }
  return Response.redirect(kakaoAuthorizeUrl(state), 302);
}
