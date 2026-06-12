"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

/** 내 검증 현황 — 카카오 로그인(Supabase) 또는 진행 코드 */
function DashboardEntryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const loginError = params.get("login_error");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo },
      });
      // 성공 시 브라우저가 카카오로 이동하므로 busy 유지. 실패만 처리.
      if (error) {
        setBusy(false);
        router.push(`/d?login_error=${encodeURIComponent(error.message.slice(0, 90))}`);
      }
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : String(e);
      router.push(`/d?login_error=${encodeURIComponent(msg.slice(0, 90))}`);
    }
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
