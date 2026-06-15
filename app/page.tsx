import ScrollReveal from "@/components/ScrollReveal";
import StepsAccordion from "@/components/StepsAccordion";
import { ArrowRight, Check } from "lucide-react";
import { BrandMark, Wordmark } from "@/components/Brand";
import { CaseVisual } from "@/components/CaseMockups";
import { KAKAO_CHAT_URL } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };

/* 판정 컬러 시스템 — GO/NO-GO/PIVOT */
const verdict = {
  go: "var(--go)",
  goBg: "var(--go-tint)",
  nogo: "var(--nogo)",
  nogoBg: "var(--nogo-tint)",
  pivot: "var(--pivot)",
  pivotBg: "var(--pivot-tint)",
} as const;

type HeroVariant = "a" | "b";

export default function Home({
  heroVariant = "a",
}: {
  heroVariant?: HeroVariant;
}) {
  return (
    <main className="flex-1">
      <Nav />
      <Hero variant={heroVariant} />
      <PainStory />
      <StepsAccordion />
      <Cases />
      <Process />
      <Pricing />
      <Guarantee />
      <Story />
      <Team />
      <FAQ />
      <FinalCTA />
      <Footer />
      <ScrollReveal />
    </main>
  );
}

/* ── 작은 블루 라벨 (토스의 '홈·소비' 스타일) ── */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[17px] font-bold text-accent">{children}</p>;
}

/* ─────────────────────────  NAV  ───────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2.5 text-[19px]">
          <BrandMark />
          <Wordmark />
        </a>
        <nav className="hidden items-center gap-8 text-[15px] font-semibold text-text-secondary md:flex">
          <a href="#process" className="transition hover:text-text">
            진행 방식
          </a>
          <a href="#cases" className="transition hover:text-text">
            사례
          </a>
          <a href="#pricing" className="transition hover:text-text">
            가격
          </a>
          <a href="#faq" className="transition hover:text-text">
            FAQ
          </a>
          <a href="/blog" className="transition hover:text-text">
            블로그
          </a>
          <a href="/d" className="transition hover:text-text">
            내 검증 현황
          </a>
        </nav>
        <a
          href="/start"
          className="rounded-full bg-accent px-[18px] py-[10px] text-sm font-bold text-white transition hover:bg-accent-hover"
        >
          검증 신청
        </a>
      </div>
    </header>
  );
}

/* ─────────────  HERO — 좌 텍스트 + 우 창업자 인물 (모바일: 인물 배경)  ───────────── */
function Hero({ variant = "a" }: { variant?: HeroVariant }) {
  const headline = (
    <>
      한 달 갈아 넣은 내 강의,
      <br />
      오픈했는데 아무도 안 산다면?
    </>
  );
  const sub =
    "몇 달의 시간을 들여 ‘실패’를 확인하지 마세요. 비즈필터가 단 3일, 진짜 광고 데이터로 현재 강의 주제를 해당 가격으로 원하는 고객이 있는지 확인합니다.";

  const ctas = (
    <>
      <a
        href="/start"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
      >
        내 강의 검증 신청
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </a>
      <a
        href="#process"
        className="rounded-full border border-white/25 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white/50 sm:border-border-hover sm:bg-surface sm:text-text sm:hover:border-accent sm:hover:text-accent"
      >
        검증 과정 보기
      </a>
    </>
  );

  return (
    <section className="relative overflow-hidden">
      {/* ── 모바일: 어두운 배경 + 인물 풀블리드 + 텍스트 오버레이 ── */}
      <div className="relative isolate overflow-hidden sm:hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            background:
              "linear-gradient(160deg, #0a1730 0%, #122a4d 45%, #16233a 100%)",
          }}
        />
        <div className="px-6 pb-12 pt-16">
          <p className="text-sm font-bold" style={{ color: "#8FB6FF" }}>
            강의 수요 검증 전문
          </p>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.2] tracking-[-0.03em] text-white">
            {headline}
          </h1>
          <p className="mt-5 max-w-[20rem] text-[15px] leading-[1.65] text-white/80">
            {sub}
          </p>
          <div className="mt-7 flex flex-col gap-3">{ctas}</div>
          <p className="mt-6 text-xs font-medium text-white/55">
            광고비 별도 청구 없음 · 신청은 결제가 아닙니다 · 될지 안 될지 판정 보장
          </p>
        </div>
      </div>

      {/* ── 데스크탑/태블릿: 밝은 2단, 좌 텍스트 우 인물 ── */}
      <div className="mx-auto hidden max-w-3xl px-6 pb-8 pt-16 sm:block lg:pt-24">
        <div className="reveal-stagger">
          <Label>강의 수요 검증 전문</Label>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.16] tracking-[-0.035em] text-text lg:text-[56px]">
            {headline}
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-[1.7] text-text-secondary">
            {sub}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">{ctas}</div>
          <p className="mt-7 text-sm font-medium text-text-tertiary">
            광고비 별도 청구 없음 · 신청은 결제가 아닙니다 · 될지 안 될지 판정 보장
          </p>
        </div>
      </div>
    </section>
  );
}

