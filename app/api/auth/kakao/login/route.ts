import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { kakaoAuthorizeUrl, kakaoConfigured } from "@/lib/kakao";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!kakaoConfigured()) {
    return new Response("kakao not configured", { status: 503 });
  }
  // CSRF 방지용 state
  const state = randomBytes(12).toString("hex");
  const store = await cookies();
  store.set("kakao_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return Response.redirect(kakaoAuthorizeUrl(state), 302);
}
