import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  decidePassBar,
  REFUND_POLICY,
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

function publicLead(lead: Record<string, unknown>) {
  const answers = leadAnswers(lead);
  const passBar = decidePassBar(answers);
  return {
    name: lead.name,
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
        "검증 사이트에 표시할 가격 숫자 하나 (원 단위). 고객이 답한 가격대 구간 안에서, 유사 서비스 시세를 고려한 자연스러운 숫자 (예: 29000)",
    },
    price_rationale: {
      type: "string",
      description: "그 가격을 제안하는 근거 한 문장",
    },
    selling_points: {
      type: "array",
      description:
        "핵심 소구점 정확히 3개. 현재 대안의 약점에서 역산 (더 싸다/빠르다/간편하다 중 해당되는 것). 광고 문구와 사이트 섹션이 된다.",
      items: { type: "string" },
    },
    name_candidates: {
      type: "array",
      description:
        "검증용 가칭 2~3개. 한글, 발음 쉬움, 서비스 내용이 연상되는 이름. 기존 유명 브랜드와 겹치지 않게.",
      items: { type: "string" },
    },
    excluded: {
      type: "array",
      description:
        "이번 검증에서 다루지 않는 기능/타깃/메시지 1~3개. 아이디어에 있었지만 한 문장에 안 들어간 것들. 빈 배열 금지.",
      items: { type: "string" },
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
      "창업자의 무료 설계서를 바탕으로 '검증 브리프' 초안을 작성합니다. 이 브리프가 그대로 검증용 사이트의 헤드라인, 가격 표시, 광고 문구가 됩니다.",
      "",
      "규칙:",
      "- 오퍼 한 문장 공식: [타깃]이 [문제]를 겪을 때 [현재 대안] 대신 [오퍼]를 쓰게 한다. 단 헤드라인 자체는 고객에게 말 거는 약속 문장으로 쓴다.",
      "- 2안은 서로 다른 각도여야 한다 (예: 문제 해결 소구 vs 가격/간편 소구).",
      "- 가격은 고객이 답한 구간을 벗어나지 않는다. 9,900원 같은 시장 관행 숫자를 쓴다.",
      "- 모든 문장 경어체. 줄표(—) 금지. 과장 금지. '국내 최초', '최고' 같은 검증 안 된 수식어 금지.",
      "- excluded에는 아이디어에 있었지만 이번 7일 검증에서 빼는 것을 적는다. 이번에 통하면 다음에 시험한다는 뉘앙스.",
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
}

export async function POST(request: Request) {
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
    return Response.json({ lead: publicLead(lead) });
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

  /* 브리프 확정 + 합격선 동의 — 통화 없는 킥오프의 완성 지점 */
  if (body.action === "confirm") {
    const { confirmed, tier, agreement } = body;
    if (!confirmed || (tier !== "engine" && tier !== "quick")) {
      return Response.json({ error: "missing fields" }, { status: 400 });
    }
    // 합격선 동의는 체크박스가 아니라 직접 타이핑 — 증거력과 각인
    if (agreement?.trim() !== "동의합니다") {
      return Response.json({ error: "agreement required" }, { status: 400 });
    }
    if (lead.brief_confirmed_at) {
      return Response.json({ lead: publicLead(lead) }); // 이미 확정됨 (중복 클릭)
    }

    const now = new Date();
    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 입금 기한 3일
    const existing = lead.brief as { draft?: BriefDraft } | null;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;

    // 그 순간 화면에 표시된 합의 내용 전문 스냅샷 — 분쟁 방어의 원본
    const snapshot = [
      `오퍼: ${confirmed.offer}`,
      `타깃: ${confirmed.target_line}`,
      `문제: ${confirmed.problem_line}`,
      `표시 가격: ${confirmed.price_value.toLocaleString()}원`,
      `소구점: ${confirmed.selling_points.join(" / ")}`,
      `가칭: ${confirmed.name}`,
      `제외할 것: ${confirmed.excluded.join(" / ")}`,
      `합격선: ${confirmed.pass_bar}`,
      `최소 표본: ${confirmed.min_sample}`,
      `표본 미달 시: ${confirmed.shortfall_choice === "ratio" ? "비율 환산 판정" : "1~2일 연장"}`,
      `플랜: ${TIER_INFO[tier].label} ${TIER_INFO[tier].priceLabel}`,
      `환불 규정: ${REFUND_POLICY.join(" | ")}`,
      `동의 입력: ${agreement.trim()}`,
    ].join("\n");

    const { error: updateError } = await admin
      .from("o2o_leads")
      .update({
        brief: { ...(existing ?? {}), confirmed },
        tier,
        brief_confirmed_at: now.toISOString(),
        pass_bar_agreed_at: now.toISOString(),
        deposit_due_at: due.toISOString(),
      })
      .eq("id", lead.id as string);
    if (updateError) {
      console.error("[brief confirm]", updateError);
      return Response.json({ error: "confirm failed" }, { status: 500 });
    }

    const { error: consentError } = await admin.from("consent_events").insert([
      {
        lead_id: lead.id as string,
        event_type: "brief_confirmed",
        content: snapshot,
        ip,
        user_agent: ua,
      },
      {
        lead_id: lead.id as string,
        event_type: "pass_bar_agreed",
        content: `합격선: ${confirmed.pass_bar} / 최소 표본: ${confirmed.min_sample} / 미달 시: ${confirmed.shortfall_choice} / 입력: ${agreement.trim()}`,
        ip,
        user_agent: ua,
      },
    ]);
    if (consentError) console.error("[consent insert]", consentError);

    const fresh = await findLead(code);
    return Response.json({ lead: fresh ? publicLead(fresh) : null });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
