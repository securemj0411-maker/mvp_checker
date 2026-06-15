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
  title: string;
  brief: string;
  detail: string;
  shot: React.ReactNode;
}[] = [
  {
    num: "1",
    title: "사전등록 페이지를 세팅합니다",
    brief: "강의 제목, 커리큘럼, 수강료를 넘겨주시면 수강신청 페이지를 당일 세팅합니다.",
    detail:
      "수강신청 버튼을 누르면 '오픈예정 · 사전알림' 안내가 나옵니다. 방문자가 실제 강의라고 인식해야 진짜 결제 의향이 드러나기 때문에, 수강료까지 그대로 보여주는 실서비스형 페이지로 만듭니다. 수강생에게 돈을 받는 일은 없습니다.",
    shot: (
      <Browser url="homefit-class.kr">
        <div className="bg-surface p-6 text-left sm:p-8">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] font-extrabold text-text">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[10px] font-black text-white">H</span>
              홈핏클래스
            </span>
            <span className="hidden items-center gap-4 text-xs font-semibold text-text-tertiary sm:flex">
              <span>커리큘럼</span>
              <span>후기</span>
              <span>강사</span>
              <span className="rounded-full bg-accent px-3 py-1.5 font-bold text-white">수강신청</span>
            </span>
          </div>
          <p className="mt-7 text-[25px] font-extrabold leading-[1.25] tracking-tight text-text">
            집에서 하루 15분,<br />8주 홈트 챌린지
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
            기구 없이 영상만 따라 하면 됩니다. 8주 뒤 인증샷까지.
          </p>
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
    title: "숏폼 광고로 잠재 수강생을 데려옵니다",
    brief: "강의를 만들기도 전에 유튜브 쇼츠·틱톡·인스타 릴스 광고를 집행합니다.",
    detail:
      "지인 칭찬은 수요가 아닙니다. 나를 전혀 모르는 사람에게 광고를 보여줘야 진짜 반응이 나옵니다. 문구 2~3종을 나눠 돌려 어떤 카피에 반응하는지까지 확인합니다. 반응이 없으면 강의 주제가 문제인지 카피가 문제인지까지 가려냅니다.",
    shot: (
      <div className="space-y-3">
        <div className="flex gap-2">
          {["YouTube Shorts", "TikTok", "Reels"].map((ch, i) => (
            <span
              key={ch}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                i === 0 ? "bg-accent text-white" : "border border-border bg-surface text-text-tertiary"
              }`}
            >
              {ch}
            </span>
          ))}
        </div>
        {[
          { copy: "하루 15분으로 살이 빠진다고?", ctr: "5.8%", hot: true },
          { copy: "기구 없이 8주 챌린지, 진짜 될까요?", ctr: "2.3%", hot: false },
        ].map((ad) => (
          <div
            key={ad.copy}
            className={`overflow-hidden rounded-[18px] border bg-surface shadow-[0_8px_24px_-12px_rgba(10,23,38,0.08)] ${
              ad.hot ? "border-border-hover" : "border-border"
            }`}
          >
            <div className="relative flex h-28 items-end bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] p-4">
              <span className="absolute right-3 top-3 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">AD</span>
              <p className="text-sm font-bold leading-snug text-white">{ad.copy}</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-text-tertiary">@homefit · 스폰서</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ad.hot ? "text-accent" : "text-text-tertiary"}`}
                style={{ background: ad.hot ? "var(--bg-light)" : "var(--bg-alt)" }}
              >
                클릭률 {ad.ctr}
              </span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "3",
    title: "수요와 수익성을 데이터로 판정합니다",
    brief: "살 사람이 있는지, 그 가격에 남는지. Go / No-Go / Pivot으로 드립니다.",
    detail:
      "숫자만 던지지 않습니다. 합격선 대비 어디인지, 시장·경쟁 조사에서 무엇이 보였는지, 다음 액션은 무엇인지까지 판정 리포트에 담습니다. 수요가 있어도 수강료가 안 맞으면 만들수록 손해입니다. 수강생 1명을 데려오는 비용(CAC)까지 같이 잽니다.",
    shot: (
      <div className="space-y-3">
        {[
          { stamp: "GO", c: verdict.go, bg: verdict.goBg, t: "수요와 수강료 모두 합격선을 넘었습니다. 진행할 근거가 확인됐습니다." },
          { stamp: "PIVOT", c: verdict.pivot, bg: verdict.pivotBg, t: "수요는 강하지만 이 가격은 아닙니다. 조건을 바꿔 다시 확인할 가치가 있습니다." },
          { stamp: "NO-GO", c: verdict.nogo, bg: verdict.nogoBg, t: "결제 의향이 확인되지 않았습니다. 시작 전에 멈춰 몇 달과 수백만 원을 아낀 결과입니다." },
        ].map((v) => (
          <div key={v.stamp} className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-4 shadow-[0_8px_24px_-12px_rgba(10,23,38,0.08)]">
            <span className="w-20 flex-shrink-0 rounded-full py-2 text-center text-sm font-black" style={{ color: v.c, background: v.bg }}>
              {v.stamp}
            </span>
            <p className="text-[13px] leading-relaxed text-text-secondary">{v.t}</p>
          </div>
        ))}
        <p className="pt-1 text-xs text-text-tertiary">세 가지 중 하나를, 데이터 근거와 함께 분명하게 드립니다.</p>
      </div>
    ),
  },
];

export default function StepsAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        {/* 헤더 */}
        <div className="mb-14 text-center">
          <p className="text-[17px] font-bold text-accent">그래서, 어떻게 확인하나요?</p>
          <h2 className="mt-3 text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-[42px]">
            강의 찍기 전에, 3단계로 팔릴지 확인합니다
          </h2>
        </div>

        {/* 3단계 */}
        <div className="space-y-10">
          {steps.map((s, i) => {
            const isOpen = open === i;
            return (
              <div key={s.num}>
                {/* 단계 헤더 */}
                <div className="mb-5 flex items-center gap-4">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-bg-light text-base font-extrabold text-accent">
                    {s.num}
                  </span>
                  <div>
                    <p className="text-[18px] font-extrabold text-text">{s.title}</p>
                    <p className="mt-0.5 text-sm text-text-secondary">{s.brief}</p>
                  </div>
                </div>

                {/* 목업 — 항상 보임 */}
                {s.shot}

                {/* 자세히 보기 — 텍스트 설명만 */}
                <div className="mt-4">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-hover"
                  >
                    {isOpen ? "접기" : "자세히 보기"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-in-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-3 text-[15px] leading-[1.75] text-text-secondary">
                        {s.detail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 구분선 (마지막 제외) */}
                {i < steps.length - 1 && (
                  <div className="mt-10 border-t border-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
