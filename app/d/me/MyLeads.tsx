"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MyLead = { code: string; idea: string; stage: string };

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
  const [msg, setMsg] = useState<string | null>(null);

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
      setMsg(
        data.linked > 0
          ? `${data.linked}건의 신청을 연결했습니다.`
          : "그 번호로 접수된 신청을 찾지 못했습니다. 신청 시 입력한 번호가 맞는지 확인해주세요.",
      );
      if (data.linked > 0) router.refresh();
    } catch {
      setMsg("연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-4">
      {leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map((l) => (
            <a
              key={l.code}
              href={`/d/${l.code}`}
              className="block cold-panel rounded-lg p-5 transition hover:border-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold leading-relaxed text-text">
                  {l.idea}
                </p>
                <span className="flex-shrink-0 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                  {l.stage}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-text-tertiary">
                {l.code}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="cold-panel rounded-lg p-6 text-center">
          <p className="text-sm text-text-secondary">
            아직 이 계정에 연결된 신청이 없습니다.
          </p>
        </div>
      )}

      {/* 전화번호로 기존 신청 연결 — 카카오는 전화번호를 안 주므로 */}
      <form onSubmit={link} className="cold-panel rounded-lg p-5">
        <p className="text-sm font-bold text-text">
          {hasPhone ? "다른 번호로 신청한 게 있나요?" : "신청한 검증 불러오기"}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
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
            className="flex-1 rounded-md border border-border bg-surface-light px-4 py-3 text-text placeholder:text-text-tertiary outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={linking || phone.trim().length < 9}
            className="rounded-md bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            {linking ? "연결 중" : "연결"}
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-text-secondary">{msg}</p>}
      </form>
    </div>
  );
}
