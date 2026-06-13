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
// 초반 되물음(interpret)은 분류·보기추천 수준이라 더 빠른 Sonnet으로.
// 설계서·브리프·정책분류는 품질/안전 위해 Opus 유지.
const INTERPRET_MODEL = "claude-sonnet-4-6";

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
      description:
        "아이디어를 이해한 그대로 한 문장. 평서문, 쉬운 말, 경어체. 자신 있게 단정해서 고객이 '맞다'고 끄덕이게. 업계 용어 금지(부득이하면 괄호로 쉬운 풀이). 원문에 없는 가격·수치 지어내지 않기.",
    },
    gaps: {
      type: "array",
      description:
        "정확히 1~2개만(2개를 넘기지 말 것). 전화 상담 없이 이 아이디어로 가짜 수요 테스트용 페이지와 광고를 만들려면 꼭 알아야 하는데, 원문만으론 알 수 없는 것. 광고 헤드라인·타깃팅·차별점처럼 만들기에 바로 쓰이는 것 위주. 'ChatGPT도 할 일반론'(막연한 '타깃이 누구?', '마케팅이 중요') 금지. 이미 원문에 있는 건 묻지 말 것.",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "짧은 한글 라벨. 예: 핵심 소구, 첫 타깃, 차별점",
          },
          question: {
            type: "string",
            description: "고객에게 보일 질문 한 문장. 쉬운 말, 경어체.",
          },
          suggestions: {
            type: "array",
            description:
              "AI가 추측한 그럴듯한 답을 정확히 3~4개. 각 12자 안팎으로 짧고 구체적이며 서로 달라야 합니다. 고객이 'aha' 하고 탭할 현실적 보기.",
            items: { type: "string" },
          },
        },
        required: ["key", "question", "suggestions"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "gaps"],
  additionalProperties: false,
} as const;

