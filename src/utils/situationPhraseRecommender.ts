import { StandardPhrase } from "../types";

export interface SituationRecommendationContext {
  claimType?: string;          // 클레임 유형 (예: "이물", "변질", "누액", "표시오류", "내용량", "전체")
  investigationItem?: string;  // 조사 항목 (예: "보관품", "현품", "제조기록", "품질검사", "제조공정", "원부자재", "원인판정", "재발방지", "결론/사과", "시험원리")
  resultType?: string;         // 조사 결과 유형 (예: "이상 없음", "이상 확인", "확인 불가", "적합", "부적합", "해당 없음")
  usageLocation?: string;      // 사용 위치 (예: "분석 내용", "보관품 점검", "제조기록 점검", "품질검사", "현품 외관", "현품 분석", "원인 분석", "재발방지", "사과문")
  relatedProcess?: string;     // 관련 공정 (예: "여과", "UHT", "충전", "캡핑", "후살균", "포장", "공통")
  relatedProductType?: string; // 관련 제품 유형 (예: "혼합음료", "다류(액상차)", "건기식", "전체")
}

export interface RecommendationMatchResult {
  phrase: StandardPhrase;
  score: number;
  matchReasons: string[];
  isExactMatch: boolean;
}

/**
 * 클레임 유형 표준화
 */
export function normalizeClaimType(raw?: string): string {
  if (!raw) return "전체";
  const s = raw.toLowerCase().trim();
  if (s.includes("이물") || s === "foreign" || s.includes("파손") || s.includes("유리")) return "이물";
  if (s.includes("변질") || s === "spoilage" || s.includes("산패") || s.includes("곰팡이") || s.includes("침전")) return "변질";
  if (s.includes("누액") || s === "leak" || s.includes("캡") || s.includes("실링")) return "누액";
  if (s.includes("라벨") || s.includes("표시") || s.includes("날인") || s === "label") return "표시오류";
  if (s.includes("내용량") || s.includes("중량") || s.includes("수량") || s === "volume") return "내용량";
  return raw;
}

/**
 * 조사 항목 표준화
 */
export function normalizeInvestigationItem(raw?: string): string {
  if (!raw) return "전체";
  const s = raw.toLowerCase().trim();
  if (s.includes("보관품") || s.includes("retained") || s.includes("storagesample")) return "보관품";
  if (s.includes("현품") || s.includes("외관") || s.includes("visual") || s.includes("microscope") || s.includes("ftir")) return "현품";
  if (s.includes("제조기록") || s.includes("생산일지") || s.includes("manufacturingrecord") || s.includes("productionlog")) return "제조기록";
  if (s.includes("품질검사") || s.includes("성적서") || s.includes("qualityinspection") || s.includes("coa")) return "품질검사";
  if (s.includes("제조공정") || s.includes("공정") || s.includes("manufacturingprocess") || s.includes("process")) return "제조공정";
  if (s.includes("원부자재") || s.includes("원료") || s.includes("부자재") || s.includes("rawmaterial")) return "원부자재";
  if (s.includes("원인") || s.includes("판정") || s.includes("rootcause") || s.includes("cause")) return "원인판정";
  if (s.includes("대책") || s.includes("재발방지") || s.includes("preventive")) return "재발방지";
  if (s.includes("사과") || s.includes("안내") || s.includes("apology") || s.includes("conclusion")) return "결론/사과";
  if (s.includes("원리") || s.includes("principle")) return "시험원리";
  return raw;
}

/**
 * 조사 결과 유형 표준화
 */
export function normalizeResultType(raw?: string): string {
  if (!raw) return "전체";
  const s = raw.toLowerCase().trim();
  if (
    s === "normal" ||
    s === "pass" ||
    s === "no_issue" ||
    s.includes("이상 없음") ||
    s.includes("이상없음") ||
    s.includes("적합") ||
    s.includes("정상")
  ) {
    return "이상 없음";
  }
  if (
    s.includes("defect") ||
    s.includes("found") ||
    s.includes("fail") ||
    s.includes("이상 확인") ||
    s.includes("이상확인") ||
    s.includes("부적합") ||
    s.includes("이물 발견") ||
    s.includes("변질")
  ) {
    return "이상 확인";
  }
  if (s.includes("불가") || s.includes("unverifiable") || s.includes("확인 불가")) {
    return "확인 불가";
  }
  if (s.includes("해당 없음") || s.includes("해당없음") || s.includes("not_applicable")) {
    return "해당 없음";
  }
  return raw;
}

export const CLAIM_TYPE_OPTIONS = [
  "전체",
  "이물",
  "변질",
  "누액",
  "표시오류",
  "내용량",
  "용기/캡 파손",
  "기타",
];

export const INVESTIGATION_ITEM_OPTIONS = [
  "전체",
  "보관품",
  "현품",
  "제조기록",
  "품질검사",
  "제조공정",
  "원부자재",
  "원인판정",
  "재발방지",
  "결론/사과",
  "시험원리",
];

