"use client";

import { useMemo, useState } from "react";
import { updateLead, deleteLead } from "./actions";

/* 린 관리자 — 강의 검증 수동 운영(카톡 상담)에 필요한 것만.
   기존 자동화 O2O 필드(brief·입금·광고stats·사이트발행 등)는 제외. */
export type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  idea: string | null;
  status: string;
  memo: string | null;
  source: string | null;
  utm_source: string | null;
  service_type: string | null;
  build_status: string | null;
  ad_creative: string | null;
  access_code: string | null;
  tier: string | null;
};

const KAKAO = "https://pf.kakao.com/_xiCvnX/chat";

const STATUS: { key: string; label: string; cls: string }[] = [
  { key: "new", label: "신규", cls: "bg-accent/10 text-accent" },
  { key: "contacted", label: "상담중", cls: "bg-[var(--pivot-tint)] text-[var(--pivot)]" },
  { key: "paid", label: "결제", cls: "bg-[var(--go-tint)] text-[var(--go)]" },
  { key: "won", label: "완료", cls: "bg-[var(--go-tint)] text-[var(--go)]" },
  { key: "lost", label: "종료", cls: "bg-bg-alt text-text-tertiary" },
];
const ST = (k: string | null) => STATUS.find((s) => s.key === k) ?? STATUS[0];

const SERVICE: Record<string, string> = {
  web: "녹화 영상",
  content: "라이브",
  commerce: "전자책",
  app: "멤버십",
  offline: "오프라인",
  unknown: "미정",
};
const BUILD: Record<string, string> = {
  self: "고객 직접",
  need: "비즈필터 제작",
  built: "이미 있음",
};
const AD: Record<string, string> = {
  have: "고객 보유",
  need: "비즈필터 제작",
  unsure: "상담 시 결정",
};

function fmt(s: string): string {
  const d = new Date(s);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function isAd(l: Lead): boolean {
  const u = (l.utm_source ?? "").toLowerCase();
  return /google|cpc|ad|gclid|demand/.test(u);
}

export default function LeadBoard({ leads }: { leads: Lead[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    for (const l of leads) c[l.status ?? "new"] = (c[l.status ?? "new"] ?? 0) + 1;
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (tab !== "all" && (l.status ?? "new") !== tab) return false;
      if (!kw) return true;
      return [l.name, l.phone, l.idea].some((v) =>
        (v ?? "").toLowerCase().includes(kw),
      );
    });
  }, [leads, q, tab]);

  return (
    <div className="mt-6">
      {/* 요약 + 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTab("all")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            tab === "all"
              ? "bg-text text-bg"
              : "border border-border bg-surface text-text-secondary"
          }`}
        >
          전체 {counts.all ?? 0}
        </button>
        {STATUS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === s.key
                ? "bg-text text-bg"
                : "border border-border bg-surface text-text-secondary"
            }`}
          >
            {s.label} {counts[s.key] ?? 0}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름·전화·주제 검색"
          className="ml-auto w-52 rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>

      {/* 테이블 */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-text-tertiary">
              <th className="px-3 py-2.5">신청 시각</th>
              <th className="px-3 py-2.5">이름</th>
              <th className="px-3 py-2.5">전화</th>
              <th className="px-3 py-2.5">강의 주제</th>
              <th className="px-3 py-2.5">형태</th>
              <th className="px-3 py-2.5">페이지</th>
              <th className="px-3 py-2.5">쇼츠</th>
              <th className="px-3 py-2.5">유입</th>
              <th className="px-3 py-2.5">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <Row
                key={l.id}
                lead={l}
                open={open === l.id}
                onToggle={() => setOpen(open === l.id ? null : l.id)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-text-tertiary">
                  해당하는 신청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  lead: l,
  open,
  onToggle,
}: {
  lead: Lead;
  open: boolean;
  onToggle: () => void;
}) {
  const st = ST(l.status);
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-border-light transition hover:bg-bg-alt/50"
      >
        <td className="whitespace-nowrap px-3 py-3 text-text-tertiary">{fmt(l.created_at)}</td>
        <td className="px-3 py-3 font-semibold text-text">{l.name ?? "—"}</td>
        <td className="whitespace-nowrap px-3 py-3 text-text-secondary">{l.phone ?? "—"}</td>
        <td className="max-w-[280px] px-3 py-3 text-text">
          <div className="flex items-center gap-1.5">
            <span className="truncate">{l.idea ?? "—"}</span>
            {(!l.service_type || l.service_type === "unknown") && (
              <span className="shrink-0 rounded-full bg-bg-alt px-1.5 py-0.5 text-[10px] font-bold text-text-tertiary">
                미완료
              </span>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
          {SERVICE[l.service_type ?? "unknown"] ?? l.service_type ?? "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
          {BUILD[l.build_status ?? ""] ?? "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
          {AD[l.ad_creative ?? ""] ?? "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-3">
          {isAd(l) ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">광고</span>
          ) : (
            <span className="text-xs text-text-tertiary">{l.utm_source || l.source || "직접"}</span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border bg-bg-alt/40">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold text-text-tertiary">강의 주제 (전문)</p>
                <p className="mt-1 text-sm leading-relaxed text-text">{l.idea ?? "—"}</p>
                <form action={updateLead} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={l.id} />
                  <label className="text-xs font-semibold text-text-tertiary">
                    상태
                    <select
                      name="status"
                      defaultValue={l.status ?? "new"}
                      className="mt-1 block rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    >
                      {STATUS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-1 text-xs font-semibold text-text-tertiary">
                    메모
                    <input
                      name="memo"
                      defaultValue={l.memo ?? ""}
                      placeholder="상담 내용·다음 액션 등"
                      className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </label>
                  <button className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover">
                    저장
                  </button>
                </form>
              </div>
              <div className="flex flex-col items-stretch gap-2 md:w-44">
                <a
                  href={KAKAO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition hover:brightness-95"
                  style={{ background: "#FEE500", color: "#191600" }}
                >
                  카톡 채널 열기
                </a>
                {l.access_code && (
                  <p className="text-center text-xs text-text-tertiary">코드 {l.access_code}</p>
                )}
                <form
                  action={deleteLead}
                  onSubmit={(e) => {
                    if (!confirm("이 신청을 삭제할까요?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={l.id} />
                  <button className="w-full rounded-md border border-border px-4 py-2 text-xs font-medium text-text-tertiary transition hover:border-[var(--nogo)] hover:text-[var(--nogo)]">
                    삭제
                  </button>
                </form>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
