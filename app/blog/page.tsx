import type { Metadata } from "next";
import { SubNav, SubFooter } from "@/components/SubNav";
import { POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "비즈필터 블로그 | 온라인 강의 수요 검증 인사이트",
  description:
    "녹화하기 전에 강의 수요를 확인하는 법: 강의 주제 정하기, 페이크도어 수강신청 테스트, 클래스101 수요조사 vs 광고 검증, 수강생 모으기. 실전 검증 노트.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <SubNav />
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:py-20">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          블로그
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
          검증 노트
        </h1>
        <p className="mt-4 text-lg leading-[1.7] text-text-secondary">
          강의를 녹화하기 전에 확인해야 할 것들을 실제 검증 데이터와 안 팔린
          강의 사례 분석으로 정리한 실전 노트입니다.
        </p>
        <div className="mt-12 space-y-6">
          {POSTS.map((p) => (
            <a
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-lg border border-border bg-surface p-7 transition hover:-translate-y-0.5 hover:border-accent/60"
            >
              <p className="text-xs font-semibold text-text-tertiary">
                {p.date} · {p.readMinutes}분
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-snug text-text">
                {p.title}
              </h2>
              <p className="mt-3 leading-[1.7] text-text-secondary">
                {p.description}
              </p>
              <p className="mt-4 text-sm font-bold text-accent">
                읽기 →
              </p>
            </a>
          ))}
        </div>
      </section>
      <SubFooter />
    </main>
  );
}