export const RESULT_TYPE_OPTIONS = [
  "전체",
  "이상 없음",
  "이상 확인",
  "확인 불가",
  "적합",
  "부적합",
  "해당 없음",
  "추가 조사 필요",
];

export const USAGE_LOCATION_OPTIONS = [
  "분석 내용",
  "보관품 점검",
  "제조기록 점검",
  "품질검사",
  "현품 외관",
  "현품 분석",
  "원인 분석",
  "재발방지",
  "사과문",
  "시험원리",
];

export const PROCESS_OPTIONS = [
  "공통",
  "원료 투입",
  "배합",
  "여과",
  "UHT",
  "저장",
  "세척",
  "충전",
  "캡핑",
  "후살균",
  "금속검출",
  "라벨링",
  "포장",
];

export const PRODUCT_TYPE_OPTIONS = [
  "전체",
  "혼합음료",
  "다류(액상차)",
  "건강기능식품",
  "의약외품",
  "과채음료",
  "탄산음료",
  "젤리",
];

/**
 * 규칙 기반 상황 매칭 점수 계산 및 추천 상용구 추출
 */
export function getRecommendedPhrases(
  allPhrases: StandardPhrase[],
  rawContext: SituationRecommendationContext
): RecommendationMatchResult[] {
  const normClaimType = normalizeClaimType(rawContext.claimType);
  const normItem = normalizeInvestigationItem(rawContext.investigationItem);
  const normResult = normalizeResultType(rawContext.resultType);
  const normLocation = rawContext.usageLocation || "분석 내용";

  const scored: RecommendationMatchResult[] = [];

  for (const phrase of allPhrases) {
    if (phrase.isActive === false) continue;

    let score = 0;
    const reasons: string[] = [];

    const phraseClaim = normalizeClaimType(phrase.claimType || "전체");
    const phraseItem = normalizeInvestigationItem(phrase.investigationItem || "전체");
    const phraseResult = normalizeResultType(phrase.resultType || "전체");
    const phraseLocation = phrase.usageLocation || "분석 내용";

    // 1. 조사 항목 일치 여부 (핵심 가중치: 40점)
    if (normItem !== "전체" && (phraseItem === normItem || phraseItem === "전체")) {
      if (phraseItem === normItem) {
        score += 40;
        reasons.push(`조사 항목 일치 (${normItem})`);
      } else {
        score += 15;
      }
    }

    // 2. 조사 결과 일치 여부 (핵심 가중치: 35점)
    if (normResult !== "전체" && (phraseResult === normResult || phraseResult === "전체")) {
      if (phraseResult === normResult) {
        score += 35;
        reasons.push(`조사 결과 일치 (${normResult})`);
      } else {
        score += 10;
      }
    }

    // 3. 클레임 유형 일치 여부 (가중치: 25점)
    if (normClaimType !== "전체" && (phraseClaim === normClaimType || phraseClaim === "전체")) {
      if (phraseClaim === normClaimType) {
        score += 25;
        reasons.push(`클레임 유형 일치 (${normClaimType})`);
      } else {
        score += 10;
      }
    }

    // 4. 사용 위치 일치 여부 (가중치: 10점)
    if (
      phraseLocation === normLocation ||
      phraseLocation.includes(normLocation) ||
      normLocation.includes(phraseLocation) ||
      phraseLocation === "분석 내용"
    ) {
      score += 10;
      reasons.push(`사용 위치 일치 (${phraseLocation})`);
    }

    // 5. 관련 공정 일치 여부 (가중치: 5점)
    if (rawContext.relatedProcess && phrase.relatedProcess) {
      if (phrase.relatedProcess === rawContext.relatedProcess || phrase.relatedProcess === "공통") {
        score += 5;
      }
    }

    // 6. 관련 제품 유형 일치 여부 (가중치: 5점)
    if (rawContext.relatedProductType && phrase.relatedProductType) {
      if (phrase.relatedProductType === rawContext.relatedProductType || phrase.relatedProductType === "전체") {
        score += 5;
      }
    }

    const isExactMatch =
      normItem !== "전체" &&
      normResult !== "전체" &&
      phraseItem === normItem &&
      phraseResult === normResult &&
      (phraseClaim === normClaimType || phraseClaim === "전체" || normClaimType === "전체");

    if (score >= 40 || isExactMatch) {
      scored.push({
        phrase,
        score,
        matchReasons: reasons,
        isExactMatch,
      });
    }
  }

  // 점수 높은 순 및 완전 일치 순 정렬
  return scored.sort((a, b) => {
    if (a.isExactMatch && !b.isExactMatch) return -1;
    if (!a.isExactMatch && b.isExactMatch) return 1;
    return b.score - a.score;
  });
}
