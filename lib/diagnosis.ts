/**
 * 무료 AI 검증 설계서 — 공용 타입 + 규칙 기반 로직.
 * 채널 결정은 운영플레이북 섹션 C, 합격선은 B-6 조정 원칙을 그대로 따른다.
 * 클라이언트는 타입만 import (런타임 로직은 서버 라우트에서 사용).
 */

export type ServiceType =
  | "web"
  | "app"
  | "commerce"
  | "offline"
  | "content"
  | "unknown";
export type BuildStatus = "self" | "need" | "built";
export type Audience = "b2c" | "b2b" | "both" | "unknown";
export type Revenue = "once" | "subscription" | "fee" | "undecided";
export type PriceBand =
  | "under10k"
  | "10kto50k"
  | "50kto100k"
  | "over100k"
  | "unknown";
export type Alternative = "competitor" | "manual" | "none" | "unknown";
export type Region = "local" | "city" | "nationwide";

export interface QuizAnswers {
  idea: string;
  ideaRefined?: string | null;
  service: ServiceType;
  build: BuildStatus;
  audience: Audience;
  revenue: Revenue;
  price: PriceBand;
  alternative: Alternative;
  region?: Region | null;
}

export interface InterpretResult {
  summary: string;
  candidates: { label: string; detail: string }[];
}

export interface Report {
  one_liner: string;
  target: string;
  problem: string;
  current_alternative: string;
  price_hypothesis: string;
  channel: string;
  channel_reason: string;
  pass_bar: string;
  pass_bar_reason: string;
  risks: string[];
  blind_spot: string;
}

export type RecommendedPath = "engine" | "quick" | "deep";

/** 제작 상황 기준 추천 경로 — 모델이 아니라 코드가 결정한다 */
export function recommendPath(a: QuizAnswers): RecommendedPath {
  if (a.build === "self" || a.build === "built") return "engine";
  return "quick";
}

/** 플레이북 섹션 C — 업종/타깃 기반 채널 결정 */
export function decideChannel(a: QuizAnswers): {
  channel: string;
  reason: string;
} {
  if (a.service === "offline") {
    const radius =
      a.region === "local"
        ? "반경 3~5km 지역타겟"
        : a.region === "city"
          ? "도시 단위 지역타겟"
          : "지역타겟";
    return {
      channel: `메타(인스타) ${radius} 광고`,
      reason:
        "오프라인 사업은 상권 안의 사람에게만 노출돼야 신호가 깨끗합니다. 사전예약 제출을 결제 의향 신호로 측정합니다.",
    };
  }
  if (a.service === "commerce") {
    return {
      channel: "메타(인스타) 디맨드젠 광고",
      reason:
        "커머스는 검색보다 피드에서 발견되는 비중이 큽니다. 구매버튼 클릭과 클릭당 비용이 마진 안에 들어오는지를 함께 봅니다.",
    };
  }
  if (a.service === "app") {
    return {
      channel: "메타(인스타) 디맨드젠 광고",
      reason:
        "앱은 출시 전 검색 수요가 거의 없어 피드 노출이 기본입니다. 무료 알림이 아니라 유료 플랜 선택이 포함된 사전등록을 신호로 잡습니다.",
    };
  }
  if (a.audience === "b2b") {
    return {
      channel: "구글 검색광고 + 자격질문 리드폼",
      reason:
        "B2B는 문제를 인지하고 해결책을 검색하는 사람을 잡는 것이 가장 짧은 경로입니다. 자격질문으로 리드 품질을 거릅니다.",
    };
  }
  return {
    channel: "구글 검색광고",
    reason:
      "이미 문제를 인지하고 해결책을 찾는 사람에게 노출하는 것이 전환까지 가장 짧은 경로입니다. 검색량이 부족하면 메타 디맨드젠으로 전환합니다.",
  };
}

/** 플레이북 B-6 — 가격대/업종 기반 합격선 */
export function decidePassBar(a: QuizAnswers): {
  bar: string;
  reason: string;
} {
  if (a.service === "offline") {
    return {
      bar: "방문 100명당 사전예약 3명",
      reason:
        "오프라인은 결제 클릭 대신 사전예약 제출을 신호로 씁니다. 상권 반경 안의 클릭만 집계합니다.",
    };
  }
  if (a.audience === "b2b") {
    return {
      bar: "7일 안에 자격 통과 리드 2~3건",
      reason:
        "B2B는 모수가 작아 비율 대신 절대 건수로 판정합니다. 즉시 결제보다 리드 품질이 신호입니다.",
    };
  }
  if (a.price === "over100k") {
    return {
      bar: "방문 100명당 결제 클릭 2명",
      reason: "객단가 10만원 이상은 클릭 문턱이 높아 기준을 한 단계 낮춥니다.",
    };
  }
  if (a.price === "under10k") {
    return {
      bar: "방문 100명당 결제 클릭 4명",
      reason: "1만원 미만은 클릭 문턱이 낮은 만큼 기준을 올려서 봅니다.",
    };
  }
  return {
    bar: "방문 100명당 결제 클릭 3명",
    reason:
      "표준 기준입니다. 광고 시작 전에 숫자를 확정하고, 데이터를 본 뒤에는 어느 쪽도 기준을 바꾸지 않습니다.",
  };
}

