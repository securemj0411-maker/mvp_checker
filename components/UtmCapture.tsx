"use client";

import { useEffect } from "react";

/**
 * 유입 출처 캡처 — 루트 레이아웃에 마운트해 '첫 착지' 페이지에서 실행된다.
 *
 * 메인 CTA는 <a href="/start">(쿼리 없음)로 퀴즈로 보내므로, 광고가 / 에 붙인
 * utm_source·gclid 는 /start 로 넘어가는 순간 URL에서 사라진다. 그래서 착지 시점에
 * 세션에 저장해 둬야 LeadForm 의 getUtm()(sessionStorage "o2o_utm")이 끝까지 읽을 수 있다.
 *
 * 주의: 구글애즈 '전환' 귀속은 gtag.js 의 _gcl_aw 쿠키가 알아서 처리한다(레이아웃 로드).
 * 이 컴포넌트는 '내부 리드 출처표기'(DB o2o_leads.utm_source / 관리자 '유입')만 담당한다.
 */
export function UtmCapture() {
  useEffect(() => {
    try {
      const KEY = "o2o_utm";
      // 같은 세션에서 이미 잡았으면 덮어쓰지 않는다(첫 유입이 진짜 출처).
      if (sessionStorage.getItem(KEY)) return;

      const qs = new URLSearchParams(window.location.search);
      const utm = qs.get("utm_source");
      const gclid = qs.get("gclid") || qs.get("gad_source") || qs.get("gbraid") || qs.get("wbraid");

      // utm_source 우선, 없으면 gclid 등 구글애즈 신호가 있으면 google_ads 로 태깅
      // (관리자 isAd() 정규식 /google|cpc|ad|gclid/ 와 매칭되도록)
      const source = utm || (gclid ? "google_ads" : null);
      if (source) sessionStorage.setItem(KEY, source.slice(0, 50));
    } catch {
      /* 세션스토리지 불가 환경 무시 */
    }
  }, []);

  return null;
}
