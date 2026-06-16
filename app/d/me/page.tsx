import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, LayoutGrid, Plus } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BrandMark, Wordmark } from "@/components/Brand";
import { KakaoCTA } from "@/components/KakaoCTA";
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

  // 사이드바 검증 목록의 상태 도트 색 (MyLeads 칩 팔레트와 동일 계열)
  const TONE_DOT: Record<MyLead["tone"], string> = {
    action: "var(--pivot)",
    progress: "var(--accent)",
    done: "var(--go)",
    closed: "var(--text-tertiary)",
    neutral: "var(--text-tertiary)",
  };

  // 요약 타일 — 코크핏과 같은 톤 (3 화이트 + 진행 중 accent 히어로)
  const tiles: { k: string; v: number; hero?: boolean }[] = [
    { k: "전체", v: overview.total },
    { k: "진행 중", v: overview.active, hero: true },
    { k: "입금 대기", v: overview.awaiting },
    { k: "완료", v: overview.done },
  ];

  return (
    <main className="min-h-screen bg-bg">
      <div className="lg:flex">
        {/* ── 데스크탑 좌측 사이드바 (계정 네비) ── */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-border bg-surface px-5 py-6 lg:flex">
          <a href="/" className="flex items-center gap-2 text-[18px]">
            <BrandMark />
            <Wordmark />
          </a>
          <div className="mt-7">
            <p className="text-[15px] font-bold text-text">
              {displayName ? `${displayName}님` : "내 계정"}
            </p>
            <p className="mt-0.5 text-[11px] text-text-tertiary">내 검증 현황</p>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
            메뉴
          </p>
          <nav className="mt-2.5 space-y-0.5">
            <span className="flex items-center gap-2.5 rounded-lg bg-accent/10 px-2.5 py-2 text-[13px] font-bold text-accent">
              <LayoutGrid className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
              전체 현황
            </span>
            <a
              href="/start"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-tertiary transition hover:bg-bg-alt hover:text-text"
            >
              <Plus className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
              새 검증 신청
            </a>
          </nav>

          {leads.length > 0 && (
            <>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                검증 {leads.length}건
              </p>
              <nav className="mt-2.5 max-h-[38vh] space-y-0.5 overflow-y-auto">
                {leads.map((l) => (
                  <a
                    key={l.code}
                    href={`/d/${l.code}`}
                    title={l.idea || l.code}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-bg-alt"
                  >
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: TONE_DOT[l.tone] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text-secondary">
                      {l.idea || l.code}
                    </span>
                  </a>
                ))}
              </nav>
            </>
          )}

          <div className="mt-auto space-y-2 pt-6">
            <KakaoCTA
              from="d_me"
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition hover:brightness-95"
              style={{ background: "#FEE500", color: "#191600" }}
            >
              카카오톡 문의
            </KakaoCTA>
            <form action="/api/auth/logout" method="post">
              <button className="block w-full rounded-lg px-3 py-2 text-center text-xs font-semibold text-text-tertiary transition hover:text-text">
                로그아웃
              </button>
            </form>
          </div>
        </aside>

        {/* ── 콘텐츠 영역 ── */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-7 sm:px-6 sm:py-9">
            {/* 모바일 상단 — 사이드바 대체 */}
            <div className="flex items-center justify-between lg:hidden">
              <a href="/" className="flex items-center gap-2">
                <BrandMark size={24} />
                <Wordmark className="text-base" />
              </a>
              <form action="/api/auth/logout" method="post">
                <button className="text-xs font-semibold text-text-tertiary transition hover:text-text">
                  로그아웃
                </button>
              </form>
            </div>

            {/* 헤더 */}
            <div>
              <p className="text-[13px] font-bold text-accent">내 검증 현황</p>
              <h1 className="mt-1.5 text-[26px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-[28px]">
                {displayName ? `${displayName}님` : "반갑습니다"}
              </h1>
              <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
                신청하신 검증을 한곳에서 보고, 이어서 진행하실 수 있습니다.
              </p>
            </div>

            {/* 요약 타일 */}
            {overview.total > 0 && (
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {tiles.map((t) =>
                  t.hero ? (
                    <div
                      key={t.k}
                      className="rounded-2xl bg-accent px-4 py-4 text-white shadow-[0_12px_28px_-12px_var(--accent-glow)]"
                    >
                      <p className="text-[12px] font-semibold text-white/85">
                        {t.k}
                      </p>
                      <p className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight">
                        {t.v}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={t.k}
                      className="rounded-2xl border border-border bg-surface px-4 py-4"
                    >
                      <p className="text-[12px] font-semibold text-text-tertiary">
                        {t.k}
                      </p>
                      <p className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-text">
                        {t.v}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}

            {/* 검증 목록 + 불러오기 폼 */}
            <MyLeads leads={leads} hasPhone={hasPhone} />

            {/* 새 검증 신청 CTA */}
            <a
              href="/start"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              새 강의 검증 신청
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
