/**
 * 경량 인메모리 레이트리밋 (고정 윈도우).
 * 서버리스 인스턴스별 카운터라 분산 공격엔 약하지만, 단일 출처 폭주·실수성
 * 반복·봇 스팸의 1차 방어로는 충분하다. 강한 보호가 필요하면 Upstash/Vercel KV
 * 같은 공유 스토어로 rateLimit 내부만 교체하면 된다.
 */
type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // 가끔 만료 엔트리 청소 (메모리 누수 방지)
  if (store.size > 5000) {
    for (const [k, v] of store) if (now > v.reset) store.delete(k);
  }
  const h = store.get(key);
  if (!h || now > h.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (h.count >= limit) return false;
  h.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

/** key = bucket:IP — 엔드포인트별 IP 제한용 */
export function ipKey(req: Request, bucket: string): string {
  return `${bucket}:${clientIp(req)}`;
}
