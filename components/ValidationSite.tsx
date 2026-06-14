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
  /** 고객 입력 — 소개 이미지(썸네일) 여러 장 (업로드된 public URL) */
  media?: string[];
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

/* 소개 영상 + 썸네일 여러 장 — 메인 + 썸네일 스트립으로 전환 (Skool about식) */
function MediaGallery({
  video,
  images,
  name,
}: {
  video: string | null;
  images: string[];
  name: string;
}) {
  const items = [
    ...(video ? [{ type: "video" as const, src: video }] : []),
    ...images.map((src) => ({ type: "image" as const, src })),
  ];
  const [sel, setSel] = useState(0);
  if (items.length === 0) return null;
  const cur = items[Math.min(sel, items.length - 1)];
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[20px] border border-border bg-text shadow-[0_24px_60px_-24px_rgba(10,23,38,0.32)]">
        <div className="relative aspect-video">
          {cur.type === "video" ? (
            <iframe
              src={cur.src}
              title={`${name} 소개 영상`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cur.src}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSel(i)}
              className={`relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === sel
                  ? "border-accent"
                  : "border-border hover:border-accent/50"
              }`}
            >
              {it.type === "video" ? (
                <span className="grid h-full w-full place-items-center bg-text text-[11px] font-bold text-white">
                  ▶ 영상
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.src} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type EditHandlers = {
  field: (k: "offer" | "credential" | "prologue", v: string) => void;
  plan: (i: number, k: "label" | "desc", v: string) => void;
  planPrice: (i: number, v: number) => void;
  point: (i: number, v: string) => void;
};

/** 페이지 위에서 글자처럼 보이는 인라인 편집 입력 (윅스/아임웹식) */
function EditText({
  value,
  onChange,
  className = "",
  multiline = false,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  const ring =
    "rounded-md bg-accent/[0.04] outline-none ring-1 ring-accent/25 transition placeholder:text-text-tertiary/60 focus:bg-accent/[0.08] focus:ring-2 focus:ring-accent";
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${className} ${ring} w-full resize-y px-2.5 py-1.5`}
    />
  ) : (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${className} ${ring} w-full px-2.5 py-1`}
    />
  );
}

export default function ValidationSite({
  data,
  edit,
}: {
  data: ValidationSiteData;
  edit?: EditHandlers;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cta = CTA_LABEL[data.intent];
  const editable = !!edit;
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
    if (editable) return; // 편집 모드(미리보기)에서는 신청 모달을 띄우지 않는다
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

      {/* ── Skool식 2단: 좌 콘텐츠 + 우 sticky 신청 카드 ── */}
      <section className="relative">
        <div className="hero-spotlight pointer-events-none absolute inset-x-0 top-0 h-72" />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:py-12">
          {editable ? (
            <EditText
              value={data.offer}
              onChange={(v) => edit!.field("offer", v)}
              placeholder="여기에 한 줄 제목 (예: 퇴근 후 1시간, 엑셀이 무기가 됩니다)"
              className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-[36px]"
            />
          ) : (
            <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text sm:text-[38px]">
              {data.offer}
            </h1>
          )}
          {data.targetLine && (
            <p className="mt-3 inline-block rounded-full bg-bg-light px-4 py-1.5 text-[13px] font-bold text-accent">
              {data.targetLine}
            </p>
          )}

          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* ── 좌: 영상 + 본문 ── */}
            <div className="min-w-0">
              {video || (data.media && data.media.length > 0) ? (
                <MediaGallery
                  video={video}
                  images={data.media ?? []}
                  name={data.name}
                />
              ) : (
                editable && (
                  <div className="grid aspect-video w-full place-items-center rounded-[20px] border border-dashed border-border bg-bg-alt px-4 text-center text-[13px] text-text-tertiary">
                    아래 ‘꾸미기’에서 소개 영상·이미지를 넣으면 여기에 표시돼요
                  </div>
                )
              )}

              {editable ? (
                <div className="mt-5">
                  <EditText
                    value={data.credential ?? ""}
                    onChange={(v) => edit!.field("credential", v)}
                    placeholder="강사 소개·실적 한 줄 (예: 구독 1.2만 유튜버 · 5년차) — 선택"
                    className="text-[14px] font-semibold text-text-secondary"
                  />
                </div>
              ) : (
                data.credential && (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-text-secondary">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-black text-white">
                      ✓
                    </span>
                    {data.credential}
                  </p>
                )
              )}

              {(prologueParas.length > 0 || editable) && (
                <div className="mt-8">
                  <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-text sm:text-[24px]">
                    이 강의를 소개합니다
                  </h2>
                  {editable ? (
                    <EditText
                      value={data.prologue ?? ""}
                      onChange={(v) => edit!.field("prologue", v)}
                      multiline
                      rows={7}
                      placeholder="누구를 위한 강의인지, 뭘 배워가는지, 왜 당신이 가르치는지 자유롭게 적어보세요. 줄을 바꾸면 그대로 보입니다(이모지·✅ 불릿 OK)."
                      className="mt-4 text-[16px] leading-[1.8] text-text-secondary"
                    />
                  ) : (
                    <div className="mt-4 whitespace-pre-wrap text-[16px] leading-[1.8] text-text-secondary">
                      {data.prologue}
                    </div>
                  )}
                </div>
              )}

              {(data.sellingPoints.length > 0 || editable) && (
                <div className="mt-8">
                  <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-text sm:text-[24px]">
                    이런 걸 얻어갑니다
                  </h2>
                  <div className="mt-4 space-y-2.5">
                    {(editable
                      ? [0, 1, 2]
                      : data.sellingPoints.slice(0, 3).map((_, i) => i)
                    ).map((i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-[14px] border border-border bg-surface px-4 py-3"
                      >
                        <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-bg-light text-[12px] font-extrabold text-accent">
                          {i + 1}
                        </span>
                        {editable ? (
                          <EditText
                            value={data.sellingPoints[i] ?? ""}
                            onChange={(v) => edit!.point(i, v)}
                            placeholder="강조할 점 (예: 바로 쓰는 템플릿 12종)"
                            className="text-[15px] font-semibold leading-[1.5] text-text"
                          />
                        ) : (
                          <p className="text-[15px] font-semibold leading-[1.5] text-text">
                            {data.sellingPoints[i]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 우: sticky 신청 카드 (Skool JOIN 카드식) ── */}
            <aside className="self-start lg:sticky lg:top-20">
              <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_14px_40px_-20px_rgba(10,23,38,0.2)]">
                {hasCover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.heroImage}
                    alt={data.name}
                    onError={() => setImgError(true)}
                    className="aspect-[16/9] w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="text-[16px] font-extrabold text-text">
                    {data.name}
                  </p>
                  {data.problemLine && (
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-text-secondary">
                      {data.problemLine}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    {plans.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-[12px] bg-bg-alt px-3.5 py-2.5"
                      >
                        {editable ? (
                          <input
                            value={p.label}
                            onChange={(e) => edit!.plan(i, "label", e.target.value)}
                            placeholder="플랜"
                            className="min-w-0 flex-1 rounded bg-transparent px-1.5 py-0.5 text-[13px] font-bold text-text outline-none ring-1 ring-accent/20 focus:ring-accent"
                          />
                        ) : (
                          <span className="min-w-0 truncate text-[13px] font-bold text-text">
                            {p.label || "기본"}
                          </span>
                        )}
                        {editable ? (
                          <span className="flex flex-shrink-0 items-baseline">
                            <input
                              value={p.price > 0 ? String(p.price) : ""}
                              onChange={(e) =>
                                edit!.planPrice(
                                  i,
                                  Number((e.target.value.match(/\d/g) ?? []).join("")) || 0,
                                )
                              }
                              placeholder="0"
                              inputMode="numeric"
                              className="w-20 rounded bg-transparent px-1 py-0.5 text-right text-[15px] font-extrabold text-text outline-none ring-1 ring-accent/20 focus:ring-accent"
                            />
                            <span className="text-[12px] font-semibold text-text-tertiary">
                              원
                            </span>
                          </span>
                        ) : (
                          <span className="flex-shrink-0 text-[15px] font-extrabold text-text">
                            {p.price > 0 ? p.price.toLocaleString() : "0"}
                            <span className="text-[12px] font-semibold text-text-tertiary">
                              원
                            </span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openModal()}
                    className="mt-4 w-full rounded-full bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover"
                  >
                    {cta}
                    {priceFrom !== Infinity && (
                      <span className="text-white/80">
                        {" · "}
                        {priceFrom.toLocaleString()}원~
                      </span>
                    )}
                  </button>
                  <p className="mt-2.5 text-center text-[11px] leading-relaxed text-text-tertiary">
                    실제 결제는 진행되지 않습니다. 신청하면 오픈 시 가장 먼저
                    안내드려요.
                  </p>
                </div>
              </div>
            </aside>
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
