/* 상담 가이드 — 운영 플레이북(docs/운영플레이북_v1.md) 핵심 발췌.
   상담 중에 바로 보면서 판단·복붙하는 용도. */

function Tmpl({ children }: { children: string }) {
  return (
    <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-bg-alt p-4 text-[13px] leading-relaxed text-text-secondary">
      {children}
    </pre>
  );
}

function Sec({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      className="group rounded-lg border border-border bg-surface"
    >
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-base font-bold text-text [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-text-tertiary transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-text-secondary">
        {children}
      </div>
    </details>
  );
}

export default function Guide() {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-text-tertiary">
        전체 문서: docs/운영플레이북_v1.md · 아래는 상담 중 바로 쓰는 핵심만
      </p>

      <Sec title="① 첫 응답 (카톡 기본)" open>
        <p>
          폼 데이터 3개(업종/아이디어 한 줄, 단계, 최우선 관심)를 반드시
          본문에 넣어 개인화합니다.
        </p>
        <Tmpl>{`{이름}님, 안녕하세요. 비즈필터입니다.

남겨주신 내용 확인했습니다. {업종} 분야에서 "{아이디어 한 줄}"을
검토 중이시고, 현재 {단계} 단계에 계신 것으로 이해했습니다.
특히 {최우선 관심} 부분을 가장 궁금해하시는 것 같은데, 맞을까요?

정확한 안내를 위해 15분 정도 짧게 통화 또는 채팅 상담을
권해드립니다. 아래 중 편하신 시간을 알려주세요.

1. 오늘 {시간A}
2. 내일 {시간B}
3. 그 외 편하신 시간

상담은 무료이고, 상담했다고 진행하셔야 하는 것은 아닙니다.`}</Tmpl>
      </Sec>

      <Sec title="② 15분 상담 — 질문 7개 (순서대로)">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            아이디어를 한 문장으로 다시 말씀해주시겠어요?{" "}
            <span className="text-text-tertiary">(폼과 실제 생각 대조)</span>
          </li>
          <li>
            돈 내고 쓸 사람은 구체적으로 누구라고 보세요?{" "}
            <span className="text-text-tertiary">(광고 타겟팅 가능한지)</span>
          </li>
          <li>
            그 사람들이 지금 겪는 문제가 뭔가요?{" "}
            <span className="text-text-tertiary">(광고 문구 재료)</span>
          </li>
          <li>
            지금은 그 문제를 어떻게 해결하고 있나요?{" "}
            <span className="text-text-tertiary">
              (대안 없음 = 시장 없음 위험 신호)
            </span>
          </li>
          <li>
            얼마를 받으실 생각인가요? 근거는요?{" "}
            <span className="text-text-tertiary">(검증 사이트 표시 가격)</span>
          </li>
          <li>
            언제까지 결론이 필요하고, 예산은요?{" "}
            <span className="text-text-tertiary">(Quick/Deep 판단)</span>
          </li>
          <li>
            어떤 숫자면 진행, 어떤 숫자면 중단인가요?{" "}
            <span className="text-text-tertiary">(합격선 합의 시작)</span>
          </li>
        </ol>
        <Tmpl>{`(7번 마무리 멘트)
저희는 데이터를 보기 전에 합격선을 먼저 같이 정합니다.
참고 기준은 방문자 100명 중 결제 클릭 3명입니다.
결과가 나온 뒤에 기준을 움직이면 검증이 의미가 없어지기 때문에,
착수 전에 이 숫자를 확정하고 시작합니다.`}</Tmpl>
      </Sec>

      <Sec title="③ 자격 판정 — 진행 / 설계조정 / 거절">
        <ul className="space-y-3">
          <li>
            <b className="text-text">즉시 진행</b>: 온라인 결제 의향 측정
            가능 + 광고로 타깃 도달 가능 + 합격선 동의 + 일정·비용 수용
          </li>
          <li>
            <b className="text-text">설계 조정(오프라인/지역)</b>: "가능합니다.
            다만 전국 광고가 아니라 {"{지역}"} 타겟 광고로 돌리고, 결제 버튼
            대신 사전예약 신청을 측정합니다. 측정 방식만 다르고 판정 구조는
            동일합니다."
          </li>
          <li>
            <b className="text-text">거절 3종</b>:
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                법령 위반 소지(무허가 의료/금융, 사행성): "광고 심사와 관련
                법령상 검증을 설계해드릴 수 없는 영역입니다. 진행해도 광고가
                집행되지 않아 판정이 불가능합니다."
              </li>
              <li>
                검증 불가 구조(입찰/조달, 6개월+ 영업 사이클): "고객 결정이
                광고 7일로 잡히는 구조가 아니라 의미 있는 판정을 드릴 수
                없습니다. 판정을 못 드릴 일을 돈 받고 시작하지 않습니다."
                (7~14일 내 유효 리드 측정 가능한 B2B는 거절 아님 → 리드
                건수 기준으로 진행)
              </li>
              <li>
                비현실 기대(성공 보장 기대, No-Go 수용 불가): "저희가 드리는
                것은 판정이지 성공 보장이 아닙니다. 중단이라는 답이 나올 수
                있고 그것도 정상 납품입니다."
              </li>
            </ul>
          </li>
        </ul>
      </Sec>

      <Sec title="④ 플랜 제안 + 가격 이의 응대">
        <p>
          <b className="text-text">원칙: Quick(50만/7일) 먼저.</b> Deep은
          신호 있을 때만 언급: 가격 2안 고민 / 포지셔닝 불확실 / 인스타 성향
          B2C / 단가·마진 모름 / 예산 여유.
        </p>
        <Tmpl>{`(기본 제안)
{이름}님 케이스는 Quick으로 충분합니다. 7일에 50만원이고
광고비 5만원이 포함되어 있습니다. 검증용 사이트 제작, 구글 광고
7일 집행, 결제 의향과 CAC 측정, 판정 리포트와 30분 미팅까지입니다.

(비싸다)
비교 대상은 검증 없이 만들었을 때의 비용입니다. 개발 외주
수백만원과 몇 달을 쓰기 전에, 50만원과 7일로 그 돈을 써도 되는지
먼저 확인하는 구조입니다. 분명한 판정을 못 드리면 전액 환불입니다
(실제 집행된 광고비는 제외).

(직접 하겠다)
직접 하실 수 있습니다. 다만 사이트 제작, 광고 세팅, 측정 설계까지
직접 하시면 보통 3~4주가 걸리고, 측정 설계가 어긋나면 잘못된
결론이 나옵니다. 막히는 지점이 생기면 그때 오셔도 됩니다.

(생각해보겠다)
네, 충분히 고민하고 결정하세요. 한 가지만 여쭙겠습니다.
지금 미루시는 이유가 비용인가요, 검증 필요성 자체인가요?`}</Tmpl>
      </Sec>

      <Sec title="⑤ 합격선 조정표 (하나만 적용)">
        <table className="mt-1 w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-text-tertiary">
              <th className="py-1.5 pr-3">상황</th>
              <th className="py-1.5">합격선</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-1.5 pr-3">기본 (5만원 미만 소비재/디지털)</td>
              <td className="py-1.5 font-bold text-text">3/100</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">객단가 10만원 이상</td>
              <td className="py-1.5 font-bold text-text">2/100</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">객단가 50만원 이상 또는 B2B</td>
              <td className="py-1.5 font-bold text-text">
                유효 리드 2~3건 (건수 기준 합의)
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">오프라인/지역</td>
              <td className="py-1.5 font-bold text-text">
                사전예약 3/100 (지역타겟)
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">충동구매형 저가 (1만원 미만)</td>
              <td className="py-1.5 font-bold text-text">4/100</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-text-tertiary">
          판정 지표는 결제클릭률 하나. CTR·CAC는 참고 지표 (다중 지표로
          묶으면 판정 모호 = 환불 트리거). 최소 표본도 같이 합의.
        </p>
      </Sec>

      <Sec title="⑥ 채널 결정 (10분 체크)">
        <p>
          <b className="text-text">
            "사람들이 이 문제를 이미 검색하는가?"
          </b>{" "}
          네이버/구글 자동완성 + 키워드도구 월 검색량 + 지식인 질문 존재.
          5개 중 2개 이상 = 검색 수요 있음.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>검색 수요 있음 → 구글 검색광고 (키워드)</li>
          <li>수요 없음 + 시각 소구 B2C → 메타(인스타)</li>
          <li>지역 오프라인 → 지역타겟 + 사전예약 측정 (반경 3~5km)</li>
          <li>B2B 고단가 → 구글 검색 + 자격질문 폼, 리드 건수로 판정</li>
        </ul>
        <p className="mt-2 text-xs text-text-tertiary">
          광고비 5만원은 단일 채널 집중. 문구 2~3종 균등 로테이션, 3일차에
          죽은 문구 끄기. 전 문구 사망 = 아이디어 문제, 한 문구 생존 = 문구
          문제.
        </p>
      </Sec>

      <Sec title="⑦ 결제 안내 + 착수 확정">
        <Tmpl>{`(결제 안내)
{이름}님, 진행 결정 감사합니다. 결제 안내드립니다.

상품: 비즈필터 {Quick/Deep} ({금액}원, 광고비 포함)
입금 계좌: {은행} {계좌번호} (예금주: {예금주명})
입금자명: {이름}님 성함으로 부탁드립니다.
입금 기한: {3영업일 내 날짜}

환불 기준을 미리 말씀드립니다.
1. 착수 전 취소: 전액 환불
2. 분명한 판정을 못 드린 경우: 전액 환불 (실집행 광고비 제외)
3. No-Go 판정: 정상 납품으로 환불 대상이 아닙니다.

(입금 확인 후)
{이름}님, 입금 확인했습니다. 정식으로 착수합니다.
1. 24시간 내: 킥오프 통화(30분)로 검증 설계 확정
2. 브리프 확정 후 48시간 내: 사이트와 광고 라이브
3. 라이브 후 5일간: 광고 집행 및 데이터 수집
4. 7일차: 판정 리포트와 30분 미팅

합격선: {합의 기준}
동의하시면 "동의합니다"라고 회신 부탁드립니다.`}</Tmpl>
      </Sec>

      <Sec title="⑧ 미응답 팔로업 (1일 / 3일 / 7일)">
        <Tmpl>{`(1일) {이름}님, 어제 안내드린 내용 확인하셨을까요?
궁금한 점이 있으면 편하게 물어보세요. 질문만 하셔도 됩니다.

(3일) {이름}님, 검토에 도움이 될 것 같아 한 가지 공유드립니다.
비슷한 {업종} 케이스에서 저희가 보는 핵심 체크포인트는
{업종별 표준 문구}입니다. 진행 여부와 별개로 참고가 되면 좋겠습니다.

(7일, 종결) {이름}님, 마지막으로 연락드립니다. 지금은 검증 진행
시점이 아니신 것 같아 이 건은 정리해두겠습니다. 아이디어가
구체화되면 언제든 다시 연락 주세요. 좋은 결과 있으시길 바랍니다.
→ 발송 후 상태를 '미진행'으로 변경`}</Tmpl>
      </Sec>
    </div>
  );
}
