import "server-only";

/**
 * 카카오 로그인(OAuth 2.0) — 서버 인가코드 플로우.
 * REST API 키 + (자동 활성화된) Client Secret 사용.
 * 환경변수:
 *   KAKAO_REST_API_KEY   — 필수
 *   KAKAO_CLIENT_SECRET  — 콘솔에서 Client Secret '사용함'이면 필수
 *   KAKAO_REDIRECT_URI   — 콘솔에 등록한 값과 정확히 일치해야 함
 */

export function kakaoConfigured(): boolean {
  return !!process.env.KAKAO_REST_API_KEY && !!process.env.KAKAO_REDIRECT_URI;
}

/** 카카오 인가 페이지 URL (여기로 사용자를 보낸다) */
export function kakaoAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: process.env.KAKAO_REDIRECT_URI ?? "",
    response_type: "code",
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

interface KakaoToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

/** 인가코드 → 액세스 토큰 */
export async function kakaoExchangeToken(code: string): Promise<KakaoToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: process.env.KAKAO_REDIRECT_URI ?? "",
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) {
    body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  }
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(
      `kakao token exchange failed: ${res.status} ${JSON.stringify(json)}`,
    );
  }
  return json as KakaoToken;
}

export interface KakaoUser {
  kakaoId: string;
  nickname: string | null;
  email: string | null;
}

/** 액세스 토큰 → 사용자 정보 */
export async function kakaoGetUser(accessToken: string): Promise<KakaoUser> {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok || !json.id) {
    throw new Error(
      `kakao user fetch failed: ${res.status} ${JSON.stringify(json)}`,
    );
  }
  const account = json.kakao_account ?? {};
  const profile = account.profile ?? {};
  return {
    kakaoId: String(json.id),
    nickname: profile.nickname ?? null,
    email: account.email ?? null,
  };
}
