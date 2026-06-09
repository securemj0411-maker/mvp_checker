import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "0to1 — 의견 말고 증거를 드립니다 | 아이디어→첫 결제 런칭 파트너",
  description:
    "AI 시대, 진짜 수요는 AI가 안 알려줍니다. 실제 광고+데이터로 검증하고, 안 될 건 빨리 접고, 될 것만 만들어 첫 고객까지. 15만원부터 시작.",
  openGraph: {
    title: "0to1 — 의견 말고 증거를 드립니다",
    description:
      "검증→제작→첫 고객. 안 될 것 같으면 만들지 말라고 말해드립니다.",
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
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
