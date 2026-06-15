/* ─────────────────────────────────────────────────────────────
   검증 시연 사례 — 제품 목업을 이미지가 아니라 실제 JSX로 렌더.
   각 제품의 mock HTML(cases 폴더의 index.html)을 참고해 핵심 화면을 재현한다.
   선명하고 화면 크기에 맞춰 깔끔하게 보이도록 디바이스 프레임 안에 그린다.
   순수 표현용(상태/상호작용 없음) — 서버 컴포넌트로 사용 가능.
   ───────────────────────────────────────────────────────────── */

/* ── 공통 디바이스 프레임 ── */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[258px] rounded-[44px] bg-[#0e0e12] p-2.5 shadow-[0_44px_90px_-26px_rgba(0,0,0,0.55)] ring-1 ring-black/5">
      <div className="relative h-[540px] overflow-hidden rounded-[34px] bg-white">
        {/* 노치 */}
        <div className="absolute left-1/2 top-2 z-30 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-[#0e0e12]" />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? "#fff" : "#1a1a1a";
  return (
    <div
      className="flex items-center justify-between px-5 pt-3 text-[11px] font-semibold"
      style={{ color: c }}
    >
      <span>9:41</span>
      <span className="flex items-center gap-1 text-[10px]">
        <span>•••</span>
        <span>5G</span>
        <span
          className="ml-0.5 inline-block h-[10px] w-[18px] rounded-[3px] border"
          style={{ borderColor: c, background: `linear-gradient(90deg, ${c} 70%, transparent 70%)` }}
        />
      </span>
    </div>
  );
}

