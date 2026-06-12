"use client";

import { useCallback, useEffect, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { BANK_INFO, type BriefDraft, type ConfirmedBrief } from "@/lib/diagnosis";
import { KAKAO_CHAT_URL, SITE_NAME } from "@/lib/site";

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
  passBar: { bar: string; reason: string; minSample: string };
  tiers: Record<
    "engine" | "quick",
    { label: string; price: number; priceLabel: string; desc: string }
  >;
  refundPolicy: readonly string[];
}

const STAGES: { key: Stage[]; label: string }[] = [
  { key: ["brief"], label: "브리프 확정" },
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
        <a href="/" className="flex items-center gap-2 font-extrabold text-text">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-white">
            B
          </span>
          {SITE_NAME}
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
              진행 코드 <b className="font-mono text-text-secondary">{code}</b>{" "}
              · 이 페이지를 즐겨찾기 해두시면 언제든 다시 보실 수 있습니다
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
        lead.stage === "closed") && <ProgressStep lead={lead} />}
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
  const [price, setPrice] = useState<number>(0);
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
    setPrice((v) => v || draft.price_value);
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
      "광고에 쓸 헤드라인을 뽑고 있습니다",
      "표시할 가격을 정하고 있습니다",
      "검증용 페이지 구성을 짜고 있습니다",
      "서비스 가칭을 만들고 있습니다",
    ];
    return (
      <div className="cold-panel flex flex-col items-center rounded-lg p-8 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-border border-t-accent" />
        <p className="mt-6 text-base font-bold text-text">
          검증 준비안을 짜고 있습니다
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          설계서를 바탕으로 광고 헤드라인, 가격, 페이지 구성을 준비합니다.
          10~20초 걸립니다.
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
    if (!offer.trim() || !price || !name.trim()) {
      setSubmitError("오퍼, 가격, 가칭을 확인해주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    // 타깃·문제·소구점·제외는 전문가(AI 초안)가 정한 그대로 내부 보관
    const confirmed: ConfirmedBrief = {
      offer: offer.trim(),
      target_line: draft!.target_line,
      problem_line: draft!.problem_line,
      price_value: price,
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

      {/* 1. 오퍼 헤드라인 — 2안 택1 + 수정 */}
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

      {/* 2. 표시 가격 */}
      <Card label="검증 페이지에 표시할 가격" required>
        <p className="mb-2 text-xs leading-relaxed text-text-tertiary">
          {draft.price_rationale}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={price || ""}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={100}
            step={100}
            className={`${inputBase} mt-0 text-right font-mono`}
          />
          <span className="text-sm font-bold text-text">원</span>
        </div>
      </Card>

      {/* 3. 가칭 */}
      <Card label="검증용 서비스 이름 (가칭)" required>
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
      <Card label="플랜" required>
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
        다음 화면에서 결제(입금)를 안내드립니다 · 입금 전까지는 전액 환불됩니다
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
          브리프가 확정됐습니다. 입금만 남았습니다.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          입금이 확인되면 48시간 안에 검증 준비가 끝나고, 진행 상황은 이
          페이지에서 계속 보실 수 있습니다.
        </p>

        <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold text-text-secondary">
              {tier.label} 플랜
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
        </div>

        <div className="mt-4 rounded-lg border border-border bg-bg-alt p-4">
          <p className="text-sm font-bold text-text">입금하신 다음은요</p>
          <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-text-secondary">
            <li>1. 입금 확인은 보통 몇 시간 안에 끝납니다 (영업시간 기준).</li>
            <li>
              2. 확인되면 남겨주신 번호로 문자를 보내드리고, 이 화면도 다음
              단계로 바뀝니다.
            </li>
            <li>
              3. 이 페이지는 닫으셔도 됩니다. 진행 코드로 언제든 다시 들어와
              현황을 보실 수 있습니다.
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

      {confirmed && (
        <div className="cold-panel rounded-lg p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            확정 내용
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="핵심 메시지" v={confirmed.offer} />
            <Row k="표시 가격" v={`${confirmed.price_value.toLocaleString()}원`} />
            <Row k="가칭" v={confirmed.name} />
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
    desc: "확정된 브리프 그대로 검증용 사이트와 광고 문구를 만듭니다. 48시간 안에 준비가 끝납니다.",
  },
  build: {
    title: "검증용 사이트를 만들고 있습니다.",
    desc: "완성되면 알림을 드리고, 이 페이지에서 바로 확인하실 수 있습니다.",
  },
  live: {
    title: "광고가 돌아가고 있습니다.",
    desc: "7일 동안 실제 광고비를 써서 수요를 측정합니다. 중간 숫자는 해석 없이 그대로 공유드립니다.",
  },
  verdict: {
    title: "판정이 나왔습니다.",
    desc: "합격선 대비 Go/No-Go 판정 리포트를 보내드렸습니다. 궁금한 점은 일주일간 카카오톡 채널로 답해드립니다.",
  },
  closed: {
    title: "검증이 완료됐습니다.",
    desc: "함께해주셔서 감사합니다. 조건을 바꿔 다시 검증하시면 30% 할인됩니다.",
  },
};

function ProgressStep({ lead }: { lead: PublicLead }) {
  const c = PROGRESS_COPY[lead.stage] ?? PROGRESS_COPY.paid;
  const confirmed = lead.brief?.confirmed;
  return (
    <div className="space-y-5">
      <div className="cold-panel rounded-lg p-6">
        <p className="text-lg font-bold text-text">{c.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {c.desc}
        </p>
      </div>
      {confirmed && (
        <div className="cold-panel rounded-lg p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            이번 검증의 내용
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="핵심 메시지" v={confirmed.offer} />
            <Row k="표시 가격" v={`${confirmed.price_value.toLocaleString()}원`} />
            <Row k="가칭" v={confirmed.name} />
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
