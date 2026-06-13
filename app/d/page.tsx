"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

/** 내 검증 현황 — 카카오 로그인(Supabase) 또는 진행 코드 */
function DashboardEntryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const loginError = params.get("login_error");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  // 이미 로그인된 사람이 "내 검증 현황"으로 들어오면 로그인 화면을 다시
  // 보여주지 말고 곧장 목록(/d/me)으로 보낸다. 세션 확인이 끝날 때까지는
  // 로그인 폼을 깜빡 노출하지 않도록 스피너만 보여준다.
  const [checking, setChecking] = useState(!loginError);

  useEffect(() => {
    if (loginError) return; // 방금 로그인 실패 → 폼을 바로 보여준다
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) {
          router.replace("/d/me");
          return;
        }
      } catch {
        /* 세션 확인 실패 시엔 그냥 로그인 폼을 보여준다 */
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loginError, router]);

  function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    if (normalized.length >= 8) router.push(`/d/${normalized}`);
  }

  async function kakao() {
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=/d/me`;
      // skipBrowserRedirect: URL만 받아 우리가 직접 이동(=제어 가능 + 타임아웃).
      // signInWithOAuth 가 멈추면 8초 뒤 에러를 띄워 "이동 중..." 무한정지 방지.
      const result = await Promise.race([
        supabase.auth.signInWithOAuth({
          provider: "kakao",
          options: { redirectTo, skipBrowserRedirect: true },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("login_timeout")), 8000),
        ),
      ]);
      if (result.error) throw result.error;
      if (!result.data?.url) throw new Error("no_oauth_url");
      window.location.assign(result.data.url);
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : String(e);
      router.push(`/d?login_error=${encodeURIComponent(msg.slice(0, 90))}`);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="cold-panel w-full max-w-md rounded-lg p-8">
        <h1 className="text-xl font-bold text-text">내 검증 현황</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          로그인하면 신청하신 검증을 한곳에서 보실 수 있습니다.
        </p>

        {loginError && (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            로그인에 실패했습니다. 다시 시도해주세요. (코드: {loginError})
          </div>
        )}

        <button
          type="button"
          onClick={kakao}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-base font-bold transition hover:brightness-95 disabled:opacity-60"
          style={{ background: "#FEE500", color: "#191600" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.7-2.5.6.1 1.3.1 2 .1 5.5 0 10-3.5 10-7.8C22 6.5 17.5 3 12 3z" />
          </svg>
          {busy ? "이동 중..." : "카카오로 로그인"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-text-tertiary">
          <span className="h-px flex-1 bg-border" />
          또는 진행 코드로 바로 보기
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={go} className="space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="예: A2K4-MN8P"
            maxLength={12}
            className="w-full rounded-md border border-border bg-surface-light px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-text placeholder:tracking-normal placeholder:text-text-tertiary outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={code.trim().replace(/\s/g, "").length < 8}
            className="w-full rounded-md border border-border bg-surface-light px-6 py-3.5 text-base font-bold text-text transition hover:border-accent disabled:opacity-40"
          >
            코드로 열기
          </button>
        </form>
      </div>
    </main>
  );
}

export default function DashboardEntry() {
  return (
    <Suspense fallback={null}>
      <DashboardEntryInner />
    </Suspense>
  );
}
