import type { Metadata } from "next";
import BriefFlow from "@/components/BriefFlow";

export const metadata: Metadata = {
  title: "내 검증 현황 | 비즈필터",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <main className="min-h-screen bg-bg">
      <BriefFlow code={code} />
    </main>
  );
}
