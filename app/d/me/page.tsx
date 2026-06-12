import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SITE_NAME } from "@/lib/site";
import MyLeads, { type MyLead } from "./MyLeads";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "내 검증 현황 | 비즈필터",
  robots: { index: false, follow: false },
};

const STAGE_LABEL: Record<string, string> = {
  new: "설계서 받음",
  contacted: "설계서 받음",
  consulted: "설계서 받음",
  paid: "제작 준비",
  build: "제작 중",
  live: "광고 집행 중",
  verdict: "판정 완료",
  won: "완료",
  lost: "종료",
};

export default async function MyPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/d");

  const accountId = user.id;
  const meta = user.user_metadata as { name?: string; nickname?: string } | null;
  const displayName = meta?.name || meta?.nickname || null;
  const hasPhone = !!user.phone;

  const admin = getSupabaseAdmin();
  const { data: leadsRaw } = await admin
    .from("o2o_leads")
    .select(
      "access_code, idea, idea_refined, status, tier, brief_confirmed_at, created_at",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  const leads: MyLead[] = (leadsRaw ?? []).map((l) => ({
    code: (l.access_code as string) ?? "",
    idea: (l.idea_refined as string) || (l.idea as string) || "",
    stage:
      l.brief_confirmed_at && (l.status ?? "new") === "new"
        ? "입금 대기"
        : STAGE_LABEL[(l.status as string) ?? "new"] ?? "진행 중",
  }));

  return (
    <main className="min-h-screen bg-bg px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-extrabold text-text">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-white">
              B
            </span>
            {SITE_NAME}
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="text-xs font-semibold text-text-tertiary transition hover:text-text">
              로그아웃
            </button>
          </form>
        </div>

        <div className="cold-panel rounded-lg p-6">
          <p className="text-lg font-bold text-text">
            {displayName ? `${displayName}님의` : "내"} 검증 현황
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            카카오로 로그인되었습니다. 신청하신 검증을 한곳에서 보실 수 있습니다.
          </p>
        </div>

        <MyLeads leads={leads} hasPhone={hasPhone} />

        <a
          href="/start"
          className="block rounded-lg border border-accent/40 bg-accent/5 px-6 py-4 text-center text-base font-bold text-accent transition hover:bg-accent/10"
        >
          새 아이디어 검증 신청하기
        </a>
      </div>
    </main>
  );
}
