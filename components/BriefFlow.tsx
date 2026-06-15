"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { BANK_INFO, type BriefDraft, type ConfirmedBrief } from "@/lib/diagnosis";
import { KAKAO_CHAT_URL } from "@/lib/site";
import { BrandMark, Wordmark } from "@/components/Brand";
import ValidationSite, { type ValidationSiteData } from "@/components/ValidationSite";

/* ─────────────────────────────────────────────────────────────
   고객 대시보드 + 브리프 확정 — 킥오프 통화의 무통화 대체물.
   AI가 초안을 만들고, 고객은 카드별로 승인하거나 수정만 한다.
   접근은 코드로만, 로그인 없음.
   ───────────────────────────────────────────────────────────── */

type Stage =
  | "brief"
  | "deposit"
  | "paid"
  | "build"
  | "live"
  | "verdict"
  | "closed";

interface PublicLead {
  name: string;
  /** 공개 측정 토큰 (광고 노출용 — 대시보드 키와 분리) */
  siteToken?: string | null;
  stage: Stage;
  tier: "engine" | "quick" | string;
  idea: string;
  ideaRefined: string | null;
  report: Record<string, unknown> | null;
  brief: {
    draft?: BriefDraft;
    confirmed?: ConfirmedBrief;
    /** 확정 시 잠긴 입금액(재검증 할인 반영). 입금 화면·관리자가 공유한다. */
    deposit_amount?: number;
    /** 재검증 할인율(있을 때만). */
    revalidation_rate?: number;
    /** 고객이 '입금했어요'를 누른 시각 — 운영자 확인 대기 표시용. */
    deposit_reported_at?: string;
  } | null;
  briefConfirmedAt: string | null;
  depositDueAt: string | null;
  /** 재검증 할인 — 동일 전화번호로 이전 검증 완료 건이 있을 때(브리프·입금 단계에서만 내려옴). */
  revalidation?: { eligible: true; priorCount: number; rate: number } | null;
  policyFlag: string;
  pageMeasurable: boolean | null;
  hasPageUrl: boolean;
  tagVerified: boolean;
  /** 광고 시작 후 실측 숫자 (금액 정보 없음) */
  stats?: {
    visits: number;
    clicks: number;
    payClicks: number;
    signups: number;
  } | null;
  /** 관리자가 입력한 구글애즈 실측 (광고비 제외). 방문·전환은 비면 0 → t.js 사용 */
  adStats?: {
    impressions: number;
    clicks: number;
    visits: number;
    conversions: number;
  } | null;
  /** 일자별 방문·결제 추세 (추세 차트용) */
  series?: { d: string; visits: number; pay: number }[] | null;
  passBar: { bar: string; reason: string; minSample: string };
  tiers: Record<
    "engine" | "quick",
    { label: string; price: number; priceLabel: string; desc: string }
  >;
  refundPolicy: readonly string[];
  /** 노출 우선 채널(운영자 폴리시 + 고객 페이지 수정) — 페이지 편집기가 '현재 라이브 상태'를 시드한다. */
  siteOverrides?: {
    hero_image?: string;
    accent?: string;
    offer?: string;
    sub?: string;
    credential?: string;
    intro_video?: string;
    prologue?: string;
    media?: string[];
    plans?: { label: string; price: number; desc?: string }[];
    selling_points?: string[];
    instructor_photo?: string;
  } | null;
  /** 광고 노출 중(게시됨)인지 — 편집 권한 배지 문구를 단계에 맞춘다. */
  sitePublished?: boolean;
}

const STAGES: { key: Stage[]; label: string }[] = [
  { key: ["brief"], label: "준비안 확정" },
  { key: ["deposit"], label: "입금" },
  { key: ["paid"], label: "제작 준비" },
  { key: ["build"], label: "제작" },
  { key: ["live"], label: "광고 집행" },
  { key: ["verdict", "closed"], label: "판정" },
];