async function interpret(idea: string): Promise<InterpretResult | null> {
  const client = getClient();
  if (!client) return null;

  const response = await client.messages.create({
    model: INTERPRET_MODEL,
    max_tokens: 2000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: INTERPRET_SCHEMA },
    },
    system: [
      "당신은 사업 아이디어 검증 회사 '비즈필터'의 인테이크(intake) 전문가입니다.",
      "전화 상담은 없습니다. 창업자가 적은 아이디어 한 줄만으로, 가짜 수요 테스트용 페이지와 광고를 만들 수 있도록 핵심을 잡아야 합니다.",
      "두 가지를 합니다:",
      "1) summary: 아이디어를 한 문장으로 이해한 그대로 자신 있게 되비춥니다(확인용).",
      "2) gaps: 그 페이지와 광고를 만들려면 꼭 알아야 하는데 원문만으론 알 수 없는 것 1~2개를 질문으로 만들고, 각 질문에 그럴듯한 답 3~4개를 미리 채워 줍니다(고객은 탭하거나 직접 고칩니다).",
      "규칙:",
      "- gaps는 이 아이디어에 특정한 것만. 가장 값진 빈칸은 보통: 광고에 내세울 핵심 한 가지, 가장 먼저 팔 구체적 타깃(역할·상황), 기존 방법 대비 차별점.",
      "- 일반론·막연한 질문 금지. 만들기에 바로 쓰이는 답을 끌어내는 질문만.",
      "- suggestions는 짧고(12자 안팎) 구체적이며 서로 달라야 합니다.",
      "- 없는 사실/가격/수치를 지어내지 않습니다.",
      "- 모든 문장 경어체, 줄표(—) 금지, 어려운 용어 금지(부득이하면 괄호로 쉬운 풀이).",
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
    subscription: "정기 결제(구독·회원제·월 회비)",
    usage: "쓸 때마다 결제(방문·이용마다)",
    fee: "수수료나 광고",
    undecided: "미정",
  },
  price: {
    under10k: "1만원 미만",
    "10kto50k": "1~5만원",
    "50kto100k": "5~10만원",
    over100k: "10만원 이상",
    multi: "여러 플랜 (하나로 못 정함)",
    unknown: "미정",
  },
  alternative: {
    competitor: "비슷한 서비스·앱을 쓰고 있음",
    manual: "공짜·임시방편으로 때움",
    none: "안 하거나 그냥 참고 있음",
    unaware: "있는 줄도 모름 (필요성을 알려줘야 하는 시장)",
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
      "- 용어 규칙: 사업가가 흔히 아는 업계 용어는 써도 되지만, 처음 나올 때 괄호로 쉬운 설명을 한 번 병기합니다. 예: 'CAC(고객 한 명 데려오는 비용)', '리텐션(재방문율)'. 영어 약자는 반드시 한글 풀이를 괄호로. 너무 어려운 전문용어는 아예 쉬운 말로 풉니다.",
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
  /** 재해석 재생성 시 기존 리드 코드 (있으면 insert 대신 update) */
  code?: string;
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

    // 1) 리드 저장 — AI가 실패해도 리드는 남는다. 텔레그램 알림 트리거도 여기서.
    const admin = getSupabaseAdmin();
    const path = recommendPath(answers);
    const measurable = isPageMeasurable(answers.pageUrl);
    // 답변/업종 기반 필드 (신규·재해석 갱신 공통)
    const fields = {
      idea: answers.idea,
      idea_refined: answers.ideaRefined?.slice(0, 500) ?? null,
      service_type: answers.service,
      audience: answers.audience,
      revenue_model: answers.revenue,
      build_status: answers.build,
      price_band: answers.price,
      alternative: answers.alternative,
      region: answers.region ?? null,
      location: answers.location?.slice(0, 200) ?? null,
      page_url: answers.pageUrl?.slice(0, 500) ?? null,
      page_measurable: measurable,
      interpret_status: body.interpretStatus?.slice(0, 30) ?? null,
      tier: path,
    };

    let accessCode = "";
    let leadId = "";

    // 재해석("다르게 이해했어요") — 확정 전이면 기존 리드를 갱신, 중복 리드를 안 만든다
    const reviseCode =
      typeof body.code === "string"
        ? body.code.toUpperCase().replace(/\s/g, "").slice(0, 12)
        : "";
    if (reviseCode.length >= 8) {
      const { data: existing } = await admin
        .from("o2o_leads")
        .select("id, brief_confirmed_at")
        .eq("access_code", reviseCode)
        .maybeSingle();
      if (existing?.id && !existing.brief_confirmed_at) {
        const { error: updErr } = await admin
          .from("o2o_leads")
          .update({ ...fields, policy_flag: "none" })
          .eq("id", existing.id);
        if (!updErr) {
          accessCode = reviseCode;
          leadId = existing.id as string;
        }
      }
    }

    if (!leadId) {
      accessCode = generateAccessCode();
      const { data: lead, error: insertError } = await admin
        .from("o2o_leads")
        .insert({
          ...fields,
          name: name.trim().slice(0, 100),
          email: contact.trim().slice(0, 254),
          phone: body.phone?.trim().slice(0, 20) || null,
          source: "landing-quiz-v2",
          utm_source: body.utm?.slice(0, 50) ?? null,
          access_code: accessCode,
          user_agent: body.userAgent?.slice(0, 500) ?? null,
        })
        .select("id")
        .single();
      if (insertError) {
        console.error("[diagnose insert]", insertError);
        return Response.json({ error: "insert failed" }, { status: 500 });
      }
      leadId = lead.id as string;
    }

    // 2) 정책 분류를 먼저 — 차단 업종이면 설계서 생성을 스킵(토큰 0)하고 짧게 거절
    const policy = await classifyPolicy(answers.idea, answers.ideaRefined);
    if (policy.prohibited) {
      await admin
        .from("o2o_leads")
        .update({ policy_flag: "prohibited", tier: null })
        .eq("id", leadId);
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
    // 채널·합격선은 숫자도 근거 문장도 코드가 결정한 값으로 고정.
    // 모델이 쓴 근거는 톤이 어설퍼 고객 신뢰를 깎는다(플레이북 문장으로 교체).
    const ch = decideChannel(answers);
    const pb = decidePassBar(answers);
    report.channel = ch.channel;
    report.channel_reason = ch.reason;
    report.pass_bar = pb.bar;
    report.pass_bar_reason = pb.reason;

    // 4) 설계서를 리드에 저장 (실패해도 응답은 내보낸다)
    const { error: updateError } = await admin
      .from("o2o_leads")
      .update({ ai_report: { ...report, source }, policy_flag: "none" })
      .eq("id", leadId);
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
