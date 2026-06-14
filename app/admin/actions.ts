"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, safeEqual } from "./auth";
import { rateLimit } from "@/lib/ratelimit";

export async function login(formData: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // 로그인 무차별 대입 방어 — IP당 분당 5회
  if (!rateLimit(`adminlogin:${ip}`, 5, 60_000)) redirect("/admin?e=1");

  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret || !safeEqual(password, expected)) {
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

  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  const admin = getSupabaseAdmin();
  // 기존 값 — site_overrides 병합(고객 편집 보존)과 게시 정합성 가드에 쓴다.
  const { data: existing } = await admin
    .from("o2o_leads")
    .select("site_overrides, site_published_at")
    .eq("id", id)
    .single();
  const curOverrides =
    (existing?.site_overrides as Record<string, unknown> | null) ?? null;
  const curPublishedAt = (existing?.site_published_at as string | null) ?? null;

  const update: Record<string, unknown> = { status, memo: memo || null };

  // 검증 사이트 게시 토글 (체크 시 광고 노출, 해제 시 '곧 공개'로 비공개)
  let publishedAfter = curPublishedAt;
  if (formData.has("site_published")) {
    update.site_published_at =
      String(formData.get("site_published")) === "1"
        ? new Date().toISOString()
        : null;
    publishedAfter = update.site_published_at as string | null;
  }
  // 정합성 가드 — 광고 집행(live)인데 미게시면 광고 트래픽이 '곧 공개' 화면에 막혀 광고비가 샌다.
  // live 로 두는 한 페이지는 반드시 공개되도록 자동 게시한다.
  if (status === "live" && !publishedAfter) {
    update.site_published_at = new Date().toISOString();
  }

  // 검증 사이트 운영자 폴리시 override (이미지·강조색·헤드라인·서브문구).
  // 고객이 편집한 키(credential·prologue·media·plans·selling_points 등)는 손대지 않고
  // 운영자 4개 필드만 병합한다 — 통째 교체하면 고객 페이지 수정분이 날아간다.
  if (
    formData.has("ov_hero_image") ||
    formData.has("ov_accent") ||
    formData.has("ov_offer") ||
    formData.has("ov_sub")
  ) {
    const ovStr = (k: string) => {
      const v = String(formData.get(k) ?? "").trim();
      return v ? v.slice(0, 500) : null;
    };
    const merged: Record<string, unknown> = { ...(curOverrides ?? {}) };
    const setOrClear = (k: string, v: string | null) => {
      if (v) merged[k] = v;
      else delete merged[k];
    };
    setOrClear("hero_image", ovStr("ov_hero_image"));
    setOrClear("accent", ovStr("ov_accent"));
    setOrClear("offer", ovStr("ov_offer"));
    setOrClear("sub", ovStr("ov_sub"));
    update.site_overrides = Object.keys(merged).length ? merged : null;
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

  await admin.from("o2o_leads").update(update).eq("id", id);

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
