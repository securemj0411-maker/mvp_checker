import type { Metadata } from "next";
import { SubNav, SubFooter } from "@/components/SubNav";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 비즈필터",
  robots: { index: false },
  alternates: { canonical: "/privacy" },
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "1. 수집하는 개인정보 항목",
    body: [
      "비즈필터(이하 '회사')는 검증 신청 및 상담 처리를 위해 다음 정보를 수집합니다.",
      "· 필수: 이름, 이메일 주소 또는 카카오톡 ID, 강의 주제 내용 및 신청 폼 응답(강의 형태·대상 수강생·수강료 방식·진행 단계·우선 확인 사항)",
      "· 자동 수집: 접속 기록, 유입 경로(utm), 브라우저 정보 (Google Analytics를 통한 통계 목적)",
    ],
  },
  {
    h: "2. 수집 및 이용 목적",
    body: [
      "· 검증 서비스 신청 접수, 검증 가능 여부 회신 및 상담",
      "· 서비스 제공 및 계약 이행, 결과 리포트 전달",
      "· 서비스 개선을 위한 통계 분석 (개인 식별 불가능한 형태)",
      "수집한 정보는 마케팅 목적의 광고성 메시지 발송에 사용하지 않습니다.",
    ],
  },
  {
    h: "3. 보유 및 이용 기간",
    body: [
      "· 신청 정보: 상담 종료 후 1년까지 보관 후 파기 (재신청·분쟁 대응 목적)",
      "· 계약 체결 시: 관계 법령(전자상거래법 등)에 따른 보존 기간을 따릅니다. 계약·청약철회 기록 5년, 대금 결제 기록 5년, 소비자 불만·분쟁 처리 기록 3년",
      "· 정보주체가 삭제를 요청하는 경우 지체 없이 파기합니다.",
    ],
  },
  {
    h: "4. 개인정보 처리 위탁",
    body: [
      "서비스 운영을 위해 다음 업체에 데이터 처리를 위탁합니다.",
      "· Supabase Inc. (신청 데이터 보관)",
      "· Vercel Inc. (웹사이트 호스팅)",
      "· Google LLC (접속 통계 분석)",
    ],
  },
  {
    h: "5. 정보주체의 권리",
    body: [
      "이용자는 언제든지 본인의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있습니다. 아래 연락처로 요청 시 지체 없이 조치합니다.",
    ],
  },
  {
    h: "6. 개인정보 보호책임자",
    body: [
      "· 책임자: 이민제 (대표)",
      "· 문의: mj12270411@gmail.com",
      "개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(118), 개인정보분쟁조정위원회(1833-6972)에서도 가능합니다.",
    ],
  },
  {
    h: "7. 고지 의무",
    body: [
      "본 방침은 2026년 6월 11일부터 적용됩니다. 내용 변경 시 본 페이지를 통해 공지합니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <SubNav />
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:py-20">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          개인정보처리방침
        </h1>
        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-bold text-text">{s.h}</h2>
              {s.body.map((b, i) => (
                <p
                  key={i}
                  className="mt-3 leading-[1.75] text-text-secondary"
                >
                  {b}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
      <SubFooter />
    </main>
  );
}
