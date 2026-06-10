import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubNav, SubFooter } from "@/components/SubNav";
import { POSTS, getPost } from "@/lib/posts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — ${SITE_NAME}`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      locale: "ko_KR",
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: post.keywords.join(", "),
  };

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SubNav />
      <article className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:py-20">
        <p className="text-xs font-semibold text-text-tertiary">
          {post.date} · {post.readMinutes}분 · 비즈필터 검증 노트
        </p>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.25] tracking-[-0.03em] sm:text-4xl">
          {post.title}
        </h1>
        <div
          className="prose-bf mt-10 space-y-6 text-[1.0625rem] leading-[1.8] text-text-secondary
            [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-text
            [&_strong]:font-bold [&_strong]:text-text
            [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4
            [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-6 [&_blockquote]:text-text"
        >
          {post.content}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-lg border border-accent/40 bg-accent/[0.05] p-8">
          <p className="text-xl font-bold text-text">
            이 과정을 7일 안에 대신 끝내드립니다
          </p>
          <p className="mt-3 leading-[1.7] text-text-secondary">
            페이지 제작, 광고 집행, 합격선 설계, 숫자 해석까지 — 직접 하기
            번거로우시면 맡기세요. 수요 신호가 없으면 50% 환불, 신청은 결제가
            아닙니다.
          </p>
          <a
            href="/#cta"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-3.5 text-base font-bold text-white transition hover:bg-accent-hover"
          >
            내 아이디어 검증 신청하기
          </a>
        </div>
      </article>
      <SubFooter />
    </main>
  );
}
