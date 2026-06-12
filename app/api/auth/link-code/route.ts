import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/** 설계서 직후 카카오 로그인한 경우, access_code 로 그 신청을 계정에 연결 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "not logged in" }, { status: 401 });
  }

  let body: { code?: string };
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
    .select("id, account_id")
    .eq("access_code", code)
    .maybeSingle();

  if (lead?.id && !lead.account_id) {
    await admin
      .from("o2o_leads")
      .update({ account_id: user.id })
      .eq("id", lead.id);
    return Response.json({ linked: true });
  }
  return Response.json({ linked: false });
}
