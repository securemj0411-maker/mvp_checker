import { getAccountId } from "@/lib/accountSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/** 전화번호로 접수된 기존 신청을 로그인 계정에 연결 */
export async function POST(request: Request) {
  const accountId = await getAccountId();
  if (!accountId) {
    return Response.json({ error: "not logged in" }, { status: 401 });
  }
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const digits = (body.phone ?? "").replace(/\D/g, "");
  if (digits.length < 9) {
    return Response.json({ error: "bad phone" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // 계정에 정규화된 전화번호 기록 (다음 신청 자동 연결용)
  await admin.from("accounts").update({ phone: digits }).eq("id", accountId);

  // phone/email 컬럼에 전화번호가 들어가므로(폼에서 전화번호 수집), 둘 다 매칭.
  // 하이픈 유무 모두 커버하기 위해 끝 8자리로 like 매칭.
  const tail = digits.slice(-8);
  const { data: candidates } = await admin
    .from("o2o_leads")
    .select("id, phone, email, account_id")
    .or(`phone.ilike.%${tail}%,email.ilike.%${tail}%`);

  const toLink = (candidates ?? []).filter((l) => {
    if (l.account_id && l.account_id !== accountId) return false; // 이미 다른 계정 소유
    const p = String(l.phone ?? "").replace(/\D/g, "");
    const e = String(l.email ?? "").replace(/\D/g, "");
    return p === digits || e === digits;
  });

  let linked = 0;
  if (toLink.length > 0) {
    const ids = toLink.map((l) => l.id);
    const { error } = await admin
      .from("o2o_leads")
      .update({ account_id: accountId })
      .in("id", ids);
    if (!error) linked = ids.length;
  }

  return Response.json({ linked });
}
