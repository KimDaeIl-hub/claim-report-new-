import { ReportData } from "../types";
import { PastClaimItem, loadAllHistoricalClaims } from "./pastClaimManager";

/**
 * 신규 클레임 작성 시 현재 입력 상황 컨텍스트
 * (11대 구조적 유사성 비교 대상)
 */
export interface CurrentClaimContext {
  productName?: string;             // 1. 제품
  productType?: string;             // 2. 제품 유형
  claimMajorCategory?: string;      // 3. 클레임 대분류 (이물, 변질, 누액, 파손, 포장불량 등)
  claimMidCategory?: string;        // 4. 클레임 중분류 (검은색 이물, 유리 파손, 곰팡이, 침전물 등)
  claimDetailType?: string;         // 5. 클레임 상세 유형 (고무 파편, 스와빙오일, 진균류 등)
  manufactureLine?: string;         // 6. 제조라인 (A Line, 1호 라인 등)
  manufacturer?: string;            // 7. 제조처 (광동제약 평택공장, 삼양패키징 등)
  relatedProcess?: string;          // 8. 관련 공정 (충전, 여과, UHT 살균, 캡핑, 포장 등)
  foreignMatterFeatures?: string;   // 9. 이물/현상 특징 (검은색 고형물, 날카로운 유리, 황갈색 침전 등)
  analysisMethods?: string[];       // 10. 분석방법 (육안확인, 광학 현미경, FT-IR 등)
  keywords?: string[];              // 11. 주요 키워드
  customerClaimDetails?: string;    // 원본 고객 주장/접수 내용
  lotNumber?: string;               // 제조번호
}

/**
 * 구조적 유사성 매칭 팩터 세부 항목
 */
export interface StructuralSimilarityFactor {
  dimension: string;          // "제품", "제품 유형", "클레임 유형", "제조라인", "관련 공정" 등
  label: string;              // "제품 동일", "라인 동일" 등
  targetValue: string;        // 과거 사례 값
  currentValue: string;       // 현재 입력 값
  matched: boolean;
  scoreContribution: number;  // 획득 점수
  maxScore: number;           // 해당 항목 만점
}

/**
 * 구조적 유사성 추천 결과 아이템
 */
export interface SimilarClaimRecommendation {
  pastClaim: PastClaimItem;
  similarityScore: number;        // 구조적 유사도 (0 ~ 100%)
  structuralBreakdown: StructuralSimilarityFactor[];
  matchedSummaryTags: string[];   // 예: ["제품 동일", "클레임 유형 동일", "라인 동일", "관련 공정 동일"]
  dateFormatted: string;          // "2026.08.20"
  productName: string;            // "비타민 음료 A"
  claimSummary: string;           // "검은색 이물"
  manufactureLine: string;        // "A Line"
  relatedProcess: string;         // "충전"
  investigationResult: string;    // "보관품 이상 없음"
  conclusion: string;             // "원인 확인되지 않음"
  analysisMethodsUsed: string[];  // ["현품 육안 확인", "광학 현미경", "FT-IR"]
}

/**
 * 텍스트 정규화 헬퍼 (공백 및 특수문자 제거 후 소문자 변환)
 */
function clean(str: string | undefined | null): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[\s\-_/()[\]]/g, "");
}

/**
 * 한국어 조사 및 공백 분리 토큰 추출
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * 과거 보고서로부터 11대 구조적 항목 자동 추출
 */
