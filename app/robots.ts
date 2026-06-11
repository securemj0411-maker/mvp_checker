import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // "/b$" 는 광고 변형 /b 만 정확히 차단. "/b" (앵커 없음) 으로 쓰면
      // 접두사 매칭이라 /blog, /blog/* 까지 전부 막혔음 (RFC 9309).
      disallow: ["/admin", "/b$"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
