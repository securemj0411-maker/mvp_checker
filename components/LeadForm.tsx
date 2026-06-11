"use client";

import { useEffect, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { getSupabase } from "@/lib/supabase";

type StepId = "service" | "audience" | "revenue" | "stage" | "fear";
type Answers = Partial<Record<StepId, string>>;
type Status = "idle" | "submitting" | "done" | "error";

const QUESTIONS: {
  id: StepId;
  title: string;
  options: { value: string; label: string; hint?: string }[];
}[] = [
  {
    id: "service",
    title: "어떤 형태의 서비스인가요?",
    options: [
      {
        value: "web",
        label: "웹 서비스",
        hint: "브라우저로 쓰는 사이트·서비스",
      },
      { value: "app", label: "모바일 앱" },
      {
        value: "commerce",
        label: "온라인 판매",
        hint: "쇼핑몰 · 스마트스토어 · 브랜드",
      },
      { value: "offline", label: "오프라인 매장 · 지역 서비스" },
      { value: "unknown", label: "아직 형태를 못 정했어요" },
    ],
  },
  {
    id: "audience",
    title: "누구에게 파는 서비스인가요?",
    options: [
      { value: "b2c", label: "일반 소비자" },
      { value: "b2b", label: "회사 · 사장님" },
      { value: "both", label: "둘 다, 또는 아직 모르겠어요" },
    ],
  },
  {
    id: "revenue",
    title: "고객은 어떻게 돈을 내나요?",
    options: [
      { value: "once", label: "한 번 결제", hint: "단건 구매" },
      { value: "subscription", label: "월 구독" },
      { value: "fee", label: "광고 · 수수료" },
      { value: "undecided", label: "아직 안 정했어요" },
    ],
  },
  {
    id: "stage",
    title: "지금 어디까지 와 있나요?",
    options: [
      { value: "idea", label: "아이디어만 있어요" },
      { value: "planning", label: "기획 · 디자인 중이에요" },
      { value: "builder", label: "개발 중이거나, 직접 만들 수 있어요" },
      { value: "built", label: "이미 만들었는데 손님이 없어요" },
    ],
  },
  {
    id: "fear",
    title: "가장 확인하고 싶은 것은 무엇인가요?",
    options: [
      { value: "demand", label: "수요: 원하는 사람이 진짜 있는지" },
      { value: "unit", label: "수익 구조: 팔수록 남는 게 맞는지" },
      {
        value: "cac",
        label: "광고비: 고객 1명 데려오는 데 얼마 드는지",
      },
      {
        value: "all",
        label: "전부 다 (수요·수익 구조·광고비)",
        hint: "어차피 셋 다 알아야 시작할 수 있으니까",
      },
      { value: "priority", label: "순서: 뭐부터 해야 할지 모르겠어요" },
    ],
  },
];

const TOTAL_STEPS = QUESTIONS.length + 1; // +1 = 연락처 단계

/* 답변 기반 즉시 진단 — 규칙 기반, 과장 없이 */
function diagnose(a: Answers) {
  const fit =
    a.service === "offline"
      ? {
          level: "설계 상담",
          note: "오프라인·지역 기반 사업은 검증 설계가 달라집니다. 지역 타겟 광고와 사전 예약 측정으로 진행합니다. 가능한 설계인지 24시간 안에 먼저 답드립니다.",
        }
      : a.service === "unknown"
        ? {
            level: "중간",
            note: "형태가 정해지면 검증 정확도가 올라갑니다. 검증 설계 단계(Day 1)에서 형태부터 같이 잡습니다.",
          }
        : {
            level: "높음",
            note: "광고 검증으로 신호가 잘 잡히는 유형입니다.",
          };

  const plan =
    a.fear === "all"
      ? {
          name: "Quick → Deep",
          note: "수요는 Quick 7일에서 먼저 확인하고, 수익 구조·광고비 정밀 측정은 Deep에서, 전부 한 경로로 확인합니다.",
        }
      : a.fear === "unit" || a.fear === "cac"
        ? {
            name: "Quick → Deep",
            note: "수요 신호는 Quick에서, 단가·손익 정밀 측정은 Deep에서 잡는 경로를 권합니다.",
          }
        : {
            name: "Quick",
            note: "7일 수요 검증부터 시작하는 경로를 권합니다.",
          };

  const signals: string[] = [];
  if (a.stage === "built") {
    signals.push(
      "이미 만드신 경우, 수요 문제인지 유입·전환 문제인지부터 가립니다",
    );
  }
  signals.push(
    a.audience === "b2b"
      ? "검색 광고에서 '문제 해결 의도' 키워드로 클릭이 오는지"
      : "광고를 본, 당신을 모르는 사람이 클릭하는지",
  );
  signals.push(
    a.revenue === "subscription"
      ? "구독 가격을 보고도 신청 버튼을 누르는지"
      : "가격을 본 뒤에도 결제 버튼을 누르는지",
  );
  signals.push("고객 1명 데려오는 데 드는 비용(CAC)이 얼마인지");

  return { fit, plan, signals: signals.slice(0, 3) };
}

export default function LeadForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [idea, setIdea] = useState("");

  const isDetailStep = step === QUESTIONS.length;

  // 유입 채널 캡처 — /yt 등에서 붙은 utm_source를 세션에 보관 (페이지 이동에도 유지)
  useEffect(() => {
    try {
      const utm = new URLSearchParams(window.location.search).get(
        "utm_source",
      );
      if (utm) sessionStorage.setItem("o2o_utm", utm.slice(0, 50));
    } catch {
      /* sessionStorage 비활성 환경 무시 */
    }
  }, []);

  function pick(id: StepId, value: string) {
    if (Object.keys(answers).length === 0) {
      sendGAEvent("event", "quiz_start", { first_answer: value });
    }
    setAnswers((prev) => ({ ...prev, [id]: value }));
    // 탭 직후 짧은 지연 후 자동 진행 — 게임처럼 끊김 없이
    setTimeout(() => setStep((s) => Math.min(s + 1, QUESTIONS.length)), 170);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    let utm: string | null = null;
    try {
      utm = sessionStorage.getItem("o2o_utm");
    } catch {
      /* ignore */
    }

    const { error } = await getSupabase().from("o2o_leads").insert({
      name: name.trim(),
      email: contact.trim(),
      idea: idea.trim(),
      source: "landing-quiz",
      utm_source: utm,
      service_type: answers.service ?? null,
      audience: answers.audience ?? null,
      revenue_model: answers.revenue ?? null,
      stage: answers.stage ?? null,
      fear: answers.fear ?? null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.error("[lead submit error]", error);
      setErrorMsg(
        "제출 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요. 계속 문제가 생기면 카톡 채널로 문의해주세요.",
      );
      setStatus("error");
      return;
    }
    sendGAEvent("event", "generate_lead", {
      method: "quiz",
      utm_source: utm ?? "direct",
      stage: answers.stage ?? "unknown",
      fear: answers.fear ?? "unknown",
    });
    setStatus("done");
  }

  /* ───────── 결과 화면 — 제출 즉시 진단 (마음이 식기 전에 보상) ───────── */
  if (status === "done") {
    const d = diagnose(answers);
    return (
      <div className="cold-panel rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent"
            style={{ boxShadow: "0 0 24px var(--accent-glow)" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-text">접수됐습니다.</p>
            <p className="text-sm text-text-secondary">
              답변 기준 1차 진단입니다. 24시간 안에 직접 확인 후 회신드립니다.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface-light p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
              광고 검증 적합도
            </p>
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
              {d.fit.level}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {d.fit.note}
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface-light p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            저희가 측정하게 될 신호
          </p>
          <ul className="mt-3 space-y-2">
            {d.signals.map((s) => (
              <li
                key={s}
                className="flex items-start gap-2 text-sm leading-relaxed text-text"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface-light p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
              추천 경로
            </p>
            <span className="text-sm font-bold text-text">{d.plan.name}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {d.plan.note}
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-text-tertiary">
          최종 가능 여부와 견적은 사람이 직접 검토 후 회신드립니다 ·
          비밀유지 약속
        </p>
      </div>
    );
  }

  /* ───────── 마지막 단계 — 연락처 ───────── */
  if (isDetailStep) {
    return (
      <form
        onSubmit={handleSubmit}
        className="cold-panel space-y-5 rounded-lg p-6 sm:p-8"
      >
        <Progress step={step} />
        <div>
          <p className="text-xl font-bold text-text">
            마지막입니다. 어떤 아이디어인가요?
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            제출하면 답변 기준 검증 적합도를 바로 보여드립니다.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">
            아이디어 한 줄
          </label>
          <input
            required
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className={inputBase}
            placeholder="예: 직장인 점심 단체주문 자동화 서비스"
            maxLength={1000}
          />
          <p className="mt-2 text-xs text-text-tertiary">
            아직 정리 중이어도 괜찮습니다. 핵심 고객과 문제만 짧게.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">
              이름
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputBase}
              placeholder="홍길동"
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">
              이메일 또는 카톡 ID
            </label>
            <input
              required
              minLength={3}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={inputBase}
              placeholder="you@example.com"
              maxLength={254}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-md bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_12px_32px_var(--accent-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {status === "submitting"
            ? "보내는 중..."
            : "제출하고 검증 적합도 바로 보기"}
        </button>
        <div className="flex items-center justify-between">
          <BackButton onClick={() => setStep((s) => s - 1)} />
          <p className="text-xs text-text-tertiary">
            신청은 결제가 아닙니다 · 비밀유지 약속
          </p>
        </div>
      </form>
    );
  }

  /* ───────── 질문 단계 — 탭 한 번이면 다음으로 ───────── */
  const q = QUESTIONS[step];
  return (
    <div className="cold-panel space-y-5 rounded-lg p-6 sm:p-8">
      <Progress step={step} />
      <div key={q.id} className="quiz-step-in space-y-5">
        <p className="text-xl font-bold text-text">{q.title}</p>
        <div className="space-y-2.5">
          {q.options.map((o) => {
            const selected = answers[q.id] === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => pick(q.id, o.value)}
                className={`w-full rounded-md border px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface-light hover:border-accent/60 hover:bg-bg-alt"
                }`}
              >
                <span className="block text-[15px] font-semibold text-text">
                  {o.label}
                </span>
                {o.hint && (
                  <span className="mt-0.5 block text-xs text-text-tertiary">
                    {o.hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <BackButton onClick={() => setStep((s) => s - 1)} />
          ) : (
            <span />
          )}
          <p className="text-xs text-text-tertiary">
            끝에서 검증 적합도를 바로 보여드립니다
          </p>
        </div>
      </div>
    </div>
  );
}

const inputBase =
  "w-full rounded-md border border-border bg-surface-light px-4 py-3 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent focus:bg-bg-alt";

function Progress({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-text-tertiary">
        <span>
          {step < QUESTIONS.length
            ? `질문 ${step + 1} / ${QUESTIONS.length}`
            : "마지막 단계"}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-alt">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${Math.max(pct, 6)}%` }}
        />
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-text-tertiary transition hover:text-text"
    >
      ← 이전
    </button>
  );
}
