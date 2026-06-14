import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ConfirmedBrief } from "@/lib/diagnosis";
import ValidationSite, { type ValidationSiteData } from "@/components/ValidationSite";

export const dynamic = "force-dynamic";

function normalize(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
}

async function loadLead(code: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("o2o_leads")
    .select("id, access_code, site_token, brief, site_published_at, site_overrides")
    .eq("site_token", normalize(code))
    .maybeSingle();
  return data as
    | {
        id: string;
        access_code: string;
        site_token: string;
        brief: { confirmed?: ConfirmedBrief } | null;
        site_published_at: string | null;
        site_overrides: {
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
      }
    | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const lead = await loadLead(code);
  const name = lead?.brief?.confirmed?.name || "서비스 안내";
  // 검증용 광고 랜딩 — 검색 색인 금지(고객별 페이지, 실제 서비스처럼 보이게만)
  return { title: name, robots: { index: false, follow: false } };
}

function intentOf(passBar: string): ValidationSiteData["intent"] {
  if (/예약|신청|등록/.test(passBar)) return "reserve";
  if (/문의/.test(passBar)) return "inquiry";
  return "pay";
}

export default async function ValidationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { code } = await params;
  const { preview } = await searchParams;
  const lead = await loadLead(code);
  const c = lead?.brief?.confirmed;
  if (!lead || !c) notFound();

  // 게시 전(광고 시작 전)에는 우연한 방문자에게 노출하지 않는다. preview=1 은 통과.
  if (!lead.site_published_at && preview !== "1") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg px-6 text-center">
        <div>
          <p className="text-[17px] font-bold text-text">곧 공개됩니다</p>
          <p className="mt-2 text-[14px] text-text-tertiary">
            준비 중인 페이지입니다.
          </p>
        </div>
      </main>
    );
  }

  // 노출 우선 채널(운영자 폴리시 + 고객 페이지 수정). 모든 콘텐츠 필드는 override가 confirmed보다 앞선다.
  const ov = lead.site_overrides ?? {};
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
    code: lead.site_token,
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
  };

  // 게시된 실제 노출에서만 측정한다. 미리보기(preview=1)·미게시 트래픽이
  // 코크핏·판정 신호를 오염시키지 않도록 t.js를 빼고 렌더한다.
  const measure = !!lead.site_published_at && preview !== "1";

  return (
    <>
      <ValidationSite data={data} />
      {/* 측정 — 게시된 노출에서만. 방문·CTA 클릭이 o2o_events로(코크핏 실시간 반영) */}
      {measure && <script defer src="/t.js" data-code={lead.site_token} />}
    </>
  );
}
