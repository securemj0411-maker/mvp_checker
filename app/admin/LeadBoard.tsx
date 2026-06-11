"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLead, deleteLead } from "./actions";
import Guide from "./Guide";

export type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  idea: string;
  status: string;
  memo: string | null;
  source: string | null;
  utm_source: string | null;
  service_type: string | null;
  audience: string | null;
  revenue_model: string | null;
  stage: string | null;
  fear: string | null;
};

/* ── 라벨 ── */
const LABEL = {
  service: {
    web: "웹 서비스",
    app: "모바일 앱",
    commerce: "온라인 판매",
    offline: "오프라인",
    unknown: "형태 미정",
  } as Record<string, string>,
  audience: {
    b2c: "소비자",
    b2b: "회사·사장님",
    both: "둘 다/모름",
  } as Record<string, string>,
  revenue: {
    once: "단건 결제",
    subscription: "구독",
    unknown: "미정",
  } as Record<string, string>,
  stage: {
    idea: "아이디어",
    planning: "기획 중",
    builder: "만드는 중",
    built: "이미 만듦",
  } as Record<string, string>,
  fear: {
    demand: "수요",
    unit: "수익 구조",
    cac: "광고비",
    all: "전부 다",
    priority: "순서",
  } as Record<string, string>,
};
const L = (m: Record<string, string>, k: string | null) =>
  k ? (m[k] ?? k) : "-";

function planFor(fear: string | null) {
  if (fear === "all" || fear === "unit" || fear === "cac")
    return "Quick→Deep";
  return "Quick";
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── 파이프라인 상태 (순서 = 진행 순서) ── */
const STATUS: { key: string; label: string; dot: string }[] = [
  { key: "new", label: "신규", dot: "#97A4B2" },
  { key: "contacted", label: "연락중", dot: "#3182F6" },
  { key: "consulted", label: "상담완료", dot: "#1B64DA" },
  { key: "paid", label: "결제완료", dot: "#06A86B" },
  { key: "build", label: "제작중", dot: "#E08A00" },
  { key: "live", label: "광고집행", dot: "#E08A00" },
  { key: "verdict", label: "판정·납품", dot: "#06A86B" },
  { key: "won", label: "완료", dot: "#16233A" },
  { key: "lost", label: "미진행", dot: "#C0432A" },
];
const ST = (k: string | null) =>
  STATUS.find((s) => s.key === (k ?? "new")) ?? STATUS[0];

const VIEWS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: "inbox", label: "신규·상담", statuses: ["new", "contacted", "consulted"] },
  { key: "active", label: "진행 고객", statuses: ["paid", "build", "live", "verdict"] },
  { key: "closed", label: "완료·종료", statuses: ["won", "lost"] },
  { key: "all", label: "전체", statuses: null },
];

