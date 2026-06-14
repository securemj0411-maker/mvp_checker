import { BrandMark, Wordmark } from "@/components/Brand";

export function SubNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <Wordmark className="text-lg" />
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary sm:flex">
          <a href="/cases" className="transition hover:text-text">
            사례
          </a>
          <a href="/blog" className="transition hover:text-text">
            블로그
          </a>
          <a href="/checklist" className="transition hover:text-text">
            체크리스트
          </a>
          <a href="/#pricing" className="transition hover:text-text">
            가격
          </a>
        </nav>
        <a
          href="/start"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover hover:shadow-[0_8px_24px_var(--accent-glow)]"
        >
          검증 신청 →
        </a>
      </div>
    </header>
  );
}

export function SubFooter() {
  return (
    <footer className="section-dark mt-auto text-text-tertiary">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-10 text-sm sm:flex-row sm:items-center">
        <p>© 2026 비즈필터 · 온라인 강의 수요 검증 서비스</p>
        <div className="flex gap-5">
          <a href="/" className="hover:text-accent">
            홈
          </a>
          <a href="/cases" className="hover:text-accent">
            사례
          </a>
          <a href="/blog" className="hover:text-accent">
            블로그
          </a>
          <a href="/checklist" className="hover:text-accent">
            체크리스트
          </a>
          <a href="/start" className="hover:text-accent">
            검증 신청
          </a>
          <a href="/terms" className="hover:text-accent">
            이용약관
          </a>
          <a href="/privacy" className="hover:text-accent">
            개인정보처리방침
          </a>
        </div>
      </div>
    </footer>
  );
}
