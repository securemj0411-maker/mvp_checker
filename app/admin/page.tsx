import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "./auth";
import { login, logout, updateLead } from "./actions";

// 쿠키 + service_role 사용 — 절대 캐시/정적화 금지
export const dynamic = "force-dynamic";

export const metadata = {
  title: "비즈필터 — 리드 관리자",
  robots: { index: false, follow: false },
};

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  idea: string;
  status: string;
  memo: string | null;
  source: string | null;
  utm_source: string | null;
  service_type: string | null;
  audience: string | null;
  revenue_model: string | null;
  stage: string | null;
  fear: string | null;
};

const LABEL = {
  service: {
    web: "웹 서비스",
    app: "모바일 앱",
    commerce: "온라인 판매",
    offline: "오프라인",
    unknown: "형태 미정",
  } as Record<string, string>,
  audience: {
    b2c: "소비자",
    b2b: "회사·사장님",
    both: "둘 다/모름",
  } as Record<string, string>,
  revenue: {
    once: "단건 결제",
    subscription: "월 구독",
    fee: "광고·수수료",
    undecided: "미정",
  } as Record<string, string>,
  stage: {
    idea: "아이디어만",
    planning: "기획 중",
    builder: "직접 만들 수 있음",
    built: "만들었는데 손님 없음",
  } as Record<string, string>,
  fear: {
    demand: "수요",
    unit: "수익 구조",
    cac: "광고비",
    all: "전부 다",
    priority: "순서 모름",
  } as Record<string, string>,
};

function L(map: Record<string, string>, v: string | null) {
  if (!v) return "—";
  return map[v] ?? v;
}

/* 파이프라인 단계 — 영업(신규→결제)과 딜리버리(제작→납품)를 한 축으로 */
const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "신규", cls: "bg-bg-alt text-text-secondary" },
  contacted: { label: "연락중", cls: "bg-bg-light text-accent" },
  consulted: { label: "상담완료", cls: "bg-bg-light text-accent" },
  paid: { label: "결제완료", cls: "bg-[#E4F7EF] text-[#06A86B]" },
  build: { label: "제작중", cls: "bg-[#FBF1DE] text-[#A86A12]" },
  live: { label: "광고집행", cls: "bg-[#FBF1DE] text-[#A86A12]" },
  verdict: { label: "판정·납품", cls: "bg-[#E4F7EF] text-[#06A86B]" },
  won: { label: "완료", cls: "bg-[#E4F7EF] text-[#06A86B]" },
  lost: { label: "미진행", cls: "bg-bg-alt text-text-tertiary" },
};

