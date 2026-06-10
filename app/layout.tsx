import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_DESC } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "비즈필터 — 만들기 전에 살 사람이 있는지 확인하세요",
  description:
    "개발비와 시간을 쓰기 전, 진짜 광고 데이터로 클릭·문의·결제 의향을 먼저 확인합니다. 수요 신호가 없으면 50% 환불.",
  openGraph: {
    title: "비즈필터 — 만들기 전에 살 사람이 있는지 확인하세요",
    description:
      "진짜처럼 보이는 페이지 + 광고 + 행동 데이터로 사업 아이디어를 검증하는 서비스.",
    type: "website",
    locale: "ko_KR",
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&display=swap"
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
    </html>
  );
}
