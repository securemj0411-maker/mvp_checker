const fontDisplay = { fontFamily: "var(--font-display)" } as const;
const dotAccent = { boxShadow: "0 0 8px var(--accent-glow)" } as const;

export function SubNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-text"
        >
          <span
            className="relative flex h-7 w-7 items-center justify-center rounded bg-text text-sm font-black text-bg"
            style={fontDisplay}
          >
            B
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent"
              style={dotAccent}
            />
          </span>
          <span>비즈필터</span>
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
        <p>© 2026 비즈필터 — 사업 아이디어 검증 서비스</p>
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
        </div>
      </div>
    </footer>
  );
}