function BrowserFrame({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[16px] border border-white/10 bg-[#0c0c0d] shadow-[0_44px_90px_-26px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-1.5 bg-[#1b1b22] px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 truncate rounded bg-white/10 px-2.5 py-1 text-[11px] text-white/55">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── 1) 댕고 — 강아지 산책 매칭 앱 ── */

function DogoScreen() {
  const G = "#16a34a";
  return (
    <div className="flex h-full flex-col bg-[#f4f7f5] text-[#16233a]">
      <div className="flex-1 overflow-hidden">
        <div
          className="rounded-b-[26px] px-5 pb-5 pt-2"
          style={{ background: "linear-gradient(155deg,#34d399 0%,#16a34a 100%)" }}
        >
          <StatusBar dark />
          <div className="mt-3 flex items-center justify-between text-white">
            <span className="flex items-center gap-1.5 text-[15px] font-extrabold">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-[11px]">
                🐾
              </span>
              댕고
            </span>
            <span className="text-[11px] font-semibold text-white/85">📍 성수동</span>
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-[16px]">
              🐶
            </span>
            <div className="text-white">
              <p className="text-[11px] font-medium text-white/80">오늘 산책 한 번 어때요?</p>
              <p className="text-[13px] font-bold">콩이 · 말티즈 3살</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[13px] font-extrabold" style={{ color: G }}>
                지금 산책 요청하기
              </p>
              <p className="text-[10px] font-medium text-[#6b7b8c]">
                근처 댕책사 8명 대기 중
              </p>
            </div>
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-white"
              style={{ background: G }}
            >
              →
            </span>
          </div>
        </div>

        {/* 지도 */}
        <div className="mx-4 mt-3.5 h-[92px] overflow-hidden rounded-2xl border border-[#e2ece6] bg-[#eaf3ee]">
          <div className="relative h-full w-full">
            <span className="absolute left-4 top-4 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold shadow" style={{ color: G }}>민지쌤 220m</span>
            <span className="absolute right-5 top-3 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[9px] font-bold text-white shadow">현우쌤 350m</span>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold shadow" style={{ color: G }}>지우쌤 480m</span>
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-blue-500/25" style={{ background: "#3b82f6" }} />
          </div>
        </div>

        {/* 대기 중인 댕책사 */}
        <p className="mt-3.5 px-4 text-[12px] font-extrabold">지금 대기 중인 댕책사</p>
        <div className="mt-2 space-y-2 px-4">
          {[
            { i: "민", n: "민지쌤", r: "4.97", p: "12,000", c: "#22c55e", t: "소형견 전문" },
            { i: "현", n: "현우쌤", r: "4.89", p: "15,000", c: "#f59e0b", t: "대형견 가능" },
          ].map((w) => (
            <div key={w.n} className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-[13px] font-extrabold text-white" style={{ background: w.c }}>
                {w.i}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold">
                  {w.n} <span className="text-[10px] font-semibold text-[#f59e0b]">★ {w.r}</span>
                </p>
                <p className="truncate text-[9px] text-[#6b7b8c]">{w.t} · 응답 평균 3분</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-extrabold">₩{w.p}</p>
                <span className="mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold text-white" style={{ background: G }}>요청</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 바텀 네비 (flow — 콘텐츠를 덮지 않음) */}
      <div className="flex flex-shrink-0 items-center justify-around border-t border-[#e7ecf3] bg-white px-2 pb-3 pt-2 text-[8px] font-semibold text-[#9aa7b2]">
        <span style={{ color: G }}>홈</span>
        <span>댕책사</span>
        <span className="grid h-9 w-9 -translate-y-3 place-items-center rounded-full text-white shadow-lg" style={{ background: G }}>🐾</span>
        <span>내 댕댕이</span>
        <span>마이</span>
      </div>
    </div>
  );
}

/* ── 2) 맛집발견 — 동네 맛집 추천 앱 ── */

function MatjibScreen() {
  const R = "#FF4757";
  return (
    <div className="flex h-full flex-col bg-[#f6f6f8] text-[#1a1a2e]">
      <div className="flex-1 overflow-hidden">
        <div
          className="rounded-b-[26px] px-5 pb-6 pt-2"
          style={{ background: "linear-gradient(160deg,#FF4757 0%,#FF6B81 50%,#FFA502 100%)" }}
        >
          <StatusBar dark />
          <p className="mt-3 text-[11px] font-semibold text-white/85">📍 마포구 연남동</p>
          <p className="mt-2 text-[10px] font-bold text-white/80">점심 뭐 먹지?</p>
          <p className="text-[20px] font-extrabold leading-tight text-white">
            지금 내 주변
            <br />
            핫한 맛집 찾기
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 shadow">
            <span className="text-[12px] text-[#9aa7b2]">🔍</span>
            <span className="flex-1 truncate text-[11px] text-[#9aa7b2]">음식·가게·동네로 검색</span>
            <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] text-white" style={{ background: R }}>→</span>
          </div>
        </div>

        {/* 카테고리 */}
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="text-[12px] font-extrabold">카테고리</p>
          <span className="text-[10px] font-semibold text-[#9aa7b2]">전체보기</span>
        </div>
        <div className="mt-2 flex justify-between px-4">
          {[
            ["🍲", "한식", true],
            ["🍣", "일식", false],
            ["🍝", "양식", false],
            ["🥗", "샐러드", false],
            ["☕", "카페", false],
          ].map(([e, n, on]) => (
            <div key={n as string} className="flex flex-col items-center gap-1">
              <span
                className="grid h-10 w-10 place-items-center rounded-2xl text-[15px]"
                style={{ background: on ? "rgba(255,71,87,0.12)" : "#eef0f3" }}
              >
                {e}
              </span>
              <span className="text-[9px] font-semibold" style={{ color: on ? R : "#6b7b8c" }}>{n}</span>
            </div>
          ))}
        </div>

        {/* 에디터 픽 */}
        <div className="mx-4 mt-4 overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg,#1A1A2E,#2D1B69)" }}>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[9px] font-bold tracking-wide" style={{ color: "#FFA502" }}>★ EDITOR&apos;S CHOICE</p>
              <p className="mt-1 text-[13px] font-extrabold text-white">연남동 왕갈비탕</p>
              <p className="text-[9px] text-white/60">20년 전통의 진한 사골 육수</p>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white">★ 4.9</span>
          </div>
        </div>

        {/* 내 근처 맛집 */}
        <p className="mt-4 px-4 text-[12px] font-extrabold">🔥 내 근처 맛집</p>
        <div className="mt-2 flex items-center gap-2.5 px-4">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl text-[16px]" style={{ background: "rgba(255,71,87,0.12)" }}>🍣</span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold">
              스시 하나마치 <span className="rounded bg-[#FF4757] px-1 py-0.5 text-[7px] font-bold text-white align-middle">HOT</span>
            </p>
            <p className="truncate text-[9px] text-[#6b7b8c]">일식 · 연남동 · 도보 5분</p>
          </div>
          <span className="text-[11px] font-bold" style={{ color: R }}>★ 4.8</span>
        </div>
      </div>

      {/* 바텀 네비 (flow) */}
      <div className="flex flex-shrink-0 items-center justify-around border-t border-[#e7ecf3] bg-white px-2 pb-3 pt-2 text-[8px] font-semibold text-[#9aa7b2]">
        <span style={{ color: R }}>홈</span>
        <span>탐색</span>
        <span className="grid h-9 w-9 -translate-y-3 place-items-center rounded-full text-white shadow-lg" style={{ background: R }}>🔍</span>
        <span>저장</span>
        <span>마이</span>
      </div>
    </div>
  );
}

/* ── 3) SANCTUM — 회원제 벙커 멤버십 (웹, 다크 럭셔리) ── */

function SanctumScreen() {
  const GOLD = "#B49A6A";
  const serif = { fontFamily: "'Noto Serif KR','Cormorant Garamond',serif" } as const;
  return (
    <div className="relative flex h-[472px] flex-col overflow-hidden bg-[#0c0c0d] text-[#EAE7E1]">
      {/* 레이어드 배경 — 골드 비네팅 + 콘크리트 결 + 하단 페이드 */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(130% 90% at 82% -10%, rgba(180,154,106,0.18), transparent 55%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 64px)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: "linear-gradient(to top, #0c0c0d, transparent)" }}
      />

      {/* 네비 */}
      <div className="relative flex flex-shrink-0 items-center justify-between border-b border-white/10 px-7 py-4">
        <span className="text-[15px] font-medium tracking-[0.34em]" style={serif}>
          SANCTUM
        </span>
        <nav className="hidden items-center gap-4 text-[10.5px] tracking-wide text-[#C7C4BD] md:flex">
          <span>소개</span>
          <span>시설</span>
          <span>멤버십</span>
          <span>거점</span>
        </nav>
        <span
          className="whitespace-nowrap rounded-sm border px-3 py-1.5 text-[10px] font-semibold tracking-wide"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          멤버십 신청
        </span>
      </div>

      {/* 히어로 */}
      <div className="relative flex flex-1 flex-col justify-center px-8">
        <div className="flex items-center gap-2.5">
          <span className="h-px w-7" style={{ background: GOLD }} />
          <p className="text-[10px] font-semibold tracking-[0.32em]" style={{ color: GOLD }}>
            PRIVATE UNDERGROUND BUNKER
          </p>
        </div>
        <h2 className="mt-4 text-[33px] font-medium leading-[1.18]" style={serif}>
          상위 1%의 안전,
          <br />
          완벽하게 통제된{" "}
          <em className="italic" style={{ color: GOLD }}>
            평온.
          </em>
        </h2>
        <p className="mt-4 max-w-[20rem] text-[12px] leading-relaxed text-[#8C8A85]">
          위급한 순간, 나와 가족이 향할 단 하나의 장소. 연 1,000만 원
          회원권으로 전국 거점 벙커의 자리를 확보하세요.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <span
            className="rounded-sm px-5 py-2.5 text-[11px] font-semibold tracking-wide text-[#0c0c0d] shadow-[0_10px_30px_-10px_rgba(180,154,106,0.6)]"
            style={{ background: GOLD }}
          >
            입회 자격 심사 신청
          </span>
          <span className="rounded-sm border border-white/25 px-5 py-2.5 text-[11px] font-semibold tracking-wide text-[#EAE7E1]">
            서비스 소개
          </span>
        </div>
      </div>

      {/* 하단 신뢰 스트립 */}
      <div className="relative flex flex-shrink-0 items-center gap-3 border-t border-white/10 px-8 py-3.5 text-[9.5px] font-medium tracking-[0.18em] text-[#8C8A85]">
        <span>전국 5개 거점</span>
        <span style={{ color: GOLD }}>·</span>
        <span>회원 정원 한정</span>
        <span style={{ color: GOLD }}>·</span>
        <span>24시간 대응</span>
      </div>
    </div>
  );
}

/* ── 4) 득템잡이 — 실제 제품 UI 그대로 재현 (다크 피드, 차익순) ──
   참고: 미뇨이/mvp 실제 피드 화면(다크 테마, 돼지 로고, 카테고리 칩, 차익 카드). */

function PiggyMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <rect width="100" height="100" rx="22" fill="#0064FF" />
      <circle cx="50" cy="52" r="36" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" opacity="0.45" />
      <path d="M28 40 L34 32 L38 48 Z" fill="#fff" />
      <path d="M72 40 L66 32 L62 48 Z" fill="#fff" />
      <circle cx="50" cy="58" r="23" fill="#fff" />
      <circle cx="42" cy="55" r="2.4" fill="#0064FF" />
      <circle cx="58" cy="55" r="2.4" fill="#0064FF" />
      <ellipse cx="50" cy="65" rx="10" ry="6" fill="#0064FF" opacity="0.18" />
    </svg>
  );
}

