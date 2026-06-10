# DESIGN.md — 0to1 사업 검증 서비스

> 검증실의 모니터처럼 — 어둠 속에서 진짜 데이터만 빛난다.

## 1. Visual Theme & Atmosphere

**Style**: Dark Editorial × Modern Tech (Dark Tech seed + Minimal Pure 절제)
**Keywords**: 진지, 데이터, 신뢰, 어둠 속 빛, 검증, editorial, glassy
**Tone**: Editorial product site — **NOT** PPT, **NOT** cyberpunk, **NOT** SaaS marketing
**Feel**: 새벽 4시 검증실, 모니터 한 대에서 진짜 광고 데이터가 흐른다. 정적인 듯 진지하다.

**Interaction Tier**: **L2** (스크롤 reveal · stagger 입장 · hover lift · 광선 트래킹 mock)
**Dependencies**: Tailwind v4 + CSS-only animations + IntersectionObserver (GSAP X — 가벼움 우선)

---

## 2. Color Palette & Roles

```css
:root {
  /* Backgrounds (다크 메인) */
  --bg: #0a0a0b;             /* 페이지 메인 */
  --bg-alt: #0f0f12;         /* 교차 section */
  --bg-light: #f5f5f7;       /* 일부 light section (대비용) */
  --surface: rgba(255, 255, 255, 0.03);   /* 다크 카드 표면 */
  --surface-hover: rgba(255, 255, 255, 0.06);
  --surface-light: #ffffff;  /* light 섹션 카드 */

  /* Borders */
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.16);
  --border-light: #e5e5e7;

  /* Text (다크 위) */
  --text: #f5f5f7;
  --text-secondary: #a1a1a6;
  --text-tertiary: #6b6b73;

  /* Text (라이트 위) */
  --text-light: #0a0a0b;
  --text-light-secondary: #555560;
  --text-light-tertiary: #8e8e93;

  /* Accent — 노랑 절대 X. 검증·신뢰 시그널. */
  --accent: #5eead4;         /* cyan-teal (메인 accent) */
  --accent-hover: #2dd4bf;
  --accent-glow: rgba(94, 234, 212, 0.35);
  --accent-soft: #c7f284;    /* lime (성공·강조) */

  /* RGB variants */
  --bg-rgb: 10, 10, 11;
  --accent-rgb: 94, 234, 212;
  --accent-soft-rgb: 199, 242, 132;

  /* Semantic */
  --success: #34d399;
  --warning: #fbbf24;
  --error: #f87171;
}
```

**Color Rules:**
- 모든 색 CSS 변수로. 컴포넌트 내 hard-coded hex 금지.
- 페이지 메인은 **다크 (`--bg`)**. light 섹션(Stats, Transparency, Risk Reversal)은 *대비 의도* 일 때만.
- 액센트 한 페이지에 **2색 이하** (`--accent` cyan-teal + `--accent-soft` lime). 노랑·보라·핑크 절대 X.
- Hover/focus 강조 = `--accent-glow` (cyan glow). 박스 그림자보다 *빛* 으로 깊이 표현.

---

## 3. Typography Rules

**Font Stack:**
```css
/* Pretendard (한국어 본문) — 이미 layout.tsx <link>로 로드 */
/* Space Grotesk (영문/숫자 헤딩) — 추가 import 필요 */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&display=swap');
```

| Role | Font | Size (lg) | Weight | Line-Height | Letter-Spacing |
|---|---|---|---|---|---|
| Hero H1 (KR) | Pretendard | 4.5rem | 800 | 1.05 | -0.035em |
| Hero H1 (EN/숫자) | Space Grotesk | inherit | 700 | inherit | -0.045em |
| Section H2 | Pretendard | 3rem | 800 | 1.1 | -0.03em |
| H3 | Pretendard | 1.5rem | 700 | 1.25 | -0.015em |
| Body | Pretendard | 1.0625rem | 400 | 1.65 | 0 |
| Body large | Pretendard | 1.1875rem | 400 | 1.6 | 0 |
| Label / Eyebrow | Space Grotesk | 0.75rem | 700 | 1 | 0.18em uppercase |
| Mono / Stat | Space Grotesk | varies | 700 | 1 | -0.02em |

