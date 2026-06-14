"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLead, deleteLead } from "./actions";
import Guide from "./Guide";
import {
  TIER_INFO,
  BANK_INFO,
  type BriefDraft,
  type ConfirmedBrief,
  type Report,
} from "@/lib/diagnosis";

export type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  idea: string;
  idea_refined: string | null;
  status: string;
  memo: string | null;
  source: string | null;
  utm_source: string | null;
  service_type: string | null;
  audience: string | null;
  revenue_model: string | null;
  build_status: string | null;
  price_band: string | null;
  alternative: string | null;
  region: string | null;
  location: string | null;
  page_url: string | null;
  page_measurable: boolean | null;
  page_tag_verified_at: string | null;
  access_code: string | null;
  tier: string | null;
  brief: { draft?: BriefDraft; confirmed?: ConfirmedBrief } | null;
  brief_confirmed_at: string | null;
  deposit_due_at: string | null;
  ai_report: (Report & { source?: string }) | null;
  policy_flag: string | null;
  interpret_status: string | null;
  ad_stats: {
    impressions: number;
    clicks: number;
    visits?: number;
    conversions?: number;
    spend: number;
    updated_at?: string;
  } | null;
  site_published_at: string | null;
  site_token: string | null;
  site_overrides: {
    hero_image?: string;
    accent?: string;
    offer?: string;
    sub?: string;
  } | null;
  signups?: {
    name: string | null;
    contact: string;
    plan: string | null;
    created_at: string;
  }[];
};

/* ── 라벨 ── */
const LABEL = {
  service: {
    web: "웹 서비스",
    app: "모바일 앱",
    commerce: "온라인 판매",
    offline: "오프라인·지역",
    content: "콘텐츠·교육",
    unknown: "형태 미정",
  } as Record<string, string>,
  audience: {
    b2c: "소비자",
    b2b: "회사·사장님",
    both: "둘 다/모름",
    unknown: "미정",
  } as Record<string, string>,
  revenue: {
    once: "한 번 결제",
    subscription: "정기(구독·회원제)",
    usage: "쓸 때마다",
    fee: "수수료·광고",
    undecided: "미정",
    unknown: "미정",
  } as Record<string, string>,
  build: {
    self: "직접 제작 가능",
    need: "제작 필요",
    built: "이미 있음",
  } as Record<string, string>,
  price: {
    under10k: "1만 미만",
    "10kto50k": "1~5만",
    "50kto100k": "5~10만",
    over100k: "10만 이상",
    multi: "여러 플랜",
    unknown: "미정",
  } as Record<string, string>,
  alternative: {
    competitor: "유사 서비스",
    manual: "임시방편",
    none: "안함·감수",
    unaware: "인식 전",
    unknown: "모름",
  } as Record<string, string>,
  region: {
    local: "동네 상권",
    city: "도시 전체",
    nationwide: "전국",
  } as Record<string, string>,
  tier: {
    engine: "엔진 29만",
    quick: "Quick 50만",
    deep: "Deep 130만",
  } as Record<string, string>,
};
const L = (m: Record<string, string>, k: string | null) =>
  k ? (m[k] ?? k) : "-";

/** 입금 기한 D-day */
function dDay(iso: string | null): { text: string; urgent: boolean } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return { text: `기한 ${-days}일 지남`, urgent: true };
  if (days === 0) return { text: "오늘까지", urgent: true };
  return { text: `D-${days}`, urgent: days <= 1 };
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── 파이프라인 상태 (순서 = 진행 순서) ── */
const STATUS: { key: string; label: string; dot: string }[] = [
  { key: "new", label: "신규", dot: "#97A4B2" },
  { key: "contacted", label: "연락중", dot: "#3182F6" },
  { key: "consulted", label: "상담완료", dot: "#1B64DA" },
  { key: "paid", label: "결제완료", dot: "#06A86B" },
  { key: "build", label: "제작중", dot: "#E08A00" },
  { key: "live", label: "광고집행", dot: "#E08A00" },
  { key: "verdict", label: "판정·납품", dot: "#06A86B" },
  { key: "won", label: "완료", dot: "#16233A" },
  { key: "lost", label: "미진행", dot: "#C0432A" },
];
const ST = (k: string | null) =>
  STATUS.find((s) => s.key === (k ?? "new")) ?? STATUS[0];

