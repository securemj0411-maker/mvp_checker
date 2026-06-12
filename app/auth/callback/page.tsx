"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * 카카오 로그인 콜백 — 브라우저에서 직접 PKCE 교환.
 *
 * 서버 라우트에서 교환하면 code_verifier 쿠키가 cross-site 리다이렉트로
 * "전송"돼야 하는데(SameSite/host 제약), 여기서는 verifier 를 만든 그
 * 브라우저가 document.cookie 에서 바로 읽어 교환하므로 그 제약을 우회한다.
 */
function CallbackInner() {
  const router = useRouter();
  const [msg, setMsg] = useState("로그인 처리 중…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const url = new URL(window.location.href);
      const qp = url.searchParams;
      // 카카오/Supabase 가 에러를 query 또는 hash 로 줄 수 있다.
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errParam =
        qp.get("error_description") ||
        qp.get("error") ||
        hash.get("error_description") ||
        hash.get("error");
      if (errParam) {
        router.replace(`/d?login_error=${encodeURIComponent(errParam.slice(0, 90))}`);
        return;
      }

      const code = qp.get("code");
      const next = qp.get("next") || "/d/me";
      const link = qp.get("link");
      if (!code) {
        router.replace("/d?login_error=no_code");
        return;
      }

      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        router.replace(
          `/d?login_error=${encodeURIComponent((error?.message || "exchange_failed").slice(0, 90))}`,
        );
        return;
      }

      // 설계서 직후 들어온 경우, 방금 만든 신청을 이 계정에 연결
      if (link) {
        setMsg("신청 정보를 연결하는 중…");
        try {
          await fetch("/api/auth/link-code", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code: link }),
          });
        } catch {
          // 연결 실패해도 로그인 자체는 성공이므로 계속 진행
        }
      }

      setMsg("완료! 이동합니다…");
      // 서버 컴포넌트(/d/me)가 새 세션 쿠키를 확실히 읽도록 전체 내비게이션
      window.location.assign(next);
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-text-secondary">{msg}</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
