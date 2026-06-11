"use client";

import { useEffect } from "react";

/**
 * 전역 스크롤 reveal. .reveal / .reveal-stagger 요소가 뷰포트에 들어오면
 * .in 을 한 번 붙이고 unobserve — 한 번 나타난 요소는 다시 숨지 않는다.
 *
 * 깜빡임 방지 구조:
 * - layout <head> 인라인 스크립트가 첫 페인트 전에 html.js 를 붙이고,
 *   CSS 는 html.js 에서만 .reveal 을 숨긴다 → "보였다 사라지는" 구간 없음.
 * - 마운트 시점에 이미 뷰포트 안이거나 위로 지나친 요소는 즉시 .in 처리
 *   (hydration 전에 빠르게 스크롤한 경우 대비).
 * - bfcache 복원 시(pageshow.persisted) 전부 즉시 표시.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal, .reveal-stagger"),
    );
    if (targets.length === 0) return;

    const showAll = () => targets.forEach((el) => el.classList.add("in"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }

    // 이미 화면 안에 있거나 위로 지나친 요소는 관찰 없이 즉시 표시
    const vh = window.innerHeight;
    const pending: HTMLElement[] = [];
    targets.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.94) el.classList.add("in");
      else pending.push(el);
    });

    const remaining = new Set(pending);
    const markIn = (el: HTMLElement) => {
      el.classList.add("in");
      remaining.delete(el);
      io?.unobserve(el);
    };

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) markIn(entry.target as HTMLElement);
              });
            },
            { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
          )
        : null;
    pending.forEach((el) => io?.observe(el));

    // 폴백 — IO가 없거나 발화하지 않는 환경에서도 스크롤 위치로 등장 처리.
    // IO가 정상이면 remaining이 먼저 비워져서 사실상 no-op.
    // (rAF는 백그라운드 탭 등에서 동결되므로 쓰지 않는다)
    let last = 0;
    const onScroll = () => {
      if (remaining.size === 0) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        return;
      }
      const now = Date.now();
      if (now - last < 90) return;
      last = now;
      const limit = window.innerHeight * 0.94;
      remaining.forEach((el) => {
        if (el.getBoundingClientRect().top < limit) markIn(el);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) showAll();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
