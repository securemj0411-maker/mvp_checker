import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit, ipKey } from "@/lib/ratelimit";
import {
  COMPLETED_STATUSES,
  decidePassBar,
  REFUND_POLICY,
  REVALIDATION_DISCOUNT_RATE,
  TIER_INFO,
  type BriefDraft,
  type ConfirmedBrief,
  type QuizAnswers,
} from "@/lib/diagnosis";

export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

/* ───────── 고객 대시보드 단계 (status + 브리프 상태에서 유도) ───────── */

export type Stage =
  | "brief" // 설계서 발급됨, 브리프 미확정
  | "deposit" // 브리프 확정, 입금 대기
  | "paid" // 입금 확인, 제작 준비
  | "build" // 사이트 제작 중
  | "live" // 광고 집행 중
  | "verdict" // 판정 완료
  | "closed";

function deriveStage(lead: {
  status: string | null;
  brief_confirmed_at: string | null;
}): Stage {
  const s = lead.status ?? "new";
  if (s === "paid") return "paid";
  if (s === "build") return "build";
  if (s === "live") return "live";
  if (s === "verdict") return "verdict";
  if (s === "won" || s === "lost") return "closed";
  return lead.brief_confirmed_at ? "deposit" : "brief";
}

function leadAnswers(lead: Record<string, unknown>): QuizAnswers {
  return {
    idea: (lead.idea as string) ?? "",
    ideaRefined: (lead.idea_refined as string) ?? null,
    service: (lead.service_type as QuizAnswers["service"]) ?? "unknown",
    build: (lead.build_status as QuizAnswers["build"]) ?? "need",
    audience: (lead.audience as QuizAnswers["audience"]) ?? "unknown",
    revenue: (lead.revenue_model as QuizAnswers["revenue"]) ?? "undecided",
    price: (lead.price_band as QuizAnswers["price"]) ?? "unknown",
    alternative:
      (lead.alternative as QuizAnswers["alternative"]) ?? "unknown",
    region: (lead.region as QuizAnswers["region"]) ?? null,
    location: (lead.location as string) ?? null,
    pageUrl: (lead.page_url as string) ?? null,
  };
}

/** 결제 의향으로 치는 버튼 문구 패턴 — 합격선 분자 */
const PAY_LABEL_OR = [
  "구매",
  "결제",
  "주문",
  "신청",
  "시작",
  "예약",
  "구독",
  "등록",
]
  .map((w) => `label.ilike.%${w}%`)
  .join(",");

/** 실측 숫자 집계 (광고비/금액 정보는 어떤 형태로도 포함하지 않는다) */
async function leadStats(
  admin: ReturnType<typeof getSupabaseAdmin>,
  leadId: string,
) {
  const [pv, clicks, pay, signups] = await Promise.all([
    admin
      .from("o2o_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("type", "pageview"),
    admin
      .from("o2o_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("type", "click"),
    admin
      .from("o2o_events")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("type", "click")
      .or(PAY_LABEL_OR),
    // 검증 사이트 사전등록 제출 = 진짜 전환 신호 (모달 열기 클릭과 별개)
    admin
      .from("o2o_signups")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId),
  ]);
  return {
    visits: pv.count ?? 0,
    clicks: clicks.count ?? 0,
    payClicks: pay.count ?? 0,
    signups: signups.count ?? 0,
  };
}

/** 일자별 방문·결제 추세 (추세 차트용). 광고비/금액 정보 없음. */
async function leadSeries(
  admin: ReturnType<typeof getSupabaseAdmin>,
  leadId: string,
): Promise<{ d: string; visits: number; pay: number }[]> {
  const PAY_WORDS = ["구매", "결제", "주문", "신청", "시작", "예약", "구독", "등록"];
  const [ev, sg] = await Promise.all([
    admin
      .from("o2o_events")
      .select("created_at, type, label")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(5000),
    admin
      .from("o2o_signups")
      .select("created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(5000),
  ]);
  const dayKey = (ts: string) =>
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(ts));
  const byDay = new Map<
    string,
    { visits: number; clickPay: number; signups: number }
  >();
  const row = (k: string) =>
    byDay.get(k) ?? { visits: 0, clickPay: 0, signups: 0 };
  for (const e of ev.data ?? []) {
    const k = dayKey(e.created_at as string);
    const r = row(k);
    if (e.type === "pageview") r.visits += 1;
    else if (
      e.type === "click" &&
      e.label &&
      PAY_WORDS.some((w) => (e.label as string).includes(w))
    )
      r.clickPay += 1;
    byDay.set(k, r);
  }
  const hasSignups = (sg.data ?? []).length > 0;
  for (const s of sg.data ?? []) {
    const k = dayKey(s.created_at as string);
    const r = row(k);
    r.signups += 1;
    byDay.set(k, r);
  }
  // pay = 실제 사전등록 제출(있으면), 없으면 t.js 결제성 클릭(외부 페이지 호환)
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ d, visits: v.visits, pay: hasSignups ? v.signups : v.clickPay }));
}

