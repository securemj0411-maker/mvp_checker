import type { Metadata } from "next";
import { SubNav, SubFooter } from "@/components/SubNav";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `온라인 강의 수요 검증 5단계 체크리스트 (무료) | ${SITE_NAME}`,
  description:
    "녹화하기 전에 팔릴 강의인지 확인하는 5단계: 진짜처럼 보이는 수강신청 페이지, 합격선 사전 설정(100명 중 3명), 광고로 모르는 사람 데려오기, 두 숫자만 보기, 정한 대로 판정. 실제 기준 숫자까지 공개.",
  keywords: [
    "강의 주제 정하기",
    "온라인 강의 수요조사",
    "강의 수요 검증",
    "클래스101 수요조사",
    "강의 검증 체크리스트",
    "페이크도어 테스트",
  ],
  alternates: { canonical: "/checklist" },
};

const STEPS = [
  {
    n: "1단계",
    h: "강의 말고, '진짜처럼 보이는 수강신청 페이지'부터",
    body: [
      "진짜 강의처럼 보이는 한 장짜리 수강신청 페이지를 만듭니다. 예쁘게가 아니라 진짜처럼. 강의 제목, 누구를 위한 강의인지, 뭘 배워 가는지, 그리고 수강료가 얼마인지.",
      "수강료를 꼭 넣습니다. 가격 없는 페이지는 '괜찮네요'를 모으고, 가격 있는 페이지는 '들을게요'를 모읍니다. '수강신청' 버튼은 실제 결제가 아니라 '오픈예정 · 사전알림 신청'으로 연결합니다. 돈은 받지 않습니다. 그 신청자들이 강의를 여는 날 첫 수강생 명단이 됩니다.",
    ],
  },
  {
    n: "2단계",
    h: "합격선을 데이터 보기 전에 정한다",
    body: [
      "광고 쪽 숫자(노출, 클릭률)는 전부 무시해도 됩니다. 볼 것은 하나입니다. 페이지에 들어온 모르는 사람 100명 중 몇 명이 '수강신청'을 눌렀나.",
      "참고 기준: 100명 중 3명 이상 → 가능성 있음, 다음 단계. 1명 미만 → 접는다. 그 사이(1~2명) → 문구를 바꿔 한 번 더. (강의 유형마다 다릅니다. 고가 강의는 더 낮아도 됩니다. 포인트는 정확한 퍼센트가 아니라 '보기 전에 정한다'는 것.)",
      "보고 나서 정하면 누구나 자기에게 유리하게 해석하게 됩니다. \"한 명이 눌러도, 문구만 바꾸면 되지 않을까?\" 사람의 판단은 그렇게 기울게 되어 있습니다.",
    ],
  },
  {
    n: "3단계",
    h: "그 100명을 광고로 데려온다",
    body: [
      "지인은 안 됩니다. 지인은 당신을 좋아하는 것이지 당신 강의를 돈 내고 들으려는 게 아닙니다. 커뮤니티의 '응원합니다', 클래스101의 무료 '응원하기'도 수요가 아닙니다. 공짜 클릭은 누구나 쉽게 누르거든요.",
      "광고는 '돈 내면 모르는 사람에게 강제로 보여주는 버튼'입니다. 구글 광고에 하루 1만 원이면 충분합니다. 점심 한 끼 값으로, 당신에게 잘 보일 이유가 하나도 없는 사람들의 진짜 반응을 살 수 있습니다.",
      "광고 문구는 2~3가지로 나눠 집행합니다. 반응이 없을 때, 강의 주제가 문제인지 문구가 문제인지 가려야 하기 때문입니다.",
    ],
  },
  {
    n: "4단계",
    h: "두 숫자만 본다",
    body: [
      "복잡한 분석 도구는 필요 없습니다. 매일 두 개만 확인합니다. 몇 명이 들어왔나, 몇 명이 '사겠다'를 눌렀나.",
      "신호가 잡히면 그때부터 조금 더 봅니다: 어떤 문구·키워드에서 들어왔는지, 수강생 한 명 데려오는 데 얼마가 들었는지(고객 획득 비용). 수요가 있어도 이 비용이 수강료보다 크면 강의를 팔수록 손해입니다.",
    ],
  },
  {
    n: "5단계",
    h: "정한 대로 판정한다",
    body: [
      "아무도 안 눌렀다면, 기분은 나쁘지만 그것도 답입니다. 녹화 한 컷 안 찍고 받은 답. 몇 달을 아낀 겁니다.",
      "어중간하면 2단계에서 정한 대로 문구를 바꿔 한 번 더 시도합니다. 그래도 어중간하면, 그게 답인 경우가 많습니다.",
    ],
  },
];

export default function ChecklistPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <SubNav />
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:py-20">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          무료 체크리스트
        </p>
        <h1 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-5xl">
          온라인 강의 수요 검증
          <br />
          5단계 체크리스트
        </h1>
        <p className="mt-5 text-lg leading-[1.7] text-text-secondary">
          몇 주간 녹화·편집에 매달리기 전, 만들어도 되는 강의인지 확인하는
          순서입니다. 안 팔린 강의들에서 반복적으로 확인되는 패턴을 기준으로
          정리했고, 합격선 기준 숫자까지 그대로 공개합니다.
        </p>

        <ol className="mt-12 space-y-8">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-lg border border-border bg-surface p-7"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {s.n}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-text">{s.h}</h2>
              {s.body.map((b, i) => (
                <p
                  key={i}
                  className="mt-4 leading-[1.75] text-text-secondary"
                >
                  {b}
                </p>
              ))}
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-lg border border-border bg-surface p-7">
          <p className="text-lg font-bold text-text">
            직접 하실 분들께 두 가지만 미리 말씀드립니다
          </p>
          <p className="mt-4 leading-[1.75] text-text-secondary">
            하나, 처음 하면 생각보다 헤맵니다. 광고 계정 세팅, 정책 심사,
            전환 추적. 못 할 건 아니지만 처음이라 느립니다. 그리고 숫자가
            나와도 비교할 케이스가 없으면 그냥 숫자입니다.
          </p>
          <p className="mt-4 leading-[1.75] text-text-secondary">
            둘, 객관성. 내 강의를 내가 검증하는 건 시험 문제를 내가 내고
            내가 채점하는 것과 같습니다. 문구도 유리하게 쓰고, 애매한 숫자도
            유리하게 읽게 됩니다. 이건 도구로 해결이 안 되는 영역이라, 남의 눈이 필요합니다.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-lg border border-accent/40 bg-accent/[0.05] p-8">
          <p className="text-xl font-bold text-text">
            이 5단계, 빠르면 2~3일 안에 통째로 대신 끝내드립니다
          </p>
          <p className="mt-3 leading-[1.7] text-text-secondary">
            페이지 제작 → 합격선 합의 → 광고 집행 → 숫자 해석 → Go/No-Go
            판정까지. 작업은 48시간이면 시작되고, Go든 No-Go든 분명한 판정을
            보장하고, 못 드리면 전액 환불합니다. 신청은 결제가 아닙니다.
          </p>
          <a
            href="/start"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover"
          >
            내 강의 검증 신청하기
          </a>
        </div>
      </section>
      <SubFooter />
    </main>
  );
}
