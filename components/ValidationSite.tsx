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
  /** 고객 입력 — 강사 소개/실적 한 줄 (신뢰 라인) */
  credential?: string;
  /** 고객 입력 — 강사 사진 (없으면 기본 아바타로 대체) */
  instructorPhoto?: string;
  /** 고객 입력 — 소개 영상 URL (유튜브/비메오). 임베드로 렌더 */
  introVideo?: string;
  /** 고객 입력 — 자유 서술 본문(소개). 줄바꿈 = 문단 */
  prologue?: string;
  /** 고객 입력 — 소개 이미지(썸네일) 여러 장 (업로드된 public URL) */
  media?: string[];
  /** 운영자 폴리시(리드별 override) — 전문가가 게시 전 다듬는 값 */
  heroImage?: string;
  accent?: string;
  /** 진짜 사전신청 수 — 일정 수 이상일 때만 노출(가짜 사회적 증거 금지). */
  signupCount?: number;
};

/* CTA 문구 — t.js가 결제의향으로 집계하도록 '시작/예약/신청' 키워드를 포함한다 */
const CTA_LABEL: Record<ValidationSiteData["intent"], string> = {
  pay: "수강 신청하기",
  reserve: "사전 예약 신청",
  inquiry: "상담 신청하기",
};
const CHIP_LABEL: Record<ValidationSiteData["intent"], string> = {
  pay: "수강 신청",
  reserve: "사전 예약",
  inquiry: "상담 신청",
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

/** 강사 아바타 — 사진이 있으면 사진, 없으면 이름 첫 글자 기본 아바타(안 비어 보이게). */
function Avatar({
  photo,
  name,
  size = "md",
}: {
  photo?: string;
  name: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-6 w-6 text-[11px]" : "h-12 w-12 text-[17px]";
  if (photo && /^https?:\/\//.test(photo)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className={`${box} flex-shrink-0 rounded-full border border-border object-cover`}
      />
    );
  }
  return (
    <span
      className={`${box} grid flex-shrink-0 place-items-center rounded-full bg-accent/10 font-bold text-accent`}
    >
      {name.trim().slice(0, 1) || "·"}
    </span>
  );
}

/** 정보 칩 아이콘 — 형태/가격/사전신청 (Skool의 Public·Free·members 자리). */
function ChipIcon({ name }: { name: "globe" | "tag" | "users" }) {
  const common = {
    width: 13,
    height: 13,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "globe")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
      </svg>
    );
  if (name === "tag")
    return (
      <svg {...common}>
        <path d="M20.6 13.4 12 22l-9-9V3h10l8.6 8.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7" cy="7" r="1.2" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** 기본 표지 — 사진·영상 업로드 전이라도 안 비어 보이게 채우는 우리 디폴트 비주얼. */
function DefaultCover({
  name,
  ratio = "aspect-video",
}: {
  name: string;
  ratio?: string;
}) {
  return (
    <div
      className={`grid ${ratio} w-full place-items-center rounded-[20px] border border-border bg-bg-alt`}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-[20px] font-bold text-accent">
          {name.trim().slice(0, 1) || "·"}
        </span>
        <span className="text-[15px] font-bold text-text-secondary">{name}</span>
      </div>
    </div>
  );
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

/** 페이지 위에서 글자처럼 보이는 인라인 편집 입력 (BriefStep 확정 단계에서만 사용) */
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
  const points = data.sellingPoints.map((s) => s.trim()).filter(Boolean);
  const hasMedia = !!video || (!!data.media && data.media.length > 0);
  const hasCover =
    !!data.heroImage && /^https?:\/\//.test(data.heroImage) && !imgError;
  const hasCredential = !!(data.credential && data.credential.trim());

  // 운영자 입력 accent — hex 형식일 때만 적용(잘못된 값으로 페이지가 깨지지 않게)
  const validAccent =
    data.accent && /^#[0-9a-fA-F]{3,8}$/.test(data.accent) ? data.accent : null;
  // Skool about 페이지 톤으로 이 페이지만 재테마 — 밝은 중립 배경·흰 카드·얇은 회색
  // 텍스트·Roboto 계열 폰트. (우리 앱 토큰 var(--bg/--surface/...)을 이 서브트리에서만 덮어씀)
  const rootStyle = {
    "--bg": "#f7f6f3",
    "--surface": "#ffffff",
    "--bg-alt": "#f1efea",
    "--bg-light": "#f1efea",
    "--border": "#e6e4e0",
    "--border-hover": "#d2cfc9",
    "--text": "#1f2123",
    "--text-secondary": "#4b4d50",
    "--text-tertiary": "#8a8d91",
    "--accent": validAccent ?? "#2b6cb0",
    "--accent-hover": validAccent ?? "#245a96",
    fontFamily:
      "'Roboto', 'Pretendard', 'Apple SD Gothic Neo', -apple-system, system-ui, sans-serif",
  } as React.CSSProperties;

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

  // 사전신청 수는 일정 수 이상일 때만 노출(가짜 사회적 증거 금지).
  const signups = data.signupCount ?? 0;
  const showSignups = signups >= 3;

  return (
    <div className="min-h-screen bg-bg text-text" style={rootStyle}>
      {/* ── 상단 바 (고객 브랜드) ── */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-text">
            {data.name}
          </span>
          <button
            onClick={() => openModal()}
            className="rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover"
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
              className="text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-text sm:text-[36px]"
            />
          ) : (
            <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.03em] text-text sm:text-[38px]">
              {data.offer}
            </h1>
          )}

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* ── 좌: 미디어 + 강사 + 본문 ── */}
            <div className="min-w-0">
              {hasMedia ? (
                <MediaGallery
                  video={video}
                  images={data.media ?? []}
                  name={data.name}
                />
              ) : editable ? (
                <div className="grid aspect-video w-full place-items-center rounded-[20px] border border-dashed border-border bg-bg-alt px-4 text-center text-[13px] text-text-tertiary">
                  아래 ‘꾸미기’에서 소개 영상·이미지를 넣으면 여기에 표시돼요
                </div>
              ) : (
                <DefaultCover name={data.name} />
              )}

              {/* 정보 줄 (Skool식) — 형태 · 가격 · 사전신청 · By 강사 (회색 아이콘) */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-5 text-[13px] text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <ChipIcon name="globe" />
                  {CHIP_LABEL[data.intent]}
                </span>
                {priceFrom !== Infinity && (
                  <span className="inline-flex items-center gap-1.5">
                    <ChipIcon name="tag" />
                    {priceFrom.toLocaleString()}원~
                  </span>
                )}
                {showSignups && (
                  <span className="inline-flex items-center gap-1.5 font-bold text-accent">
                    <ChipIcon name="users" />
                    {signups.toLocaleString()}명 사전신청
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Avatar
                    photo={data.instructorPhoto}
                    name={data.name}
                    size="sm"
                  />
                  By {data.name}
                </span>
              </div>
              {/* 강사 약력 한 줄 */}
              {editable ? (
                <div className="mt-4">
                  <EditText
                    value={data.credential ?? ""}
                    onChange={(v) => edit!.field("credential", v)}
                    placeholder="강사 소개·실적 한 줄 (예: 구독 1.2만 유튜버 · 5년차) — 선택"
                    className="text-[14px] font-semibold text-text-secondary"
                  />
                </div>
              ) : (
                hasCredential && (
                  <p className="mt-4 text-[14px] font-semibold text-text-secondary">
                    {data.credential}
                  </p>
                )
              )}

              {/* 이런 걸 얻어갑니다 — 개수 자유. 편집은 3칸 고정, 읽기는 채운 만큼 전부. */}
              {(points.length > 0 || editable) && (
                <div className="mt-8">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text sm:text-[24px]">
                    이런 걸 얻어갑니다
                  </h2>
                  <div className="mt-4 space-y-2.5">
                    {(editable
                      ? [0, 1, 2]
                      : points.map((_, i) => i)
                    ).map((i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-[14px] border border-border bg-surface px-4 py-3"
                      >
                        <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-bg-light text-[12px] font-semibold text-accent">
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
                            {points[i]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 자유 서술 본문 — 강조점 아래. 길게 자유롭게(줄바꿈=문단). */}
              {(prologueParas.length > 0 || editable) && (
                <div className="mt-8">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text sm:text-[24px]">
                    이 서비스를 소개합니다
                  </h2>
                  {editable ? (
                    <EditText
                      value={data.prologue ?? ""}
                      onChange={(v) => edit!.field("prologue", v)}
                      multiline
                      rows={8}
                      placeholder="누구를 위한 건지, 뭘 받게 되는지, 왜 당신인지 자유롭게 적어보세요. 길이 제한 넉넉합니다. 줄을 바꾸면 그대로 보여요(이모지·✅ OK)."
                      className="mt-4 text-[16px] leading-[1.8] text-text-secondary"
                    />
                  ) : (
                    <div className="mt-4 whitespace-pre-wrap text-[16px] leading-[1.8] text-text-secondary">
                      {data.prologue}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 우: sticky 신청 카드 (Skool JOIN 카드식) ── */}
            <aside className="self-start lg:sticky lg:top-20">
              <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_14px_40px_-20px_rgba(10,23,38,0.2)]">
                {hasCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.heroImage}
                    alt={data.name}
                    onError={() => setImgError(true)}
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-[16/9] w-full place-items-center bg-bg-alt">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-[18px] font-bold text-accent">
                      {data.name.trim().slice(0, 1) || "·"}
                    </span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[16px] font-semibold text-text">
                    {data.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    {CHIP_LABEL[data.intent]}
                  </p>
                  {data.problemLine && (
                    <p className="mt-2.5 text-[13px] leading-[1.6] text-text-secondary">
                      {data.problemLine}
                    </p>
                  )}

                  {editable ? (
                    /* 편집 모드 — 인라인 플랜 편집 (확정 단계) */
                    <div className="mt-4 space-y-2">
                      {plans.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-[12px] bg-bg-alt px-3.5 py-2.5"
                        >
                          <input
                            value={p.label}
                            onChange={(e) => edit!.plan(i, "label", e.target.value)}
                            placeholder="플랜"
                            className="min-w-0 flex-1 rounded bg-transparent px-1.5 py-0.5 text-[13px] font-bold text-text outline-none ring-1 ring-accent/20 focus:ring-accent"
                          />
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
                              className="w-20 rounded bg-transparent px-1 py-0.5 text-right text-[15px] font-semibold text-text outline-none ring-1 ring-accent/20 focus:ring-accent"
                            />
                            <span className="text-[12px] font-semibold text-text-tertiary">
                              원
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* 읽기 모드 — Skool식 3칸 통계 박스 (사전신청 · 수강료 · 형태) */
                    <div className="mt-4 flex overflow-hidden rounded-[12px] border border-border">
                      <div className="flex-1 px-2 py-2.5 text-center">
                        <div className="text-[15px] font-semibold text-text">
                          {showSignups ? signups.toLocaleString() : "—"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-text-tertiary">
                          사전신청
                        </div>
                      </div>
                      <div className="flex-1 border-x border-border px-2 py-2.5 text-center">
                        <div className="text-[15px] font-semibold text-text">
                          {priceFrom !== Infinity
                            ? priceFrom.toLocaleString()
                            : "—"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-text-tertiary">
                          수강료(원)
                        </div>
                      </div>
                      <div className="flex-1 px-2 py-2.5 text-center">
                        <div className="text-[14px] font-semibold text-text">
                          {CHIP_LABEL[data.intent]}
                        </div>
                        <div className="mt-0.5 text-[11px] text-text-tertiary">
                          형태
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 사전신청자 아바타 줄 — 익명(신원 비노출), 실제 수치만 */}
                  {!editable && showSignups && (
                    <div className="mt-3.5 flex items-center">
                      {[15, 22, 30, 18].map((op, i) => (
                        <span
                          key={i}
                          className="grid h-6 w-6 place-items-center rounded-full border-2 border-surface"
                          style={{
                            marginLeft: i === 0 ? 0 : -7,
                            background: `color-mix(in srgb, var(--accent) ${op}%, var(--surface))`,
                          }}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="var(--accent)"
                            aria-hidden
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21a8 8 0 0 1 16 0Z" />
                          </svg>
                        </span>
                      ))}
                      <span className="ml-2.5 text-[12px] text-text-tertiary">
                        +{signups.toLocaleString()}명이 사전신청했어요
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => openModal()}
                    className="mt-4 w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover"
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
          <span className="text-[15px] font-semibold text-text">
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
                <p className="mt-5 text-[18px] font-semibold text-text">
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
                <p className="text-[19px] font-semibold tracking-[-0.02em] text-text">
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
                  className="mt-5 w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
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
