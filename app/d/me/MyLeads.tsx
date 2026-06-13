"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export type MyLead = {
  code: string;
  idea: string;
  stage: string;
  tone: "action" | "progress" | "done" | "closed" | "neutral";
};

/* 메인페이지 판정 컬러 시스템과 동일한 팔레트를 상태 칩에 재사용 */
const TONE_STYLE: Record<MyLead["tone"], { color: string; background: string }> =
  {
    action: { color: "#E08A00", background: "#FBF1DE" },
    progress: { color: "var(--accent)", background: "var(--bg-light)" },
    done: { color: "#06A86B", background: "#E4F7EF" },
    closed: { color: "var(--text-tertiary)", background: "var(--bg-alt)" },
    neutral: { color: "var(--text-secondary)", background: "var(--bg-alt)" },
  };

export default function MyLeads({
  leads,
  hasPhone,
}: {
  leads: MyLead[];
  hasPhone: boolean;
}) {
  const router = useRouter();
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
        router.refresh();
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

  return (
    <div className="space-y-3">
      {leads.length > 0 ? (
        leads.map((l) => (
          <a
            key={l.code}
            href={`/d/${l.code}`}
            className="group flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-26px_rgba(10,23,38,0.3)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[16px] font-bold leading-snug text-text line-clamp-2">
                {l.idea}
              </p>
              <span
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold"
                style={TONE_STYLE[l.tone]}
              >
                {l.stage}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border-light pt-4">
              <span className="font-mono text-xs tracking-wide text-text-tertiary">
                {l.code}
              </span>
              <span className="flex items-center gap-1 text-[13px] font-bold text-accent">
                현황 보기
                <ArrowRight
                  className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </span>
            </div>
          </a>
        ))
      ) : (
        <div className="rounded-[20px] border border-dashed border-border-hover bg-surface px-6 py-10 text-center">
          <p className="text-[15px] font-bold text-text">
            아직 연결된 검증 신청이 없습니다
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-tertiary">
            아래에 신청 때 입력한 번호를 넣어 불러오거나, 새 아이디어로 검증을
            시작해보세요.
          </p>
        </div>
      )}

      <form
        onSubmit={link}
        className="rounded-[20px] border border-border bg-surface p-6"
      >
        <p className="text-[15px] font-bold text-text">
          {hasPhone ? "다른 번호로 신청한 게 있나요?" : "신청한 검증 불러오기"}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-tertiary">
          검증 신청 때 입력한 휴대폰 번호를 넣으면, 그 번호로 접수된 신청을 이
          계정에 연결합니다.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="min-w-0 flex-1 rounded-[14px] border border-border bg-bg px-4 py-3.5 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={linking || phone.trim().length < 9}
            className="flex-shrink-0 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {linking ? "연결 중" : "연결"}
          </button>
        </div>
        {msg && (
          <p
            className="mt-3 text-[13px] leading-relaxed"
            style={{ color: msg.ok ? "#06A86B" : "var(--text-tertiary)" }}
          >
            {msg.text}
          </p>
        )}
      </form>
    </div>
  );
}