const PAID_ONWARD = ["paid", "build", "live", "verdict", "won", "lost"];
const VIEWS: { key: string; label: string; test: (l: Lead) => boolean }[] = [
  {
    key: "inbox",
    label: "신규",
    test: (l) =>
      !l.brief_confirmed_at &&
      l.policy_flag !== "prohibited" &&
      ["new", "contacted", "consulted"].includes(l.status ?? "new"),
  },
  {
    key: "deposit",
    label: "입금대기",
    test: (l) =>
      !!l.brief_confirmed_at && !PAID_ONWARD.includes(l.status ?? "new"),
  },
  {
    key: "active",
    label: "진행 고객",
    test: (l) => ["paid", "build", "live", "verdict"].includes(l.status ?? "new"),
  },
  { key: "closed", label: "완료·종료", test: (l) => ["won", "lost"].includes(l.status ?? "new") },
  { key: "blocked", label: "정책차단", test: (l) => l.policy_flag === "prohibited" },
  { key: "all", label: "전체", test: () => true },
];

export default function LeadBoard({ leads: initial }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [tab, setTab] = useState("inbox");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLeads(initial), [initial]);

  const countFor = (v: (typeof VIEWS)[number]) =>
    leads.filter(v.test).length;

  const visible = useMemo(() => {
    const v = VIEWS.find((x) => x.key === tab);
    if (!v) return leads;
    return leads.filter(v.test);
  }, [leads, tab]);

  const depositCount = leads.filter(VIEWS[1].test).length;

  const fromYoutube = leads.filter((l) => l.utm_source === "youtube").length;

  async function save(
    id: string,
    status: string,
    memo: string,
    ad?: {
      impressions: string;
      clicks: string;
      visits: string;
      conversions: string;
      spend: string;
    },
    published?: boolean,
    overrides?: { hero_image: string; accent: string; offer: string; sub: string },
  ) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    fd.set("memo", memo);
    if (typeof published === "boolean")
      fd.set("site_published", published ? "1" : "0");
    if (overrides) {
      fd.set("ov_hero_image", overrides.hero_image);
      fd.set("ov_accent", overrides.accent);
      fd.set("ov_offer", overrides.offer);
      fd.set("ov_sub", overrides.sub);
    }
    if (ad) {
      fd.set("ad_impressions", ad.impressions);
      fd.set("ad_clicks", ad.clicks);
      fd.set("ad_visits", ad.visits);
      fd.set("ad_conversions", ad.conversions);
      fd.set("ad_spend", ad.spend);
    }
    setLeads((ls) =>
      ls.map((l) => (l.id === id ? { ...l, status, memo } : l)),
    );
    setSelected(null);
    startTransition(async () => {
      await updateLead(fd);
      router.refresh();
    });
  }

  async function remove(id: string, name: string) {
    if (!confirm(`"${name}" 리드를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const fd = new FormData();
    fd.set("id", id);
    setLeads((ls) => ls.filter((l) => l.id !== id));
    setSelected(null);
    startTransition(async () => {
      await deleteLead(fd);
      router.refresh();
    });
  }

  return (
    <div>
      {/* 요약 통계 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 리드" value={leads.length} />
        <Stat label="입금 대기" value={depositCount} highlight={depositCount > 0} />
        <Stat label="진행 고객" value={countFor(VIEWS[2])} />
        <Stat label="유튜브 유입" value={fromYoutube} />
      </div>

      {/* 탭 — 클라이언트 즉시 전환 */}
      <div className="mt-7 flex flex-wrap items-center gap-1 border-b border-border">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setTab(v.key)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-bold transition ${
              tab === v.key
                ? "border border-b-0 border-border bg-surface text-text"
                : "text-text-tertiary hover:text-text"
            }`}
          >
            {v.label}{" "}
            <span className="font-medium text-text-tertiary">
              {countFor(v)}
            </span>
          </button>
        ))}
        <button
          onClick={() => setTab("guide")}
          className={`ml-auto rounded-t-lg px-4 py-2.5 text-sm font-bold transition ${
            tab === "guide"
              ? "border border-b-0 border-border bg-surface text-accent"
              : "text-accent hover:opacity-75"
          }`}
        >
          📋 상담 가이드
        </button>
      </div>

      {tab === "guide" ? (
        <Guide />
      ) : (
        <div className="overflow-x-auto rounded-b-lg border border-t-0 border-border bg-surface">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-3">접수</th>
                <th className="px-4 py-3">유입</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">아이디어</th>
                <th className="px-4 py-3">플랜</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-text-tertiary"
                  >
                    이 보기에 해당하는 리드가 없습니다.
                  </td>
                </tr>
              )}
              {visible.map((l) => {
                const st = ST(l.status);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className="cursor-pointer border-b border-border-light transition last:border-0 hover:bg-bg-alt"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-text-tertiary">
                      {fmtKST(l.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {l.utm_source === "youtube" ? (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                          유튜브
                        </span>
                      ) : (
                        <span className="text-xs text-text-tertiary">
                          {l.utm_source ?? "직접"}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold">
                      {l.name}
                      {l.memo && (
                        <span
                          className="ml-1.5 text-text-tertiary"
                          title="메모 있음"
                        >
                          ✎
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-text-secondary">
                      {l.email}
                      {l.phone && (
                        <span className="block text-xs font-semibold text-accent">
                          {l.phone}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[300px] truncate px-4 py-3.5 text-text-secondary">
                      {l.idea}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-text-secondary">
                      {l.policy_flag === "prohibited"
                        ? "—"
                        : L(LABEL.tier, l.tier)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {l.policy_flag === "prohibited" ? (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                          정책차단
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: st.dot }}
                          />
                          {st.label}
                          {VIEWS[1].test(l) &&
                            (() => {
                              const d = dDay(l.deposit_due_at);
                              return d ? (
                                <span
                                  className={`ml-1 rounded px-1.5 py-0.5 text-[10px] ${
                                    d.urgent
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-accent/10 text-accent"
                                  }`}
                                >
                                  입금 {d.text}
                                </span>
                              ) : null;
                            })()}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-text-tertiary">
        행을 클릭하면 상세·메모·상태 변경 · 최근 500건 · KST
        {isPending && " · 저장 중..."}
      </p>

      {selected && (
        <Modal
          lead={selected}
          onClose={() => setSelected(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}

/* ── 상세 모달 ── */
function Modal({
  lead,
  onClose,
  onSave,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (
    id: string,
    status: string,
    memo: string,
    ad?: {
      impressions: string;
      clicks: string;
      visits: string;
      conversions: string;
      spend: string;
    },
    published?: boolean,
    overrides?: { hero_image: string; accent: string; offer: string; sub: string },
  ) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [status, setStatus] = useState(lead.status ?? "new");
  const [memo, setMemo] = useState(lead.memo ?? "");
  const [published, setPublished] = useState(!!lead.site_published_at);
  const [ovImg, setOvImg] = useState(lead.site_overrides?.hero_image ?? "");
  const [ovAccent, setOvAccent] = useState(lead.site_overrides?.accent ?? "");
  const [ovOffer, setOvOffer] = useState(lead.site_overrides?.offer ?? "");
  const [ovSub, setOvSub] = useState(lead.site_overrides?.sub ?? "");

  function copySignups(rows: NonNullable<Lead["signups"]>) {
    const csv =
      "이름,연락처,플랜,신청일\n" +
      rows
        .map((r) =>
          [r.name ?? "", r.contact, r.plan ?? "", r.created_at]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
    navigator.clipboard?.writeText(csv);
  }
  const [adImp, setAdImp] = useState(String(lead.ad_stats?.impressions ?? ""));
  const [adClk, setAdClk] = useState(String(lead.ad_stats?.clicks ?? ""));
  const [adVis, setAdVis] = useState(String(lead.ad_stats?.visits ?? ""));
  const [adConv, setAdConv] = useState(String(lead.ad_stats?.conversions ?? ""));
  const [adSpend, setAdSpend] = useState(String(lead.ad_stats?.spend ?? ""));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const chips: [string, string][] = [
    ["형태", L(LABEL.service, lead.service_type)],
    ["대상", L(LABEL.audience, lead.audience)],
    ["수익", L(LABEL.revenue, lead.revenue_model)],
    ["가격대", L(LABEL.price, lead.price_band)],
    ["대안", L(LABEL.alternative, lead.alternative)],
    ...(lead.region
      ? ([["상권", L(LABEL.region, lead.region)]] as [string, string][])
      : []),
    ["제작상황", L(LABEL.build, lead.build_status)],
  ];
  const report = lead.ai_report;
  const brief = lead.brief?.confirmed;
  const due = dDay(lead.deposit_due_at);
  const tierInfo =
    lead.tier === "engine" || lead.tier === "quick"
      ? TIER_INFO[lead.tier]
      : null;
  const prohibited = lead.policy_flag === "prohibited";

  function copyCode() {
    if (lead.access_code) navigator.clipboard?.writeText(lead.access_code);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* 헤더 — 고정 */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-border px-6 py-5">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-xl font-bold text-text">{lead.name}</p>
              {lead.utm_source === "youtube" && (
                <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                  유튜브
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              접수 {fmtKST(lead.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-tertiary transition hover:bg-bg-alt hover:text-text"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 — 여기만 스크롤 */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* 연락처 + 접근 코드 */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="rounded-lg border border-border bg-bg px-3 py-2 font-semibold text-accent transition hover:border-accent"
              >
                ☎ {lead.phone}
              </a>
            )}
            {lead.access_code && (
              <>
                <button
                  onClick={copyCode}
                  className="rounded-lg border border-border bg-bg px-3 py-2 font-mono font-bold text-text transition hover:border-accent"
                  title="코드 복사"
                >
                  🔑 {lead.access_code}
                </button>
                <a
                  href={`/d/${lead.access_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent"
                >
                  고객 화면 ↗
                </a>
              </>
            )}
          </div>

          {lead.brief?.confirmed && lead.access_code && (
            <div className="mt-1 rounded-lg border border-border bg-bg px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-text">
                  검증 사이트 (확정 브리프 자동 생성)
                </p>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  게시(광고 노출)
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={`/v/${lead.site_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent"
                >
                  실제 사이트 ↗
                </a>
                <a
                  href={`/v/${lead.site_token}?preview=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent"
                >
                  미리보기 ↗
                </a>
                {!published && (
                  <span className="rounded-lg bg-bg-alt px-3 py-1.5 text-xs text-text-tertiary">
                    미게시 — 방문자에겐 ‘곧 공개’로 보임
                  </span>
                )}
              </div>
              <div className="mt-3 border-t border-border-light pt-3">
                <p className="text-xs font-bold text-text-secondary">
                  전문가 폴리시 (게시 전 다듬기 · 비우면 브리프 그대로)
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    value={ovOffer}
                    onChange={(e) => setOvOffer(e.target.value)}
                    placeholder="헤드라인 덮어쓰기"
                    className="rounded-md border border-border bg-bg px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                  />
                  <input
                    value={ovSub}
                    onChange={(e) => setOvSub(e.target.value)}
                    placeholder="서브문구 덮어쓰기"
                    className="rounded-md border border-border bg-bg px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                  />
                  <input
                    value={ovImg}
                    onChange={(e) => setOvImg(e.target.value)}
                    placeholder="히어로 이미지 URL"
                    className="rounded-md border border-border bg-bg px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                  />
                  <input
                    value={ovAccent}
                    onChange={(e) => setOvAccent(e.target.value)}
                    placeholder="강조색 hex (예 #3182f6)"
                    className="rounded-md border border-border bg-bg px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-text-secondary">
                  사전등록 {lead.signups?.length ?? 0}건 (첫 고객 명단)
                </p>
                {lead.signups && lead.signups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => copySignups(lead.signups!)}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-bold text-text-secondary transition hover:border-accent"
                  >
                    명단 복사(CSV)
                  </button>
                )}
              </div>
              {lead.signups && lead.signups.length > 0 && (
                <ul className="mt-1.5 max-h-44 space-y-1 overflow-y-auto pr-1 text-xs">
                  {lead.signups.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 border-b border-border-light pb-1"
                    >
                      <span className="text-text-secondary">
                        {s.name || "(이름없음)"} ·{" "}
                        <b className="font-mono text-text">{s.contact}</b>
                      </span>
                      <span className="flex-shrink-0 text-text-tertiary">
                        {s.plan || ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {prohibited && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-600">
                정책 차단 리드 (설계서·결제 없음)
              </p>
              <p className="mt-1 text-xs text-red-500">
                광고 정책상 검증 불가 업종으로 분류됨. 카톡 문의가 오면 도구형
                서비스인지 확인 후 수동 진행 판단.
              </p>
            </div>
          )}

          {/* 입금 대기 카드 — brief 확정 + 미입금 */}
          {lead.brief_confirmed_at && !PAID_ONWARD.includes(lead.status) && (
            <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-accent">
                입금 대기 중
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <Row k="플랜·금액" v={tierInfo ? `${tierInfo.label} ${tierInfo.priceLabel}` : L(LABEL.tier, lead.tier)} strong />
                <Row k="입금자명" v={lead.name} strong />
                <Row k="계좌" v={`${BANK_INFO.bank} ${BANK_INFO.account}`} />
                <Row k="기한" v={due ? due.text : "-"} strong={due?.urgent} />
              </div>
              <p className="mt-2.5 text-xs text-text-tertiary">
                통장에서 입금자명 대조 후, 아래 상태를 <b className="text-accent">결제완료(paid)</b>로 바꾸면 고객 화면이 자동으로 다음 단계로 넘어갑니다.
              </p>
            </div>
          )}

          {/* 퀴즈 응답 */}
          <div className="grid grid-cols-3 gap-2">
            {chips.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-bg-alt px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  {k}
                </p>
                <p className="mt-0.5 text-[13px] font-bold text-text">{v}</p>
              </div>
            ))}
          </div>

          {/* 아이디어 + 좁힌 해석 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              아이디어
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-bg p-4 text-sm leading-relaxed text-text">
              {lead.idea}
            </p>
            {lead.idea_refined && (
              <p className="mt-1.5 rounded-lg bg-bg-alt px-3 py-2 text-xs text-text-secondary">
                좁힌 해석: {lead.idea_refined}
              </p>
            )}
            {lead.location && (
              <p className="mt-1 text-xs text-text-tertiary">
                지역: {lead.location}
              </p>
            )}
            {lead.page_url && (
              <p className="mt-1 text-xs text-text-tertiary">
                기존 페이지: {lead.page_url}{" "}
                {lead.page_measurable === false && (
                  <span className="font-bold text-red-500">
                    (측정 불가 플랫폼 — 엔진 불가)
                  </span>
                )}
              </p>
            )}
            {lead.tier === "engine" && (
              <p className="mt-1 text-xs">
                {lead.page_tag_verified_at ? (
                  <span className="font-bold text-emerald-500">
                    측정 연결 확인됨 ({fmtKST(lead.page_tag_verified_at)})
                  </span>
                ) : (
                  <span className="font-bold text-amber-500">
                    측정 스크립트 미설치 (고객 설치 대기)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* 확정 브리프 — 제작 작업대 */}
          {brief && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-accent">
                확정 브리프 (제작 기준)
              </p>
              <div className="mt-2.5 space-y-1.5 text-sm">
                <Row k="핵심 메시지" v={brief.offer} strong />
                <Row
                  k="표시 가격·플랜"
                  v={
                    brief.plans && brief.plans.length > 0
                      ? brief.plans
                          .map(
                            (p) =>
                              `${p.label} ${p.price.toLocaleString()}원${p.desc ? ` (${p.desc})` : ""}`,
                          )
                          .join(" / ")
                      : `${brief.price_value.toLocaleString()}원`
                  }
                  strong
                />
                <Row k="가칭" v={brief.name} strong />
                {brief.notes && (
                  <Row k="고객 강조 요청" v={brief.notes} strong />
                )}
                {brief.intake?.map((x, i) => (
                  <Row key={i} k={`점검·${x.q}`} v={x.a} strong />
                ))}
                <Row k="타깃" v={brief.target_line} />
                <Row k="문제" v={brief.problem_line} />
                {brief.pass_bar && <Row k="합격선" v={brief.pass_bar} />}
                {brief.min_sample && <Row k="최소 표본" v={brief.min_sample} />}
              </div>
              {brief.selling_points?.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[11px] font-bold text-text-tertiary">소구점 (광고 문구 재료)</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-text-secondary">
                    {brief.selling_points.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              )}
              {brief.excluded?.length > 0 && (
                <p className="mt-2 text-xs text-text-tertiary">
                  제외: {brief.excluded.join(" / ")}
                </p>
              )}
            </div>
          )}

          {/* AI 설계서 (확정 전 참고) */}
          {report && (
            <details className="rounded-lg border border-border bg-bg p-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-text-tertiary">
                AI 설계서 {report.source === "fallback" && "(규칙 기반 폴백)"}
              </summary>
              <div className="mt-2.5 space-y-2 text-sm">
                <Row k="이해" v={report.understanding_line} />
                <Row k="추천 채널" v={report.channel} />
                <Row k="합격선" v={report.pass_bar} />
                <Row k="핵심 리스크" v={report.top_risk} />
                <Row k="한계" v={report.blind_spot} />
              </div>
            </details>
          )}

          {/* 상태 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              상태 변경
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    status === s.key
                      ? "border-accent bg-bg-light text-text"
                      : "border-border bg-surface text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: s.dot }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-text-tertiary">
              결제완료·제작·광고·판정으로 바꾸면 고객 화면(/d)의 단계도 함께 바뀝니다.
            </p>
          </div>

          {/* 구글 애즈 실측 — 수동 입력 → 고객 대시보드 동기화 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              구글 애즈 실측 (고객 대시보드 동기화)
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["노출", adImp, setAdImp, "12420"],
                  ["광고 클릭", adClk, setAdClk, "398"],
                  ["사이트 방문", adVis, setAdVis, "320"],
                  ["전환(결제·예약)", adConv, setAdConv, "11"],
                  ["광고비(원)", adSpend, setAdSpend, "1530000"],
                ] as [string, string, (v: string) => void, string][]
              ).map(([label, val, set, ph]) => (
                <label key={label} className="block">
                  <span className="text-[11px] font-semibold text-text-tertiary">
                    {label}
                  </span>
                  <input
                    inputMode="numeric"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder={ph}
                    className="mt-1 w-full rounded-md border border-border bg-bg px-2.5 py-2 text-right font-mono text-sm outline-none transition focus:border-accent"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-tertiary">
              노출·광고클릭·방문·전환은 고객 코크핏 퍼널에 표시됩니다(방문·전환은
              비워두면 페이지 자동 측정값 사용). 광고비는 내부 전용(고객 화면 노출 안
              함). 비워두면 미변경.
              {lead.ad_stats?.updated_at && (
                <>
                  {" "}
                  · 마지막 입력{" "}
                  {new Date(lead.ad_stats.updated_at).toLocaleString("ko-KR")}
                </>
              )}
            </p>
          </div>

          {/* 메모 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              상담 메모
            </p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="상담 내용, 합격선 합의, 다음 액션 등"
              className="mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* 푸터 — 고정 */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface px-6 py-4">
          <button
            onClick={() => onDelete(lead.id, lead.name)}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-100"
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold text-text-secondary transition hover:text-text"
            >
              닫기
            </button>
            <button
              onClick={() =>
                onSave(
                  lead.id,
                  status,
                  memo,
                  {
                    impressions: adImp,
                    clicks: adClk,
                    visits: adVis,
                    conversions: adConv,
                    spend: adSpend,
                  },
                  published,
                  {
                    hero_image: ovImg,
                    accent: ovAccent,
                    offer: ovOffer,
                    sub: ovSub,
                  },
                )
              }
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-white transition hover:bg-accent-hover"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-accent/50 bg-accent/5"
          : "border-border bg-surface"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl font-bold tracking-tight ${
          highlight ? "text-accent" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex-shrink-0 text-text-tertiary">{k}</span>
      <span
        className={`text-right ${strong ? "font-bold text-text" : "text-text-secondary"}`}
      >
        {v}
      </span>
    </div>
  );
}
