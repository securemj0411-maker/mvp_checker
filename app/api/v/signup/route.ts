import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/** 검증 사이트 사전등록 — 방문자가 CTA 모달에서 연락처를 남기면 적재.
 *  이게 검증 종료 후 고객(창업자)에게 넘어가는 '첫 고객 명단'이 된다. */
export async function POST(request: Request) {
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
    .select("id")
    .eq("access_code", code)
    .maybeSingle();
  if (!lead?.id) return Response.json({ ok: false }, { status: 404 });

  await admin.from("o2o_signups").insert({
    lead_id: lead.id,
    code,
    name: name || null,
    contact,
    plan, // 어느 플랜에서 신청했는지 (선택)
  });

  return Response.json({ ok: true });
}
