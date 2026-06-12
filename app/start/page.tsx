import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "내 아이디어 검증 신청 | 비즈필터",
  description:
    "아이디어 한 줄이면 시작됩니다. 광고 채널과 합격선이 담긴 검증 설계서를 무료로 받아보세요.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* 전용 헤더 — 메뉴 없음(이탈구 차단), 로고만 홈 링크 */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-2 font-extrabold text-text"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-white">
              B
            </span>
            {SITE_NAME}
          </a>
          <span className="text-[11px] font-semibold text-text-tertiary sm:text-xs">
            광고비 비즈필터 부담 · 실제 결제 없음
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        {/* 후크 스트립 — 우리가 뭐 하는 곳인지 폼 위에 고정 */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-text sm:text-3xl">
            이 사업이 될지 안 될지,
            <br />
            진짜 사람들로 확인합니다
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            아이디어를 적으면, 어디에 광고를 걸어 보통 48시간 안에 수백 명을
            불러올지 담긴 검증 설계서를 그 자리에서 무료로 드립니다.
          </p>
        </div>

        <LeadForm />
      </div>
    </main>
  );
}
