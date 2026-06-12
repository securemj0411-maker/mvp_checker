/* 비즈필터 로고 — 메인/모든 페이지 공용 */

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      style={{ display: "block", flex: "none" }}
    >
      <circle cx="37" cy="50" r="31" fill="#16233A" />
      <circle cx="63" cy="50" r="31" fill="#3182F6" />
      <path
        d="M50 21.9 A31 31 0 0 1 50 78.1 A31 31 0 0 1 50 21.9 Z"
        fill="#11328A"
      />
      <path
        d="M41 51 L49 60 L64 39"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* 워드마크 — 비즈(먹) 필터(블루) 투톤 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-[-0.04em] ${className}`}>
      <span style={{ color: "var(--ink)" }}>비즈</span>
      <span style={{ color: "var(--accent)" }}>필터</span>
    </span>
  );
}