function ResaleScreen() {
  const GREEN = "#34d399";
  const items = [
    { img: "/cases/airpods.jpg", cond: "거의새것", n: "에어팟 프로 2세대", gain: "67,000", pct: "38", buy: "178,000", market: "245,000", meta: "2시간 전 · 번개장터" },
    { img: "/cases/newbalance.jpg", cond: "S급", n: "뉴발란스 993", gain: "58,000", pct: "63", buy: "92,000", market: "150,000", meta: "1일 전 · 당근마켓 · 2.1km" },
    { img: "/cases/drmartens.webp", cond: "상태좋음", n: "닥터마틴 1460", gain: "44,000", pct: "65", buy: "68,000", market: "112,000", meta: "4일 전 · 중고나라" },
  ];
  return (
    <div className="flex h-full flex-col" style={{ background: "#0e1117", color: "#e9edf3" }}>
      <div className="flex-1 overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 pb-3 pt-2" style={{ borderBottom: "1px solid #1c2330" }}>
          <StatusBar dark />
          <div className="mt-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PiggyMark size={20} />
              <span className="text-[15px] font-extrabold text-white">득템잡이</span>
            </span>
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#e6b04a,#cf8f2e)" }}
            >
              민
            </span>
          </div>
          {/* 카테고리 칩 */}
          <div className="mt-3 flex gap-1.5 overflow-hidden">
            {[
              ["스크랩 2", true],
              ["이어폰", false],
              ["폰", false],
              ["태블릿", false],
            ].map(([t, on]) => (
              <span
                key={t as string}
                className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={
                  on
                    ? { background: "#0064FF", color: "#fff" }
                    : { background: "#161c27", color: "#8b95a1", border: "1px solid #232b38" }
                }
              >
                {t}
              </span>
            ))}
          </div>
          {/* 정렬/필터 */}
          <div className="mt-2 flex gap-1.5 text-[10px] font-semibold text-[#c2cad6]">
            {["15만원 ↓", "출처 전체", "차익순 ↓"].map((t) => (
              <span key={t} className="rounded-md px-2 py-1" style={{ background: "#161c27", border: "1px solid #232b38" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 차익 매물 카드 */}
        <div className="space-y-2.5 px-4 pt-3">
          {items.map((it) => (
            <div key={it.n} className="rounded-2xl p-3" style={{ background: "#181e29" }}>
              <div className="flex gap-2.5">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-[#222a36]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.img} alt={it.n} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 py-0.5 text-[7px] font-bold text-white/90">
                    {it.cond}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold leading-tight text-[#e9edf3]">{it.n}</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-[16px] font-extrabold" style={{ color: GREEN }}>
                      +{it.gain}원
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: GREEN }}>+{it.pct}%</span>
                  </div>
                  <p className="mt-0.5 truncate text-[9px] text-[#8b95a1]">
                    매입가 {it.buy} · 시세 {it.market}
                  </p>
                  <p className="mt-1 truncate text-[8px] text-[#6b7684]">{it.meta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 바텀 네비 (flow) */}
      <div
        className="flex flex-shrink-0 items-center justify-around px-2 pb-3 pt-2 text-[8px] font-semibold text-[#6b7684]"
        style={{ borderTop: "1px solid #1c2330", background: "#0e1117" }}
      >
        <span className="text-[#3182f6]">홈</span>
        <span>탐색</span>
        <span>스크랩</span>
        <span>내 정보</span>
      </div>
    </div>
  );
}

/* ── 5) 온라인 강의 페이크도어 — 녹화 전에 '수강신청'으로 수요 측정 ──
   3종(바이브코딩 GO / AI자동수익 NO-GO / AI영상자동화 PIVOT)을 같은 레이아웃으로 파라미터화. */

type Course = {
  accent: string;
  soft: string;
  grad: string;
  tag: string;
  title: [string, string];
  sub: string;
  instr: [string, string];
  curr: [string, string, string];
  price: string;
  priceLabel: string;
  emoji: string;
};

const COURSES: Record<string, Course> = {
  notion: {
    accent: "#6d28d9",
    soft: "#f1ecfe",
    grad: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    tag: "사전 모집 · 선착순 50명",
    title: ["코딩 0에서", "AI로 앱 출시하기"],
    sub: "커서·클로드코드로 직접 · 영상 14강 + 실습 레포",
    instr: ["김도현 · 바이브코더", "비개발 출신 · 앱 3개 런칭"],
    curr: ["AI로 기획→코드", "실서비스 배포", "수익화 연결"],
    price: "99,000원",
    priceLabel: "얼리버드",
    emoji: "🧑‍💻",
  },
  english: {
    accent: "#0284c7",
    soft: "#e0f2fe",
    grad: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
    tag: "사전 모집",
    title: ["AI로 월 500,", "자동 수익화"],
    sub: "노코드 자동화로 부수익 · 영상 18강",
    instr: ["이주영 · AI 부업 멘토", "디지털 노마드 5년"],
    curr: ["AI 수익 모델 찾기", "자동화 파이프라인", "수익 자동화"],
    price: "129,000원",
    priceLabel: "얼리버드",
    emoji: "💸",
  },
  coding: {
    accent: "#ea580c",
    soft: "#ffedd5",
    grad: "linear-gradient(135deg,#f97316,#fb923c)",
    tag: "1기 모집 · 15명 한정",
    title: ["AI로 유튜브 쇼츠", "100개 자동 양산"],
    sub: "클로드코드 + 자동화 파이프라인 · 라이브 6주",
    instr: ["정우성 · 자동화 크리에이터", "채널 5개 운영"],
    curr: ["대본·영상 자동 생성", "업로드 자동화", "수익 채널 세팅"],
    price: "690,000원",
    priceLabel: "1기 특가",
    emoji: "🎬",
  },
};

function CourseScreen({ c }: { c: Course }) {
  const V = c.accent;
  return (
    <div className="flex h-full flex-col bg-white text-[#1a1a2e]">
      <div className="flex-1 overflow-hidden">
        <div className="px-5 pb-3 pt-2">
          <StatusBar />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[14px] font-extrabold" style={{ color: V }}>클래스밋</span>
            <span className="text-[11px] font-medium text-[#9ca3af]">로그인</span>
          </div>
        </div>
        {/* 썸네일 */}
        <div className="mx-5 flex h-24 items-end rounded-2xl p-3" style={{ background: c.grad }}>
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold text-white">{c.tag}</span>
        </div>
        <div className="px-5 pt-3.5">
          <h3 className="text-[17px] font-extrabold leading-tight">
            {c.title[0]}
            <br />
            {c.title[1]}
          </h3>
          <p className="mt-1.5 text-[11px] text-[#6b7280]">{c.sub}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full text-[13px]" style={{ background: c.soft }}>{c.emoji}</span>
            <div>
              <p className="text-[11px] font-bold">{c.instr[0]}</p>
              <p className="text-[9px] text-[#9ca3af]">{c.instr[1]}</p>
            </div>
          </div>
          <div className="mt-3.5 space-y-1.5">
            {c.curr.map((cu, i) => (
              <div key={cu} className="flex items-center gap-2 rounded-lg border border-[#eef0f3] px-2.5 py-2">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold" style={{ background: c.soft, color: V }}>
                  {i + 1}
                </span>
                <span className="text-[11px] font-semibold">{cu}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 가격 + 수강신청 (하단 고정 = 페이크도어 측정 지점) */}
      <div className="flex-shrink-0 border-t border-[#eef0f3] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-medium text-[#9ca3af]">{c.priceLabel}</p>
            <p className="text-[16px] font-extrabold" style={{ color: V }}>{c.price}</p>
          </div>
          <button className="rounded-xl px-6 py-3 text-[13px] font-bold text-white" style={{ background: V }}>
            수강신청
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 디스패처 ── */

export function CaseVisual({ slug }: { slug: string }) {
  if (slug.startsWith("course")) {
    const key =
      slug === "course-english"
        ? "english"
        : slug === "course-coding"
          ? "coding"
          : "notion";
    return (
      <PhoneFrame>
        <CourseScreen c={COURSES[key]} />
      </PhoneFrame>
    );
  }
  if (slug === "dogo")
    return (
      <PhoneFrame>
        <DogoScreen />
      </PhoneFrame>
    );
  if (slug === "matjib")
    return (
      <PhoneFrame>
        <MatjibScreen />
      </PhoneFrame>
    );
  if (slug === "resale")
    return (
      <PhoneFrame>
        <ResaleScreen />
      </PhoneFrame>
    );
  return (
    <BrowserFrame url="sanctum.kr">
      <SanctumScreen />
    </BrowserFrame>
  );
}
