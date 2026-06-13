import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BrandMark, Wordmark } from "@/components/Brand";
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

  const TONE: Record<string, MyLead["tone"]> = {
    new: "neutral",
    contacted: "neutral",
    consulted: "neutral",
    paid: "progress",
    build: "progress",
    live: "progress",
    verdict: "done",
    won: "done",
    lost: "closed",
  };
  const status = (l: { status?: string | null }) => (l.status as string) ?? "new";
  const leads: MyLead[] = (leadsRaw ?? []).map((l) => {
    const awaitingDeposit = l.brief_confirmed_at && status(l) === "new";
    return {
      code: (l.access_code as string) ?? "",
      idea: (l.idea_refined as string) || (l.idea as string) || "",
      stage: awaitingDeposit
        ? "입금 대기"
        : STAGE_LABEL[status(l)] ?? "진행 중",
      tone: awaitingDeposit ? "action" : TONE[status(l)] ?? "neutral",
    };
  });

  const initial = displayName?.trim().charAt(0) || "검";

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <BrandMark size={24} />
            <Wordmark className="text-base" />
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text-tertiary transition hover:border-border-hover hover:text-text-secondary">
              로그아웃
            </button>
          </form>
        </div>

        <div className="cold-panel rounded-lg p-6">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-accent/10 text-xl font-extrabold text-accent">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-text">
                {displayName ? `${displayName}님` : "내"} 검증 현황
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                카카오로 로그인됨 · 신청하신 검증을 한곳에서 봅니다
              </p>
            </div>
          </div>
        </div>

        <MyLeads leads={leads} hasPhone={hasPhone} />

        <a
          href="/start"
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-bold text-white shadow-[0_12px_30px_-12px_var(--accent-glow)] transition hover:bg-accent-hover"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 아이디어 검증 신청하기
        </a>
      </div>
    </main>
  );
}
