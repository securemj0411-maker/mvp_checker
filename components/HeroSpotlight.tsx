"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Hero 영역에 마우스 위치 따라 cyan radial spotlight 따라옴.
 * pointermove rAF 스로틀 — 단일 paint, 성능 안전.
 * (DESIGN.md §7 — signature moment 6: Background)
 */
export default function HeroSpotlight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches
    )
      return; // 터치 디바이스에선 비활성

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${mx}%`);
        el.style.setProperty("--my", `${my}%`);
      });
    };

    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hero-spotlight relative">
      {children}
    </div>
  );
}
