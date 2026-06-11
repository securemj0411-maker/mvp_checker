function VennMark() {
  return (
    <svg viewBox="0 0 100 100" width="30" height="30" aria-hidden style={{ flex: "none" }}>
      <circle cx="37" cy="50" r="31" fill="#16233A" />
      <circle cx="63" cy="50" r="31" fill="#3182F6" />
      <path d="M50 21.9 A31 31 0 0 1 50 78.1 A31 31 0 0 1 50 21.9 Z" fill="#11328A" />
      <path d="M41 51 L49 60 L64 39" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SubNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.04em]">
          <VennMark />
          <span>
            <span style={{ color: "var(--ink)" }}>비즈</span>
            <span style={{ color: "var(--accent)" }}>필터</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary sm:flex">
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
          href="/#cta"
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
        <p>© 2026 비즈필터 · 사업 아이디어 검증 서비스</p>
        <div className="flex gap-5">
          <a href="/" className="hover:text-accent">
            홈
          </a>
          <a href="/blog" className="hover:text-accent">
            블로그
          </a>
          <a href="/checklist" className="hover:text-accent">
            체크리스트
          </a>
          <a href="/#cta" className="hover:text-accent">
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
