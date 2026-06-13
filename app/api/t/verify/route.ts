import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * 측정 스크립트 설치 확인 — 고객 페이지 HTML 을 가져와 t.js 태그를 찾는다.
 * 이미 이벤트가 도착해 검증된 리드는 즉시 ok.
 */
export async function POST(request: Request) {
  let body: { code?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const code = (body.code ?? "").toUpperCase().replace(/\s/g, "").slice(0, 12);
  if (code.length < 8) {
    return Response.json({ error: "bad code" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: lead } = await admin
    .from("o2o_leads")
    .select("id, page_url, page_tag_verified_at")
    .eq("access_code", code)
    .maybeSingle();
  if (!lead?.id) return Response.json({ error: "not found" }, { status: 404 });
  if (lead.page_tag_verified_at) return Response.json({ verified: true });

  // 페이지 주소: 저장된 것 우선, 없으면 요청 본문의 url 을 저장하며 사용
  let pageUrl = (lead.page_url as string) || "";
  const bodyUrl = (body.url ?? "").trim().slice(0, 500);
  if (!pageUrl && /^https?:\/\//i.test(bodyUrl)) {
    pageUrl = bodyUrl;
    await admin.from("o2o_leads").update({ page_url: pageUrl }).eq("id", lead.id);
  }
  if (!pageUrl) {
    return Response.json({ verified: false, reason: "no_url" });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: { "user-agent": "bizfilter-verify/1.0" },
      redirect: "follow",
    });
    clearTimeout(timer);
    const html = (await res.text()).slice(0, 500_000);
    const hasTag = html.includes("/t.js") && html.includes(code);
    if (hasTag) {
      await admin
        .from("o2o_leads")
        .update({ page_tag_verified_at: new Date().toISOString() })
        .eq("id", lead.id);
      return Response.json({ verified: true });
    }
    return Response.json({ verified: false, reason: "tag_not_found" });
  } catch {
    return Response.json({ verified: false, reason: "fetch_failed" });
  }
}
