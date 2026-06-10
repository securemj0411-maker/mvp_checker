"use client";

import { useEffect } from "react";

/**
 * 전역 스크롤 reveal. .reveal / .reveal-stagger 클래스 가진 요소가
 * 뷰포트에 진입하면 .in 클래스를 한 번 붙이고 unobserve.
 * (DESIGN.md §7 — signature moments 1·2·3 구현)
 */
export default function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const targets = document.querySelectorAll(".reveal, .reveal-stagger");
    if (targets.length === 0) return;

    // prefers-reduced-motion 사용자는 즉시 보임 처리
    const prefersReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduce) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
