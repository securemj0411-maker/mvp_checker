import "server-only";
import { cookies } from "next/headers";

const COOKIE = "o2o_admin";

/** 로그인 여부 — 쿠키 값이 세션 시크릿과 일치하는지 */
export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === secret;
}

export const ADMIN_COOKIE = COOKIE;
