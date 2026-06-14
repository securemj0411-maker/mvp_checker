import "server-only";
import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "o2o_admin";

/** 타이밍 안전 문자열 비교 (길이 다르면 즉시 false) */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** 로그인 여부 — 쿠키 값이 세션 시크릿과 일치하는지 */
export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const val = store.get(COOKIE)?.value;
  return !!val && safeEqual(val, secret);
}

export const ADMIN_COOKIE = COOKIE;
