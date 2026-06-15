import type { Metadata } from "next";
import { SubNav, SubFooter } from "@/components/SubNav";
import { CaseVisual } from "@/components/CaseMockups";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `강의 수요 검증 시연 사례 — 녹화 전에 판정은 이렇게 | ${SITE_NAME}`,
  description:
    "강의를 만들기 전에 ‘수강신청’ 페이크도어로 수요를 검증하면 판정이 어떻게 나오는지 보여주는 시연 사례 3건. 수요 확인(GO), 무료 대안 포화(No-Go), 가격 저항(Pivot)까지 — 클릭률·수강신청·획득비용 실측 형식 그대로.",
  keywords: [
    "강의 수요 검증",
    "온라인 강의 선판매",
    "강의 만들기 전 검증",
    "클래스 수요조사",
    "페이크도어 수강신청",
  ],
  alternates: { canonical: "/cases" },
};

/* 판정 색 — globals의 --go/--pivot/--nogo 토큰 */
const VERDICT = {
  GO: { color: "var(--go)", tint: "var(--go-tint)", label: "GO", sub: "진행 권고" },
  PIVOT: { color: "var(--pivot)", tint: "var(--pivot-tint)", label: "PIVOT", sub: "방향 수정 권고" },
  "NO-GO": { color: "var(--nogo)", tint: "var(--nogo-tint)", label: "NO-GO", sub: "중단 권고" },
} as const;

type Verdict = keyof typeof VERDICT;

interface CaseData {
  slug: string;
  brand: string;
  tagline: string;
  pattern: string;
  verdict: Verdict;
  story: string;
  ads: { k: string; v: string; sub?: string }[];
  signal: { label: string; value: string; rate: string; cac: string };
  why: string;
  risk: string;
  reasons: string[];
  landing: { orientation: "mobile" | "desktop" };
}

