import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ConfirmedBrief } from "@/lib/diagnosis";
import ValidationClient from "@/components/ValidationClient";

export const dynamic = "force-dynamic";

function normalize(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  // 제목(OG)만 서버에서 — 본문 마크업은 클라이언트에서 받아 베끼기 억제.
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("o2o_leads")
    .select("brief")
    .eq("site_token", normalize(code))
    .maybeSingle();
  const name =
    (data?.brief as { confirmed?: ConfirmedBrief } | null)?.confirmed?.name ||
    "서비스 안내";
  // 검증용 광고 랜딩 — 검색 색인 금지(고객별 페이지, 실제 서비스처럼 보이게만)
  return { title: name, robots: { index: false, follow: false } };
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
  return <ValidationClient token={normalize(code)} preview={preview === "1"} />;
}
