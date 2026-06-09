"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Status = "idle" | "submitting" | "success" | "error";

export default function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const { error } = await getSupabase().from("o2o_leads").insert({
      name: name.trim(),
      email: email.trim(),
      idea: idea.trim(),
      budget,
      source: "landing",
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.error("[lead submit error]", error);
      setErrorMsg(
        "제출 중 문제가 생겼어요. 잠시 후 다시 시도해주세요. 계속 문제면 카톡 채널로 직접 연락 주세요.",
      );
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-2xl font-semibold">신청이 접수됐어요.</p>
        <p className="mt-3 text-neutral-600">
          24시간 안에 검토 후 직접 연락드립니다.
        </p>
        <p className="mt-6 text-sm text-neutral-500">
          더 빠르게: 카카오톡 채널에서 바로 상담 가능 (채널 준비 중)
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          이름
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
          placeholder="홍길동"
          maxLength={100}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          이메일
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
          placeholder="you@example.com"
          maxLength={254}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          사업 아이디어 (한 줄)
        </label>
        <input
          required
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
          placeholder="예: 직장인 점심 단체주문 자동화 서비스"
          maxLength={1000}
        />
        <p className="mt-2 text-xs text-neutral-500">
          한 줄로 못 적으시면 아직 우리 단계가 아닐 수 있어요. 솔직하게.
        </p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          예산대
        </label>
        <select
          required
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900"
        >
          <option value="">선택해주세요</option>
          <option value="quick">Quick 검증 (50만 / 7일)</option>
          <option value="deep">Deep 검증 (130만 / 14일)</option>
          <option value="unsure">잘 모르겠음 — 상담 후 결정</option>
        </select>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-neutral-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {status === "submitting" ? "보내는 중..." : "검증 신청"}
      </button>
      <p className="text-center text-xs text-neutral-500">
        24시간 내 직접 연락드립니다 · 광고/마케팅 이메일 보내지 않습니다
      </p>
    </form>
  );
}