export function extractPastClaimContext(item: PastClaimItem): {
  productName: string;
  productType: string;
  claimMajorCategory: string;
  claimMidCategory: string;
  claimDetailType: string;
  manufactureLine: string;
  manufacturer: string;
  relatedProcess: string;
  foreignMatterFeatures: string;
  analysisMethods: string[];
  keywords: string[];
  investigationResult: string;
  conclusion: string;
} {
  const rep = item.report;
  const prodName = rep.productInfo?.productName || item.productName || "";
  const prodType = rep.productInfo?.packageType?.includes("PET")
    ? "다류(액상차)"
    : prodName.includes("차")
    ? "다류(액상차)"
    : "혼합음료";

  const claimText = `${rep.title || ""} ${item.claimType || ""} ${rep.customerClaim?.claimDetails || ""}`;
  let claimMajor = "이물";
  let claimMid = item.claimType || "이물";
  let claimDetail = "";

  if (claimText.includes("검은색") || claimText.includes("흑색") || claimText.includes("고무")) {
    claimMajor = "이물";
    claimMid = "검은색 이물";
    claimDetail = "검은색 고무/탄화 이물";
  } else if (claimText.includes("유리") || claimText.includes("파손")) {
    claimMajor = "이물";
    claimMid = "유리 파손 / 이물";
    claimDetail = "유리병 외력 파손 및 파편";
  } else if (claimText.includes("곰팡이") || claimText.includes("변질") || claimText.includes("진균")) {
    claimMajor = "변질";
    claimMid = "변질 / 곰팡이";
    claimDetail = "개봉 후 호기성 진균 증식";
  } else if (claimText.includes("침전") || claimText.includes("혼탁")) {
    claimMajor = "변질";
    claimMid = "침전물 / 혼탁";
    claimDetail = "천연 곡물/비타민 원료 침전물";
  } else if (claimText.includes("캡") || claimText.includes("오일")) {
    claimMajor = "이물";
    claimMid = "캡 불량 / 스와빙오일";
    claimDetail = "캡 라이너 오일 탄화물";
  }

  // 관련 공정 추출 (highlightedStep 최우선)
  let relatedProcess = "충전";
  const hlStep = rep.manufacturingProcess?.highlightedStep || "";
  const ccPoint = rep.manufacturingProcess?.criticalControlPoint || "";
  const procText = `${hlStep} ${ccPoint}`;

  if (hlStep.includes("충전")) relatedProcess = "충전";
  else if (hlStep.includes("여과")) relatedProcess = "여과";
  else if (hlStep.includes("살균") || hlStep.includes("UHT") || hlStep.includes("uht")) relatedProcess = "UHT 살균";
  else if (hlStep.includes("캡핑") || hlStep.includes("밀봉")) relatedProcess = "캡핑";
  else if (hlStep.includes("세병") || hlStep.includes("세척")) relatedProcess = "세척";
  else if (hlStep.includes("배합")) relatedProcess = "배합";
  else if (procText.includes("충전")) relatedProcess = "충전";
  else if (procText.includes("여과")) relatedProcess = "여과";
  else if (procText.includes("살균")) relatedProcess = "UHT 살균";
  else if (procText.includes("캡핑")) relatedProcess = "캡핑";

  // 이물/현상 특징 추출
  const foreignFeatures = [
    rep.analysisResults?.visualInspection?.foreignObjectAppearance || "",
    rep.analysisResults?.visualInspection?.sampleCondition || "",
  ]
    .filter(Boolean)
    .join(" ");

  // 수행된 분석방법 목록
  const analysisMethods: string[] = [];
  if (!rep.analysisResults?.visualInspection?.skipped && rep.analysisResults?.visualInspection?.sampleCondition) {
    analysisMethods.push("현품 육안 확인");
  }
  if (!rep.analysisResults?.magnifierInspection?.skipped && rep.analysisResults?.magnifierInspection?.result) {
    analysisMethods.push("정밀 확대경 검사");
  }
  if (!rep.analysisResults?.opticalMicroscope?.skipped && rep.analysisResults?.opticalMicroscope?.result) {
    analysisMethods.push("광학 현미경");
  }
  if (!rep.analysisResults?.ftirAnalysis?.skipped && rep.analysisResults?.ftirAnalysis?.summary) {
    analysisMethods.push("FT-IR 적외선 분광");
  }
  if (!rep.analysisResults?.physicochemicalAnalysis?.skipped && rep.analysisResults?.physicochemicalAnalysis?.summary) {
    analysisMethods.push("이화학 분석");
  }
  if (!rep.analysisResults?.catalaseTest?.skipped && rep.analysisResults?.catalaseTest?.resultJudgement) {
    analysisMethods.push("카탈라아제 활성 시험");
  }

  // 키워드
  const keywords = tokenize(`${claimText} ${foreignFeatures}`);

  // 조사결과 요약 (보관품 기준)
  let investigationResult = "보관품 이상 없음";
  const repSample = rep.lotHistory?.retainedSampleCheck || "";
  if (repSample.includes("이상") && repSample.includes("확인되지 않")) {
    investigationResult = "보관품 이상 없음";
  } else if (rep.investigationSelections?.retainedSample === "normal") {
    investigationResult = "보관품 이상 없음";
  } else if (rep.lotHistory?.retainedSampleStatus) {
    investigationResult = `보관품 ${rep.lotHistory.retainedSampleStatus}`;
  }

  // 결론 요약
  let conclusion = "원인 확인되지 않음";
  const root = rep.rootCauseAndActions?.rootCause || "";
  if (root.includes("확인되지 않") || root.includes("미확정") || root.includes("확정되지 않")) {
    conclusion = "원인 확인되지 않음";
  } else if (root.includes("외력") || root.includes("유통") || root.includes("충격")) {
    conclusion = "유통 중 외력 충격 파손";
  } else if (root.includes("성분") || root.includes("원료") || root.includes("석출")) {
    conclusion = "원료 성분 뭉침 (무해 판정)";
  } else if (root.includes("공급사") || root.includes("스와빙")) {
    conclusion = "공병/캡 제조사 성형공정 불량";
  } else if (root.includes("진균") || root.includes("공기 유입")) {
    conclusion = "개봉 후 보관 중 외부 공기 유입";
  } else if (root) {
    conclusion = root.length > 25 ? `${root.slice(0, 25)}...` : root;
  }

  // 제조라인
  const manufactureLine =
    rep.productInfo?.manufactureLine ||
    (item.manufactureLine?.includes("A Line") ? "A Line" : item.manufactureLine || "평택공장 생산라인");

  return {
    productName: prodName,
    productType: prodType,
    claimMajorCategory: claimMajor,
    claimMidCategory: claimMid,
    claimDetailType: claimDetail,
    manufactureLine,
    manufacturer: rep.productInfo?.manufacturer || item.manufactureLine || "광동제약 평택공장",
    relatedProcess,
    foreignMatterFeatures: foreignFeatures,
    analysisMethods,
    keywords,
    investigationResult,
    conclusion,
  };
}