function publicLead(lead: Record<string, unknown>) {
  const answers = leadAnswers(lead);
  const passBar = decidePassBar(answers);
  return {
    name: lead.name,
    // 공개 측정 토큰 (광고 노출용 — 대시보드 키 access_code와 분리)
    siteToken: (lead.site_token as string) ?? null,
    stage: deriveStage(
      lead as { status: string | null; brief_confirmed_at: string | null },
    ),
    tier: (lead.tier as string) ?? "quick",
    idea: lead.idea,
    ideaRefined: lead.idea_refined,
    report: lead.ai_report,
    brief: lead.brief,
    briefConfirmedAt: lead.brief_confirmed_at,
    depositDueAt: lead.deposit_due_at,
    policyFlag: lead.policy_flag ?? "none",
    pageMeasurable: lead.page_measurable,
    hasPageUrl: !!lead.page_url,
    tagVerified: !!lead.page_tag_verified_at,
    // 구글애즈 실측 — 노출·클릭만 고객에게. 광고비(spend)는 절대 노출 금지.
    adStats: (() => {
      const a = lead.ad_stats as
        | {
            impressions?: number;
            clicks?: number;
            visits?: number;
            conversions?: number;
          }
        | null;
      if (!a) return null;
      return {
        impressions: Number(a.impressions ?? 0),
        clicks: Number(a.clicks ?? 0),
        visits: Number(a.visits ?? 0),
        conversions: Number(a.conversions ?? 0),
      };
    })(),
    passBar,
    tiers: TIER_INFO,
    refundPolicy: REFUND_POLICY,
  };
}

