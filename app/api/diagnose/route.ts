import { randomBytes } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildFallbackReport,
  classifyProhibited,
  decideChannel,
  decidePassBar,
  isPageMeasurable,
  recommendPath,
  type InterpretResult,
  type QuizAnswers,
  type Report,
} from "@/lib/diagnosis";

/** 사람이 읽기 쉬운 접근 코드 (혼동 문자 제외, XXXX-XXXX) */
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code;
}

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
    understanding_line: {
      type: "string",
      description:
        "'우리가 이해한 건 이겁니다' 톤의 한 문장. '[타깃]이 [현재 대안] 대신 [오퍼]를 쓰게 만드는 것' 형태로, 고객이 자기 아이디어를 거울로 보고 '맞다'고 끄덕이게. 가격 숫자는 넣지 않는다.",
    },
    channel: { type: "string", description: "추천 광고 채널 이름" },
    channel_reason: { type: "string", description: "그 채널인 이유 한 문장" },
    pass_bar: { type: "string", description: "합격선 숫자" },
    pass_bar_reason: { type: "string", description: "합격선 근거 한 문장" },
    top_risk: {
      type: "string",
      description:
        "이 아이디어에서만 나오는 가장 날카로운 리스크 1개. ChatGPT도 말할 일반론('경쟁이 치열', '마케팅이 중요') 절대 금지. 이 제품/타깃/업종에 특정한 것 하나만. 전문가가 짚어주는 한 스푼이 되도록.",
    },
    blind_spot: {
      type: "string",
      description:
        "이 아이디어에서 7일 광고로는 답을 못 내는 구체적 변수 1개. 일반적 겸손('시장만 안다') 금지. 이 아이디어 종속적으로 (예: '재구매율은 7일로 안 보입니다').",
    },
  },
  required: [
    "understanding_line",
    "channel",
    "channel_reason",
    "pass_bar",
    "pass_bar_reason",
    "top_risk",
    "blind_spot",
  ],
  additionalProperties: false,
} as const;

/* 정책 분류 — 설계서 생성 전 가벼운 판정. 코드 1차 + (애매하면) 모델 보조 */
const POLICY_SCHEMA = {
  type: "object",
  properties: {
    prohibited: {
      type: "boolean",
      description:
        "광고하려는 것이 그 자체로 성인물·성인용품, 사행성·도박, 마약, 무기·총기, 불법 대부(사채), 모조품, 처방의약품 직접 판매인 경우만 true. 이런 업종을 '고객으로 둔' 관리·예약·정산·마케팅 도구나 SaaS는 도구이므로 false. 의료·금융·건강기능식품·주류·암호화폐는 조건부 가능이므로 false. 애매하면 false.",
    },
    label: {
      type: "string",
      description: "prohibited가 true일 때 분류명 한 단어. false면 빈 문자열.",
    },
  },
  required: ["prohibited", "label"],
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

/** 설계서 생성 전 가벼운 정책 분류 (코드 키워드 통과 시에만 모델 보조 호출) */
async function classifyPolicy(
  idea: string,
  refined?: string | null,
): Promise<{ prohibited: boolean; label: string | null }> {
  // 1차: 코드 키워드. 명백히 금지면 바로 차단 (토큰 0)
  const code = classifyProhibited(idea, refined);
  if (code.prohibited) return code;

  // 2차: 모델 보조 (코드가 못 잡는 우회 표현). 키 없으면 통과 기조
  const client = getClient();
  if (!client) return { prohibited: false, label: null };
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: POLICY_SCHEMA },
      },
      system:
        "광고 가능 여부만 판정합니다. 광고하려는 것이 그 자체로 성인물·성인용품·화상채팅, 사행성·도박, 마약, 무기, 불법 대부(사채), 모조품, 처방의약품 직접 판매인 경우만 prohibited=true. 이런 업종을 '고객으로 둔' 관리·예약·정산·마케팅 도구나 SaaS, 중개·매칭 서비스는 도구이므로 false. 의료·금융·건강기능식품·주류·암호화폐는 조건부 가능이므로 false. 애매하면 false.",
      messages: [{ role: "user", content: refined || idea }],
    });
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return { prohibited: false, label: null };
    const parsed = JSON.parse(text.text) as {
      prohibited: boolean;
      label: string;
    };
    return { prohibited: !!parsed.prohibited, label: parsed.label || null };
  } catch (e) {
    console.error("[classifyPolicy]", e);
    return { prohibited: false, label: null }; // 실패 시 통과 기조
  }
}

