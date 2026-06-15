"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const verdict = {
  go: "var(--go)",
  goBg: "var(--go-tint)",
  nogo: "var(--nogo)",
  nogoBg: "var(--nogo-tint)",
  pivot: "var(--pivot)",
  pivotBg: "var(--pivot-tint)",
} as const;

function Browser({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_8px_24px_-8px_rgba(10,23,38,0.08),0_36px_80px_-32px_rgba(16,42,86,0.25)]">
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

const steps: {
  num: string;
  label: string;
  title: string;
  brief: string;
  detail: string;
  flip: boolean;
  shot: React.ReactNode;
}[] = [
  {
    num: "1",
    label: "사전등록 페이지",
    title: "사전등록 페이지를 세팅합니다",
    brief: "강의 제목, 커리큘럼, 수강료를 넘겨주시면 수강신청 페이지를 당일 세팅합니다.",
    detail:
      "수강신청 버튼을 누르면 '오픈예정 · 사전알림' 안내가 나옵니다. 방문자가 실제 강의라고 인식해야 진짜 결제 의향이 드러나기 때문에, 수강료까지 그대로 보여주는 실서비스형 페이지로 만듭니다. 수강생에게 돈을 받는 일은 없습니다.",
    flip: false,
    shot: (
      <Browser url="homefit-class.kr">
        <div className="bg-surface p-6 text-left sm:p-8">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] font-extrabold text-text">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[10px] font-black text-white">H</span>
              홈핏클래스
            </span>
            <span className="hidden items-center gap-4 text-xs font-semibold text-text-tertiary sm:flex">
              <span>커리큘럼</span><span>후기</span><span>강사</span>
              <span className="rounded-full bg-accent px-3 py-1.5 font-bold text-white">수강신청</span>
            </span>
          </div>
          <p className="mt-7 text-[25px] font-extrabold leading-[1.25] tracking-tight text-text">
            집에서 하루 15분,<br />8주 홈트 챌린지
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">기구 없이 영상만 따라 하면 됩니다. 8주 뒤 인증샷까지.</p>
          <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
            <span style={{ color: "var(--pivot)" }}>★ 4.9</span>
            <span className="text-text-tertiary">· 수강후기 87개</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["WEEK 1", "기초 자세", "linear-gradient(140deg,#E5ECFF,#C9D8FB)"],
              ["WEEK 4", "코어 강화", "linear-gradient(140deg,#E8F3DC,#CDE7B8)"],
              ["WEEK 8", "인증 챌린지", "linear-gradient(140deg,#F3EFD9,#E4DCAE)"],
            ].map(([d, n, g]) => (
              <div key={d} className="overflow-hidden rounded-[12px] border border-border-light">
                <div className="h-12" style={{ background: g }} />
                <div className="px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-text-tertiary">{d}</p>
                  <p className="text-[11px] font-bold text-text">{n}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-[14px] bg-bg-alt px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold text-text-tertiary">전체 8주 과정 · 평생 소장</p>
              <p className="text-xl font-black tracking-tight text-text">₩89,000</p>
            </div>
            <span className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-white">수강신청</span>
          </div>
          <p className="mt-3 text-[11px] text-text-tertiary">↑ 이 버튼 클릭이 진짜 결제 의향 신호입니다</p>
        </div>
      </Browser>
    ),
  },
  {
    num: "2",
    label: "숏폼 광고",
    title: "숏폼 광고로 잠재 수강생을 데려옵니다",
    brief: "강의를 만들기도 전에 유튜브 쇼츠·틱톡·인스타 릴스 광고를 집행합니다.",
    detail:
      "지인 칭찬은 수요가 아닙니다. 나를 전혀 모르는 사람에게 광고를 보여줘야 진짜 반응이 나옵니다. 문구 2~3종을 나눠 돌려 어떤 카피에 반응하는지까지 확인합니다. 반응이 없으면 강의 주제가 문제인지 카피가 문제인지까지 가려냅니다.",
    flip: true,
    shot: (
      <div className="flex justify-center">
        <div className="relative w-[260px] overflow-hidden rounded-[20px] bg-black shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)]" style={{ aspectRatio: "9/16" }}>
          {/* 배경 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111] via-[#0a0a0a] to-[#000]" />

          {/* 상단 바 — 재생·음량·더보기 */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-3 pt-3">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M8 5v14l11-7z"/></svg>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            </div>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </div>

          {/* 중앙 — Shorts 로고 + 광고 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            {/* YouTube Shorts 로고 SVG */}
            <svg viewBox="0 0 56 56" className="mb-4 h-14 w-14" fill="none">
              <rect width="56" height="56" rx="12" fill="#FF0000"/>
              {/* 왼쪽 필름 스트립 */}
              <rect x="6" y="18" width="28" height="12" rx="6" fill="white" transform="rotate(-18 20 24)"/>
              {/* 오른쪽 필름 스트립 */}
              <rect x="22" y="26" width="28" height="12" rx="6" fill="white" transform="rotate(-18 36 32)"/>
              {/* 플레이 삼각형 */}
              <polygon points="22,17 22,33 36,25" fill="#FF0000"/>
            </svg>
            <p className="text-[20px] font-extrabold leading-[1.3] tracking-tight text-white drop-shadow">
              하루 15분으로<br/>살이 빠진다고?
            </p>
            <p className="mt-2 text-[12px] text-white/60">기구 없이 8주 챌린지</p>
          </div>

          {/* 우측 액션 버튼 */}
          <div className="absolute bottom-28 right-2 flex flex-col items-center gap-5">
            {/* 좋아요 */}
            <div className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
              <span className="text-[10px] font-bold text-white">1.8만</span>
            </div>
            {/* 싫어요 */}
            <div className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>
              <span className="text-[10px] font-bold text-white">싫어요</span>
            </div>
            {/* 댓글 */}
            <div className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              <span className="text-[10px] font-bold text-white">1,187</span>
            </div>
            {/* 공유 */}
            <div className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
              <span className="text-[10px] font-bold text-white">공유</span>
            </div>
            {/* 리믹스 */}
            <div className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
              <span className="text-[10px] font-bold text-white">3</span>
            </div>
          </div>

          {/* 하단 채널 정보 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-4 pt-12">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-accent text-[11px] font-black text-white">H</div>
              <span className="text-[12px] font-bold text-white">@homefit</span>
              <span className="ml-1 rounded border border-white/60 px-2 py-0.5 text-[10px] font-bold text-white">구독</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-white/80">하루 15분 홈트, 기구 없이 8주 만에 변화</p>
            <p className="mt-0.5 text-[10px] text-white/40">#홈트 #다이어트 #shorts</p>
            {/* 진행 바 */}
            <div className="mt-3 h-[3px] w-full rounded-full bg-white/20">
              <div className="h-full w-[38%] rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "3",
    label: "수요·수익성 판정",
    title: "수요와 수익성을 데이터로 판정합니다",
    brief: "살 사람이 있는지, 그 가격에 남는지. Go / No-Go / Pivot으로 드립니다.",
    detail:
      "숫자만 던지지 않습니다. 합격선 대비 어디인지, 시장·경쟁 조사에서 무엇이 보였는지, 다음 액션은 무엇인지까지 판정 리포트에 담습니다. 수요가 있어도 수강료가 안 맞으면 만들수록 손해입니다. 수강생 1명을 데려오는 비용(CAC)까지 같이 잽니다.",
    flip: false,
    shot: (
      <div className="space-y-3">
        {[
          { stamp: "GO", c: verdict.go, bg: verdict.goBg, t: "수요와 수강료 모두 합격선을 넘었습니다. 진행할 근거가 확인됐습니다." },
          { stamp: "PIVOT", c: verdict.pivot, bg: verdict.pivotBg, t: "수요는 강하지만 이 가격은 아닙니다. 조건을 바꿔 다시 확인할 가치가 있습니다." },
          { stamp: "NO-GO", c: verdict.nogo, bg: verdict.nogoBg, t: "결제 의향이 확인되지 않았습니다. 시작 전에 멈춰 몇 달과 수백만 원을 아낀 결과입니다." },
        ].map((v) => (
          <div key={v.stamp} className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-4 shadow-[0_8px_24px_-12px_rgba(10,23,38,0.08)]">
            <span className="w-20 flex-shrink-0 rounded-full py-2 text-center text-sm font-black" style={{ color: v.c, background: v.bg }}>{v.stamp}</span>
            <p className="text-[13px] leading-relaxed text-text-secondary">{v.t}</p>
          </div>
        ))}
        <p className="pt-1 text-xs text-text-tertiary">세 가지 중 하나를, 데이터 근거와 함께 분명하게 드립니다.</p>
      </div>
    ),
  },
];

function StepRow({
  step,
  isOpen,
  onToggle,
}: {
  step: (typeof steps)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const text = (
    <div>
      <p className="text-[15px] font-bold text-accent">{step.num} · {step.label}</p>
      <h2 className="mt-3 text-[28px] font-extrabold leading-[1.22] tracking-[-0.03em] text-text sm:text-[36px]">
        {step.title}
      </h2>
      <p className="mt-4 text-lg leading-[1.7] text-text-secondary">{step.brief}</p>

      <button
        onClick={onToggle}
        className="mt-5 flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover"
      >
        {isOpen ? "접기" : "자세히 보기"}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="mt-3 text-[15px] leading-[1.75] text-text-secondary">{step.detail}</p>
        </div>
      </div>
    </div>
  );

  const visual = <div className="reveal">{step.shot}</div>;

  return (
    <section className="overflow-hidden bg-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20">
        <div className={`reveal ${step.flip ? "lg:order-2" : ""}`}>{text}</div>
        <div className={step.flip ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}

export default function StepsAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      {/* 섹션 헤더 */}
      <section className="bg-bg">
        <div className="mx-auto max-w-2xl px-6 pb-4 pt-24 text-center sm:pt-32">
          <p className="text-[17px] font-bold text-accent">그래서, 어떻게 확인하나요?</p>
          <h2 className="mt-3 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-[42px]">
            강의 찍기 전에, 3단계로 팔릴지 확인합니다
          </h2>
        </div>
      </section>

      {/* 좌우 교차 단계 */}
      {steps.map((s, i) => (
        <StepRow
          key={s.num}
          step={s}
          isOpen={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
        />
      ))}
    </>
  );
}
