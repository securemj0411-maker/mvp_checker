import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "./auth";
import { login, logout } from "./actions";
import LeadBoard, { type Lead } from "./LeadBoard";

// 쿠키 + service_role 사용 — 절대 캐시/정적화 금지
export const dynamic = "force-dynamic";

export const metadata = {
  title: "비즈필터 — 리드 관리자",
  robots: { index: false, follow: false },
};

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
      "id, created_at, name, email, phone, idea, idea_refined, status, memo, source, utm_source, service_type, audience, revenue_model, build_status, price_band, alternative, region, location, page_url, page_measurable, page_tag_verified_at, access_code, tier, brief, brief_confirmed_at, deposit_due_at, ai_report, policy_flag, interpret_status, ad_stats",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const leads = (data ?? []) as Lead[];

  return (
    <main className="min-h-screen bg-bg px-5 py-10 text-text">
      <div className="mx-auto max-w-[1200px]">
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

        <LeadBoard leads={leads} />
      </div>
    </main>
  );
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
          className="mt-5 w-full rounded-md border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-accent"
          placeholder="비밀번호"
        />
        {error && (
          <p className="mt-2 text-xs font-medium text-red-500">
            비밀번호가 올바르지 않습니다.
          </p>
        )}
        <button className="mt-4 w-full rounded-md bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-hover">
          로그인
        </button>
      </form>
    </main>
  );
}
