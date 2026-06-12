"use client";

import { useEffect, useRef, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { KAKAO_CHAT_URL } from "@/lib/site";
import type {
  InterpretResult,
  QuizAnswers,
  RecommendedPath,
  Report,
} from "@/lib/diagnosis";

/* ─────────────────────────────────────────────────────────────
   토스식 인앱 퀴즈 — 한 화면에 질문 하나.
   아이디어 입력 → AI 되물음(해석 후보 선택) → 객관식 청크 →
   연락처 → 무료 AI 검증 설계서.
   ───────────────────────────────────────────────────────────── */

type Phase = "idea" | "interpret" | "quiz" | "contact" | "generating" | "done";

type QuizKey = keyof Pick<
  QuizAnswers,
  "service" | "build" | "audience" | "revenue" | "price" | "alternative" | "region"
>;

interface Question {
  id: QuizKey;
  title: string;
  sub?: string;
  options: { value: string; label: string; hint?: string }[];
  /** 답변 상태에 따라 노출 여부 결정 (업종별 분기) */
  when?: (a: Partial<Record<QuizKey, string>>) => boolean;
}

const QUESTIONS: Question[] = [
  {
    id: "service",
    title: "어떤 형태의 서비스인가요?",
    options: [
      { value: "web", label: "웹 서비스", hint: "브라우저로 쓰는 사이트 · 서비스" },
      { value: "app", label: "모바일 앱" },
      { value: "commerce", label: "온라인 판매", hint: "쇼핑몰 · 스마트스토어 · 브랜드" },
      { value: "offline", label: "오프라인 매장 · 지역 서비스" },
      { value: "content", label: "콘텐츠 · 교육 · 클래스" },
      { value: "unknown", label: "아직 형태를 못 정했어요" },
    ],
  },
  {
    id: "build",
    title: "검증용 페이지는 어떻게 준비할까요?",
    sub: "답에 따라 가장 싼 경로를 추천해 드립니다.",
    options: [
      {
        value: "self",
        label: "제가 직접 만들 수 있어요",
        hint: "바이브코딩 · 노코드로 랜딩페이지를 직접 만들 수 있는 경우",
      },
      {
        value: "need",
        label: "테스트용 사이트가 필요해요",
        hint: "실서비스처럼 보이는 검증용 사이트를 저희가 만듭니다",
      },
      {
        value: "built",
        label: "이미 만들어져 있어요",
        hint: "서비스나 페이지가 이미 개발돼 있는 경우",
      },
    ],
  },
  {
    id: "audience",
    title: "돈은 누가 내나요?",
    sub: "여러 종류라면, 첫 결제를 낼 한 부류만 골라주세요.",
    options: [
      { value: "b2c", label: "일반 소비자" },
      { value: "b2b", label: "회사 · 사장님" },
      { value: "both", label: "둘 다, 또는 아직 모르겠어요" },
    ],
  },
  {
    id: "region",
    title: "주 고객은 어디서 오나요?",
    when: (a) => a.service === "offline",
    options: [
      { value: "local", label: "동네 상권", hint: "반경 3~5km 안에서 오는 손님" },
      { value: "city", label: "도시 전체" },
      { value: "nationwide", label: "전국", hint: "배송이나 예약으로 전국 대상" },
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
    id: "price",
    title: "한 사람이 내는 금액, 어느 정도로 생각하세요?",
    sub: "감으로 골라주셔도 됩니다. 합격선 계산에 쓰입니다.",
    options: [
      { value: "under10k", label: "1만원 미만" },
      { value: "10kto50k", label: "1~5만원" },
      { value: "50kto100k", label: "5~10만원" },
      { value: "over100k", label: "10만원 이상" },
      { value: "unknown", label: "아직 모르겠어요" },
    ],
  },
  {
    id: "alternative",
    title: "고객은 지금 이 문제를 어떻게 해결하고 있나요?",
    options: [
      { value: "competitor", label: "비슷한 서비스를 쓰고 있어요" },
      { value: "manual", label: "수작업 · 엑셀 같은 임시방편으로 버텨요" },
      { value: "none", label: "마땅한 방법 없이 그냥 참고 있어요" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
];

const GENERATING_MESSAGES = [
  "아이디어 구조를 분해하고 있습니다",
  "타깃과 첫 결제 장면을 좁히고 있습니다",
  "광고 채널을 결정하고 있습니다",
  "합격선 숫자를 계산하고 있습니다",
  "리스크를 점검하고 있습니다",
];

export default function LeadForm() {
  const [phase, setPhase] = useState<Phase>("idea");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<QuizKey, string>>>({});

  const [idea, setIdea] = useState("");
  const [ideaRefined, setIdeaRefined] = useState<string | null>(null);
  const [interp, setInterp] = useState<InterpretResult | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [path, setPath] = useState<RecommendedPath>("quick");
  const [genMsgIdx, setGenMsgIdx] = useState(0);

  const skippedInterpret = useRef(false);

  /* 노출되는 질문만 (업종별 분기) */
  const visibleQuestions = QUESTIONS.filter((q) => !q.when || q.when(answers));
  const totalChunks = 2 + visibleQuestions.length + 1; // 아이디어 + 되물음 + 질문 + 연락처
  const chunkIndex =
    phase === "idea"
      ? 0
      : phase === "interpret"
        ? 1
        : phase === "quiz"
          ? 2 + qIndex
          : totalChunks - 1;

  /* 유입 채널 캡처 — /yt 등에서 붙은 utm_source 를 세션에 보관 */
  useEffect(() => {
    try {
      const utm = new URLSearchParams(window.location.search).get("utm_source");
      if (utm) sessionStorage.setItem("o2o_utm", utm.slice(0, 50));
    } catch {
      /* sessionStorage 비활성 환경 무시 */
    }
  }, []);

  /* 설계서 생성 중 메시지 순환 */
  useEffect(() => {
    if (phase !== "generating") return;
    const t = setInterval(
      () => setGenMsgIdx((i) => (i + 1) % GENERATING_MESSAGES.length),
      3200,
    );
    return () => clearInterval(t);
  }, [phase]);

  function getUtm(): string | null {
    try {
      return sessionStorage.getItem("o2o_utm");
    } catch {
      return null;
    }
  }

  /* ── 1단계: 아이디어 제출 → AI 되물음 요청 ── */
  async function submitIdea() {
    if (idea.trim().length < 5) return;
    sendGAEvent("event", "quiz_start", { method: "idea_first" });
    setPhase("interpret");
    skippedInterpret.current = false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "interpret", idea: idea.trim() }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data?.result?.candidates?.length) {
        setInterp(data.result as InterpretResult);
      } else {
        skipInterpret();
      }
    } catch {
      skipInterpret();
    } finally {
      clearTimeout(timeout);
    }
  }

  function skipInterpret() {
    skippedInterpret.current = true;
    setInterp(null);
    setPhase("quiz");
  }

  function pickInterpretation(detail: string | null) {
    setIdeaRefined(detail);
    sendGAEvent("event", "quiz_interpret_pick", {
      picked: detail ? "candidate" : "original",
    });
    setPhase("quiz");
  }

  /* ── 객관식: 탭 한 번이면 다음 청크 ── */
  function pick(id: QuizKey, value: string) {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    const visible = QUESTIONS.filter((q) => !q.when || q.when(next));
    setTimeout(() => {
      if (qIndex + 1 < visible.length) setQIndex((i) => i + 1);
      else setPhase("contact");
    }, 170);
  }

  function goBackFromQuiz() {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setPhase("idea");
  }

  /* ── 제출 → 설계서 생성 ── */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setPhase("generating");

    const quizAnswers: QuizAnswers = {
      idea: idea.trim(),
      ideaRefined,
      service: (answers.service ?? "unknown") as QuizAnswers["service"],
      build: (answers.build ?? "need") as QuizAnswers["build"],
      audience: (answers.audience ?? "unknown") as QuizAnswers["audience"],
      revenue: (answers.revenue ?? "undecided") as QuizAnswers["revenue"],
      price: (answers.price ?? "unknown") as QuizAnswers["price"],
      alternative: (answers.alternative ??
        "unknown") as QuizAnswers["alternative"],
      region: (answers.region as QuizAnswers["region"]) ?? null,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report",
          answers: quizAnswers,
          name: name.trim(),
          contact: contact.trim(),
          phone: phone.trim() || undefined,
          utm: getUtm(),
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (!data?.report) throw new Error("no report");

      sendGAEvent("event", "generate_lead", {
        method: "quiz_v2",
        utm_source: getUtm() ?? "direct",
        build_status: quizAnswers.build,
        report_source: data.source ?? "unknown",
      });
      setReport(data.report as Report);
      setPath((data.path as RecommendedPath) ?? "quick");
      setPhase("done");
    } catch (err) {
      console.error("[lead submit error]", err);
      setErrorMsg(
        "설계서 생성 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요. 계속 문제가 생기면 카톡 채널로 문의해주세요.",
      );
      setPhase("contact");
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  /* ───────────────────── 화면 ───────────────────── */

  if (phase === "done" && report) {
    return <ReportView report={report} path={path} />;
  }

  if (phase === "generating") {
    return (
      <div className="cold-panel rounded-lg p-8 sm:p-10">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-border border-t-accent" />
          </div>
          <p
            key={genMsgIdx}
            className="quiz-step-in mt-7 text-lg font-bold text-text"
          >
            {GENERATING_MESSAGES[genMsgIdx]}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            검증 설계서를 만들고 있습니다. 10~30초 정도 걸립니다.
          </p>
        </div>
      </div>
    );
  }

  /* 아이디어 입력 — 첫 청크 */
  if (phase === "idea") {
    return (
      <div className="cold-panel space-y-5 rounded-lg p-6 sm:p-8">
        <Progress current={chunkIndex} total={totalChunks} />
        <div>
          <p className="text-xl font-bold text-text">
            어떤 아이디어인가요? 한 줄이면 됩니다.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            끝까지 답하면 광고 채널과 합격선이 담긴 검증 설계서를 무료로
            드립니다.
          </p>
        </div>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className={`${inputBase} min-h-[96px] resize-y leading-relaxed`}
          rows={3}
          placeholder={"예: 직장인 점심 단체주문을 자동화하는 서비스"}
          maxLength={2000}
        />
        <button
          type="button"
          disabled={idea.trim().length < 5}
          onClick={submitIdea}
          className="w-full rounded-md bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
        >
          다음
        </button>
        <p className="text-center text-xs text-text-tertiary">
          신청은 결제가 아닙니다 · 비밀유지 약속
        </p>
      </div>
    );
  }

  /* AI 되물음 — 해석 후보 선택 */
  if (phase === "interpret") {
    return (
      <div className="cold-panel space-y-5 rounded-lg p-6 sm:p-8">
        <Progress current={chunkIndex} total={totalChunks} />
        {!interp ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="mt-5 text-base font-bold text-text">
              아이디어를 읽고 있습니다
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              검증 가능한 형태로 좁혀볼게요. 몇 초면 됩니다.
            </p>
          </div>
        ) : (
          <div className="quiz-step-in space-y-5">
            <div>
              <p className="text-xl font-bold text-text">
                이런 뜻으로 이해했는데, 맞나요?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {interp.summary}
              </p>
            </div>
            <div className="space-y-2.5">
              {interp.candidates.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => pickInterpretation(c.detail)}
                  className="w-full rounded-md border border-border bg-surface-light px-4 py-3.5 text-left transition hover:border-accent/60 hover:bg-bg-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="block text-[15px] font-semibold text-text">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                    {c.detail}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickInterpretation(null)}
                className="w-full rounded-md border border-dashed border-border px-4 py-3.5 text-left text-[15px] font-semibold text-text-secondary transition hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                제 설명 그대로 진행할게요
              </button>
            </div>
            <div className="flex items-center justify-between">
              <BackButton onClick={() => setPhase("idea")} />
              <p className="text-xs text-text-tertiary">
                고른 해석 기준으로 설계서가 만들어집니다
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* 연락처 — 마지막 청크 */
  if (phase === "contact") {
    return (
      <form
        onSubmit={handleSubmit}
        className="cold-panel space-y-5 rounded-lg p-6 sm:p-8"
      >
        <Progress current={chunkIndex} total={totalChunks} />
        <div>
          <p className="text-xl font-bold text-text">
            마지막입니다. 설계서를 어디로 보내드릴까요?
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            제출하면 검증 설계서를 바로 화면에서 보여드리고, 24시간 안에 사람이
            직접 검토 후 회신드립니다.
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
              placeholder="이메일 주소 또는 카톡 ID"
              maxLength={254}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">
            휴대폰 번호{" "}
            <span className="font-normal text-text-tertiary">
              (선택 · 빠른 상담을 원하시면)
            </span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputBase}
            placeholder="010-1234-5678"
            maxLength={20}
          />
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_12px_32px_var(--accent-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {submitting ? "보내는 중..." : "무료 검증 설계서 받기"}
        </button>
        <p className="text-center text-xs text-text-tertiary">
          폼 작성이 번거로우시면{" "}
          <a
            href={KAKAO_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sendGAEvent("event", "kakao_open", { from: "form" })}
            className="font-bold text-text underline underline-offset-2"
          >
            카카오톡으로 바로 문의
          </a>
          하셔도 됩니다.
        </p>
        <div className="flex items-center justify-between">
          <BackButton
            onClick={() => {
              setPhase("quiz");
              setQIndex(visibleQuestions.length - 1);
            }}
          />
          <p className="text-xs text-text-tertiary">
            신청은 결제가 아닙니다 · 비밀유지 약속
          </p>
        </div>
      </form>
    );
  }

  /* 객관식 청크 */
  const q = visibleQuestions[Math.min(qIndex, visibleQuestions.length - 1)];
  return (
    <div className="cold-panel space-y-5 rounded-lg p-6 sm:p-8">
      <Progress current={chunkIndex} total={totalChunks} />
      <div key={q.id} className="quiz-step-in space-y-5">
        <div>
          <p className="text-xl font-bold text-text">{q.title}</p>
          {q.sub && (
            <p className="mt-1 text-sm text-text-secondary">{q.sub}</p>
          )}
        </div>
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
          <BackButton onClick={goBackFromQuiz} />
          <p className="text-xs text-text-tertiary">
            끝에서 검증 설계서를 무료로 드립니다
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── 설계서 결과 화면 ───────────────── */

function ReportView({
  report,
  path,
}: {
  report: Report;
  path: RecommendedPath;
}) {
  useEffect(() => {
    sendGAEvent("event", "report_view", { path });
  }, [path]);

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
          <p className="text-xl font-bold text-text">검증 설계서가 나왔습니다</p>
          <p className="text-sm text-text-secondary">
            24시간 안에 사람이 직접 검토하고 회신드립니다.
          </p>
        </div>
      </div>

      {/* 한 문장 정리 */}
      <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
          이번 검증이 시험할 한 문장
        </p>
        <p className="mt-2 text-base font-bold leading-relaxed text-text">
          {report.one_liner}
        </p>
      </div>

      {/* 구조 분해 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ["타깃", report.target],
          ["문제", report.problem],
          ["현재 대안", report.current_alternative],
          ["가격 가설", report.price_hypothesis],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border border-border bg-surface-light p-4"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
              {k}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text">{v}</p>
          </div>
        ))}
      </div>

      {/* 채널 + 합격선 */}
      <div className="mt-4 rounded-lg border border-border bg-surface-light p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            추천 광고 채널
          </p>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
            {report.channel}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {report.channel_reason}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface-light p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
            합격선
          </p>
          <span className="text-sm font-bold text-text">{report.pass_bar}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {report.pass_bar_reason} 합격선은 광고를 시작하기 전에 함께 확정하고,
          데이터를 본 뒤에는 어느 쪽도 바꾸지 못합니다.
        </p>
      </div>

      {/* 리스크 */}
      <div className="mt-4 rounded-lg border border-border bg-surface-light p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
          이 아이디어의 리스크
        </p>
        <ul className="mt-3 space-y-2.5">
          {report.risks.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2 text-sm leading-relaxed text-text"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* 분석의 한계 — 정직 고백 */}
      <div className="mt-4 rounded-lg border border-border bg-bg-alt p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
          이 설계서가 알 수 없는 것
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {report.blind_spot}
        </p>
        <p className="mt-3 text-sm font-bold leading-relaxed text-text">
          여기까지가 분석이 알 수 있는 전부입니다. 나머지는 시장만 압니다. 위
          설계 그대로, 진짜 광고비를 써서 확인하는 것이 다음 단계입니다.
        </p>
      </div>

      {/* 경로별 CTA */}
      <PathCta path={path} />

      <p className="mt-3 text-center text-xs text-text-tertiary">
        가장 빠른 답변은 카톡입니다. 메일/전화로도 24시간 안에 회신드립니다 ·
        비밀유지 약속
      </p>
    </div>
  );
}

function PathCta({ path }: { path: RecommendedPath }) {
  const isEngine = path === "engine";
  return (
    <div className="mt-6 space-y-3">
      <div className="rounded-lg border border-accent/40 bg-accent/5 p-5">
        <p className="text-sm font-bold text-accent">
          {isEngine ? "추천 경로: 엔진 29만원" : "추천 경로: Quick 50만원 · 7일"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {isEngine
            ? "페이지를 직접 준비하시는 분께는 제작을 뺀 검증 엔진만 드립니다. 광고 세팅과 7일 집행(광고비 5만원 포함), 측정, 합격선 판정까지. 재검증은 30% 할인됩니다."
            : "실서비스처럼 보이는 검증용 사이트 제작부터 광고 7일 집행, 측정, Go/No-Go 판정까지 전부 포함입니다. 분명한 판정을 못 드리면 전액 환불합니다."}
        </p>
      </div>
      <a
        href={KAKAO_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          sendGAEvent("event", "kakao_open", {
            from: "report",
            tier: isEngine ? "engine" : "quick",
          })
        }
        className="flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-bold transition hover:brightness-95"
        style={{ background: "#FEE500", color: "#191600" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.7-2.5.6.1 1.3.1 2 .1 5.5 0 10-3.5 10-7.8C22 6.5 17.5 3 12 3z" />
        </svg>
        {isEngine
          ? "이 설계 그대로 엔진으로 시작하기"
          : "이 설계 그대로 Quick으로 시작하기"}
      </a>
      <p className="text-center text-xs text-text-tertiary">
        {isEngine
          ? "제작까지 맡기고 싶으시면 Quick 50만원, 단가와 손익까지 보려면 Deep 130만원도 있습니다."
          : "수요 확인 후 단가와 손익까지 보려면 Deep 130만원으로 이어집니다."}
      </p>
    </div>
  );
}

/* ───────────────── 공용 ───────────────── */

const inputBase =
  "w-full rounded-md border border-border bg-surface-light px-4 py-3 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent focus:bg-bg-alt";

function Progress({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-text-tertiary">
        <span>
          {current + 1} / {total}
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
