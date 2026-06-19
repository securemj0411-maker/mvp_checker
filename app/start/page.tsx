import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import { BrandMark, Wordmark } from "@/components/Brand";

export const metadata: Metadata = {
  title: "내 강의 검증 신청 | 비즈필터",
  description:
    "강의 주제 한 줄이면 됩니다. 신청하면 담당자가 검토하고, 카카오톡으로 검증 방법을 바로 안내드립니다.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* 전용 헤더 — 메뉴 없음(이탈구 차단), 로고만 홈 링크 */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <BrandMark size={26} />
            <Wordmark className="text-lg" />
          </a>
          <span className="text-[11px] font-semibold text-text-tertiary sm:text-xs">
            광고비 별도 청구 없음 · 신청은 결제가 아닙니다
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        {/* 후크 스트립 — 우리가 뭐 하는 곳인지 폼 위에 고정 */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-text sm:text-3xl">
            이 강의가 팔릴지 안 팔릴지,
            <br />
            진짜 수강할 사람으로 확인합니다
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            강의 주제 한 줄만 적고 신청하면, 담당자가 검토하고 카카오톡으로
            맞춤 상담을 바로 드립니다.
          </p>
        </div>

        <LeadForm />
      </div>
    </main>
  );
}
