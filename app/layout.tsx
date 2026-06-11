import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_DESC } from "@/lib/site";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "비즈필터 | 사업 아이디어 검증, 만들기 전에 수요부터 확인",
  description:
    "그 아이디어가 먹힐지, 만들기 전에 확인하세요. 검증용 사이트 제작부터 광고 집행, 수요 분석까지 7일 안에 사업 가능성을 데이터로 확인합니다. Go/No-Go 판정 보장.",
  openGraph: {
    title: "비즈필터 | 사업 아이디어, 만들기 전에 검증",
    description:
      "검증용 사이트 제작부터 광고 집행, 수요 분석까지. 7일 안에 사업 가능성을 데이터로 확인합니다. 업종 제한 없음.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  verification: {
    other: {
      "naver-site-verification": "c7f7e41486761eb43204a04d7eb59ccf3eaab783",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 첫 페인트 전에 실행 — reveal 깜빡임 방지 게이트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESC,
            }),
          }}
        />
        {children}
      </body>
      {GA_ID && process.env.NODE_ENV === "production" && (
        <GoogleAnalytics gaId={GA_ID} />
      )}
    </html>
  );
}
