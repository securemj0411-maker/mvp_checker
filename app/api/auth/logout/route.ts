import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  return Response.redirect(new URL("/", request.url), 302);
}