async function findLead(code: string) {
  const admin = getSupabaseAdmin();
  const normalized = code.trim().toUpperCase().replace(/\s/g, "");
  const { data, error } = await admin
    .from("o2o_leads")
    .select("*")
    .eq("access_code", normalized)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

/** 재검증 할인 판정 — 같은 전화번호로 '이 리드보다 먼저' 만들어졌고
 *  입금 후 단계(paid 이상)까지 간 리드가 1건 이상이면 이 리드는 재검증으로 본다.
 *  전화번호가 없거나(식별 불가) 이전 완료 건이 없으면 null(할인 없음). */
async function revalidationFor(
  admin: ReturnType<typeof getSupabaseAdmin>,
  lead: Record<string, unknown>,
): Promise<{ eligible: true; priorCount: number; rate: number } | null> {
  const phone = (lead.phone as string | null)?.trim();
  if (!phone) return null;
  let q = admin
    .from("o2o_leads")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .neq("id", lead.id as string)
    .in("status", COMPLETED_STATUSES as unknown as string[]);
  const createdAt = lead.created_at as string | null;
  if (createdAt) q = q.lt("created_at", createdAt);
  const { count, error } = await q;
  if (error) {
    console.error("[revalidation count]", error);
    return null; // 조회 실패 시 안전하게 할인 미적용 (정가)
  }
  const priorCount = count ?? 0;
  if (priorCount <= 0) return null;
  return { eligible: true, priorCount, rate: REVALIDATION_DISCOUNT_RATE };
}

/* ───────── 브리프 초안 생성 (B-2 양식, B-3/B-4/B-5 규칙) ───────── */

const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    offer_options: {
      type: "array",
      description:
        "사이트 헤드라인이 될 오퍼 한 문장 정확히 2안. 서로 파는 각도가 달라야 한다.",
      items: {
        type: "object",
        properties: {
          headline: {
            type: "string",
            description:
              "약속 한 문장. 결과 중심, 기능 나열 금지, 30자 안팎 (예: 노쇼 손님, 예약금이 막아드립니다)",
          },
          angle: {
            type: "string",
            description: "이 안이 파는 각도 한 줄 (예: 손실 방어 소구)",
          },
        },
        required: ["headline", "angle"],
        additionalProperties: false,
      },
    },
    target_line: {
      type: "string",
      description:
        "타깃 한 줄. 나이/직업/상황 중 2개 이상 포함 (예: 예약제로 운영하는 1인 동네 미용실 원장)",
    },
    problem_line: {
      type: "string",
      description: "타깃이 돈이나 시간을 쓰며 겪는 문제 한 줄",
    },
    price_value: {
      type: "integer",
      description:
        "고객 제품을 검증 페이지에 표시할 가격 숫자 하나 (원 단위). 고객이 답한 가격대 구간 안에서, 고객의 결제 방식에 맞는 자연스러운 숫자. 구독이면 월 요금, 단건이면 1회 가격, 수수료/광고형이면 대표 객단가. 고객 제품의 가격이지 비즈필터 검증 서비스 가격이 아니다.",
    },
    price_rationale: {
      type: "string",
      description:
        "그 가격을 제안하는 근거 한 문장. 고객 제품과 시장 시세 관점으로만. 비즈필터(검증 서비스) 관점의 문장 금지.",
    },
    selling_points: {
      type: "array",
      description:
        "고객 제품을 사는 이유 정확히 3개 (내부 광고 제작용, 고객에게 노출 안 됨). 현재 대안의 약점에서 역산. 비즈필터 검증 서비스의 장점(노코드, 광고 세팅 대행, 단건 비용 등)을 절대 적지 말 것. 오직 고객 제품 자체의 구매 이유.",
      items: { type: "string" },
    },
    name_candidates: {
      type: "array",
      description:
        "고객 제품의 검증용 가칭 2~3개. 한글, 발음 쉬움, 고객 제품 내용이 연상되는 이름. '비즈필터', '검증', '팔릴까' 같은 메타 단어 금지. 기존 유명 브랜드와 겹치지 않게.",
      items: { type: "string" },
    },
    excluded: {
      type: "array",
      description:
        "고객 제품 아이디어 중 이번 7일에 빼는 기능/타깃 1~3개 (내부 스코프 기록용, 고객에게 노출 안 됨). 반드시 고객 제품의 범위에 대한 것. '광고 채널 자동 집행', '연동 기능' 같은 비즈필터 검증 작업 관련 용어 절대 금지. 빈 배열 금지.",
      items: { type: "string" },
    },
    intake_questions: {
      type: "array",
      description:
        "전화 상담 없이 이 검증용 사이트·광고를 '만들기 위해' 아직 비는 정보를 고객에게 묻는 질문 정확히 2~3개. 앞 단계(아이디어·퀴즈·가격·대안)에서 이미 받은 건 묻지 말 것. 빌드에 바로 쓰이는 것만: 페이지에 넣을 신뢰 요소(실적·경력·자격·후기), 광고에서 꼭 강조할/절대 쓰면 안 될 표현, 비주얼 톤·느낌, 기존 대안 대비 한 줄 차별점(아직 불명확하면), 타깃이 검색할 법한 단어 등. 이 아이디어에 특정한 것만, 일반론 금지.",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "짧은 한글 라벨. 예: 신뢰 요소, 광고 톤, 차별점, 검색어",
          },
          question: {
            type: "string",
            description: "고객에게 보일 질문 한 문장. 쉬운 말, 경어체.",
          },
          suggestions: {
            type: "array",
            description:
              "그럴듯한 답 3~4개. 각 12자 안팎으로 짧고 구체적이며 서로 다르게.",
            items: { type: "string" },
          },
        },
        required: ["key", "question", "suggestions"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "offer_options",
    "target_line",
    "problem_line",
    "price_value",
    "price_rationale",
    "selling_points",
    "name_candidates",
    "excluded",
    "intake_questions",
  ],
  additionalProperties: false,
} as const;