const CASES: CaseData[] = [
  {
    slug: "course-notion",
    brand: "AI로 앱 만들기 클래스",
    tagline: "비개발자 앱 출시 · 온라인 강의",
    pattern: "선판매 검증형",
    verdict: "GO",
    story:
      "강사가 커리큘럼·가격만 정해 ‘수강신청’ 랜딩을 먼저 띄웠습니다. 강의 한 컷 찍기 전에, 진짜 결제할 사람이 있는지부터 광고로 측정했습니다.",
    ads: [
      { k: "노출", v: "30,000" },
      { k: "클릭", v: "1,560" },
      { k: "클릭률", v: "5.2%" },
      { k: "평균 CPC", v: "₩180" },
    ],
    signal: {
      label: "사전 수강신청",
      value: "142건",
      rate: "방문 대비 9%",
      cac: "₩1,900",
    },
    why: "‘AI로 직접 앱을 만든다(바이브코딩)’는 지금 가장 뜨거운 주제라 콜드 광고에도 진성 신청이 붙었습니다. 클릭률 5.2%에 들어온 사람의 9%가 수강신청까지. 객단가 99,000원짜리 신청을 ₩1,900에 확보 — 강의 찍기 전에 손익이 섭니다.",
    risk:
      "유튜브 무료 영상과의 차별(끝까지 출시·실습 레포)을 끝까지 지켜야 환불이 안 납니다. 수요는 GO, 다음 과제는 ‘진짜 배포’ 경험을 주는 콘텐츠 설계입니다.",
    reasons: ["수요 확인", "선판매 성공"],
    landing: { orientation: "mobile" },
  },
  {
    slug: "course-english",
    brand: "AI 자동수익 클래스",
    tagline: "AI 부업 · 수익화 강의",
    pattern: "호기심 클릭·결제 0형",
    verdict: "NO-GO",
    story:
      "18강 녹화에 들어가기 전에 ‘수강신청’ 랜딩을 띄워, 진짜 돈 내고 들을 사람이 있는지부터 광고로 측정했습니다.",
    ads: [
      { k: "노출", v: "32,000" },
      { k: "클릭", v: "2,208" },
      { k: "클릭률", v: "6.9%" },
      { k: "평균 CPC", v: "₩95" },
    ],
    signal: {
      label: "사전 수강신청",
      value: "5건",
      rate: "방문 대비 0.2%",
      cac: "₩14,800",
    },
    why: "클릭률은 6.9%로 폭발했지만 수강신청은 5건뿐. 호기심 클릭은 쏟아져도 ‘돈 내고 배울’ 신호는 거의 없었습니다 — ‘자동 수익’ 약속 자체가 의심받고, 유튜브에 같은 ‘월 천만원’류가 무료로 범람합니다.",
    risk:
      "과장된 수익 표현은 광고 승인도 막히고, 전환이 0에 가까워 광고를 키울수록 손해입니다. ‘자동 수익’ 대신 검증 가능한 구체 결과(특정 도구·업무)로 약속을 좁히면 다시 검증할 가치가 있습니다.",
    reasons: ["결제 의향 없음", "약속 신뢰도 낮음"],
    landing: { orientation: "mobile" },
  },
  {
    slug: "course-coding",
    brand: "AI 영상 자동화 클래스",
    tagline: "쇼츠 자동 양산 · 라이브 클래스",
    pattern: "고가·고관여형",
    verdict: "PIVOT",
    story:
      "69만 원 라이브 클래스에 진짜 신청이 붙는지, 한 기수를 모으기 전에 ‘수강신청’ 랜딩으로 광고를 돌려 측정했습니다.",
    ads: [
      { k: "노출", v: "34,000" },
      { k: "클릭", v: "1,496" },
      { k: "클릭률", v: "4.4%" },
      { k: "평균 CPC", v: "₩230" },
    ],
    signal: {
      label: "사전 수강신청",
      value: "17건",
      rate: "방문 대비 1.1%",
      cac: "₩6,800",
    },
    why: "클릭률 4.4%로 관심은 강했습니다. 다만 69만 원 일시불 앞에서 결제까지는 17건 — 수요는 분명한데 가격 저항이 또렷합니다. 객단가가 커서 신청 1건의 가치(CAC ₩6,800 대비)는 충분히 큽니다.",
    risk:
      "수요가 없는 게 아니라 가격·결제조건이 문턱입니다. 분납·범위 축소(특정 니치)로 저항을 낮춰 재검증하면 충분히 GO로 넘어갈 수 있습니다.",
    reasons: ["수요 강함", "가격 저항"],
    landing: { orientation: "mobile" },
  },
];

