import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_DESC, ADS_CONVERSION_ID } from "@/lib/site";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// 모바일(특히 iOS) 키보드가 떠도 입력창이 가려지지 않게 콘텐츠 영역을 줄인다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "비즈필터 | 온라인 강의 수요 검증 — 녹화 전에 팔리는지 확인",
  description:
    "그 강의, 찍기 전에 살 사람부터 확인하세요. 실서비스 같은 수강신청 페이지에 진짜 광고를 걸어, 무료 응원 클릭이 아닌 진짜 수강신청(결제 의향)을 신청 당일 시작해 보통 2~3일이면 측정합니다. 강의 주제만 정하면 시작 — 온라인·오프라인 강의, 전자책, 클래스 모두. Go/No-Go 판정 보장.",
  openGraph: {
    title: "비즈필터 | 강의, 녹화하기 전에 수요 검증",
    description:
      "실서비스 같은 수강신청 페이지 + 진짜 광고로 신청 당일 시작해 보통 2~3일이면 수강 의향을 데이터로 확인합니다. 강의 주제만 정하면 시작.",
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
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* 첫 페인트 전에 실행 — reveal 깜빡임 방지 게이트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        {/* Google Ads 네이티브 전환 — 프로덕션에서만. gtag.js는 GoogleAnalytics가 로드하고, 여기선 AW 대상만 등록 */}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ADS_CONVERSION_ID}');`,
            }}
          />
        )}
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
