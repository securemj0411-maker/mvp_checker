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
   아이디어 입력 → AI 인테이크(이해 확인 + 아이디어별 맞춤 빈칸 1~2개,
   AI가 보기 미리 채움) → 객관식 청크 → 연락처 → 무료 AI 검증 설계서.
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
    title: "이 아이디어를 보여줄 웹페이지, 지금 있으세요?",
    sub: "한 장짜리 소개 페이지(랜딩페이지)면 됩니다. 답에 따라 가장 싼 경로를 추천해 드립니다.",
    options: [
      {
        value: "self",
        label: "직접 만들 수 있어요",
        hint: "코딩을 도와주는 AI 도구나 노코드 툴로 직접 만드실 수 있는 경우",
      },
      {
        value: "need",
        label: "비즈필터가 만들어 주세요",
        hint: "실제 서비스처럼 보이는 소개 페이지를 저희가 대신 만들어 드립니다",
      },
      {
        value: "built",
        label: "이미 있어요",
        hint: "이 아이디어를 위한 페이지가 이미 있고, 직접 고칠 수 있는 경우",
      },
    ],
  },
  {
    id: "audience",
    title: "이 서비스에 돈을 낼 사람은 누구인가요?",
    sub: "비즈필터 비용 얘기가 아니라, 고객님 서비스의 결제 고객을 묻는 질문입니다. 여러 부류라면 첫 결제를 낼 한 부류만 골라주세요.",
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
    title: "이 서비스의 고객은 어떻게 돈을 내나요?",
    sub: "주력 한 가지 기준으로 골라주세요. 플랜을 여러 개 보여주고 싶으면(구독 플랜 추가 등) 시작 전 확정 화면에서 직접 추가할 수 있습니다.",
    options: [
      { value: "once", label: "한 번 결제", hint: "한 번 사면 끝 (단건 구매·이벤트·시공 등)" },
      {
        value: "subscription",
        label: "정기 결제",
        hint: "월 구독·회원제·월 회비 (헬스장·구독 서비스·실버타운 등)",
      },
      {
        value: "usage",
        label: "쓸 때마다 결제",
        hint: "방문·이용할 때마다 (식당·미용실·병원·과외·택배 등)",
      },
      { value: "fee", label: "수수료 · 광고", hint: "중개·플랫폼 수수료, 광고 수익" },
      { value: "undecided", label: "아직 안 정했어요" },
    ],
  },
  {
    id: "price",
    title: "고객이 한 번 결제할 때, 얼마 정도인가요?",
    sub: "검증 페이지의 결제 버튼에 표시할 금액이에요(평생 쓰는 총액이 아니라 한 번 낼 때 기준). 구독·회원제면 한 달 요금, 방문형이면 1회 비용, 회사 대상이면 회사 하나 기준. 주력 플랜 하나로 골라주시면 됩니다.",
    options: [
      { value: "under10k", label: "1만원 미만" },
      { value: "10kto50k", label: "1~5만원" },
      { value: "50kto100k", label: "5~10만원" },
      { value: "over100k", label: "10만원 이상" },
      {
        value: "multi",
        label: "플랜이 여러 개예요",
        hint: "단건·구독 등 가격이 여러 개라 하나로 못 정하는 경우. 다음에 다 추가할 수 있어요",
      },
      { value: "unknown", label: "아직 모르겠어요" },
    ],
  },
  {
    id: "alternative",
    title: "고객은 지금 이걸 어떻게 하고 있나요?",
    sub: "비슷한 욕구나 필요를 지금은 무엇으로 채우는지 골라주세요. 꼭 ‘문제 해결’이 아니어도 됩니다. 재미·취향 서비스도 포함이에요.",
    options: [
      {
        value: "competitor",
        label: "비슷한 데를 이미 이용하고 있어요",
        hint: "경쟁 서비스·앱, 또는 동네 다른 매장·업체·시설",
      },
      {
        value: "manual",
        label: "직접 하거나 임시방편으로 때워요",
        hint: "무료 도구·직접 하기, 발품·전화·입소문으로 해결",
      },
      { value: "none", label: "마땅한 게 없어 그냥 안 하거나 참고 있어요" },
      {
        value: "unaware",
        label: "이런 게 있는지조차 몰라요",
        hint: "필요성을 먼저 알려줘야 하는 시장",
      },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
];

const STORAGE_KEY = "bizfilter_quiz_v2";

/** 휴대폰 번호 입력 시 자동으로 하이픈 삽입 (010-1234-5678) */
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/* 설계서 생성(10~30초) 동안 보여줄 "이렇게 검증해요" 3비트 */
const BEATS: { title: string; sub: string }[] = [
  {
    title: "진짜 같은 페이지를 만듭니다",
    sub: "실제 서비스인 것처럼 보이는 한 장짜리 페이지에 가격과 ‘구매’ 버튼까지 넣습니다.",
  },
  {
    title: "광고로 모르는 사람을 부릅니다",
    sub: "지인 말고, 진짜 광고로 타깃 수백 명을 며칠 안에 데려옵니다.",
  },
  {
    title: "될 사업인지 숫자로 판정합니다",
    sub: "방문자 100명 중 몇 명이 ‘구매’를 누르는지가 진짜 수요 신호입니다. 미리 정한 기준을 넘으면 만들 가치가 있는 사업(GO), 못 넘으면 멈추거나 방향 수정. 실제 결제는 받지 않습니다.",
  },
];

/* 비트별 자동 체류 시간(ms) — 글 양에 비례. 마지막 비트는 머무르며 순환하지 않는다. */
const BEAT_MS = [6500, 6500, 11000];

/* 비트별 목업 일러스트 — 같은 폰트 프레임 위에 단계별 주석을 얹어 한 흐름처럼 */
function BeatArt({ beat }: { beat: number }) {
  return (
    <svg
      viewBox="0 0 320 196"
      className="h-44 w-full"
      role="img"
      aria-label={BEATS[beat]?.title}
    >
      {/* ── 폰 프레임 (공통) ── */}
      <g transform={beat === 1 ? "translate(38 0)" : "translate(0 0)"}>
        <rect x="110" y="14" width="100" height="168" rx="16" fill="#fff" stroke="var(--border)" strokeWidth="1.5" />
        <circle cx="160" cy="26" r="2.5" fill="var(--border)" />
        {/* 헤드라인 */}
        <rect x="124" y="42" width="72" height="9" rx="3" fill="var(--accent)" opacity={beat === 0 ? 1 : 0.55} />
        <rect x="124" y="58" width="72" height="5" rx="2" fill="var(--border)" />
        <rect x="124" y="68" width="50" height="5" rx="2" fill="var(--border)" />
        {/* 가격 칩 */}
        <rect x="124" y="86" width="44" height="16" rx="8" fill="var(--bg-alt)" />
        <text x="146" y="97" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-secondary)">9,900원</text>
        {/* 구매 버튼 */}
        <rect x="124" y="116" width="72" height="24" rx="9" fill="var(--accent)" />
        <text x="160" y="131" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">구매하기</text>
        <rect x="124" y="152" width="60" height="5" rx="2" fill="var(--border)" />

        {/* ── beat 2: 결제 버튼에 탭 ripple + 커서 ── */}
        {beat === 2 && (
          <>
            <circle cx="160" cy="128" r="20" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.35" />
            <circle cx="160" cy="128" r="13" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" />
            <path d="M168 134 l3 13 l3 -6 l6 0 z" fill="var(--text)" stroke="#fff" strokeWidth="1.2" />
          </>
        )}
      </g>

      {/* ── beat 1: 광고 → 사람 유입 ── */}
      {beat === 1 && (
        <>
          <rect x="14" y="30" width="62" height="26" rx="13" fill="var(--accent)" />
          <text x="45" y="47" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">광고</text>
          <path d="M50 60 C 60 110, 110 120, 150 120" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={64 + i * 22} cy={150 - i * 8} r="7" fill="var(--accent)" opacity={0.25 + i * 0.18} />
          ))}
          <rect x="18" y="166" width="120" height="22" rx="11" fill="var(--bg-alt)" />
          <text x="78" y="181" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--text)">방문 320명</text>
        </>
      )}

      {/* ── beat 2: 결제 클릭 카운터 + GO ── */}
      {beat === 2 && (
        <>
          <rect x="18" y="40" width="74" height="44" rx="10" fill="var(--bg-alt)" />
          <text x="55" y="58" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-secondary)">결제 버튼 클릭</text>
          <text x="55" y="76" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--accent)">11</text>
          <g transform="rotate(8 268 140)">
            <rect x="232" y="118" width="72" height="44" rx="10" fill="#E4F5EC" stroke="#06A86B" strokeWidth="2.5" />
            <text x="268" y="148" textAnchor="middle" fontSize="24" fontWeight="800" fill="#06A86B">GO</text>
          </g>
        </>
      )}
    </svg>
  );
}