async function generateBrief(
  lead: Record<string, unknown>,
): Promise<BriefDraft | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  const answers = leadAnswers(lead);
  const report = lead.ai_report as Record<string, unknown> | null;

  const facts = [
    `아이디어 원문: ${answers.idea}`,
    answers.ideaRefined ? `창업자가 고른 해석: ${answers.ideaRefined}` : null,
    report?.one_liner ? `설계서 한 문장: ${report.one_liner}` : null,
    report?.target ? `설계서 타깃: ${report.target}` : null,
    report?.problem ? `설계서 문제: ${report.problem}` : null,
    report?.current_alternative
      ? `현재 대안: ${report.current_alternative}`
      : null,
    `가격대 감: ${answers.price}`,
    `결제 방식: ${answers.revenue}`,
    answers.location ? `지역: ${answers.location}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: BRIEF_SCHEMA } },
    system: [
      "당신은 사업 아이디어 검증 회사 '비즈필터'의 검증 설계자입니다.",
      "고객(창업자)이 만들려는 '고객의 제품'을 광고로 검증하기 위한 브리프 초안을 작성합니다.",
      "",
      "가장 중요한 원칙 (위반 시 전부 무효):",
      "- 검증 대상은 언제나 '고객의 제품 아이디어'입니다. 비즈필터(이 검증 서비스) 자체를 검증 대상으로 삼지 마세요.",
      "- 고객 아이디어가 모호하거나 '검증 서비스' 비슷하게 들려도, 비즈필터의 타깃(예비 창업자)/오퍼(만들기 전에 검증)/장점(노코드, 광고 대행, 단건 비용)을 결과에 넣지 마세요. 그건 우리 서비스이지 고객 제품이 아닙니다.",
      "- 모든 필드(오퍼, 타깃, 가격, 소구점, 가칭)는 고객이 팔려는 그 제품에 대한 것이어야 합니다.",
      "",
      "작성 규칙:",
      "- 오퍼 한 문장 공식: [타깃]이 [문제]를 겪을 때 [현재 대안] 대신 [오퍼]를 쓰게 한다. 헤드라인 자체는 고객 제품을 사려는 사람에게 말 거는 약속 문장으로 씁니다.",
      "- 2안은 서로 다른 각도여야 합니다 (예: 문제 해결 소구 vs 가격·간편 소구).",
      "- 가격은 고객이 답한 구간을 벗어나지 않고, 고객의 결제 방식(구독/단건/수수료)에 맞는 숫자로.",
      "- 모든 문장 경어체. 줄표(—) 금지. 과장 금지. '국내 최초', '최고' 같은 검증 안 된 수식어 금지.",
      "- 용어 규칙(설명문에만): price_rationale 처럼 창업자에게 설명하는 문장에서 업계 용어를 쓰면 처음 나올 때 괄호로 쉬운 설명을 병기합니다(영어 약자는 한글 풀이 괄호). 단, 오퍼 헤드라인은 최종 소비자용 광고 문구이므로 짧고 강하게 쓰고 괄호 설명을 넣지 않습니다.",
      "",
      "intake_questions(전문가 사전 점검): 위 초안을 실제 사이트·광고로 '전화 없이' 만들 때 당신(설계자)이 아직 모르는, 그래서 고객에게 직접 물어야 정확해지는 것 2~3개를 질문으로 만드세요. 각 질문에 고객이 탭할 그럴듯한 보기 3~4개를 미리 채웁니다.",
      "intake_questions 중복 금지(중요): 앞 단계에서 이미 받은 건 절대 다시 묻지 마세요. 구체적으로 '창업자가 고른 해석'에 이미 적힌 타깃·핵심 소구(어필 포인트)·차별점, 그리고 가격·결제 방식·현재 대안은 다시 묻지 않습니다. 이미 만든 target_line/selling_points/offer 와 같은 주제도 다시 묻지 마세요. 오직 '제작에만 필요한 새 디테일'만 물으세요: 페이지에 넣을 신뢰 요소(실적·경력·자격·후기), 광고에서 꼭 쓰거나 절대 쓰면 안 될 표현·규제, 비주얼 톤·느낌, 타깃이 검색할 단어 등.",
    ].join("\n"),
    messages: [{ role: "user", content: facts }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  return JSON.parse(text.text) as BriefDraft;
}

/* ───────── 라우트 ───────── */

interface BriefBody {
  action?: string;
  code?: string;
  tier?: "engine" | "quick";
  confirmed?: ConfirmedBrief;
  agreement?: string;
  cancel?: boolean;
}

export async function POST(request: Request) {
  // access_code 열거·폭주 보호 — IP당 분당 제한
  if (!rateLimit(ipKey(request, "brief"), 30, 60_000))
    return Response.json({ error: "rate_limited" }, { status: 429 });
  let body: BriefBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (code.length < 8) {
    return Response.json({ error: "invalid code" }, { status: 400 });
  }
  const lead = await findLead(code);
  if (!lead) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const admin = getSupabaseAdmin();

  /* 대시보드 상태 조회 */
  if (body.action === "get") {
    const pub = publicLead(lead) as ReturnType<typeof publicLead> & {
      stats?: {
        visits: number;
        clicks: number;
        payClicks: number;
        signups: number;
      } | null;
      series?: { d: string; visits: number; pay: number }[] | null;
      revalidation?: {
        eligible: true;
        priorCount: number;
        rate: number;
      } | null;
    };
    // 광고가 켜진 뒤에는 실측 숫자 + 일자별 추세를 같이 내려보낸다 (금액 제외)
    if (["live", "verdict", "closed"].includes(pub.stage)) {
      const [stats, series] = await Promise.all([
        leadStats(admin, lead.id as string),
        leadSeries(admin, lead.id as string),
      ]);
      pub.stats = stats;
      pub.series = series;
    }
    // 재검증 할인 여부 — 가격이 노출/확정되는 브리프·입금 단계에서만 계산
    if (pub.stage === "brief" || pub.stage === "deposit") {
      pub.revalidation = await revalidationFor(admin, lead);
    }
    return Response.json({ lead: pub });
  }

  /* 브리프 초안 생성 (이미 있으면 재사용) */
  if (body.action === "draft") {
    const existing = lead.brief as { draft?: BriefDraft } | null;
    if (existing?.draft) {
      return Response.json({ draft: existing.draft });
    }
    if ((lead.policy_flag as string) === "prohibited") {
      return Response.json({ error: "policy blocked" }, { status: 403 });
    }
    try {
      const draft = await generateBrief(lead);
      if (!draft) {
        return Response.json({ error: "draft failed" }, { status: 503 });
      }
      await admin
        .from("o2o_leads")
        .update({ brief: { draft } })
        .eq("id", lead.id as string);
      return Response.json({ draft });
    } catch (e) {
      console.error("[brief draft]", e);
      return Response.json({ error: "draft failed" }, { status: 503 });
    }
  }

  /* 브리프 확정 — 버튼 클릭이 곧 동의 (타이핑 마찰 제거). 기록은 백엔드에서 */
  if (body.action === "confirm") {
    const { confirmed, tier } = body;
    if (!confirmed || (tier !== "engine" && tier !== "quick")) {
      return Response.json({ error: "missing fields" }, { status: 400 });
    }
    // 서버측 검증 — 클라 우회로 음수/0 가격·빈 플랜·빈 오퍼가 들어오는 것 차단
    if (!(confirmed.offer ?? "").trim() || !(confirmed.name ?? "").trim()) {
      return Response.json({ error: "invalid brief" }, { status: 400 });
    }
    if (confirmed.plans && confirmed.plans.length > 0) {
      confirmed.plans = confirmed.plans
        .filter(
          (p) =>
            p &&
            typeof p.price === "number" &&
            p.price > 0 &&
            (p.label ?? "").trim(),
        )
        .map((p) => ({
          label: String(p.label).trim().slice(0, 60),
          price: Math.round(p.price),
          desc: p.desc ? String(p.desc).trim().slice(0, 200) : undefined,
        }));
      if (confirmed.plans.length === 0) {
        return Response.json({ error: "invalid plans" }, { status: 400 });
      }
      confirmed.price_value = confirmed.plans[0].price;
    } else if (!(confirmed.price_value > 0)) {
      return Response.json({ error: "invalid price" }, { status: 400 });
    }
    // 입금 전(deposit)까지는 재수정(고객이 '수정하기')을 허용한다.
    // 입금/제작 이후(paid·build·live·verdict·closed)에는 잠금 — 중복 클릭 포함.
    const stage = deriveStage(
      lead as { status: string | null; brief_confirmed_at: string | null },
    );
    const isEdit = !!lead.brief_confirmed_at;
    if (isEdit && stage !== "deposit") {
      return Response.json({ lead: publicLead(lead) });
    }

    const now = new Date();
    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 입금 기한 3일
    const existing = lead.brief as { draft?: BriefDraft } | null;
    const answers = leadAnswers(lead);
    const pb = decidePassBar(answers); // 합격선은 코드가 결정, 고객에게 안 떠넘김

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;

    // 그 순간 화면에 표시된 합의 내용 전문 스냅샷 — 분쟁 방어의 원본 (고객은 안 봐도 기록은 남김)
    const planLine =
      confirmed.plans && confirmed.plans.length > 0
        ? confirmed.plans
            .map(
              (p) =>
                `${p.label} ${p.price.toLocaleString()}원${p.desc ? ` (${p.desc})` : ""}`,
            )
            .join(" / ")
        : `${confirmed.price_value.toLocaleString()}원`;
    // 재검증 할인 — 동일 전화번호로 이전 완료 건이 있으면 30% 할인. 입금액을 여기서
    // 잠가(brief.deposit_amount) 입금 화면·관리자·분쟁 기록이 같은 숫자를 쓰게 한다.
    const reval = await revalidationFor(admin, lead);
    const listPrice = TIER_INFO[tier].price;
    const depositAmount = reval
      ? Math.round(listPrice * (1 - reval.rate))
      : listPrice;
    const priceSnapshotLine = reval
      ? `상품: ${TIER_INFO[tier].label} — 재검증 ${Math.round(
          reval.rate * 100,
        )}% 할인 적용, 입금액 ${depositAmount.toLocaleString()}원 (정가 ${listPrice.toLocaleString()}원)`
      : `상품: ${TIER_INFO[tier].label} ${TIER_INFO[tier].priceLabel}`;

    const snapshot = [
      `오퍼: ${confirmed.offer}`,
      `타깃: ${confirmed.target_line}`,
      `표시 가격·플랜 구성: ${planLine}`,
      `가칭: ${confirmed.name}`,
      ...(confirmed.notes ? [`고객 강조 요청: ${confirmed.notes}`] : []),
      ...(confirmed.intake && confirmed.intake.length > 0
        ? [
            `전문가 사전 점검 답변:\n${confirmed.intake
              .map((x) => `  - ${x.q}: ${x.a}`)
              .join("\n")}`,
          ]
        : []),
      `판정 기준(합격선): ${pb.bar} (최소 표본 ${pb.minSample}, 미달 시 비율 환산 또는 1~2일 연장)`,
      priceSnapshotLine,
      `환불 규정: ${REFUND_POLICY.join(" | ")}`,
      `확정 방식: '이 브리프로 확정하고 진행하기' 버튼 클릭`,
    ].join("\n");

    const fullConfirmed: ConfirmedBrief = {
      ...confirmed,
      pass_bar: pb.bar,
      min_sample: pb.minSample,
      shortfall_choice: confirmed.shortfall_choice ?? "ratio",
    };

    const { error: updateError } = await admin
      .from("o2o_leads")
      .update({
        brief: {
          ...(existing ?? {}),
          confirmed: fullConfirmed,
          // 입금 화면·관리자가 함께 쓰는 확정 입금액(할인 반영). 재검증이면 할인율도 보관.
          deposit_amount: depositAmount,
          ...(reval ? { revalidation_rate: reval.rate } : {}),
        },
        tier,
        // 최초 확정에만 타임스탬프/입금기한을 찍는다. 수정 시엔 기한을 늘리지 않음.
        ...(isEdit
          ? {}
          : {
              brief_confirmed_at: now.toISOString(),
              pass_bar_agreed_at: now.toISOString(),
              deposit_due_at: due.toISOString(),
            }),
      })
      .eq("id", lead.id as string);
    if (updateError) {
      console.error("[brief confirm]", updateError);
      return Response.json({ error: "confirm failed" }, { status: 500 });
    }

    const { error: consentError } = await admin.from("consent_events").insert([
      {
        lead_id: lead.id as string,
        event_type: isEdit ? "brief_edited" : "brief_confirmed",
        content: snapshot,
        ip,
        user_agent: ua,
      },
    ]);
    if (consentError) console.error("[consent insert]", consentError);

    const fresh = await findLead(code);
    return Response.json({ lead: fresh ? publicLead(fresh) : null });
  }

  /* '입금했어요' — 고객이 계좌이체 후 직접 알림. 발송이 아니라 운영자 확인용 신호.
     입금 대기(deposit) 단계에서만 의미 있고, 중복 클릭은 무시한다.
     cancel=true 면 오클릭/미이체 신고를 되돌린다(deposit_reported_at 제거). */
  if (body.action === "report_deposit") {
    const stage = deriveStage(
      lead as { status: string | null; brief_confirmed_at: string | null },
    );
    if (stage !== "deposit") {
      // 아직 확정 전이거나 이미 입금 처리됨 — 현재 상태만 돌려준다(no-op)
      return Response.json({ lead: publicLead(lead) });
    }
    const existing = (lead.brief as Record<string, unknown>) ?? {};
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;

    if (body.cancel) {
      // 되돌리기 — 입금 신고 취소 (다시 입금 대기 화면으로)
      if (existing.deposit_reported_at) {
        const rest = { ...existing };
        delete rest.deposit_reported_at;
        const { error: upErr } = await admin
          .from("o2o_leads")
          .update({ brief: rest })
          .eq("id", lead.id as string);
        if (upErr) {
          console.error("[report_deposit cancel]", upErr);
          return Response.json({ error: "cancel failed" }, { status: 500 });
        }
        await admin.from("consent_events").insert([
          {
            lead_id: lead.id as string,
            event_type: "deposit_report_undo",
            content: "고객이 '입금했어요'를 되돌림(오클릭/미이체)",
            ip,
            user_agent: ua,
          },
        ]);
      }
      const fresh = await findLead(code);
      return Response.json({ lead: fresh ? publicLead(fresh) : null });
    }

    if (!existing.deposit_reported_at) {
      const { error: upErr } = await admin
        .from("o2o_leads")
        .update({
          brief: { ...existing, deposit_reported_at: new Date().toISOString() },
        })
        .eq("id", lead.id as string);
      if (upErr) {
        console.error("[report_deposit]", upErr);
        return Response.json({ error: "report failed" }, { status: 500 });
      }
      // 분쟁/정산 대비 가벼운 감사 로그 (동의가 아닌 알림 기록)
      const { error: logErr } = await admin.from("consent_events").insert([
        {
          lead_id: lead.id as string,
          event_type: "deposit_reported",
          content: "고객이 '입금했어요' 버튼을 눌러 입금을 알림",
          ip,
          user_agent: ua,
        },
      ]);
      if (logErr) console.error("[deposit_reported log]", logErr);
    }
    const fresh = await findLead(code);
    return Response.json({ lead: fresh ? publicLead(fresh) : null });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