async function generateReport(a: QuizAnswers): Promise<Report | null> {
  const client = getClient();
  if (!client) return null;

  const ch = decideChannel(a);
  const pb = decidePassBar(a);

  const facts = [
    `아이디어 원문: ${a.idea}`,
    a.ideaRefined ? `창업자가 고른 해석: ${a.ideaRefined}` : null,
    `형태: ${LABELS.service[a.service]}`,
    `돈 내는 사람: ${LABELS.audience[a.audience]}`,
    `결제 방식: ${LABELS.revenue[a.revenue]}`,
    `가격대 감: ${LABELS.price[a.price]}`,
    `현재 대안: ${LABELS.alternative[a.alternative]}`,
    a.region ? `주 고객 범위: ${LABELS.region[a.region]}` : null,
    a.location ? `지역: ${a.location}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: REPORT_SCHEMA },
    },
    system: [
      "당신은 사업 아이디어 검증 회사 '비즈필터'의 검증 설계자입니다.",
      "창업자가 막 아이디어를 입력했습니다. 당신의 역할은 긴 리포트를 쓰는 게 아니라, (1) 우리가 그 아이디어를 정확히 이해했음을 거울처럼 보여주고, (2) 전문가만 짚을 수 있는 관점 한 스푼을 주는 것입니다. ChatGPT도 뱉을 일반론은 신뢰를 깎습니다.",
      "",
      "채널과 합격선은 회사가 이미 정했습니다 (반드시 이 값을 쓰되, 이유는 이 아이디어에 맞게 다시 쓰세요):",
      `- 추천 채널: ${ch.channel}`,
      `- 합격선: ${pb.bar}`,
      "",
      "작성 규칙:",
      "- understanding_line: 고객이 읽고 '맞다'고 끄덕이게. 자기 입력의 단순 반복이 아니라 한 단계 정리된 한 문장.",
      "- top_risk: 이 아이디어/타깃/업종에만 해당하는 가장 날카로운 리스크 1개. '경쟁이 치열', '마케팅 중요' 같은 일반론 절대 금지.",
      "- blind_spot: 이 아이디어에서 7일 광고로 답 못 내는 구체적 변수 1개.",
      "- 모든 문장 경어체. 줄표(—) 금지. 과장·판정 표현('성공', '유망') 금지.",
      "- 아이디어가 모호하면 가장 그럴듯한 가정을 채우되 그 가정을 문장에 드러냅니다.",
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
  interpretStatus?: string;
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
    const accessCode = generateAccessCode();
    const path = recommendPath(answers);
    const measurable = isPageMeasurable(answers.pageUrl);
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
        location: answers.location?.slice(0, 200) ?? null,
        page_url: answers.pageUrl?.slice(0, 500) ?? null,
        page_measurable: measurable,
        interpret_status: body.interpretStatus?.slice(0, 30) ?? null,
        access_code: accessCode,
        tier: path,
        user_agent: body.userAgent?.slice(0, 500) ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[diagnose insert]", insertError);
      return Response.json({ error: "insert failed" }, { status: 500 });
    }

    // 1.5) 같은 전화번호로 가입한 계정이 있으면 자동 연결 (로그인 후 재신청 누적)
    const phoneDigits = contact.trim().replace(/\D/g, "");
    if (phoneDigits.length >= 9) {
      const { data: acct } = await admin
        .from("accounts")
        .select("id")
        .eq("phone", phoneDigits)
        .maybeSingle();
      if (acct?.id) {
        await admin
          .from("o2o_leads")
          .update({ account_id: acct.id })
          .eq("id", lead.id);
      }
    }

    // 2) 정책 분류를 먼저 — 차단 업종이면 설계서 생성을 스킵(토큰 0)하고 짧게 거절
    const policy = await classifyPolicy(answers.idea, answers.ideaRefined);
    if (policy.prohibited) {
      await admin
        .from("o2o_leads")
        .update({ policy_flag: "prohibited", tier: null })
        .eq("id", lead.id);
      return Response.json({
        report: null,
        path,
        source: "blocked",
        accessCode,
        policyFlag: "prohibited",
        policyLabel: policy.label,
        pageMeasurable: measurable,
      });
    }

    // 3) 설계서 생성 — 실패하면 규칙 기반 폴백
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
    // 채널과 합격선은 코드가 결정한 값으로 고정 — 모델이 다듬다 바꾸는 것 방지
    report.channel = decideChannel(answers).channel;
    report.pass_bar = decidePassBar(answers).bar;

    // 4) 설계서를 리드에 저장 (실패해도 응답은 내보낸다)
    const { error: updateError } = await admin
      .from("o2o_leads")
      .update({ ai_report: { ...report, source }, policy_flag: "none" })
      .eq("id", lead.id);
    if (updateError) console.error("[diagnose update]", updateError);

    return Response.json({
      report,
      path,
      source,
      accessCode,
      policyFlag: "none",
      pageMeasurable: measurable,
    });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