export default function BriefFlow({ code }: { code: string }) {
  const [lead, setLead] = useState<PublicLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 입금 전, 확정한 브리프를 다시 열어 수정하는 모드
  const [editing, setEditing] = useState(false);
  // '입금했어요' 처리 중
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", code }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setLead(data.lead as PublicLead);
    } catch {
      setError(
        "코드를 찾을 수 없습니다. 코드를 다시 확인하시거나 카카오톡 채널로 알려주세요.",
      );
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  // '입금했어요' — 계좌이체를 끝낸 고객이 직접 알림. 운영자 확인 신호일 뿐
  // 자동 발송/자동 처리는 없다. 성공하면 화면이 '확인 중'으로 바뀐다.
  // cancel=true 면 오클릭/미이체 신고를 되돌린다(다시 입금 대기 화면으로).
  const reportDeposit = useCallback(
    async (cancel = false) => {
      setReporting(true);
      try {
        const res = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "report_deposit", code, cancel }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (data?.lead) setLead(data.lead as PublicLead);
        sendGAEvent("event", cancel ? "deposit_report_undo" : "deposit_reported", {});
      } catch {
        // 실패해도 흐름은 끊지 않는다 — 폴링이 곧 따라잡고, 카톡 문의 경로도 있다
      } finally {
        setReporting(false);
      }
    },
    [code],
  );

  // 단계가 바뀌면(브리프 확정→입금 등) 맨 위로 올린다.
  // 같은 컴포넌트 내 상태 전환이라 직전 화면 스크롤 위치가 남아, 입금액·계좌가
  // 있는 상단을 못 보고 바닥부터 보이는 버그를 막는다. 폴링(같은 stage)엔 안 뜀.
  useEffect(() => {
    if (lead?.stage) window.scrollTo({ top: 0, behavior: "instant" });
  }, [lead?.stage]);

  // 입금 대기~광고 집행 단계는 운영자가 상태를 바꾸면 화면이 따라오도록 폴링
  useEffect(() => {
    const s = lead?.stage;
    if (s !== "deposit" && s !== "paid" && s !== "build" && s !== "live") {
      return;
    }
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [lead?.stage, load]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="cold-panel rounded-lg p-8 text-center">
          <p className="text-base font-bold text-text">{error}</p>
        </div>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="cold-panel flex flex-col items-center rounded-lg p-10">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="mt-4 text-sm text-text-secondary">불러오는 중입니다</p>
        </div>
      </div>
    );
  }

  // 24시간 미입금 만료 — 입금했어요(신고) 전이고 기한이 지났으면 접근 차단(데이터는 보관)
  const expired =
    lead.stage === "deposit" &&
    !lead.brief?.deposit_reported_at &&
    !!lead.depositDueAt &&
    Date.now() > new Date(lead.depositDueAt).getTime();

  const content = (
    <>
      {(lead.stage === "brief" || editing) && (
        <BriefStep
          code={code}
          lead={lead}
          editing={editing}
          onDone={() => {
            setEditing(false);
            load();
          }}
          onCancelEdit={() => setEditing(false)}
        />
      )}
      {lead.stage === "deposit" && !editing && expired && <ExpiredNotice />}
      {lead.stage === "deposit" && !editing && !expired && (
        <DepositStep
          lead={lead}
          reporting={reporting}
          onReportDeposit={reportDeposit}
          onEdit={() => {
            setEditing(true);
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        />
      )}
      {(lead.stage === "paid" ||
        lead.stage === "build" ||
        lead.stage === "live" ||
        lead.stage === "verdict" ||
        lead.stage === "closed") && (
        <ProgressStep lead={lead} code={code} onReload={load} />
      )}
    </>
  );

  return (
    <div className="lg:flex">
      {/* ── 데스크탑 좌측 사이드바 (대시보드 네비) ── */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-border bg-surface px-5 py-6 lg:flex">
        <a href="/" className="flex items-center gap-2 text-[18px]">
          <BrandMark />
          <Wordmark />
        </a>
        <div className="mt-7">
          <p className="text-[15px] font-bold text-text">{lead.name}님</p>
          <p className="mt-0.5 text-[11px] text-text-tertiary">
            진행 코드 <b className="font-mono text-text-secondary">{code}</b>
          </p>
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
          진행 단계
        </p>
        <div className="mt-2.5">
          <StageRail stage={lead.stage} />
        </div>
        <div className="mt-auto space-y-2 pt-6">
          <a
            href={KAKAO_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition hover:brightness-95"
            style={{ background: "#FEE500", color: "#191600" }}
          >
            카카오톡 문의
          </a>
          <a
            href="/"
            className="block rounded-lg px-3 py-2 text-center text-xs font-semibold text-text-tertiary transition hover:text-text"
          >
            홈으로
          </a>
        </div>
      </aside>

      {/* ── 콘텐츠 영역 ── */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-7 sm:px-6 sm:py-9">
          {/* 모바일 상단 — 사이드바 대체 */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <BrandMark size={24} />
                <Wordmark className="text-base" />
              </a>
              <a
                href="/"
                className="text-xs font-semibold text-text-tertiary transition hover:text-text"
              >
                홈으로
              </a>
            </div>
            <header className="mt-4 cold-panel rounded-lg p-6">
              <p className="text-lg font-bold text-text">
                {lead.name}님의 검증 현황
              </p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                진행 코드{" "}
                <b className="font-mono text-text-secondary">{code}</b>
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                진행 현황이 바뀔 때마다 남겨주신 번호로 문자를 드립니다.
              </p>
              <StagePipeline stage={lead.stage} />
            </header>
          </div>

          {content}
        </div>
      </div>
    </div>
  );
}

/* 데스크탑 사이드바용 세로 진행 단계 네비 */
function StageRail({ stage }: { stage: Stage }) {
  const idx = STAGES.findIndex((s) => s.key.includes(stage));
  return (
    <nav className="space-y-0.5">
      {STAGES.map((s, i) => {
        const cur = i === idx;
        const past = i < idx;
        return (
          <div
            key={s.label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
              cur ? "bg-accent/10" : ""
            }`}
          >
            <span
              className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                past
                  ? "bg-accent text-white"
                  : cur
                    ? "border-2 border-accent text-accent"
                    : "border border-border text-text-tertiary"
              }`}
            >
              {past ? "✓" : i + 1}
            </span>
            <span
              className={`text-[13px] ${
                cur
                  ? "font-bold text-accent"
                  : past
                    ? "font-semibold text-text-secondary"
                    : "font-medium text-text-tertiary"
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function StagePipeline({ stage }: { stage: Stage }) {
  const idx = STAGES.findIndex((s) => s.key.includes(stage));
  return (
    <div className="mt-5 flex items-center gap-1">
      {STAGES.map((s, i) => (
        <div key={s.label} className="flex-1">
          <div
            className={`h-1.5 rounded-full ${
              i < idx ? "bg-accent/50" : i === idx ? "bg-accent" : "bg-bg-alt"
            }`}
          />
          <p
            className={`mt-1.5 text-center text-[10px] font-bold ${
              i === idx ? "text-accent" : "text-text-tertiary"
            }`}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ───────── 대표 인사 영상 (플레이스홀더 — 실제 영상으로 교체 예정) ───────── */

function FounderVideo() {
  // 화면을 가리지 않게 기본 접힘. 펼치면 90초 인사 영상.
  return (
    <details className="cold-panel overflow-hidden rounded-lg">
      <summary className="flex cursor-pointer items-center gap-3 px-5 py-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="text-sm font-bold text-text">
          대표 인사 영상 보기 (90초)
        </span>
        <span className="ml-auto text-xs text-text-tertiary">열기</span>
      </summary>
      <div className="border-t border-border">
        <div className="flex aspect-video items-center justify-center bg-bg-alt">
          <p className="text-xs text-text-tertiary">영상 준비 중입니다</p>
        </div>
        <p className="px-5 py-4 text-sm leading-relaxed text-text-secondary">
          통화 대신 이 화면에서 같은 내용을 확인하고 시작합니다. 검증용 사이트,
          광고 문구, 판정 리포트까지 대표가 직접 검토합니다.
        </p>
      </div>
    </details>
  );
}

/* 실제 검증용 사이트가 어떻게 보일지 라이브 미리보기 (플랜 입력 즉시 반영) */
function PagePreview({
  name,
  offer,
  plans,
}: {
  name: string;
  offer: string;
  plans: { label: string; price: number; desc: string }[];
}) {
  const title = offer.trim() || name.trim() || "여기에 한 줄 제목이 들어가요";
  const site = (name.trim() || "내서비스").replace(/\s/g, "").toLowerCase();
  const shown = plans.filter((p) => p.label.trim() || p.price > 0);
  const rows = shown.length ? shown : [{ label: "", price: 0, desc: "" }];
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold text-text-tertiary">
        전문가가 만들 검증용 사이트, 미리 보기 (초안 예시)
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_24px_-12px_rgba(10,23,38,0.14)]">
        <div className="flex items-center gap-1.5 border-b border-border-light bg-bg-alt px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="ml-2 truncate text-[10px] text-text-tertiary">
            {site}.kr
          </span>
        </div>
        <div className="p-4">
          <p className="text-[15px] font-extrabold leading-snug text-text">
            {title}
          </p>
          <div className="mt-3 space-y-2">
            {rows.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-alt px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-text">
                    {p.label.trim() || "플랜 이름"}
                  </p>
                  {p.desc.trim() && (
                    <p className="truncate text-[11px] text-text-tertiary">
                      {p.desc}
                    </p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight text-text">
                    {p.price > 0 ? p.price.toLocaleString() : "0"}원
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-white">
                    시작하기
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-text-tertiary">
        지금 보이는 건 초안 구성입니다. 결제 후 담당 전문가가 이미지·문구·디자인까지
        직접 다듬어 실제 검증 사이트를 완성합니다.
      </p>
    </div>
  );
}

/* ───────── 1단계: 브리프 확정 ───────── */

function BriefStep({
  code,
  lead,
  onDone,
  editing = false,
  onCancelEdit,
}: {
  code: string;
  lead: PublicLead;
  onDone: () => void;
  editing?: boolean;
  onCancelEdit?: () => void;
}) {
  const [draft, setDraft] = useState<BriefDraft | null>(
    lead.brief?.draft ?? null,
  );
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState(false);

  // 확정 폼 상태 — 고객이 확인/수정하는 건 핵심 3개(오퍼·가격·가칭)뿐.
  // 타깃·문제·소구점·제외는 전문가가 정한 내부 자료로 보관만 한다.
  const [offer, setOffer] = useState("");
  const [offerCustom, setOfferCustom] = useState(false); // "직접 쓸게요" 선택 여부
  // 플랜 1~3개 — 첫 플랜 가격이 대표 가격(price_value)이 된다. desc = 플랜 설명
  const [plans, setPlans] = useState<
    { label: string; price: number; desc: string }[]
  >([]);
  const [notes, setNotes] = useState(""); // 전문가에게 하고 싶은 말 (자유)
  // 페이지를 '진짜 운영 중인 강의'처럼 보이게 하는 고객 입력 (Skool식 about)
  const [credential, setCredential] = useState(""); // 강사 소개/실적 한 줄
  const [introVideo, setIntroVideo] = useState(""); // 소개 영상 URL(유튜브/비메오)
  const [prologue, setPrologue] = useState(""); // 강의 소개 본문(프롤로그)
  const [points, setPoints] = useState<string[]>([]); // 가치 포인트 3개(고객 편집)
  const [media, setMedia] = useState<string[]>([]); // 소개 이미지(썸네일) URL들
  const [instructorPhoto, setInstructorPhoto] = useState(""); // 강사/대표 사진(히어로 아바타) URL
  const [uploading, setUploading] = useState(false);
  // 전문가 사전 점검 — 질문별 복수 선택(칩) + 선택적 직접입력
  const [intakeSel, setIntakeSel] = useState<string[][]>([]);
  const [intakeEtcMode, setIntakeEtcMode] = useState<boolean[]>([]);
  const [intakeEtc, setIntakeEtc] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDraft = useCallback(async () => {
    setDrafting(true);
    setDraftError(false);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft", code }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setDraft(data.draft as BriefDraft);
    } catch {
      setDraftError(true);
    } finally {
      setDrafting(false);
    }
  }, [code]);

  useEffect(() => {
    if (!draft) fetchDraft();
  }, [draft, fetchDraft]);

  // 'AI 추천' — 고객이 누를 때만 AI가 문구 초안을 뽑아 채운다(수동 우선, 강제 아님).
  async function aiSuggest() {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai_draft", code }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()).draft as BriefDraft;
      // intake는 의도적으로 제거된 단계 — AI 추천이 되살리지 않게 빈 배열로 박는다.
      setDraft({ ...d, intake_questions: [] });
      if (d.offer_options?.[0]?.headline) {
        setOffer(d.offer_options[0].headline);
        setOfferCustom(false);
      }
      if (d.name_candidates?.[0]) setName(d.name_candidates[0]);
      if (d.selling_points?.length) setPoints(d.selling_points.slice(0, 3));
    } catch {
      /* 실패 시 조용히 — 다시 누르면 됨 */
    } finally {
      setAiLoading(false);
    }
  }

  // 초안 도착 시 프리필 (고객 편집 대상 3개만)
  useEffect(() => {
    if (!draft) return;
    setOffer((v) => v || draft.offer_options[0]?.headline || "");
    setPlans((v) =>
      v.length > 0 ? v : [{ label: "기본", price: draft.price_value, desc: "" }],
    );
    setName((v) => v || draft.name_candidates[0] || "");
    setPoints((v) => (v.length ? v : (draft.selling_points ?? []).slice(0, 3)));
  }, [draft]);

  // 수정 모드: 확정된 값으로 프리필 (초안 기본값 대신 고객이 정한 값). 1회만.
  const editPrefilled = useRef(false);
  useEffect(() => {
    if (!editing || editPrefilled.current) return;
    const c = lead.brief?.confirmed;
    if (!c) return;
    editPrefilled.current = true;
    setOffer(c.offer || "");
    if (c.plans && c.plans.length > 0) {
      setPlans(
        c.plans.map((p) => ({ label: p.label, price: p.price, desc: p.desc ?? "" })),
      );
    }
    setName(c.name || "");
    setNotes(c.notes || "");
    setCredential(c.credential || "");
    setIntroVideo(c.intro_video || "");
    setPrologue(c.prologue || "");
    setPoints(
      (c.selling_points ?? draft?.selling_points ?? []).slice(0, 3),
    );
    setMedia(c.media ?? []);
    setInstructorPhoto(c.instructor_photo ?? "");
    const inOptions = (draft?.offer_options ?? []).some(
      (o) => o.headline === c.offer,
    );
    if (c.offer && !inOptions) setOfferCustom(true);
    const qs = (draft?.intake_questions ?? []).slice(0, 3);
    if (c.intake && qs.length > 0) {
      const parsed = qs.map((q) => {
        const a = c.intake!.find((x) => x.q === q.key)?.a ?? "";
        const parts = a.split(",").map((s) => s.trim()).filter(Boolean);
        const sel = parts.filter((p) => q.suggestions.includes(p));
        const etc = parts.filter((p) => !q.suggestions.includes(p)).join(", ");
        return { sel, etc };
      });
      setIntakeSel(parsed.map((p) => p.sel));
      setIntakeEtc(parsed.map((p) => p.etc));
      setIntakeEtcMode(parsed.map((p) => p.etc.length > 0));
    }
  }, [editing, draft, lead.brief]);

  if (lead.policyFlag === "prohibited") {
    return (
      <div className="cold-panel rounded-lg p-6">
        <p className="text-base font-bold text-text">
          광고 정책상 검증 설계가 어려운 영역입니다
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          구글과 메타의 광고 정책상 이 업종은 광고 집행이 제한되어, 저희
          방식(광고 기반 수요 측정)으로는 정직한 검증을 드릴 수 없습니다.
          결제를 받지 않는 것이 맞다고 판단했습니다. 궁금한 점은 카카오톡
          채널로 문의해주세요.
        </p>
      </div>
    );
  }

  if (drafting || (!draft && !draftError)) {
    return (
      <div className="cold-panel flex flex-col items-center rounded-lg p-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent" />
        <p className="mt-5 text-sm font-semibold text-text-secondary">
          불러오는 중…
        </p>
      </div>
    );
  }

  if (draftError || !draft) {
    return (
      <div className="cold-panel rounded-lg p-6 text-center">
        <p className="text-sm text-text-secondary">
          초안 생성에 실패했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={fetchDraft}
          className="mt-4 rounded-md bg-accent px-6 py-3 text-sm font-bold text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  async function submit() {
    const cleanPlans = plans
      .map((p) => ({
        label: p.label.trim(),
        price: p.price,
        desc: p.desc.trim() || undefined,
      }))
      .filter((p) => p.label && p.price > 0);
    if (!offer.trim() || cleanPlans.length === 0 || !name.trim()) {
      setSubmitError(
        "핵심 메시지, 가격 플랜(이름과 가격), 서비스 이름을 확인해주세요.",
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    // 타깃·문제·소구점·제외는 전문가(AI 초안)가 정한 그대로 내부 보관
    const confirmed: ConfirmedBrief = {
      offer: offer.trim(),
      target_line: draft!.target_line,
      problem_line: draft!.problem_line,
      price_value: cleanPlans[0].price,
      plans: cleanPlans,
      notes: notes.trim() || undefined,
      credential: credential.trim() || undefined,
      instructor_photo: instructorPhoto.trim() || undefined,
      intro_video: introVideo.trim() || undefined,
      prologue: prologue.trim() || undefined,
      media: media.length ? media : undefined,
      intake: (() => {
        const qs = (draft!.intake_questions ?? []).slice(0, 3);
        const ans = qs
          .map((q, i) => ({
            q: q.key,
            a: [...(intakeSel[i] ?? []), (intakeEtc[i] ?? "").trim()]
              .filter(Boolean)
              .join(", "),
          }))
          .filter((x) => x.a);
        return ans.length > 0 ? ans : undefined;
      })(),
      selling_points: (() => {
        const cp = points.map((s) => s.trim()).filter(Boolean);
        return cp.length ? cp : draft!.selling_points;
      })(),
      name: name.trim(),
      excluded: draft!.excluded,
      // pass_bar / min_sample / shortfall_choice 는 서버(코드)가 채운다
    };
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", code, tier, confirmed }),
      });
      if (!res.ok) throw new Error(String(res.status));
      sendGAEvent("event", "brief_confirmed", { tier });
      onDone();
    } catch {
      setSubmitError("확정 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  async function uploadImage(
    file: File,
    target: "media" | "instructor" = "media",
  ) {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("code", code);
      const res = await fetch("/api/v/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.ok && data.url) {
        if (target === "instructor") setInstructorPhoto(data.url as string);
        else setMedia((m) => [...m, data.url as string]);
      }
    } catch {
      /* 업로드 실패 — 사용자가 다시 시도 */
    } finally {
      setUploading(false);
    }
  }

  const engineBlocked = lead.pageMeasurable === false;
  // 답변에 따라 진행 방식은 하나로 자동 결정된다 (고객이 고르지 않음).
  // 페이지가 있고(engine) 측정이 가능하면 엔진, 그 외엔 Quick.
  const tier: "engine" | "quick" =
    lead.tier === "engine" && !engineBlocked ? "engine" : "quick";
  // 입금액을 확정 단계에서 미리 보여준다(재검증 할인 반영) — '얼마인지 알고 동의'
  const listPrice = lead.tiers[tier].price;
  const revalRate = lead.revalidation?.eligible ? lead.revalidation.rate : 0;
  const finalAmount = Math.round(listPrice * (1 - revalRate));
  const isDiscounted = finalAmount < listPrice;

  // 확정 화면 = 실제 페이지 편집기. 입력 상태를 그대로 ValidationSite로 렌더하고
  // 글자·가격은 페이지 위에서 인라인 편집(같은 state에 양방향 반영).
  const previewIntent: ValidationSiteData["intent"] = /예약|신청|등록/.test(
    lead.passBar?.bar ?? "",
  )
    ? "reserve"
    : /문의/.test(lead.passBar?.bar ?? "")
      ? "inquiry"
      : "pay";
  const previewData: ValidationSiteData = {
    code: lead.siteToken ?? code,
    name: name.trim() || draft?.name_candidates[0] || "내 강의",
    offer: offer.trim() || draft?.offer_options[0]?.headline || "",
    targetLine: draft?.target_line || "",
    problemLine: draft?.problem_line || "",
    plans: plans.map((p) => ({ label: p.label, price: p.price, desc: p.desc })),
    sellingPoints: points,
    intent: previewIntent,
    credential: credential.trim() || undefined,
    introVideo: introVideo.trim() || undefined,
    prologue: prologue.trim() || undefined,
    media,
  };
  const editHandlers = {
    field: (k: "offer" | "credential" | "prologue", v: string) => {
      if (k === "offer") {
        setOffer(v);
        setOfferCustom(true);
      } else if (k === "credential") setCredential(v);
      else setPrologue(v);
    },
    plan: (i: number, k: "label" | "desc", v: string) =>
      setPlans((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p))),
    planPrice: (i: number, v: number) =>
      setPlans((ps) => ps.map((p, j) => (j === i ? { ...p, price: v } : p))),
    point: (i: number, v: string) =>
      setPoints((arr) => {
        const n = [...arr];
        while (n.length <= i) n.push("");
        n[i] = v;
        return n;
      }),
  };

  return (
    <div className="space-y-5">
      {/* 진짜 페이지 미리보기 = 편집기 (윅스/아임웹식: 글자를 눌러 바로 수정) */}
      <div className="cold-panel rounded-lg p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-text">내 강의 페이지</span>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
            점선 칸을 눌러 글자·가격 바로 수정
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="max-h-[68vh] overflow-y-auto">
            <ValidationSite data={previewData} edit={editHandlers} />
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-text-tertiary">
          지금 이 화면 그대로가 광고로 띄울 실제 페이지예요. 제목·소개·가격을
          눌러 직접 고치면 즉시 반영됩니다. 색·이미지·배치는 전문가가 다듬어
          드려요.
        </p>
      </div>

      {/* 대표 인사 영상 — 영상 준비되면 되살리기 */}
      {/* <FounderVideo /> */}

      {lead.revalidation?.eligible && (
        <div
          className="flex items-start gap-2.5 rounded-xl border bg-go-tint p-4"
          style={{ borderColor: "var(--go)" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--go)"
            strokeWidth="2.4"
            className="mt-0.5 flex-shrink-0"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <p className="text-sm leading-relaxed text-text-secondary">
            <b className="text-text">재검증 고객님</b>이라{" "}
            <b className="text-go">
              {Math.round(lead.revalidation.rate * 100)}% 할인
            </b>
            이 적용됩니다. 정확한 입금액은 확정 다음 화면에서 안내드립니다.
          </p>
        </div>
      )}

      {editing && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <p className="text-sm font-semibold text-text">
            수정 중입니다. 입금 전이라 자유롭게 고치실 수 있습니다.
          </p>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-shrink-0 text-xs font-bold text-text-tertiary underline-offset-2 transition hover:text-text hover:underline"
            >
              취소
            </button>
          )}
        </div>
      )}

      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">
          {editing
            ? "확정 내용을 고치고 계십니다"
            : "광고로 띄울 페이지를 직접 구성해주세요"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          아래 내용을 직접 채워주시면 그대로{" "}
          <b className="text-text">검증용 사이트(실제 서비스처럼 보이는 한 장짜리
          웹사이트)와 광고</b>에 들어가고, 담당 검증 전문가가 더 잘 눌리도록
          다듬어 드립니다. 막막하시면 아래 ‘AI 추천’으로 초안을 받아 고치셔도
          됩니다.
        </p>
        <button
          type="button"
          onClick={aiSuggest}
          disabled={aiLoading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-[13px] font-bold text-text-secondary transition hover:border-accent/60 hover:text-accent disabled:opacity-60"
        >
          {aiLoading ? "AI가 문구를 뽑는 중…" : "✨ AI 추천 받기 (문구·이름)"}
        </button>
      </div>


      {/* 전문가 사전 점검 — AI가 빌드에 비는 것만 골라 되물음 (보기 미리 채움) */}
      {draft.intake_questions && draft.intake_questions.length > 0 && (
        <Card label="전문가 사전 점검">
          <p className="mb-3 text-xs leading-relaxed text-text-tertiary">
            담당 전문가가 수강신청 페이지·광고를 더 정확히 만들기 위해, 이
            강의에서 아직 모르는 것만 추려서 여쭤봐요. 해당되는 걸 다 고르셔도
            되고(여러 개 가능), 직접 적으셔도 돼요. 건너뛰셔도 됩니다.
          </p>
          <div className="space-y-4">
            {draft.intake_questions.slice(0, 3).map((q, i) => (
              <div key={i}>
                <p className="text-[13px] font-bold text-text">{q.question}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.suggestions.map((s) => {
                    const on = (intakeSel[i] ?? []).includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setIntakeSel((sel) => {
                            const n = sel.map((x) => x ?? []);
                            while (n.length <= i) n.push([]);
                            n[i] = on
                              ? n[i].filter((x) => x !== s)
                              : [...n[i], s];
                            return n;
                          })
                        }
                        className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                          on
                            ? "border-accent bg-accent/10 text-text"
                            : "border-border bg-surface-light text-text-secondary hover:border-accent/60"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setIntakeEtcMode((c) => {
                        const n = [...c];
                        while (n.length <= i) n.push(false);
                        n[i] = !n[i];
                        return n;
                      })
                    }
                    className={`rounded-full border border-dashed px-3.5 py-2 text-[13px] font-semibold transition ${
                      intakeEtcMode[i]
                        ? "border-accent text-text"
                        : "border-border text-text-tertiary hover:border-accent/60"
                    }`}
                  >
                    + 직접 입력
                  </button>
                </div>
                {intakeEtcMode[i] && (
                  <input
                    autoFocus
                    value={intakeEtc[i] ?? ""}
                    onChange={(e) =>
                      setIntakeEtc((a) => {
                        const n = [...a];
                        while (n.length <= i) n.push("");
                        n[i] = e.target.value;
                        return n;
                      })
                    }
                    maxLength={80}
                    placeholder="직접 적어주세요 (위 선택과 함께 반영돼요)"
                    className={`${inputBase} mt-2 text-[13px]`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 1. 오퍼 핵심 문구 — 고객이 직접 입력(막막하면 위 'AI 추천') */}
      <Card label="광고와 사이트에 들어갈 한 줄 제목" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          사람들이 가장 먼저 보게 될 한 줄입니다. 직접 적어주세요(막막하면 위
          ‘AI 추천’을 누르세요). 그대로 확정되는 게 아니라, 담당 전문가가
          반응이 가장 좋게 다듬어 최종 결정합니다.
        </p>
        <div className="space-y-2">
          {draft.offer_options.map((o) => {
            const selected = !offerCustom && offer === o.headline;
            return (
              <button
                key={o.headline}
                type="button"
                onClick={() => {
                  setOffer(o.headline);
                  setOfferCustom(false);
                }}
                className={`w-full rounded-md border px-4 py-3 text-left transition ${
                  selected
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface-light hover:border-accent/60"
                }`}
              >
                <span className="block text-[15px] font-semibold text-text">
                  {o.headline}
                </span>
                <span className="mt-0.5 block text-xs text-text-tertiary">
                  {o.angle}
                </span>
              </button>
            );
          })}
          {offerCustom ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                maxLength={60}
                className={`${inputBase} mt-0`}
                placeholder="한 줄로 직접 적어주세요"
              />
              <button
                type="button"
                onClick={() => {
                  setOfferCustom(false);
                  setOffer(draft.offer_options[0]?.headline ?? "");
                }}
                className="text-xs font-medium text-text-tertiary transition hover:text-text"
              >
                ← 후보에서 고를게요
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOfferCustom(true);
                setOffer("");
              }}
              className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-[15px] font-semibold text-text-secondary transition hover:border-accent/60"
            >
              직접 쓸게요
            </button>
          )}
        </div>
      </Card>

      {/* 2. 표시 가격 · 플랜 — 고객이 직접 구성 (1~3개) */}
      <Card label="검증 페이지에 표시할 가격 · 플랜" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          {draft.price_rationale}
        </p>
        <div className="space-y-3">
          {plans.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-surface-light p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={p.label}
                  onChange={(e) =>
                    setPlans((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                  maxLength={16}
                  placeholder="플랜 이름 (예: 베이직)"
                  className={`${inputBase} mt-0 min-w-0 flex-1`}
                />
                <input
                  type="number"
                  value={p.price || ""}
                  onChange={(e) =>
                    setPlans((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, price: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  min={100}
                  step={100}
                  className={`${inputBase} mt-0 w-24 min-w-0 shrink text-right font-mono sm:w-32`}
                />
                <span className="text-sm font-bold text-text">원</span>
                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPlans((arr) => arr.filter((_, j) => j !== i))
                    }
                    aria-label="플랜 삭제"
                    className="px-1 text-lg leading-none text-text-tertiary transition hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                value={p.desc}
                onChange={(e) =>
                  setPlans((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, desc: e.target.value } : x,
                    ),
                  )
                }
                maxLength={60}
                placeholder="이 플랜을 설명해주세요 (선택 · 예: 크레딧 1,600 + 전 상품 이용)"
                className={`${inputBase} mt-2 text-[13px]`}
              />
            </div>
          ))}
        </div>
        {plans.length < 3 && (
          <button
            type="button"
            onClick={() =>
              setPlans((arr) => [...arr, { label: "", price: 0, desc: "" }])
            }
            className="mt-2 text-sm font-semibold text-accent transition hover:underline"
          >
            + 플랜 추가
          </button>
        )}
        <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
          단건 옵션을 여러 개 보여주거나 구독 플랜을 나눠도 됩니다. 플랜마다
          포함 내용을 적으면 그대로 사이트에 보여드립니다. 어떤 플랜이 많이
          눌리는지도 같이 측정해 드립니다.
        </p>
      </Card>

      {/* 3. 가칭 */}
      <Card label="검증용 강의 이름" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          검증에만 쓰는 임시 이름이에요. 정식 오픈할 진짜 이름과 달라도 전혀
          상관없습니다. 지금 중요한 건 이름이 아니라, 이 강의에 사람들이
          돈을 내느냐니까요.
        </p>
        <div className="flex flex-wrap gap-2">
          {draft.name_candidates.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setName(n)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                name === n
                  ? "border-accent bg-accent/10 text-text"
                  : "border-border bg-surface-light text-text-secondary hover:border-accent/60"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className={inputBase}
          placeholder="직접 정하셔도 됩니다"
        />
      </Card>

      {/* 진행 방식 — 답변에 따라 하나로 자동 결정 (고객이 고르지 않음) */}
      <Card label="진행 방식 (답변에 맞춰 자동 결정)">
        {(() => {
          const info = lead.tiers[tier];
          const isEngine = tier === "engine";
          const bullets = [
            isEngine
              ? "이미 갖고 계신 페이지에 측정 장치를 붙입니다"
              : "실제 서비스처럼 보이는 검증용 사이트를 전문가가 직접 만듭니다",
            "실제 구글·메타 광고로 모르는 사람 수백 명을 데려옵니다 (광고비 포함)",
            "누가 들어와서 결제 버튼까지 눌렀는지 숫자로 집계합니다",
            "신청 당일 시작, 보통 2~3일 안에 살 사람이 있는지, 될 사업인지 판정해 드립니다",
          ];
          const why = isEngine
            ? "페이지를 이미 갖고 계셔서, 페이지 제작은 빼고 측정·광고·판정만 진행하는 방식입니다."
            : engineBlocked
              ? "입력하신 페이지는 측정 장치를 붙일 수 없는 플랫폼이라, 검증용 사이트부터 저희가 새로 만듭니다."
              : "보여줄 페이지가 아직 없으셔서, 검증용 사이트 제작부터 전부 저희가 맡습니다.";
          return (
            <div className="rounded-xl border-2 border-accent bg-accent/5 p-5 shadow-[0_8px_24px_-12px_var(--accent-glow)]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-bold text-text">
                  {info.label}
                </span>
                <span className="text-right">
                  {isDiscounted && (
                    <span className="mr-1.5 text-base font-semibold text-text-tertiary line-through">
                      {info.priceLabel}
                    </span>
                  )}
                  <span className="text-2xl font-extrabold tracking-tight text-text">
                    {finalAmount.toLocaleString()}원
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                {why} 답변에 맞춰 자동으로 정해졌고, 광고비까지 포함된 금액입니다.
                {isDiscounted
                  ? ` 재검증 ${Math.round(revalRate * 100)}% 할인이 적용된 실제 입금액입니다.`
                  : ""}
              </p>
              <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[13px] leading-relaxed text-text-secondary"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-accent">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </Card>

      {/* 강의 소개 — Skool식 about처럼 '진짜 운영 중인 강의'로 보이게 (선택, 전부 고객 입력) */}
      <Card label="강의 소개 페이지 꾸미기 (선택)">
        <p className="mb-3 text-xs leading-relaxed text-text-tertiary">
          검증 페이지를 실제로 열려 있는 강의처럼 보이게 하는 요소예요. 적으신
          그대로 페이지에 들어가고, 비워두면 기본형으로 나갑니다.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              강사 · 대표 사진 (선택)
            </label>
            <div className="flex items-center gap-3">
              {instructorPhoto ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={instructorPhoto}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setInstructorPhoto("")}
                    className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full bg-text/70 text-[11px] font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <span className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-full bg-accent/10 text-[20px] font-black text-accent">
                  {(name || "·").trim().slice(0, 1)}
                </span>
              )}
              <label className="cursor-pointer rounded-lg border border-dashed border-border px-4 py-2 text-[12px] font-semibold text-text-tertiary transition hover:border-accent/60 hover:text-accent">
                {uploading
                  ? "올리는 중…"
                  : instructorPhoto
                    ? "사진 바꾸기"
                    : "+ 사진 올리기"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f, "instructor");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              페이지 맨 위 강사 프로필에 동그랗게 들어갑니다. 없으면 이름 첫 글자
              기본 아바타로 나가요. (소개 이미지와는 다른 자리예요.)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              강사 소개 한 줄 (실적·경력)
            </label>
            <input
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              maxLength={80}
              placeholder="예: 구독 1.2만 유튜버 · 노션 5년차 · 수강생 300명"
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              소개 영상 (유튜브·비메오 링크)
            </label>
            <input
              value={introVideo}
              onChange={(e) => setIntroVideo(e.target.value)}
              maxLength={200}
              inputMode="url"
              placeholder="예: https://youtu.be/xxxxxxxx"
              className={inputBase}
            />
            <p className="mt-1 text-[11px] text-text-tertiary">
              링크만 붙이면 페이지 상단에 영상이 박힙니다.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              소개 이미지 (썸네일 여러 장)
            </label>
            <div className="flex flex-wrap gap-2">
              {media.map((url, i) => (
                <div
                  key={i}
                  className="relative h-16 w-24 overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMedia((m) => m.filter((_, j) => j !== i))}
                    className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-text/70 text-[11px] font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="grid h-16 w-24 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-center text-[12px] font-semibold text-text-tertiary transition hover:border-accent/60 hover:text-accent">
                {uploading ? "올리는 중…" : "+ 이미지"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              강의 화면·결과물·후기 캡처 등을 올리면 페이지에 갤러리로 보입니다. (장당 최대 5MB)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              강의 소개 (프롤로그)
            </label>
            <textarea
              value={prologue}
              onChange={(e) => setPrologue(e.target.value)}
              maxLength={1500}
              rows={4}
              placeholder="누구를 위한 강의인지, 뭘 배워가는지, 왜 당신이 가르치는지 편하게 적어주세요. 줄을 바꾸면 문단이 나뉩니다."
              className={`${inputBase} min-h-[96px] resize-y leading-relaxed`}
            />
          </div>
        </div>
      </Card>

      {/* 그 외 한마디 — 자유 입력(가볍게, 맨 끝). 위 점검과 안 겹치게 '그 외'로 한정 */}
      <Card label="그 외 더 전하고 싶은 말 (선택)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="위에서 못 담은 게 있으면 편하게 적어주세요. 담당 전문가가 하나하나 직접 읽어보고 반영합니다. (비워두셔도 됩니다)"
          className={`${inputBase} min-h-[76px] resize-y leading-relaxed`}
        />
      </Card>

      {/* 판정 기준 — 정보로만 (고객 의사결정 없음) */}
      <details className="cold-panel rounded-lg p-5">
        <summary className="cursor-pointer text-sm font-bold text-text-secondary">
          판정은 어떻게 하나요?
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary">
          <p>
            <b className="text-text">{lead.passBar.bar}</b>을 기준으로
            객관적으로 판정합니다. {lead.passBar.reason} 표본이 부족하면 비율로
            환산하거나 1~2일 연장해서 채운 뒤 판정합니다.
          </p>
          <p>
            이 기준은 광고를 시작하기 전에 고정되고, 데이터를 본 뒤에는 저희도
            바꾸지 않습니다. 그래야 판정이 공정하기 때문입니다.
          </p>
        </div>
      </details>

      {/* 환불 규정 — 정보로만 */}
      <details className="cold-panel rounded-lg p-5">
        <summary className="cursor-pointer text-sm font-bold text-text-secondary">
          환불 규정
        </summary>
        <ul className="mt-3 space-y-1.5">
          {lead.refundPolicy.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {r}
            </li>
          ))}
        </ul>
      </details>

      {submitError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="w-full rounded-md bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting
          ? "저장 중..."
          : editing
            ? "수정 내용 저장하기"
            : `${finalAmount.toLocaleString()}원으로 검증 시작하기`}
      </button>
      <p className="text-center text-xs text-text-tertiary">
        {editing
          ? "고친 내용으로 다시 저장됩니다. 입금 전까지는 언제든 또 고치실 수 있습니다."
          : "확정하시면 담당 검증 전문가가 보통 1~2시간 안에(영업시간 기준) 설계를 직접 검토합니다. 문제가 없으면 그대로 진행하고, 보완할 점이 보이면 먼저 연락드립니다."}
      </p>
      <p className="text-center text-xs text-text-tertiary">
        다음 화면에서 입금 계좌를 안내드립니다 · 입금 전에는 비용이 발생하지
        않고, 입금 후에도 제작 착수 전 취소는 전액 환불됩니다
      </p>
      <p className="text-center text-xs text-text-tertiary">
        궁금한 점은{" "}
        <a
          href={KAKAO_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-text underline underline-offset-2"
        >
          카카오톡 채널
        </a>
        로 물어보세요.
      </p>
    </div>
  );
}

/* ───────── 2단계: 입금 안내 ───────── */

function CopyButton({
  value,
  label,
  full = false,
  onCopied,
}: {
  value: string;
  label: string;
  full?: boolean;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          onCopied?.();
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* 클립보드 권한 없으면 조용히 무시 — 번호는 화면에 그대로 보인다 */
        }
      }}
      className={`flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 text-xs font-bold text-accent transition hover:bg-accent/20 active:scale-95 ${
        full
          ? "mt-3 w-full justify-center px-4 py-3 text-sm"
          : "flex-shrink-0 px-3 py-2"
      }`}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          복사됨
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <rect x="9" y="9" width="11" height="11" rx="2.5" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          {full ? label : "복사"}
        </>
      )}
    </button>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold leading-relaxed text-text">
        {value}
      </dd>
    </div>
  );
}

/* 24시간 미입금 만료 — 접근 차단 + 재신청 (데이터는 보관) */
function ExpiredNotice() {
  return (
    <div className="cold-panel rounded-lg p-6 text-center sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bg-alt text-2xl">
        ⏳
      </div>
      <p className="mt-5 text-xl font-extrabold text-text">
        검증 신청이 만료됐어요
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        24시간 안에 입금이 확인되지 않아 이 페이지는 잠겼습니다. 작성하신 내용은
        저장돼 있으니, 다시 신청하시면 이어서 빠르게 시작할 수 있어요.
      </p>
      <a
        href="/start"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover"
      >
        다시 신청하기
      </a>
      <p className="mt-3 text-xs text-text-tertiary">
        문의는{" "}
        <a
          href={KAKAO_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          카카오톡 채널
        </a>
        로 남겨주세요.
      </p>
    </div>
  );
}

/* 입금 마감 실시간 카운트다운 — 압박 + 관리 */
function Countdown({ due }: { due: string | null }) {
  const [left, setLeft] = useState<number>(() =>
    due ? new Date(due).getTime() - Date.now() : 0,
  );
  useEffect(() => {
    if (!due) return;
    const t = setInterval(
      () => setLeft(new Date(due).getTime() - Date.now()),
      1000,
    );
    return () => clearInterval(t);
  }, [due]);
  if (!due) return null;
  const s = Math.max(0, Math.floor(left / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const urgent = s < 3 * 3600; // 3시간 미만이면 빨간 경고
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
      style={{ background: urgent ? "var(--nogo-tint)" : "var(--pivot-tint)" }}
    >
      <p
        className="text-[14px] font-extrabold tabular-nums"
        style={{ color: urgent ? "var(--nogo)" : "var(--pivot)" }}
      >
        ⏰ 입금 마감까지 {hh}:{mm}:{ss}
      </p>
      <p className="text-[12px] font-semibold text-text-secondary">
        지나면 이 페이지는 사라져요
      </p>
    </div>
  );
}

function DepositStep({
  lead,
  onEdit,
  reporting = false,
  onReportDeposit,
}: {
  lead: PublicLead;
  onEdit?: () => void;
  reporting?: boolean;
  onReportDeposit?: (cancel?: boolean) => void;
}) {
  const tier = lead.tiers[lead.tier === "engine" ? "engine" : "quick"];
  const confirmed = lead.brief?.confirmed;
  // 확정 시 잠긴 입금액(재검증 할인 반영). 없으면 정가. 절대 정가를 넘지 않게 가드.
  const listPrice = tier.price;
  const lockedAmount = lead.brief?.deposit_amount;
  const payAmount =
    typeof lockedAmount === "number" && lockedAmount > 0
      ? Math.min(lockedAmount, listPrice)
      : listPrice;
  const discounted = payAmount < listPrice;
  const discountPct = discounted
    ? Math.round((1 - payAmount / listPrice) * 100)
    : 0;
  // 고객이 '입금했어요'를 눌렀는지 — 누른 뒤엔 '확인 중' 화면으로 바꾼다.
  const depositReported = !!lead.brief?.deposit_reported_at;
  const due = lead.depositDueAt
    ? new Date(lead.depositDueAt).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : null;

  // 입금 화면 진입 측정 — 확정→입금화면→입금했어요 퍼널에서 최대 누수 구간을 잡는다
  useEffect(() => {
    sendGAEvent("event", "deposit_view", {
      tier: lead.tier,
      amount: payAmount,
      discounted,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <Countdown due={lead.depositDueAt} />
      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">
          준비안이 확정됐습니다. 입금만 남았습니다.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          입금이 확인되면 신청 당일 곧바로 검증 준비가 시작되고, 진행 상황은 이
          페이지에서 계속 보실 수 있습니다.
        </p>

        {lead.siteToken && (
          <a
            href={`/v/${lead.siteToken}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-bg-light p-4 transition hover:border-accent hover:bg-accent/10"
          >
            <div>
              <p className="text-[14px] font-bold text-text">
                내 강의 페이지 미리보기 ↗
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary">
                방금 만든 당신 강의 페이지예요. 입금하면 여기에 진짜 광고를 켭니다.
              </p>
            </div>
            <span className="flex-shrink-0 text-lg font-bold text-accent" aria-hidden>
              →
            </span>
          </a>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 text-left transition hover:border-accent hover:bg-accent/10"
          >
            <span>
              <span className="block text-[14px] font-bold text-accent">
                ✎ 페이지 내용 수정하기
              </span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-text-secondary">
                문구·표시 가격·강사 사진·소개 이미지까지 입금 전까지 언제든 고칠 수 있어요.
              </span>
            </span>
            <span className="flex-shrink-0 text-lg font-bold text-accent" aria-hidden>
              →
            </span>
          </button>
        )}

        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/[0.05] p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-text-secondary">
              {tier.label}
            </span>
            <span className="text-right">
              {discounted && (
                <span className="mr-2 text-base font-semibold text-text-tertiary line-through">
                  {listPrice.toLocaleString()}원
                </span>
              )}
              <span className="text-[26px] font-extrabold tracking-tight text-text">
                {payAmount.toLocaleString()}원
              </span>
            </span>
          </div>
          {discounted && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-go-tint px-3 py-2 text-xs font-bold text-go">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              재검증 고객 {discountPct}% 할인이 적용된 금액입니다
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-text-tertiary">입금 계좌</p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-base font-bold text-text">
                  {BANK_INFO.bank} {BANK_INFO.account}
                </p>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  예금주 {BANK_INFO.holder}
                </p>
              </div>
              <CopyButton
                value={BANK_INFO.account.replace(/\D/g, "")}
                label="계좌번호 복사"
              />
            </div>
          </div>

          <div
            className="mt-3 rounded-2xl px-4 py-3"
            style={{ background: "var(--pivot-tint)" }}
          >
            <p
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{ color: "var(--pivot)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              입금자명
            </p>
            <p className="mt-1 text-sm font-bold text-text">
              반드시{" "}
              <span style={{ color: "var(--pivot)" }}>&ldquo;{lead.name}&rdquo;</span>{" "}
              으로 입금해주세요
            </p>
          </div>

          {due && (
            <div className="mt-3 flex items-center justify-between px-1 text-sm">
              <span className="text-text-tertiary">입금 기한</span>
              <span className="font-bold text-text">{due}</span>
            </div>
          )}

          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            비즈필터는 개인사업자 &lsquo;득템잡이&rsquo;(대표 이민제)가 운영하는
            브랜드라 예금주가 위와 같이 표시됩니다.
          </p>
        </div>

        {/* 이체 3단계 안내 — 수동 이체는 화면 밖(은행앱)에서 일어나므로
            복사→이체→복귀 동선을 명시해 '이체했는데 신고 안 함' 이탈을 막는다 */}
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-bold text-text">이렇게 이체하시면 됩니다</p>
          <ol className="mt-3 space-y-2">
            {[
              "아래 버튼으로 계좌·금액·입금자명을 한 번에 복사하세요.",
              "쓰시는 은행 앱에 붙여넣어 이체합니다 (계좌이체는 24시간 가능).",
              "이 화면으로 돌아와 아래 ‘입금했어요’를 눌러주세요.",
            ].map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-text-secondary">
                  {s}
                </span>
              </li>
            ))}
          </ol>
          <CopyButton
            full
            value={`${BANK_INFO.bank} ${BANK_INFO.account} / ${payAmount.toLocaleString()}원 / 입금자명 ${lead.name}`}
            label="계좌·금액·입금자명 한 번에 복사"
            onCopied={() => sendGAEvent("event", "deposit_copy", { tier: lead.tier })}
          />
        </div>

        {/* 입금했어요 — 계좌이체를 끝낸 고객이 직접 누르는 자가 알림.
            자동 발송/자동 처리는 없고, 운영자 확인을 위한 신호일 뿐이다. */}
        {depositReported ? (
          <div
            className="mt-4 rounded-xl border bg-go-tint p-5"
            style={{ borderColor: "var(--go)" }}
          >
            <p className="flex items-center gap-2 text-sm font-bold text-go">
              <span className="h-2 w-2 animate-pulse rounded-full bg-go" />
              입금을 확인하고 있습니다
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              담당자가 영업시간 기준{" "}
              <b className="text-text">2시간 안에</b> 입금을 확인한 뒤, 남겨주신
              번호로 문자를 보내드립니다. 이 화면은 닫으셔도 되고, 확인이 끝나면
              다음 단계로 자동으로 바뀝니다.
            </p>
            {/* 무엇을 보냈어야 하는지 재확인 (오클릭/금액 착오 구제) */}
            <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-text">{payAmount.toLocaleString()}원</span>
              {" · "}
              {BANK_INFO.bank} {BANK_INFO.account}
              {" · 입금자명 "}
              <span className="font-semibold text-text">{lead.name}</span>
            </div>
            <button
              type="button"
              disabled={reporting || !onReportDeposit}
              onClick={() => onReportDeposit?.(true)}
              className="mt-2.5 text-xs font-semibold text-text-tertiary underline underline-offset-2 transition hover:text-text disabled:opacity-50"
            >
              아직 이체 전인데 잘못 눌렀어요 — 되돌리기
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              disabled={reporting || !onReportDeposit}
              onClick={() => onReportDeposit?.(false)}
              className="w-full rounded-xl bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover disabled:opacity-50"
            >
              {reporting ? "전송 중..." : "입금했어요"}
            </button>
            <p className="mt-2 text-center text-xs leading-relaxed text-text-tertiary">
              위 계좌로{" "}
              <b className="text-text-secondary">
                {payAmount.toLocaleString()}원
              </b>{" "}
              이체를 <b className="text-text-secondary">끝내신 다음</b> 눌러주세요.
              담당자가 영업시간 기준 2시간 안에 입금을 확인하고, 남겨주신 번호로
              문자를 드립니다.
            </p>
          </div>
        )}

        {/* 신뢰 스트립 — 입금 직전, 우리가 실제로 가진 약속을 적시에 */}
        <div className="mt-4 grid gap-2.5 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
          {[
            "실명·얼굴 공개한 팀이 직접 운영",
            "판정 못 드리면 전액 환불 · 제작 착수 전 취소도 전액 (이후 단계별, 아래 규정)",
            "검증용 사이트·데이터 전부 고객님 자산",
          ].map((t) => (
            <div
              key={t}
              className="flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-text-secondary"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                className="mt-0.5 flex-shrink-0"
                aria-hidden
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {t}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-bg-alt/60 p-5">
          <p className="text-sm font-bold text-text">입금 후 진행 순서</p>
          <ol className="mt-3 space-y-3">
            {[
              "담당 검증 전문가가 확정하신 준비안을 직접 검토합니다 (보통 1~2시간, 영업시간 기준). 문제가 없으면 그대로 진행하고, 보완할 점이 보이면 먼저 연락드립니다.",
              "입금이 확인되면 남겨주신 번호로 문자를 보내드리고, 이 화면도 다음 단계로 바뀝니다.",
              "이 페이지는 닫으셔도 됩니다. 진행 코드로 언제든 다시 들어와 현황을 보실 수 있고, 현황이 바뀔 때마다 문자를 드립니다.",
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-text-secondary">
                  {s}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-border pt-3 text-xs text-text-tertiary">
            세금계산서나 현금영수증이 필요하시면 카카오톡 채널로 알려주세요.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <a
            href="/"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3.5 text-center text-sm font-bold text-text-secondary transition hover:border-border-hover hover:text-text"
          >
            홈으로
          </a>
          <a
            href="/d"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3.5 text-center text-sm font-bold text-text-secondary transition hover:border-border-hover hover:text-text"
          >
            내 검증 현황
          </a>
        </div>
      </div>

      {/* 측정 연결(엔진)은 결제 후로 — 입금 화면은 입금에만 집중시킨다.
          설치 카드는 제작 준비/제작 단계(ProgressStep)에서 노출된다. */}

      {/* 입금 후 열리는 대시보드 미리보기 — "여기서 실시간으로 본다"를 미리 각인 */}
      <Cockpit lead={lead} preview />
      <VerdictSample />

      {confirmed && (
        <details className="cold-panel rounded-lg p-5">
          <summary className="cursor-pointer text-sm font-bold text-text-secondary">
            확정 내용 보기
          </summary>
          <dl className="mt-3 space-y-3">
            <ConfirmRow label="핵심 메시지" value={confirmed.offer} />
            <ConfirmRow label="표시 가격·플랜" value={planText(confirmed)} />
            <ConfirmRow label="임시 이름" value={confirmed.name} />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            입금 전까지는 위 ‘페이지 내용 수정하기’에서 문구·가격·강사 사진까지
            언제든 고치실 수 있습니다. 입금 후에는 담당 전문가가 검토를 시작합니다.
          </p>
        </details>
      )}

      <details className="cold-panel rounded-lg p-5">
        <summary className="cursor-pointer text-sm font-bold text-text-secondary">
          환불 규정
        </summary>
        <ul className="mt-3 space-y-1.5">
          {lead.refundPolicy.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {r}
            </li>
          ))}
        </ul>
      </details>

      <a
        href={KAKAO_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition hover:brightness-95"
        style={{ background: "#FEE500", color: "#191600" }}
      >
        입금 관련 문의 (카카오톡)
      </a>
    </div>
  );
}

/* ───────── 3단계 이후: 진행 현황 ───────── */

const PROGRESS_COPY: Record<string, { title: string; desc: string }> = {
  paid: {
    title: "입금이 확인됐습니다. 제작을 준비하고 있습니다.",
    desc: "확정된 준비안 그대로 검증용 사이트와 광고 문구를 만듭니다. 신청 당일 곧바로 시작해 빠르게 준비가 끝납니다.",
  },
  build: {
    title: "검증용 사이트를 만들고 있습니다.",
    desc: "완성되면 알림을 드리고, 이 페이지에서 바로 확인하실 수 있습니다.",
  },
  live: {
    title: "광고가 돌아가고 있습니다.",
    desc: "신청 당일부터 광고비를 써서 표본이 찰 때까지(보통 2~3일) 수요를 측정합니다. 중간 숫자는 해석 없이 남겨주신 번호 문자로 그대로 공유드립니다.",
  },
  verdict: {
    title: "판정이 나왔습니다.",
    desc: "미리 정한 기준(합격선)과 비교해, 될지 안 될지(Go/No-Go) 판정 리포트를 남겨주신 번호 문자와 카카오톡 채널로 보내드립니다. 궁금한 점은 일주일간 카카오톡 채널로 답해드립니다.",
  },
  closed: {
    title: "검증이 완료됐습니다.",
    desc: "함께해주셔서 감사합니다. 조건을 바꿔 다시 검증하시면 30% 할인됩니다.",
  },
};

/* 일자별 방문·결제 추세 라인 차트 (SVG). 데이터 없으면 대기 안내. */
function TrendChart({
  series,
  payLabel,
}: {
  series: { d: string; visits: number; pay: number }[];
  payLabel: string;
}) {
  const data = series.slice(-14);
  const n = data.length;
  const has = data.some((p) => p.visits > 0 || p.pay > 0);
  const max = Math.max(1, ...data.map((p) => p.visits));
  const X = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const Y = (v: number) => 38 - (v / max) * 33;
  const line = (key: "visits" | "pay") =>
    data
      .map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(p[key]).toFixed(1)}`)
      .join(" ");
  const area = `M0,40 ${data
    .map((p, i) => `L${X(i).toFixed(1)},${Y(p.visits).toFixed(1)}`)
    .join(" ")} L100,40 Z`;
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-secondary">일자별 추세</p>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-accent">
            <span className="h-1 w-3 rounded-full bg-accent" />방문
          </span>
          <span className="flex items-center gap-1" style={{ color: "var(--go)" }}>
            <span
              className="h-1 w-3 rounded-full"
              style={{ background: "var(--go)" }}
            />
            {payLabel}
          </span>
        </div>
      </div>
      <div className="relative mt-3 h-32 w-full overflow-hidden rounded-xl border border-border bg-bg-alt/40">
        {has ? (
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path d={area} fill="rgba(49,130,246,0.10)" />
            <path
              d={line("visits")}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line("pay")}
              fill="none"
              stroke="var(--go)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-text-tertiary">
            광고가 시작되면 일자별 방문·결제가 여기에 그려집니다.
          </div>
        )}
      </div>
      {has && n > 1 && (
        <div className="mt-1.5 flex justify-between text-[10px] text-text-tertiary">
          <span>{data[0].d}</span>
          <span>{data[n - 1].d}</span>
        </div>
      )}
    </div>
  );
}

/* 검증 코크핏 — 광고 전이라도 "여기가 내 실시간 대시보드"임을 보여준다.
   실제 데이터(없으면 0/대기) + 합격선(목표)만 쓰고, 가짜 숫자는 절대 넣지 않는다. */
function Cockpit({ lead, preview = false }: { lead: PublicLead; preview?: boolean }) {
  const s = lead.stats ?? { visits: 0, clicks: 0, payClicks: 0, signups: 0 };
  const av = lead.adStats;
  // 관리자가 방문/전환을 직접 넣었으면 그 값을, 아니면 t.js 자동측정값을 쓴다.
  const visits = av && av.visits > 0 ? av.visits : s.visits;
  // 전환 = 관리자 실측 > 실제 사전등록 제출 > t.js 결제성 클릭(외부 페이지) 순
  const payClicks =
    av && av.conversions > 0
      ? av.conversions
      : s.signups > 0
        ? s.signups
        : s.payClicks;
  const hasData = visits > 0;
  const live = lead.stage === "live";
  const done = lead.stage === "verdict" || lead.stage === "closed";
  const bar = lead.brief?.confirmed?.pass_bar ?? lead.passBar.bar;
  // 검증 행동은 사업 유형마다 다르다. 합격선 문구(decidePassBar)를 따라
  // 결제 / 예약·신청 / 문의로 라벨을 맞춘다. 오프라인은 사전예약이 신호.
  const intent = /예약|신청|등록/.test(bar)
    ? { noun: "예약·신청", click: "예약·신청" }
    : /문의/.test(bar)
      ? { noun: "문의", click: "문의" }
      : { noun: "결제 클릭", click: "결제 클릭" };
  const payRate = hasData ? (payClicks / visits) * 100 : 0;
  // 관리자가 구글애즈 노출·클릭을 입력하면 퍼널 맨 위에 광고 단을 붙인다.
  const ad = av && (av.impressions > 0 || av.clicks > 0) ? av : null;
  // 합격선 목표치 파싱 (예: "방문 100명당 결제 버튼 클릭 4명" → 4). 게이지용.
  const tm = bar.match(/100명당[^0-9]*(\d+(?:\.\d+)?)/);
  const target = tm ? parseFloat(tm[1]) : null;
  const passing = target != null && hasData && payRate >= target;
  const scaleMax =
    target != null ? Math.max(target * 1.5, payRate * 1.15, target + 1) : 1;
  const fillPct = target != null ? Math.min((payRate / scaleMax) * 100, 100) : 0;
  const markPct = target != null ? Math.min((target / scaleMax) * 100, 100) : 0;

  const status = live
    ? { t: "측정 중", live: true }
    : done
      ? { t: "측정 완료", live: false }
      : { t: preview ? "입금 후 열림" : "측정 준비 중", live: false };

  const tiles = [
    { k: "광고 노출", v: ad ? ad.impressions.toLocaleString() : "—", sub: "" },
    {
      k: "광고 클릭",
      v: ad ? ad.clicks.toLocaleString() : "—",
      sub:
        ad && ad.impressions > 0
          ? `클릭률 ${((ad.clicks / ad.impressions) * 100).toFixed(1)}%`
          : "",
    },
    { k: "사이트 방문", v: hasData ? visits.toLocaleString() : "—", sub: "" },
  ];

  return (
    <div className="cold-panel rounded-lg p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-text">라이브 대시보드</p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {preview
              ? "입금 후 열립니다 · 광고가 시작되면 실시간으로 채워집니다"
              : "광고 반응이 실시간으로 쌓입니다 · 자동 갱신"}
          </p>
        </div>
        <span
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
            status.live
              ? "bg-go-tint text-go"
              : "bg-bg-alt text-text-tertiary"
          }`}
        >
          {status.live && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-go" />
          )}
          {status.t}
        </span>
      </div>

      {/* 메트릭 타일 — 3 화이트 + 1 히어로(전환, accent) */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.k}
            className="rounded-2xl border border-border bg-surface px-4 py-4"
          >
            <p className="text-[12px] font-semibold text-text-tertiary">{t.k}</p>
            <p className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight text-text">
              {t.v}
            </p>
            <p className="mt-1.5 h-3 text-[11px] font-semibold text-text-tertiary">
              {t.sub}
            </p>
          </div>
        ))}
        <div className="rounded-2xl bg-accent px-4 py-4 text-white shadow-[0_12px_28px_-12px_var(--accent-glow)]">
          <p className="text-[12px] font-semibold text-white/85">{intent.click}</p>
          <p className="mt-1.5 text-[26px] font-extrabold leading-none tracking-tight">
            {hasData ? payClicks.toLocaleString() : "—"}
          </p>
          <p className="mt-1.5 h-3 text-[11px] font-semibold text-white/85">
            {hasData ? `전환 ${payRate.toFixed(1)}%` : "전환 측정 대기"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TrendChart series={lead.series ?? []} payLabel={intent.click} />
      </div>

      {/* 합격선 게이지 */}
      <div className="mt-6 rounded-2xl border border-border bg-bg-alt/40 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-text-tertiary">
            합격선 (광고 전에 정한 통과선)
          </span>
          {hasData && target != null ? (
            <span
              className="text-xs font-extrabold"
              style={{ color: passing ? "var(--go)" : "var(--pivot)" }}
            >
              {passing ? "통과 중" : "미달"}
            </span>
          ) : (
            <span className="text-sm font-bold text-text">{bar}</span>
          )}
        </div>
        {target != null ? (
          <>
            <div className="relative mt-3 h-2.5 rounded-full bg-border">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${fillPct}%`,
                  background: passing ? "var(--go)" : "var(--accent)",
                }}
              />
              <div
                className="absolute -bottom-1 -top-1 w-0.5 bg-text"
                style={{ left: `${markPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-text-tertiary">
              <span>
                {hasData ? (
                  <>
                    현재 방문 100명당 {intent.noun}{" "}
                    <b className="text-text">{payRate.toFixed(1)}</b>
                  </>
                ) : (
                  "측정 시작 후 합격선과 비교해 드립니다"
                )}
              </span>
              <span>합격선 {target}</span>
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            이 숫자는 광고 시작 전에 고정하고, 데이터를 본 뒤에는 저희도 바꾸지
            않습니다. 그래야 판정이 공정합니다.
          </p>
        )}
      </div>
    </div>
  );
}

/* 판정서 미리보기 — "예시"임을 명확히. 가짜 결과를 진짜처럼 보이지 않게 한다. */
function VerdictSample() {
  const rows = [
    {
      stamp: "GO",
      c: "var(--go)",
      bg: "var(--go-tint)",
      t: "합격선을 넘었습니다. 만들 근거가 확인됐습니다.",
    },
    {
      stamp: "PIVOT",
      c: "var(--pivot)",
      bg: "var(--pivot-tint)",
      t: "수요는 있지만 이 가격은 아닙니다. 조건을 바꿔 다시 볼 가치가 있습니다.",
    },
    {
      stamp: "NO-GO",
      c: "var(--nogo)",
      bg: "var(--nogo-tint)",
      t: "결제 의향이 약했습니다. 만들기 전에 멈춰 비용을 아꼈습니다.",
    },
  ];
  return (
    <details className="cold-panel rounded-lg p-5">
      <summary className="cursor-pointer text-sm font-bold text-text-secondary">
        검증이 끝나면 이런 판정서를 받아요 (예시 보기)
      </summary>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div
            key={r.stamp}
            className="flex items-center gap-3 rounded-[14px] border border-border bg-surface-light p-3"
          >
            <span
              className="w-[72px] flex-shrink-0 rounded-full py-1.5 text-center text-xs font-black"
              style={{ color: r.c, background: r.bg }}
            >
              {r.stamp}
            </span>
            <span className="text-[13px] leading-relaxed text-text-secondary">
              {r.t}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-text-tertiary">
        실제 판정은 광고 데이터로, 숫자 근거와 다음에 할 일까지 담아 남겨주신
        번호 문자와 카카오톡으로 보내드립니다.
      </p>
    </details>
  );
}

/* ───────── 내 페이지 수정 (확정 후 상시 — 입금/제작/광고 중 포함) ─────────
   문구·소개·가격·썸네일을 site_overrides 로만 저장한다(결제 합의 스냅샷 brief.confirmed 은 잠김).
   ValidationSite 인라인 편집 + 썸네일 업로드를 그대로 재사용해 라이브 페이지를 그 자리에서 고친다. */
function PageEditor({
  code,
  lead,
  onClose,
  onSaved,
}: {
  code: string;
  lead: PublicLead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const c = lead.brief?.confirmed;
  const ov = lead.siteOverrides ?? {};
  // 현재 라이브 상태로 시드 — override 가 있으면 그 값, 없으면 확정값.
  const seedPlans =
    ov.plans && ov.plans.length
      ? ov.plans
      : c?.plans && c.plans.length
        ? c.plans
        : [{ label: "기본", price: c?.price_value ?? 0, desc: "" }];
  const [offer, setOffer] = useState(ov.offer || c?.offer || "");
  const [credential, setCredential] = useState(
    ov.credential || c?.credential || "",
  );
  const [introVideo, setIntroVideo] = useState(
    ov.intro_video || c?.intro_video || "",
  );
  const [prologue, setPrologue] = useState(ov.prologue || c?.prologue || "");
  const [points, setPoints] = useState<string[]>(
    ov.selling_points && ov.selling_points.length
      ? ov.selling_points
      : (c?.selling_points ?? []),
  );
  const [plans, setPlans] = useState(
    seedPlans.map((p) => ({
      label: p.label,
      price: p.price,
      desc: p.desc ?? "",
    })),
  );
  const [media, setMedia] = useState<string[]>(
    ov.media && ov.media.length ? ov.media : (c?.media ?? []),
  );
  const [instructorPhoto, setInstructorPhoto] = useState(
    ov.instructor_photo || c?.instructor_photo || "",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function uploadImage(
    file: File,
    target: "media" | "instructor" = "media",
  ) {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("code", code);
      const res = await fetch("/api/v/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.ok && data.url) {
        if (target === "instructor") setInstructorPhoto(data.url as string);
        else setMedia((m) => [...m, data.url as string]);
      }
    } catch {
      /* 업로드 실패 — 사용자가 다시 시도 */
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setErr(false);
    setSaved(false);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_page",
          code,
          page: {
            offer: offer.trim(),
            credential: credential.trim(),
            intro_video: introVideo.trim(),
            prologue: prologue.trim(),
            instructor_photo: instructorPhoto.trim(),
            media,
            selling_points: points.map((p) => p.trim()).filter(Boolean),
            plans: plans
              .map((p) => ({
                label: p.label.trim(),
                price: p.price,
                desc: p.desc.trim(),
              }))
              .filter((p) => p.label && p.price > 0),
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      sendGAEvent("event", "page_updated", {});
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErr(true);
    } finally {
      setSaving(false);
    }
  }

  if (!c) return null;

  const previewIntent: ValidationSiteData["intent"] = /예약|신청|등록/.test(
    lead.passBar?.bar ?? "",
  )
    ? "reserve"
    : /문의/.test(lead.passBar?.bar ?? "")
      ? "inquiry"
      : "pay";
  const previewData: ValidationSiteData = {
    code: lead.siteToken ?? code,
    name: c.name || "내 강의",
    offer: offer.trim() || c.offer || "",
    targetLine: c.target_line || "",
    problemLine: c.problem_line || "",
    plans: plans.map((p) => ({ label: p.label, price: p.price, desc: p.desc })),
    sellingPoints: points,
    intent: previewIntent,
    credential: credential.trim() || undefined,
    instructorPhoto: instructorPhoto.trim() || undefined,
    introVideo: introVideo.trim() || undefined,
    prologue: prologue.trim() || undefined,
    media,
  };
  // 폼 입력 헬퍼 — 강조점 가변(추가·삭제), 플랜 추가·삭제
  const setPoint = (i: number, v: string) =>
    setPoints((arr) => arr.map((p, j) => (j === i ? v : p)));
  const addPoint = () => setPoints((arr) => [...arr, ""]);
  const removePoint = (i: number) =>
    setPoints((arr) => arr.filter((_, j) => j !== i));
  const setPlanField = (i: number, k: "label" | "desc", v: string) =>
    setPlans((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const setPlanPrice = (i: number, v: number) =>
    setPlans((ps) => ps.map((p, j) => (j === i ? { ...p, price: v } : p)));
  const addPlan = () =>
    setPlans((ps) =>
      ps.length >= 3 ? ps : [...ps, { label: "", price: 0, desc: "" }],
    );
  const removePlan = (i: number) =>
    setPlans((ps) => (ps.length <= 1 ? ps : ps.filter((_, j) => j !== i)));

  const liveNow = lead.stage === "live";
  const rowInput =
    "w-full rounded-md border border-border bg-surface-light px-4 py-3 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent";
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[16px] font-bold text-text">내 페이지 수정</p>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 text-xs font-bold text-text-tertiary underline-offset-2 transition hover:text-text hover:underline"
        >
          ← 현황으로
        </button>
      </div>

      {/* 권한 배지 — 무엇이 열려 있고 무엇이 잠겨 있는지 명확히 */}
      <div className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
        <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-accent text-[11px] font-black text-white">
          ✎
        </span>
        <p className="text-[13px] leading-relaxed text-text-secondary">
          {liveNow
            ? "광고가 도는 중에도 문구·소개·이미지는 언제든 고치실 수 있고, 저장하면 실제 페이지에 바로 반영됩니다. "
            : "여기서 고친 내용은 저장하는 즉시 실제 페이지에 반영됩니다. "}
          결제로 합의한 <b className="text-text">검증 상품 금액은 잠겨</b> 있어,
          여기서 바꾸셔도 안전합니다.
        </p>
      </div>

      {/* 실제 페이지 미리보기 — 고객에게 보이는 화면(읽기 전용). 편집은 아래 폼에서. */}
      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-left transition hover:border-accent"
      >
        <span className="text-[13px] font-bold text-text">
          {showPreview ? "미리보기 닫기" : "실제 페이지 미리보기"}
        </span>
        <span className="text-[12px] font-semibold text-text-tertiary">
          {showPreview ? "▲ 접기" : "고객에게 보이는 화면 ▼"}
        </span>
      </button>
      {showPreview && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="max-h-[60vh] overflow-y-auto">
            <ValidationSite data={previewData} />
          </div>
        </div>
      )}

      {/* 제목·소개 */}
      <Card label="제목 · 소개">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              한 줄 제목
            </label>
            <input
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              maxLength={120}
              placeholder="예: 퇴근 후 1시간, 엑셀이 무기가 됩니다"
              className={rowInput}
            />
            <p className="mt-1 text-[11px] text-text-tertiary">
              광고에서 가장 먼저 보이는 문장이에요.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              강사 소개 한 줄 (실적·경력)
            </label>
            <input
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              maxLength={80}
              placeholder="예: 구독 1.2만 유튜버 · 노션 5년차 · 수강생 300명"
              className={rowInput}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              강사 사진 (선택)
            </label>
            <div className="flex items-center gap-3">
              {instructorPhoto ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={instructorPhoto}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setInstructorPhoto("")}
                    className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full bg-text/70 text-[11px] font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <span className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-full bg-accent/10 text-[20px] font-black text-accent">
                  {(c.name || "·").trim().slice(0, 1)}
                </span>
              )}
              <label className="cursor-pointer rounded-lg border border-dashed border-border px-4 py-2 text-[12px] font-semibold text-text-tertiary transition hover:border-accent/60 hover:text-accent">
                {uploading
                  ? "올리는 중…"
                  : instructorPhoto
                    ? "사진 바꾸기"
                    : "+ 사진 올리기"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f, "instructor");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              없으면 이름 첫 글자 기본 아바타로 보여요.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              자유 서술 본문 (소개)
            </label>
            <textarea
              value={prologue}
              onChange={(e) => setPrologue(e.target.value)}
              maxLength={4000}
              rows={8}
              placeholder="누구를 위한 건지, 뭘 받게 되는지, 왜 당신인지 자유롭게 적어주세요. 길이 제한 넉넉합니다. 줄을 바꾸면 문단이 그대로 나뉘어요."
              className={`${rowInput} min-h-[150px] resize-y leading-relaxed`}
            />
          </div>
        </div>
      </Card>

      {/* 강조점 — 개수 자유(추가·삭제) */}
      <Card label="강조점">
        <p className="mb-3 text-xs leading-relaxed text-text-tertiary">
          이 서비스를 택하는 이유. 개수는 자유예요 — 1개도, 여러 개도. 비우면 이
          섹션은 페이지에서 안 보입니다.
        </p>
        <div className="space-y-2">
          {points.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-bg-light text-[12px] font-extrabold text-accent">
                {i + 1}
              </span>
              <input
                value={p}
                onChange={(e) => setPoint(i, e.target.value)}
                maxLength={80}
                placeholder="예: 바로 쓰는 템플릿 12종"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface-light px-4 py-3 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent"
              />
              <button
                type="button"
                onClick={() => removePoint(i)}
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-text-tertiary transition hover:bg-bg-alt hover:text-nogo"
                aria-label="강조점 삭제"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPoint}
            className="w-full rounded-lg border border-dashed border-border py-2.5 text-xs font-bold text-text-tertiary transition hover:border-accent hover:text-accent"
          >
            + 강조점 추가
          </button>
        </div>
      </Card>

      {/* 썸네일·영상 (카톡 사진 추가식 타일) */}
      <Card label="썸네일 이미지 · 소개 영상">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              소개 이미지 (사진 추가)
            </label>
            <div className="flex flex-wrap gap-2">
              {media.map((url, i) => (
                <div
                  key={i}
                  className="relative h-20 w-28 overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMedia((m) => m.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-text/70 text-[11px] font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="grid h-20 w-28 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-center text-[12px] font-semibold text-text-tertiary transition hover:border-accent/60 hover:text-accent">
                {uploading ? "올리는 중…" : "+ 사진"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              강의 화면·결과물·후기 캡처 등 (장당 최대 5MB)
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-secondary">
              소개 영상 (유튜브·비메오 링크)
            </label>
            <input
              value={introVideo}
              onChange={(e) => setIntroVideo(e.target.value)}
              maxLength={200}
              inputMode="url"
              placeholder="예: https://youtu.be/xxxxxxxx"
              className={rowInput}
            />
          </div>
        </div>
      </Card>

      {/* 표시 가격·플랜 */}
      <Card label="표시 가격 · 플랜">
        <p className="mb-3 text-xs leading-relaxed text-text-tertiary">
          페이지에 보일 수강료예요. (결제하실 검증 상품 금액과는 별개라 자유롭게
          바꾸셔도 됩니다)
        </p>
        <div className="space-y-2.5">
          {plans.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-surface-light p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={p.label}
                  onChange={(e) => setPlanField(i, "label", e.target.value)}
                  maxLength={60}
                  placeholder="플랜 이름 (예: 얼리버드)"
                  className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                />
                <div className="flex flex-shrink-0 items-center gap-1">
                  <input
                    value={p.price > 0 ? String(p.price) : ""}
                    onChange={(e) =>
                      setPlanPrice(
                        i,
                        Number((e.target.value.match(/\d/g) ?? []).join("")) || 0,
                      )
                    }
                    inputMode="numeric"
                    placeholder="0"
                    className="w-24 rounded-md border border-border bg-bg px-3 py-2 text-right text-sm font-bold text-text outline-none transition focus:border-accent"
                  />
                  <span className="text-xs font-semibold text-text-tertiary">
                    원
                  </span>
                </div>
                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlan(i)}
                    className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-text-tertiary transition hover:bg-bg-alt hover:text-nogo"
                    aria-label="플랜 삭제"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                value={p.desc}
                onChange={(e) => setPlanField(i, "desc", e.target.value)}
                maxLength={200}
                placeholder="플랜 설명 (선택)"
                className="mt-2 w-full rounded-md border border-border bg-bg px-3 py-2 text-xs text-text-secondary outline-none transition focus:border-accent"
              />
            </div>
          ))}
          {plans.length < 3 && (
            <button
              type="button"
              onClick={addPlan}
              className="w-full rounded-lg border border-dashed border-border py-2.5 text-xs font-bold text-text-tertiary transition hover:border-accent hover:text-accent"
            >
              + 플랜 추가
            </button>
          )}
        </div>
      </Card>

      {err && (
        <p className="text-sm font-semibold text-nogo">
          저장에 실패했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full rounded-full bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving
            ? "반영하는 중…"
            : saved
              ? "반영됐습니다 ✓"
              : "변경사항 페이지에 반영하기"}
        </button>
      </div>
    </div>
  );
}

function ProgressStep({
  lead,
  code,
  onReload,
}: {
  lead: PublicLead;
  code: string;
  onReload: () => void;
}) {
  const [editingPage, setEditingPage] = useState(false);
  const c = PROGRESS_COPY[lead.stage] ?? PROGRESS_COPY.paid;
  const confirmed = lead.brief?.confirmed;
  // 엔진 고객은 광고 시작 전까지 측정 연결 카드를 보여준다 (연결되면 완료 표시)
  const showTagCard =
    lead.tier === "engine" &&
    (lead.stage === "paid" ||
      lead.stage === "build" ||
      (lead.stage === "live" && !lead.tagVerified));

  if (editingPage && confirmed) {
    return (
      <PageEditor
        code={code}
        lead={lead}
        onClose={() => setEditingPage(false)}
        onSaved={onReload}
      />
    );
  }
  return (
    <div className="space-y-5">
      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">{c.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {c.desc}
        </p>
      </div>

      {/* 내 검증 페이지 — 광고가 향하는 실제 페이지로 바로 이동 */}
      {lead.siteToken && (
        <a
          href={`/v/${lead.siteToken}?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/[0.05] p-5 transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent/10"
        >
          <div>
            <p className="text-[15px] font-bold text-text">내 검증 페이지 보기 ↗</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              광고가 향하는 실제 페이지예요. 새 탭에서 열립니다. (내 방문은 측정에 잡히지 않아요)
            </p>
          </div>
          <span className="flex-shrink-0 text-xl font-bold text-accent" aria-hidden>
            →
          </span>
        </a>
      )}

      {/* 내 페이지 수정 — 확정 후에도(광고 중 포함) 그 자리에서 문구·이미지·가격을 고친다 */}
      {confirmed && lead.stage !== "closed" && (
        <button
          type="button"
          onClick={() => setEditingPage(true)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-accent"
        >
          <div>
            <p className="text-[15px] font-bold text-text">내 페이지 수정 ✎</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              제목·소개·가격·썸네일을 직접 고칩니다. 저장하면 실제 페이지에 바로
              반영돼요.
              {lead.stage === "live" && " 광고 중에도 가능합니다."}
            </p>
          </div>
          <span
            className="flex-shrink-0 text-xl font-bold text-accent"
            aria-hidden
          >
            →
          </span>
        </button>
      )}
      {showTagCard && (
        <TagInstallCard
          code={code}
          siteToken={lead.siteToken}
          hasPageUrl={lead.hasPageUrl}
          verified={lead.tagVerified}
        />
      )}

      {/* 실시간 대시보드 — 결제 후 전 단계에서 코크핏 노출. 광고 전엔 0/대기로
          구조만 보여주고, 광고 시작 후 실제 숫자가 쌓인다. 가짜 숫자 없음. */}
      <Cockpit lead={lead} />
      <VerdictSample />

      {confirmed && (
        <div className="cold-panel rounded-lg p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            이번 검증의 내용
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="핵심 메시지" v={confirmed.offer} />
            <Row k="표시 가격·플랜" v={planText(confirmed)} />
            <Row k="임시 이름" v={confirmed.name} />
            {confirmed.pass_bar && <Row k="판정 기준" v={confirmed.pass_bar} />}
          </div>
        </div>
      )}
      <a
        href={KAKAO_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition hover:brightness-95"
        style={{ background: "#FEE500", color: "#191600" }}
      >
        문의하기 (카카오톡)
      </a>
    </div>
  );
}

/* ───────── 공용 ───────── */

function Card({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="cold-panel rounded-lg p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </p>
      {children}
    </div>
  );
}

/* ───────── 측정 스크립트 설치 (엔진 — 페이지가 이미 있는 고객) ───────── */

function TagInstallCard({
  code,
  siteToken,
  hasPageUrl,
  verified,
}: {
  code: string;
  siteToken?: string | null;
  hasPageUrl: boolean;
  verified: boolean;
}) {
  const [ok, setOk] = useState(verified);
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<"tag" | "ai" | null>(null);

  const snippet = `<script defer src="https://www.bizfilter.kr/t.js" data-code="${siteToken || code}"></script>`;
  // 바이브코더용 — 커서/클로드에 그대로 붙여넣는 설치 요청문
  const aiPrompt = `내 웹사이트의 모든 페이지 <head> 안에 아래 스크립트 태그를 추가해줘. 방문과 버튼 클릭을 측정하는 태그야. 다른 코드는 바꾸지 말고 이 한 줄만 추가해줘.\n\n${snippet}`;

  async function copy(kind: "tag" | "ai", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  if (ok) {
    return (
      <div className="cold-panel rounded-lg p-6">
        <p className="flex items-center gap-2 text-sm font-bold text-text">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-go-tint text-xs text-go">
            ✓
          </span>
          측정 연결 완료
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          페이지의 방문과 클릭이 비즈필터 측정 서버로 들어오고 있습니다. 더
          하실 일은 없습니다.
        </p>
      </div>
    );
  }

  async function verify() {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/t/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, url: url.trim() || undefined }),
      });
      const data = await res.json();
      if (data.verified) {
        setOk(true);
        return;
      }
      setResult(
        data.reason === "no_url"
          ? "페이지 주소를 입력해주세요."
          : data.reason === "fetch_failed"
            ? "페이지에 접속할 수 없습니다. 주소를 확인해주세요."
            : "아직 스크립트가 보이지 않습니다. 저장(배포) 후 1~2분 뒤 다시 확인해주세요.",
      );
    } catch {
      setResult("확인에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="cold-panel rounded-lg p-6">
      <p className="text-sm font-bold text-text">
        측정 연결 — 한 줄만 들어가면 끝납니다
      </p>
      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
        아래 한 줄이 페이지에 들어가면 방문과 버튼 클릭이 자동으로 측정되고,
        연결되는 순간 이 카드가 완료로 바뀝니다. 둘 중 편한 방법으로
        설치하세요.
      </p>

      <div className="mt-3 rounded-md border border-border bg-bg-alt p-3">
        <p className="text-xs font-bold text-text">
          방법 1 · AI로 만드셨다면 (커서, 클로드, v0 등)
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          아래 버튼으로 설치 요청문을 복사해서 쓰시는 AI에 그대로
          붙여넣으세요. AI가 알아서 답니다.
        </p>
        <button
          type="button"
          onClick={() => copy("ai", aiPrompt)}
          className="mt-2 w-full rounded-md bg-accent px-4 py-2.5 text-xs font-bold text-white transition hover:bg-accent-hover"
        >
          {copied === "ai" ? "복사됐습니다. AI에 붙여넣으세요" : "AI 설치 요청문 복사"}
        </button>
      </div>

      <div className="mt-2 rounded-md border border-border bg-bg-alt p-3">
        <p className="text-xs font-bold text-text">방법 2 · 직접 수정하신다면</p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          아래 한 줄을 복사해 모든 페이지의 &lt;head&gt; 안에 붙여넣으세요.
          노코드 툴(아임웹, 프레이머 등)은 설정의 &lsquo;커스텀 코드(head)&rsquo;
          영역에 넣으면 됩니다.
        </p>
        <div className="mt-2 flex items-stretch gap-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {snippet}
          </code>
          <button
            type="button"
            onClick={() => copy("tag", snippet)}
            className="flex-shrink-0 rounded-md border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:border-accent hover:text-accent"
          >
            {copied === "tag" ? "복사됨" : "복사"}
          </button>
        </div>
      </div>
      {!hasPageUrl && (
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="페이지 주소 (예: https://my-service.com)"
          className="mt-2 w-full rounded-md border border-border bg-surface-light px-3 py-2.5 text-sm text-text placeholder:text-text-tertiary outline-none transition focus:border-accent"
        />
      )}
      <button
        type="button"
        onClick={verify}
        disabled={checking}
        className="mt-2 w-full rounded-md border border-accent/40 bg-accent/5 px-4 py-2.5 text-sm font-bold text-accent transition hover:bg-accent/10 disabled:opacity-50"
      >
        {checking ? "확인하는 중..." : "설치 확인하기"}
      </button>
      {result && (
        <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
          {result}
        </p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
        막히시면 바로{" "}
        <a
          href={KAKAO_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-text underline underline-offset-2 transition hover:text-accent"
        >
          카카오톡 채널로 알려주세요
        </a>
        . 검증 전문가가 화면을 보며 같이 붙여드립니다.
      </p>
    </div>
  );
}

/** 확정된 플랜 구성을 고객 에코용 한 줄로 (서버 스냅샷과 동일 포맷) */
function planText(c: ConfirmedBrief): string {
  return c.plans && c.plans.length > 0
    ? c.plans
        .map(
          (p) =>
            `${p.label} ${p.price.toLocaleString()}원${p.desc ? ` (${p.desc})` : ""}`,
        )
        .join(" / ")
    : `${c.price_value.toLocaleString()}원`;
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex-shrink-0 text-text-tertiary">{k}</span>
      <span
        className={`text-right ${strong ? "font-bold text-accent" : "font-semibold text-text"}`}
      >
        {v}
      </span>
    </div>
  );
}

const inputBase =
  "mt-2 w-full rounded-md border border-border bg-surface-light px-4 py-3 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent";