function VerdictPill({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-extrabold"
      style={{ color: v.color, background: v.tint }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />
      {v.label}
      <span className="font-semibold opacity-70">· {v.sub}</span>
    </span>
  );
}

/* 브라우저 크롬 프레임 */
function CaseBlock({ c, idx }: { c: CaseData; idx: number }) {
  const v = VERDICT[c.verdict];
  return (
    <article className="overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_14px_40px_-26px_rgba(10,23,38,0.18)]">
      {/* 헤더 */}
      <div className="border-b border-border-light px-7 py-7 sm:px-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <VerdictPill verdict={c.verdict} />
          <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-text-tertiary">
            {c.pattern}
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-text sm:text-[28px]">
          {c.brand}
        </h2>
        <p className="mt-1.5 text-[15px] font-semibold text-text-secondary">
          {c.tagline}
        </p>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] text-text-secondary">
          {c.story}
        </p>
      </div>

      <div className="grid gap-7 px-7 py-8 sm:px-9 lg:grid-cols-2 lg:gap-10">
        {/* 좌: 숫자 + 판정 */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">
              광고 집행 결과
            </p>
            <span className="rounded-full bg-bg-alt px-2 py-0.5 text-[10px] font-bold text-text-tertiary">
              시연 데이터
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {c.ads.map((a) => (
              <div key={a.k} className="rounded-[14px] bg-bg-alt px-4 py-3">
                <p className="text-[11px] font-semibold text-text-tertiary">{a.k}</p>
                <p className="mt-0.5 text-xl font-extrabold tracking-tight text-text">
                  {a.v}
                </p>
                {a.sub && (
                  <p className="mt-0.5 text-[11px] font-medium text-text-tertiary">
                    {a.sub}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 결제/신청 의향 + CAC */}
          <div
            className="mt-3 rounded-[14px] px-5 py-4"
            style={{ background: v.tint }}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-text-secondary">
                  {c.signal.label}
                </p>
                <p className="mt-0.5 text-2xl font-black tracking-tight" style={{ color: v.color }}>
                  {c.signal.value}
                </p>
                <p className="text-[12px] font-medium text-text-tertiary">
                  {c.signal.rate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-text-tertiary">
                  1명 데려온 값
                </p>
                <p className="text-lg font-extrabold text-text">{c.signal.cac}</p>
              </div>
            </div>
          </div>

          {/* 판정 근거 */}
          <div className="mt-5">
            <p className="text-sm font-bold text-text">왜 이렇게 판정했나</p>
            <p className="mt-2 text-[14px] leading-[1.7] text-text-secondary">
              {c.why}
            </p>
            <p className="mt-2.5 text-[14px] leading-[1.7] text-text-secondary">
              {c.risk}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {c.reasons.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-bg-alt px-2.5 py-1 text-[11px] font-bold text-text-secondary"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 우: 제품 목업 (검증용 사이트/앱) */}
        <div>
          <div className="rounded-[20px] bg-bg-alt px-5 py-8">
            <CaseVisual slug={c.slug} />
          </div>
          <p className="mt-1.5 text-center text-[11px] text-text-tertiary">
            광고가 향한 검증용 {c.landing.orientation === "mobile" ? "앱" : "사이트"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CasesPage() {
  return (
    <>
      <SubNav />
      <main className="bg-bg">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          {/* 헤더 */}
          <p className="text-[15px] font-bold text-accent">검증 시연 사례</p>
          <h1 className="mt-3 text-[32px] font-extrabold leading-[1.18] tracking-[-0.03em] text-text sm:text-[44px]">
            광고를 실제로 돌리면,
            <br />
            판정은 이렇게 나옵니다
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-[1.7] text-text-secondary">
            같은 ‘강의 검증’이라도 결과는 셋으로 갈립니다. 수요가 붙는 GO, 무료
            대안에 밀리는 No-Go, 수요는 있는데 가격이 문턱인 Pivot. 세 가지를 실제
            집행 형식 그대로 보여드립니다.
          </p>

          {/* 정직 고지 */}
          <div className="mt-6 rounded-[14px] border border-border bg-bg-alt/60 px-5 py-4 text-[13px] leading-relaxed text-text-secondary">
            아래는 비즈필터가 <b className="text-text">어떻게 검증하고 판정서가
            어떻게 나오는지</b> 보여주는 시연 사례입니다. 광고 대시보드는 집행
            화면 형식 그대로이며, 결제 의향 수치는 검증용 사이트에서 측정하는
            값입니다. 실제 고객 검증 사례는 <b className="text-text">동의를 받아
            순차적으로</b> 공개합니다.
          </div>

          {/* 케이스 */}
          <div className="mt-10 space-y-8">
            {CASES.map((c, i) => (
              <CaseBlock key={c.slug} c={c} idx={i} />
            ))}
          </div>

          {/* CTA */}
          <div className="section-dark mt-14 overflow-hidden rounded-[24px] px-7 py-12 text-center sm:px-12">
            <h2 className="text-[26px] font-extrabold leading-[1.25] tracking-[-0.02em] text-text sm:text-[32px]">
              당신 강의는 셋 중 어디일까요?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.7] text-text-secondary">
              강의 주제 한 줄이면 시작됩니다. 광고 채널과 합격선이 담긴 검증
              설계서를 그 자리에서 무료로 받아보세요.
            </p>
            <a
              href="/start"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              내 강의 검증 신청
            </a>
            <p className="mt-4 text-sm font-medium text-text-tertiary">
              신청은 결제가 아닙니다 · 설계서 무료
            </p>
          </div>
        </div>
      </main>
      <SubFooter />
    </>
  );
}
