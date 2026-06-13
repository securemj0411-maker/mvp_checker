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
      "id, access_code, idea, idea_refined, status, tier, brief_confirmed_at, created_at",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  const rows = leadsRaw ?? [];
  const status = (l: { status?: string | null }) => (l.status as string) ?? "new";
  const LIVE_STAGES = ["live", "verdict", "won", "lost"];

  // 라이브 이후 lead 들의 실측을 한 번에 모아 카드에 바로 보여준다 (클릭 없이 한눈).
  const liveIds = rows
    .filter((l) => LIVE_STAGES.includes(status(l)))
    .map((l) => l.id as string);
  const metricsById: Record<string, { visits: number; payClicks: number }> = {};
  if (liveIds.length > 0) {
    const { data: ev } = await admin
      .from("o2o_events")
      .select("lead_id, type, label")
      .in("lead_id", liveIds);
    const PAY = ["구매", "결제", "주문", "신청", "시작", "예약", "구독", "등록"];
    for (const id of liveIds) metricsById[id] = { visits: 0, payClicks: 0 };
    for (const e of ev ?? []) {
      const m = metricsById[e.lead_id as string];
      if (!m) continue;
      if (e.type === "pageview") m.visits += 1;
      else if (
        e.type === "click" &&
        e.label &&
        PAY.some((w) => (e.label as string).includes(w))
      )
        m.payClicks += 1;
    }
  }

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
  const isAwaiting = (l: { brief_confirmed_at?: unknown; status?: string | null }) =>
    !!l.brief_confirmed_at && status(l) === "new";
  const leads: MyLead[] = rows.map((l) => ({
    code: (l.access_code as string) ?? "",
    idea: (l.idea_refined as string) || (l.idea as string) || "",
    stage: isAwaiting(l) ? "입금 대기" : STAGE_LABEL[status(l)] ?? "진행 중",
    tone: isAwaiting(l) ? "action" : TONE[status(l)] ?? "neutral",
    metrics: metricsById[l.id as string] ?? null,
  }));

  // 계정 전체 요약 — 클릭 없이 한눈에
  const overview = {
    total: rows.length,
    active: rows.filter((l) =>
      ["paid", "build", "live", "verdict"].includes(status(l)),
    ).length,
    awaiting: rows.filter(isAwaiting).length,
    done: rows.filter((l) => ["won", "lost"].includes(status(l))).length,
  };

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

        {overview.total > 0 && (
          <div className="mt-7 grid grid-cols-4 gap-2">
            {[
              { k: "전체", v: overview.total, accent: false },
              { k: "진행 중", v: overview.active, accent: true },
              { k: "입금 대기", v: overview.awaiting, accent: false },
              { k: "완료", v: overview.done, accent: false },
            ].map((c) => (
              <div key={c.k} className="rounded-[14px] bg-bg-alt px-3 py-3.5">
                <p className="text-[11px] font-semibold text-text-tertiary">
                  {c.k}
                </p>
                <p
                  className={`mt-1 text-2xl font-extrabold tracking-tight ${
                    c.accent && c.v > 0 ? "text-accent" : "text-text"
                  }`}
                >
                  {c.v}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
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
