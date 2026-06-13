import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-2xl items-center justify-between px-5 sm:px-6">
          <a href="/" className="flex items-center gap-2.5 text-[19px]">
            <BrandMark />
            <Wordmark />
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="text-[15px] font-semibold text-text-tertiary transition hover:text-text">
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-12">
        <p className="text-[15px] font-bold text-accent">내 검증 현황</p>
        <h1 className="mt-2 text-[28px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text">
          {displayName ? `${displayName}님` : "반갑습니다"}
        </h1>
        <p className="mt-2.5 text-[15px] leading-[1.65] text-text-secondary">
          신청하신 검증을 한곳에서 보고, 이어서 진행하실 수 있습니다.
        </p>

        <div className="mt-8">
          <MyLeads leads={leads} hasPhone={hasPhone} />
        </div>

        <a
          href="/start"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
        >
          새 아이디어 검증 신청
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </a>
      </div>
    </main>
  );
}
