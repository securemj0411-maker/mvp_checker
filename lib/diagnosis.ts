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
export type Alternative =
  | "competitor"
  | "manual"
  | "none"
  | "unaware"
  | "unknown";
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
  /** 오프라인 한정 — 지역타겟 광고 반경의 중심 (시/구/동) */
  location?: string | null;
  /** build=built 한정 — 기존 페이지 주소 */
  pageUrl?: string | null;
}

export interface InterpretResult {
  summary: string;
  candidates: { label: string; detail: string }[];
}

export interface Report {
  /** "우리가 이해한 건 이겁니다" — 거울. [타깃]이 [대안] 대신 [오퍼]를 쓰게 만드는 것 */
  understanding_line: string;
  /** 추천 광고 채널 (코드가 결정) */
  channel: string;
  channel_reason: string;
  /** 합격선 (코드가 결정) */
  pass_bar: string;
  pass_bar_reason: string;
  /** 이 아이디어에서만 나오는 가장 날카로운 리스크 1개 (GPT가 못 주는 관점) */
  top_risk: string;
  /** 이 아이디어 고유의, 7일 광고로 답 못 내는 변수 1개 */
  blind_spot: string;
}

export type RecommendedPath = "engine" | "quick" | "deep";

/* ───────── 광고 정책 차단 — 진짜 원천 금지만 좁게 ───────── */

/**
 * 광고 플랫폼이 콘텐츠 자체로 거절하는 업종만 막는다.
 * 핵심: "이런 업종을 고객으로 둔 도구/SaaS/관리/예약 서비스"는 통과시킨다.
 * (예: 성인업소 예약관리 SaaS는 광고 가능 / 성인물 직접 판매는 불가)
 * 애매하면 통과(false)가 기본 — 과잉 차단이 가장 비싼 누수다.
 */
const PROHIBITED_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /성인물|음란물|av판매|어덜트|성인용품|성기구|성인화상|화상채팅|폰팅|랜덤채팅|조건만남|애인대행/, label: "성인 콘텐츠" },
  { re: /도박|카지노|바카라|슬롯|배팅|토토|사다리|불법.?스포츠|베팅사이트/, label: "사행성·도박" },
  { re: /마약|대마|필로폰|향정신성|불법약물/, label: "마약" },
  { re: /총기|무기.?판매|실탄|폭발물/, label: "무기" },
  { re: /사채|일수|불법.?대부|미등록.?대부|급전.?대출/, label: "불법 대부" },
  { re: /짝퉁|이미테이션|레플리카|가품.?판매|모조품/, label: "모조품" },
  { re: /처방.?의약품|전문의약품|스테로이드.?판매/, label: "의약품 직접판매" },
];

/** 도구·서비스 신호 — 이게 있으면 "대상 업종"이 아니라 "도구"로 보고 통과 */
const TOOL_SIGNAL =
  /관리|예약|정산|매출|장부|crm|saas|솔루션|플랫폼|시스템|자동화|대행|마케팅|광고|툴|프로그램|앱서비스|중개|매칭|커뮤니티/i;

export function classifyProhibited(
  idea: string,
  refined?: string | null,
): { prohibited: boolean; label: string | null } {
  const text = `${idea} ${refined ?? ""}`.toLowerCase().replace(/\s/g, "");
  for (const { re, label } of PROHIBITED_PATTERNS) {
    if (re.test(text)) {
      // 금지 키워드가 있어도 도구/서비스 신호가 같이 있으면 "대상 업종용 도구"로 보고 통과
      if (TOOL_SIGNAL.test(text)) return { prohibited: false, label: null };
      return { prohibited: true, label };
    }
  }
  return { prohibited: false, label: null };
}

/** 측정 스크립트 설치가 불가능한 플랫폼 — 엔진 경로 차단 */
const UNMEASURABLE_HOSTS = [
  "smartstore.naver.com",
  "blog.naver.com",
  "place.naver.com",
  "post.naver.com",
  "m.place.naver.com",
  "instagram.com",
  "pf.kakao.com",
  "open.kakao.com",
  "litt.ly",
  "linktr.ee",
];

/** 페이지 URL이 측정(스크립트 설치) 가능한 플랫폼인지 판별 */
export function isPageMeasurable(url: string | null | undefined): boolean | null {
  if (!url?.trim()) return null;
  try {
    const host = new URL(
      url.startsWith("http") ? url : `https://${url}`,
    ).hostname.replace(/^www\./, "");
    return !UNMEASURABLE_HOSTS.some(
      (b) => host === b || host.endsWith(`.${b.split(".")[0]}.naver.com`) || host.endsWith(b),
    );
  } catch {
    return null; // 판별 불가 — 사람이 확인
  }
}

/** 제작 상황 기준 추천 경로 — 모델이 아니라 코드가 결정한다 */
export function recommendPath(a: QuizAnswers): RecommendedPath {
  if (a.build === "built" && isPageMeasurable(a.pageUrl) === false) {
    // 측정 불가 플랫폼(스마트스토어 등)은 엔진이 성립하지 않음
    return "quick";
  }
  if (a.build === "self" || a.build === "built") return "engine";
  return "quick";
}

/* ───────── 결제/환불 — 사업 상수 ───────── */

export const BANK_INFO = {
  bank: "케이뱅크",
  account: "100-3011-67210",
  holder: "이민제(득템잡이)",
} as const;

export const TIER_INFO: Record<
  "engine" | "quick",
  { label: string; price: number; priceLabel: string; desc: string }
