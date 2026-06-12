"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 내 검증 현황 — 접근 코드 입력 (로그인 없음) */
export default function DashboardEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    if (normalized.length >= 8) router.push(`/d/${normalized}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="cold-panel w-full max-w-md rounded-lg p-8">
        <h1 className="text-xl font-bold text-text">내 검증 현황 보기</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          설계서를 받을 때 발급된 진행 코드를 입력하세요. 로그인은 없습니다.
        </p>
        <form onSubmit={go} className="mt-5 space-y-3">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="예: A2K4-MN8P"
            maxLength={12}
            className="w-full rounded-md border border-border bg-surface-light px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-text placeholder:tracking-normal placeholder:text-text-tertiary outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={code.trim().replace(/\s/g, "").length < 8}
            className="w-full rounded-md bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            진행 현황 열기
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-text-tertiary">
          코드를 잃어버리셨다면 카카오톡 채널로 알려주세요.
        </p>
      </div>
    </main>
  );
}