export default function LeadBoard({ leads: initial }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [tab, setTab] = useState("inbox");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLeads(initial), [initial]);

  const countFor = (v: (typeof VIEWS)[number]) =>
    v.statuses
      ? leads.filter((l) => v.statuses!.includes(l.status ?? "new")).length
      : leads.length;

  const visible = useMemo(() => {
    const v = VIEWS.find((x) => x.key === tab);
    if (!v?.statuses) return leads;
    return leads.filter((l) => v.statuses!.includes(l.status ?? "new"));
  }, [leads, tab]);

  const fromYoutube = leads.filter((l) => l.utm_source === "youtube").length;

  async function save(id: string, status: string, memo: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    fd.set("memo", memo);
    setLeads((ls) =>
      ls.map((l) => (l.id === id ? { ...l, status, memo } : l)),
    );
    setSelected(null);
    startTransition(async () => {
      await updateLead(fd);
      router.refresh();
    });
  }

  async function remove(id: string, name: string) {
    if (!confirm(`"${name}" 리드를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const fd = new FormData();
    fd.set("id", id);
    setLeads((ls) => ls.filter((l) => l.id !== id));
    setSelected(null);
    startTransition(async () => {
      await deleteLead(fd);
      router.refresh();
    });
  }

  return (
    <div>
      {/* 요약 통계 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 리드" value={leads.length} />
        <Stat label="신규·상담" value={countFor(VIEWS[0])} />
        <Stat label="진행 고객" value={countFor(VIEWS[1])} />
        <Stat label="유튜브 유입" value={fromYoutube} />
      </div>

      {/* 탭 — 클라이언트 즉시 전환 */}
      <div className="mt-7 flex flex-wrap items-center gap-1 border-b border-border">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setTab(v.key)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-bold transition ${
              tab === v.key
                ? "border border-b-0 border-border bg-surface text-text"
                : "text-text-tertiary hover:text-text"
            }`}
          >
            {v.label}{" "}
            <span className="font-medium text-text-tertiary">
              {countFor(v)}
            </span>
          </button>
        ))}
        <button
          onClick={() => setTab("guide")}
          className={`ml-auto rounded-t-lg px-4 py-2.5 text-sm font-bold transition ${
            tab === "guide"
              ? "border border-b-0 border-border bg-surface text-accent"
              : "text-accent hover:opacity-75"
          }`}
        >
          📋 상담 가이드
        </button>
      </div>

      {tab === "guide" ? (
        <Guide />
      ) : (
        <div className="overflow-x-auto rounded-b-lg border border-t-0 border-border bg-surface">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-3">접수</th>
                <th className="px-4 py-3">유입</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">아이디어</th>
                <th className="px-4 py-3">추천</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-text-tertiary"
                  >
                    이 보기에 해당하는 리드가 없습니다.
                  </td>
                </tr>
              )}
              {visible.map((l) => {
                const st = ST(l.status);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className="cursor-pointer border-b border-border-light transition last:border-0 hover:bg-bg-alt"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-text-tertiary">
                      {fmtKST(l.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {l.utm_source === "youtube" ? (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                          유튜브
                        </span>
                      ) : (
                        <span className="text-xs text-text-tertiary">
                          {l.utm_source ?? "직접"}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold">
                      {l.name}
                      {l.memo && (
                        <span
                          className="ml-1.5 text-text-tertiary"
                          title="메모 있음"
                        >
                          ✎
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-text-secondary">
                      {l.email}
                      {l.phone && (
                        <span className="block text-xs font-semibold text-accent">
                          {l.phone}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3.5 text-text-secondary">
                      {l.idea}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-text-secondary">
                      {planFor(l.fear)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: st.dot }}
                        />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-text-tertiary">
        행을 클릭하면 상세·메모·상태 변경 · 최근 500건 · KST
        {isPending && " · 저장 중..."}
      </p>

      {selected && (
        <Modal
          lead={selected}
          onClose={() => setSelected(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}

/* ── 상세 모달 ── */
function Modal({
  lead,
  onClose,
  onSave,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (id: string, status: string, memo: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [status, setStatus] = useState(lead.status ?? "new");
  const [memo, setMemo] = useState(lead.memo ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const chips: [string, string][] = [
    ["형태", L(LABEL.service, lead.service_type)],
    ["대상", L(LABEL.audience, lead.audience)],
    ["수익", L(LABEL.revenue, lead.revenue_model)],
    ["단계", L(LABEL.stage, lead.stage)],
    ["최우선", L(LABEL.fear, lead.fear)],
    ["추천", planFor(lead.fear)],
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-xl font-bold text-text">{lead.name}</p>
              {lead.utm_source === "youtube" && (
                <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                  유튜브
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              접수 {fmtKST(lead.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-tertiary transition hover:bg-bg-alt hover:text-text"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* 연락처 */}
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href={`mailto:${lead.email}`}
              className="rounded-lg border border-border bg-bg px-3 py-2 font-medium text-text transition hover:border-accent"
            >
              ✉ {lead.email}
            </a>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="rounded-lg border border-border bg-bg px-3 py-2 font-medium text-accent transition hover:border-accent"
              >
                ☎ {lead.phone}
              </a>
            )}
          </div>

          {/* 퀴즈 응답 */}
          <div className="grid grid-cols-3 gap-2">
            {chips.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-bg-alt px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                  {k}
                </p>
                <p className="mt-0.5 text-[13px] font-bold text-text">{v}</p>
              </div>
            ))}
          </div>

          {/* 아이디어 전문 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              아이디어
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-bg p-4 text-sm leading-relaxed text-text">
              {lead.idea}
            </p>
          </div>

          {/* 상태 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              상태
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    status === s.key
                      ? "border-accent bg-bg-light text-text"
                      : "border-border bg-surface text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: s.dot }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              상담 메모
            </p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="상담 내용, 합격선 합의, 다음 액션 등"
              className="mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={() => onDelete(lead.id, lead.name)}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-100"
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold text-text-secondary transition hover:text-text"
            >
              닫기
            </button>
            <button
              onClick={() => onSave(lead.id, status, memo)}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-white transition hover:bg-accent-hover"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
