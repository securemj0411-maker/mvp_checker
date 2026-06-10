import LeadForm from "@/components/LeadForm";
import ScrollReveal from "@/components/ScrollReveal";
import HeroSpotlight from "@/components/HeroSpotlight";
import {
  ArrowRight,
  Check,
  CreditCard,
  MessageCircle,
  MousePointerClick,
} from "lucide-react";

const fontDisplay = { fontFamily: "var(--font-display)" } as const;
const glowAccent = {
  filter: "drop-shadow(0 0 18px var(--accent-glow))",
} as const;
const dotAccent = { boxShadow: "0 0 8px var(--accent-glow)" } as const;

type HeroVariant = "a" | "b";

export default function Home({
  heroVariant = "a",
}: {
  heroVariant?: HeroVariant;
}) {
  return (
    <main className="flex-1">
      <Nav />
      <HeroSpotlight>
        <Hero variant={heroVariant} />
      </HeroSpotlight>
      <Marquee />
      <Problem />
      <AITrap />
      <Timeline />
      <NoBuildBand />
      <Measure />
      <Deliverables />
      <Pricing />
      <NoGo />
      <FounderStory />
      <FAQ />
      <FinalCTA />
      <Footer />
      <ScrollReveal />
    </main>
  );
}

/* ────────────────────  shared eyebrow label  ──────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary"
      style={fontDisplay}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
        style={dotAccent}
      />
      {children}
    </p>
  );
}

/* ─────────────────────────  NAV  ───────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a
          href="#"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-text"
        >
          <span
            className="relative flex h-7 w-7 items-center justify-center rounded bg-text text-sm font-black text-bg"
            style={fontDisplay}
          >
            B
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent"
              style={dotAccent}
            />
          </span>
          <span>비즈필터</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary sm:flex">
          <a href="#timeline" className="transition hover:text-text">
            진행 방식
          </a>
          <a href="#pricing" className="transition hover:text-text">
            가격
          </a>
          <a href="#story" className="transition hover:text-text">
            스토리
          </a>
          <a href="#faq" className="transition hover:text-text">
            FAQ
          </a>
          <a href="/blog" className="transition hover:text-text">
            블로그
          </a>
        </nav>
        <a
          href="#cta"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_8px_24px_var(--accent-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          검증 신청 <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </a>
      </div>
    </header>
  );
}

/* ─────────────────────────  HERO (split)  ───────────────────────── */
function Hero({ variant = "a" }: { variant?: HeroVariant }) {
  return (
    <section className="relative grid border-b border-border lg:min-h-[88vh] lg:grid-cols-2">
      <div className="dot-grid pointer-events-none absolute inset-0 left-0 right-1/2 -z-10 opacity-40" />
      {/* LEFT — copy */}
      <div className="flex flex-col justify-center px-6 py-20 sm:px-12 sm:py-24 lg:px-16">
        <div className="reveal-stagger max-w-[680px]">
          <p
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-text-secondary"
            style={fontDisplay}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              style={dotAccent}
            />
            사업 아이디어 검증 전문
          </p>
          {variant === "a" ? (
            <>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-[-0.035em] text-text sm:text-5xl lg:text-6xl">
                그 사업 아이디어가
                <br />
                먹힐지 안 먹힐지,
                <br />
                어차피 알게 됩니다.
              </h1>
              <p className="mt-5 text-xl font-bold leading-snug text-text-secondary sm:text-2xl">
                6개월 뒤에 아느냐,{" "}
                <span className="text-accent" style={glowAccent}>
                  7일 뒤에 아느냐
                </span>
                의 차이일 뿐.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-[-0.035em] text-text sm:text-5xl lg:text-6xl">
                만들기 전에,
                <br />살 사람이 있는지 확인하세요.
              </h1>
              <p className="mt-5 text-xl font-bold leading-snug text-text-secondary sm:text-2xl">
                그 아이디어,{" "}
                <span className="text-accent" style={glowAccent}>
                  7일이면 데이터로 답
                </span>
                이 나옵니다.
              </p>
            </>
          )}
          <p className="mt-7 max-w-2xl text-lg leading-[1.65] text-text-secondary">
            비즈필터는 사업을 시작하기 전에{" "}
            <span className="font-semibold text-text">
              진짜 수요부터 확인해드리는 검증 서비스
            </span>
            입니다. 아직 아무것도 만들지 않아도 됩니다 — 진짜처럼 보이는
            페이지를 띄우고 진짜 광고를 돌려서, 모르는 사람들이{" "}
            <span className="font-semibold text-text">
              클릭하는지 · 가격을 보고도 결제 버튼을 누르는지
            </span>
            , 그리고{" "}
            <span className="font-semibold text-text">
              고객 1명 데려오는 데 얼마가 드는지
            </span>
            까지 숫자로 답합니다.
          </p>
          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_12px_32px_var(--accent-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              내 아이디어 검증 신청하기
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </a>
            <a
              href="#timeline"
              className="px-2 py-3 text-base font-medium text-text-secondary underline-offset-4 transition hover:text-text hover:underline"
            >
              7일이 어떻게 흘러가는지 보기 →
            </a>
          </div>
          <p className="mt-7 text-sm text-text-tertiary">
            신청은 결제가 아닙니다 · 수요 신호가 없으면 50% 환불 · 검증 과정
            실시간 공개
          </p>
        </div>
      </div>
      {/* RIGHT — dark dashboard island */}
      <div className="section-dark relative hidden items-center justify-center overflow-hidden p-8 sm:p-12 lg:flex lg:p-16">
        <div
          aria-hidden
          className="grid-bg pointer-events-none absolute inset-0 opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(var(--accent-rgb), 0.14), transparent 60%)",
          }}
        />
        <div className="glow-dot pointer-events-none absolute left-12 top-16" />
        <div
          className="glow-dot pointer-events-none absolute right-16 top-1/3"
          style={{ background: "var(--accent-soft)" }}
        />
        <div className="glow-dot pointer-events-none absolute bottom-20 left-1/4" />
        <div className="relative w-full max-w-[520px]">
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="reveal relative w-full">
      <div className="rounded-xl border border-border bg-bg-alt shadow-[0_28px_70px_rgba(65,54,42,0.16)]">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div
            className="ml-3 flex-1 truncate rounded-md bg-bg px-2 py-1 text-xs text-text-tertiary"
            style={fontDisplay}
          >
            your-idea.com
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="h-3 w-3/4 rounded bg-text/90" />
          <div className="h-2 w-1/2 rounded bg-text/25" />
          <div className="h-2 w-2/3 rounded bg-text/25" />
          <div className="mt-2 flex h-20 items-end gap-1 rounded bg-bg p-2">
            {[18, 32, 24, 48, 38, 60, 52, 78, 70, 92].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background:
                    i === 9
                      ? "var(--accent)"
                      : i === 8
                        ? "var(--accent-soft)"
                        : "rgba(var(--text-rgb), 0.18)",
                  boxShadow:
                    i === 9 ? "0 0 12px var(--accent-glow)" : undefined,
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-28 rounded bg-accent" />
            <div className="h-8 w-20 rounded border border-border" />
          </div>
        </div>
      </div>
      <div className="float-1 absolute -right-4 -top-4 rounded-lg border border-border bg-bg-alt/90 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <div
            className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary"
            style={fontDisplay}
          >
            CTR
          </div>
          <span className="text-[10px] font-bold text-accent-soft">↑</span>
        </div>
        <div
          className="mt-0.5 text-base font-bold text-text"
          style={fontDisplay}
        >
          3.2%
        </div>
      </div>
      <div className="float-2 absolute -left-6 top-1/3 rounded-lg border border-border bg-bg-alt/90 px-3 py-2 backdrop-blur">
        <div
          className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary"
          style={fontDisplay}
        >
          결제 클릭
        </div>
        <div
          className="mt-0.5 text-base font-bold text-text"
          style={fontDisplay}
        >
          12건
        </div>
      </div>
      <div className="float-3 absolute -bottom-5 -right-2 rounded-lg border border-accent/40 bg-accent/[0.12] px-3 py-2 backdrop-blur">
        <div
          className="text-[10px] font-bold uppercase tracking-widest text-accent"
          style={fontDisplay}
        >
          CAC · 고객 1명당
        </div>
        <div
          className="mt-0.5 text-base font-bold text-text"
          style={fontDisplay}
        >
          ₩4,167
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  MARQUEE  ───────────────────────── */
function Marquee() {
  const items = [
    "진짜 같은 Mock 페이지",
    "진짜 광고",
    "진짜 데이터",
    "결제 의향까지 측정",
    "CAC · 객단가 계산",
    "라이브 대시보드",
    "합격선 사전 합의",
    "광고 문구 2~3종 테스트",
    "No-Go면 50% 환불",
    "7일 안에 답",
  ];
  return (
    <section className="section-dark relative overflow-hidden border-b">
      <div className="marquee-track py-6 text-xl font-bold tracking-tight sm:text-2xl">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-10 pr-10 text-text">
            {item}
            <span
              aria-hidden
              className="text-accent"
              style={{ filter: "drop-shadow(0 0 8px var(--accent-glow))" }}
            >
              ●
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────  PROBLEM — 아는 것과 하는 것 사이  ───────────────── */
function Problem() {
  const obstacles = [
    "랜딩페이지는 뭘로 만들지.",
    "구글애즈 계정 세팅은 어떻게 하는지.",
    "전환 추적 픽셀은 또 뭔지.",
    "광고비는 얼마나 태워야 하는지.",
    "그리고 어찌어찌 숫자가 나와도 — CTR 1.8%, 좋은 겁니까 나쁜 겁니까?",
  ];
  return (
    <section className="border-b border-border bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:py-28">
        <div className="reveal">
          <Eyebrow>아는 것과 하는 것 사이</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            수요검증,
            <br />
            해야 한다는 건 다들 압니다.
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            "시작하기 전에 검증부터 해라." 백 번쯤 들어보셨을 겁니다. 맞는
            말이라 반박할 수도 없습니다. 그런데 막상 하려면 —
          </p>
        </div>
        <ol className="reveal-stagger mt-10 space-y-0 border-y border-border">
          {obstacles.map((o, i) => (
            <li
              key={o}
              className="flex items-baseline gap-4 border-b border-border py-4 last:border-b-0"
            >
              <span
                className="text-sm font-bold text-text-tertiary"
                style={fontDisplay}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-lg font-medium text-text">{o}</span>
            </li>
          ))}
        </ol>
        <div className="reveal mt-10">
          <p className="text-lg leading-[1.7] text-text-secondary">
            그래서 대부분 이렇게 합니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary">
              지인 — "오, 괜찮은데?"
            </span>
            <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary">
              AI — "훌륭한 아이디어입니다!"
            </span>
            <span className="rounded-full border border-accent/40 bg-accent/[0.08] px-4 py-2 text-sm font-semibold text-text">
              …그리고 그냥 만들기 시작
            </span>
          </div>
          <p className="mt-10 border-l-2 border-accent pl-6 text-2xl font-bold leading-snug text-text">
            그리고 3개월 뒤 — 시장이 7일 만에 알려줄 수 있던 답을,
            <br className="hidden sm:block" />
            가장 비싼 수업료를 내고 받습니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  AI TRAP  ───────────────────────── */
function AITrap() {
  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:py-28">
        <div className="reveal">
          <Eyebrow>AI 함정</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-[-0.03em] text-text sm:text-5xl">
            AI는 다 해줍니다.
            <br />
            당신 사업의{" "}
            <span className="text-accent" style={glowAccent}>
              숫자
            </span>
            만 빼고.
          </h2>
        </div>
        <div className="reveal-stagger mt-10 space-y-7 text-lg leading-[1.7] text-text-secondary">
          <p>
            ChatGPT에 "이 아이디어 어때?" 물어보셨을 겁니다. 시장 규모, 경쟁
            구도,
            리스크 분석 — 요즘은 "레드오션입니다, 조심하세요"라고 말리기까지
            합니다. 다 그럴듯합니다. 그런데 그건 전부{" "}
            <span className="font-semibold text-text">
              세상 어딘가의 평균, 일반론
            </span>
            입니다.
          </p>
          <p>
            당신 사업이 되느냐는 일반론이 아니라 구체적인 숫자입니다.{" "}
            <span className="font-semibold text-text">
              이 타겟이, 이 카피에, 이 가격에서 — 클릭하는가, 결제 버튼을
              누르는가, 한 명 데려오는 데 얼마가 드는가.
            </span>{" "}
            이 숫자는 AI가 못 줍니다. 검색해도 안 나옵니다.{" "}
            <span className="font-semibold text-accent">
              아직 세상에 존재하지 않는 데이터
            </span>
            니까요.
          </p>
          <p className="text-text-tertiary">
            그리고 솔직히 — AI가 말려도, 원하는 답이 나올 때까지 다시 묻게
            되는 게 사람입니다.
          </p>
          <p className="text-xl font-bold leading-snug text-text">
            AI는 예측을 만들고, 시장은 증거를 만듭니다.
            <br className="hidden sm:block" />
            저희는 진짜 광고를 돌려서, 아직 세상에 없던 당신 사업의 숫자를
            가져옵니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ──────────────  TIMELINE — 좌 sticky 헤드 + 우 7일 레일  ────────────── */
function Timeline() {
  const days = [
    {
      day: "DAY 1–2",
      h: "미니 리서치 + 검증용 사이트 제작",
      p: "검색 수요·경쟁 광고·유사 서비스 가격대를 조사하고, 실서비스처럼 보이는 검증용 브랜드 사이트를 만듭니다. 가격까지 노출합니다 — 고객이 진짜라고 믿어야 진짜 데이터가 나옵니다.",
    },
    {
      day: "DAY 2",
      h: "합격선 합의",
      p: "데이터를 보기 전에 통과 기준 숫자를 함께 정합니다. 정해두지 않으면, 누구나 애매한 숫자를 '그래도 되지 않을까'로 읽게 되기 때문입니다.",
    },
    {
      day: "DAY 3–7",
      h: "광고 집행",
      p: "구글 광고로, 당신을 전혀 모르는 잠재고객에게 노출합니다. 광고 문구를 2~3가지로 나눠 집행합니다. 반응이 없을 때 — 아이디어가 문제인지, 문구가 문제인지까지 가려냅니다.",
    },
    {
      day: "상시",
      h: "라이브 대시보드",
      p: "노출 · 클릭 · 문의 · 결제 시도를 실시간으로 같이 봅니다. 블랙박스 없습니다.",
    },
    {
      day: "DAY 7",
      h: "Go / No-Go 의사결정 미팅",
      p: "숫자 나열이 아니라 — CTR·전환율·고객 획득 비용이 업계 기준 대비 어디인지, 해석과 다음 액션까지 드립니다.",
      last: true,
    },
  ];
  return (
    <section id="timeline" className="border-b border-border bg-bg">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:py-28 lg:grid-cols-[1fr_1.35fr]">
        {/* LEFT — sticky head */}
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>진행 방식</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            7일 동안,
            <br />
            이런 일이
            <br />
            일어납니다.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-[1.7] text-text-secondary">
            도구를 배우실 필요 없습니다. 전 과정을 저희가 실행하고, 당신은
            대시보드로 같이 보기만 하면 됩니다.
          </p>
          <p className="mt-5 max-w-md leading-[1.7] text-text-secondary">
            <span className="font-semibold text-text">
              저희 작업은 48시간이면 끝납니다.
            </span>{" "}
            나머지 닷새는 — 시장이 답하는 데 걸리는 최소 시간입니다. 누가
            하든, 직접 만드셔도 이 시간은 줄지 않습니다.
          </p>
        </div>
        {/* RIGHT — rail */}
        <div>
          <ol className="reveal-stagger relative ml-2 border-l border-border">
            {days.map((d) => (
              <li key={d.h} className="relative pb-12 pl-8 last:pb-0">
                <span
                  className={`absolute -left-[5.5px] top-2 h-2.5 w-2.5 rounded-full ${d.last ? "bg-accent" : "bg-border-hover"}`}
                  style={d.last ? dotAccent : undefined}
                />
                <p
                  className={`text-xs font-bold uppercase tracking-[0.18em] ${d.last ? "text-accent" : "text-text-tertiary"}`}
                  style={fontDisplay}
                >
                  {d.day}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-text">{d.h}</h3>
                <p className="mt-3 max-w-xl leading-[1.7] text-text-secondary">
                  {d.p}
                </p>
              </li>
            ))}
          </ol>
          {/* 직접 하기 비교 */}
          <div className="reveal mt-12 rounded-lg border border-border bg-surface p-7">
            <p className="text-lg font-bold text-text">
              "직접 해도 되잖아요?"
            </p>
            <p className="mt-3 leading-[1.7] text-text-secondary">
              됩니다. 도구 배우는 데 2~4주, 시행착오 광고비는 별도, 그리고 한
              가지가 끝까지 발목을 잡습니다.{" "}
              <span className="font-semibold text-text">
                자기 아이디어 앞에서 객관적인 사람은 없습니다.
              </span>{" "}
              카피도 유리하게 쓰고, 애매한 숫자도 유리하게 읽게 됩니다.
              검증의 절반은 기술이고, 절반은 남의 눈입니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────  NO-BUILD BAND — 이해충돌 제거 선언  ───────────── */
function NoBuildBand() {
  return (
    <section className="section-dark relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 120%, rgba(var(--accent-rgb), 0.12), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:py-24">
        <p className="reveal text-3xl font-extrabold leading-[1.25] tracking-[-0.02em] text-text sm:text-4xl lg:text-[2.75rem]">
          저희는{" "}
          <span className="text-accent" style={glowAccent}>
            개발을 팔지 않습니다.
          </span>
          <br />
          그래서 "만드세요"라고 말할
          <br className="sm:hidden" /> 금전적 이유가 없습니다.
        </p>
        <p className="reveal mx-auto mt-7 max-w-2xl leading-[1.7] text-text-secondary">
          시장조사와 개발을 함께 파는 회사는 Go라고 말할 인센티브가 있습니다.
          저희 수입은 검증의 정확도에서만 나옵니다.
        </p>
      </div>
    </section>
  );
}

/* ─────────────  MEASURE — 신호 사다리 (클릭 < 문의 < 결제)  ───────────── */
function Measure() {
  const signals = [
    {
      Icon: MousePointerClick,
      h: "클릭",
      sub: "약한 신호",
      barH: 56,
      strong: false,
    },
    {
      Icon: MessageCircle,
      h: "문의",
      sub: "중간 신호",
      barH: 104,
      strong: false,
    },
    {
      Icon: CreditCard,
      h: "결제 버튼 클릭",
      sub: "저희가 끝까지 보는 것",
      barH: 168,
      strong: true,
    },
  ];
  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
        <div className="reveal max-w-3xl">
          <Eyebrow>측정하는 것</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            "괜찮네요"와 "살게요"는
            <br />
            다릅니다.
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            클릭은 약한 신호입니다. 저희는 끝까지 갑니다 — 가격을 보여주고,
            결제 버튼을 누르는지까지 측정합니다.{" "}
            <span className="text-text-tertiary">
              (실제 결제 직전 사전등록 안내로 전환되는 방식입니다. 아무에게도
              돈을 받지 않습니다.)
            </span>
          </p>
        </div>
        {/* 신호 사다리 */}
        <div className="reveal-stagger mx-auto mt-16 grid max-w-3xl grid-cols-3 items-end gap-4 sm:gap-8">
          {signals.map(({ Icon, h, sub, barH, strong }) => (
            <div key={h} className="flex flex-col items-center gap-5">
              <div
                className={`w-full rounded-t-lg ${strong ? "bg-accent" : "bg-border-hover"}`}
                style={{
                  height: barH,
                  boxShadow: strong
                    ? "0 0 32px var(--accent-glow)"
                    : undefined,
                }}
              />
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Icon
                  className={`h-5 w-5 ${strong ? "text-accent" : "text-text-tertiary"}`}
                  strokeWidth={2}
                />
                <p
                  className={`text-sm font-bold sm:text-base ${strong ? "text-text" : "text-text-secondary"}`}
                >
                  {h}
                </p>
                <p
                  className={`text-xs ${strong ? "font-semibold text-accent" : "text-text-tertiary"}`}
                >
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="reveal mx-auto mt-16 max-w-3xl border-l-2 border-accent pl-6">
          <p className="text-xl font-bold leading-snug text-text">
            한 가지 더 — 수요가 있어도 단가가 안 맞으면, 만들수록 손해입니다.
          </p>
          <p className="mt-3 text-lg leading-[1.7] text-text-secondary">
            한 명 데려오는 데 광고비 4만원, 그 한 명이 3만원 결제. 저희가
            그렇게 한 번 망해봤습니다. 그래서 클릭 단가와 고객 획득 비용까지
            재서,{" "}
            <span className="font-semibold text-text">
              팔수록 남는 구조인지
            </span>
            를 같이 답합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────  DELIVERABLES — 산출물 샘플 미리보기  ───────────── */
const mock = {
  panel: {
    background: "#101016",
    border: "1px solid #26262e",
  } as const,
  label: { color: "#8e8e97" } as const,
  value: { color: "#f5f5f7", fontFamily: "var(--font-display)" } as const,
  teal: { color: "#2fd49e", fontFamily: "var(--font-display)" } as const,
};

function Deliverables() {
  return (
    <section className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
        <div className="reveal">
          <Eyebrow>받으시는 것</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            7일 뒤, 이런 화면을 받습니다.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-[1.7] text-text-secondary">
            말이 아니라 화면으로 — 검증 기간 내내 같이 보는 실제 산출물
            형태입니다.{" "}
            <span className="text-text-tertiary">(아래는 샘플 예시)</span>
          </p>
        </div>
        <div className="reveal-stagger mt-14 grid gap-6 sm:grid-cols-3">
          {/* 1 — 라이브 대시보드 */}
          <div className="rounded-lg border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-border-hover">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] text-accent"
              style={fontDisplay}
            >
              검증 기간 내내
            </p>
            <h3 className="mt-2 text-xl font-bold text-text">
              라이브 대시보드
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              노출 · 클릭 · 결제 클릭을 실시간 링크로 같이 봅니다.
            </p>
            <div className="mt-5 rounded-lg p-4" style={mock.panel}>
              {[
                ["노출", "12,420", false],
                ["클릭", "398", false],
                ["결제 클릭", "12", true],
              ].map(([k, v, hot]) => (
                <div
                  key={k as string}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span style={mock.label}>{k}</span>
                  <span
                    className="font-bold"
                    style={hot ? mock.teal : mock.value}
                  >
                    {v}
                  </span>
                </div>
              ))}
              <div className="mt-3 flex h-12 items-end gap-1">
                {[22, 38, 30, 52, 44, 66, 58, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 7 ? "#2fd49e" : "rgba(245,245,247,0.16)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* 2 — Go/No-Go 리포트 */}
          <div className="rounded-lg border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-border-hover">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] text-accent"
              style={fontDisplay}
            >
              DAY 7
            </p>
            <h3 className="mt-2 text-xl font-bold text-text">
              Go / No-Go 리포트
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              합격선 대비 결과와 다음 액션 권고까지.
            </p>
            <div className="mt-5 rounded-lg p-4" style={mock.panel}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={mock.label}>
                  검증 리포트 · 7일차
                </span>
                <span
                  className="rounded-md px-2.5 py-1 text-sm font-black"
                  style={{
                    background: "#1d9e75",
                    color: "#02160f",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  GO
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between py-1.5 text-sm">
                <span style={mock.label}>사전 합격선</span>
                <span className="font-bold" style={mock.value}>
                  3.0%
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span style={mock.label}>실측 결제 클릭률</span>
                <span className="font-bold" style={mock.teal}>
                  4.2%
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-1.5 w-full rounded bg-white/10" />
                <div className="h-1.5 w-4/5 rounded bg-white/10" />
                <div className="h-1.5 w-3/5 rounded bg-white/10" />
              </div>
            </div>
          </div>
          {/* 3 — 가격 2안 테스트 */}
          <div className="rounded-lg border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-border-hover">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] text-accent"
              style={fontDisplay}
            >
              DEEP
            </p>
            <h3 className="mt-2 text-xl font-bold text-text">
              가격 2안 테스트
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              얼마를 받아야 하는지 — 감이 아니라 데이터로.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg p-3 text-center" style={mock.panel}>
                <p className="text-xs" style={mock.label}>
                  A안
                </p>
                <p className="mt-1 text-lg font-bold" style={mock.value}>
                  ₩29,000
                </p>
                <p className="mt-1 text-xs" style={mock.label}>
                  전환 3.1%
                </p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  background: "#101016",
                  border: "1.5px solid rgba(47,212,158,.55)",
                }}
              >
                <p className="text-xs font-bold" style={mock.teal}>
                  B안 ✓
                </p>
                <p className="mt-1 text-lg font-bold" style={mock.value}>
                  ₩49,000
                </p>
                <p className="mt-1 text-xs" style={mock.label}>
                  전환 2.4%
                </p>
              </div>
            </div>
            <div
              className="mt-2 rounded-lg px-3 py-2.5 text-center text-sm font-bold"
              style={{
                background: "rgba(29,158,117,.12)",
                color: "#0f6e56",
              }}
            >
              B안 채택 시 방문자당 매출 +31%
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  PRICING  ───────────────────────── */
function Pricing() {
  const tiers = [
    {
      tag: "QUICK 검증",
      price: "50만원",
      period: "7일",
      desc: "아무도 원하지 않는 건 아닌지 — 수요부터 확인합니다.",
      lines: [
        "실서비스처럼 보이는 검증용 브랜드 사이트 제작 — 종료 후 도메인·디자인 전부 고객 소유",
        "미니 시장 리서치 — 검색 수요 · 경쟁 광고 · 유사 서비스 가격대 조사",
        "광고 문구 2~3종 제작 + 구글 광고 7일 집행 · 기간 내 최적화 (광고비 5만원 포함)",
        "GA4 + 전환 이벤트 + 결제 의향 측정",
        "클릭 단가 · 고객 획득 비용(CAC) 1차 측정",
        "라이브 대시보드 상시 공개 + Go/No-Go 리포트 + 30분 의사결정 미팅",
        "수요 신호가 잡히지 않으면 50% 환불",
      ],
      cta: "Quick으로 시작",
      highlight: true,
    },
    {
      tag: "DEEP 검증",
      price: "130만원",
      period: "14일",
      desc: "원하는데 돈이 안 되는 건 아닌지 — 단가와 손익까지 확인합니다.",
      lines: [
        "Quick 전체 포함",
        "가격 2안 테스트 — '얼마를 받아야 하는지'를 데이터로",
        "경쟁사 · 비즈니스 모델 분석 리포트",
        "인스타·페이스북 광고 추가 (광고비 20만원 포함) + 콘텐츠 5~7개",
        "잠재고객 설문 + 인터뷰 5~10명",
        "객단가(한 명이 내는 돈) · CAC · LTV · 손익 시뮬레이션",
        "No-Go 판정 시 50% 환불",
      ],
      cta: "Deep 상담",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
        <div className="reveal">
          <Eyebrow>가격</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            검증 안 한 값이,
            <br />늘 더 비쌌습니다.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-text-secondary">
            사업이 죽는 방식은 두 가지입니다.{" "}
            <span className="font-semibold text-text">
              아무도 원하지 않거나 — 원하는데, 돈이 안 되거나.
            </span>{" "}
            두 플랜이 각각 그 질문에 답합니다.
          </p>
        </div>
        {/* 보험료 프레이밍 — 비교 스트립 */}
        <div className="reveal mt-12 grid overflow-hidden rounded-lg border border-border sm:grid-cols-[1fr_auto_1fr]">
          <div className="bg-surface p-7">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary"
              style={fontDisplay}
            >
              '일단 만들기'의 평균 비용
            </p>
            <p className="mt-3 text-2xl font-bold text-text">
              3~6개월 + 수백만 원
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              외주·광고비, 그리고 그 기간 전부의 기회비용
            </p>
          </div>
          <div className="flex items-center justify-center border-y border-border bg-bg px-6 py-3 sm:border-x sm:border-y-0">
            <span
              className="text-sm font-bold uppercase tracking-widest text-text-tertiary"
              style={fontDisplay}
            >
              vs
            </span>
          </div>
          <div className="bg-accent/[0.05] p-7">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] text-accent"
              style={fontDisplay}
            >
              Quick 검증
            </p>
            <p className="mt-3 text-2xl font-bold text-text">7일, 50만원</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              50만원은 검증 비용이 아니라,{" "}
              <span className="font-semibold text-text">
                6개월짜리 오답에 대한 보험료
              </span>
              입니다.
            </p>
          </div>
        </div>
        {/* 플랜 카드 */}
        <div className="reveal-stagger mt-8 grid gap-5 sm:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.tag}
              className={`relative rounded-lg border p-7 transition hover:-translate-y-0.5 ${
                t.highlight
                  ? "border-accent/40 bg-gradient-to-br from-accent/[0.08] to-transparent"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
              style={
                t.highlight
                  ? {
                      boxShadow:
                        "0 0 0 1px var(--accent-glow) inset, 0 16px 40px rgba(var(--accent-rgb), 0.10)",
                    }
                  : undefined
              }
            >
              {t.highlight && (
                <span
                  className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
                  style={fontDisplay}
                >
                  추천 시작점
                </span>
              )}
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary"
                style={fontDisplay}
              >
                {t.tag}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p
                  className="text-4xl font-bold tracking-[-0.03em] text-text sm:text-5xl"
                  style={fontDisplay}
                >
                  {t.price}
                </p>
                <p className="text-sm font-medium text-text-tertiary">
                  / {t.period}
                </p>
              </div>
              <p className="mt-4 text-[15px] font-semibold leading-snug text-text">
                {t.desc}
              </p>
              <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-text-secondary">
                {t.lines.map((l) => (
                  <li key={l} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                      strokeWidth={2.5}
                    />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className={`mt-7 block rounded-lg px-5 py-3 text-center text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  t.highlight
                    ? "bg-accent text-white hover:bg-accent-hover hover:shadow-[0_12px_32px_var(--accent-glow)]"
                    : "border border-border-hover bg-bg text-text hover:border-accent hover:text-accent"
                }`}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="reveal mt-8 text-sm text-text-tertiary">
          ※ 매출은 보장하지 않습니다 — 법적으로 누구도 보장할 수 없습니다.
          보장은 저희가 통제할 수 있는 것, 검증 환불에만 겁니다. 광고비는 실제
          집행 비용이라 환불 대상에서 제외됩니다.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────  NO-GO 패키지  ───────────────────────── */
function NoGo() {
  const items = [
    "검증비 50% 환불",
    "제작한 랜딩페이지 · 도메인 · 디자인, 전부 가져가세요",
    "왜 안 됐는지 분석 — 수요 자체인지, 타겟인지, 메시지인지, 가격인지",
    "피벗 방향 제안 + 재검증 시 할인",
    "가장 큰 것: 들어갈 뻔했던 몇 달과 수백만 원이 그대로 남습니다",
  ];
  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:py-28">
        <div className="reveal">
          <Eyebrow>No-Go가 나오면</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            "하지 마세요"라는
            <br />
            결과가 나오면요?
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            기분 좋은 소식은 아니지만, 손해는 아닙니다.
          </p>
        </div>
        <ul className="reveal-stagger mt-10 space-y-4">
          {items.map((it) => (
            <li
              key={it}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface px-5 py-4"
            >
              <Check
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                strokeWidth={2.5}
              />
              <span className="leading-relaxed text-text">{it}</span>
            </li>
          ))}
        </ul>
        <p className="reveal mt-10 border-l-2 border-accent pl-6 text-xl font-bold leading-[1.5] text-text">
          저희에게 최악의 후기는 "괜히 했다"입니다. 그래서 안 될 거면, 빠르고
          분명하게 말씀드립니다. 그래야 저희가{" "}
          <span className="text-accent">"되겠는데요"</span>라고 말할 때, 그
          말에 무게가 생깁니다.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────  FOUNDER STORY  ───────────────────────── */
function FounderStory() {
  return (
    <section id="story" className="section-dark border-b">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:py-28">
        <div className="reveal">
          <Eyebrow>왜 이걸 만들었나</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            두 번 망해보고
            <br />
            만든 서비스입니다.
          </h2>
        </div>
        <div className="reveal-stagger mt-10 space-y-7 text-lg leading-[1.75] text-text-secondary">
          <p>
            AI에게 시장조사를 맡기고, "좋다"는 답을 믿고 시작한 사업이 두 개
            있었습니다.
          </p>
          <p>
            <span className="font-bold text-text">하나는 고객이 없었습니다.</span>{" "}
            <span className="font-bold text-text">
              하나는 수요는 있었는데, 객단가가 안 맞아 만들수록 손해였습니다.
            </span>
          </p>
          <p>
            세 번째는 순서를 바꿨습니다. 만들기 전에 광고부터 띄웠고 — 그게
            처음으로 됐습니다.{" "}
            <span className="font-semibold text-accent">지금도 운영 중입니다.</span>
          </p>
          <p className="text-xl font-bold text-text">
            이 서비스는 그 '순서'를 시스템으로 만든 것입니다.
          </p>
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary"
                style={fontDisplay}
              >
                검증 설계 · 데이터 분석
              </p>
              <p className="mt-2 font-bold text-text">중앙대 산업보안학과</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary"
                style={fontDisplay}
              >
                광고 운영 · 마케팅
              </p>
              <p className="mt-2 font-bold text-text">중앙대 광고홍보학과</p>
            </div>
          </div>
          <p className="text-sm text-text-tertiary">
            실명으로, 광고 계정과 데이터를 전부 공개하고 일합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FAQ  ───────────────────────── */
function FAQ() {
  const qa = [
    {
      q: "제가 직접 하면 되지 않나요?",
      a: "가능합니다. 다만 도구를 배우는 데 2~4주, 시행착오 광고비가 별도로 듭니다. 그리고 더 큰 문제는 객관성입니다. 자기 아이디어를 검증하는 사람은 카피를 유리하게 쓰고, 숫자를 유리하게 읽습니다. AI도 좋다고 하고, 본인도 좋다고 합니다 — 객관적인 건 모르는 사람의 클릭뿐입니다.",
    },
    {
      q: "Claude Code 같은 걸로 MVP를 직접 만들어서 반응 보면 되지 않나요?",
      a: "만들 수 있다는 것과 팔리는지 아는 것은 별개 문제입니다. MVP로 검증하는 경로는 — 빌드 1~2주, 광고 세팅 시행착오, 그리고 내가 만든 것에 대한 애착 때문에 숫자를 유리하게 읽게 됩니다. 저희 창업자도 직접 만들 수 있어서 그냥 만들었고, 두 번 그렇게 망했습니다. 만들기 전에 7일 — Go가 나오면 검증에 쓴 랜딩과 데이터를 그대로 가져가서 직접 만드시면 됩니다. 그게 더 빠릅니다.",
    },
    {
      q: "7일, 표본이 작은데 믿을 수 있나요?",
      a: "7일 검증이 주는 건 '확신'이 아니라 '신호'입니다. 특히 부정 신호는 강력합니다 — 광고비를 썼는데 아무도 반응하지 않았다면, 그건 통계 문제가 아니라 현실입니다. 애매한 회색지대가 나오면 그때 Deep으로 정밀 측정을 권합니다. 처음부터 Deep을 권하지 않습니다.",
    },
    {
      q: "더 빨리는 안 되나요?",
      a: "저희 작업 자체는 48시간이면 끝납니다 — 페이지 제작, 광고 세팅까지. 나머지 닷새가 줄일 수 없는 시간입니다. 요일마다 시장 반응이 달라서, 최소 한 주는 노출돼야 노이즈가 아니라 신호가 됩니다. 더 짧은 검증도 가능은 합니다. 정확하지 않을 뿐입니다.",
    },
    {
      q: "광고비는 별도인가요?",
      a: "Quick 5만원, Deep 20만원이 포함돼 있습니다. 광고비는 실제 집행되는 비용이라 환불 대상에서는 제외됩니다.",
    },
    {
      q: "환불 기준이 정확히 뭔가요?",
      a: "Day 2에 함께 정한 합격선입니다. 검증 종료 시점에 그 숫자에 미달하면 검증비의 50%를 환불합니다. 기준을 데이터 보기 전에 정하는 이유가 이것입니다 — 끝난 뒤 기준을 두고 다투지 않기 위해서입니다.",
    },
    {
      q: "제 아이디어를 가져가면 어떡하죠?",
      a: "비밀유지 약정을 맺고 시작합니다. 검증 산출물(사이트·도메인·데이터)은 종료 후 전부 고객 자산으로 이관되며, 저희는 어떤 권리도 갖지 않습니다. 저희는 검증을 파는 회사지, 아이디어로 사업하는 회사가 아닙니다.",
    },
    {
      q: "제 잠재고객을 속이는 건 아닌가요?",
      a: "결제 버튼을 누른 분에게는 '출시 준비 중인 서비스이며, 오픈하면 가장 먼저 안내드린다'는 사전등록 화면이 나옵니다. 돈은 받지 않습니다. 그리고 그분들은 출시하는 날, 당신의 첫 고객 명단이 됩니다.",
    },
    {
      q: "어떤 아이디어든 가능한가요?",
      a: "업종 제한 없습니다 — 온라인 서비스, 앱, 커머스, 교육, 오프라인 매장까지. 다만 오프라인·지역 기반 사업은 검증 설계가 달라집니다(지역 타겟 광고 + 사전 예약 측정). 신청해주시면 가능한 설계인지 24시간 안에 먼저 답드립니다.",
    },
    {
      q: "검증용 사이트라면, 웹사이트 제작도 해주시는 건가요?",
      a: "구분이 필요합니다. 검증용 사이트는 광고 반응을 측정하기 위한 실서비스형 페이지이며, 회원가입·결제 같은 기능 개발이 들어가는 정식 서비스 개발과는 다릅니다. 종료 후 도메인·디자인을 전부 이관해드리므로 검증을 통과하면 그 위에 그대로 키워가실 수 있고, 기능 개발이 필요하시면 개발 파트너를 연결해드립니다.",
    },
    {
      q: "Go가 나오면 만들어주기도 하나요?",
      a: "저희는 검증 전문입니다. 원하시면 검증된 개발 파트너를 연결해드립니다. 개발을 직접 팔지 않기 때문에, 저희 판정에는 '만들게 하려는' 이해관계가 없습니다.",
    },
    {
      q: "신청하면 바로 결제인가요?",
      a: "아닙니다. 아이디어 한 줄을 보내주시면 24시간 안에 검증 가능 여부와 적합한 플랜을 회신드립니다. 결정은 그때 하시면 됩니다.",
    },
  ];
  return (
    <section id="faq" className="border-b border-border bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-24">
        <div className="reveal">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            자주 묻는 질문
          </h2>
        </div>
        <div className="reveal mt-10 divide-y divide-border border-y border-border">
          {qa.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-bold text-text">
                <span>{it.q}</span>
                <span className="text-text-tertiary transition group-open:rotate-45 group-open:text-accent">
                  +
                </span>
              </summary>
              <p className="mt-4 leading-[1.7] text-text-secondary">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FINAL CTA  ───────────────────────── */
function FinalCTA() {
  return (
    <section
      id="cta"
      className="section-dark relative overflow-hidden border-b"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-10 select-none text-[11rem] font-black leading-none tracking-tighter"
        style={{
          fontFamily: "var(--font-display)",
          color: "rgba(var(--text-rgb), 0.05)",
        }}
      >
        BIZFILTER
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-2/3"
        style={{
          background:
            "radial-gradient(circle at 80% 30%, rgba(var(--accent-rgb), 0.12), transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:grid-cols-5 sm:py-28">
        <div className="reveal sm:col-span-2">
          <Eyebrow>지금 시작</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-[-0.03em] text-text sm:text-5xl">
            어차피 알게 될 답,
            <br />
            <span className="text-accent" style={glowAccent}>
              7일 만에
            </span>{" "}
            아세요.
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            질문 다섯 개, 탭 다섯 번.
            <br />
            제출하면{" "}
            <span className="font-semibold text-text">
              검증 적합도를 그 자리에서 바로
            </span>{" "}
            보여드리고, 24시간 안에 직접 확인 후 회신드립니다.
          </p>
          <div className="mt-10 rounded-lg border border-border bg-surface p-5 text-sm">
            <p className="font-bold text-text">폼 작성이 번거로우시면</p>
            <p className="mt-1 text-text-secondary">
              카카오톡 채널에서 바로 30분 무료 진단을 받으실 수 있습니다.{" "}
              <span className="text-text-tertiary">(채널 준비 중)</span>
            </p>
          </div>
        </div>
        <div className="reveal sm:col-span-3">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FOOTER  ───────────────────────── */
function Footer() {
  return (
    <footer className="section-dark text-text-tertiary">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <a
              href="#"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-text"
            >
              <span
                className="relative flex h-7 w-7 items-center justify-center rounded bg-text text-sm font-black text-bg"
                style={fontDisplay}
              >
                B
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent"
                  style={dotAccent}
                />
              </span>
              <span>비즈필터</span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              사업 아이디어 검증 전문.
              <br />
              만들기 전에 —{" "}
              <span className="text-text">진짜 시장의 행동 데이터</span>로
              답합니다.
            </p>
            <p className="mt-6 text-xs text-text-tertiary">
              중앙대학교 산업보안학과 + 광고홍보학과 팀.
            </p>
          </div>
          <div className="sm:col-span-3">
            <p
              className="text-xs font-bold uppercase tracking-widest text-text-tertiary"
              style={fontDisplay}
            >
              메뉴
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#timeline" className="hover:text-accent">
                  진행 방식
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-accent">
                  가격
                </a>
              </li>
              <li>
                <a href="#story" className="hover:text-accent">
                  스토리
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-accent">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-accent">
                  블로그
                </a>
              </li>
              <li>
                <a href="/checklist" className="hover:text-accent">
                  검증 체크리스트 (무료)
                </a>
              </li>
              <li>
                <a href="#cta" className="hover:text-accent">
                  검증 신청
                </a>
              </li>
            </ul>
          </div>
          <div className="sm:col-span-4">
            <p
              className="text-xs font-bold uppercase tracking-widest text-text-tertiary"
              style={fontDisplay}
            >
              연락
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                이메일 · <span className="text-text-secondary">(준비 중)</span>
              </li>
              <li>
                카톡 채널 ·{" "}
                <span className="text-text-secondary">(준비 중)</span>
              </li>
              <li>
                운영 시간 ·{" "}
                <span className="text-text-secondary">평일 10~19시</span>
              </li>
              <li>
                응답 시간 ·{" "}
                <span className="text-text-secondary">24시간 이내</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs sm:flex-row sm:items-center">
          <p>© 2026 비즈필터 — 사업 아이디어 검증 서비스</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-accent">
              이용약관
            </a>
            <a href="#" className="hover:text-accent">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-accent">
              사업자 정보
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