> = {
  engine: {
    label: "엔진 (페이지는 내가)",
    price: 290000,
    priceLabel: "29만원",
    desc: "검증용 페이지가 이미 있으신 분. 그 페이지에 진짜 광고를 걸어 수백 명을 불러오고, 클릭과 결제 의향(결제 버튼 클릭률)을 재서 Go/No-Go까지 판정합니다. 광고비 포함.",
  },
  quick: {
    label: "Quick (처음부터 전부)",
    price: 500000,
    priceLabel: "50만원",
    desc: "검증용 사이트부터 저희가 만들어 드립니다. 실제 광고 집행, 수백 명 유입, 측정, Go/No-Go 판정까지 전부. 광고비 포함.",
  },
};

export const REFUND_POLICY = [
  "입금 후 제작 착수 전 취소: 전액 환불",
  "제작 착수 후 광고 집행 전 취소: 50% 환불",
  "광고 집행 시작 후: 변심 환불은 어렵습니다. 단, 집행되지 않은 광고비는 돌려드립니다",
  "분명한 Go/No-Go 판정을 못 드리면: 전액 환불 (판정 보장)",
  "광고 정책상 집행 불가 업종으로 판명되면: 전액 환불",
] as const;

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
  if (a.alternative === "unaware") {
    return {
      channel: "메타(인스타) 디맨드젠 광고",
      reason:
        "문제라고 인식 못 하는 고객은 해결책을 검색하지 않아 검색광고는 모수가 안 나옵니다. 피드에서 문제를 먼저 보여주고 반응을 만드는 방식이 맞습니다.",
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

/** 플레이북 B-6 — 가격대/업종 기반 합격선 (+ 표본 미달 분쟁 방지 조항) */
export function decidePassBar(a: QuizAnswers): {
  bar: string;
  reason: string;
  minSample: string;
} {
  if (a.service === "offline") {
    return {
      bar: "방문 100명당 사전예약 3명",
      reason:
        "오프라인은 결제 클릭 대신 사전예약 제출을 신호로 씁니다. 상권 반경 안의 클릭만 집계합니다.",
      minSample: "상권 반경 내 방문 70명",
    };
  }
  if (a.audience === "b2b") {
    return {
      bar: "7일 안에 자격 통과 리드 2~3건",
      reason:
        "B2B는 모수가 작아 비율 대신 절대 건수로 판정합니다. 즉시 결제보다 리드 품질이 신호입니다.",
      minSample: "광고 클릭 30회",
    };
  }
  if (a.price === "over100k") {
    return {
      bar: "방문 100명당 결제 클릭 2명",
      reason: "객단가 10만원 이상은 클릭 문턱이 높아 기준을 한 단계 낮춥니다.",
      minSample: "방문 70명",
    };
  }
  if (a.price === "under10k") {
    return {
      bar: "방문 100명당 결제 클릭 4명",
      reason: "1만원 미만은 클릭 문턱이 낮은 만큼 기준을 올려서 봅니다.",
      minSample: "방문 70명",
    };
  }
  return {
    bar: "방문 100명당 결제 클릭 3명",
    reason:
      "표준 기준입니다. 광고 시작 전에 숫자를 확정하고, 데이터를 본 뒤에는 어느 쪽도 기준을 바꾸지 않습니다.",
    minSample: "방문 70명",
  };
}

/* ───────── 브리프 (무통화 킥오프 대체물) ───────── */

export interface BriefDraft {
  offer_options: { headline: string; angle: string }[];
  target_line: string;
  problem_line: string;
  price_value: number;
  price_rationale: string;
  selling_points: string[];
  name_candidates: string[];
  excluded: string[];
}

export interface ConfirmedBrief {
  offer: string;
  target_line: string;
  problem_line: string;
  price_value: number;
  /** 검증 페이지에 표시할 플랜 구성 (1~3개). 고객이 확정 화면에서 직접 구성.
   *  price_value 는 첫 플랜 가격과 동일하게 유지(하위 호환). */
  plans?: { label: string; price: number }[];
  selling_points: string[]; // 내부용 (고객 미노출)
  name: string;
  excluded: string[]; // 내부용 (고객 미노출)
  // 아래 3개는 서버(코드)가 결정 — 고객에게 떠넘기지 않음
  pass_bar?: string;
  min_sample?: string;
  shortfall_choice?: "ratio" | "extend";
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
  unaware: "아직 문제라고 느끼지도 못하는 상태",
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

  void priceTxt;
  return {
    understanding_line: `${aud}${josa(aud, "이", "가")} 지금의 ${alt} 대신, "${idea.slice(0, 80)}"를 쓰게 만드는 것, 이게 핵심이라고 봤습니다.`,
    channel: ch.channel,
    channel_reason: ch.reason,
    pass_bar: pb.bar,
    pass_bar_reason: pb.reason,
    top_risk:
      a.alternative === "none"
        ? "대안 없이 참고 있다는 건 시장이 이 문제를 아직 돈 쓸 만큼 아프게 느끼지 않는다는 신호일 수 있습니다. 광고 클릭률이 첫 관문입니다."
        : a.price === "unknown"
          ? "가격을 표시하지 않으면 수요가 아니라 호기심을 측정하게 됩니다. 검증 전에 가격 숫자부터 못박아야 합니다."
          : "기존 대안에서 갈아탈 만큼의 차이를 광고 문구 한 줄로 보여줘야 합니다. 그게 안 되면 클릭이 안 옵니다.",
    blind_spot:
      "7일 광고는 첫 결제 의향까지만 봅니다. 재구매율이나 입소문은 이 기간으로 답을 못 냅니다.",
  };
}
