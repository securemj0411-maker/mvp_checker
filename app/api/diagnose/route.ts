import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildFallbackReport,
  decideChannel,
  decidePassBar,
  recommendPath,
  type InterpretResult,
  type QuizAnswers,
  type Report,
} from "@/lib/diagnosis";

export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

/* ───────────────── 되물음: 아이디어 해석 후보 ───────────────── */

const INTERPRET_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "아이디어를 이해한 그대로 한 문장 요약 (경어체)",
    },
    candidates: {
      type: "array",
      description:
        "검증 가능한 수준으로 좁힌 해석 후보 2~3개. 서로 타깃이나 장면이 달라야 한다.",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "후보 이름. 10자 안팎 (예: 직장인 점심 구독)",
          },
          detail: {
            type: "string",
            description:
              "'[타깃]이 [상황]일 때 [현재 대안] 대신 [오퍼]를 쓰게 한다' 꼴의 한 문장",
          },
        },
        required: ["label", "detail"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "candidates"],
  additionalProperties: false,
} as const;

async function interpret(idea: string): Promise<InterpretResult | null> {
  const client = getClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: INTERPRET_SCHEMA },
    },
    system: [
      "당신은 사업 아이디어 검증 회사 '비즈필터'의 인터뷰어입니다.",
      "창업자가 적은 아이디어 한 줄을 읽고, 7일 광고 테스트가 가능한 수준으로 좁힌 해석 후보를 만듭니다.",
      "규칙:",
      "- 후보는 2~3개. 각 후보는 돈을 내는 사람과 첫 결제 장면이 서로 달라야 합니다.",
      "- 아이디어가 이미 충분히 구체적이면, 첫 후보는 원문을 다듬은 것 하나로 하고 더 좁힌 변형을 1~2개 추가합니다.",
      "- 양면 시장이나 플랫폼이면 돈 내는 쪽 하나만 남긴 후보를 만듭니다.",
      "- 없는 사실을 지어내지 않습니다. 원문에 없는 가격이나 수치를 단정하지 않습니다.",
      "- 모든 문장은 경어체. 줄표(—) 사용 금지.",
    ].join("\n"),
    messages: [{ role: "user", content: `아이디어: ${idea}` }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  return JSON.parse(text.text) as InterpretResult;
}

/* ───────────────── 검증 설계서 생성 ───────────────── */

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    one_liner: {
      type: "string",
      description:
        "'[타깃]이 [문제]를 겪을 때 [현재 대안] 대신 [오퍼]를 [가격]에 쓰게 한다' 공식의 한 문장",
    },
    target: { type: "string", description: "딱 한 부류로 좁힌 타깃" },
    problem: { type: "string", description: "그 타깃이 겪는 문제 한두 문장" },
    current_alternative: {
      type: "string",
      description: "타깃이 지금 그 문제를 버티는 방식",
    },
    price_hypothesis: {
      type: "string",
      description: "검증에 쓸 가격 가설과 그 근거 한두 문장",
    },
    channel: { type: "string", description: "추천 광고 채널 이름" },
    channel_reason: { type: "string", description: "그 채널인 이유 한두 문장" },
    pass_bar: { type: "string", description: "합격선 숫자" },
    pass_bar_reason: { type: "string", description: "합격선 근거 한 문장" },
    risks: {
      type: "array",
      description: "이 아이디어 고유의 리스크 정확히 3개. 일반론 금지.",
      items: { type: "string" },
    },
    blind_spot: {
      type: "string",
      description:
        "이 분석이 알 수 없는 것에 대한 정직한 고백 한두 문장. 과장 금지.",
    },
  },
  required: [
    "one_liner",
    "target",
    "problem",
    "current_alternative",
    "price_hypothesis",
    "channel",
    "channel_reason",
    "pass_bar",
    "pass_bar_reason",
    "risks",
    "blind_spot",
  ],
  additionalProperties: false,
} as const;

const LABELS: Record<string, Record<string, string>> = {
  service: {
    web: "웹 서비스",
    app: "모바일 앱",
    commerce: "온라인 판매",
    offline: "오프라인 매장이나 지역 서비스",
    content: "콘텐츠, 교육, 클래스",
    unknown: "형태 미정",
  },
  build: {
    self: "랜딩페이지를 직접 만들 수 있음 (바이브코딩, 노코드)",
    need: "테스트용 사이트 제작이 필요함",
    built: "서비스가 이미 만들어져 있음",
  },
  audience: {
    b2c: "일반 소비자",
    b2b: "회사, 사장님",
    both: "둘 다 또는 미정",
    unknown: "미정",
  },
  revenue: {
    once: "한 번 결제",
    subscription: "월 구독",
    fee: "광고나 수수료",
    undecided: "미정",
  },
  price: {
    under10k: "1만원 미만",
    "10kto50k": "1~5만원",
    "50kto100k": "5~10만원",
    over100k: "10만원 이상",
    unknown: "미정",
  },
  alternative: {
    competitor: "비슷한 서비스를 쓰고 있음",
    manual: "수작업이나 엑셀로 버팀",
    none: "그냥 참고 있음",
    unknown: "모름",
  },
  region: {
    local: "동네 상권 (반경 3~5km)",
    city: "도시 전체",
    nationwide: "전국",
  },
};

