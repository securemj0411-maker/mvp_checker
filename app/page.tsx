import LeadForm from "@/components/LeadForm";
import {
  BarChart3,
  Bot,
  Layout,
  Megaphone,
  TrendingDown,
  Wallet,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      <Nav />
      <Hero />
      <Problem />
      <AITrap />
      <Method />
      <Transparency />
      <FounderStory />
      <Team />
      <Offers />
      <RiskReversal />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* ─────────────────────────  NAV  ───────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <a href="#" className="text-lg font-bold tracking-tight">
          0to1
        </a>
        <a
          href="#cta"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          검증 신청
        </a>
      </div>
    </header>
  );
}

/* ─────────────────────────  HERO  ───────────────────────── */
function Hero() {
  return (
    <section className="border-b border-neutral-100">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="mb-5 inline-block rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
              사업 아이디어 검증 서비스
            </p>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              되는 사업을 해라.
              <br />
              우리가 다 검증해드립니다.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
              AI는 어떤 아이디어든 "좋다"고 합니다. 우리는 Mock 사이트 띄우고
              진짜 광고 돌려서{" "}
              <span className="font-semibold text-neutral-900">
                실제 시장 반응 + 객단가 + 손익
              </span>
              까지 답합니다.
            </p>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <a
                href="#cta"
                className="rounded-lg bg-neutral-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-neutral-700"
              >
                50만원으로 검증 시작
              </a>
              <a
                href="#method"
                className="px-2 py-3 text-base font-medium text-neutral-700 underline-offset-4 hover:underline"
              >
                어떻게 작동하는지 보기 →
              </a>
            </div>
            <p className="mt-8 text-sm text-neutral-500">
              Mock 사이트 · 광고 계정 · 실제 데이터 다 공개 · 블랙박스 없음
            </p>
          </div>
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="relative hidden lg:block">
      {/* Mock browser */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 px-3 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 truncate rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-500">
            your-idea.com
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="h-3 w-3/4 rounded bg-neutral-900" />
          <div className="h-2 w-1/2 rounded bg-neutral-300" />
          <div className="h-2 w-2/3 rounded bg-neutral-300" />
          <div className="mt-2 h-20 rounded bg-neutral-100" />
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-28 rounded bg-neutral-900" />
            <div className="h-8 w-20 rounded border border-neutral-300" />
          </div>
        </div>
      </div>
      {/* Floating stat chips */}
      <div className="absolute -top-4 -right-4 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md">
        <div className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
          CTR
        </div>
        <div className="mt-0.5 text-base font-bold text-neutral-900">3.2%</div>
      </div>
      <div className="absolute top-1/3 -left-6 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md">
        <div className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
          폼 제출
        </div>
        <div className="mt-0.5 text-base font-bold text-neutral-900">47건</div>
      </div>
      <div className="absolute -bottom-5 -right-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 shadow-md">
        <div className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
          CPC
        </div>
        <div className="mt-0.5 text-base font-bold text-neutral-900">₩820</div>
      </div>
    </div>
  );
}

/* ─────────────────────────  PROBLEM  ───────────────────────── */
function Problem() {
  const items = [
    {
      Icon: Bot,
      h: "AI한테 물어보고 시작했어요.",
      p: "ChatGPT한테 시장조사 시키니까 다 좋다고 하더라구요. 시장조사처럼 쓰여진 글이 나왔지, 진짜 시장 반응은 안 알려줬어요.",
    },
    {
      Icon: TrendingDown,
      h: "광고 돌려보고 깨달았어요.",
      p: "수백만원 + 한 달 태우고 알았어요. '아 이거 안 되는구나.' 만들기 전에 봤어야 하는데.",
    },
    {
      Icon: Wallet,
      h: "수요는 있었어요. 단가가 안 맞았어요.",
      p: "고객 1명 데려오는데 4만원, 결제 3만원. 수요만 봤지 단가는 안 봤어요. 손해 보면서 운영하다 접었어요.",
    },
  ];
  return (
    <section className="border-b border-neutral-100 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-5 py-20">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          이래서 망합니다.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          사업 시작 전 검증을 안 하면 길은 정해져 있어요. 셋 중 하나.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {items.map(({ Icon, h, p }) => (
            <div
              key={h}
              className="rounded-2xl border border-neutral-200 bg-white p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100">
                <Icon
                  className="h-5 w-5 text-neutral-700"
                  strokeWidth={1.75}
                />
              </div>
              <p className="mt-5 text-lg font-semibold">{h}</p>
              <p className="mt-3 leading-relaxed text-neutral-600">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  AI TRAP  ───────────────────────── */
function AITrap() {
  return (
    <section className="border-b border-neutral-100">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          AI 함정
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          AI한테 시장조사 시켜본 적 있죠?
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-neutral-700">
          <p>
            저도 그랬어요. ChatGPT한테 시장 분석 시키고, 수요 예측 시키고, 경쟁
            구조까지 분석시켰어요.
          </p>
          <p>
            <span className="bg-yellow-200/60 px-1 font-semibold">
              그 결과 사업 2개를 말아먹었습니다.
            </span>
          </p>
          <p>
            AI는 어떤 아이디어든 "좋다"고 합니다. 시장조사 시키면 시장조사처럼{" "}
            <span className="italic">쓰여진 글</span>이 나와요 — 그게 진짜 시장
            반응이 아닙니다. 모르는 사람 데려와서 광고 보여주고, 클릭 받고, 폼
            받고, 결제 의향까지 측정하는 거. 그건 AI가 못 합니다.
          </p>
          <p className="text-xl font-semibold text-neutral-900">
            AI는 만드는 건 잘합니다.
            <br />
            진짜 되는지는 — 사람 + 광고 + 데이터만 답합니다.
          </p>
          <p className="text-neutral-600">
            그래서 우리는 Mock 사이트 띄우고 실제 광고 돌려서 답을 가져옵니다.
            의견 X. 데이터 O.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  METHOD  ───────────────────────── */
function Method() {
  const steps = [
    {
      Icon: Layout,
      n: "01",
      h: "Mock 사이트 제작",
      sub: "1~2일",
      body: "광고용 랜딩 페이지를 진짜 제품처럼 만듭니다. 카피·디자인·CTA·결제의향 폼까지. 고객이 봤을 때 진짜라고 믿어야 진짜 데이터가 나옵니다.",
    },
    {
      Icon: Megaphone,
      n: "02",
      h: "SNS + 광고 운영",
      sub: "5~10일",
      body: "인스타 계정 운영, 구글애즈·페북애즈 집행, GA 이벤트 설정. 실제 광고비 태워서 진짜 트래픽 데려옵니다. 폼·전환 데이터 다 수집.",
    },
    {
      Icon: BarChart3,
      n: "03",
      h: "종합 분석 리포트",
      sub: "결론 + 근거 + 다음 액션",
      body: "수요·객단가·CAC·LTV·라이프사이클까지. 이 사업 진짜 돈 벌리는 구조인지, 어떤 부분 약점인지, 방향 수정 옵션은 뭔지. 단순 데이터 X.",
    },
  ];
  return (
    <section id="method" className="border-b border-neutral-100 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          어떻게 검증하나
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          광고 한 번 돌려보는 게 아닙니다.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          Mock 사이트, SNS 계정, 광고 운영, 데이터 분석까지 — 사업 시작했을
          때랑 같은 조건으로 검증합니다. 다만 빌드 전에.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {steps.map(({ Icon, n, h, sub, body }) => (
            <div
              key={n}
              className="rounded-2xl border border-neutral-200 bg-white p-7"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono font-medium text-neutral-400">
                  {n}
                </p>
                <Icon
                  className="h-6 w-6 text-neutral-400"
                  strokeWidth={1.5}
                />
              </div>
              <p className="mt-3 text-2xl font-bold">{h}</p>
              <p className="mt-1 text-sm font-medium text-neutral-500">{sub}</p>
              <p className="mt-5 leading-relaxed text-neutral-700">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 rounded-2xl border border-neutral-900 bg-neutral-900 p-8 text-white sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            핵심 차이
          </p>
          <p className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
            보고서만 주는 시장조사 회사가 아닙니다.
            <br />
            <span className="text-yellow-300">
              진짜 시장에 띄워서 답을 가져옵니다.
            </span>
          </p>
          <p className="mt-5 text-base leading-relaxed text-neutral-300">
            Mock 사이트 + 광고 + 사용자 행동 데이터 = 진짜 시장 반응. AI
            분석·설문조사·인터뷰만 갖고 결정하는 게 아니라, 진짜 고객 행동으로
            답합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  TRANSPARENCY  ───────────────────────── */
function Transparency() {
  const items = [
    {
      tag: "Mock 사이트",
      h: "직접 보세요.",
      p: "광고용으로 만든 랜딩 그대로 공유합니다. 어떤 카피·CTA·디자인으로 테스트했는지.",
    },
    {
      tag: "광고 계정",
      h: "캡처 다 공개.",
      p: "구글애즈·페북애즈 캡처. 키워드, 노출, CTR, CPC. 영수증까지.",
    },
    {
      tag: "데이터 dashboard",
      h: "결론의 근거.",
      p: "GA 데이터, 폼 제출, 이벤트 로그. *왜* 그 결론인지 숫자로.",
    },
  ];
  return (
    <section className="border-b border-neutral-100">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          투명성
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          보이지 않는 거 안 팝니다.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          PDF 리포트 한 장 던지고 끝? 아닙니다. 우리가 *어떻게* 그 결론에
          도달했는지 데이터·계정·사이트까지 다 공개합니다. 직접 검증해보세요.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.tag}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                {it.tag}
              </p>
              <p className="mt-3 text-xl font-bold">{it.h}</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {it.p}
              </p>
              <div className="mt-5 flex h-32 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-xs text-neutral-400">
                실제 캡처 예시 (준비 중)
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FOUNDER STORY  ───────────────────────── */
function FounderStory() {
  return (
    <section className="border-b border-neutral-100 bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-3xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
          왜 이걸 만들었나
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          저도 똑같이 했습니다.
        </h2>
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-neutral-300">
          <p>
            중앙대 산업보안학과 다니면서 사업 3개를 직접 운영해봤어요.
          </p>
          <p>
            <span className="font-semibold text-white">AI퍼니쳐스.</span> 사진에서
            가구를 지우는 AI 서비스. 부동산 중개인용. AI 시장조사 다 했고
            "좋다"고 했어요. 만들고 보니 AI 이미지 모델이 너무 빨리 보편화되면서
            수요가 증발. 한 달.
          </p>
          <p>
            <span className="font-semibold text-white">버전 2 (공인중개사용).</span>{" "}
            방향 살짝 틀어 다시. 결과: 공인중개사들 굳이 안 쓰더라. 수요 자체가
            없었어요.{" "}
            <span className="bg-yellow-200/20 px-1 text-white">
              진짜 광고 한 번이면 알 수 있었던 거.
            </span>
          </p>
          <p>
            <span className="font-semibold text-white">MBTI 검사 결제.</span>{" "}
            이번엔 수요는 있었어요. 사람들 진짜 결제했어요. 근데 광고비 4만원,
            결제 3만원.{" "}
            <span className="bg-yellow-200/20 px-1 text-white">
              수요만 봤지, 객단가는 안 봤어요.
            </span>
          </p>
          <p>
            <span className="font-semibold text-white">득템잡이.</span> 그래서
            처음으로 만들기 전에 광고부터 돌렸어요. 신호 잡힌 거 확인하고
            만들었더니, 됐어요.
          </p>
          <p className="border-l-2 border-neutral-500 pl-6 text-xl font-semibold text-white">
            그래서 이걸 만들었습니다.
            <br />
            당신은 그 시간·돈을 안 날리게.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  TEAM  ───────────────────────── */
function Team() {
  const members = [
    {
      initial: "K",
      role_main: "Mock 사이트 빌드 · 데이터 분석 · 사업 전략",
      degree: "중앙대학교 산업보안학과",
      bio: "이전 사업 3건 직접 운영 (실패 2 + 성공 1). AI 시대 사업 실패 패턴 분석에서 시작.",
      tag: "FOUNDER",
    },
    {
      initial: "P",
      role_main: "광고 운영 · SNS 마케팅 · 객단가 분석",
      degree: "중앙대학교 광고홍보학과",
      bio: "구글애즈·페북애즈·인스타 캠페인 운영. CAC·LTV·CTR 데이터 해석 전문.",
      tag: "PARTNER",
    },
  ];
  return (
    <section className="border-b border-neutral-100 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          팀
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          누가 검증하는가.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          검증은 아무나 못 합니다. Mock 사이트 만들 사람, 광고 돌릴 사람, 데이터
          읽을 사람 — 셋 다 있어야 합니다. 우리 둘이 그걸 합니다.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {members.map((m) => (
            <div
              key={m.tag}
              className="rounded-2xl border border-neutral-200 bg-white p-7"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold text-white">
                  {m.initial}
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-600">
                  {m.tag}
                </span>
              </div>
              <p className="mt-5 text-sm font-semibold text-neutral-900">
                {m.degree}
              </p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                {m.role_main}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {m.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  OFFERS  ───────────────────────── */
function Offers() {
  const tiers = [
    {
      tag: "STEP 1",
      h: "Quick 검증",
      price: "50만원",
      sub: "Mock 사이트 + 광고 + 기본 분석",
      lines: [
        "7일 안에 결과",
        "Mock 랜딩 페이지 제작",
        "구글애즈 1주 운영 (광고비 5만 포함)",
        "수요 · 클릭 · 폼 데이터 정성 분석",
        "Go / No-Go 직관 판단",
        "신호 못 잡으면 50% 환불",
      ],
      foot: "내 아이디어, 진짜 시장 반응 빠르게",
      cta: "Quick 신청",
      highlight: true,
    },
    {
      tag: "STEP 2 (정밀)",
      h: "Deep 검증",
      price: "130만원",
      sub: "위 + SNS 운영 + CAC/LTV/라이프사이클",
      lines: [
        "14일 정밀 검증",
        "인스타·SNS 계정 운영 (콘텐츠 5~7개)",
        "Facebook · Google 양쪽 광고 (광고비 20만 포함)",
        "사용자 설문 + 인터뷰",
        "CAC · LTV · 객단가 · 손익 시뮬",
        "객관 리포트 + 다음 액션 권고",
        "No-Go 결과 시 50% 환불",
      ],
      foot: "사업 본격 시작 전, 정밀 데이터 필요할 때",
      cta: "Deep 신청",
    },
  ];
  return (
    <section className="border-b border-neutral-100">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          오퍼
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          단계별로. 통과 못 하면 다음 단계 X.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          Quick에서 신호 못 잡으면 환불입니다. 빌드는 우리가 직접 하지 않아요 —
          검증 통과 후 외부 빌드 파트너 추천드립니다 (옵션).
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.h}
              className={`rounded-2xl border p-7 ${
                t.highlight
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-widest ${t.highlight ? "text-neutral-400" : "text-neutral-500"}`}
              >
                {t.tag}
              </p>
              <p className="mt-3 text-2xl font-bold">{t.h}</p>
              <p
                className={`mt-2 text-3xl font-bold tracking-tight ${t.highlight ? "text-white" : "text-neutral-900"}`}
              >
                {t.price}
              </p>
              <p
                className={`mt-1 text-sm ${t.highlight ? "text-neutral-400" : "text-neutral-500"}`}
              >
                {t.sub}
              </p>
              <ul
                className={`mt-6 space-y-2 text-sm leading-relaxed ${t.highlight ? "text-neutral-200" : "text-neutral-700"}`}
              >
                {t.lines.map((l) => (
                  <li key={l} className="flex gap-2">
                    <span
                      className={
                        t.highlight ? "text-neutral-500" : "text-neutral-400"
                      }
                    >
                      ·
                    </span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <p
                className={`mt-6 text-sm ${t.highlight ? "text-neutral-300" : "text-neutral-600"}`}
              >
                {t.foot}
              </p>
              {t.cta && (
                <a
                  href="#cta"
                  className={`mt-6 block rounded-lg px-5 py-3 text-center text-sm font-semibold ${t.highlight ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}
                >
                  {t.cta}
                </a>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-neutral-500">
          ※ 매출은 보장하지 않습니다 (법적으로 보장 불가). 보장은 우리가 통제할
          수 있는 것 — 검증 환불 — 에만 겁니다. 패키지 내 광고비 (Quick 5만 ·
          Deep 20만) 초과 시 영수증 공유 후 별도.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────  RISK REVERSAL  ───────────────────────── */
function RiskReversal() {
  return (
    <section className="border-b border-neutral-100 bg-yellow-50/60">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          수요 신호가 안 잡히면,
          <br />
          반은 돌려드립니다.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-neutral-700">
          Quick에서 신호 못 잡으면 50% 환불 (광고비 제외). Deep도 No-Go 결과 시
          50% 환불. 우리가 통제할 수 있는 것에만 보장을 겁니다.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-neutral-700">
          돈·시간 수백만원·수개월 잃고 깨닫는 것보다,
          <br />
          50만원으로 빨리 다음 아이디어로 가는 게 낫습니다.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────  FAQ  ───────────────────────── */
function FAQ() {
  const qa = [
    {
      q: "빌드도 하시나요?",
      a: "안 합니다. 검증만 합니다. 검증 통과하면 외부 빌드 파트너 추천드립니다 (옵션). 우리는 검증 전문이어야 검증을 진짜 잘할 수 있어요.",
    },
    {
      q: "광고비는 누가 부담하나요?",
      a: "Quick 패키지에 5만원, Deep에 20만원이 포함돼 있습니다. 초과 광고비는 영수증 공유 후 별도 청구. 패키지 내 광고비는 실제 광고 집행에 쓰여 환불 불가.",
    },
    {
      q: "AI한테 시키면 안 되나요?",
      a: "AI는 시장조사처럼 *쓰여진 글*은 잘 만듭니다. 근데 모르는 사람 데려와서 광고 보여주고, 클릭 받고, 폼 받고, 결제 의향 측정 — 그건 AI가 못 합니다. 그게 진짜 데이터예요.",
    },
    {
      q: "Mock 사이트는 진짜 작동하나요?",
      a: "광고용으로 진짜처럼 만듭니다. 결제 직전 단계까지 — 결제 의향 확인 후 '곧 출시됩니다 + 사전등록 받습니다'로 전환. 윤리적 페이크도어.",
    },
    {
      q: "어떤 아이디어를 받나요?",
      a: "SaaS, 앱, 웹서비스 1순위. B2C 소비자 서비스, B2B SaaS, 마켓플레이스 등 표준 검증 가능한 카테고리. 오프라인 비즈니스는 별도 견적.",
    },
    {
      q: "얼마나 걸리나요?",
      a: "Quick 7일, Deep 14일. 신청 → 1차 미팅(30분) → Mock 제작 1~2일 → 광고 운영 5~10일 → 분석 리포트.",
    },
    {
      q: "결과 보장하나요?",
      a: "매출은 법적으로 보장 불가. 보장하는 건 환불 정책. 신호 못 잡으면 50% 환불.",
    },
    {
      q: "해외 사업도 검증되나요?",
      a: "현재는 한국 시장 위주. 추후 영문 버전 출시 예정. 영어권 시장 검증 원하시면 별도 상담.",
    },
  ];
  return (
    <section className="border-b border-neutral-100">
      <div className="mx-auto max-w-3xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          자주 묻는 질문
        </h2>
        <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
          {qa.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold">
                <span>{it.q}</span>
                <span className="text-neutral-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-neutral-600">{it.a}</p>
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
    <section id="cta" className="border-b border-neutral-100 bg-neutral-50">
      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-24 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            당신의 아이디어,
            <br />
            진짜 되는지
            <br />
            먼저 보세요.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600">
            50만원, 7일.
            <br />
            신호 없으면 50% 환불.
          </p>
          <div className="mt-10 space-y-3 rounded-xl border border-neutral-200 bg-white p-5 text-sm">
            <p className="font-semibold text-neutral-900">폼 쓰기 귀찮으시면</p>
            <p className="text-neutral-600">
              카카오톡 채널에서 바로 상담 가능. 30분 무료.{" "}
              <span className="text-neutral-400">(채널 준비 중)</span>
            </p>
          </div>
        </div>
        <div className="sm:col-span-3">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FOOTER  ───────────────────────── */
function Footer() {
  return (
    <footer className="bg-neutral-50">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-neutral-500">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p>© 2026 0to1 · 사업 아이디어 검증 서비스</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-neutral-900">
              이용약관
            </a>
            <a href="#" className="hover:text-neutral-900">
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
