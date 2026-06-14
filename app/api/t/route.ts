import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * 측정 이벤트 수집 — 고객 페이지의 t.js(sendBeacon)가 보낸다.
 * sendBeacon 은 text/plain 단순 요청이라 프리플라이트가 없다.
 * 응답은 읽히지 않으므로 본문 없이 204 만 돌려준다.
 */
export async function POST(request: Request) {
  // 측정 폭주(판정 왜곡) 보호 — IP당 분당 제한. 실패는 조용히 204.
  if (!rateLimit(ipKey(request, "t"), 80, 60_000))
    return new Response(null, { status: 429 });
  let body: {
    c?: string;
    t?: string;
    l?: string | null;
    s?: string | null;
    r?: string | null;
  };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 204 });
  }

  const code = (body.c ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
  const type = body.t === "pageview" || body.t === "click" ? body.t : null;
  if (code.length < 8 || !type) return new Response(null, { status: 204 });

  const admin = getSupabaseAdmin();
  const { data: lead } = await admin
    .from("o2o_leads")
    .select("id, page_tag_verified_at")
    .eq("access_code", code)
    .maybeSingle();
  if (!lead?.id) return new Response(null, { status: 204 });

  await admin.from("o2o_events").insert({
    lead_id: lead.id,
    code,
    type,
    label: body.l ? String(body.l).slice(0, 80) : null,
    session_id: body.s ? String(body.s).slice(0, 60) : null,
    referrer: body.r ? String(body.r).slice(0, 300) : null,
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
  });

  // 첫 이벤트 도착 = 설치가 실제로 작동한다는 가장 확실한 증거
  if (!lead.page_tag_verified_at) {
    await admin
      .from("o2o_leads")
      .update({ page_tag_verified_at: new Date().toISOString() })
      .eq("id", lead.id);
  }

  return new Response(null, { status: 204 });
}