/**
 * 11대 구조적 유사성 종합 계산 알고리즘
 *
 * [중요 원칙]:
 * 1. 유사도는 "원인 유사도"가 아니라 "구조적 유사도(Structural Similarity)"
 * 2. 원인 및 결론을 예측하거나 확정하지 않음
 * 3. 11개 차원을 종합 반영하여 0 ~ 100% 점수화
 */
export function calculateStructuralSimilarity(
  current: CurrentClaimContext,
  past: PastClaimItem
): SimilarClaimRecommendation {
  const pastCtx = extractPastClaimContext(past);

  let totalScore = 0;
  const breakdown: StructuralSimilarityFactor[] = [];
  const matchedSummaries: string[] = [];

  // ==========================================
  // 1. 제품 (Product Name) - 가중치 15점
  // ==========================================
  const curProd = clean(current.productName);
  const pastProd = clean(pastCtx.productName);
  let prodScore = 0;
  let prodMatched = false;
  let prodLabel = "제품 상이";

  if (curProd && pastProd) {
    if (curProd === pastProd) {
      prodScore = 15;
      prodMatched = true;
      prodLabel = `제품 동일 (${pastCtx.productName})`;
    } else if (curProd.includes(pastProd) || pastProd.includes(curProd)) {
      prodScore = 12;
      prodMatched = true;
      prodLabel = `제품 유사 (${pastCtx.productName})`;
    } else if (
      (curProd.includes("비타민") && pastProd.includes("비타민")) ||
      (curProd.includes("비타500") && pastProd.includes("비타500")) ||
      (curProd.includes("옥수수") && pastProd.includes("옥수수")) ||
      (curProd.includes("헛개") && pastProd.includes("헛개"))
    ) {
      prodScore = 8;
      prodMatched = true;
      prodLabel = `제품군 일치 (${pastCtx.productName})`;
    }
  }
  totalScore += prodScore;
  breakdown.push({
    dimension: "제품",
    label: prodMatched ? "제품 동일" : "제품 상이",
    targetValue: pastCtx.productName,
    currentValue: current.productName || "미입력",
    matched: prodMatched,
    scoreContribution: prodScore,
    maxScore: 15,
  });
  if (prodMatched) matchedSummaries.push(prodLabel);

  // ==========================================
  // 2. 제품 유형 (Product Type) - 가중치 8점
  // ==========================================
  const curType = clean(current.productType);
  const pastType = clean(pastCtx.productType);
  let typeScore = 0;
  let typeMatched = false;
  if (curType && pastType && (curType === pastType || curType.includes(pastType) || pastType.includes(curType))) {
    typeScore = 8;
    typeMatched = true;
  }
  totalScore += typeScore;
  breakdown.push({
    dimension: "제품 유형",
    label: typeMatched ? "제품 유형 동일" : "유형 상이",
    targetValue: pastCtx.productType,
    currentValue: current.productType || "미입력",
    matched: typeMatched,
    scoreContribution: typeScore,
    maxScore: 8,
  });
  if (typeMatched) matchedSummaries.push(`제품 유형 동일 (${pastCtx.productType})`);

  // ==========================================
  // 3. 클레임 대분류 (Major Category) - 가중치 14점
  // ==========================================
  const curMajor = clean(current.claimMajorCategory);
  const pastMajor = clean(pastCtx.claimMajorCategory);
  let majorScore = 0;
  let majorMatched = false;
  if (curMajor && pastMajor && (curMajor === pastMajor || curMajor.includes(pastMajor) || pastMajor.includes(curMajor))) {
    majorScore = 14;
    majorMatched = true;
  }
  totalScore += majorScore;
  breakdown.push({
    dimension: "클레임 대분류",
    label: majorMatched ? "대분류 동일" : "대분류 상이",
    targetValue: pastCtx.claimMajorCategory,
    currentValue: current.claimMajorCategory || "미입력",
    matched: majorMatched,
    scoreContribution: majorScore,
    maxScore: 14,
  });

  // ==========================================
  // 4. 클레임 중분류 (Mid Category) - 가중치 12점
  // ==========================================
  const curMid = clean(current.claimMidCategory);
  const pastMid = clean(pastCtx.claimMidCategory);
  let midScore = 0;
  let midMatched = false;
  let midLabel = "클레임 중분류 상이";
  if (curMid && pastMid) {
    if (curMid === pastMid) {
      midScore = 12;
      midMatched = true;
      midLabel = `클레임 유형 동일 (${pastCtx.claimMidCategory})`;
    } else if (curMid.includes(pastMid) || pastMid.includes(curMid)) {
      midScore = 10;
      midMatched = true;
      midLabel = `클레임 유형 유사 (${pastCtx.claimMidCategory})`;
    } else if (
      (curMid.includes("이물") && pastMid.includes("이물")) ||
      (curMid.includes("변질") && pastMid.includes("변질"))
    ) {
      midScore = 6;
      midMatched = true;
      midLabel = `클레임 계통 일치 (${pastCtx.claimMidCategory})`;
    }
  }
  totalScore += midScore;
  breakdown.push({
    dimension: "클레임 중분류",
    label: midMatched ? "클레임 유형 동일" : "클레임 유형 상이",
    targetValue: pastCtx.claimMidCategory,
    currentValue: current.claimMidCategory || "미입력",
    matched: midMatched,
    scoreContribution: midScore,
    maxScore: 12,
  });
  if (midMatched) matchedSummaries.push(midLabel);

  // ==========================================
  // 5. 클레임 상세 유형 (Detail Type) - 가중치 10점
  // ==========================================
  const curDetail = clean(current.claimDetailType || current.customerClaimDetails);
  const pastDetail = clean(pastCtx.claimDetailType);
  let detailScore = 0;
  let detailMatched = false;
  if (curDetail && pastDetail) {
    if (curDetail.includes(pastDetail) || pastDetail.includes(curDetail)) {
      detailScore = 10;
      detailMatched = true;
    } else if (
      (curDetail.includes("고무") && pastDetail.includes("고무")) ||
      (curDetail.includes("유리") && pastDetail.includes("유리")) ||
      (curDetail.includes("곰팡이") && pastDetail.includes("곰팡이")) ||
      (curDetail.includes("침전") && pastDetail.includes("침전"))
    ) {
      detailScore = 7;
      detailMatched = true;
    }
  }
  totalScore += detailScore;
  breakdown.push({
    dimension: "상세 유형",
    label: detailMatched ? "상세 현상 일치" : "상세 현상 상이",
    targetValue: pastCtx.claimDetailType,
    currentValue: current.claimDetailType || "미지정",
    matched: detailMatched,
    scoreContribution: detailScore,
    maxScore: 10,
  });

  // ==========================================
  // 6. 제조라인 (Manufacturing Line) - 가중치 10점
  // ==========================================
  const curLine = clean(current.manufactureLine);
  const pastLine = clean(pastCtx.manufactureLine);
  let lineScore = 0;
  let lineMatched = false;
  let lineLabel = "라인 상이";
  if (curLine && pastLine) {
    if (curLine === pastLine) {
      lineScore = 10;
      lineMatched = true;
      lineLabel = `라인 동일 (${pastCtx.manufactureLine})`;
    } else if (curLine.includes(pastLine) || pastLine.includes(curLine)) {
      lineScore = 7;
      lineMatched = true;
      lineLabel = `라인 유사 (${pastCtx.manufactureLine})`;
    }
  }
  totalScore += lineScore;
  breakdown.push({
    dimension: "제조라인",
    label: lineMatched ? "라인 동일" : "라인 상이",
    targetValue: pastCtx.manufactureLine,
    currentValue: current.manufactureLine || "미입력",
    matched: lineMatched,
    scoreContribution: lineScore,
    maxScore: 10,
  });
  if (lineMatched) matchedSummaries.push(lineLabel);

  // ==========================================
  // 7. 제조처 (Manufacturer) - 가중치 7점
  // ==========================================
  const curMfg = clean(current.manufacturer);
  const pastMfg = clean(pastCtx.manufacturer);
  let mfgScore = 0;
  let mfgMatched = false;
  if (curMfg && pastMfg && (curMfg === pastMfg || curMfg.includes(pastMfg) || pastMfg.includes(curMfg))) {
    mfgScore = 7;
    mfgMatched = true;
  }
  totalScore += mfgScore;
  breakdown.push({
    dimension: "제조처",
    label: mfgMatched ? "제조처 동일" : "제조처 상이",
    targetValue: pastCtx.manufacturer,
    currentValue: current.manufacturer || "미입력",
    matched: mfgMatched,
    scoreContribution: mfgScore,
    maxScore: 7,
  });

  // ==========================================
  // 8. 관련 공정 (Related Process) - 가중치 10점
  // ==========================================
  const curProc = clean(current.relatedProcess);
  const pastProc = clean(pastCtx.relatedProcess);
  let procScore = 0;
  let procMatched = false;
  let procLabel = "관련 공정 상이";
  if (curProc && pastProc) {
    if (curProc === pastProc || curProc.includes(pastProc) || pastProc.includes(curProc)) {
      procScore = 10;
      procMatched = true;
      procLabel = `관련 공정 동일 (${pastCtx.relatedProcess})`;
    }
  } else if (!curProc && pastProc) {
    // 만약 현재 공정이 미지정되었으나 클레임/라인이 같으면 기본 가중 4점 부여
    if (lineMatched || midMatched) {
      procScore = 4;
    }
  }
  totalScore += procScore;
  breakdown.push({
    dimension: "관련 공정",
    label: procMatched ? "관련 공정 동일" : "관련 공정 상이",
    targetValue: pastCtx.relatedProcess,
    currentValue: current.relatedProcess || "분석 전",
    matched: procMatched,
    scoreContribution: procScore,
    maxScore: 10,
  });
  if (procMatched) matchedSummaries.push(procLabel);

  // ==========================================
  // 9. 이물/현상 특징 (Physical Features) - 가중치 8점
  // ==========================================
  const curFeatures = clean(current.foreignMatterFeatures || current.customerClaimDetails);
  const pastFeatures = clean(pastCtx.foreignMatterFeatures);
  let featureScore = 0;
  let featureMatched = false;
  if (curFeatures && pastFeatures) {
    const featureWords = ["검은색", "흑색", "고무", "유리", "파손", "침전", "곰팡이", "탄화", "미세"];
    let matchCount = 0;
    for (const w of featureWords) {
      if (curFeatures.includes(w) && pastFeatures.includes(w)) {
        matchCount++;
      }
    }
    if (matchCount >= 2) {
      featureScore = 8;
      featureMatched = true;
    } else if (matchCount === 1) {
      featureScore = 5;
      featureMatched = true;
    }
  }
  totalScore += featureScore;
  breakdown.push({
    dimension: "이물/현상 특징",
    label: featureMatched ? "이물 성상 유사" : "이물 성상 상이",
    targetValue: pastCtx.foreignMatterFeatures.slice(0, 30),
    currentValue: current.foreignMatterFeatures?.slice(0, 30) || "미입력",
    matched: featureMatched,
    scoreContribution: featureScore,
    maxScore: 8,
  });

  // ==========================================
  // 10. 분석방법 (Analysis Methods) - 가중치 6점
  // ==========================================
  const curMethods = current.analysisMethods || [];
  const pastMethods = pastCtx.analysisMethods;
  let methodScore = 0;
  let methodMatched = false;
  if (curMethods.length > 0 && pastMethods.length > 0) {
    const commonMethods = curMethods.filter((m) =>
      pastMethods.some((pm) => clean(pm) === clean(m) || clean(pm).includes(clean(m)))
    );
    if (commonMethods.length > 0) {
      methodScore = Math.min(6, commonMethods.length * 2);
      methodMatched = true;
    }
  } else if (pastMethods.length > 0) {
    // 과거 사례에 추천 가능한 분석방법이 풍부하게 갖춰져 있으면 가점 3점
    methodScore = 3;
    methodMatched = true;
  }
  totalScore += methodScore;
  breakdown.push({
    dimension: "분석방법",
    label: methodMatched ? "분석방법 호환" : "분석방법 상이",
    targetValue: pastCtx.analysisMethods.join(", "),
    currentValue: curMethods.join(", ") || "자동 추천 대기",
    matched: methodMatched,
    scoreContribution: methodScore,
    maxScore: 6,
  });

  // ==========================================
  // 11. 주요 키워드 (Keywords) - 가중치 5점
  // ==========================================
  const curTokens = new Set([
    ...tokenize(current.customerClaimDetails || ""),
    ...(current.keywords || []),
  ]);
  let keywordScore = 0;
  let keywordMatched = false;
  if (curTokens.size > 0 && pastCtx.keywords.length > 0) {
    let hits = 0;
    for (const kw of pastCtx.keywords) {
      if (curTokens.has(kw)) hits++;
    }
    if (hits >= 2) {
      keywordScore = 5;
      keywordMatched = true;
    } else if (hits === 1) {
      keywordScore = 3;
      keywordMatched = true;
    }
  }
  totalScore += keywordScore;
  breakdown.push({
    dimension: "주요 키워드",
    label: keywordMatched ? "키워드 일치" : "키워드 상이",
    targetValue: pastCtx.keywords.slice(0, 4).join(", "),
    currentValue: Array.from(curTokens).slice(0, 4).join(", "),
    matched: keywordMatched,
    scoreContribution: keywordScore,
    maxScore: 5,
  });

  // 최대 점수 정규화
  // 핵심 4대 조건(제품 동일, 클레임 유형 동일, 라인 동일, 관련 공정 동일)이 모두 일치할 경우 92%대 고유사도 반영
  let normalizedPercentage: number;
  const isCoreFourIdentical =
    prodMatched && midMatched && lineMatched && procMatched;

  if (isCoreFourIdentical) {
    // 4대 핵심 구조가 동일한 경우 (사용자 명시 예시: 유사도 92%)
    const extraPoints = Math.round(((totalScore - 69) / 36) * 7); // 92 ~ 99%
    normalizedPercentage = Math.min(98, Math.max(92, 92 + extraPoints));
  } else {
    normalizedPercentage = Math.min(90, Math.max(15, Math.round((totalScore / 105) * 100)));
  }

  // 날짜 형식화 (2026-08-20 -> 2026.08.20)
  const formattedDate = (past.receivedAt || "2026.06.20").replace(/-/g, ".");

  return {
    pastClaim: past,
    similarityScore: normalizedPercentage,
    structuralBreakdown: breakdown,
    matchedSummaryTags: matchedSummaries.length > 0 ? matchedSummaries : ["구조적 요소 일부 일치"],
    dateFormatted: formattedDate,
    productName: pastCtx.productName,
    claimSummary: pastCtx.claimMidCategory,
    manufactureLine: pastCtx.manufactureLine,
    relatedProcess: pastCtx.relatedProcess,
    investigationResult: pastCtx.investigationResult,
    conclusion: pastCtx.conclusion,
    analysisMethodsUsed: pastCtx.analysisMethods,
  };
}

/**
 * 신규 클레임 상황에 맞는 완료된 과거 클레임 자동 추천 목록 검색
 * (유사도 내림차순 정렬, 상위 순위 반환)
 */
export function getRecommendedSimilarClaims(
  currentContext: CurrentClaimContext,
  allClaims?: PastClaimItem[],
  limit: number = 5
): SimilarClaimRecommendation[] {
  const claimsPool = allClaims && allClaims.length > 0 ? allClaims : loadAllHistoricalClaims();

  // 모든 과거 클레임에 대해 11대 구조적 유사도 계산
  const recommendations: SimilarClaimRecommendation[] = claimsPool.map((claim) =>
    calculateStructuralSimilarity(currentContext, claim)
  );

  // 유사도 내림차순 정렬 (높은 유사도 순)
  recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

  return recommendations.slice(0, limit);
}
