import type { Metadata } from "next";

// /d 진입(로그인/코드 입력) 페이지는 "use client"라 자체 metadata를 못 둔다.
// 레이아웃에서 제목·noindex를 주어 탭 제목이 홈 마케팅 문구로 뜨는 것 방지하고
// 형제(/d/me, /d/[code])와 일관되게 한다. 자식 페이지는 자체 title로 덮어쓴다.
export const metadata: Metadata = {
  title: "내 검증 현황 | 비즈필터",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