export default function LeadForm() {
  const [phase, setPhase] = useState<Phase>("idea");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<QuizKey, string>>>({});

  const [idea, setIdea] = useState("");
  const [ideaRefined, setIdeaRefined] = useState<string | null>(null);
  const [interp, setInterp] = useState<InterpretResult | null>(null);
  // interpret 단계 내부: 이해 확인(confirm) → 맞춤 빈칸 질문(gaps)
  const [interpStage, setInterpStage] = useState<"confirm" | "gaps">("confirm");
  const [gapIdx, setGapIdx] = useState(0);
  const [gapAnswers, setGapAnswers] = useState<string[]>([]);
  const [gapCustomMode, setGapCustomMode] = useState(false);
  const [gapCustom, setGapCustom] = useState("");

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
  const [autoBeat, setAutoBeat] = useState(true); // 3비트 자동넘김 (탭하면 멈춤)

  const skippedInterpret = useRef(false);
  const interpretStatus = useRef<string>("original");
  const restored = useRef(false);
  const reviseRef = useRef(false); // 리포트에서 "다르게 이해했어요"로 되물음 재진입

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
  // 분모는 '최대 질문 수'로 고정한다. visibleQuestions 는 답변 따라 조건부 질문이
  // 추가되며 커지므로, 그걸 분모로 쓰면 진행바가 뒤로 가는 것처럼 보인다(1/9→2/11).
  const totalChunks = 2 + QUESTIONS.length + 1; // 아이디어 + 되물음 + (최대)질문 + 연락처
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

  /* 생성 화면 진입 시 비트 리셋 + 자동넘김 켜기 */
  useEffect(() => {
    if (phase === "generating") {
      setGenMsgIdx(0);
      setAutoBeat(true);
    }
  }, [phase]);

  /* "이렇게 검증해요" 3비트 자동 진행 — 글 양에 맞춰 비트마다 체류 시간이 다르고,
     마지막 비트(판정)에서 멈춘다(순환 안 함). 고객이 탭하면 autoBeat=false. */
  useEffect(() => {
    if (phase !== "generating" || !autoBeat) return;
    const beat = Math.min(genMsgIdx, BEATS.length - 1);
    if (beat >= BEATS.length - 1) return; // 마지막 비트는 머문다
    const t = setTimeout(() => setGenMsgIdx(beat + 1), BEAT_MS[beat]);
    return () => clearTimeout(t);
  }, [phase, autoBeat, genMsgIdx]);

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
      if (data?.result?.summary) {
        const r = data.result as InterpretResult;
        // 마찰 상한: 빈칸 최대 2개, 보기 최대 4개로 잘라 보장
        const normalized: InterpretResult = {
          summary: r.summary,
          gaps: (r.gaps ?? [])
            .slice(0, 2)
            .map((g) => ({ ...g, suggestions: (g.suggestions ?? []).slice(0, 4) })),
        };
        setInterp(normalized);
        setInterpStage("confirm");
        setGapIdx(0);
        setGapAnswers([]);
        setGapCustomMode(false);
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
    if (reviseRef.current) {
      // 리포트에서 "다르게 이해했어요"로 돌아온 경우: 퀴즈 재탕 없이
      // 기존 리드를 갱신해 바로 재생성한다 (중복 리드 X)
      reviseRef.current = false;
      runGenerate(detail, accessCode);
    } else {
      setPhase("quiz");
    }
  }

  /* 이해 확인 "맞아요" — 빈칸 질문이 있으면 그쪽으로, 없으면 퀴즈로.
     리포트에서 되물음으로 돌아온 경우엔 퀴즈 없이 바로 재생성. */
  function confirmRead() {
    const refined = interp?.summary ?? idea;
    setIdeaRefined(refined);
    interpretStatus.current = "confirmed";
    if (reviseRef.current) {
      reviseRef.current = false;
      runGenerate(refined, accessCode);
      return;
    }
    if (interp?.gaps?.length) {
      setInterpStage("gaps");
      setGapIdx(0);
    } else {
      setPhase("quiz");
    }
  }

  /* 빈칸 답 1개 기록 → 다음 빈칸, 마지막이면 답을 녹여 refined 완성 후 퀴즈로 */
  function answerGap(value: string) {
    const v = value.trim();
    if (!v) return;
    const gaps = interp?.gaps ?? [];
    const next = [...gapAnswers];
    next[gapIdx] = v;
    setGapAnswers(next);
    setGapCustomMode(false);
    setGapCustom("");
    if (gapIdx + 1 < gaps.length) {
      setGapIdx((i) => i + 1);
      return;
    }
    const base = interp?.summary ?? idea;
    const extra = gaps
      .map((g, i) => (next[i] ? `${g.key}: ${next[i]}` : null))
      .filter(Boolean)
      .join(", ");
    const refined = extra ? `${base} (${extra})` : base;
    setIdeaRefined(refined);
    interpretStatus.current = "intake";
    sendGAEvent("event", "quiz_interpret_intake", { gaps: gaps.length });
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

  /* ── 설계서 생성 (신규 제출 + 재해석 재생성 공통) ──
     existingCode가 있으면 새 리드를 만들지 않고 그 리드를 갱신해 재생성한다 */
  async function runGenerate(
    refined: string | null,
    existingCode: string | null,
  ) {
    setSubmitting(true);
    setErrorMsg(null);
    setPhase("generating");

    const quizAnswers: QuizAnswers = {
      idea: idea.trim(),
      ideaRefined: refined,
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
          code: existingCode ?? undefined,
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
      if (existingCode) {
        // 재해석 재생성 실패 — 기존 설계서를 그대로 다시 보여준다
        setPhase("done");
      } else {
        setErrorMsg(
          "설계서 생성 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요. 계속 문제가 생기면 카톡 채널로 문의해주세요.",
        );
        setPhase("contact");
      }
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await runGenerate(ideaRefined, null);
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
          answers={answers}
          onRevise={() => {
            reviseRef.current = true;
            setCustomMode(false);
            setInterpStage("confirm");
            setPhase(interp ? "interpret" : "idea");
          }}
        />
      );
    }
  }

  if (phase === "generating") {
    const beat = Math.min(genMsgIdx, BEATS.length - 1);
    const isLastBeat = beat >= BEATS.length - 1;
    return (
      <div className="cold-panel rounded-lg p-6 sm:p-8">
        <p className="text-center text-sm font-medium text-text-secondary">
          설계서를 만드는 동안, 저희가 어떻게 검증하는지 보여드릴게요
        </p>

        {/* 3비트 설명 — 5초 자동, 카드/점 탭하면 직접 넘김(자동 멈춤) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setAutoBeat(false);
            setGenMsgIdx((i) => (i >= BEATS.length - 1 ? 0 : i + 1));
          }}
          className="mt-5 cursor-pointer select-none rounded-xl border border-border bg-bg-alt/60 p-5 transition hover:border-accent/40"
        >
          <div key={beat} className="quiz-step-in">
            <BeatArt beat={beat} />
            <p className="mt-4 text-center text-base font-bold text-text">
              <span className="text-accent">{beat + 1}</span> · {BEATS[beat].title}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-center text-sm leading-relaxed text-text-secondary">
              {BEATS[beat].sub}
            </p>
          </div>
          {/* 자동 진행 표시줄 — 다음 비트로 넘어가기까지 남은 시간을 보여준다.
              수동 모드거나 마지막 비트면 표시하지 않는다(머문다). */}
          <div className="mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-border/60">
            {autoBeat && !isLastBeat && (
              <div
                key={beat}
                className="beat-fill h-full rounded-full bg-accent/70"
                style={{ animationDuration: `${BEAT_MS[beat]}ms` }}
              />
            )}
          </div>
          {/* 비트 인디케이터 — 탭하면 그 단계로 */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {BEATS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}단계 보기`}
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoBeat(false);
                  setGenMsgIdx(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === beat ? "w-5 bg-accent" : "w-2 bg-border hover:bg-accent/40"
                }`}
              />
            ))}
          </div>
          <p className="mt-2.5 text-center text-[11px] text-text-tertiary">
            {autoBeat
              ? isLastBeat
                ? "탭하면 단계를 다시 볼 수 있어요"
                : "탭하면 직접 넘겨볼 수 있어요"
              : "직접 넘겨보는 중 · 점을 눌러 이동"}
          </p>
        </div>

        {/* 작업 중 표시 */}
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm font-medium text-text-secondary">
            내 설계서를 만들고 있어요 · 10~30초
          </p>
        </div>
        <div className="mx-auto mt-3 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-bg-alt">
          <div className="gen-progress h-full rounded-full bg-accent" />
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
            검증하고 싶은 아이디어, 편하게 적어주세요
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            지금은 짧아도 괜찮습니다. 한 줄로 시작하면 다음 화면에서 같이
            구체화해 드립니다. 끝까지 답하시면 이 아이디어가 팔릴지 어떻게
            확인할지 담긴 검증 설계서를 그 자리에서 무료로 드립니다.
          </p>
        </div>
        <FunnelRoadmap />
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
              이 문장이 광고 문구와 검증용 페이지의 출발점이 됩니다. 그래서
              뜻을 한 번 더 확인합니다. 실제 광고는 모든 내용을 직접 확인하고
              동의하신 뒤에만 나갑니다.
            </p>
            <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-bg-alt">
              <div className="loading-sweep h-full rounded-full bg-accent" />
            </div>
          </div>
        ) : (
          <div className="quiz-step-in space-y-5">
            {customMode ? (
              <>
                <div>
                  <p className="text-xl font-bold text-text">
                    한 문장으로 직접 정리해주세요
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    적어주신 그대로 검증 설계의 출발점이 됩니다.
                  </p>
                </div>
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
                  ← 비즈필터가 이해한 걸로 돌아가기
                </button>
              </>
            ) : interpStage === "confirm" ? (
              <>
                <div>
                  <p className="text-xl font-bold text-text">
                    이렇게 이해했어요. 맞나요?
                  </p>
                  <p className="mt-2 rounded-lg border border-border bg-surface-light px-4 py-3 text-[15px] font-semibold leading-relaxed text-text">
                    {interp.summary}
                  </p>
                </div>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={confirmRead}
                    className="w-full rounded-md bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover"
                  >
                    네, 맞아요
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomRefine(ideaRefined || idea);
                      setCustomMode(true);
                    }}
                    className="w-full rounded-md border border-border bg-surface-light px-6 py-3.5 text-base font-semibold text-text-secondary transition hover:border-accent/60 hover:text-text"
                  >
                    조금 달라요, 고칠게요
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <BackButton onClick={() => setPhase("idea")} />
                  <p className="text-xs text-text-tertiary">
                    맞다고 누르면 몇 가지만 더 여쭤봐요
                  </p>
                </div>
              </>
            ) : (
              (() => {
                const gaps = interp.gaps;
                const g = gaps[Math.min(gapIdx, gaps.length - 1)];
                return (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-text-tertiary">
                        <span>
                          맞춤 질문 {gapIdx + 1} / {gaps.length}
                        </span>
                        <span>AI가 보기를 미리 채워뒀어요</span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-alt">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-300"
                          style={{
                            width: `${((gapIdx + 1) / (gaps.length + 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-text">{g.question}</p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        이 답이 검증용 페이지와 광고 문구에 그대로 반영됩니다.
                        맞는 걸 고르거나 직접 적어주세요.
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      {g.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => answerGap(s)}
                          className="w-full rounded-md border border-border bg-surface-light px-4 py-3.5 text-left text-[15px] font-semibold text-text transition hover:border-accent/60 hover:bg-bg-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {s}
                        </button>
                      ))}
                      {gapCustomMode ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={gapCustom}
                            onChange={(e) => setGapCustom(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                answerGap(gapCustom);
                              }
                            }}
                            className={`${inputBase} flex-1`}
                            placeholder="직접 적어주세요"
                            maxLength={60}
                          />
                          <button
                            type="button"
                            disabled={gapCustom.trim().length < 1}
                            onClick={() => answerGap(gapCustom)}
                            className="flex-shrink-0 rounded-md bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent-hover disabled:opacity-40"
                          >
                            확인
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setGapCustomMode(true)}
                          className="w-full rounded-md border border-dashed border-border px-4 py-3.5 text-left text-[15px] font-semibold text-text-secondary transition hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          직접 입력할게요
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <BackButton
                        onClick={() => {
                          if (gapCustomMode) setGapCustomMode(false);
                          else if (gapIdx > 0) setGapIdx((i) => i - 1);
                          else setInterpStage("confirm");
                        }}
                      />
                      <p className="text-xs text-text-tertiary">
                        고를수록 설계서가 정확해져요
                      </p>
                    </div>
                  </>
                );
              })()
            )}
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
            검증 설계서는 바로 다음 화면에 뜹니다. 전화를 드리는 일은 없고,
            진행 상황은 문자로만 알려드립니다.
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
            onChange={(e) => setContact(formatPhone(e.target.value))}
            className={inputBase}
            placeholder="010-1234-5678"
            maxLength={13}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-text-tertiary">
            검증 진행 상황을 문자로 보내는 데만 씁니다. 영업 전화나 광고 문자는
            보내지 않고, 검증이 끝나면 파기합니다.
          </p>
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

/* 설계 입력 에코 — 고객 답변을 그대로 비춰서 "제대로 접수됐다"를 보여준다 */
const ECHO_LABELS: Record<string, Record<string, string>> = {
  build: {
    self: "직접 만든 페이지로",
    need: "검증용 사이트는 비즈필터가 제작",
    built: "이미 있는 페이지로",
  },
  audience: { b2c: "일반 소비자", b2b: "회사 · 사장님", both: "둘 다" },
  revenue: {
    once: "한 번 결제",
    subscription: "정기 결제(구독·회원제)",
    usage: "쓸 때마다 결제",
    fee: "수수료 · 광고",
    undecided: "미정",
  },
  price: {
    under10k: "1만원 미만",
    "10kto50k": "1~5만원",
    "50kto100k": "5~10만원",
    over100k: "10만원 이상",
    multi: "여러 플랜",
    unknown: "미정",
  },
  alternative: {
    competitor: "비슷한 서비스·앱 사용",
    manual: "임시방편으로 때움",
    none: "안 하거나 참는 중",
    unaware: "있는 줄도 모름",
    unknown: "모름",
  },
};

function ReportView({
  report,
  path,
  build,
  accessCode,
  answers,
  onRevise,
}: {
  report: Report;
  path: RecommendedPath;
  build: QuizAnswers["build"];
  accessCode: string | null;
  answers: Partial<Record<QuizKey, string>>;
  onRevise: () => void;
}) {
  useEffect(() => {
    sendGAEvent("event", "report_view", { path });
  }, [path]);

  const [gate, setGate] = useState(false);

  const isEngine = path === "engine";
  const priceLine = isEngine
    ? "엔진 (페이지는 직접, 검증만) 29만원"
    : "Quick (전 과정 대행) 50만원 · 7일";
  const href = accessCode ? `/d/${accessCode}` : KAKAO_CHAT_URL;

  function fireStart(position: string) {
    sendGAEvent("event", "brief_start", {
      tier: isEngine ? "engine" : "quick",
      position,
    });
  }

  /* CTA 클릭 — 코드가 있으면 카카오 저장 게이트를 먼저 보여준다 */
  function onStart(e: React.MouseEvent, position: string) {
    fireStart(position);
    if (accessCode) {
      e.preventDefault();
      setGate(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  const echo = (["build", "audience", "revenue", "price", "alternative"] as const)
    .map((k) => ({
      key: k,
      label:
        k === "build"
          ? "페이지"
          : k === "audience"
            ? "결제 고객"
            : k === "revenue"
              ? "과금 방식"
              : k === "price"
                ? "가격대"
                : "현재 대안",
      value: ECHO_LABELS[k]?.[answers[k] ?? ""] ?? null,
    }))
    .filter((r) => r.value);

  /* ── 카카오 저장 게이트 — 전환 직후, 기대가 가장 높은 순간 ── */
  if (gate && accessCode) {
    const dest = `/d/${accessCode}`;
    return (
      <div className="cold-panel rounded-lg p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
          방금 만든 검증 설계서
        </p>
        <h2 className="mt-2 text-xl font-bold leading-snug text-text">
          이 설계서, 잃어버리지 않게
          <br />
          카카오로 저장해 두세요
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          지금 닫으면 진행 코드를 직접 적어둬야 다시 열 수 있습니다. 카카오로
          저장하면 코드 없이 한 번에 다시 들어오고, 다음 화면에서 광고 문구 ·
          가격 · 플랜을 직접 고칠 수 있습니다.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text-secondary">
          <li className="flex gap-2">
            <span className="text-accent">✓</span>
            내 설계서 · 진행 현황을 언제든 다시 열람
          </li>
          <li className="flex gap-2">
            <span className="text-accent">✓</span>
            진행 단계가 바뀔 때마다 알림
          </li>
          <li className="flex gap-2">
            <span className="text-accent">✓</span>
            동의 버튼을 누르기 전에는 아무것도 시작되지 않습니다
          </li>
        </ul>

        <button
          type="button"
          onClick={async () => {
            sendGAEvent("event", "kakao_login", { from: "report_gate" });
            try {
              const supabase = getSupabaseBrowser();
              const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}&link=${accessCode}`;
              const result = await Promise.race([
                supabase.auth.signInWithOAuth({
                  provider: "kakao",
                  options: { redirectTo, skipBrowserRedirect: true },
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("login_timeout")), 8000),
                ),
              ]);
              if (result.error || !result.data?.url) throw new Error("oauth");
              window.location.assign(result.data.url);
            } catch {
              // 로그인이 안 되더라도 흐름은 끊지 않는다 — 코드로 계속
              window.location.assign(dest);
            }
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-[18px] text-base font-bold transition hover:brightness-95"
          style={{ background: "#FEE500", color: "#191600" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.7-2.5.6.1 1.3.1 2 .1 5.5 0 10-3.5 10-7.8C22 6.5 17.5 3 12 3z" />
          </svg>
          카카오로 저장하고 계속하기
        </button>
        <p className="mt-2 text-center text-xs text-text-tertiary">
          3초면 끝 · 코드 적어둘 필요 없음
        </p>

        <a
          href={dest}
          className="mt-4 block text-center text-sm font-medium text-text-tertiary underline-offset-2 transition hover:text-text hover:underline"
        >
          로그인 없이 계속하기
        </a>
        <p className="mt-2 text-center text-xs text-text-tertiary">
          로그인 없이 가시면 진행 코드{" "}
          <b className="font-mono text-text">{accessCode}</b> 를 꼭 적어두세요.
        </p>

        <button
          type="button"
          onClick={() => setGate(false)}
          className="mt-5 block w-full text-center text-xs text-text-tertiary transition hover:text-text"
        >
          ← 설계서 다시 보기
        </button>
      </div>
    );
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

        {/* 설계 입력 에코 — 답변이 전부 접수됐음을 구조로 보여준다 */}
        {echo.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {echo.map((r) => (
              <div
                key={r.key}
                className="rounded-md border border-border bg-surface-light px-3 py-2"
              >
                <p className="text-[11px] font-semibold text-text-tertiary">
                  {r.label}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-text">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          위 내용은 출발점입니다. 광고 문구 · 표시 가격(플랜 추가 가능) ·
          서비스 가칭은 다음 화면에서 직접 보고 고치신 뒤에 시작됩니다.
        </p>

        {/* 1차 CTA — 가격 빼고 가치로. 스크롤 전에 바로 전환 */}
        <a
          href={href}
          onClick={(e) => onStart(e, "top")}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-[18px] text-base font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_12px_32px_var(--accent-glow)]"
        >
          내 검증 준비안 확인하고 다듬으러 가기
          <ArrowRightMini />
        </a>
        <p className="mt-2 text-center text-xs text-text-tertiary">
          눌러도 바로 시작되지 않습니다 · 세부 내용을 확인하고 동의해야 시작
        </p>
        <button
          type="button"
          onClick={onRevise}
          className="mt-3 block w-full text-center text-sm font-semibold text-text-secondary underline-offset-2 transition hover:text-accent hover:underline"
        >
          이해가 다른가요? 다시 알려주기
        </button>
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
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
          적어주신 답변(업종·타깃·가격·지금 어떻게 하시는지)을 그대로 반영해
          맞춘 설계입니다. 누구에게나 똑같이 나가는 양식이 아닙니다.
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
              : "검증용 사이트 제작부터 광고 7일 집행, 측정, 될지 안 될지(Go/No-Go) 판정까지 전부. 분명한 판정을 못 드리면 전액 환불."}
          </p>
        </div>
        <a
          href={href}
          onClick={(e) => onStart(e, "bottom")}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-4 text-base font-bold text-white transition hover:bg-accent-hover"
        >
          진짜 사람들로 이 아이디어 테스트 시작하기
          <ArrowRightMini />
        </a>
        <p className="mt-3 text-center text-xs text-text-tertiary">
          지금은 결제가 아닙니다. 다음 화면에서 세부 내용을 확인·수정하고
          동의하면 그때 입금을 안내합니다.
        </p>
        {accessCode && (
          <p className="mt-2 text-center text-xs text-text-tertiary">
            내 진행 코드 <b className="font-mono text-text">{accessCode}</b>
          </p>
        )}
      </div>

      {/* 모바일 sticky CTA — 항상 보임 */}
      <div className="sticky bottom-3 z-10 sm:hidden">
        <a
          href={href}
          onClick={(e) => onStart(e, "sticky")}
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
      ? "48시간 안에 준비 완료: 만드신 페이지에 측정 스크립트 한 줄만 붙이시면(채널톡 설치와 같은 방식) 연결이 자동 확인됩니다."
      : build === "self"
        ? "48시간 안에 준비 완료: 직접 만드실 페이지 가이드와 측정 스크립트 한 줄을 드립니다. 붙이시면 연결이 자동 확인됩니다."
        : "48시간 안에 준비 완료: 실서비스처럼 보이는 검증용 사이트를 제작합니다.";
  const steps = [
    "이 방향으로 검증 준비안 초안(핵심 메시지, 표시 가격, 가칭)을 잡아 드립니다.",
    "준비안 확정: 화면에서 승인만 하면 담당 검증 전문가가 1~2시간 안에 직접 검토하고 진행합니다. 통화 없습니다.",
    prepStep,
    "7일 광고 집행: 진행 대시보드를 상시 공개합니다.",
    "판정 리포트: 될지 안 될지(Go/No-Go)와 다음에 할 일을 대시보드로 보내드립니다.",
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
        고객님이 하실 일은 검증 준비안을 확인하고 승인하는 것뿐입니다.
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

/* 전체 흐름 미리보기 — "지금 결제되나?" 불안을 입력 전에 끈다 */
function FunnelRoadmap() {
  const steps = ["무료 설계서", "검토·플랜 선택", "결제", "검증 시작"];
  return (
    <div className="rounded-xl border border-border bg-bg-alt/60 p-3.5">
      <div className="flex items-start justify-between gap-1">
        {steps.map((label, i) => (
          <div
            key={label}
            className="flex flex-1 flex-col items-center gap-1.5 text-center"
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-extrabold ${
                i === 0 ? "bg-accent text-white" : "bg-bg-light text-text-tertiary"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-[10px] font-semibold leading-tight ${
                i === 0 ? "text-accent" : "text-text-tertiary"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-text-tertiary">
        지금은 1단계예요.{" "}
        <b className="font-bold text-text-secondary">결제는 맨 마지막</b>이고, 그
        전엔 한 푼도 빠지지 않습니다.
      </p>
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
