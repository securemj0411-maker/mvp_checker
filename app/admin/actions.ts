"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "./auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret || password !== expected) {
    redirect("/admin?e=1");
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14일
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}

const ALLOWED_STATUSES = [
  "new",
  "contacted",
  "consulted",
  "paid",
  "build",
  "live",
  "verdict",
  "won",
  "lost",
] as const;

export async function updateLead(formData: FormData) {
  const { isAdmin } = await import("./auth");
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const memo = String(formData.get("memo") ?? "").slice(0, 2000);
  if (!id || !ALLOWED_STATUSES.includes(status as never)) redirect("/admin");

  // 구글애즈 실측 수동 입력 (선택). 비우면 ad_stats 미변경.
  const numOrNull = (k: string) => {
    const raw = String(formData.get(k) ?? "").trim();
    if (raw === "") return null;
    const n = Number(raw.replace(/[, ]/g, ""));
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  };
  const imp = numOrNull("ad_impressions");
  const clk = numOrNull("ad_clicks");
  const vis = numOrNull("ad_visits");
  const conv = numOrNull("ad_conversions");
  const spend = numOrNull("ad_spend");
  const hasAdInput =
    formData.has("ad_impressions") ||
    formData.has("ad_clicks") ||
    formData.has("ad_visits") ||
    formData.has("ad_conversions") ||
    formData.has("ad_spend");

  const update: Record<string, unknown> = { status, memo: memo || null };

  // 검증 사이트 게시 토글 (체크 시 광고 노출, 해제 시 '곧 공개'로 비공개)
  if (formData.has("site_published")) {
    update.site_published_at =
      String(formData.get("site_published")) === "1"
        ? new Date().toISOString()
        : null;
  }
  if (hasAdInput) {
    const allEmpty =
      imp === null &&
      clk === null &&
      vis === null &&
      conv === null &&
      spend === null;
    update.ad_stats = allEmpty
      ? null
      : {
          impressions: imp ?? 0,
          clicks: clk ?? 0,
          visits: vis ?? 0,
          conversions: conv ?? 0,
          spend: spend ?? 0,
          updated_at: new Date().toISOString(),
        };
  }

  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  await getSupabaseAdmin().from("o2o_leads").update(update).eq("id", id);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
}

export async function deleteLead(formData: FormData) {
  const { isAdmin } = await import("./auth");
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin");

  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  await getSupabaseAdmin().from("o2o_leads").delete().eq("id", id);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
}
