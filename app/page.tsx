import ScrollReveal from "@/components/ScrollReveal";
import { ArrowRight, Check } from "lucide-react";
import { BrandMark, Wordmark } from "@/components/Brand";

/* 판정 컬러 시스템 — GO/NO-GO/PIVOT */
const verdict = {
  go: "#06A86B",
  goBg: "#E4F7EF",
  nogo: "#E8453C",
  nogoBg: "#FCEBE9",
  pivot: "#E08A00",
  pivotBg: "#FBF1DE",
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
      <Statement />
      <TourFakeDoor />
      <TourAds />
      <TourDashboard />
      <TourVerdict />
      <Process />
      <Cases />
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
        <a href="#" className="flex items-center gap-2.5 text-[19px]">
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
  const headline =
    variant === "a" ? (
      <>
        이 사업이 될지 안 될지,
        <br />
        진짜 사람들로 확인합니다
      </>
    ) : (
      <>
        지인 칭찬 말고,
        <br />낯선 사람의 클릭으로
      </>
    );
  const sub =
    variant === "a"
      ? "실제 서비스처럼 보이는 페이지에 진짜 광고비를 써서, 당신을 모르는 사람 수백 명을 보통 48시간 안에 불러옵니다. 클릭과 결제 버튼(실제 결제는 없습니다)을 숫자로 보여드립니다."
      : "당신 아이디어로 진짜 광고를 돌려 모르는 사람 수백 명을 보통 48시간 안에 불러옵니다. 클릭률과 결제 의향(실제 결제는 없습니다)을 재서 답합니다.";

  const ctas = (
    <>
      <a
        href="/start"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
      >
        내 아이디어 검증 신청
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </a>
      <a
        href="#process"
        className="rounded-full border border-white/25 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white/50 sm:border-border-hover sm:bg-surface sm:text-text sm:hover:border-accent sm:hover:text-accent"
      >
        7일 과정 보기
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/team/founders.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-12 bottom-0 -z-10 h-[72%] w-auto object-contain opacity-90"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,27,52,.2) 0%, rgba(12,27,52,.55) 55%, rgba(12,27,52,.9) 100%)",
          }}
        />
        <div className="px-6 pb-12 pt-16">
          <p className="text-sm font-bold" style={{ color: "#8FB6FF" }}>
            사업 아이디어 검증
          </p>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.2] tracking-[-0.03em] text-white">
            {headline}
          </h1>
          <p className="mt-5 max-w-[20rem] text-[15px] leading-[1.65] text-white/80">
            {sub}
          </p>
          <div className="mt-7 flex flex-col gap-3">{ctas}</div>
          <p className="mt-6 text-xs font-medium text-white/55">
            광고비는 비즈필터가 부담 · 신청은 결제가 아닙니다 · 판정 보장
          </p>
        </div>
      </div>

      {/* ── 데스크탑/태블릿: 밝은 2단, 좌 텍스트 우 인물 ── */}
      <div className="mx-auto hidden max-w-6xl items-center gap-8 px-6 pb-8 pt-16 sm:grid sm:grid-cols-2 lg:gap-12 lg:pt-24">
        <div className="reveal-stagger">
          <Label>사업 아이디어 검증</Label>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.16] tracking-[-0.035em] text-text lg:text-[56px]">
            {headline}
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-[1.7] text-text-secondary">
            {sub}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">{ctas}</div>
          <p className="mt-7 text-sm font-medium text-text-tertiary">
            광고비는 비즈필터가 부담 · 신청은 결제가 아닙니다 · Go/No-Go 판정 보장
          </p>
        </div>
        <div className="reveal relative flex items-end justify-center self-stretch">
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 -z-10 h-[78%] w-[88%] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, var(--accent-glow), transparent)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team/founders.png"
            alt="비즈필터 창업자"
            className="relative max-h-[540px] w-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}

