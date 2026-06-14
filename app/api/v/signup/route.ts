import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** 검증 사이트 사전등록 — 방문자가 CTA 모달에서 연락처를 남기면 적재.
 *  이게 검증 종료 후 고객(창업자)에게 넘어가는 '첫 고객 명단'이 된다. */
export async function POST(request: Request) {
  // 명단 오염(스팸) 보호 — IP당 분당 제한
  if (!rateLimit(ipKey(request, "signup"), 8, 60_000))
    return Response.json({ ok: false }, { status: 429 });
  let body: { code?: string; name?: string; contact?: string; plan?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const code = (body.code ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 12);
  const contact = (body.contact ?? "").trim().slice(0, 120);
  const name = (body.name ?? "").trim().slice(0, 80);
  const plan = (body.plan ?? "").toString().trim().slice(0, 80) || null;
  if (code.length < 8 || contact.length < 7) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: lead } = await admin
    .from("o2o_leads")
    .select("id, site_published_at")
    .eq("access_code", code)
    .maybeSingle();
  if (!lead?.id) return Response.json({ ok: false }, { status: 404 });
  // 게시된(광고 노출 중) 사이트에서만 신청을 받는다 — 미게시·미리보기 제출은 거부.
  if (!lead.site_published_at)
    return Response.json({ ok: false }, { status: 403 });

  // (lead_id, contact) 유니크 — 같은 사람 중복 제출은 조용히 무시(명단·전환 부풀림 방지)
  await admin.from("o2o_signups").upsert(
    {
      lead_id: lead.id,
      code,
      name: name || null,
      contact,
      plan, // 어느 플랜에서 신청했는지 (선택)
    },
    { onConflict: "lead_id,contact", ignoreDuplicates: true },
  );

  return Response.json({ ok: true });
}
