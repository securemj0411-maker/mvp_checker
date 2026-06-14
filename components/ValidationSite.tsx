"use client";

import { useState } from "react";

type Plan = { label: string; price: number; desc?: string };

export type ValidationSiteData = {
  code: string;
  name: string;
  offer: string;
  targetLine: string;
  problemLine: string;
  plans: Plan[];
  sellingPoints: string[];
  /** 합격선에서 파생된 행동 유형 — CTA 문구를 업종에 맞춘다 */
  intent: "pay" | "reserve" | "inquiry";
  /** 고객 입력 — 강사 소개/실적 한 줄 (히어로 신뢰 라인) */
  credential?: string;
  /** 고객 입력 — 소개 영상 URL (유튜브/비메오). 임베드로 렌더 */
  introVideo?: string;
  /** 고객 입력 — 프롤로그(강의 소개 본문). 줄바꿈 = 문단 */
  prologue?: string;
  /** 운영자 폴리시(리드별 override) — 전문가가 게시 전 다듬는 값 */
  heroImage?: string;
  accent?: string;
};

/* CTA 문구 — t.js가 결제의향으로 집계하도록 '시작/예약/신청' 키워드를 포함한다 */
const CTA_LABEL: Record<ValidationSiteData["intent"], string> = {
  pay: "수강 신청하기",
  reserve: "사전 예약 신청",
  inquiry: "상담 신청하기",
};
const MODAL_TITLE: Record<ValidationSiteData["intent"], string> = {
  pay: "오픈 알림 신청",
  reserve: "사전 예약하기",
  inquiry: "상담 신청하기",
};
const MODAL_SUB: Record<ValidationSiteData["intent"], string> = {
  pay: "지금 정식 오픈 전이에요. 연락처를 남겨주시면 열리는 날 가장 먼저 알려드립니다.",
  reserve: "연락처를 남겨주시면 예약 확정 안내를 보내드립니다.",
  inquiry: "연락처를 남겨주시면 담당자가 빠르게 연락드립니다.",
};

