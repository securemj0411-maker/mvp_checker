import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ConfirmedBrief } from "@/lib/diagnosis";
import type { ValidationSiteData } from "@/components/ValidationSite";

export const dynamic = "force-dynamic";

/** 검증 랜딩 데이터 — CSR로 본문을 내려준다(보기소스/curl로 마크업이 통째로 새는 걸 막음).
 *  데이터 자체는 공개 페이지용이라 인증은 없지만, 미게시 페이지는 본문을 주지 않는다. */

function normalize(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
}

function intentOf(passBar: string): ValidationSiteData["intent"] {
  if (/예약|신청|등록/.test(passBar)) return "reserve";
  if (/문의/.test(passBar)) return "inquiry";
  return "pay";
}

type SiteOverrides = {
  hero_image?: string;
  accent?: string;
  offer?: string;
  sub?: string;
  credential?: string;
  intro_video?: string;
  prologue?: string;
  media?: string[];
  plans?: { label: string; price: number; desc?: string }[];
  selling_points?: string[];
  instructor_photo?: string;
} | null;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = normalize(url.searchParams.get("code") ?? "");
  const preview = url.searchParams.get("preview") === "1";
  if (code.length < 8) return Response.json({ ok: false }, { status: 404 });

  const admin = getSupabaseAdmin();
  const { data: lead } = await admin
    .from("o2o_leads")
    .select("site_token, brief, site_published_at, site_overrides")
    .eq("site_token", code)
    .maybeSingle();

  const c = (lead?.brief as { confirmed?: ConfirmedBrief } | null)?.confirmed;
  if (!lead || !c) return Response.json({ ok: false }, { status: 404 });

  const published = !!lead.site_published_at;
  // 게시 전(광고 시작 전)에는 본문을 주지 않는다. preview=1 은 통과.
  if (!published && !preview) {
    return Response.json({ ok: true, published: false });
  }

  // 진짜 사전신청 수 — Skool의 '멤버수' 자리를 정직하게 메운다(가짜 아님).
  const { count: signupCount } = await admin
    .from("o2o_signups")
    .select("id", { count: "exact", head: true })
    .eq("code", code);

  const ov: NonNullable<SiteOverrides> =
    (lead.site_overrides as SiteOverrides) ?? {};
  const srcPlans =
    Array.isArray(ov.plans) && ov.plans.length > 0
      ? ov.plans
      : c.plans && c.plans.length > 0
        ? c.plans
        : [{ label: "기본", price: c.price_value ?? 0, desc: "" }];
  const plans = srcPlans.map((p) => ({
    label: p.label,
    price: p.price,
    desc: p.desc ?? "",
  }));

  const data: ValidationSiteData = {
    code: lead.site_token as string,
    name: c.name || "내 서비스",
    offer: ov.offer || c.offer || c.name || "",
    targetLine: c.target_line || "",
    problemLine: ov.sub || c.problem_line || "",
    plans,
    sellingPoints:
      Array.isArray(ov.selling_points) && ov.selling_points.length > 0
        ? ov.selling_points
        : Array.isArray(c.selling_points)
          ? c.selling_points
          : [],
    intent: intentOf(c.pass_bar ?? ""),
    credential: ov.credential || c.credential || undefined,
    instructorPhoto: ov.instructor_photo || undefined,
    introVideo: ov.intro_video || c.intro_video || undefined,
    prologue: ov.prologue || c.prologue || c.notes || undefined,
    media:
      (Array.isArray(ov.media) && ov.media.length ? ov.media : c.media) ||
      undefined,
    heroImage: ov.hero_image || undefined,
    accent: ov.accent || undefined,
    signupCount: signupCount ?? 0,
  };

  // 게시된 노출에서만 측정한다(미리보기 제외).
  const measure = published && !preview;
  return Response.json({ ok: true, published: true, measure, data });
}
