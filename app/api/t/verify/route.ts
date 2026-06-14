import { lookup } from "node:dns/promises";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** 내부망/루프백/링크로컬 호스트 차단 (SSRF 방지) */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // IPv6 대괄호 제거
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0 || a === 127 || a === 10) return true; // this-host, loopback, private
    if (a === 169 && b === 254) return true; // 링크로컬 (클라우드 메타데이터)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  // IPv6 루프백/링크로컬/유니크로컬
  if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) {
    return true;
  }
  return false;
}

/** 호스트 검증 + 수동 리다이렉트(매 홉 재검증) fetch. 안전하지 않으면 null. */
async function safeFetch(rawUrl: string): Promise<Response | null> {
  let next = rawUrl;
  for (let hop = 0; hop < 4; hop++) {
    let u: URL;
    try {
      u = new URL(next);
    } catch {
      return null;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (isBlockedHost(u.hostname)) return null;
    // 호스트명은 공개지만 사설/메타데이터 IP로 resolve되는 DNS 리바인딩 방어 —
    // 해석된 IP가 하나라도 내부면 거부.
    try {
      const addrs = await lookup(u.hostname, { all: true });
      if (addrs.length === 0 || addrs.some((a) => isBlockedHost(a.address)))
        return null;
    } catch {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let res: Response;
    try {
      res = await fetch(u.toString(), {
        signal: controller.signal,
        headers: { "user-agent": "bizfilter-verify/1.0" },
        redirect: "manual",
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      next = new URL(loc, u).toString(); // 다음 홉도 isBlockedHost로 재검증
      continue;
    }
    return res;
  }
  return null; // 리다이렉트 과다
}

/**
 * 측정 스크립트 설치 확인 — 고객 페이지 HTML 을 가져와 t.js 태그를 찾는다.
 * 이미 이벤트가 도착해 검증된 리드는 즉시 ok.
 */
export async function POST(request: Request) {
  if (!rateLimit(ipKey(request, "verify"), 10, 60_000))
    return Response.json({ error: "rate_limited" }, { status: 429 });
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
    .select("id, page_url, page_tag_verified_at, site_token")
    .eq("access_code", code)
    .maybeSingle();
  if (!lead?.id) return Response.json({ error: "not found" }, { status: 404 });
  if (lead.page_tag_verified_at) return Response.json({ verified: true });

  // 페이지 주소: 저장된 것 우선, 없으면 요청 본문의 url
  let pageUrl = (lead.page_url as string) || "";
  const bodyUrl = (body.url ?? "").trim().slice(0, 500);
  if (!pageUrl && /^https?:\/\//i.test(bodyUrl)) pageUrl = bodyUrl;
  if (!pageUrl) {
    return Response.json({ verified: false, reason: "no_url" });
  }

  const res = await safeFetch(pageUrl);
  if (!res) {
    return Response.json({ verified: false, reason: "fetch_failed" });
  }

  // 검증 가능한 안전한 주소로 확인됐을 때만 저장
  if (!lead.page_url && pageUrl) {
    await admin.from("o2o_leads").update({ page_url: pageUrl }).eq("id", lead.id);
  }

  let html = "";
  try {
    html = (await res.text()).slice(0, 500_000);
  } catch {
    return Response.json({ verified: false, reason: "fetch_failed" });
  }
  // 설치 스니펫은 공개 측정 토큰(site_token)을 쓴다
  const token = (lead.site_token as string) || code;
  const hasTag = html.includes("/t.js") && html.includes(token);
  if (hasTag) {
    await admin
      .from("o2o_leads")
      .update({ page_tag_verified_at: new Date().toISOString() })
      .eq("id", lead.id);
    return Response.json({ verified: true });
  }
  return Response.json({ verified: false, reason: "tag_not_found" });
}
