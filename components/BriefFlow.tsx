"use client";

import { useCallback, useEffect, useState } from "react";
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

      {lead.stage === "brief" && <BriefStep code={code} lead={lead} onDone={load} />}
      {lead.stage === "deposit" && <DepositStep lead={lead} />}
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

/* ───────── 1단계: 브리프 확정 ───────── */

function BriefStep({
  code,
  lead,
  onDone,
}: {
  code: string;
  lead: PublicLead;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<BriefDraft | null>(
    lead.brief?.draft ?? null,
  );
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState(false);

  // 확정 폼 상태 — 고객이 확인/수정하는 건 핵심 3개(오퍼·가격·가칭)뿐.
  // 타깃·문제·소구점·제외는 전문가가 정한 내부 자료로 보관만 한다.
  const [offer, setOffer] = useState("");
  // 플랜 1~3개 — 첫 플랜 가격이 대표 가격(price_value)이 된다
  const [plans, setPlans] = useState<{ label: string; price: number }[]>([]);
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"engine" | "quick">(
    lead.tier === "engine" ? "engine" : "quick",
  );
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
      v.length > 0 ? v : [{ label: "기본", price: draft.price_value }],
    );
    setName((v) => v || draft.name_candidates[0] || "");
  }, [draft]);

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
      .map((p) => ({ label: p.label.trim(), price: p.price }))
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

  return (
    <div className="space-y-5">
      {/* 대표 인사 영상 — 영상 준비되면 되살리기 */}
      {/* <FounderVideo /> */}

      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">
          이렇게 검증을 시작하면 될까요?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          답변을 바탕으로 저희가 준비안을 잡아왔습니다. 광고 문구와 페이지
          디자인, 측정 설정은 저희가 알아서 합니다. 고객님은 아래 세 가지만
          확인해주시면 됩니다. 마음에 안 들면 그 자리에서 고치셔도 됩니다.
        </p>
      </div>

      {/* 1. 오퍼 핵심 문구 — 2안 택1 + 수정 */}
      <Card label="검증 페이지의 핵심 메시지" required>
        <div className="space-y-2">
          {draft.offer_options.map((o) => (
            <button
              key={o.headline}
              type="button"
              onClick={() => setOffer(o.headline)}
              className={`w-full rounded-md border px-4 py-3 text-left transition ${
                offer === o.headline
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
          ))}
        </div>
        <input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          maxLength={60}
          className={inputBase}
          placeholder="직접 고치셔도 됩니다"
        />
      </Card>

      {/* 2. 표시 가격 · 플랜 — 고객이 직접 구성 (1~3개) */}
      <Card label="검증 페이지에 표시할 가격 · 플랜" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          {draft.price_rationale}
        </p>
        <div className="space-y-2">
          {plans.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
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
          ))}
        </div>
        {plans.length < 3 && (
          <button
            type="button"
            onClick={() =>
              setPlans((arr) => [...arr, { label: "", price: 0 }])
            }
            className="mt-2 text-sm font-semibold text-accent transition hover:underline"
          >
            + 플랜 추가
          </button>
        )}
        <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
          단건 옵션을 여러 개 보여주거나 구독 플랜을 나눠도 됩니다. 어떤 플랜이
          많이 눌리는지도 같이 측정해 드립니다.
        </p>
      </Card>

      {/* 3. 가칭 */}
      <Card label="검증용 서비스 이름 (정식 출시 전 임시 이름)" required>
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

      {/* 플랜 선택 */}
      <Card label="비즈필터 검증 상품" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          여기서부터는 검증 페이지에 표시될 내용이 아니라, 저희 비즈필터에
          맡기실 검증 상품 선택입니다.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["engine", "quick"] as const).map((t) => {
            const info = lead.tiers[t];
            const disabled = t === "engine" && engineBlocked;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => setTier(t)}
                className={`rounded-md border px-4 py-3 text-left transition disabled:opacity-40 ${
                  tier === t
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface-light hover:border-accent/60"
                }`}
              >
                <span className="block text-[15px] font-bold text-text">
                  {info.label} · {info.priceLabel}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                  {disabled
                    ? "입력하신 페이지는 측정 설치가 안 되는 플랫폼이라 엔진 진행이 어렵습니다. Quick으로 진행해주세요"
                    : info.desc}
                </span>
              </button>
            );
          })}
        </div>
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
        {submitting ? "확정 중..." : "이대로 검증 시작하기"}
      </button>
      <p className="text-center text-xs text-text-tertiary">
        확정하시면 담당 검증 전문가가 보통 1~2시간 안에(영업시간 기준) 설계를
        직접 검토합니다. 문제가 없으면 그대로 진행하고, 보완할 점이 보이면
        먼저 연락드립니다.
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

function DepositStep({ lead }: { lead: PublicLead }) {
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

        <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold text-text-secondary">
              {tier.label}
            </p>
            <p className="text-2xl font-extrabold tracking-tight text-text">
              {tier.price.toLocaleString()}원
            </p>
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <Row k="입금 계좌" v={`${BANK_INFO.bank} ${BANK_INFO.account}`} />
            <Row k="예금주" v={BANK_INFO.holder} />
            <Row
              k="입금자명"
              v={`반드시 "${lead.name}"으로 입금해주세요`}
              strong
            />
            {due && <Row k="입금 기한" v={due} />}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            비즈필터는 개인사업자 &lsquo;득템잡이&rsquo;(대표 이민제)가 운영하는
            브랜드라 예금주가 위와 같이 표시됩니다.
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-bg-alt p-4">
          <p className="text-sm font-bold text-text">입금하신 다음은요</p>
          <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-text-secondary">
            <li>
              1. 담당 검증 전문가가 확정하신 준비안을 직접 검토합니다 (보통
              1~2시간, 영업시간 기준). 문제가 없으면 그대로 진행하고, 보완할
              점이 보이면 먼저 연락드립니다.
            </li>
            <li>
              2. 입금이 확인되면 남겨주신 번호로 문자를 보내드리고, 이 화면도
              다음 단계로 바뀝니다.
            </li>
            <li>
              3. 이 페이지는 닫으셔도 됩니다. 진행 코드로 언제든 다시 들어와
              현황을 보실 수 있고, 현황이 바뀔 때마다 문자를 드립니다.
            </li>
          </ol>
          <p className="mt-2 text-xs text-text-tertiary">
            세금계산서나 현금영수증이 필요하시면 카카오톡 채널로 알려주세요.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <a
            href="/"
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-bold text-text-secondary transition hover:text-text"
          >
            홈으로
          </a>
          <a
            href="/d"
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-bold text-text-secondary transition hover:text-text"
          >
            내 검증 현황
          </a>
        </div>
      </div>

      {/* 측정 연결(엔진)은 결제 후로 — 입금 화면은 입금에만 집중시킨다.
          설치 카드는 제작 준비/제작 단계(ProgressStep)에서 노출된다. */}

      {confirmed && (
        <div className="cold-panel rounded-lg p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            확정 내용
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="핵심 메시지" v={confirmed.offer} />
            <Row k="표시 가격·플랜" v={planText(confirmed)} />
            <Row k="임시 이름" v={confirmed.name} />
          </div>
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

      {/* 실측 숫자 — 광고 시작 후. 금액(광고비)은 어떤 형태로도 표시하지 않는다 */}
      {lead.stats && (
        <div className="cold-panel rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
              실시간 측정 숫자
            </p>
            {lead.stage === "live" && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                측정 중
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-border bg-surface-light px-3 py-3 text-center">
              <p className="text-[11px] font-semibold text-text-tertiary">방문</p>
              <p className="mt-1 text-xl font-extrabold tracking-tight text-text">
                {lead.stats.visits.toLocaleString()}
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface-light px-3 py-3 text-center">
              <p className="text-[11px] font-semibold text-text-tertiary">
                버튼 클릭
              </p>
              <p className="mt-1 text-xl font-extrabold tracking-tight text-text">
                {lead.stats.clicks.toLocaleString()}
              </p>
            </div>
            <div className="rounded-md border border-accent/40 bg-accent/5 px-3 py-3 text-center">
              <p className="text-[11px] font-semibold text-accent">결제 클릭</p>
              <p className="mt-1 text-xl font-extrabold tracking-tight text-accent">
                {lead.stats.payClicks.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-secondary">
            {lead.stats.visits > 0 ? (
              <>
                방문 100명당 결제 클릭{" "}
                <b className="text-text">
                  {((lead.stats.payClicks / lead.stats.visits) * 100).toFixed(1)}명
                </b>{" "}
                · 합격선 {lead.brief?.confirmed?.pass_bar ?? lead.passBar.bar}
              </>
            ) : (
              <>아직 집계된 방문이 없습니다. 광고가 돌기 시작하면 여기에 숫자가 쌓입니다.</>
            )}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            이 페이지를 열어두시면 숫자가 자동으로 갱신됩니다. 광고 노출·클릭
            등 채널 지표는 판정 리포트에 정리해 드립니다.
          </p>
        </div>
      )}
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
    ? c.plans.map((p) => `${p.label} ${p.price.toLocaleString()}원`).join(" / ")
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