const SERVICE_LABEL: Record<ServiceType, string> = {
  web: "웹 서비스",
  app: "모바일 앱",
  commerce: "온라인 판매",
  offline: "오프라인 · 지역 서비스",
  content: "콘텐츠 · 교육",
  unknown: "형태 미정 서비스",
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  b2c: "일반 소비자",
  b2b: "회사와 사장님",
  both: "소비자와 사업자 양쪽",
  unknown: "아직 좁혀지지 않은 고객",
};

const PRICE_LABEL: Record<PriceBand, string> = {
  under10k: "1만원 미만",
  "10kto50k": "1~5만원",
  "50kto100k": "5~10만원",
  over100k: "10만원 이상",
  unknown: "미정",
};

const ALT_LABEL: Record<Alternative, string> = {
  competitor: "비슷한 서비스",
  manual: "수작업이나 엑셀 같은 임시방편",
  none: "마땅한 대안 없이 그냥 참는 것",
  unknown: "확인되지 않은 대안",
};

/** 받침 유무에 따른 조사 선택 (이/가, 으로/로 등) */
function josa(word: string, withBatchim: string, without: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return withBatchim; // 한글 아니면 보수적으로
  return (last - 0xac00) % 28 > 0 ? withBatchim : without;
}

/** API 키가 없거나 호출이 실패했을 때의 규칙 기반 설계서 */
export function buildFallbackReport(a: QuizAnswers): Report {
  const ch = decideChannel(a);
  const pb = decidePassBar(a);
  const idea = (a.ideaRefined || a.idea).trim();
  const aud = AUDIENCE_LABEL[a.audience];
  const alt = ALT_LABEL[a.alternative];
  const priceTxt =
    a.price === "unknown"
      ? "킥오프에서 유사 서비스 가격대 조사로 확정"
      : `${PRICE_LABEL[a.price]} 구간`;

  return {
    one_liner: `${aud}${josa(aud, "이", "가")} 지금의 ${alt} 대신, "${idea.slice(0, 80)}"를 ${a.price === "unknown" ? "아직 정하지 않은 가격" : PRICE_LABEL[a.price]}에 쓰게 한다`,
    target: AUDIENCE_LABEL[a.audience],
    problem: `적어주신 내용 기준으로는 문제 정의가 아직 한 문장으로 좁혀지지 않았습니다. 킥오프 30분에서 "첫 결제 한 건이 일어나는 장면"으로 함께 자릅니다.`,
    current_alternative: `${alt}${josa(alt, "으로", "로")} 버티는 상태로 보입니다.`,
    price_hypothesis: `${priceTxt}. ${
      a.revenue === "subscription"
        ? "구독은 첫 달 가격을 보고도 신청 버튼을 누르는지가 신호입니다."
        : "가격을 본 뒤에도 결제 버튼을 누르는지가 신호입니다."
    }`,
    channel: ch.channel,
    channel_reason: ch.reason,
    pass_bar: pb.bar,
    pass_bar_reason: pb.reason,
    risks: [
      a.alternative === "none"
        ? "대안 없이 참고 있다는 건 시장이 문제를 못 느낀다는 뜻일 수도 있습니다. 광고 클릭률이 첫 관문입니다."
        : "기존 대안에서 갈아탈 만큼의 차이를 광고 문구 한 줄로 보여줘야 합니다.",
      a.price === "unknown"
        ? "가격이 비어 있으면 검증이 흐려집니다. 가격을 표시하지 않은 테스트는 수요가 아니라 호기심을 측정합니다."
        : "이 가격대에서 클릭당 비용이 마진을 넘으면, 수요가 있어도 사업이 안 됩니다.",
      a.service === "unknown"
        ? "형태가 정해지지 않으면 채널 선택이 흔들립니다. 형태부터 한 장으로 고정해야 합니다."
        : "7일 데이터는 신호이지 확신이 아닙니다. 특히 애매한 회색지대가 나오면 조건을 바꿔 재검증해야 합니다.",
    ],
    blind_spot:
      "이 설계서는 적어주신 답변만으로 만든 1차 설계입니다. 진짜 고객이 돈을 낼지는 어떤 분석도 미리 알 수 없습니다.",
  };
}
