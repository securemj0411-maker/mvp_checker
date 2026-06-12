import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * 고객 계정 세션 — admin 세션과 완전히 별개.
 * 쿠키 값 = "<accountId>.<hmac(accountId)>" 로 위조 방지.
 */

const COOKIE = "o2o_account";

function sign(accountId: string): string {
  const secret = process.env.ACCOUNT_SESSION_SECRET ?? "";
  return createHmac("sha256", secret).update(accountId).digest("hex");
}

export async function setAccountSession(accountId: string) {
  const store = await cookies();
  store.set(COOKIE, `${accountId}.${sign(accountId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

export async function getAccountId(): Promise<string | null> {
  if (!process.env.ACCOUNT_SESSION_SECRET) return null;
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const id = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expected = sign(id);
  try {
    if (
      mac.length === expected.length &&
      timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
    ) {
      return id;
    }
  } catch {
    /* length mismatch */
  }
  return null;
}

export async function clearAccountSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
