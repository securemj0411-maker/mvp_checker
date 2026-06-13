"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { BANK_INFO, type BriefDraft, type ConfirmedBrief } from "@/lib/diagnosis";
import { KAKAO_CHAT_URL } from "@/lib/site";
import { BrandMark, Wordmark } from "@/components/Brand";

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
  stage: Stage;
  tier: "engine" | "quick" | string;
  idea: string;
  ideaRefined: string | null;
  report: Record<string, unknown> | null;
  brief: { draft?: BriefDraft; confirmed?: ConfirmedBrief } | null;
  briefConfirmedAt: string | null;
  depositDueAt: string | null;
  policyFlag: string;
  pageMeasurable: boolean | null;
  hasPageUrl: boolean;
  tagVerified: boolean;
  /** 광고 시작 후 실측 숫자 (금액 정보 없음) */
  stats?: { visits: number; clicks: number; payClicks: number } | null;
  /** 관리자가 입력한 구글애즈 실측 (노출·클릭만, 광고비 없음) */
  adStats?: { impressions: number; clicks: number } | null;
  passBar: { bar: string; reason: string; minSample: string };
  tiers: Record<
    "engine" | "quick",
    { label: string; price: number; priceLabel: string; desc: string }
  >;
  refundPolicy: readonly string[];
}

const STAGES: { key: Stage[]; label: string }[] = [
  { key: ["brief"], label: "준비안 확정" },
  { key: ["deposit"], label: "입금" },
  { key: ["paid"], label: "제작 준비" },
  { key: ["build"], label: "제작" },
  { key: ["live"], label: "광고 7일" },
  { key: ["verdict", "closed"], label: "판정" },
];

