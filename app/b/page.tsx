import type { Metadata } from "next";
import Home from "../page";

// 광고 유입용 히어로 변형 (0.5초 컷). 중복 콘텐츠라 검색 인덱스 제외.
export const metadata: Metadata = {
  robots: { index: false },
};

export default function HomeB() {
  return <Home heroVariant="b" />;
}