**Typography Rules:**
- 한국어 본문 line-height ≥ 1.65, letter-spacing 0 (Pretendard 자체 자간 균형 OK)
- 영문/숫자에 Space Grotesk → 라벨·통계·UI 코드 같은 느낌 + 한국어 본문과 자연스러운 대조
- **NEVER use**: Helvetica/Arial (Pretendard 사용 중) · Serif (Editorial 톤이지만 cyber/playful 아님)

**Text Decoration:**
- Hero H1: 그라데이션 X (절제). 노란 highlight 절대 X.
- 일부 핵심 단어에 `--accent` 컬러 텍스트 (예: "검증", "데이터")
- 통계 숫자: Space Grotesk + cyan-teal glow on scroll-reveal

---

## 4. Component Stylings

### Buttons

```css
/* Primary — cyan-teal CTA */
.btn-primary {
  background: var(--accent);
  color: #0a0a0b;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.9375rem;
  transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px var(--accent-glow);
}
.btn-primary:active { transform: translateY(0); }
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Secondary — outlined */
.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border-hover);
  /* 나머지 동일 */
}
.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Ghost — text only */
.btn-ghost { color: var(--text-secondary); }
.btn-ghost:hover { color: var(--accent); }
```

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.75rem;
  transition: transform 220ms ease, border-color 220ms ease, background 220ms ease, box-shadow 220ms ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
  background: var(--surface-hover);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-hover) inset;
}
.card:focus-within { border-color: var(--accent); }
```

### Navigation

```css
.nav {
  position: sticky; top: 0; z-index: 40;
  background: rgba(10, 10, 11, 0.7);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  padding: 0.875rem 0;
  transition: padding 200ms ease;
}
.nav--scrolled { padding: 0.625rem 0; }  /* scroll 후 약간 압축 */
.nav a { color: var(--text-secondary); transition: color 180ms ease; }
.nav a:hover, .nav a.active { color: var(--text); }
.nav-cta { /* btn-primary 와 동일 */ }
```

### Links

```css
.link {
  color: var(--accent);
  text-decoration: none;
  position: relative;
}
.link::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -2px;
  height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: left;
  transition: transform 220ms ease;
}
.link:hover::after { transform: scaleX(1); }
```

### Tags / Badges

```css
.tag {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 9999px;
  color: var(--text-secondary);
}
.tag::before {
  content: ""; width: 6px; height: 6px;
  border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
}
```

### Stat (signature)

```css
.stat-num {
  font-family: 'Space Grotesk', 'Pretendard Variable', sans-serif;
  font-size: clamp(3rem, 7vw, 5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, var(--text) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text; background-clip: text;
  color: transparent;
}
.stat-num--accent {
  background: linear-gradient(180deg, #d6fff6 0%, var(--accent) 100%);
  -webkit-background-clip: text; background-clip: text;
}
```

---

## 5. Layout Principles

- **Container**: max-width 1200px, padding-x 1.25rem (mobile) / 2rem (desktop)
- **Narrow variant** (long-form, FAQ, founder story): max-width 760px
- **Section padding-y**: 7rem (desktop) / 4.5rem (mobile)
- **Grid**: 12-col free arrangement (`grid-cols-[1.3fr_1fr]` for Hero, `grid-cols-3` for cards, asymmetric per section)

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | none | section background |
| Subtle | `border: 1px solid var(--border)` | 기본 카드 |
| Glow | `box-shadow: 0 0 0 1px var(--border-hover) inset, 0 12px 32px rgba(0,0,0,0.25)` | hover 카드 |
| Accent Glow | `box-shadow: 0 8px 24px var(--accent-glow)` | CTA hover / focus / 통계 강조 |
| Surface Float | `box-shadow: 0 24px 60px rgba(0,0,0,0.6)` | Hero mock browser |

깊이는 *그림자* 보다 *빛(accent-glow)* + *border* 로 표현.

---

## 7. Animation & Interaction

**Motion Philosophy**: 짧고 의도적. opacity + transform 만. 1초 미만. 한 번만 reveal (반복 X).

### Entrance Animation (CSS)

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal { opacity: 0; }
.reveal.in {
  animation: fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.reveal--stagger > * { opacity: 0; }
.reveal--stagger.in > *:nth-child(1) { animation: fadeUp 700ms 0ms both cubic-bezier(0.16,1,0.3,1); }
.reveal--stagger.in > *:nth-child(2) { animation: fadeUp 700ms 80ms both cubic-bezier(0.16,1,0.3,1); }
.reveal--stagger.in > *:nth-child(3) { animation: fadeUp 700ms 160ms both cubic-bezier(0.16,1,0.3,1); }
.reveal--stagger.in > *:nth-child(4) { animation: fadeUp 700ms 240ms both cubic-bezier(0.16,1,0.3,1); }
```

### Scroll Behavior (IntersectionObserver)

```js
// 페이지 단일 client component, 모든 .reveal 요소 한 번에 옵저브
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
```

### Hero Spotlight (signature)

Hero 마우스 위치에 따라 큰 spotlight radial gradient 따라옴. pointermove rAF 스로틀.

```css
.hero-spotlight {
  background: radial-gradient(
    600px circle at var(--mx, 50%) var(--my, 0%),
    rgba(94, 234, 212, 0.12),
    transparent 50%
  );
}
```

### Mock browser 부유 chip

```css
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
.chip-float-1 { animation: float 5s ease-in-out infinite; }
.chip-float-2 { animation: float 6s ease-in-out infinite 0.5s; }
.chip-float-3 { animation: float 4.5s ease-in-out infinite 1s; }
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal.in, .reveal--stagger.in > *,
  .chip-float-1, .chip-float-2, .chip-float-3 {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  * { transition-duration: 0.01ms !important; }
}
```

### 6 Signature Moments (L2 필수)

| # | 자리 | 모티프 |
|---|---|---|
| 1 | Hero H1 | 2-layer stagger fade-up (eyebrow → h1 → sub → CTA) |
| 2 | Section H2 | scroll-triggered fadeUp 700ms |
| 3 | Body / Label | reveal--stagger (카드 내부 80ms 단계) |
| 4 | CTA / Element | cyan glow hover + 1px lift |
| 5 | Component (Stats) | 큰 숫자 gradient text + glow on reveal |
| 6 | Background (Hero) | cursor-follow spotlight (`hero-spotlight`) — pointermove rAF |

---

## 8. Do's and Don'ts

### Do
- 다크 메인 + light 섹션 대비 (Stats / Transparency / Risk Reversal 만 light)
- Accent는 `--accent` (cyan-teal) + `--accent-soft` (lime) **2색만**
- 큰 헤딩 + 충분한 line-height (1.05~1.1 헤딩 / 1.65 본문)
- 숫자·통계에 Space Grotesk + gradient text
- Hover 시 cyan glow + 1px lift (그림자 X)
- 모든 인터랙티브 요소 focus-visible 명시 outline
- 데이터·차트 시각화 (mock browser + bar chart + floating chips)

### Don't
- ❌ **노란색 사용 금지** (PPT 인상 트리거)
- ❌ 보라·핑크·다중 액센트 (cyberpunk 톤)
- ❌ 균일한 카드 grid 만 (Editorial 톤 깨짐 — 일부 섹션 raw editorial)
- ❌ 모든 섹션 동일 padding/width (비대칭 의도적)
- ❌ 큰 박스 그림자 (`shadow-lg` 등) — depth는 border + glow로
- ❌ Emoji 본문 사용 (Playful 톤 X)
- ❌ Serif (Editorial이지만 *modern* 톤)
- ❌ 반복 reveal 애니메이션 (한 번만, IO unobserve)
- ❌ 강제 모션 (reduced-motion 필수 대응)
- ❌ Logo 색상 부재 (검정 박스 + 흰 0 + cyan dot)

---

## 9. Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1024px | grid 다열, Hero 2-col, container 1200px |
| Tablet | 768-1023px | Hero 1-col 폴드, mock browser hidden, container 100% padding-x 2rem |
| Mobile | < 768px | 모든 카드 1-col, section padding-y 4.5rem, Hero H1 3rem, Nav 메뉴 hidden (CTA만) |

**Touch targets**: ≥ 44×44px (모든 버튼·메뉴·폼 컨트롤)
**Collapse strategy**: Nav 메뉴 sm: 이하 hidden / CTA 유지 / 카드 grid 자동 1-col / Hero mock 숨김

---

*100점 self-audit 적용 항목: 9 섹션 실질 내용 · 컴포넌트 5상태 · CSS 변수 + RGB · 폰트 @import + fallback · L2 reduced-motion · Do/Don't 17개 · Desktop+Tablet+Mobile 3 breakpoint*