export default function BriefFlow({ code }: { code: string }) {
  const [lead, setLead] = useState<PublicLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 입금 전, 확정한 브리프를 다시 열어 수정하는 모드
  const [editing, setEditing] = useState(false);

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
      <div className="cold-panel rounded-lg p-8 text-center">
        <p className="text-base font-bold text-text">{error}</p>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="cold-panel flex flex-col items-center rounded-lg p-10">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-4 text-sm text-text-secondary">불러오는 중입니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 로고 헤더 — 길을 잃지 않게 */}
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

      <header className="cold-panel rounded-lg p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-text">
              {lead.name}님의 검증 현황
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              진행 코드 <b className="font-mono text-text-secondary">{code}</b>
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              진행 현황이 바뀔 때마다 남겨주신 번호로 문자를 드립니다.
            </p>
          </div>
        </div>
        <StagePipeline stage={lead.stage} />
      </header>

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
      {lead.stage === "deposit" && !editing && (
        <DepositStep
          lead={lead}
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
        lead.stage === "closed") && <ProgressStep lead={lead} code={code} />}
    </div>
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
        실제 검증용 사이트엔 이렇게 보여요 (예시)
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
        디자인은 담당 전문가가 더 보기 좋게 다듬어 만듭니다. 위는 구성 예시예요.
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
  // 전문가 사전 점검 — 질문별 답(칩 또는 직접입력), 질문별 직접입력 모드
  const [intakeAns, setIntakeAns] = useState<string[]>([]);
  const [intakeCustom, setIntakeCustom] = useState<boolean[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // 초안 도착 시 프리필 (고객 편집 대상 3개만)
  useEffect(() => {
    if (!draft) return;
    setOffer((v) => v || draft.offer_options[0]?.headline || "");
    setPlans((v) =>
      v.length > 0 ? v : [{ label: "기본", price: draft.price_value, desc: "" }],
    );
    setName((v) => v || draft.name_candidates[0] || "");
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
    const inOptions = (draft?.offer_options ?? []).some(
      (o) => o.headline === c.offer,
    );
    if (c.offer && !inOptions) setOfferCustom(true);
    const qs = (draft?.intake_questions ?? []).slice(0, 3);
    if (c.intake && qs.length > 0) {
      setIntakeAns(qs.map((q) => c.intake!.find((x) => x.q === q.key)?.a ?? ""));
      setIntakeCustom(
        qs.map((q) => {
          const a = c.intake!.find((x) => x.q === q.key)?.a;
          return !!a && !q.suggestions.includes(a);
        }),
      );
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
    const steps = [
      "광고에 쓸 핵심 문구(첫 줄)를 뽑고 있습니다",
      "표시할 가격을 정하고 있습니다",
      "검증용 페이지 구성을 짜고 있습니다",
      "서비스 임시 이름을 만들고 있습니다",
    ];
    return (
      <div className="cold-panel flex flex-col items-center rounded-lg p-8 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-border border-t-accent" />
        <p className="mt-6 text-base font-bold text-text">
          검증 준비안을 짜고 있습니다
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          앞에서 받으신 검증 설계서를 바탕으로 광고 핵심 문구, 표시 가격, 페이지 구성을
          준비합니다. 10~20초 걸립니다.
        </p>
        <div className="mt-6 h-2 w-56 max-w-full overflow-hidden rounded-full bg-bg-alt">
          <div className="gen-progress h-full rounded-full bg-accent" />
        </div>
        <ol className="mt-6 space-y-1.5 text-left text-sm text-text-tertiary">
          {steps.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent/50" />
              {s}
            </li>
          ))}
        </ol>
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
      intake: (() => {
        const qs = (draft!.intake_questions ?? []).slice(0, 3);
        const ans = qs
          .map((q, i) => ({ q: q.key, a: (intakeAns[i] ?? "").trim() }))
          .filter((x) => x.a);
        return ans.length > 0 ? ans : undefined;
      })(),
      selling_points: draft!.selling_points,
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

  const engineBlocked = lead.pageMeasurable === false;
  // 답변에 따라 진행 방식은 하나로 자동 결정된다 (고객이 고르지 않음).
  // 페이지가 있고(engine) 측정이 가능하면 엔진, 그 외엔 Quick.
  const tier: "engine" | "quick" =
    lead.tier === "engine" && !engineBlocked ? "engine" : "quick";

  return (
    <div className="space-y-5">
      {/* 대표 인사 영상 — 영상 준비되면 되살리기 */}
      {/* <FounderVideo /> */}

      {editing && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <p className="text-sm font-semibold text-text">
            수정 중이에요. 입금 전이라 자유롭게 고치실 수 있습니다.
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
            ? "확정 내용을 고치고 계세요"
            : "담당 전문가에게 넘기기 전, 마지막 확인이에요"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          아래 내용은 비즈필터가 먼저 잡아본 초안이에요. 여기 적어주신 걸
          바탕으로 <b className="text-text">담당 검증 전문가가 광고로 띄울
          검증용 사이트(실제 서비스처럼 보이는 한 장짜리 웹사이트)와 광고를
          직접 만듭니다.</b> 단순히 만들기만 하는 게 아니라, 사람들이 더 많이
          누르고 결제까지 가도록 문구와 구성을 최적화해 드려요. 빠지거나 애매한
          게 있으면 시작 전에 먼저 연락드릴게요.
        </p>
      </div>


      {/* 전문가 사전 점검 — AI가 빌드에 비는 것만 골라 되물음 (보기 미리 채움) */}
      {draft.intake_questions && draft.intake_questions.length > 0 && (
        <Card label="전문가 사전 점검">
          <p className="mb-3 text-xs leading-relaxed text-text-tertiary">
            담당 전문가가 페이지·광고를 더 정확히 만들기 위해, 이 아이디어에서
            아직 모르는 것만 추려서 여쭤봐요. 해당되는 걸 고르거나 직접
            적어주세요. 건너뛰셔도 됩니다.
          </p>
          <div className="space-y-4">
            {draft.intake_questions.slice(0, 3).map((q, i) => (
              <div key={i}>
                <p className="text-[13px] font-bold text-text">{q.question}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.suggestions.map((s) => {
                    const selected = !intakeCustom[i] && intakeAns[i] === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setIntakeAns((a) => {
                            const n = [...a];
                            n[i] = s;
                            return n;
                          });
                          setIntakeCustom((c) => {
                            const n = [...c];
                            n[i] = false;
                            return n;
                          });
                        }}
                        className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                          selected
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
                    onClick={() => {
                      setIntakeCustom((c) => {
                        const n = [...c];
                        n[i] = true;
                        return n;
                      });
                      setIntakeAns((a) => {
                        const n = [...a];
                        n[i] = "";
                        return n;
                      });
                    }}
                    className={`rounded-full border border-dashed px-3.5 py-2 text-[13px] font-semibold transition ${
                      intakeCustom[i]
                        ? "border-accent text-text"
                        : "border-border text-text-tertiary hover:border-accent/60"
                    }`}
                  >
                    직접 입력
                  </button>
                </div>
                {intakeCustom[i] && (
                  <input
                    autoFocus
                    value={intakeAns[i] ?? ""}
                    onChange={(e) =>
                      setIntakeAns((a) => {
                        const n = [...a];
                        n[i] = e.target.value;
                        return n;
                      })
                    }
                    maxLength={80}
                    placeholder="직접 적어주세요"
                    className={`${inputBase} mt-2 text-[13px]`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 1. 오퍼 핵심 문구 — 비즈필터가 뽑은 안 택1 OR 직접 수정 */}
      <Card label="광고와 사이트에 들어갈 한 줄 제목" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          사람들이 가장 먼저 보게 될 한 줄이에요. 비즈필터가 먼저 뽑아본
          후보를 고르거나, 직접 적으셔도 됩니다. 그대로 확정되는 게 아니라,
          담당 전문가가 반응이 가장 좋게 다듬어 최종 결정합니다.
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
        <PagePreview name={name} offer={offer} plans={plans} />
      </Card>

      {/* 3. 가칭 */}
      <Card label="검증용 서비스 이름" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          검증에만 쓰는 임시 이름이에요. 정식 출시할 진짜 이름과 달라도 전혀
          상관없습니다. 지금 중요한 건 이름이 아니라, 이 아이디어에 사람들이
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
              : "실제 서비스처럼 보이는 검증용 페이지를 전문가가 직접 만듭니다",
            "실제 구글·메타 광고로 모르는 사람 수백 명을 데려옵니다 (광고비 포함)",
            "누가 들어와서 결제 버튼까지 눌렀는지 숫자로 집계합니다",
            "7일 안에 살 사람이 있는지, 될 사업인지 판정해 드립니다",
          ];
          const why = isEngine
            ? "페이지를 이미 갖고 계셔서, 페이지 제작은 빼고 측정·광고·판정만 진행하는 방식이에요."
            : engineBlocked
              ? "입력하신 페이지는 측정 장치를 붙일 수 없는 플랫폼이라, 검증용 페이지부터 저희가 새로 만듭니다."
              : "보여줄 페이지가 아직 없으셔서, 검증용 페이지 제작부터 전부 저희가 맡습니다.";
          return (
            <div className="rounded-xl border-2 border-accent bg-accent/5 p-5 shadow-[0_8px_24px_-12px_var(--accent-glow)]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-bold text-text">
                  {info.label}
                </span>
                <span className="text-2xl font-extrabold tracking-tight text-text">
                  {info.priceLabel}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                {why} 답변에 맞춰 자동으로 정해졌고, 광고비까지 포함된
                금액이에요.
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

      {/* 그 외 한마디 — 자유 입력(가볍게, 맨 끝). 위 점검과 안 겹치게 '그 외'로 한정 */}
      <Card label="그 외 더 전하고 싶은 말 (선택)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="위에서 못 담은 게 있으면 편하게 적어주세요. 담당 전문가가 다 읽습니다. (비워두셔도 됩니다)"
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
            : "이대로 검증 시작하기"}
      </button>
      <p className="text-center text-xs text-text-tertiary">
        {editing
          ? "고친 내용으로 다시 저장됩니다. 입금 전까지는 언제든 또 고치실 수 있어요."
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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* 클립보드 권한 없으면 조용히 무시 — 번호는 화면에 그대로 보인다 */
        }
      }}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-bold text-accent transition hover:bg-accent/20 active:scale-95"
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
          복사
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

function DepositStep({
  lead,
  onEdit,
}: {
  lead: PublicLead;
  onEdit?: () => void;
}) {
  const tier = lead.tiers[lead.tier === "engine" ? "engine" : "quick"];
  const confirmed = lead.brief?.confirmed;
  const due = lead.depositDueAt
    ? new Date(lead.depositDueAt).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : null;

  return (
    <div className="space-y-5">
      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">
          준비안이 확정됐습니다. 입금만 남았습니다.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          입금이 확인되면 48시간 안에 검증 준비가 끝나고, 진행 상황은 이
          페이지에서 계속 보실 수 있습니다.
        </p>

        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/[0.05] p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-text-secondary">
              {tier.label}
            </span>
            <span className="text-[26px] font-extrabold tracking-tight text-text">
              {tier.price.toLocaleString()}원
            </span>
          </div>

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
            style={{ background: "#FBF1DE" }}
          >
            <p
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{ color: "#C77A00" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              입금자명
            </p>
            <p className="mt-1 text-sm font-bold text-text">
              반드시{" "}
              <span style={{ color: "#C77A00" }}>&ldquo;{lead.name}&rdquo;</span>{" "}
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

        {/* 신뢰 스트립 — 입금 직전, 우리가 실제로 가진 약속을 적시에 */}
        <div className="mt-4 grid gap-2.5 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
          {[
            "실명·얼굴 공개한 팀이 직접 운영",
            "판정 못 드리면 검증비 전액 환불",
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
          <p className="text-sm font-bold text-text">입금하신 다음은요</p>
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
        <div className="cold-panel rounded-lg p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-text">확정 내용</p>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex-shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-text-secondary transition hover:border-accent/60 hover:text-text"
              >
                수정하기
              </button>
            )}
          </div>
          <dl className="mt-3 space-y-3">
            <ConfirmRow label="핵심 메시지" value={confirmed.offer} />
            <ConfirmRow label="표시 가격·플랜" value={planText(confirmed)} />
            <ConfirmRow label="임시 이름" value={confirmed.name} />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            입금 전까지는 위 내용을 언제든 고치실 수 있어요. 입금 후에는 담당
            전문가가 검토를 시작합니다.
          </p>
        </div>
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
    desc: "확정된 준비안 그대로 검증용 사이트와 광고 문구를 만듭니다. 48시간 안에 준비가 끝납니다.",
  },
  build: {
    title: "검증용 사이트를 만들고 있습니다.",
    desc: "완성되면 알림을 드리고, 이 페이지에서 바로 확인하실 수 있습니다.",
  },
  live: {
    title: "광고가 돌아가고 있습니다.",
    desc: "7일 동안 실제 광고비를 써서 수요를 측정합니다. 중간 숫자는 해석 없이 남겨주신 번호 문자로 그대로 공유드립니다.",
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

/* 검증 코크핏 — 광고 전이라도 "여기가 내 실시간 대시보드"임을 보여준다.
   실제 데이터(없으면 0/대기) + 합격선(목표)만 쓰고, 가짜 숫자는 절대 넣지 않는다. */
function Cockpit({ lead, preview = false }: { lead: PublicLead; preview?: boolean }) {
  const s = lead.stats ?? { visits: 0, clicks: 0, payClicks: 0 };
  const hasData = s.visits > 0;
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
  const payRate = hasData ? (s.payClicks / s.visits) * 100 : 0;
  // 관리자가 구글애즈 노출·클릭을 입력하면 퍼널 맨 위에 광고 단을 붙인다.
  const ad =
    lead.adStats && (lead.adStats.impressions > 0 || lead.adStats.clicks > 0)
      ? lead.adStats
      : null;
  const anyData = hasData || !!ad;
  const rows = ad
    ? [
        { k: "광고 노출", v: ad.impressions, tone: "var(--bg-light)" },
        { k: "광고 클릭", v: ad.clicks, tone: "var(--border-hover)" },
        { k: "사이트 방문", v: s.visits, tone: "var(--accent-soft)" },
        { k: intent.click, v: s.payClicks, tone: "var(--accent)" },
      ]
    : [
        { k: "방문", v: s.visits, tone: "var(--border-hover)" },
        { k: "버튼 클릭", v: s.clicks, tone: "var(--accent-soft)" },
        { k: intent.click, v: s.payClicks, tone: "var(--accent)" },
      ];
  const maxRow = Math.max(...rows.map((r) => r.v), 1);
  const funnel = rows.map((r) => ({
    ...r,
    w: anyData ? Math.max((r.v / maxRow) * 100, r.v > 0 ? 4 : 2) : 6,
  }));
  const status = live
    ? { t: "측정 중", live: true }
    : done
      ? { t: "측정 완료", live: false }
      : { t: preview ? "입금 후 열림" : "측정 준비 중", live: false };
  const stageLabel =
    STAGES.find((x) => x.key.includes(lead.stage))?.label ?? "준비 중";
  const cards = [
    { k: "진행 단계", v: stageLabel, accent: false, small: true },
    { k: "방문", v: hasData ? s.visits.toLocaleString() : "—", accent: false },
    { k: "버튼 클릭", v: hasData ? s.clicks.toLocaleString() : "—", accent: false },
    { k: intent.click, v: hasData ? s.payClicks.toLocaleString() : "—", accent: true },
  ];

  return (
    <div className="cold-panel rounded-lg p-6">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-text">라이브 대시보드</p>
        <span
          className={`flex items-center gap-1.5 text-[11px] font-bold ${
            status.live ? "text-emerald-500" : "text-text-tertiary"
          }`}
        >
          {status.live && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          )}
          {status.t}
        </span>
      </div>
      {!hasData && (
        <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
          {preview
            ? "입금하시면 이 대시보드가 열리고, 광고가 시작되면 방문·클릭·결제 반응이 여기에 실시간으로 쌓입니다."
            : "광고가 시작되면 방문·클릭·결제 반응이 여기에 실시간으로 쌓입니다."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.k}
            className={`rounded-[14px] px-3 py-3 ${
              c.accent ? "border border-accent/30 bg-accent/5" : "bg-bg-alt"
            }`}
          >
            <p
              className={`text-[11px] font-semibold ${
                c.accent ? "text-accent" : "text-text-tertiary"
              }`}
            >
              {c.k}
            </p>
            <p
              className={`mt-1 ${c.small ? "text-sm" : "text-xl"} font-extrabold tracking-tight ${
                c.accent ? "text-accent" : "text-text"
              }`}
            >
              {c.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold text-text-secondary">신호 퍼널</p>
        <div className="mt-3 space-y-3">
          {funnel.map((f) => (
            <div key={f.k}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-text-secondary">{f.k}</span>
                <span className="font-extrabold text-text">
                  {anyData ? f.v.toLocaleString() : "—"}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-bg-alt">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${f.w}%`, background: f.tone }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[14px] bg-bg-alt px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-text-tertiary">
            합격선 (광고 전 못박은 목표)
          </span>
          <span className="text-sm font-bold text-text">{bar}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
          {hasData ? (
            <>
              지금 방문 100명당 {intent.noun}{" "}
              <b className="text-text">{payRate.toFixed(1)}명</b>. 7일 측정 뒤 이
              합격선과 비교해 GO·보류·중단을 판정합니다.
            </>
          ) : (
            <>
              이 숫자는 광고 시작 전에 고정하고, 데이터를 본 뒤에는 저희도 바꾸지
              않습니다. 그래야 판정이 공정합니다.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* 판정서 미리보기 — "예시"임을 명확히. 가짜 결과를 진짜처럼 보이지 않게 한다. */
function VerdictSample() {
  const rows = [
    {
      stamp: "GO",
      c: "#06A86B",
      bg: "#E4F7EF",
      t: "합격선을 넘었습니다. 만들 근거가 확인됐어요.",
    },
    {
      stamp: "PIVOT",
      c: "#C77A00",
      bg: "#FBF1DE",
      t: "수요는 있지만 이 가격은 아니에요. 조건을 바꿔 다시 볼 가치가 있습니다.",
    },
    {
      stamp: "NO-GO",
      c: "#E8453C",
      bg: "#FCEBE9",
      t: "결제 의향이 약했어요. 만들기 전에 멈춰 비용을 아꼈습니다.",
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
        실제 판정은 광고 7일 데이터로, 숫자 근거와 다음에 할 일까지 담아 남겨주신
        번호 문자와 카카오톡으로 보내드립니다.
      </p>
    </details>
  );
}

function ProgressStep({ lead, code }: { lead: PublicLead; code: string }) {
  const c = PROGRESS_COPY[lead.stage] ?? PROGRESS_COPY.paid;
  const confirmed = lead.brief?.confirmed;
  // 엔진 고객은 광고 시작 전까지 측정 연결 카드를 보여준다 (연결되면 완료 표시)
  const showTagCard =
    lead.tier === "engine" &&
    (lead.stage === "paid" ||
      lead.stage === "build" ||
      (lead.stage === "live" && !lead.tagVerified));
  return (
    <div className="space-y-5">
      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">{c.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {c.desc}
        </p>
      </div>
      {showTagCard && (
        <TagInstallCard
          code={code}
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
  hasPageUrl,
  verified,
}: {
  code: string;
  hasPageUrl: boolean;
  verified: boolean;
}) {
  const [ok, setOk] = useState(verified);
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<"tag" | "ai" | null>(null);

  const snippet = `<script defer src="https://www.bizfilter.kr/t.js" data-code="${code}"></script>`;
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
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-xs text-emerald-500">
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