function planFor(fear: string | null) {
  return fear === "all" || fear === "unit" || fear === "cac"
    ? "Quick→Deep"
    : "Quick";
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const authed = await isAdmin();
  const { e } = await searchParams;

  if (!authed) {
    return <LoginScreen error={e === "1"} />;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("o2o_leads")
    .select(
      "id, created_at, name, email, phone, idea, status, memo, source, utm_source, service_type, audience, revenue_model, stage, fear",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const leads = (data ?? []) as Lead[];
  const hot = leads.filter((l) => l.stage === "built").length;
  const builders = leads.filter(
    (l) => l.stage === "builder" || l.stage === "built",
  ).length;
  const fromYoutube = leads.filter((l) => l.utm_source === "youtube").length;

  return (
    <main className="min-h-screen bg-bg px-5 py-10 text-text">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">리드 관리자</h1>
            <p className="mt-1 text-sm text-text-secondary">
              비즈필터 검증 신청 현황
            </p>
          </div>
          <form action={logout}>
            <button className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-border-hover hover:text-text">
              로그아웃
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            데이터 조회 실패: {error.message}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-2xl sm:grid-cols-4">
          <Stat label="전체 리드" value={leads.length} />
          <Stat label="핫리드" value={hot} hint="만들었는데 손님 없음" />
          <Stat label="빌더" value={builders} hint="직접 개발 가능" />
          <Stat label="유튜브 유입" value={fromYoutube} hint="/yt 링크 경유" />
        </div>

        {/* 파이프라인 요약 */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {Object.entries(STATUS).map(([k, s]) => {
            const n = leads.filter((l) => (l.status ?? "new") === k).length;
            if (n === 0) return null;
            return (
              <span
                key={k}
                className={`rounded-full px-3 py-1.5 font-bold ${s.cls}`}
              >
                {s.label} {n}
              </span>
            );
          })}
        </div>

        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
                <Th>접수</Th>
                <Th>유입</Th>
                <Th>이름</Th>
                <Th>연락처</Th>
                <Th>아이디어</Th>
                <Th>형태</Th>
                <Th>대상</Th>
                <Th>수익</Th>
                <Th>단계</Th>
                <Th>최우선</Th>
                <Th>추천</Th>
                <Th>상태 · 메모</Th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-12 text-center text-text-tertiary"
                  >
                    아직 신청이 없습니다.
                  </td>
                </tr>
              )}
              {leads.map((l) => {
                const isHot = l.stage === "built";
                return (
                  <tr
                    key={l.id}
                    className={`border-b border-border align-top ${isHot ? "bg-accent/[0.05]" : ""}`}
                  >
                    <Td className="whitespace-nowrap text-text-tertiary">
                      {fmtKST(l.created_at)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {l.utm_source === "youtube" ? (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                          유튜브
                        </span>
                      ) : (
                        <span className="text-text-tertiary">
                          {l.utm_source ?? "—"}
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap font-semibold">
                      {l.name}
                      {isHot && (
                        <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                          HOT
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {l.email}
                      {l.phone && (
                        <span className="mt-0.5 block text-xs font-semibold text-accent">
                          📞 {l.phone}
                        </span>
                      )}
                    </Td>
                    <Td className="max-w-[280px] text-text-secondary">
                      {l.idea}
                    </Td>
                    <Td>{L(LABEL.service, l.service_type)}</Td>
                    <Td>{L(LABEL.audience, l.audience)}</Td>
                    <Td>{L(LABEL.revenue, l.revenue_model)}</Td>
                    <Td
                      className={
                        l.stage === "builder" || l.stage === "built"
                          ? "font-medium text-accent"
                          : ""
                      }
                    >
                      {L(LABEL.stage, l.stage)}
                    </Td>
                    <Td>{L(LABEL.fear, l.fear)}</Td>
                    <Td className="whitespace-nowrap font-semibold">
                      {planFor(l.fear)}
                    </Td>
                    <Td className="min-w-[220px]">
                      <span
                        className={`mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${(STATUS[l.status ?? "new"] ?? STATUS.new).cls}`}
                      >
                        {(STATUS[l.status ?? "new"] ?? STATUS.new).label}
                      </span>
                      <form action={updateLead} className="space-y-1.5">
                        <input type="hidden" name="id" value={l.id} />
                        <select
                          name="status"
                          defaultValue={l.status ?? "new"}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
                        >
                          {Object.entries(STATUS).map(([k, s]) => (
                            <option key={k} value={k}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <textarea
                          name="memo"
                          defaultValue={l.memo ?? ""}
                          placeholder="상담 메모"
                          rows={2}
                          className="w-full resize-y rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
                        />
                        <button className="w-full rounded-md bg-accent px-2 py-1.5 text-xs font-bold text-white transition hover:bg-accent-hover">
                          저장
                        </button>
                      </form>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-text-tertiary">
          최근 500건 · KST 기준 · source: landing(구폼) / landing-quiz(현재)
        </p>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-text-tertiary">{hint}</p>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function LoginScreen({ error }: { error: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-text">
      <form
        action={login}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8"
      >
        <h1 className="text-xl font-bold tracking-tight">비즈필터 관리자</h1>
        <p className="mt-1 text-sm text-text-secondary">
          비밀번호를 입력하세요.
        </p>
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="비밀번호"
          className="mt-5 w-full rounded-md border border-border bg-surface-light px-4 py-3 text-text outline-none transition focus:border-accent"
        />
        {error && (
          <p className="mt-3 text-sm text-red-500">
            비밀번호가 올바르지 않습니다.
          </p>
        )}
        <button className="mt-5 w-full rounded-md bg-accent px-6 py-3 text-base font-bold text-white transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          로그인
        </button>
      </form>
    </main>
  );
}