/** 유튜브/비메오 URL → 임베드 URL. 허용 호스트만(임의 iframe 방지). */
function embedUrl(raw?: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube.com${u.pathname}`;
      if (u.pathname.startsWith("/shorts/"))
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* 잘못된 URL은 무시 — 영상 섹션을 숨긴다 */
  }
  return null;
}

export default function ValidationSite({ data }: { data: ValidationSiteData }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cta = CTA_LABEL[data.intent];
  const video = embedUrl(data.introVideo);
  const prologueParas = (data.prologue ?? "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const hasCover =
    !!data.heroImage && /^https?:\/\//.test(data.heroImage) && !imgError;

  // 운영자 입력 accent — hex 형식일 때만 적용(잘못된 값으로 페이지가 깨지지 않게)
  const validAccent =
    data.accent && /^#[0-9a-fA-F]{3,8}$/.test(data.accent) ? data.accent : null;
  const rootStyle = validAccent
    ? ({
        "--accent": validAccent,
        "--accent-hover": validAccent,
      } as React.CSSProperties)
    : undefined;

  function openModal(planLabel?: string) {
    setPlan(planLabel ?? null);
    setDone(false);
    setErr(false);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (contact.trim().length < 7) return;
    setSending(true);
    setErr(false);
    try {
      const res = await fetch("/api/v/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.code,
          name: name.trim(),
          contact: contact.trim(),
          plan,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setErr(true);
    } finally {
      setSending(false);
    }
  }

  const plans = data.plans.length
    ? data.plans
    : [{ label: "기본", price: data.plans[0]?.price ?? 0, desc: "" }];
  const priceFrom = plans.reduce(
    (min, p) => (p.price > 0 && p.price < min ? p.price : min),
    Infinity,
  );

  return (
    <div className="min-h-screen bg-bg text-text" style={rootStyle}>
      {/* ── 상단 바 (고객 브랜드) ── */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <span className="text-[17px] font-extrabold tracking-[-0.02em] text-text">
            {data.name}
          </span>
          <button
            onClick={() => openModal()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover"
          >
            {cta}
          </button>
        </div>
      </header>

      {/* ── 히어로 (Skool about식: 커버 → 타이틀 → 신뢰 라인 → 소개영상) ── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="hero-spotlight pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
          {hasCover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.heroImage}
              alt={data.name}
              onError={() => setImgError(true)}
              className="mx-auto mb-9 aspect-[16/7] w-full rounded-[20px] border border-border object-cover shadow-[0_20px_50px_-24px_rgba(10,23,38,0.3)]"
            />
          )}
          {data.targetLine && (
            <p className="mb-4 inline-block rounded-full bg-bg-light px-4 py-1.5 text-[13px] font-bold text-accent">
              {data.targetLine}
            </p>
          )}
          <h1 className="text-[32px] font-extrabold leading-[1.18] tracking-[-0.03em] text-text sm:text-[46px]">
            {data.offer}
          </h1>
          {data.problemLine && (
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.7] text-text-secondary sm:text-[18px]">
              {data.problemLine}
            </p>
          )}
          {data.credential && (
            <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-text-secondary">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-black text-white">
                ✓
              </span>
              {data.credential}
            </p>
          )}

          {/* 소개 영상 — Skool about의 핵심. 고객이 URL만 넣으면 임베드 */}
          {video && (
            <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[20px] border border-border bg-text shadow-[0_24px_60px_-24px_rgba(10,23,38,0.32)]">
              <div className="relative aspect-video">
                <iframe
                  src={video}
                  title={`${data.name} 소개 영상`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <button
            onClick={() => openModal()}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white shadow-[0_14px_32px_-10px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-accent-hover"
          >
            {cta}
            {priceFrom !== Infinity && (
              <span className="text-white/80">
                · {priceFrom.toLocaleString()}원~
              </span>
            )}
          </button>
        </div>
      </section>

      {/* ── 프롤로그 (강의 소개 본문) ── */}
      {prologueParas.length > 0 && (
        <section className="border-b border-border bg-bg">
          <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
            <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-text sm:text-[26px]">
              이 강의를 소개합니다
            </h2>
            <div className="mt-6 space-y-4">
              {prologueParas.map((p, i) => (
                <p
                  key={i}
                  className="text-[16px] leading-[1.8] text-text-secondary"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 가치 포인트 (이런 걸 배웁니다) ── */}
      {data.sellingPoints.length > 0 && (
        <section className="border-b border-border bg-bg">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <h2 className="text-center text-[22px] font-extrabold tracking-[-0.02em] text-text sm:text-[26px]">
              이런 걸 얻어갑니다
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {data.sellingPoints.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  className="rounded-[20px] border border-border bg-surface p-7"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-bg-light text-base font-extrabold text-accent">
                    {i + 1}
                  </span>
                  <p className="mt-4 text-[15px] font-semibold leading-[1.6] text-text">
                    {p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 가격/플랜 ── */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <h2 className="text-center text-[26px] font-extrabold tracking-[-0.02em] text-text sm:text-[32px]">
            수강 안내
          </h2>
          <div
            className={`mx-auto mt-10 grid max-w-3xl gap-5 ${
              plans.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-sm"
            }`}
          >
            {plans.map((p, i) => (
              <div
                key={i}
                className="flex flex-col rounded-[22px] border border-border bg-surface p-8 shadow-[0_2px_10px_rgba(10,23,38,0.04)]"
              >
                <p className="text-[15px] font-bold text-accent">
                  {p.label || "기본"}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[36px] font-extrabold tracking-[-0.03em] text-text">
                    {p.price > 0 ? p.price.toLocaleString() : "0"}
                  </span>
                  <span className="text-[15px] font-semibold text-text-tertiary">
                    원
                  </span>
                </div>
                {p.desc && (
                  <p className="mt-3 flex-1 text-[14px] leading-[1.6] text-text-secondary">
                    {p.desc}
                  </p>
                )}
                <button
                  onClick={() => openModal(p.label)}
                  className="mt-7 rounded-full bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover"
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-10 text-center">
          <span className="text-[15px] font-extrabold text-text">
            {data.name}
          </span>
          <p className="text-[13px] text-text-tertiary">
            © 2026 {data.name}. 문의는 아래 버튼으로 남겨주세요.
          </p>
          <button
            onClick={() => openModal()}
            className="mt-2 rounded-full border border-border px-5 py-2 text-[13px] font-bold text-text-secondary transition hover:border-border-hover hover:text-text"
          >
            {cta}
          </button>
        </div>
      </footer>

      {/* ── 사전등록 모달 ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-text/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[24px] bg-surface p-7 shadow-[0_30px_70px_-24px_rgba(4,12,28,0.5)] sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-go-tint">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="var(--go)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-5 text-[18px] font-extrabold text-text">
                  신청이 접수되었습니다
                </p>
                <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
                  준비되는 대로 남겨주신 연락처로 가장 먼저 안내드리겠습니다.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-6 w-full rounded-full bg-text py-3.5 text-[15px] font-bold text-bg transition hover:-translate-y-0.5"
                >
                  닫기
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <p className="text-[19px] font-extrabold tracking-[-0.02em] text-text">
                  {MODAL_TITLE[data.intent]}
                </p>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-text-secondary">
                  {MODAL_SUB[data.intent]}
                </p>
                <div className="mt-5 space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 (선택)"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3.5 text-[15px] text-text outline-none transition placeholder:text-text-tertiary focus:border-accent"
                  />
                  <input
                    type="text"
                    inputMode="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="연락처 (휴대폰 또는 이메일)"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3.5 text-[15px] text-text outline-none transition placeholder:text-text-tertiary focus:border-accent"
                  />
                </div>
                {err && (
                  <p className="mt-3 text-[13px] font-semibold text-nogo">
                    잠시 후 다시 시도해주세요.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending || contact.trim().length < 7}
                  className="mt-5 w-full rounded-full bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? "보내는 중…" : "보내기"}
                </button>
                <p className="mt-3 text-center text-[12px] leading-relaxed text-text-tertiary">
                  실제 결제는 진행되지 않습니다. 남겨주신 연락처는 강의 안내
                  목적으로만 사용하며 그 외 용도로 쓰지 않습니다.{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-text-secondary"
                  >
                    개인정보처리방침
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
