"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MyLead = {
  code: string;
  idea: string;
  stage: string;
  tone: "action" | "progress" | "done" | "closed" | "neutral";
};

const TONE_CLASS: Record<MyLead["tone"], string> = {
  action: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  progress: "bg-accent/10 text-accent ring-accent/20",
  done: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  closed: "bg-text-tertiary/10 text-text-tertiary ring-text-tertiary/20",
  neutral: "bg-text-secondary/10 text-text-secondary ring-text-secondary/20",
};

function StatusBadge({ stage, tone }: { stage: string; tone: MyLead["tone"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${TONE_CLASS[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {stage}
    </span>
  );
}

function LinkForm({
  hasPhone,
  onLinked,
  compact,
}: {
  hasPhone: boolean;
  onLinked: () => void;
  compact: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [linking, setLinking] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function link(e: React.FormEvent) {
    e.preventDefault();
    setLinking(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      if (data.linked > 0) {
        setMsg({ text: `${data.linked}건의 신청을 연결했습니다.`, ok: true });
        onLinked();
      } else {
        setMsg({
          text: "그 번호로 접수된 신청을 찾지 못했습니다. 신청 시 입력한 번호가 맞는지 확인해주세요.",
          ok: false,
        });
      }
    } catch {
      setMsg({ text: "연결에 실패했습니다. 잠시 후 다시 시도해주세요.", ok: false });
    } finally {
      setLinking(false);
    }
  }

  const body = (
    <>
      <p className="text-xs leading-relaxed text-text-secondary">
        검증 신청 때 입력한 휴대폰 번호를 넣으면, 그 번호로 접수된 신청을 이
        계정에 연결합니다.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-1234-5678"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3.5 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          disabled={linking || phone.trim().length < 9}
          className="flex-shrink-0 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {linking ? "연결 중" : "연결"}
        </button>
      </div>
      {msg && (
        <p
          className={`mt-2.5 text-xs leading-relaxed ${msg.ok ? "text-emerald-600" : "text-text-secondary"}`}
        >
          {msg.text}
        </p>
      )}
    </>
  );

  // 신청이 있는 경우엔 보조 기능이라 접어둔다. 없으면 펼친 상태로 강조.
  if (compact) {
    return (
      <details className="group rounded-2xl border border-border bg-surface px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-text-secondary">
          다른 번호로 신청한 게 있나요?
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-text-tertiary transition group-open:rotate-180"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <form onSubmit={link} className="mt-3">
          {body}
        </form>
      </details>
    );
  }

  return (
    <form onSubmit={link} className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-bold text-text">
        {hasPhone ? "다른 번호로 신청한 게 있나요?" : "신청한 검증 불러오기"}
      </p>
      <div className="mt-1.5">{body}</div>
    </form>
  );
}

export default function MyLeads({
  leads,
  hasPhone,
}: {
  leads: MyLead[];
  hasPhone: boolean;
}) {
  const router = useRouter();
  const hasLeads = leads.length > 0;

  return (
    <div className="space-y-4">
      {hasLeads ? (
        <div className="space-y-3">
          {leads.map((l) => (
            <a
              key={l.code}
              href={`/d/${l.code}`}
              className="group block rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_10px_-6px_rgba(4,12,28,0.18)] transition hover:-translate-y-0.5 hover:border-border-hover hover:shadow-[0_16px_36px_-18px_rgba(4,12,28,0.45)]"
            >
              <div className="flex items-center justify-between gap-3">
                <StatusBadge stage={l.stage} tone={l.tone} />
                <span className="font-mono text-[11px] tracking-wider text-text-tertiary">
                  {l.code}
                </span>
              </div>
              <p className="mt-3 break-words text-[15px] font-bold leading-relaxed text-text line-clamp-2">
                {l.idea}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border-light pt-3">
                <span className="text-xs font-semibold text-text-tertiary transition group-hover:text-accent">
                  현황 보기
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm font-bold text-text">
            아직 연결된 검증 신청이 없습니다
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
            아래에 신청 때 입력한 번호를 넣어 불러오거나, 새 아이디어로 검증을
            시작해보세요.
          </p>
        </div>
      )}

      <LinkForm
        hasPhone={hasPhone}
        compact={hasLeads}
        onLinked={() => router.refresh()}
      />
    </div>
  );
}
