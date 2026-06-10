import { redirect } from "next/navigation";

// 유튜브 설명란·고정댓글용 짧은 링크 — 유입 채널 태깅 후 메인으로
export function GET() {
  redirect("/?utm_source=youtube");
}