/* 브라우저 프레임 공통 */
/* ─────────────  STATEMENT — 토스식 단독 선언 섹션  ───────────── */
/* ─────────────  공감 스토리 — "이거 내 얘기네" 한 컷 (캐주얼 목소리)  ───────────── */
function PainStory() {
  const beats: { text: string; crash?: boolean }[] = [
    { text: "한 달 꼬박 갈아넣어 만든 내 강의·전자책, 드디어 완성! 🎉" },
    { text: "이제 홍보만 하면 되겠지? 😎" },
    { text: "…엥? 아무도 안 사 ㅠㅠ", crash: true },
  ];
  return (
    <section className="bg-bg-alt">
      <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
        <div className="space-y-3.5">
          {beats.map((b, i) => (
            <div
              key={i}
              className={`reveal flex ${b.crash ? "justify-center" : "justify-start"}`}
            >
              <span
                className={
                  b.crash
                    ? "rounded-2xl bg-text px-6 py-4 text-xl font-extrabold text-white sm:text-2xl"
                    : "rounded-2xl rounded-bl-md border border-border bg-surface px-5 py-3.5 text-base font-semibold text-text shadow-[0_6px_18px_-12px_rgba(10,23,38,0.25)] sm:text-lg"
                }
              >
                {b.text}
              </span>
            </div>
          ))}
        </div>
        <p className="reveal mt-12 text-center text-lg font-extrabold leading-[1.6] tracking-[-0.01em] text-text sm:text-[26px]">
          가장 흔하고, 가장 아픈 순간입니다.
          <br />
          <span className="text-accent">비즈필터는 만들기 전에, 팔릴지부터 확인합니다.</span>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────  PROCESS — 표본으로 판정, 3단계  ───────────────── */
function Process() {
  const steps = [
    {
      n: "1",
      d: "신청 당일",
      h: "라이브 시작",
      p: "공장형 템플릿이라 제작 대기가 없습니다. 검색 수요와 경쟁 강의를 조사하고, 실서비스 같은 수강신청 페이지를 신청 당일 바로 띄웁니다. 데이터를 보기 전에 합격선부터 함께 정합니다.",
    },
    {
      n: "2",
      d: "표본 찰 때까지",
      h: "광고 집행·측정",
      p: "구글 광고를 집행합니다. 문구 2~3종을 나눠 돌리고, 대시보드를 실시간으로 공유합니다. 광고비를 집중할수록 표본이 빨리 차서 판정도 그만큼 앞당겨집니다.",
    },
    {
      n: "3",
      d: "표본 충족 시점",
      h: "판정 리포트",
      p: "방문이 기준 표본(약 100~300명)을 채우면 그때 Go/No-Go 판정서를 보내드립니다. 숫자의 해석과 다음 액션까지 정리해 드립니다.",
    },
  ];
  return (
    <section id="process" className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Label>진행 방식</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            빠르면 2~3일이면 끝납니다
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            도구를 배우실 필요 없습니다. 페이지는 신청 당일 바로 라이브되고,
            판정은 날짜가 아니라 방문이 기준 표본을 채우는 시점에 합니다.
            광고비를 집중할수록 빨라져 보통 2~3일, 작은 예산이면 더 걸려도 최대 7일입니다.
          </p>
        </div>
        <div className="reveal-stagger mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-[20px] border border-border bg-surface p-8"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-bg-light text-base font-extrabold text-accent">
                  {s.n}
                </span>
                <span className="text-xs font-bold tracking-wide text-text-tertiary">
                  {s.d}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-text">{s.h}</h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-text-secondary">
                {s.p}
              </p>
            </div>
          ))}
        </div>
        <div className="reveal mx-auto mt-12 max-w-3xl rounded-[20px] border border-border bg-surface p-8 text-center">
          <p className="text-lg font-bold text-text">
            저희는 강의 제작을 팔지 않습니다.
          </p>
          <p className="mt-3 leading-[1.75] text-text-secondary">
            수요조사와 촬영·편집을 함께 파는 곳은 "찍으세요"라고 말할 금전적
            이유가 있습니다. 저희 수입은 판정의 정확도에서만 나옵니다. 그래서
            안 되는 주제에는 안 된다고 말씀드립니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────  CASES — 말 대신, 숫자  ───────────────── */
function Cases() {
  const samples = [
    {
      brand: "노션 자동화 클래스",
      sub: "직장인 업무 자동화 · 온라인 강의",
      explain:
        "강사가 커리큘럼·가격만 정해 ‘수강신청’ 랜딩을 먼저 띄우고, 영상 한 컷 녹화하기 전에 진짜 결제할 사람이 있는지부터 측정했습니다.",
      slug: "course-notion",
      stageBg: "linear-gradient(160deg,#f1ecfe,#e3d8fb)",
      stamp: "GO",
      color: verdict.go,
      bg: verdict.goBg,
      rows: [
        ["클릭률", "4.6%"],
        ["사전 수강신청", "128건"],
        ["1명 데려온 값", "₩2,100"],
      ],
      report: [
        { k: "수요", v: "클릭률 4.6%에 들어온 사람의 9%가 ‘수강신청’까지 갔습니다. ‘노션 자동화’는 검색·관심이 꾸준한 주제라 콜드 광고에도 진성 신청이 붙었습니다." },
        { k: "경쟁·대안", v: "유튜브 무료 강의가 많지만 ‘체계적 커리큘럼 + 실습 템플릿’엔 돈을 냅니다. 무료로는 안 되는 약속(끝까지 완성)이 차별점." },
        { k: "사업성", v: "수강료 89,000원, 수강신청 1건을 ₩2,100에 확보. 영상 한 컷 찍기 전에 손익이 보입니다 — GO면 그때 녹화 시작." },
      ],
      take: "GO — 수요 확인됐으니 이제 녹화. 검증에 쓴 랜딩·수강신청자 명단을 그대로 첫 수강생으로.",
    },
    {
      brand: "퇴근 후 영어회화",
      sub: "왕초보 탈출 · 온라인 클래스",
      explain:
        "20강 녹화 전에 ‘수강신청’ 랜딩을 띄워, 진짜 돈 내고 들을 사람이 있는지부터 광고로 측정했습니다.",
      slug: "course-english",
      stageBg: "linear-gradient(160deg,#e0f2fe,#c7e7fb)",
      stamp: "NO-GO",
      color: verdict.nogo,
      bg: verdict.nogoBg,
      rows: [
        ["클릭률", "1.1%"],
        ["사전 수강신청", "6건"],
        ["1명 데려온 값", "₩9,800"],
      ],
      report: [
        { k: "수요", v: "클릭률 1.1%에 수강신청 6건. 관심은 있어도 ‘돈 내고 들을’ 신호는 약했습니다 — 왕초보 영어는 콜드 광고로 결제 의향이 잘 안 붙습니다." },
        { k: "경쟁·대안", v: "유튜브·스픽·듀오링고 등 무료·저가 대안이 시장을 덮음. ‘또 하나의 왕초보 영어’는 차별점이 약함." },
        { k: "사업성", v: "수강료 59,000원에 1명 신청이 ₩9,800 — 신청 자체가 적어 광고를 키울수록 손해. 20강 녹화 전에 멈춰 몇 달을 아꼈습니다." },
      ],
      take: "NO-GO — 녹화 전에 멈춤. 같은 주제라면 무료 대안과 다른 약속(특정 직군·시험 전용 등)으로 좁혀 재검증.",
    },
    {
      brand: "비전공자 코딩 부트캠프",
      sub: "6주 라이브 · 고가 부트캠프",
      explain:
        "89만 원 부트캠프에 진짜 신청이 붙는지, ‘수강신청’ 랜딩으로 한 기수 모으기 전에 광고로 먼저 측정했습니다.",
      slug: "course-coding",
      stageBg: "linear-gradient(160deg,#ffedd5,#fed7aa)",
      stamp: "PIVOT",
      color: verdict.pivot,
      bg: verdict.pivotBg,
      rows: [
        ["클릭률", "3.9%"],
        ["사전 수강신청", "14건"],
        ["1명 데려온 값", "₩7,400"],
      ],
      report: [
        { k: "수요", v: "클릭률 3.9%로 관심은 강했습니다. 다만 89만 원 앞에서 결제까지는 14건 — 수요는 분명한데 가격 저항이 보입니다." },
        { k: "경쟁·대안", v: "유료 부트캠프·국비지원 무료 과정과 경쟁. ‘취업까지’ 약속이 차별점이나, 89만 원 일시불이 진입 문턱." },
        { k: "사업성", v: "수강료 89만 원이라 신청 1건의 가치가 큽니다(CAC ₩7,400). 전환율만 올리면 손익이 크게 벌어집니다." },
      ],
      take: "PIVOT — 수요는 있다. 가격·결제조건(분납·선취업후납)·기수 규모를 바꿔 저항을 낮추면 충분히 GO.",
    },
  ];
  return (
    <section id="cases" className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Label>사례</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            말 대신, 숫자
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            실서비스처럼 보이는 수강신청 페이지를 만들고, 진짜 광고비를 써서
            모르는 사람 수백 명을 데려온 뒤, <b className="font-semibold text-text">수요·경쟁·가격</b>까지
            분석해 Go/No-Go를 냅니다. 강의 3건의 갈린 결과를 그대로 보여드립니다.
          </p>
        </div>

        {/* 시연 사례 3종 — 큰 제품 목업 + 판정 (토스식 교차 행) */}
        <div className="mt-20 space-y-24 sm:space-y-32">
          {samples.map((c, i) => {
            const flip = i % 2 === 1;
            return (
              <div
                key={c.brand}
                className="reveal grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
              >
                {/* 제품 목업 — 이미지가 아니라 실제 JSX로 렌더(선명·반응형) */}
                <div className={flip ? "lg:order-2" : ""}>
                  <div
                    className="relative overflow-hidden rounded-[32px] px-6 py-12 sm:px-10 sm:py-16"
                    style={{ background: c.stageBg }}
                  >
                    <CaseVisual slug={c.slug} />
                  </div>
                </div>

                {/* 판정 + 숫자 */}
                <div className={flip ? "lg:order-1" : ""}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="rounded-full px-3.5 py-1.5 text-sm font-extrabold"
                      style={{ color: c.color, background: c.bg }}
                    >
                      {c.stamp}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-text-tertiary">
                      시연 사례
                    </span>
                  </div>
                  <h3 className="mt-5 text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-text sm:text-[38px]">
                    {c.brand}
                  </h3>
                  <p className="mt-2 text-[14px] font-semibold text-accent">
                    {c.sub}
                  </p>
                  <p className="mt-2.5 max-w-md text-[15px] leading-[1.7] text-text-secondary">
                    {c.explain}
                  </p>
                  <div className="mt-7 grid grid-cols-3 gap-3">
                    {c.rows.map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-[18px] bg-bg-alt px-4 py-4"
                      >
                        <p className="text-[11px] font-semibold text-text-tertiary">
                          {k}
                        </p>
                        <p className="mt-1.5 text-[22px] font-extrabold tracking-tight text-text">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* 검증 리포트 핵심 — 수요·경쟁·사업성·법적까지 (AI 검색으로 못 얻는 합성 분석) */}
                  <div className="mt-7 border-t border-border-light pt-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
                      검증 리포트에서 확인한 것
                    </p>
                    <dl className="mt-3.5 space-y-3">
                      {c.report.map((r) => (
                        <div
                          key={r.k}
                          className="grid grid-cols-[68px_1fr] gap-3 sm:grid-cols-[76px_1fr]"
                        >
                          <dt className="text-[12px] font-bold text-accent">
                            {r.k}
                          </dt>
                          <dd className="text-[13.5px] leading-[1.65] text-text-secondary">
                            {r.v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <p
                    className="mt-5 rounded-2xl px-4 py-3.5 text-[14px] font-semibold leading-[1.6] text-text"
                    style={{ background: c.bg }}
                  >
                    {c.take}
                  </p>
                  <a
                    href="/cases"
                    className="group mt-6 inline-flex items-center gap-1.5 text-[15px] font-bold text-accent"
                  >
                    판정 근거 자세히 보기
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-1"
                      strokeWidth={2.5}
                    />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        <p className="reveal mt-16 text-center text-[13px] text-text-tertiary">
          위 3건은 비즈필터가 <b className="font-semibold text-text-secondary">어떻게 검증하고 판정이 어떻게 나오는지</b> 보여주는 시연 사례입니다. ‘수강신청 클릭’은 수강신청 버튼을 누른 수일 뿐 실제 결제는 받지 않으며, 실제 수강 검증 사례는 동의를 받아 순차적으로 공개합니다.
        </p>

        {/* 사후 진단 — 실제 사례 (득템잡이): 광고조차 막힌 NO-GO라 맨 아래 배치 */}
        <div className="reveal mt-20 grid items-center gap-10 sm:mt-28 lg:grid-cols-2 lg:gap-20">
          {/* 제품 목업 */}
          <div className="lg:order-2">
            <div
              className="relative overflow-hidden rounded-[32px] px-6 py-12 sm:px-10 sm:py-16"
              style={{ background: "linear-gradient(160deg,#eef2fb,#dbe5f7)" }}
            >
              <CaseVisual slug="resale" />
            </div>
          </div>
          {/* 내용 */}
          <div className="lg:order-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-full px-3.5 py-1.5 text-sm font-extrabold"
                style={{ color: verdict.nogo, background: verdict.nogoBg }}
              >
                NO-GO
              </span>
              <span className="rounded-full bg-text px-3 py-1 text-xs font-extrabold text-bg">
                사후 진단 · 실제 사례
              </span>
            </div>
            <h3 className="mt-5 text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-text sm:text-[38px]">
              득템잡이
            </h3>
            <p className="mt-2 text-[14px] font-semibold text-accent">
              당근·번개·중고나라에서 시세보다 싼 매물을 찾아주는 중고 시세 차익 분석
            </p>
            <p className="mt-2.5 max-w-md text-[15px] leading-[1.7] text-text-secondary">
              <b className="font-semibold text-text">한 달 동안 혼자 다 만들어</b> 출시한 뒤에야
              비즈필터를 찾아왔습니다. 그제야 광고 자체가 막히고(중고 거래·시세
              비교는 플랫폼 광고 정책에 걸립니다), 결제 전환도 안 되고 시장도 이미
              포화라는 걸 알게 됐습니다.{" "}
              <b className="font-semibold text-text">검증을 먼저 받았다면 한 달이 아니라 며칠 만에</b>,
              광고비 몇만 원으로 똑같은 답을 받았을 겁니다. 그게 검증의 목적입니다.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["관심 (클릭)", "높음", false],
                ["결제까지", "막힘", true],
                ["광고 승인", "제한", true],
                ["경쟁 상태", "포화", true],
              ].map(([k, v, bad]) => (
                <div key={k as string} className="rounded-[18px] bg-bg-alt px-4 py-3.5">
                  <p className="text-[11px] font-semibold text-text-tertiary">{k}</p>
                  <p
                    className="mt-1 text-[18px] font-extrabold tracking-tight"
                    style={{ color: bad ? verdict.nogo : "var(--text)" }}
                  >
                    {v}
                  </p>
                </div>
              ))}
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
      tag: "엔진",
      price: "29만원",
      period: "당일 시작 · 보통 3~5일",
      desc: "수강신청 페이지를 직접 만들 수 있다면, 광고·측정·판정만 가져가세요.",
      lines: [
        "직접 만든 수강신청 페이지 점검: 수강신청 버튼까지 못 가게 막는 부분 + 클릭 자동 기록 설치",
        "광고 문구 2종 제작 + 구글 또는 메타 집행 (광고비 포함)",
        "합격선 사전 합의 + 라이브 대시보드 상시 공개",
        "될지 안 될지(Go/No-Go) 판정 리포트 + 다음에 할 일 제안",
        "재검증 30% 할인: 조건 바꿔 다시 돌리면 회당 약 20만원",
      ],
      cta: "엔진으로 시작",
      highlight: false,
      consult: false,
    },
    {
      tag: "QUICK 검증",
      price: "50만원",
      period: "당일 시작 · 보통 2~3일",
      desc: "아무도 원하지 않는 건 아닌지, 수요부터 확인합니다.",
      lines: [
        "실제 강의처럼 보이는 수강신청 페이지 제작 (종료 후 도메인·디자인 전부 고객 소유)",
        "미니 시장 리서치: 검색 수요·경쟁 강의·유사 강의 가격대 조사",
        "광고 문구 2~3종 제작 + 구글 광고 집행 · 기간 내 최적화 (광고비 포함)",
        "방문·클릭·수강신청 행동 자동 기록 (구글 애널리틱스)",
        "클릭 단가 · 수강생 획득 비용(CAC) 1차 측정",
        "실시간 진행 대시보드 + 될지 안 될지(Go/No-Go) 판정 리포트 + 다음에 할 일 권고",
        "판정 보장: 될지 안 될지 분명한 결론(Go/No-Go)을 못 드리면 전액 환불",
      ],
      cta: "Quick으로 시작",
      highlight: true,
      consult: false,
    },
    {
      tag: "DEEP 검증",
      price: "130만원",
      period: "당일 시작 · 광고 판정 1~2일",
      desc: "원하는데 돈이 안 되는 건 아닌지, 수강료와 손익까지 확인합니다. 광고비를 가장 많이 집행해 판정이 제일 빠른 플랜입니다.",
      lines: [
        "Quick 전체 포함",
        "수강료 2안 테스트: '얼마를 받아야 하는지'를 데이터로",
        "경쟁 강의 · 수익 모델 분석 리포트",
        "인스타·페이스북 광고 추가 (광고비 포함) + 콘텐츠 5~7개",
        "잠재 수강생 설문 + 인터뷰 5~10명 (Go/No-Go 판정 후 심층 진행)",
        "수강료(한 명이 내는 돈) · 수강생 1명 데려오는 값(CAC) · 평생 가치(LTV) · 손익 시뮬레이션",
        "판정 보장: 될지 안 될지 분명한 결론(Go/No-Go)을 못 드리면 전액 환불",
      ],
      cta: "카카오톡으로 상담 문의",
      highlight: false,
      consult: true,
    },
  ];
  return (
    <section id="pricing" className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Label>가격</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            검증 안 한 값이,
            <br />늘 더 비쌌습니다
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            엔진은 '수강신청 페이지가 이미 있는 분'을 위해, Quick은 '들을 사람이
            있는가'에, Deep은 '팔수록 남는가'에 답합니다.
          </p>
        </div>

        {/* 비용 비교 */}
        <div className="reveal mx-auto mt-14 grid max-w-4xl items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div
            className="rounded-[20px] p-7"
            style={{ background: verdict.nogoBg }}
          >
            <p className="text-sm font-bold" style={{ color: "#b5413a" }}>
              '일단 찍고 보기'의 평균 비용
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-text">
              몇 달 + 수백만 원
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              촬영·편집·외주비, 그리고 그 기간 전부의 기회비용.
            </p>
          </div>
          <p className="self-center text-center text-sm font-extrabold text-text-tertiary">
            VS
          </p>
          <div className="rounded-[20px] bg-bg-light p-7">
            <p className="text-sm font-bold text-accent">Quick 검증</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-text">
              보통 2~3일 · 50만원
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              검증 비용이 아니라, 몇 달짜리 오답에 대한 보험료입니다.
            </p>
          </div>
        </div>

        {/* 플랜 카드 */}
        <div className="reveal-stagger mt-8 grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.tag}
              className={`relative flex flex-col rounded-[24px] bg-surface p-9 ${
                t.highlight
                  ? "border-2 border-accent shadow-[0_30px_60px_-28px_rgba(16,42,86,0.32)]"
                  : "border border-border shadow-[0_2px_8px_rgba(10,23,38,0.04)]"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3.5 left-9 rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)]">
                  추천 시작점
                </span>
              )}
              <p className="text-sm font-extrabold tracking-wide text-accent">
                {t.tag}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-[42px] font-extrabold tracking-[-0.03em] text-text">
                  {t.price}
                </p>
                <p className="text-[15px] font-semibold text-text-tertiary">
                  / {t.period}
                </p>
              </div>
              <p className="mt-3 text-[15px] font-semibold leading-snug text-text-secondary">
                {t.desc}
              </p>
              {t.consult && (
                <p className="mt-2 text-[13px] font-semibold text-text-tertiary">
                  맞춤 상담형 · 결제 전 카카오톡으로 범위를 함께 정합니다
                </p>
              )}
              <ul className="mt-7 flex-1 space-y-3.5 text-[14px] leading-[1.55] text-text-secondary">
                {t.lines.map((l, i) => (
                  <li key={l} className="grid grid-cols-[auto_1fr] gap-3">
                    <span
                      className="mt-0.5 grid h-5 w-5 place-items-center rounded-full"
                      style={{
                        background:
                          i === t.lines.length - 1
                            ? verdict.goBg
                            : "var(--bg-light)",
                      }}
                    >
                      <Check
                        className="h-3 w-3"
                        strokeWidth={3.4}
                        style={{
                          color:
                            i === t.lines.length - 1
                              ? verdict.go
                              : "var(--accent)",
                        }}
                      />
                    </span>
                    <span
                      className={
                        i === t.lines.length - 1
                          ? "font-bold text-text"
                          : undefined
                      }
                    >
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={t.consult ? KAKAO_CHAT_URL : "/start"}
                target={t.consult ? "_blank" : undefined}
                rel={t.consult ? "noopener noreferrer" : undefined}
                className={`mt-8 block rounded-full py-4 text-center text-[15px] font-bold transition ${
                  t.highlight
                    ? "bg-accent text-white hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_14px_30px_-8px_var(--accent-glow)]"
                    : "bg-text text-bg hover:-translate-y-0.5"
                }`}
              >
                {t.cta} →
              </a>
            </div>
          ))}
        </div>
        <p className="reveal mx-auto mt-9 max-w-3xl text-center text-[13px] leading-relaxed text-text-tertiary">
          매출은 보장 못 합니다. 그건 누구도 못 합니다. 저희가 보장하는 건
          하나입니다. 광고를 실제로 돌리고, 그 데이터로 분명한 판정을 드리는
          것. 못 드리면 전액 환불입니다. 광고비는 실제 집행 비용이라
          제외됩니다.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────  GUARANTEE — No-Go가 나오면  ───────────────── */
function Guarantee() {
  const items = [
    "데이터 근거가 첨부된 No-Go 판정서",
    "제작한 수강신청 페이지 · 도메인 · 디자인, 전부 가져가세요",
    "왜 안 됐는지 분석: 수요·타겟·메시지·가격 중 무엇인지",
    "피벗 방향 제안 + 재검증 시 할인",
    "가장 큰 것: 들어갈 뻔했던 몇 달과 수백만 원이 그대로 남습니다",
  ];
  return (
    <section className="bg-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 sm:py-32 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="reveal flex justify-center">
          <div
            className="grid aspect-square w-[220px] place-items-center rounded-full border-2 border-dashed border-border-hover text-center"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, #fff, var(--bg-light))",
            }}
          >
            <div className="px-6">
              <p className="text-[13px] font-bold text-text-secondary">
                판정을 못 드리면
              </p>
              <p className="mt-1 text-[52px] font-black leading-none tracking-tight text-accent">
                100%
              </p>
              <p className="mt-1.5 text-[15px] font-extrabold text-accent-hover">
                전액 환불
              </p>
            </div>
          </div>
        </div>
        <div className="reveal">
          <Label>No-Go가 나오면</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            "하지 마세요"라는
            <br />
            결과가 나오면요?
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-[1.75] text-text-secondary">
            기분 좋은 소식은 아니지만, 손해는 아닙니다. 저희가 보장하는 건
            결과의 방향이 아니라{" "}
            <span className="font-bold text-text">답</span>입니다. 분명한
            판정을 못 드리면 전액 환불합니다. No-Go는 환불 사유가 아닙니다.
            그게 당신이 산 답이기 때문입니다.
          </p>
          <ul className="mt-8 space-y-3.5">
            {items.map((it) => (
              <li key={it} className="flex items-start gap-3">
                <span
                  className="mt-0.5 grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full"
                  style={{ background: verdict.goBg }}
                >
                  <Check
                    className="h-3 w-3"
                    strokeWidth={3.4}
                    style={{ color: verdict.go }}
                  />
                </span>
                <span className="leading-relaxed text-text-secondary">
                  {it}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-xs text-text-tertiary">
            ※ 광고비는 실제 집행 비용이라 환불 대상에서 제외됩니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  STORY  ───────────────────────── */
function Story() {
  const steps = [
    {
      n: "01",
      win: false,
      body: (
        <>
          <b className="font-bold text-text">아무도 원하지 않는다.</b> 수요가
          없는 강의는 마케팅으로도 살릴 수 없습니다.
        </>
      ),
    },
    {
      n: "02",
      win: false,
      body: (
        <>
          <b className="font-bold text-text">원하는데, 돈이 안 된다.</b> 수강생
          한 명을 데려오는 비용이 수강료보다 크면, 강의를 팔수록
          손해입니다.
        </>
      ),
    },
    {
      n: "03",
      win: true,
      body: (
        <>
          이 둘을 녹화 전에 확인하면,{" "}
          <b className="font-bold text-text">
            실패의 비용이 몇 달의 촬영·편집과 수백만 원에서 며칠과 광고비 몇만
            원으로 줄어듭니다.
          </b>
        </>
      ),
    },
  ];
  return (
    <section id="story" className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <div className="reveal text-center">
          <Label>왜 검증부터인가</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            강의가 안 팔리는 길은
            <br />
            둘뿐입니다
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.7] text-text-secondary">
            수백 가지 이유처럼 보여도 결국 둘 중 하나로 수렴합니다. 그리고 둘
            다, 녹화하기 전에 확인할 수 있습니다.
          </p>
        </div>
        <div className="reveal-stagger mt-12 space-y-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className={`grid grid-cols-[auto_1fr] items-start gap-5 rounded-[20px] p-7 ${
                s.win
                  ? "bg-bg-light"
                  : "border border-border bg-surface"
              }`}
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-[14px] text-base font-extrabold ${
                  s.win ? "bg-accent text-white" : "bg-bg-alt text-text-tertiary"
                }`}
              >
                {s.n}
              </span>
              <p className="text-[17px] leading-[1.65] text-text-secondary">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  TEAM  ───────────────────────── */
function Team() {
  const members = [
    {
      name: "이민제",
      photo: "/team/lee-minje.png",
      title: "CEO · Founder",
      role: "비즈니스 모델 전략 수립 및 사업 총괄",
      edu: "중앙대 산업보안학과 · 사업 3회 직접 운영",
    },
    {
      name: "김지아",
      photo: "/team/kim-jia.png",
      title: "Marketing & PR Lead",
      role: "시장 분석 및 서비스 브랜딩, 홍보 전략",
      edu: "중앙대 광고홍보학과 · 광고 집행/운영",
    },
    {
      name: "문준하",
      photo: "/team/moon-junha.png",
      title: "Product Manager · Developer",
      role: "웹/앱 서비스 기획 및 데이터 기반 검증 시스템 구축",
      edu: "중앙대 소프트웨어학과 · 검증 시스템 구축",
    },
  ];
  return (
    <section id="team" className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Label>팀</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            검증을 맡는 사람들
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            실명과 소속을 공개합니다. 검증 과정의 광고 계정과 데이터도
            그대로 보여드립니다.
          </p>
        </div>
        <div className="reveal-stagger mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.name}
              className="rounded-[20px] border border-border bg-surface p-8 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photo}
                alt={`${m.name} · ${m.title}`}
                className="mx-auto h-28 w-28 rounded-full object-cover object-top"
              />
              <p className="mt-5 text-xl font-extrabold text-text">{m.name}</p>
              <p className="mt-1 text-[13px] font-bold text-accent">
                {m.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {m.role}
              </p>
              {m.edu && (
                <p className="mt-3 border-t border-border-light pt-3 text-xs text-text-tertiary">
                  {m.edu}
                </p>
              )}
            </div>
          ))}
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
      a: "가능합니다. 다만 광고 도구를 익히는 데 2~4주, 시행착오 광고비가 별도로 듭니다. 그리고 더 큰 문제는 객관성입니다. 자기 강의를 자기가 검증하면 카피를 유리하게 쓰고 숫자도 유리하게 읽게 되거든요. 객관적인 건 나를 전혀 모르는 사람의 클릭뿐입니다.",
    },
    {
      q: "클래스101 수요조사나 사전알림이랑 뭐가 다른가요?",
      a: "방향은 같지만 재는 게 다릅니다. 클래스101의 '응원하기'나 사전알림 신청은 전부 공짜 클릭이라 누르기 쉽거든요. 관심은 보여줘도 '돈 내고 들을 사람'까지는 가려내지 못합니다. 저희는 실제 광고비를 써서 모르는 사람을 데려오고, 수강료를 보여준 뒤의 '수강신청'(결제 의향)까지 잽니다. 특정 플랫폼에 묶이지도 않아서, 클래스101에 입점하든 자사몰로 팔든 그 전에 미리 확인하는 용도로 쓰시면 됩니다. 무료 응원과 지갑은 다릅니다.",
    },
    {
      q: "그냥 강의 몇 개 찍어서 유튜브에 올려보면 되지 않나요?",
      a: "무료 영상의 조회수와 '돈 내고 들을 사람'은 다른 신호입니다. 무료는 잘 봐도 유료로 가면 빠지거든요. 게다가 영상을 다 찍어 올리는 데만 몇 주가 들고, 내가 만든 것에 애착이 생겨 숫자를 유리하게 읽게 됩니다. 찍기 전 며칠이 더 빠르고 정직합니다. Go가 나오면 검증에 쓴 수강신청 페이지와 데이터를 그대로 가져가 그때 녹화하시면 됩니다.",
    },
    {
      q: "표본이 작은데 믿을 수 있나요?",
      a: "저희는 기간이 아니라 표본으로 판정합니다. 며칠 만에 끝나도, 광고로 데려온 방문이 기준 표본(약 100~300명)을 채운 뒤에 판정하거든요. 그렇게 모은 신호가 주는 건 '확신'이 아니라 '신호'입니다. 특히 부정 신호는 강력합니다. 광고비를 썼는데 표본이 다 차도록 아무도 수강신청을 누르지 않았다면 그건 통계 문제가 아니라 현실입니다. 애매한 회색지대가 나오면 그때 Deep으로 정밀 측정을 권합니다.",
    },
    {
      q: "더 빨리는 안 되나요?",
      a: "됩니다. 페이지는 공장형 템플릿이라 신청 당일 바로 라이브되고, 판정은 방문이 기준 표본을 채우는 시점에 합니다. 그래서 '예산 = 속도'예요. 광고비를 집중해 표본을 빨리 채우면 1~2일도 가능하고, 작은 예산이면 표본이 천천히 차서 더 걸려도 최대 7일입니다. 보통은 2~3일에 끝납니다.",
    },
    {
      q: "광고비는 별도인가요?",
      a: "아니요, 광고비까지 가격에 포함돼 있습니다. 추가로 내실 돈은 없습니다. 실제 집행되는 광고비는 집행 영수증을 그대로 공유드리며, 이미 집행된 광고비는 환불 대상에서 제외됩니다.",
    },
    {
      q: "환불 기준이 정확히 뭔가요?",
      a: "저희가 보장하는 건 결과의 방향이 아니라 '분명한 판정'입니다. 광고를 집행하고 그 데이터에 근거한 Go/No-Go 판정을 드리지 못하면 검증비 전액을 환불합니다. No-Go 판정 자체는 환불 사유가 아닙니다. 그게 검증이 납품하는 답이기 때문입니다.",
    },
    {
      q: "제 강의 주제나 커리큘럼을 가져가면 어떡하죠?",
      a: "신청 내용은 검증 목적 외에 사용하지 않습니다(이용약관 제7조 비밀유지 조항). 검증 산출물(수강신청 페이지·도메인·데이터)은 종료 후 전부 고객 자산으로 이관되며, 저희는 어떤 권리도 갖지 않습니다. 저희는 검증을 파는 회사지, 남의 강의로 돈 버는 회사가 아닙니다.",
    },
    {
      q: "잠재 수강생을 속이는 건 아닌가요?",
      a: "'수강신청'을 누른 분에게는 '오픈 준비 중인 강의이며, 열리면 가장 먼저 안내드린다'는 사전알림 화면이 나옵니다. 돈은 받지 않습니다. 그분들은 강의를 여는 날 당신의 첫 수강생 명단이 됩니다.",
    },
    {
      q: "어떤 강의든 가능한가요?",
      a: "온라인 VOD·라이브 클래스, 전자책·PDF, 코칭·컨설팅, 오프라인 강의·워크숍까지 폭넓게 됩니다. 다만 오프라인·지역 기반 강의는 검증 설계가 달라집니다(지역 타겟 광고 + 사전 예약 측정). 신청하시면 그에 맞춘 검증 설계서를 그 자리에서 바로 확인하실 수 있습니다.",
    },
    {
      q: "검증용 수강신청 페이지면, 진짜 강의 사이트도 만들어 주시나요?",
      a: "구분이 필요합니다. 검증용 페이지는 광고 반응을 측정하기 위한 실서비스형 한 장 페이지이며, 결제·수강 관리 기능이 들어가는 정식 강의 사이트(자사몰)와는 다릅니다. 종료 후 전부 이관해드리므로 그 위에 키워가실 수 있고, 자사몰·결제 연동이 필요하시면 라이브클래스 같은 도구나 제작 파트너를 연결해드립니다.",
    },
    {
      q: "Go가 나오면, 강의 촬영·편집까지 해주시나요?",
      a: "저희는 검증 전문이라 촬영·편집을 직접 팔지는 않습니다. 다만 영상 제작을 직접 해온 팀이라, 원하시면 믿을 만한 제작 파트너를 연결해드립니다. 제작을 팔지 않기 때문에 저희 판정에는 '찍게 만들려는' 이해관계가 없습니다.",
    },
    {
      q: "신청하면 바로 결제인가요?",
      a: "아닙니다. 강의 주제를 입력하시면 그 자리에서 무료 검증 설계서와 적합한 플랜을 바로 확인하실 수 있습니다. 결제는 검증 내용을 직접 확인하고 동의하신 뒤에만 진행됩니다.",
    },
  ];
  return (
    <section id="faq" className="border-t border-border bg-bg">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <div className="reveal text-center">
          <Label>FAQ</Label>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-0.03em] text-text sm:text-5xl">
            자주 묻는 질문
          </h2>
        </div>
        <div className="reveal mt-12 border-t border-border">
          {qa.map((it) => (
            <details key={it.q} className="group border-b border-border">
              <summary className="flex cursor-pointer items-center justify-between gap-5 py-6 text-[17px] font-bold text-text [&::-webkit-details-marker]:hidden">
                <span>{it.q}</span>
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-bg-alt text-text-secondary transition group-open:rotate-45 group-open:bg-accent group-open:text-white">
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-7 leading-[1.75] text-text-secondary">
                {it.a}
              </p>
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
    <section id="cta" className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="section-dark relative overflow-hidden rounded-[28px] px-7 py-14 sm:px-14 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 80% at 85% 10%, rgba(43,107,244,.35), transparent 60%)",
            }}
          />
          <div className="reveal relative mx-auto max-w-2xl text-center">
            <p className="text-[15px] font-bold" style={{ color: "#8FB6FF" }}>
              지금 시작
            </p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-[40px]">
              어차피 알게 될 답,
              <br />
              녹화 전에 확인하세요
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg leading-[1.7] text-text-secondary">
              강의 주제 한 줄이면 시작됩니다. 광고 채널과 합격선이 담긴 검증
              설계서를 그 자리에서 무료로 받아보세요.
            </p>
            <a
              href="/start"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              내 강의 검증 신청
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </a>
            <p className="mt-5 text-sm font-medium text-text-tertiary">
              신청은 결제가 아닙니다 · 설계서 무료 · 비밀유지 약속
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FOOTER  ───────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border bg-bg-alt text-text-tertiary">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <a href="/" className="flex items-center gap-2.5 text-lg">
              <BrandMark />
              <Wordmark />
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              강의 수요 검증 전문.
              <br />
              녹화하기 전에,{" "}
              <span className="text-text-secondary">
                진짜 수강 의향 데이터
              </span>
              로 답합니다.
            </p>
            <p className="mt-6 text-xs">
              중앙대학교 산업보안학과 + 광고홍보학과 팀.
            </p>
          </div>
          <div className="sm:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-widest">
              메뉴
            </p>
            <ul className="mt-4 space-y-2.5 text-sm font-medium text-text-secondary">
              <li>
                <a href="#process" className="hover:text-accent">
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
                  왜 검증인가
                </a>
              </li>
              <li>
                <a href="/cases" className="hover:text-accent">
                  검증 사례
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
                <a href="/start" className="hover:text-accent">
                  검증 신청
                </a>
              </li>
            </ul>
          </div>
          <div className="sm:col-span-4">
            <p className="text-xs font-extrabold uppercase tracking-widest">
              연락
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                카카오톡 ·{" "}
                <a
                  href="https://pf.kakao.com/_xiCvnX/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-text-secondary hover:text-accent"
                >
                  @비즈필터 채널 상담
                </a>
              </li>
              <li>
                이메일 ·{" "}
                <a
                  href="mailto:mj12270411@gmail.com"
                  className="font-medium text-text-secondary hover:text-accent"
                >
                  mj12270411@gmail.com
                </a>
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
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-[13px] sm:flex-row sm:items-center">
          <p>© 2026 비즈필터 · 대표 이민제 · 문의 mj12270411@gmail.com</p>
          <div className="flex gap-5">
            <a href="/terms" className="hover:text-accent">
              이용약관
            </a>
            <a href="/privacy" className="hover:text-accent">
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