/* 브라우저 프레임 공통 */
function Browser({
  url,
  children,
  className = "",
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_8px_24px_-8px_rgba(10,23,38,0.08),0_36px_80px_-32px_rgba(16,42,86,0.25)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border-light bg-bg px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 flex-1 truncate rounded-md bg-bg-alt px-3 py-1 text-left text-xs text-text-tertiary">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

function HeroShot() {
  const days = [
    ["월", 34],
    ["화", 52],
    ["수", 41],
    ["목", 66],
    ["금", 58],
    ["토", 80],
    ["일", 96],
  ] as const;
  return (
    <Browser url="bizfilter.kr/dashboard/salady-club">
      <div className="grid gap-0 bg-surface text-left lg:grid-cols-[1.4fr_1fr]">
        {/* 대시보드 */}
        <div className="border-b border-border-light p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-text-tertiary">
                라이브 대시보드
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-text">
                주 3회 새벽배송 샐러드 구독
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-bg-alt px-3 py-1.5 text-xs font-bold text-text-secondary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#06A86B]" />
              집행 5일차
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["노출", "12,420", ""],
              ["클릭", "398", "CTR 3.2%"],
              ["결제 클릭", "13", "3.3%"],
              ["CAC", "₩3,846", "고객 1명당"],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-[14px] bg-bg-alt px-4 py-3.5">
                <p className="text-xs font-semibold text-text-tertiary">{k}</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-text">
                  {v}
                </p>
                {s && (
                  <p className="mt-0.5 text-[11px] font-medium text-text-tertiary">
                    {s}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex h-28 items-end gap-2.5">
            {days.map(([d, h]) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-[6px]"
                  style={{
                    height: `${h}%`,
                    background:
                      h >= 80 ? "var(--accent)" : "var(--bg-light)",
                  }}
                />
                <span className="text-[11px] font-medium text-text-tertiary">
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* 판정서 */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-tertiary">
              검증 판정서 · 7일차
            </p>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-text-tertiary">
              SAMPLE
            </span>
          </div>
          <div
            className="mt-5 flex items-center gap-3 rounded-[14px] px-5 py-4"
            style={{ background: verdict.goBg }}
          >
            <span
              className="flex items-center gap-2 text-2xl font-black"
              style={{ color: verdict.go }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: verdict.go }}
              />
              GO
            </span>
            <span
              className="border-l pl-3 text-[13px] font-semibold leading-tight"
              style={{ borderColor: "rgba(6,168,107,.3)", color: "#2f7a5d" }}
            >
              합격선 통과
              <br />
              다음 단계 권고
            </span>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-tertiary">
                사전 합격선
              </span>
              <span className="font-bold text-text">결제 클릭률 3.0%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-text-tertiary">실측</span>
              <span className="font-bold" style={{ color: verdict.go }}>
                3.3%
              </span>
            </div>
            <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-bg-alt">
              <div
                className="h-full rounded-full"
                style={{ width: "84%", background: verdict.go }}
              />
              <span className="absolute bottom-0 left-[76%] top-0 w-[2px] bg-text/70" />
            </div>
          </div>
          <div className="mt-5 border-t border-dashed border-border pt-4">
            <p className="text-[11px] font-semibold text-text-tertiary">
              리포트 포함
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "시장 수요 분석",
                "경쟁·가격대 조사",
                "CAC 분석",
                "다음 액션 권고",
              ].map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-bg-alt px-2.5 py-1 text-[11px] font-semibold text-text-secondary"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-text-tertiary">
              사전등록 31명은 오픈일 첫 고객 명단으로 이관됩니다.
            </p>
          </div>
        </div>
      </div>
    </Browser>
  );
}

/* ─────────────  STATEMENT — 토스식 단독 선언 섹션  ───────────── */
function Statement() {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center sm:py-36">
        <p className="reveal text-2xl font-extrabold leading-[1.6] tracking-[-0.02em] text-text sm:text-[34px]">
          아이디어가 좋다는 말은
          <br />
          어디서든 들을 수 있습니다.
          <br />
          <span className="text-text-tertiary">
            돈을 내는 사람이 있는지는, 다른 문제입니다.
          </span>
        </p>
        <p className="reveal mt-10 text-lg font-medium text-text-secondary sm:text-xl">
          비즈필터는 그걸 만들기 전에 확인합니다.
        </p>
      </div>
    </section>
  );
}

/* ─────────────  PRODUCT TOUR — 한 화면, 한 메시지, 한 목업  ───────────── */
function TourRow({
  label,
  title,
  body,
  shot,
  flip = false,
}: {
  label: string;
  title: React.ReactNode;
  body: React.ReactNode;
  shot: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="overflow-hidden bg-bg">
      <div
        className={`mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20`}
      >
        <div className={`reveal ${flip ? "lg:order-2" : ""}`}>
          <Label>{label}</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.22] tracking-[-0.03em] text-text sm:text-[42px]">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-[1.75] text-text-secondary">
            {body}
          </p>
        </div>
        <div className={`reveal ${flip ? "lg:order-1" : ""}`}>{shot}</div>
      </div>
    </section>
  );
}

function TourFakeDoor() {
  return (
    <TourRow
      label="검증용 사이트"
      title={
        <>
          진짜 서비스처럼 보이는
          <br />
          페이지를 띄웁니다
        </>
      }
      body={
        <>
          저희가 당신의 아이디어를, 이미 운영 중인 것처럼 보이는 사이트로
          만듭니다. 판매 가격까지 그대로 보여줍니다. 방문자가 진짜라고 믿어야
          진짜 반응이 나오기 때문입니다. 방문자가 결제 버튼을 누르면 '오픈
          예정' 사전등록 안내가 나옵니다. 방문자에게 돈을 받는 일은 없습니다.
        </>
      }
      shot={
        <Browser url="salady-club.kr">
          <div className="bg-surface p-6 text-left sm:p-8">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[15px] font-extrabold text-text">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-[#06A86B] text-[10px] font-black text-white">
                  S
                </span>
                샐러디클럽
              </span>
              <span className="hidden items-center gap-4 text-xs font-semibold text-text-tertiary sm:flex">
                <span>구성</span>
                <span>후기</span>
                <span>가격</span>
                <span className="rounded-full bg-[#06A86B] px-3 py-1.5 font-bold text-white">
                  구독하기
                </span>
              </span>
            </div>
            <p className="mt-7 text-[25px] font-extrabold leading-[1.25] tracking-tight text-text">
              주 3회 새벽배송,
              <br />
              샐러드 정기구독
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
              월·수·금 아침 7시 전 문 앞에. 식단 고민 없이 받아보세요.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
              <span style={{ color: "#E08A00" }}>★ 4.9</span>
              <span className="text-text-tertiary">· 후기 132개</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["월요일", "리코타 베리", "linear-gradient(140deg,#DFF3E6,#BCE5CB)"],
                ["수요일", "케일 치킨", "linear-gradient(140deg,#E8F3DC,#CDE7B8)"],
                ["금요일", "콥 샐러드", "linear-gradient(140deg,#F3EFD9,#E4DCAE)"],
              ].map(([d, n, g]) => (
                <div
                  key={d as string}
                  className="overflow-hidden rounded-[12px] border border-border-light"
                >
                  <div className="h-12" style={{ background: g as string }} />
                  <div className="px-2.5 py-2">
                    <p className="text-[10px] font-semibold text-text-tertiary">
                      {d}
                    </p>
                    <p className="text-[11px] font-bold text-text">{n}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-[14px] bg-bg-alt px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold text-text-tertiary">
                  주당 구독료 · 배송비 포함
                </p>
                <p className="text-xl font-black tracking-tight text-text">
                  ₩29,000
                </p>
              </div>
              <span className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-white">
                구독 시작하기
              </span>
            </div>
            <p className="mt-3 text-[11px] text-text-tertiary">
              ↑ 이 버튼이 결제 의향 측정 지점입니다
            </p>
          </div>
        </Browser>
      }
    />
  );
}

function TourAds() {
  return (
    <TourRow
      flip
      label="진짜 광고"
      title={
        <>
          당신을 모르는 사람들에게
          <br />
          광고를 보여줍니다
        </>
      }
      body={
        <>
          지인의 칭찬은 수요가 아닙니다. 구글 광고로 전혀 모르는 잠재고객을
          데려옵니다. 문구는 2~3가지로 나눠 집행합니다. 반응이 없으면
          아이디어가 문제인지 문구가 문제인지까지 가려내기 위해서입니다.
        </>
      }
      shot={
        <div className="space-y-3">
          <div className="rounded-[18px] border border-border bg-surface p-5 shadow-[0_8px_24px_-12px_rgba(10,23,38,0.10)]">
            <div className="flex items-center gap-3 rounded-full border border-border bg-bg px-5 py-3">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-text-tertiary">
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                />
              </svg>
              <span className="text-sm font-medium text-text-secondary">
                직장인 샐러드 배송
              </span>
            </div>
          </div>
          {[
            {
              head: "주 3회 새벽배송 샐러드 | 아침 7시 전 문 앞 도착",
              hot: true,
              ctr: "CTR 3.8%",
            },
            {
              head: "식단 고민 끝, 샐러드 정기구독 | 첫 주 구성 보기",
              hot: false,
              ctr: "CTR 2.1%",
            },
          ].map((ad) => (
            <div
              key={ad.head}
              className={`rounded-[18px] border bg-surface p-5 text-left shadow-[0_8px_24px_-12px_rgba(10,23,38,0.10)] ${
                ad.hot ? "border-border-hover" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-text">
                  스폰서 ·{" "}
                  <span className="font-medium text-text-tertiary">
                    salady-club.kr
                  </span>
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    ad.hot ? "text-accent" : "text-text-tertiary"
                  }`}
                  style={{
                    background: ad.hot ? "var(--bg-light)" : "var(--bg-alt)",
                  }}
                >
                  {ad.ctr}
                </span>
              </div>
              <p className="mt-2 text-[15px] font-semibold leading-snug text-accent">
                {ad.head}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                월·수·금 새벽 도착. 주 ₩29,000. 이번 주 구성을 확인해
                보세요.
              </p>
            </div>
          ))}
        </div>
      }
    />
  );
}

function TourDashboard() {
  return (
    <TourRow
      label="라이브 대시보드"
      title={
        <>
          노출부터 결제 클릭까지,
          <br />
          실시간으로 같이 봅니다
        </>
      }
      body={
        <>
          광고 계정 화면을 같은 링크로 함께 봅니다. 노출·클릭·결제 클릭이
          쌓이는 과정을 숨기는 것 없이 그대로 공개합니다. 클릭은 약한
          신호입니다. 저희는 가격을 본 뒤의 결제 클릭까지 측정합니다.
        </>
      }
      shot={
        <div className="rounded-[18px] border border-border bg-surface p-6 shadow-[0_8px_24px_-8px_rgba(10,23,38,0.08),0_36px_80px_-32px_rgba(16,42,86,0.22)] sm:p-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text">신호 강도</p>
            <span className="text-xs font-medium text-text-tertiary">
              5일차 누적
            </span>
          </div>
          <div className="mt-6 space-y-5">
            {[
              { k: "클릭", v: "398", w: "100%", weak: true, sub: "약한 신호" },
              { k: "문의", v: "27", w: "38%", weak: true, sub: "중간 신호" },
              {
                k: "결제 클릭",
                v: "13",
                w: "16%",
                weak: false,
                sub: "끝까지 보는 것",
              },
            ].map((r) => (
              <div key={r.k}>
                <div className="flex items-baseline justify-between text-sm">
                  <span
                    className={`font-bold ${r.weak ? "text-text-secondary" : "text-text"}`}
                  >
                    {r.k}{" "}
                    <span className="ml-1 text-xs font-medium text-text-tertiary">
                      {r.sub}
                    </span>
                  </span>
                  <span
                    className={`text-lg font-extrabold tracking-tight ${r.weak ? "text-text-secondary" : "text-accent"}`}
                  >
                    {r.v}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-bg-alt">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: r.w,
                      background: r.weak
                        ? "var(--border-hover)"
                        : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-[14px] bg-bg-alt px-5 py-4 text-[13px] leading-relaxed text-text-secondary">
            수요가 있어도 단가가 안 맞으면 만들수록 손해입니다. 고객 1명을
            데려오는 비용(CAC)까지 같이 잽니다.
          </p>
        </div>
      }
    />
  );
}

function TourVerdict() {
  return (
    <TourRow
      flip
      label="판정"
      title={
        <>
          7일 뒤, Go / No-Go
          <br />
          판정서를 받습니다
        </>
      }
      body={
        <>
          Go는 진행, No-Go는 중단, Pivot은 방향 수정입니다. 숫자만 던지지
          않습니다. 합격선 대비 어디인지, 시장·경쟁 조사에서 무엇이
          보였는지, 다음 액션은 무엇인지까지 판정 리포트에 담아 드립니다.
        </>
      }
      shot={
        <div className="space-y-3">
          {[
            {
              stamp: "GO",
              c: verdict.go,
              bg: verdict.goBg,
              t: "수요와 단가 모두 합격선을 넘었습니다. 진행할 근거가 확인됐습니다.",
            },
            {
              stamp: "PIVOT",
              c: verdict.pivot,
              bg: verdict.pivotBg,
              t: "수요는 강하지만 이 가격은 아닙니다. 조건을 바꿔 다시 확인할 가치가 있습니다.",
            },
            {
              stamp: "NO-GO",
              c: verdict.nogo,
              bg: verdict.nogoBg,
              t: "결제 의향이 확인되지 않았습니다. 시작 전에 멈춰 몇 달과 수백만 원을 아낀 결과입니다.",
            },
          ].map((v) => (
            <div
              key={v.stamp}
              className="flex items-center gap-5 rounded-[18px] border border-border bg-surface p-5 shadow-[0_8px_24px_-12px_rgba(10,23,38,0.08)]"
            >
              <span
                className="w-[92px] flex-shrink-0 rounded-full py-2.5 text-center text-sm font-black"
                style={{ color: v.c, background: v.bg }}
              >
                {v.stamp}
              </span>
              <p className="text-[14px] leading-relaxed text-text-secondary">
                {v.t}
              </p>
            </div>
          ))}
          <p className="pt-1 text-xs text-text-tertiary">
            세 가지 중 하나를, 데이터 근거와 함께 분명하게 드립니다.
          </p>
        </div>
      }
    />
  );
}

/* ─────────────────  PROCESS — 7일, 3단계  ───────────────── */
function Process() {
  const steps = [
    {
      n: "1",
      d: "DAY 1–2",
      h: "리서치와 제작",
      p: "검색 수요와 경쟁 광고를 조사하고, 검증용 사이트를 만듭니다. 데이터를 보기 전에 합격선부터 함께 정합니다.",
    },
    {
      n: "2",
      d: "DAY 3–7",
      h: "광고 집행",
      p: "구글 광고를 집행합니다. 문구 2~3종을 나눠 돌리고, 대시보드를 실시간으로 공유합니다.",
    },
    {
      n: "3",
      d: "DAY 7",
      h: "판정 리포트",
      p: "Go / No-Go 판정서를 보내드립니다. 숫자의 해석과 다음 액션까지 정리하고, 질문은 일주일간 답해드립니다.",
    },
  ];
  return (
    <section id="process" className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Label>진행 방식</Label>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-5xl">
            7일이면 끝납니다
          </h2>
          <p className="mt-6 text-lg leading-[1.7] text-text-secondary">
            도구를 배우실 필요 없습니다. 저희 작업은 48시간이면 끝나고,
            나머지 닷새는 시장이 답하는 데 걸리는 최소 시간입니다.
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
            저희는 개발을 팔지 않습니다.
          </p>
          <p className="mt-3 leading-[1.75] text-text-secondary">
            시장조사와 개발을 함께 파는 회사는 "만드세요"라고 말할 금전적
            이유가 있습니다. 저희 수입은 판정의 정확도에서만 나옵니다. 그래서
            안 되는 아이디어에는 안 된다고 말씀드립니다.
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
      idea: "B2B 계약서 검토 자동화 SaaS",
      stamp: "GO",
      color: verdict.go,
      bg: verdict.goBg,
      rows: [
        ["CTR", "4.1%"],
        ["결제 클릭률", "2.4%"],
        ["CAC", "₩6,800"],
      ],
      take: "수요와 단가 모두 합격선을 넘었습니다. 개발을 진행할 근거가 확인된 사례입니다.",
    },
    {
      idea: "반려동물 맞춤 영양제 정기구독",
      stamp: "NO-GO",
      color: verdict.nogo,
      bg: verdict.nogoBg,
      rows: [
        ["CTR", "1.4%"],
        ["결제 클릭", "0건"],
        ["CAC", "측정 불가"],
      ],
      take: "클릭은 있었지만 결제 의향이 확인되지 않았습니다. 출시 전에 중단해 수개월의 개발 비용을 아낀 사례입니다.",
    },
    {
      idea: "프리랜서 세금 신고 대행",
      stamp: "PIVOT",
      color: verdict.pivot,
      bg: verdict.pivotBg,
      rows: [
        ["CTR", "3.8%"],
        ["결제 클릭률", "0.6%"],
        ["CAC", "₩21,400"],
      ],
      take: "수요는 강하지만 이 가격으로는 수익 구조가 맞지 않습니다. 가격과 상품 구성 조정을 권고한 사례입니다.",
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
            직접 검증하고 분석한 결과를 그대로 공개합니다. 좋은 답도, 나쁜
            답도.
          </p>
        </div>

        {/* 사후 진단 — 실제 사례 */}
        <div className="reveal mt-14 grid items-center gap-10 rounded-[24px] border border-border bg-surface p-8 shadow-[0_14px_30px_-16px_rgba(10,23,38,0.10)] sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="rounded-full px-3.5 py-1.5 text-xs font-extrabold"
                style={{ color: verdict.nogo, background: verdict.nogoBg }}
              >
                NO-GO
              </span>
              <span className="rounded-full bg-text px-3.5 py-1.5 text-xs font-extrabold text-bg">
                사후 진단 · 실제 사례
              </span>
            </div>
            <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-text sm:text-[28px]">
              중고 시세 분석 멤버십
            </h3>
            <p className="mt-4 max-w-lg leading-[1.75] text-text-secondary">
              다 만들어 출시한 뒤에야 광고 제한, 결제 전환 막힘, 시장 포화가
              한꺼번에 확인된 실제 서비스입니다. 사후 분석 결과, 전부{" "}
              <span className="font-semibold text-text">
                시작 전 7일 검증에서 잡히는 신호
              </span>
              였습니다. 같은 답을 몇 달과 수백만 원 대신 광고비 몇만 원으로
              받는 것, 그게 검증의 목적입니다.
            </p>
          </div>
          <div className="rounded-[18px] bg-bg-alt p-6">
            <div className="flex items-center justify-between border-b border-dashed border-border pb-4">
              <span className="text-[13px] font-semibold text-text-tertiary">
                사후 진단서 · 실제 사례
              </span>
            </div>
            <div className="mt-4 space-y-3.5">
              {[
                ["관심 (클릭)", "높음", false],
                ["결제 전환", "막힘", true],
                ["광고 승인", "제한", false],
                ["시장 포화", "레드", true],
              ].map(([k, v, bad]) => (
                <div
                  key={k as string}
                  className="flex justify-between text-[15px]"
                >
                  <span className="font-medium text-text-tertiary">{k}</span>
                  <span
                    className="font-extrabold"
                    style={{ color: bad ? verdict.nogo : "var(--text)" }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 포맷 예시 3종 */}
        <div className="reveal-stagger mt-6 grid gap-5 md:grid-cols-3">
          {samples.map((c) => (
            <div
              key={c.idea}
              className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-26px_rgba(10,23,38,0.3)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[16px] font-bold leading-snug text-text">
                  {c.idea}
                </p>
                <span
                  className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold"
                  style={{ color: c.color, background: c.bg }}
                >
                  {c.stamp}
                </span>
              </div>
              <div className="flex gap-6 border-t border-border-light pt-4">
                {c.rows.map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] font-semibold text-text-tertiary">
                      {k}
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold text-text">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
              <p className="border-t border-dashed border-border pt-3.5 text-[13px] leading-relaxed text-text-secondary">
                {c.take}
              </p>
            </div>
          ))}
        </div>
        <p className="reveal mt-7 text-center text-[13px] text-text-tertiary">
          위 3개 카드는 판정서 포맷을 보여드리기 위한 가상 예시입니다. 실제
          검증 케이스가 쌓이는 대로 (고객 동의 하에) 실데이터로 교체됩니다.
        </p>
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
      period: "7일",
      desc: "랜딩페이지를 직접 만들 수 있다면, 검증 엔진만 가져가세요.",
      lines: [
        "직접 만든 페이지 진단: 전환을 막는 요소 점검 + 측정 이벤트 세팅",
        "광고 문구 2종 제작 + 구글 또는 메타 7일 집행 (광고비 포함)",
        "합격선 사전 합의 + 라이브 대시보드 상시 공개",
        "Go/No-Go 판정 리포트 + 다음 액션 제안",
        "재검증 30% 할인: 조건 바꿔 다시 돌리면 회당 약 20만원",
      ],
      cta: "엔진으로 시작",
      highlight: false,
    },
    {
      tag: "QUICK 검증",
      price: "50만원",
      period: "7일",
      desc: "아무도 원하지 않는 건 아닌지, 수요부터 확인합니다.",
      lines: [
        "실서비스처럼 보이는 검증용 브랜드 사이트 제작 (종료 후 도메인·디자인 전부 고객 소유)",
        "미니 시장 리서치: 검색 수요·경쟁 광고·유사 서비스 가격대 조사",
        "광고 문구 2~3종 제작 + 구글 광고 7일 집행 · 기간 내 최적화 (광고비 포함)",
        "GA4 + 전환 이벤트 + 결제 의향 측정",
        "클릭 단가 · 고객 획득 비용(CAC) 1차 측정",
        "실시간 진행 대시보드 + Go/No-Go 판정 리포트 + 다음 액션 권고",
        "판정 보장: 분명한 Go/No-Go를 못 드리면 전액 환불",
      ],
      cta: "Quick으로 시작",
      highlight: true,
    },
    {
      tag: "DEEP 검증",
      price: "130만원",
      period: "14일",
      desc: "원하는데 돈이 안 되는 건 아닌지, 단가와 손익까지 확인합니다.",
      lines: [
        "Quick 전체 포함",
        "가격 2안 테스트: '얼마를 받아야 하는지'를 데이터로",
        "경쟁사 · 비즈니스 모델 분석 리포트",
        "인스타·페이스북 광고 추가 (광고비 포함) + 콘텐츠 5~7개",
        "잠재고객 설문 + 인터뷰 5~10명",
        "객단가(한 명이 내는 돈) · CAC · LTV · 손익 시뮬레이션",
        "판정 보장: 분명한 Go/No-Go를 못 드리면 전액 환불",
      ],
      cta: "Deep으로 시작",
      highlight: false,
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
            엔진은 '페이지가 이미 있는 분'을 위해, Quick은 '원하는 사람이
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
              '일단 만들기'의 평균 비용
            </p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-text">
              3~6개월 + 수백만 원
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              외주비, 광고비, 그리고 그 기간 전부의 기회비용.
            </p>
          </div>
          <p className="self-center text-center text-sm font-extrabold text-text-tertiary">
            VS
          </p>
          <div className="rounded-[20px] bg-bg-light p-7">
            <p className="text-sm font-bold text-accent">Quick 검증</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-text">
              7일 · 50만원
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              검증 비용이 아니라, 6개월짜리 오답에 대한 보험료입니다.
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
                href="/start"
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
    "제작한 랜딩페이지 · 도메인 · 디자인, 전부 가져가세요",
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
          없는 아이디어는 마케팅으로도 살릴 수 없습니다.
        </>
      ),
    },
    {
      n: "02",
      win: false,
      body: (
        <>
          <b className="font-bold text-text">원하는데, 돈이 안 된다.</b> 고객
          한 명을 데려오는 비용이 그 고객이 내는 돈보다 크면, 팔수록
          손해입니다.
        </>
      ),
    },
    {
      n: "03",
      win: true,
      body: (
        <>
          이 둘을 시작 전에 확인하면,{" "}
          <b className="font-bold text-text">
            실패의 비용이 몇 달과 수백만 원에서 7일과 광고비 몇만 원으로
            줄어듭니다.
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
            사업이 무너지는 길은
            <br />
            둘뿐입니다
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.7] text-text-secondary">
            수백 가지 이유처럼 보여도 결국 둘 중 하나로 수렴합니다. 그리고 둘
            다, 만들기 전에 확인할 수 있습니다.
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
      a: "가능합니다. 다만 도구를 배우는 데 2~4주, 시행착오 광고비가 별도로 듭니다. 그리고 더 큰 문제는 객관성입니다. 자기 아이디어를 검증하는 사람은 카피를 유리하게 쓰고, 숫자를 유리하게 읽습니다. 객관적인 건 모르는 사람의 클릭뿐입니다.",
    },
    {
      q: "Claude Code 같은 걸로 MVP를 직접 만들어서 반응 보면 되지 않나요?",
      a: "만들 수 있다는 것과 팔리는지 아는 것은 별개 문제입니다. MVP 경로는 빌드 1~2주에 광고 시행착오가 더해지고, 내가 만든 것에 대한 애착 때문에 숫자를 유리하게 읽게 됩니다. 만들기 전 7일이 더 빠릅니다. Go가 나오면 검증에 쓴 랜딩과 데이터를 그대로 가져가서 만드시면 됩니다.",
    },
    {
      q: "7일, 표본이 작은데 믿을 수 있나요?",
      a: "7일 검증이 주는 건 '확신'이 아니라 '신호'입니다. 특히 부정 신호는 강력합니다. 광고비를 썼는데 아무도 반응하지 않았다면 그건 통계 문제가 아니라 현실입니다. 애매한 회색지대가 나오면 그때 Deep으로 정밀 측정을 권합니다.",
    },
    {
      q: "더 빨리는 안 되나요?",
      a: "저희 작업 자체는 48시간이면 끝납니다. 나머지 닷새가 줄일 수 없는 시간입니다. 요일마다 시장 반응이 달라서, 최소 한 주는 노출돼야 노이즈가 아니라 신호가 됩니다.",
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
      q: "제 아이디어를 가져가면 어떡하죠?",
      a: "비밀유지 약정을 맺고 시작합니다. 검증 산출물(사이트·도메인·데이터)은 종료 후 전부 고객 자산으로 이관되며, 저희는 어떤 권리도 갖지 않습니다. 저희는 검증을 파는 회사지, 아이디어로 사업하는 회사가 아닙니다.",
    },
    {
      q: "제 잠재고객을 속이는 건 아닌가요?",
      a: "결제 버튼을 누른 분에게는 '출시 준비 중인 서비스이며, 오픈하면 가장 먼저 안내드린다'는 사전등록 화면이 나옵니다. 돈은 받지 않습니다. 그분들은 출시하는 날 당신의 첫 고객 명단이 됩니다.",
    },
    {
      q: "어떤 아이디어든 가능한가요?",
      a: "업종 제한 없습니다. 온라인 서비스, 앱, 커머스, 교육, 오프라인 매장까지. 다만 오프라인·지역 기반 사업은 검증 설계가 달라집니다(지역 타겟 광고 + 사전 예약 측정). 신청하시면 지역 타겟 설계까지 반영된 검증 설계서를 그 자리에서 바로 확인하실 수 있습니다.",
    },
    {
      q: "검증용 사이트라면, 웹사이트 제작도 해주시는 건가요?",
      a: "구분이 필요합니다. 검증용 사이트는 광고 반응을 측정하기 위한 실서비스형 페이지이며, 회원가입·결제 같은 기능 개발이 들어가는 정식 개발과는 다릅니다. 종료 후 전부 이관해드리므로 그 위에 키워가실 수 있고, 기능 개발이 필요하시면 개발 파트너를 연결해드립니다.",
    },
    {
      q: "Go 판정이 나오면, 실제 서비스 개발까지 해주시나요?",
      a: "아니요, 저희는 검증 전문이고 개발은 하지 않습니다. 원하시면 검증된 외부 개발 파트너를 연결해드립니다. 개발을 직접 팔지 않기 때문에, 저희 판정에는 '만들게 하려는' 이해관계가 없습니다.",
    },
    {
      q: "신청하면 바로 결제인가요?",
      a: "아닙니다. 아이디어를 입력하시면 그 자리에서 무료 검증 설계서와 적합한 플랜을 바로 확인하실 수 있습니다. 결제는 검증 내용을 직접 확인하고 동의하신 뒤에만 진행됩니다.",
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
              진짜 사람들로 확인하세요
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg leading-[1.7] text-text-secondary">
              아이디어 한 줄이면 시작됩니다. 광고 채널과 합격선이 담긴 검증
              설계서를 그 자리에서 무료로 받아보세요.
            </p>
            <a
              href="/start"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              내 아이디어 검증 신청
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
            <a href="#" className="flex items-center gap-2.5 text-lg">
              <BrandMark />
              <Wordmark />
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              사업 아이디어 검증 전문.
              <br />
              만들기 전에,{" "}
              <span className="text-text-secondary">
                진짜 시장의 행동 데이터
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
