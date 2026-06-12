"use client";

import { useEffect, useRef, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { KAKAO_CHAT_URL } from "@/lib/site";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
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
  | "service"
  | "build"
  | "audience"
  | "revenue"
  | "price"
  | "alternative"
  | "region"
  | "location"
  | "pageUrl"
>;

interface Question {
  id: QuizKey;
  title: string;
  sub?: string;
  /** kind 생략 = 객관식 탭. "text" = 한 줄 입력 청크 */
  kind?: "text";
  placeholder?: string;
  /** 텍스트 청크에서 비워두고 넘어가는 버튼 문구 */
  skipLabel?: string;
  options?: { value: string; label: string; hint?: string }[];
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
        hint: "이 아이디어를 위한 페이지가 이미 있고, 직접 고칠 수 있는 경우",
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
    id: "location",
    title: "어느 지역인가요?",
    sub: "지역타겟 광고 반경의 중심이 됩니다. 시/구/동까지면 충분합니다.",
    kind: "text",
    placeholder: "예: 서울 강남구 역삼동",
    skipLabel: "아직 안 정했어요",
    when: (a) => a.service === "offline",
  },
  {
    id: "pageUrl",
    title: "만들어 둔 페이지 주소를 알려주세요.",
    sub: "측정 장치를 설치할 수 있는 페이지인지 미리 확인해 드립니다.",
    kind: "text",
    placeholder: "예: https://my-service.com",
    skipLabel: "지금은 못 알려드려요",
    when: (a) => a.build === "built",
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
    sub: "감으로 골라주셔도 됩니다. 구독이라면 한 달 기준으로, 회사 대상이라면 회사 하나 기준으로 골라주세요.",
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
      { value: "none", label: "마땅한 방법이 없어 불편을 감수하고 있어요" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
];

const STORAGE_KEY = "bizfilter_quiz_v2";

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
  const [contact, setContact] = useState(""); // 전화번호
  const [customMode, setCustomMode] = useState(false);
  const [customRefine, setCustomRefine] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [path, setPath] = useState<RecommendedPath>("quick");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [policyFlag, setPolicyFlag] = useState<string>("none");
  const [policyLabel, setPolicyLabel] = useState<string | null>(null);
  const [genMsgIdx, setGenMsgIdx] = useState(0);

  const skippedInterpret = useRef(false);
  const interpretStatus = useRef<string>("original");
  const restored = useRef(false);

  /* 이탈 후 복귀 — 진행 상태를 로컬에 저장하고, 재방문 시 이어서 진행 */
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s || typeof s !== "object") return;
      if (typeof s.idea === "string") setIdea(s.idea);
      if (typeof s.ideaRefined === "string") setIdeaRefined(s.ideaRefined);
      if (s.answers && typeof s.answers === "object") setAnswers(s.answers);
      if (typeof s.name === "string") setName(s.name);
      if (typeof s.contact === "string") setContact(s.contact);
      if (s.phase === "quiz" || s.phase === "contact") {
        setPhase(s.phase);
        setQIndex(Math.max(0, Math.min(s.qIndex ?? 0, QUESTIONS.length - 1)));
      }
    } catch {
      /* 손상된 저장값 무시 */
    }
  }, []);

  useEffect(() => {
    if (!restored.current || phase === "generating" || phase === "done") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          // interpret 단계는 후보를 저장하지 않으므로 아이디어 입력으로 복귀
          phase: phase === "interpret" ? "idea" : phase,
          qIndex,
          idea,
          ideaRefined,
          answers,
          name,
          contact,
        }),
      );
    } catch {
      /* 저장 불가 환경 무시 */
    }
  }, [phase, qIndex, idea, ideaRefined, answers, name, contact]);

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
    setGenMsgIdx(0);
    const t = setInterval(
      () =>
        setGenMsgIdx((i) => Math.min(i + 1, GENERATING_MESSAGES.length - 1)),
      4500,
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
    interpretStatus.current = "skipped_error";
    setInterp(null);
    setPhase("quiz");
  }

  function pickInterpretation(detail: string | null) {
    setIdeaRefined(detail);
    interpretStatus.current = detail ? "picked" : "original";
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
      location: answers.location?.trim() || null,
      pageUrl: answers.pageUrl?.trim() || null,
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
          phone: contact.trim() || undefined,
          utm: getUtm(),
          interpretStatus: interpretStatus.current,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      // prohibited면 report가 null로 와도 정상 (짧은 거절 화면). 그 외엔 report 필수.
      const blocked = data?.policyFlag === "prohibited";
      if (!data?.report && !blocked) throw new Error("no report");

      sendGAEvent("event", "generate_lead", {
        method: "quiz_v2",
        utm_source: getUtm() ?? "direct",
        build_status: quizAnswers.build,
        report_source: data.source ?? "unknown",
      });
      setReport((data.report as Report) ?? null);
      setPath((data.path as RecommendedPath) ?? "quick");
      setAccessCode((data.accessCode as string) ?? null);
      setPolicyFlag((data.policyFlag as string) ?? "none");
      setPolicyLabel((data.policyLabel as string) ?? null);
      setPhase("done");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
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

  if (phase === "done") {
    if (policyFlag === "prohibited") {
      return <RejectView policyLabel={policyLabel} />;
    }
    if (report) {
      return (
        <ReportView
          report={report}
          path={path}
          build={(answers.build ?? "need") as QuizAnswers["build"]}
          accessCode={accessCode}
        />
      );
    }
  }

  if (phase === "generating") {
    return (
      <div className="cold-panel rounded-lg p-8 sm:p-10">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-border border-t-accent" />
          </div>
          <p
            key={genMsgIdx}
            className="quiz-step-in mt-6 text-lg font-bold text-text"
          >
            {GENERATING_MESSAGES[genMsgIdx]}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            이 아이디어를 어디에 광고로 걸고, 보통 며칠 안에 몇 명을 불러와,
            어떤 숫자가 나오면 합격인지 계산하고 있습니다. 10~30초 걸립니다.
          </p>
          {/* 의사 진행률 바 — 24초에 걸쳐 90%까지, 완료 시 화면 전환 */}
          <div className="mt-6 h-2 w-56 max-w-full overflow-hidden rounded-full bg-bg-alt">
            <div className="gen-progress h-full rounded-full bg-accent" />
          </div>
          <ol className="mt-6 space-y-1.5 text-left text-sm text-text-tertiary">
            {GENERATING_MESSAGES.map((m, i) => (
              <li key={m} className="flex items-center gap-2">
                <span
                  className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded-full text-[10px] ${
                    i < genMsgIdx
                      ? "bg-accent text-white"
                      : i === genMsgIdx
                        ? "border border-accent text-accent"
                        : "border border-border"
                  }`}
                >
                  {i < genMsgIdx ? "✓" : ""}
                </span>
                <span className={i <= genMsgIdx ? "text-text-secondary" : ""}>
                  {m}
                </span>
              </li>
            ))}
          </ol>
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
            끝까지 답하면, 이 아이디어로 어디에 광고를 걸어 어떤 사람들을 수백
            명 불러올지 담긴 검증 설계서를 무료로 드립니다.
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
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-border border-t-accent" />
            <p className="mt-5 text-base font-bold text-text">
              AI가 아이디어를 분석하고 있습니다
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              이 문장 그대로 광고 문구와 검증용 페이지가 만들어져 진짜 사람들이
            보게 됩니다. 그래서 한 번 더 확인해요.
            </p>
            <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-bg-alt">
              <div className="loading-sweep h-full rounded-full bg-accent" />
            </div>
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
            {customMode ? (
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-text-secondary">
                  한 문장으로 직접 정리해주세요
                </p>
                <textarea
                  autoFocus
                  value={customRefine}
                  onChange={(e) => setCustomRefine(e.target.value)}
                  className={`${inputBase} min-h-[80px] resize-y leading-relaxed`}
                  placeholder="예: 1인 미용실 원장이 노쇼 손님 때문에 매출이 비는 문제를 예약금으로 막아주는 서비스"
                  maxLength={300}
                />
                <button
                  type="button"
                  disabled={customRefine.trim().length < 5}
                  onClick={() => pickInterpretation(customRefine.trim())}
                  className="w-full rounded-md bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover disabled:opacity-40"
                >
                  이 내용으로 진행
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="w-full text-center text-sm font-medium text-text-tertiary transition hover:text-text"
                >
                  ← 추천 해석에서 고를게요
                </button>
              </div>
            ) : (
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
                  onClick={() => {
                    setCustomRefine(ideaRefined || idea);
                    setCustomMode(true);
                  }}
                  className="w-full rounded-md border border-dashed border-border px-4 py-3.5 text-left text-[15px] font-semibold text-text-secondary transition hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  다 아니에요. 제가 직접 쓸게요
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <BackButton onClick={() => setPhase("idea")} />
              <p className="text-xs text-text-tertiary">
                고른 내용 기준으로 설계서가 만들어집니다
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
            거의 다 됐어요. 연락받을 곳만 남겨주세요.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            검증 설계서는 바로 다음 화면에 뜹니다. 연락처는 진행 상황을
            알려드릴 때만 씁니다.
          </p>
        </div>
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
            휴대폰 번호
          </label>
          <input
            required
            type="tel"
            inputMode="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
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
          작성 중 막히는 부분이 있으면{" "}
          <a
            href={KAKAO_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sendGAEvent("event", "kakao_open", { from: "form" })}
            className="font-bold text-text underline underline-offset-2"
          >
            카카오톡 채널
          </a>
          로 알려주세요.
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
        {q.kind === "text" ? (
          <TextChunk
            key={q.id}
            placeholder={q.placeholder}
            skipLabel={q.skipLabel}
            initial={answers[q.id] ?? ""}
            onSubmit={(v) => pick(q.id, v)}
          />
        ) : (
        <div className="space-y-2.5">
          {(q.options ?? []).map((o) => {
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
        )}
        <div className="flex items-center justify-between">
          <BackButton onClick={goBackFromQuiz} />
          <p className="text-xs text-text-tertiary">
            이 답으로 광고 채널과 합격선이 정해집니다 · 끝에서 설계서 무료
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── 정책 차단 — 짧은 거절 화면 ───────────────── */

function RejectView({ policyLabel }: { policyLabel: string | null }) {
  useEffect(() => {
    sendGAEvent("event", "report_blocked", { label: policyLabel ?? "unknown" });
  }, [policyLabel]);
  return (
    <div className="cold-panel rounded-lg p-6 sm:p-8">
      <p className="text-lg font-bold text-text">
        이 업종은 저희가 검증을 도와드리기 어렵습니다
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {policyLabel ? `${policyLabel} 관련 사업은 ` : "이 사업은 "}구글과
        메타의 광고 정책상 광고 집행 자체가 제한됩니다. 저희는 실제 광고로
        수요를 측정하는 방식이라, 정직한 검증을 드릴 수 없어 신청을 받지
        않습니다.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        혹시 이 업종을 <b className="text-text">고객으로 둔 도구나 서비스</b>
        (관리·예약·정산 같은)라면 광고가 가능합니다. 그런 경우거나 궁금한 점이
        있으면 카카오톡으로 알려주세요.
      </p>
      <a
        href={KAKAO_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition hover:brightness-95"
        style={{ background: "#FEE500", color: "#191600" }}
      >
        카카오톡으로 문의하기
      </a>
    </div>
  );
}

/* ───────────────── 설계서 결과 화면 — 짧게, CTA 우선 ───────────────── */

function ReportView({
  report,
  path,
  build,
  accessCode,
}: {
  report: Report;
  path: RecommendedPath;
  build: QuizAnswers["build"];
  accessCode: string | null;
}) {
  useEffect(() => {
    sendGAEvent("event", "report_view", { path });
  }, [path]);

  const isEngine = path === "engine";
  const priceLine = isEngine ? "엔진 29만원" : "Quick 50만원 · 7일";
  const href = accessCode ? `/d/${accessCode}` : KAKAO_CHAT_URL;

  function fireStart(position: string) {
    sendGAEvent("event", "brief_start", {
      tier: isEngine ? "engine" : "quick",
      position,
    });
  }

  return (
    <div className="space-y-4">
      {/* 1. 이해 확인 — 거울 */}
      <div className="cold-panel rounded-lg p-6 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
          저희가 이해한 건 이겁니다
        </p>
        <p className="mt-2 text-lg font-bold leading-relaxed text-text">
          {report.understanding_line}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          이 방향이 맞다면 바로 7일 검증으로 넘어갈 수 있습니다. 다른 부분이
          있으면 다음 단계(브리프)에서 그대로 고칠 수 있습니다.
        </p>

        {/* 1차 CTA — 가격 빼고 가치로. 스크롤 전에 바로 전환 */}
        <a
          href={href}
          onClick={() => fireStart("top")}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-[18px] text-base font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_12px_32px_var(--accent-glow)]"
        >
          내 페이지에 진짜 사람들 불러와서 테스트하기
          <ArrowRightMini />
        </a>
        <a
          href="#how-we-validate"
          className="mt-2 block text-center text-sm font-medium text-text-tertiary transition hover:text-text"
        >
          저희가 어떻게 검증하는지 먼저 볼게요 ↓
        </a>
      </div>

      {/* 2. 우리라면 이렇게 검증합니다 — GPT가 못 주는 관점 한 스푼 */}
      <div
        id="how-we-validate"
        className="cold-panel rounded-lg p-6 sm:p-7 scroll-mt-4"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
          저희라면 이렇게 검증합니다
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border bg-surface-light p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-text-secondary">
                어디서
              </span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                {report.channel}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {report.channel_reason}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-light p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-text-secondary">
                합격선
              </span>
              <span className="text-sm font-bold text-text">
                {report.pass_bar}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {report.pass_bar_reason} 이 숫자는 광고를 켜기 전에 못박고,
              데이터를 본 뒤에는 저희도 못 바꿉니다. 그래야 판정이 공정합니다.
            </p>
          </div>

          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <span className="text-sm font-bold text-text-secondary">
              저희가 보는 가장 큰 리스크
            </span>
            <p className="mt-2 text-sm leading-relaxed text-text">
              {report.top_risk}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
          {report.blind_spot} 그래서 분석이 아니라 진짜 광고비로 확인하는
          것입니다.
        </p>
      </div>

      {/* 3. 다음 절차 — 접힘 */}
      <NextSteps path={path} build={build} />

      {/* 4. 하단 CTA — 끝까지 읽은 사람 */}
      <div className="cold-panel rounded-lg p-6">
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
          <p className="text-sm font-bold text-accent">
            추천 경로: {priceLine}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {isEngine
              ? "페이지를 직접 준비하시는 분께는 제작을 뺀 검증만. 광고 세팅과 7일 집행(광고비 포함), 측정, 판정까지. 재검증 30% 할인."
              : "검증용 사이트 제작부터 광고 7일 집행, 측정, Go/No-Go 판정까지 전부. 분명한 판정을 못 드리면 전액 환불."}
          </p>
        </div>
        <a
          href={href}
          onClick={() => fireStart("bottom")}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover"
        >
          진짜 사람들로 이 아이디어 테스트 시작하기
          <ArrowRightMini />
        </a>
        <p className="mt-3 text-center text-xs text-text-tertiary">
          지금은 결제가 아닙니다. 다음 화면에서 브리프를 확인하고 동의하면 그때
          입금을 안내합니다.
        </p>
      </div>

      {/* 결과 저장 — 가치 받은 직후 소프트 옵트인 */}
      {accessCode && (
        <div className="cold-panel rounded-lg p-5">
          <p className="text-sm font-bold text-text">
            이 결과, 저장해 둘까요?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            카카오로 로그인하면 이 설계서와 진행 현황을 언제든 다시 보실 수
            있습니다. 로그인 없이는 아래 코드를 적어두셔야 합니다.
          </p>
          <button
            type="button"
            onClick={async () => {
              sendGAEvent("event", "kakao_login", { from: "report" });
              try {
                const supabase = getSupabaseBrowser();
                const redirectTo = `${window.location.origin}/auth/callback?next=/d/me&link=${accessCode}`;
                const result = await Promise.race([
                  supabase.auth.signInWithOAuth({
                    provider: "kakao",
                    options: { redirectTo, skipBrowserRedirect: true },
                  }),
                  new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("login_timeout")), 8000),
                  ),
                ]);
                if (result.error) throw result.error;
                if (!result.data?.url) throw new Error("no_oauth_url");
                window.location.assign(result.data.url);
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                window.location.assign(
                  `/d?login_error=${encodeURIComponent(msg.slice(0, 90))}`,
                );
              }
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition hover:brightness-95"
            style={{ background: "#FEE500", color: "#191600" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.7-2.5.6.1 1.3.1 2 .1 5.5 0 10-3.5 10-7.8C22 6.5 17.5 3 12 3z" />
            </svg>
            카카오로 저장하기
          </button>
          <p className="mt-2 text-center text-xs text-text-tertiary">
            내 진행 코드 <b className="font-mono text-text">{accessCode}</b>
          </p>
        </div>
      )}

      {/* 모바일 sticky CTA — 항상 보임 */}
      <div className="sticky bottom-3 z-10 sm:hidden">
        <a
          href={href}
          onClick={() => fireStart("sticky")}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_12px_32px_var(--accent-glow)]"
        >
          진짜 사람들로 테스트 시작하기
          <ArrowRightMini />
        </a>
      </div>
    </div>
  );
}

function NextSteps({
  path,
  build,
}: {
  path: RecommendedPath;
  build: QuizAnswers["build"];
}) {
  // 3단계는 path가 아니라 build로 분기 (self=아직 페이지 없음)
  const prepStep =
    build === "built"
      ? "48시간 안에 준비 완료: 만드신 페이지에 측정을 붙이고 진단합니다."
      : build === "self"
        ? "48시간 안에 준비 완료: 직접 만드실 페이지 가이드와 측정 설치 스펙을 드립니다."
        : "48시간 안에 준비 완료: 실서비스처럼 보이는 검증용 사이트를 제작합니다.";
  const steps = [
    "이 방향으로 브리프 초안(핵심 메시지, 가격, 가칭)을 잡아 드립니다.",
    "브리프 확정: 화면에서 확인하고 승인만 하면 됩니다. 통화 없습니다.",
    prepStep,
    "7일 광고 집행: 진행 대시보드를 상시 공개합니다.",
    "판정 리포트: Go/No-Go와 다음 액션을 대시보드로 보내드립니다.",
  ];
  void path;
  return (
    <details className="cold-panel rounded-lg p-5">
      <summary className="cursor-pointer text-sm font-bold text-text-secondary">
        신청하면 이렇게 진행됩니다 (고객님은 승인만)
      </summary>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[11px] font-bold text-accent">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-text-secondary">
              {s}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm font-bold text-text">
        고객님이 하실 일은 브리프를 확인하고 승인하는 것뿐입니다.
      </p>
    </details>
  );
}

/* 텍스트 한 줄 청크 — 객관식과 같은 리듬으로 입력 후 다음 */
function TextChunk({
  placeholder,
  skipLabel,
  initial,
  onSubmit,
}: {
  placeholder?: string;
  skipLabel?: string;
  initial: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-2.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit(value.trim());
        }}
        className={inputBase}
        placeholder={placeholder}
        maxLength={200}
      />
      <button
        type="button"
        disabled={!value.trim()}
        onClick={() => onSubmit(value.trim())}
        className="w-full rounded-md bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
      >
        다음
      </button>
      {skipLabel && (
        <button
          type="button"
          onClick={() => onSubmit("")}
          className="w-full rounded-md border border-dashed border-border px-4 py-3 text-sm font-semibold text-text-secondary transition hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {skipLabel}
        </button>
      )}
    </div>
  );
}

/* ───────────────── 공용 ───────────────── */

function ArrowRightMini() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

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
