"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { ADS_KAKAO_CONVERSION, KAKAO_CHAT_URL } from "@/lib/site";

/**
 * 카카오 채널 상담 CTA. 클릭 시 GA4 `kakao_open` 이벤트를 발화해
 * 광고 전환(리드)으로 추적 가능하게 한다. `from`으로 어느 버튼인지 구분.
 */
export function KakaoCTA({
  from,
  children,
  ...rest
}: { from: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      href={KAKAO_CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        sendGAEvent("event", "kakao_open", { from });
        // Google Ads 네이티브 전환("문의") — 카톡 상담 클릭
        sendGAEvent("event", "conversion", { send_to: ADS_KAKAO_CONVERSION });
      }}
    >
      {children}
    </a>
  );
}
