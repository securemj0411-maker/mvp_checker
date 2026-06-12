import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/** 전화번호로 접수된 기존 신청을 로그인 계정(auth user)에 연결 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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
  // phone/email 컬럼에 전화번호가 들어가므로(폼에서 전화번호 수집) 끝 8자리로 매칭
  const tail = digits.slice(-8);
  const { data: candidates } = await admin
    .from("o2o_leads")
    .select("id, phone, email, account_id")
    .or(`phone.ilike.%${tail}%,email.ilike.%${tail}%`);

  const toLink = (candidates ?? []).filter((l) => {
    if (l.account_id && l.account_id !== user.id) return false;
    const p = String(l.phone ?? "").replace(/\D/g, "");
    const e = String(l.email ?? "").replace(/\D/g, "");
    return p === digits || e === digits;
  });

  let linked = 0;
  if (toLink.length > 0) {
    const ids = toLink.map((l) => l.id);
    const { error } = await admin
      .from("o2o_leads")
      .update({ account_id: user.id })
      .in("id", ids);
    if (!error) linked = ids.length;
  }

  return Response.json({ linked });
}