async function generateReport(a: QuizAnswers): Promise<Report | null> {
  const client = getClient();
  if (!client) return null;

  const ch = decideChannel(a);
  const pb = decidePassBar(a);

  const facts = [
    `아이디어 원문: ${a.idea}`,
    a.ideaRefined ? `창업자가 고른 해석: ${a.ideaRefined}` : null,
    `형태: ${LABELS.service[a.service]}`,
    `제작 상황: ${LABELS.build[a.build]}`,
    `돈 내는 사람: ${LABELS.audience[a.audience]}`,
    `결제 방식: ${LABELS.revenue[a.revenue]}`,
    `가격대 감: ${LABELS.price[a.price]}`,
    `현재 대안: ${LABELS.alternative[a.alternative]}`,
    a.region ? `주 고객 범위: ${LABELS.region[a.region]}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: REPORT_SCHEMA },
    },
    system: [
      "당신은 사업 아이디어 검증 회사 '비즈필터'의 검증 설계자입니다.",
      "창업자의 답변을 받아 '7일 광고 테스트 설계서'를 작성합니다. 사업성 점수나 시장 전망 예측이 아니라, 무엇을 어떻게 측정할지를 설계하는 문서입니다.",
      "",
      "회사의 채널 결정 규칙 (반드시 이 결정을 따르되, 이유는 아이디어에 맞게 다시 쓰세요):",
      `- 추천 채널: ${ch.channel}`,
      `- 합격선: ${pb.bar}`,
      "",
      "작성 규칙:",
      "- 모든 문장 경어체. 줄표(—) 금지. 과장 금지, 확정적 시장 전망 금지.",
      "- '성공할 것', '유망함' 같은 판정 표현 금지. 설계와 측정만 말합니다.",
      "- risks는 이 아이디어에서만 나올 수 있는 구체적 리스크 3개. '경쟁이 치열함' 같은 일반론은 쓰지 않습니다.",
      "- 아이디어가 모호하면 가장 그럴듯한 가정을 채우되, 그 가정을 문장 안에 드러냅니다 (예: '직장인으로 가정하면').",
      "- blind_spot은 정직하게: 이 설계서가 알 수 없는 것이 무엇인지 한두 문장.",
    ].join("\n"),
    messages: [{ role: "user", content: facts }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  return JSON.parse(text.text) as Report;
}

/* ───────────────── 라우트 ───────────────── */

interface DiagnoseBody {
  action?: string;
  idea?: string;
  answers?: QuizAnswers;
  name?: string;
  contact?: string;
  phone?: string;
  utm?: string | null;
  userAgent?: string | null;
}

export async function POST(request: Request) {
  let body: DiagnoseBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.action === "interpret") {
    const idea = (body.idea ?? "").trim().slice(0, 2000);
    if (idea.length < 5) {
      return Response.json({ error: "idea too short" }, { status: 400 });
    }
    try {
      const result = await interpret(idea);
      return Response.json({ result });
    } catch (e) {
      console.error("[diagnose interpret]", e);
      return Response.json({ result: null });
    }
  }

  if (body.action === "report") {
    const { answers, name, contact } = body;
    if (
      !answers ||
      typeof answers.idea !== "string" ||
      answers.idea.trim().length < 5 ||
      !name?.trim() ||
      !contact?.trim()
    ) {
      return Response.json({ error: "missing fields" }, { status: 400 });
    }
    answers.idea = answers.idea.trim().slice(0, 2000);

    // 1) 리드부터 저장 — AI가 실패해도 리드는 남는다. 텔레그램 알림 트리거도 여기서 발화.
    const admin = getSupabaseAdmin();
    const { data: lead, error: insertError } = await admin
      .from("o2o_leads")
      .insert({
        name: name.trim().slice(0, 100),
        email: contact.trim().slice(0, 254),
        phone: body.phone?.trim().slice(0, 20) || null,
        idea: answers.idea,
        idea_refined: answers.ideaRefined?.slice(0, 500) ?? null,
        source: "landing-quiz-v2",
        utm_source: body.utm?.slice(0, 50) ?? null,
        service_type: answers.service,
        audience: answers.audience,
        revenue_model: answers.revenue,
        build_status: answers.build,
        price_band: answers.price,
        alternative: answers.alternative,
        user_agent: body.userAgent?.slice(0, 500) ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[diagnose insert]", insertError);
      return Response.json({ error: "insert failed" }, { status: 500 });
    }

    // 2) 설계서 생성 — 실패하면 규칙 기반 폴백
    let report: Report;
    let source: "ai" | "fallback" = "ai";
    try {
      report = (await generateReport(answers)) ?? buildFallbackReport(answers);
      if (!process.env.ANTHROPIC_API_KEY) source = "fallback";
    } catch (e) {
      console.error("[diagnose report]", e);
      report = buildFallbackReport(answers);
      source = "fallback";
    }

    // 3) 설계서를 리드에 저장 (실패해도 응답은 내보낸다)
    const { error: updateError } = await admin
      .from("o2o_leads")
      .update({ ai_report: { ...report, source } })
      .eq("id", lead.id);
    if (updateError) console.error("[diagnose update]", updateError);

    return Response.json({ report, path: recommendPath(answers), source });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
