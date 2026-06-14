import type { Metadata } from "next";
import { SubNav, SubFooter } from "@/components/SubNav";
import { CaseVisual } from "@/components/CaseMockups";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `검증 시연 사례 — 광고를 돌리면 판정이 이렇게 나옵니다 | ${SITE_NAME}`,
  description:
    "비즈필터가 실제 광고로 수요를 검증하면 판정서가 어떻게 나오는지 보여주는 시연 사례 3건. 수요 폭발(GO), 좁은 수요·높은 획득비용(Pivot), 법적·자본 장벽(Pivot)까지 — 클릭률·결제 의향·고객 획득비용 실측 형식 그대로.",
  keywords: [
    "사업 아이디어 검증 사례",
    "수요 검증 사례",
    "광고 집행 결과",
    "Go No-Go 판정",
    "페이크도어 테스트 사례",
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
    slug: "dogo",
    brand: "댕고 (DOGO)",
    tagline: "근처 산책사를 실시간으로 부르는 '강아지용 우버'",
    pattern: "수요 폭발형",
    verdict: "GO",
    story:
      "견주는 바쁜 날 동네 산책사를 부르고, 누구나 산책사로 등록해 용돈을 법니다. 신원 확인·실시간 GPS·보험을 신뢰 장치로 건 양면 마켓. 결제 의향은 하단 ‘오픈 알림 신청’ 폼으로 측정했습니다.",
    ads: [
      { k: "노출", v: "42,000" },
      { k: "클릭", v: "2,730" },
      { k: "클릭률", v: "6.5%", sub: "펫 평균의 3배" },
      { k: "평균 CPC", v: "₩110" },
    ],
    signal: {
      label: "사전등록·산책사 지원",
      value: "764건",
      rate: "방문 대비 28%",
      cac: "₩393",
    },
    why: "펫 카테고리 평균 클릭률(1~2%)의 3배가 나왔고, 들어온 사람의 28%가 사전등록까지 갔습니다. 견주·산책사 양쪽에서 강한 사전 수요가 확인됐습니다. 한 명을 데려오는 값이 ₩393으로, 수요는 분명한 GO입니다.",
    risk:
      "다만 양면 시장(견주와 산책사를 동시에 모아야 함)과 안전·보험 책임이 실행 난이도로 남습니다. ‘팔리는가’는 GO, 다음 검증 대상은 ‘운영을 감당할 수 있는가’입니다.",
    reasons: ["수요 강함", "실행 리스크"],
    landing: { orientation: "mobile" },
  },
  {
    slug: "course",
    brand: "노션 자동화 클래스",
    tagline: "녹화 전에 ‘수강신청’부터 받아본 온라인 클래스",
    pattern: "선판매 검증형",
    verdict: "GO",
    story:
      "강사가 커리큘럼·가격만 정해 ‘수강신청’ 랜딩을 먼저 띄웠습니다. 영상 한 컷 녹화하기 전에, 진짜 결제할 사람이 있는지부터 광고로 측정했습니다.",
    ads: [
      { k: "노출", v: "38,000" },
      { k: "클릭", v: "1,748" },
      { k: "클릭률", v: "4.6%" },
      { k: "평균 CPC", v: "₩170" },
    ],
    signal: {
      label: "사전 수강신청",
      value: "128건",
      rate: "방문 대비 9%",
      cac: "₩2,100",
    },
    why: "‘노션 자동화’는 검색·관심이 꾸준한 주제라 콜드 광고에도 진성 신청이 붙었습니다. 클릭률 4.6%에 들어온 사람의 9%가 수강신청까지. 객단가 89,000원짜리 신청을 ₩2,100에 확보 — 영상 한 컷 찍기 전에 손익이 섭니다.",
    risk:
      "무료 유튜브 강의와의 차별(체계적 커리큘럼·실습 템플릿)을 끝까지 지켜야 환불이 안 납니다. 수요는 GO, 다음 과제는 완강률을 지킬 콘텐츠 설계입니다.",
    reasons: ["수요 확인", "선판매 성공"],
    landing: { orientation: "mobile" },
  },
  {
    slug: "matjib",
    brand: "맛집발견",
    tagline: "위치 기반으로 동네 맛집을 추천하는 구독형 앱",
    pattern: "회색지대형",
    verdict: "PIVOT",
    story:
      "내 주변 맛집을 추천하고 월 구독으로 수익화하는 앱. 검증용 랜딩에 ‘구독 시작’ 버튼을 넣어 결제 의향을 측정했습니다.",
    ads: [
      { k: "노출", v: "31,000" },
      { k: "클릭", v: "81" },
      { k: "클릭률", v: "0.26%", sub: "매우 낮음" },
      { k: "평균 CPC", v: "₩1,230" },
    ],
    signal: {
      label: "‘구독 시작’ 버튼 클릭",
      value: "19건",
      rate: "방문 대비 23.5%",
      cac: "₩5,263",
    },
    why: "들어온 사람의 23.5%가 구독을 눌렀습니다 — 좁지만 진짜 수요는 있습니다. 문제는 그 앞 단계입니다. 클릭률 0.26%로, 네이버·카카오맵 같은 무료 대안에 묻혀 광고로 사람을 데려오는 것 자체가 안 됐습니다.",
    risk:
      "전환이 좋아도 살 사람을 데려올 수 없으면 사업은 안 됩니다. 넓게 뿌리는 대신 타깃과 메시지를 좁혀 다시 확인할 가치가 있는 회색지대입니다.",
    reasons: ["수요는 좁음", "획득 비용", "대안 포화"],
    landing: { orientation: "mobile" },
  },
  {
    slug: "sanctum",
    brand: "SANCTUM (생텀)",
    tagline: "연 1,000만 원 회원제 프라이빗 지하 벙커 멤버십",
    pattern: "고가·고관여형",
    verdict: "PIVOT",
    story:
      "연회비를 내면 위급 시 가족과 전국 벙커로 대피할 자리를 확보하는, 골프 회원권 구조의 프라이빗 멤버십. 권위 있는 회사소개형 랜딩 하단 ‘멤버십 상담 신청’ 폼으로 의향을 측정했습니다.",
    ads: [
      { k: "노출", v: "38,000" },
      { k: "클릭", v: "410" },
      { k: "클릭률", v: "1.08%" },
      { k: "평균 CPC", v: "₩4,878" },
    ],
    signal: {
      label: "멤버십 상담 신청",
      value: "23건",
      rate: "방문 대비 5.6%",
      cac: "₩86,957",
    },
    why: "객단가가 연 1,000만 원이라, 상담 1건을 ₩87,000에 데려와도 충분히 남습니다. 상담 23건의 잠재 계약가치는 약 2.3억 원 — 수요와 단가는 확인됐습니다.",
    risk:
      "진짜 장벽은 다른 곳입니다. 실제 벙커는 막대한 초기 자본과 건축·안전·재난 관련 인허가(법적 문제)가 필요합니다. 검증해야 할 다음 질문은 ‘사고 싶은 사람이 있는가’가 아니라 ‘지을 수 있는가, 법적으로 가능한가’입니다.",
    reasons: ["수요·단가 확인", "법적·인허가", "초기 자본"],
    landing: { orientation: "desktop" },
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
              광고 집행 결과 · 7일
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
            같은 ‘검증’이라도 결과는 셋으로 갈립니다. 수요가 터지는 GO, 좁은
            수요를 비싸게 사야 하는 Pivot, 그리고 팔리는데 다른 벽에 막히는
            경우. 세 가지 패턴을 실제 집행 형식 그대로 보여드립니다.
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
              당신 아이디어는 셋 중 어디일까요?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.7] text-text-secondary">
              아이디어 한 줄이면 시작됩니다. 광고 채널과 합격선이 담긴 검증
              설계서를 그 자리에서 무료로 받아보세요.
            </p>
            <a
              href="/start"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              내 아이디어 검증 신청
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
