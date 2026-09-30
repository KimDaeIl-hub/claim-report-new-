import { ReportData, EmailAudienceSettings } from "../types";
import { maskCustomerName } from "./masking";
import { getSafeInvestigationText, resolveItemStatus } from "./investigationStatus";

export const DEFAULT_EMAIL_AUDIENCE_SETTINGS: EmailAudienceSettings = {
  includeVisual: true,          // 현품 외관 성상
  includeInstrumental: true,    // 정밀 기기분석(FTIR/XRF): 상세 분석 데이터 포함
  includeMicroscope: true,      // 확대경/현미경: 미세조직 및 균사 검경 소견 포함
  includePhysicochemical: true, // 이화학 및 규격 시험 수치/판정 포함
  includeProcessDetails: true,  // 제조공정 상세(살균, 여과, 세척 관리점)
  includeLotHistory: true,      // 동일 Lot 보관품 및 품질검사 이력
  includeRootCause: true,       // 종합 원인 판정 소견
  includePreventive: true,      // 재발방지 개선 대책
  useSimplifiedTerms: true,     // 비전문가용 쉬운 용어 변환
  strictSafetyGuard: true,      // 안전성/무해 단정 표현 엄격 차단
};

/**
 * 소비자용 쉬운 용어 변환 딕셔너리
 */
const TECHNICAL_TERMS_MAP: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /FT-IR\s*(적외선\s*분광\s*분석)?/gi, replacement: "정밀 적외선 성분 분석" },
  { regex: /XRF\s*(X선\s*형광\s*분석)?/gi, replacement: "정밀 무기물 원소 분석" },
  { regex: /EPDM/gi, replacement: "제조 설비용 식품용 고무 패킹 부품" },
  { regex: /카탈라아제\s*(효소\s*활성\s*시험)?/gi, replacement: "가열 살균 확인 시험" },
  { regex: /COA/gi, replacement: "완제품 공인 품질검사 성적서" },
  { regex: /150\s*Mesh\s*\(105[uμ]m\)/gi, replacement: "0.1mm 정밀 여과 필터망" },
  { regex: /Mesh|mesh/gi, replacement: "정밀 여과망" },
  { regex: /파단면/gi, replacement: "마찰 및 접촉 흔적" },
  { regex: /관능\s*검사/gi, replacement: "맛과 향, 색상 등 완제품 품질 검사" },
  { regex: /보관\s*검체|자사\s*보관품/gi, replacement: "동일 날짜 생산 당사 공장 보관 제품" },
  { regex: /린싱\(Rinsing\)|린싱/gi, replacement: "고온 온수 세척" },
  { regex: /에어\s*블로우/gi, replacement: "청정 공기 분사 세척" },
  { regex: /배양\s*검사/gi, replacement: "미생물 안전 정밀 검사" },
];

/**
 * 전문 기술 용어를 소비자가 알기 쉬운 표현으로 변환
 */
export function simplifyTechnicalTerms(text: string): string {
  if (!text) return "";
  let simplified = text;
  for (const { regex, replacement } of TECHNICAL_TERMS_MAP) {
    simplified = simplified.replace(regex, replacement);
  }
  return simplified;
}

/**
 * 근거 없는 "무해/안전" 단정 표현 패턴 목록
 */
const UNGROUNDED_SAFETY_PATTERNS: Array<{ regex: RegExp; safeAlternative: string; label: string }> = [
  {
    regex: /(인체에|건강에)\s*(전혀|완전히|절대)?\s*(무해합|무해함|해가\s*없|영향이\s*없)/g,
    safeAlternative: "식품 안전 관리 규격 기준에 적합하게 관리됨",
    label: "인체 무해 단정 표현",
  },
  {
    regex: /100%\s*안전|절대\s*안전|완전\s*안전/g,
    safeAlternative: "규격 기준치에 적합하여 이상 소견 없음",
    label: "절대 안전 과장 표현",
  },
  {
    regex: /안심하고\s*(섭취|음용|복용)하셔도\s*됩니다/g,
    safeAlternative: "해당 제품군 규격에 적합함을 확인하였습니다",
    label: "음용 권유 단정 표현",
  },
  {
    regex: /전혀\s*문제가\s*없/g,
    safeAlternative: "검사 항목 전반에서 기준 적합으로 확인되었음",
    label: "단정적 무결성 표현",
  },
];

/**
 * 근거 없는 안전 표현 엄격 차단 및 대체
 */
export function sanitizeSafetyClaims(
  text: string,
  hasScientificEvidence: boolean
): { sanitized: string; violationsFound: string[] } {
  if (!text) return { sanitized: "", violationsFound: [] };

  let sanitized = text;
  const violationsFound: string[] = [];

  for (const pattern of UNGROUNDED_SAFETY_PATTERNS) {
    if (pattern.regex.test(sanitized)) {
      violationsFound.push(pattern.label);
      // 과학적 검증 데이터가 확실한 경우에도 단정적 표현은 법적 리스크가 있으므로 규격 적합성 사실 표현으로 정제
      const replacement = hasScientificEvidence
        ? pattern.safeAlternative
        : "현재까지 확인된 시험 항목 기준 적합 (추가 규격 준수 관리)";
      sanitized = sanitized.replace(pattern.regex, replacement);
    }
  }

  return { sanitized, violationsFound };
}

/**
 * 보고서 데이터로부터 내부용 / 소비자용 포맷 생성 결과 인터페이스
 */
export interface GeneratedEmailResult {
  internal: {
    plainText: string;
    htmlText: string;
    subject: string;
    summaryCount: {
      technicalItems: number;
      processItems: number;
      uncertaintyIncluded?: boolean;
    };
  };
  consumer: {
    plainText: string;
    htmlText: string;
    subject: string;
    violationsBlocked: string[];
    simplifiedTermsApplied: boolean;
    omittedInternalItems: string[];
  };
}

/**
 * 연구원 명칭 클린징
 */
function cleanResearcherName(name?: string): string {
  if (!name || name.includes("박병철") || name.includes("커뮤니케이션")) {
    return "담당 연구원 김진영 대리";
  }
  return name.startsWith("담당") ? name : `담당 연구원 ${name}`;
}

/**
 * 내부용 및 소비자용 문서 동시 생성
 */
export function formatAudienceEmails(
  report: ReportData,
  customSettings?: Partial<EmailAudienceSettings>
): GeneratedEmailResult {
  const settings: EmailAudienceSettings = {
    ...DEFAULT_EMAIL_AUDIENCE_SETTINGS,
    ...(report.emailAudienceSettings || {}),
    ...(customSettings || {}),
  };

  const {
    customerClaim,
    productInfo,
    analysisResults,
    manufacturingProcess,
    lotHistory,
    rootCauseAndActions,
    conclusion,
    companyName = "광동제약주식회사",
    companyTel = "전화(031)8093-1813",
  } = report;

  const researcher = cleanResearcherName(report.researcherName);
  const displayName = maskCustomerName(
    customerClaim.customerName || "고객",
    customerClaim.maskCustomerName
  );
  const receivedDate = customerClaim.receivedAt
    ? customerClaim.receivedAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  // 안전성 근거 판정
  const isMicrobialTested =
    !analysisResults.physicochemicalAnalysis.skipped &&
    analysisResults.physicochemicalAnalysis.items.some(
      (i) =>
        i.name.includes("대장균") ||
        i.name.includes("미생물") ||
        i.name.includes("세균") ||
        i.name.includes("독소")
    );
  const retainedSafe =
    lotHistory.retainedSampleStatus === "이상 없음" ||
    lotHistory.retainedSampleStatus === "확인 완료";
  const hasScientificEvidence = isMicrobialTested || retainedSafe;

  const visualInfo = getSafeInvestigationText(
    analysisResults.visualInspection.status,
    analysisResults.visualInspection.sampleCondition,
    { skipped: analysisResults.visualInspection.skipped, investigatedFallback: "특이사항 없음" }
  );

  const retainedInfo = getSafeInvestigationText(
    lotHistory.retainedSampleStatus,
    lotHistory.retainedSampleCheck,
    { skipped: lotHistory.skipped, investigatedFallback: "동일 Lot 공장 보관 검체 이상 없음" }
  );

  const rootCauseRaw = rootCauseAndActions.rootCause?.trim() || "";
  const rootCauseStatus = resolveItemStatus(
    rootCauseAndActions.status,
    rootCauseAndActions.skipped,
    rootCauseRaw
  );
  const isRootCauseKnown =
    Boolean(rootCauseRaw) && rootCauseStatus !== "미실시" && rootCauseStatus !== "확인 불가";

  // =========================================================================
  // 1. [내부용 이메일] - 기술적 정밀 분석, 공정 이력, 종합 결론 세부 데이터 완벽 포함
  // =========================================================================
  const internalSubject = `[조사결과 회신] ${productInfo.productName || "제품"} 클레임 원인조사 완료 및 상세 분석 데이터 회신 (${displayName} 건)`;

  let internalTechnicalCount = 0;
  let internalProcessCount = 0;

  // Plain Text 작성
  let internalPlain = `수신: 커뮤니케이션팀 (고객소통 / CS 상담 담당자 앞)\n`;
  internalPlain += `발신: ${companyName} 식품품질경영팀 (${researcher})\n`;
  internalPlain += `제목: ${internalSubject}\n\n`;
  internalPlain += `커뮤니케이션팀 담당자님, 안녕하십니까.\n`;
  internalPlain += `${companyName} 식품품질경영팀 ${researcher}입니다.\n\n`;
  internalPlain += `접수 의뢰해 주신 [${productInfo.productName || "당사 제품"}] 건에 대하여 회수 현품 성상 점검, 광학/기기 정밀 분석, 동일 Lot 제조일지 및 공장 보관품 대조 조사를 모두 완료하여 상세 기술 조사 결과를 아래와 같이 회신드립니다.\n`;
  internalPlain += `상담팀에서 고객 문의 응대 시 기술적 인과관계와 시험 데이터를 정확히 인지하고 설명하실 수 있도록 세부 분석 내역을 포함하였으며, 식품품질경영팀장 최종 승인 정식 공문서(PDF)를 함께 첨부합니다.\n\n`;

  internalPlain += `==================================================\n`;
  internalPlain += `1. 클레임 인입 개요 및 대상 제품 정보\n`;
  internalPlain += `==================================================\n`;
  internalPlain += `• 대상 제품명: ${productInfo.productName || "-"}\n`;
  internalPlain += `• 제조번호(Lot): ${productInfo.lotNumber || "-"}\n`;
  internalPlain += `• 소비기한(유통기한): ${productInfo.expiryDate || "-"}\n`;
  if (productInfo.manufactureDate) {
    internalPlain += `• 제조일자: ${productInfo.manufactureDate}\n`;
  }
  internalPlain += `• 제조공장 / 생산처: ${productInfo.manufacturer || "-"}\n`;
  if (productInfo.packageType) {
    internalPlain += `• 포장 형태: ${productInfo.packageType}\n`;
  }
  internalPlain += `• 접수 고객명: ${displayName} (접수일: ${receivedDate})\n`;
  internalPlain += `• 인입 채널: ${customerClaim.channel || "고객상담센터"}\n`;
  internalPlain += `• 고객 인입 증상(불만 내용): ${customerClaim.claimDetails || "이상 현상 확인 의뢰"}\n\n`;

  internalPlain += `==================================================\n`;
  internalPlain += `2. 회수 현품 성상 및 외관 관찰 소견\n`;
  internalPlain += `==================================================\n`;
  if (!analysisResults.visualInspection.skipped) {
    internalPlain += `• 현품 잔여량 및 성상: [${visualInfo.status}] ${visualInfo.displayText}\n`;
    if (analysisResults.visualInspection.foreignObjectAppearance) {
      internalPlain += `• 이물 외형 관찰 소견: ${analysisResults.visualInspection.foreignObjectAppearance}\n`;
    }
    internalTechnicalCount++;
  } else {
    internalPlain += `• 현품 육안 검사: [생략/해당 없음]\n`;
  }
  internalPlain += `\n`;

  internalPlain += `==================================================\n`;
  internalPlain += `3. 정밀 과학 분석 결과 (공인 시험 장비 및 분석 데이터)\n`;
  internalPlain += `==================================================\n`;
  if (!analysisResults.magnifierInspection.skipped && analysisResults.magnifierInspection.result) {
    internalPlain += `• [확대경 조사 (${analysisResults.magnifierInspection.magnification || "정밀 확대"})]:\n`;
    internalPlain += `  - 소견: ${analysisResults.magnifierInspection.result}\n`;
    internalTechnicalCount++;
  }
  if (!analysisResults.opticalMicroscope.skipped && analysisResults.opticalMicroscope.result) {
    internalPlain += `• [광학 현미경 미세조직 분석 (${analysisResults.opticalMicroscope.magnification || "고배율"})]:\n`;
    internalPlain += `  - 검경 소견: ${analysisResults.opticalMicroscope.result}\n`;
    if (analysisResults.opticalMicroscope.includePrinciple && analysisResults.opticalMicroscope.principleText) {
      internalPlain += `  - 감식 원리: ${analysisResults.opticalMicroscope.principleText}\n`;
    }
    internalTechnicalCount++;
  }
  if (!analysisResults.ftirAnalysis.skipped && (analysisResults.ftirAnalysis.matchedMaterial || analysisResults.ftirAnalysis.summary)) {
    internalPlain += `• [FT-IR 적외선 분광 분석]:\n`;
    internalPlain += `  - 매칭 물질: ${analysisResults.ftirAnalysis.matchedMaterial || "-"}\n`;
    internalPlain += `  - 스펙트럼 유사도: ${analysisResults.ftirAnalysis.similarity || "-"}%\n`;
    internalPlain += `  - 성분 판정 요약: ${analysisResults.ftirAnalysis.summary || "-"}\n`;
    internalTechnicalCount++;
  }
  if (!analysisResults.xrfAnalysis.skipped && (analysisResults.xrfAnalysis.elementsRatio || analysisResults.xrfAnalysis.summary)) {
    internalPlain += `• [XRF X선 형광 원소 분석]:\n`;
    internalPlain += `  - 검출 원소 구성비: ${analysisResults.xrfAnalysis.elementsRatio || "-"}\n`;
    internalPlain += `  - 분석 요약: ${analysisResults.xrfAnalysis.summary || "-"}\n`;
    internalTechnicalCount++;
  }
  if (!analysisResults.physicochemicalAnalysis.skipped && analysisResults.physicochemicalAnalysis.items.length > 0) {
    internalPlain += `• [이화학적 특성 비교 분석 (시험일: ${analysisResults.physicochemicalAnalysis.testDate || "기록일"})]:\n`;
    analysisResults.physicochemicalAnalysis.items.forEach((item, idx) => {
      internalPlain += `  (${idx + 1}) ${item.name} [단위: ${item.unit || "-"}]\n`;
      internalPlain += `      - 기준 규격: ${item.standard || "-"}\n`;
      internalPlain += `      - 정상 보관품: ${item.controlValue || "-"}\n`;
      internalPlain += `      - 회수 현품: ${item.sampleValue || "-"}\n`;
      internalPlain += `      - 시험 판정: [${item.judgment}] ${item.remarks ? `(${item.remarks})` : ""}\n`;
    });
    if (analysisResults.physicochemicalAnalysis.summary) {
      internalPlain += `  - 이화학 분석 총평: ${analysisResults.physicochemicalAnalysis.summary}\n`;
    }
    internalTechnicalCount++;
  }
  if (!analysisResults.catalaseTest.skipped && analysisResults.catalaseTest.resultJudgement) {
    internalPlain += `• [카탈라아제(Catalase) 효소 활성 시험]:\n`;
    internalPlain += `  - 판정: ${analysisResults.catalaseTest.resultJudgement}\n`;
    internalPlain += `  - 반응 소견: ${analysisResults.catalaseTest.reactionDetail || "기록 없음"}\n`;
    internalTechnicalCount++;
  }
  if (analysisResults.additionalTests && analysisResults.additionalTests.length > 0) {
    analysisResults.additionalTests.forEach((t) => {
      internalPlain += `• [추가 정밀 시험: ${t.title}]: ${t.result} (판정: ${t.status || "확인 완료"})\n`;
      internalTechnicalCount++;
    });
  }
  internalPlain += `\n`;

  internalPlain += `==================================================\n`;
  internalPlain += `4. 제조공정 점검 및 관리 기준\n`;
  internalPlain += `==================================================\n`;
  if (!manufacturingProcess.skipped) {
    if (manufacturingProcess.processFlow) {
      internalPlain += `• 전체 제조공정 흐름:\n  ${manufacturingProcess.processFlow}\n\n`;
      internalProcessCount++;
    }
    if (manufacturingProcess.filtrationAnalysis) {
      internalPlain += `• 여과 공정(이물 제어):\n  ${manufacturingProcess.filtrationAnalysis}\n\n`;
      internalProcessCount++;
    }
    if (manufacturingProcess.cleaningAnalysis) {
      internalPlain += `• 용기/캡 세척 및 살균 공정:\n  ${manufacturingProcess.cleaningAnalysis}\n\n`;
      internalProcessCount++;
    }
    if (manufacturingProcess.criticalControlPoint) {
      internalPlain += `• 중요 관리점(CCP) 및 공정 연계 분석:\n  ${manufacturingProcess.criticalControlPoint}\n\n`;
      internalProcessCount++;
    }
  } else {
    internalPlain += `• 제조공정 점검: [생략/해당 없음]\n\n`;
  }

  internalPlain += `==================================================\n`;
  internalPlain += `5. 동일 제조번호(Lot: ${productInfo.lotNumber || "-"}) 품질검사 이력\n`;
  internalPlain += `==================================================\n`;
  if (!lotHistory.skipped) {
    if (lotHistory.productionLogNote) {
      internalPlain += `• 제조 당일 생산일지 점검:\n  ${lotHistory.productionLogNote}\n`;
    }
    if (lotHistory.qualityTestRecord) {
      internalPlain += `• 출하 전 완제품 품질검사 성적서 (COA):\n  ${lotHistory.qualityTestRecord}\n`;
    }
    if (lotHistory.priorClaimsCount) {
      internalPlain += `• 동일 Lot 이전 클레임 발생 이력:\n  ${lotHistory.priorClaimsCount}\n`;
    }
    internalPlain += `• 동일 Lot 공장 보관품 검사 결과:\n  [${retainedInfo.status}] ${retainedInfo.displayText}\n`;
    internalProcessCount++;
  } else {
    internalPlain += `• 동일 Lot 이력 점검: [생략/해당 없음]\n`;
  }
  internalPlain += `\n`;

  internalPlain += `==================================================\n`;
  internalPlain += `6. 종합 원인 판정 및 재발방지대책\n`;
  internalPlain += `==================================================\n`;
  internalPlain += `[가. 종합 원인 판정]\n${isRootCauseKnown ? rootCauseRaw : "원인 규명 진행 중 (단정 설명 금지)"}\n\n`;
  if (!rootCauseAndActions.preventiveMeasuresSkipped && rootCauseAndActions.preventiveMeasures) {
    internalPlain += `[나. 재발방지대책 및 조치사항]\n${rootCauseAndActions.preventiveMeasures}\n\n`;
  }

  if (conclusion.summaryPoints && conclusion.summaryPoints.length > 0) {
    internalPlain += `==================================================\n`;
    internalPlain += `7. 조사 결론 및 고객 응대 핵심 요약\n`;
    internalPlain += `==================================================\n`;
    conclusion.summaryPoints.forEach((pt) => {
      internalPlain += `${pt}\n`;
    });
    if (conclusion.apologyText) {
      internalPlain += `\n[고객 안내 및 사과 문구]:\n${conclusion.apologyText}\n`;
    }
    internalPlain += `\n`;
  }

  internalPlain += `==================================================\n`;
  internalPlain += `8. 첨부 문서 및 문의처\n`;
  internalPlain += `==================================================\n`;
  internalPlain += `• [첨부 1] ${productInfo.productName || "제품"}_원인조사보고서(식품품질경영팀).pdf\n\n`;
  internalPlain += `--------------------------------------------------\n`;
  internalPlain += `${companyName} 식품품질경영팀\n`;
  internalPlain += `${researcher} (내선/문의: ${companyTel})\n`;

  // HTML Text 작성 (Outlook, Groupware, Gmail 완벽 호환 스타일)
  let internalHtml = `<div style="font-family: 'Malgun Gothic', 'Noto Sans KR', -apple-system, sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b; max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px;">`;

  // Header Banner
  internalHtml += `<div style="background-color: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 18px;">`;
  internalHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 2px;">[내부 회신용 / 커뮤니케이션팀 보고]</div>`;
  internalHtml += `<div style="font-size: 15px; font-weight: bold; color: #ffffff;">${internalSubject}</div>`;
  internalHtml += `</div>`;

  // Intake Summary Box
  internalHtml += `<table style="width: 100%; font-size: 12px; margin-bottom: 18px; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">`;
  internalHtml += `<tr><td style="padding: 6px 12px; width: 100px; font-weight: bold; color: #64748b; border-bottom: 1px solid #e2e8f0;">수 &nbsp; 신</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0;">커뮤니케이션팀 (고객소통 / CS 상담 담당자 앞)</td></tr>`;
  internalHtml += `<tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b; border-bottom: 1px solid #e2e8f0;">발 &nbsp; 신</td><td style="padding: 6px 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0;"><strong>${companyName} 식품품질경영팀</strong> (${researcher})</td></tr>`;
  internalHtml += `<tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b; border-bottom: 1px solid #e2e8f0;">인입 고객</td><td style="padding: 6px 12px; color: #334155;"><strong>${displayName}</strong> 고객님 (접수일: ${receivedDate} / 채널: ${customerClaim.channel || "접수"})</td></tr>`;
  internalHtml += `<tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">대상 제품</td><td style="padding: 6px 12px; color: #0f172a;"><strong>${productInfo.productName || "-"}</strong> &nbsp;|&nbsp; Lot: <span style="color:#b91c1c; font-weight:bold;">${productInfo.lotNumber || "-"}</span> &nbsp;|&nbsp; 소비기한: ${productInfo.expiryDate || "-"} &nbsp;|&nbsp; 제조처: ${productInfo.manufacturer || "-"}</td></tr>`;
  internalHtml += `</table>`;

  internalHtml += `<p style="margin: 0 0 16px 0; font-size: 13px; color: #1e293b;">`;
  internalHtml += `커뮤니케이션팀 담당자님, 안녕하십니까.<br/>`;
  internalHtml += `<strong>${companyName} 식품품질경영팀 ${researcher}</strong>입니다.<br/>`;
  internalHtml += `접수 의뢰해 주신 <strong>[${productInfo.productName || "당사 제품"}]</strong> 건에 대해 정밀 과학 분석, 제조공정 점검 및 동일 Lot 보관품 대조 조사를 완료하여 기술적 분석 결과를 회신합니다. 아래의 세부 분석 데이터를 참고하여 고객 상담을 진행해 주시기 바랍니다.`;
  internalHtml += `</p>`;

  // 1. Visual Inspection Card
  if (!analysisResults.visualInspection.skipped) {
    internalHtml += `<div style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    internalHtml += `<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">1. 회수 현품 성상 및 외관 관찰 소견</h4>`;
    internalHtml += `<div style="font-size: 12px; line-height: 1.7; color: #334155;">`;
    internalHtml += `<div>• <strong>현품 잔여량 및 성상:</strong> ${visualInfo.displayText}</div>`;
    if (analysisResults.visualInspection.foreignObjectAppearance) {
      internalHtml += `<div>• <strong>이물 외형 관찰 소견:</strong> ${analysisResults.visualInspection.foreignObjectAppearance}</div>`;
    }
    internalHtml += `</div></div>`;
  }

  // 2. Scientific & Physicochemical Analysis Card
  internalHtml += `<div style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
  internalHtml += `<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">2. 정밀 과학 분석 결과 (공인 시험 및 장비 데이터)</h4>`;
  internalHtml += `<div style="font-size: 12px; line-height: 1.7; color: #334155;">`;

  if (!analysisResults.magnifierInspection.skipped && analysisResults.magnifierInspection.result) {
    internalHtml += `<div style="margin-bottom: 6px;">• <strong>확대경 조사 (${analysisResults.magnifierInspection.magnification || "정밀"}):</strong> ${analysisResults.magnifierInspection.result}</div>`;
  }
  if (!analysisResults.opticalMicroscope.skipped && analysisResults.opticalMicroscope.result) {
    internalHtml += `<div style="margin-bottom: 6px;">• <strong>광학 현미경 미세조직 분석 (${analysisResults.opticalMicroscope.magnification || "고배율"}):</strong> ${analysisResults.opticalMicroscope.result}</div>`;
    if (analysisResults.opticalMicroscope.includePrinciple && analysisResults.opticalMicroscope.principleText) {
      internalHtml += `<div style="margin-bottom: 6px; padding: 6px 10px; background: #f0fdf4; border-left: 3px solid #16a34a; font-size: 11px; color: #166534;">${analysisResults.opticalMicroscope.principleText}</div>`;
    }
  }
  if (!analysisResults.ftirAnalysis.skipped && (analysisResults.ftirAnalysis.matchedMaterial || analysisResults.ftirAnalysis.summary)) {
    internalHtml += `<div style="margin-bottom: 6px;">• <strong>FT-IR 적외선 분광:</strong> 매칭물질 [<strong>${analysisResults.ftirAnalysis.matchedMaterial || "-"}</strong>], 유사도 [${analysisResults.ftirAnalysis.similarity || "-"}%], 판정 요약 [${analysisResults.ftirAnalysis.summary || "-"}]</div>`;
  }
  if (!analysisResults.xrfAnalysis.skipped && (analysisResults.xrfAnalysis.elementsRatio || analysisResults.xrfAnalysis.summary)) {
    internalHtml += `<div style="margin-bottom: 6px;">• <strong>XRF 원소 분석:</strong> 원소비율 [${analysisResults.xrfAnalysis.elementsRatio || "-"}], 판정 [${analysisResults.xrfAnalysis.summary || "-"}]</div>`;
  }

  // Physicochemical Items Styled Table
  if (!analysisResults.physicochemicalAnalysis.skipped && analysisResults.physicochemicalAnalysis.items.length > 0) {
    internalHtml += `<div style="margin-top: 8px; margin-bottom: 6px;">`;
    internalHtml += `<div style="font-weight: bold; margin-bottom: 4px; color: #0f172a;">• 이화학적 특성 비교 분석 데이터:</div>`;
    internalHtml += `<table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px; border: 1px solid #cbd5e1;">`;
    internalHtml += `<tr style="background: #f1f5f9; color: #475569; text-align: center;">`;
    internalHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">시험 항목</th>`;
    internalHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">단위</th>`;
    internalHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">품질 기준 규격</th>`;
    internalHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">정상 보관품</th>`;
    internalHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">회수 현품</th>`;
    internalHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">판정</th>`;
    internalHtml += `</tr>`;

    analysisResults.physicochemicalAnalysis.items.forEach((item) => {
      const isFail = item.judgment === "부적합";
      internalHtml += `<tr style="text-align: center; background: ${isFail ? "#fff1f2" : "#ffffff"};">`;
      internalHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left;">${item.name}</td>`;
      internalHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1;">${item.unit || "-"}</td>`;
      internalHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1;">${item.standard || "-"}</td>`;
      internalHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1;">${item.controlValue || "-"}</td>`;
      internalHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; color: ${isFail ? "#b91c1c" : "#0f172a"};">${item.sampleValue || "-"}</td>`;
      internalHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; color: ${isFail ? "#b91c1c" : "#15803d"};">${item.judgment}</td>`;
      internalHtml += `</tr>`;
    });
    internalHtml += `</table>`;

    if (analysisResults.physicochemicalAnalysis.summary) {
      internalHtml += `<div style="font-size: 11px; color: #475569; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">${analysisResults.physicochemicalAnalysis.summary}</div>`;
    }
    internalHtml += `</div>`;
  }

  if (!analysisResults.catalaseTest.skipped && analysisResults.catalaseTest.resultJudgement) {
    internalHtml += `<div style="margin-top: 6px;">• <strong>카탈라아제 활성 시험:</strong> ${analysisResults.catalaseTest.resultJudgement} (${analysisResults.catalaseTest.reactionDetail || "기록 없음"})</div>`;
  }
  internalHtml += `</div></div>`;

  // 3. Process & Manufacturing Card
  if (!manufacturingProcess.skipped) {
    internalHtml += `<div style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    internalHtml += `<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">3. 제조공정 점검 및 관리 기준</h4>`;
    internalHtml += `<div style="font-size: 12px; line-height: 1.7; color: #334155;">`;
    if (manufacturingProcess.processFlow) {
      internalHtml += `<div style="margin-bottom: 6px; font-size: 11px; background: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0;"><strong>[공정 흐름도]</strong> ${manufacturingProcess.processFlow}</div>`;
    }
    if (manufacturingProcess.filtrationAnalysis) {
      internalHtml += `<div style="margin-bottom: 4px;">• <strong>여과 공정 (이물 제어):</strong> ${manufacturingProcess.filtrationAnalysis}</div>`;
    }
    if (manufacturingProcess.cleaningAnalysis) {
      internalHtml += `<div style="margin-bottom: 4px;">• <strong>용기/캡 세척·살균:</strong> ${manufacturingProcess.cleaningAnalysis}</div>`;
    }
    if (manufacturingProcess.criticalControlPoint) {
      internalHtml += `<div>• <strong>CCP 관리점 및 공정 연계:</strong> ${manufacturingProcess.criticalControlPoint}</div>`;
    }
    internalHtml += `</div></div>`;
  }

  // 4. Quality History & Retained Sample Card
  if (!lotHistory.skipped) {
    internalHtml += `<div style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    internalHtml += `<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">4. 동일 제조번호(Lot: ${productInfo.lotNumber || "-"}) 품질검사 이력</h4>`;
    internalHtml += `<div style="font-size: 12px; line-height: 1.7; color: #334155;">`;
    if (lotHistory.productionLogNote) {
      internalHtml += `<div>• <strong>생산일지 점검:</strong> ${lotHistory.productionLogNote}</div>`;
    }
    if (lotHistory.qualityTestRecord) {
      internalHtml += `<div>• <strong>출하 전 품질성적서 (COA):</strong> ${lotHistory.qualityTestRecord}</div>`;
    }
    if (lotHistory.priorClaimsCount) {
      internalHtml += `<div>• <strong>동일 Lot 이전 클레임:</strong> ${lotHistory.priorClaimsCount}</div>`;
    }
    internalHtml += `<div>• <strong>동일 Lot 공장 보관품:</strong> <span style="font-weight:bold; color:#1d4ed8;">${retainedInfo.displayText}</span></div>`;
    internalHtml += `</div></div>`;
  }

  // 5. Root Cause & Preventive Actions Card
  internalHtml += `<div style="margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc;">`;
  internalHtml += `<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">5. 종합 원인 판정 및 재발방지대책</h4>`;
  internalHtml += `<div style="font-size: 12px; line-height: 1.7; color: #334155;">`;
  internalHtml += `<div style="margin-bottom: 8px;"><strong>[가. 종합 원인 판정]</strong><br/>${isRootCauseKnown ? rootCauseRaw.replace(/\n/g, "<br/>") : '<span style="color:#b45309;">원인 규명 진행 중</span>'}</div>`;
  if (!rootCauseAndActions.preventiveMeasuresSkipped && rootCauseAndActions.preventiveMeasures) {
    internalHtml += `<div><strong>[나. 재발방지대책 및 조치사항]</strong><br/>${rootCauseAndActions.preventiveMeasures.replace(/\n/g, "<br/>")}</div>`;
  }
  internalHtml += `</div></div>`;

  // 6. Conclusion Points Card
  if (conclusion.summaryPoints && conclusion.summaryPoints.length > 0) {
    internalHtml += `<div style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    internalHtml += `<h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">6. 조사 결론 및 고객 응대 핵심 요약</h4>`;
    internalHtml += `<ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.7;">`;
    conclusion.summaryPoints.forEach((pt) => {
      internalHtml += `<li style="margin-bottom: 4px;">${pt}</li>`;
    });
    internalHtml += `</ol>`;
    if (conclusion.apologyText) {
      internalHtml += `<div style="margin-top: 10px; padding: 8px 12px; background: #f1f5f9; border-radius: 4px; font-size: 11px; color: #475569; line-height: 1.6;"><strong>[고객 사과 문구]</strong> ${conclusion.apologyText}</div>`;
    }
    internalHtml += `</div>`;
  }

  // Attachments & Signature
  internalHtml += `<div style="background: #f8fafc; padding: 10px 14px; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 12px; color: #475569; margin-bottom: 16px;">`;
  internalHtml += `📎 <strong>첨부파일:</strong> ${productInfo.productName || "제품"}_원인조사보고서(식품품질경영팀).pdf (식품품질경영팀장 최종 승인 공문서)`;
  internalHtml += `</div>`;

  internalHtml += `<div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">`;
  internalHtml += `<strong>${companyName} 식품품질경영팀</strong> &nbsp;|&nbsp; ${researcher} (문의: ${companyTel})`;
  internalHtml += `</div>`;
  internalHtml += `</div>`;

  // =========================================================================
  // 2. [소비자용 안내문] - 쉬운 표현, 불필요한 내부정보 제외, 안전표현 금지 준수
  // =========================================================================
  const consumerSubject = `[안내] ${productInfo.productName || "제품"} 관련 문의에 대한 식품품질경영팀 원인조사 결과 안내의 건`;

  const omittedInternalItems: string[] = [];
  const violationsBlocked: string[] = [];

  // 소비자 텍스트 작성
  let consumerPlain = `수신: ${displayName} 고객님\n`;
  consumerPlain += `발신: ${companyName} 식품품질경영팀\n`;
  consumerPlain += `제목: ${consumerSubject}\n\n`;
  consumerPlain += `안녕하십니까, ${displayName} 고객님.\n`;
  consumerPlain += `${companyName} 식품품질경영팀입니다.\n\n`;
  consumerPlain += `항상 저희 제품을 애용해 주셔서 진심으로 감사드립니다.\n`;
  consumerPlain += `고객님께서 문의해 주신 [${productInfo.productName || "당사 제품"}] 건과 관련하여 식품품질경영팀에서 제조 이력 점검 및 정밀 분석을 실시하였으며, 식품품질경영팀장이 최종 승인한 조사 결과를 아래와 같이 정중히 안내해 드립니다.\n\n`;

  consumerPlain += `--------------------------------------------------\n`;
  consumerPlain += `[대상 제품 정보]\n`;
  consumerPlain += `• 제품명: ${productInfo.productName || "-"}\n`;
  consumerPlain += `• 유통기한 / 제조번호: ${productInfo.expiryDate || "-"} / ${productInfo.lotNumber || "-"}\n\n`;

  consumerPlain += `[원인조사 핵심 요약]\n`;
  let sectionIndex = 1;

  // 1) 현품 성상 (includeVisual)
  if (settings.includeVisual && !analysisResults.visualInspection.skipped) {
    let rawVisual = visualInfo.displayText;
    if (settings.useSimplifiedTerms) rawVisual = simplifyTechnicalTerms(rawVisual);
    consumerPlain += `${sectionIndex++}. 회수 현품 성상 및 외관 관찰:\n`;
    consumerPlain += `   • 현품 잔여량 및 성상: ${rawVisual}\n`;
    if (analysisResults.visualInspection.foreignObjectAppearance) {
      let rawObj = analysisResults.visualInspection.foreignObjectAppearance;
      if (settings.useSimplifiedTerms) rawObj = simplifyTechnicalTerms(rawObj);
      consumerPlain += `   • 이물 외형 관찰 소견: ${rawObj}\n`;
    }
    consumerPlain += `\n`;
  }

  // 2) 현미경/확대경 조사 (includeMicroscope)
  if (settings.includeMicroscope && (!analysisResults.opticalMicroscope.skipped || !analysisResults.magnifierInspection.skipped)) {
    consumerPlain += `${sectionIndex++}. 현미경 및 확대경 정밀 관찰 소견:\n`;
    if (!analysisResults.opticalMicroscope.skipped && analysisResults.opticalMicroscope.result) {
      let micText = analysisResults.opticalMicroscope.result;
      if (settings.useSimplifiedTerms) micText = simplifyTechnicalTerms(micText);
      consumerPlain += `   • 광학 현미경 검경 (${analysisResults.opticalMicroscope.magnification || "고배율"}): ${micText}\n`;
      if (analysisResults.opticalMicroscope.includePrinciple && analysisResults.opticalMicroscope.principleText) {
        let pText = simplifyTechnicalTerms(analysisResults.opticalMicroscope.principleText);
        consumerPlain += `     (감식 원리: ${pText})\n`;
      }
    }
    if (!analysisResults.magnifierInspection.skipped && analysisResults.magnifierInspection.result) {
      let magText = analysisResults.magnifierInspection.result;
      if (settings.useSimplifiedTerms) magText = simplifyTechnicalTerms(magText);
      consumerPlain += `   • 확대경 정밀 관찰 (${analysisResults.magnifierInspection.magnification || "정밀"}): ${magText}\n`;
    }
    consumerPlain += `\n`;
  }

  // 3) 정밀 기기분석 (includeInstrumental)
  if (settings.includeInstrumental && (!analysisResults.ftirAnalysis.skipped || !analysisResults.xrfAnalysis.skipped)) {
    consumerPlain += `${sectionIndex++}. 정밀 성분 및 원소 분석 (공인 기기분석):\n`;
    if (!analysisResults.ftirAnalysis.skipped && (analysisResults.ftirAnalysis.matchedMaterial || analysisResults.ftirAnalysis.summary)) {
      let ftirMat = simplifyTechnicalTerms(analysisResults.ftirAnalysis.matchedMaterial || "-");
      let ftirSummary = simplifyTechnicalTerms(analysisResults.ftirAnalysis.summary || "-");
      consumerPlain += `   • 적외선 분광 성분 분석 (FT-IR): 매칭 물질 [${ftirMat}], 스펙트럼 유사도 [${analysisResults.ftirAnalysis.similarity || "-"}%], 판정 요약 [${ftirSummary}]\n`;
    }
    if (!analysisResults.xrfAnalysis.skipped && (analysisResults.xrfAnalysis.elementsRatio || analysisResults.xrfAnalysis.summary)) {
      let xrfSummary = simplifyTechnicalTerms(analysisResults.xrfAnalysis.summary || "-");
      consumerPlain += `   • X선 원소 분석 (XRF): 검출 원소비 [${analysisResults.xrfAnalysis.elementsRatio || "-"}], 분석 요약 [${xrfSummary}]\n`;
    }
    consumerPlain += `\n`;
  }

  // 4) 이화학 및 규격 검사 (includePhysicochemical)
  if (settings.includePhysicochemical && !analysisResults.physicochemicalAnalysis.skipped) {
    if (analysisResults.physicochemicalAnalysis.items.length > 0) {
      consumerPlain += `${sectionIndex++}. 이화학 특성 및 품질 규격 검사 (시험일: ${analysisResults.physicochemicalAnalysis.testDate || "기록일"}):\n`;
      analysisResults.physicochemicalAnalysis.items.forEach((item) => {
        consumerPlain += `   • ${item.name}: 기준 [${item.standard || "-"}], 정상 보관품 [${item.controlValue || "-"}], 회수 현품 [${item.sampleValue || "-"}], 판정 [${item.judgment}] ${item.remarks ? `(${item.remarks})` : ""}\n`;
      });
      if (analysisResults.physicochemicalAnalysis.summary) {
        let pcSummary = simplifyTechnicalTerms(analysisResults.physicochemicalAnalysis.summary);
        consumerPlain += `   • 이화학 분석 총평: ${pcSummary}\n`;
      }
    }
    if (!analysisResults.catalaseTest.skipped && analysisResults.catalaseTest.resultJudgement) {
      consumerPlain += `   • 가열 살균 확인 시험 (카탈라아제): 판정 [${analysisResults.catalaseTest.resultJudgement}], 반응 [${analysisResults.catalaseTest.reactionDetail || "이상 없음"}]\n`;
    }
    consumerPlain += `\n`;
  }

  // 5) 제조 공정 상세 (includeProcessDetails)
  if (settings.includeProcessDetails && !manufacturingProcess.skipped) {
    consumerPlain += `${sectionIndex++}. 제조공정 점검 및 품질 관리 기준:\n`;
    if (manufacturingProcess.processFlow) {
      consumerPlain += `   • 제조 공정 흐름: ${manufacturingProcess.processFlow}\n`;
    }
    if (manufacturingProcess.filtrationAnalysis) {
      let rawFil = simplifyTechnicalTerms(manufacturingProcess.filtrationAnalysis);
      consumerPlain += `   • 여과 공정 (이물 차단): ${rawFil}\n`;
    }
    if (manufacturingProcess.cleaningAnalysis) {
      let rawCln = simplifyTechnicalTerms(manufacturingProcess.cleaningAnalysis);
      consumerPlain += `   • 용기 세척 및 살균: ${rawCln}\n`;
    }
    if (manufacturingProcess.criticalControlPoint) {
      let rawCcp = simplifyTechnicalTerms(manufacturingProcess.criticalControlPoint);
      consumerPlain += `   • 중요 관리점 (CCP 모니터링): ${rawCcp}\n`;
    }
    consumerPlain += `\n`;
  }

  // 6) 공장 보관 검체 및 Lot 이력 (includeLotHistory)
  if (settings.includeLotHistory && !lotHistory.skipped) {
    let rawRetained = retainedInfo.displayText;
    if (settings.useSimplifiedTerms) rawRetained = simplifyTechnicalTerms(rawRetained);
    consumerPlain += `${sectionIndex++}. 동일 제조번호(Lot: ${productInfo.lotNumber || "-"}) 품질 이력 점검:\n`;
    consumerPlain += `   • 동일 Lot 당사 공장 보관 제품 확인: ${rawRetained}\n`;
    if (lotHistory.productionLogNote) {
      consumerPlain += `   • 제조일 생산일지 점검: ${lotHistory.productionLogNote}\n`;
    }
    if (lotHistory.qualityTestRecord) {
      consumerPlain += `   • 완제품 품질 성적서 (COA): ${lotHistory.qualityTestRecord}\n`;
    }
    if (lotHistory.priorClaimsCount) {
      consumerPlain += `   • 동일 Lot 이전 클레임 이력: ${lotHistory.priorClaimsCount}\n`;
    }
    consumerPlain += `\n`;
  }

  // 7) 종합 원인 판정 (includeRootCause)
  if (settings.includeRootCause && isRootCauseKnown) {
    let rawCause = rootCauseRaw;
    if (settings.useSimplifiedTerms) rawCause = simplifyTechnicalTerms(rawCause);
    consumerPlain += `${sectionIndex++}. 종합 원인 판정 소견:\n   ${rawCause}\n\n`;
  }

  // 8) 재발방지 및 개선 대책 (includePreventive)
  if (settings.includePreventive && !rootCauseAndActions.preventiveMeasuresSkipped && rootCauseAndActions.preventiveMeasures) {
    let rawPrev = rootCauseAndActions.preventiveMeasures;
    if (settings.useSimplifiedTerms) rawPrev = simplifyTechnicalTerms(rawPrev);
    consumerPlain += `${sectionIndex++}. 품질 개선 및 재발방지 대책:\n   ${rawPrev.replace(/\n/g, "\n   ")}\n\n`;
  }

  // 9) 조사 결론 핵심 요약 (conclusion points)
  if (conclusion.summaryPoints && conclusion.summaryPoints.length > 0) {
    consumerPlain += `${sectionIndex++}. 조사 결론 요약:\n`;
    conclusion.summaryPoints.forEach((pt) => {
      consumerPlain += `   ${pt}\n`;
    });
    consumerPlain += `\n`;
  }

  // 10) 고객 사과 및 안심 맺음말
  consumerPlain += `[고객 안내 및 맺음말]\n`;
  let rawApology =
    conclusion.apologyText ||
    "저희 제품으로 인해 불편을 겪으신 고객님께 진심으로 사과의 말씀을 드리며, 철저한 품질 관리로 보답하겠습니다.";
  if (settings.useSimplifiedTerms) rawApology = simplifyTechnicalTerms(rawApology);

  // 안전성 표현 엄격 가드 적용
  if (settings.strictSafetyGuard) {
    const { sanitized, violationsFound } = sanitizeSafetyClaims(rawApology, hasScientificEvidence);
    rawApology = sanitized;
    violationsBlocked.push(...violationsFound);
  }
  consumerPlain += `${rawApology}\n\n`;

  consumerPlain += `* 상세한 과학적 분석 데이터와 공식 확인 결과는 첨부된 [원인조사 결과 보고서(공문서 PDF)]를 확인해 주시기 바랍니다.\n\n`;
  consumerPlain += `감사합니다.\n\n`;
  consumerPlain += `--------------------------------------------------\n`;
  consumerPlain += `${companyName} 식품품질경영팀\n`;
  consumerPlain += `${researcher} (문의 전화: ${companyTel})\n`;

  // HTML 버전 작성 (구체적인 카드 및 데이터 테이블 포함)
  let consumerHtml = `<div style="font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif; font-size: 13px; line-height: 1.65; color: #1e293b; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px;">`;
  consumerHtml += `<div style="background-color: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 6px; margin-bottom: 18px;">`;
  consumerHtml += `<div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 2px;">[고객 상담 회신 및 안내문]</div>`;
  consumerHtml += `<div style="font-size: 15px; font-weight: bold; color: #ffffff;">${consumerSubject}</div>`;
  consumerHtml += `</div>`;

  consumerHtml += `<p style="margin: 0 0 12px 0;">안녕하십니까, <strong>${displayName}</strong> 고객님.<br/><strong>${companyName} 식품품질경영팀</strong>입니다.</p>`;
  consumerHtml += `<p style="margin: 0 0 16px 0; color: #475569;">항상 저희 제품을 애용해 주셔서 진심으로 감사드립니다.<br/>고객님께서 문의해 주신 <strong>[${productInfo.productName || "당사 제품"}]</strong>에 대해 제조 이력 점검 및 정밀 분석을 실시하였으며, 식품품질경영팀장이 최종 승인한 조사 결과를 정중히 안내해 드립니다.</p>`;

  consumerHtml += `<div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 18px; font-size: 12px;">`;
  consumerHtml += `<strong>[대상 제품 정보]</strong> 제품명: <strong>${productInfo.productName || "-"}</strong> &nbsp;|&nbsp; 소비(유통)기한: ${productInfo.expiryDate || "-"} &nbsp;|&nbsp; 제조번호: <span style="color:#b91c1c; font-weight:bold;">${productInfo.lotNumber || "-"}</span> &nbsp;|&nbsp; 제조처: ${productInfo.manufacturer || "-"}`;
  consumerHtml += `</div>`;

  // 1. Visual Card
  if (settings.includeVisual && !analysisResults.visualInspection.skipped) {
    let vText = visualInfo.displayText;
    if (settings.useSimplifiedTerms) vText = simplifyTechnicalTerms(vText);
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">1. 회수 현품 성상 및 외관 관찰 소견</h4>`;
    consumerHtml += `<div style="font-size: 12px; color: #334155; line-height: 1.6;">`;
    consumerHtml += `<div>• <strong>현품 잔여량 및 성상:</strong> ${vText}</div>`;
    if (analysisResults.visualInspection.foreignObjectAppearance) {
      let rawObj = simplifyTechnicalTerms(analysisResults.visualInspection.foreignObjectAppearance);
      consumerHtml += `<div>• <strong>이물 외형 관찰 소견:</strong> ${rawObj}</div>`;
    }
    consumerHtml += `</div></div>`;
  }

  // 2. Microscope & Instrumental Card
  if ((settings.includeMicroscope && (!analysisResults.opticalMicroscope.skipped || !analysisResults.magnifierInspection.skipped)) ||
      (settings.includeInstrumental && (!analysisResults.ftirAnalysis.skipped || !analysisResults.xrfAnalysis.skipped))) {
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">2. 정밀 과학 분석 결과 (현미경 검경 및 성분 분석)</h4>`;
    consumerHtml += `<div style="font-size: 12px; color: #334155; line-height: 1.6;">`;

    if (settings.includeMicroscope && !analysisResults.opticalMicroscope.skipped && analysisResults.opticalMicroscope.result) {
      let micText = simplifyTechnicalTerms(analysisResults.opticalMicroscope.result);
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>광학 현미경 미세구조 검경 (${analysisResults.opticalMicroscope.magnification || "고배율"}):</strong> ${micText}</div>`;
    }
    if (settings.includeMicroscope && !analysisResults.magnifierInspection.skipped && analysisResults.magnifierInspection.result) {
      let magText = simplifyTechnicalTerms(analysisResults.magnifierInspection.result);
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>확대경 관찰 (${analysisResults.magnifierInspection.magnification || "정밀"}):</strong> ${magText}</div>`;
    }
    if (settings.includeInstrumental && !analysisResults.ftirAnalysis.skipped && (analysisResults.ftirAnalysis.matchedMaterial || analysisResults.ftirAnalysis.summary)) {
      let ftirMat = simplifyTechnicalTerms(analysisResults.ftirAnalysis.matchedMaterial || "-");
      let ftirSummary = simplifyTechnicalTerms(analysisResults.ftirAnalysis.summary || "-");
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>적외선 분광 성분 분석 (FT-IR):</strong> 매칭 성분 [<strong>${ftirMat}</strong>], 유사도 [${analysisResults.ftirAnalysis.similarity || "-"}%], 판정 [${ftirSummary}]</div>`;
    }
    if (settings.includeInstrumental && !analysisResults.xrfAnalysis.skipped && (analysisResults.xrfAnalysis.elementsRatio || analysisResults.xrfAnalysis.summary)) {
      let xrfSummary = simplifyTechnicalTerms(analysisResults.xrfAnalysis.summary || "-");
      consumerHtml += `<div>• <strong>X선 원소 분석 (XRF):</strong> 원소비 [${analysisResults.xrfAnalysis.elementsRatio || "-"}], 판정 [${xrfSummary}]</div>`;
    }
    consumerHtml += `</div></div>`;
  }

  // 3. Physicochemical Analysis Card
  if (settings.includePhysicochemical && !analysisResults.physicochemicalAnalysis.skipped) {
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">3. 이화학 특성 및 품질 규격 검사 데이터</h4>`;
    consumerHtml += `<div style="font-size: 12px; color: #334155; line-height: 1.6;">`;

    if (analysisResults.physicochemicalAnalysis.items.length > 0) {
      consumerHtml += `<table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; margin-bottom: 6px; border: 1px solid #cbd5e1;">`;
      consumerHtml += `<tr style="background: #f1f5f9; color: #475569; text-align: center;">`;
      consumerHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">시험 항목</th>`;
      consumerHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">기준 규격</th>`;
      consumerHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">정상 보관품</th>`;
      consumerHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">회수 현품</th>`;
      consumerHtml += `<th style="padding: 5px; border: 1px solid #cbd5e1;">판정</th>`;
      consumerHtml += `</tr>`;

      analysisResults.physicochemicalAnalysis.items.forEach((item) => {
        const isFail = item.judgment === "부적합";
        consumerHtml += `<tr style="text-align: center; background: ${isFail ? "#fff1f2" : "#ffffff"};">`;
        consumerHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left;">${item.name}</td>`;
        consumerHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1;">${item.standard || "-"}</td>`;
        consumerHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1;">${item.controlValue || "-"}</td>`;
        consumerHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; color: ${isFail ? "#b91c1c" : "#0f172a"};">${item.sampleValue || "-"}</td>`;
        consumerHtml += `<td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; color: ${isFail ? "#b91c1c" : "#15803d"};">${item.judgment}</td>`;
        consumerHtml += `</tr>`;
      });
      consumerHtml += `</table>`;

      if (analysisResults.physicochemicalAnalysis.summary) {
        let pcSummary = simplifyTechnicalTerms(analysisResults.physicochemicalAnalysis.summary);
        consumerHtml += `<div style="font-size: 11px; color: #475569; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 4px;">• <strong>이화학 분석 총평:</strong> ${pcSummary}</div>`;
      }
    }
    if (!analysisResults.catalaseTest.skipped && analysisResults.catalaseTest.resultJudgement) {
      consumerHtml += `<div style="margin-top: 6px;">• <strong>가열 살균 확인 시험 (카탈라아제):</strong> ${analysisResults.catalaseTest.resultJudgement} (${analysisResults.catalaseTest.reactionDetail || "이상 없음"})</div>`;
    }
    consumerHtml += `</div></div>`;
  }

  // 4. Manufacturing Process Card
  if (settings.includeProcessDetails && !manufacturingProcess.skipped) {
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">4. 제조공정 점검 및 관리 기준</h4>`;
    consumerHtml += `<div style="font-size: 12px; color: #334155; line-height: 1.6;">`;
    if (manufacturingProcess.processFlow) {
      consumerHtml += `<div style="margin-bottom: 6px; font-size: 11px; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;"><strong>[공정 흐름도]</strong> ${manufacturingProcess.processFlow}</div>`;
    }
    if (manufacturingProcess.filtrationAnalysis) {
      let rawFil = simplifyTechnicalTerms(manufacturingProcess.filtrationAnalysis);
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>여과 공정 (이물 차단):</strong> ${rawFil}</div>`;
    }
    if (manufacturingProcess.cleaningAnalysis) {
      let rawCln = simplifyTechnicalTerms(manufacturingProcess.cleaningAnalysis);
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>용기 세척 및 살균:</strong> ${rawCln}</div>`;
    }
    if (manufacturingProcess.criticalControlPoint) {
      let rawCcp = simplifyTechnicalTerms(manufacturingProcess.criticalControlPoint);
      consumerHtml += `<div>• <strong>중요 관리점 (CCP 모니터링):</strong> ${rawCcp}</div>`;
    }
    consumerHtml += `</div></div>`;
  }

  // 5. Lot History Card
  if (settings.includeLotHistory && !lotHistory.skipped) {
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">5. 동일 제조번호(Lot: ${productInfo.lotNumber || "-"}) 품질 검사 이력</h4>`;
    consumerHtml += `<div style="font-size: 12px; color: #334155; line-height: 1.6;">`;
    consumerHtml += `<div style="margin-bottom: 4px;">• <strong>동일 날짜 생산 당사 공장 보관품 점검:</strong> <span style="font-weight:bold; color:#1d4ed8;">${retainedInfo.displayText}</span></div>`;
    if (lotHistory.productionLogNote) {
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>제조일 생산일지 점검:</strong> ${lotHistory.productionLogNote}</div>`;
    }
    if (lotHistory.qualityTestRecord) {
      consumerHtml += `<div style="margin-bottom: 4px;">• <strong>완제품 품질 성적서 (COA):</strong> ${lotHistory.qualityTestRecord}</div>`;
    }
    if (lotHistory.priorClaimsCount) {
      consumerHtml += `<div>• <strong>동일 Lot 이전 클레임 이력:</strong> ${lotHistory.priorClaimsCount}</div>`;
    }
    consumerHtml += `</div></div>`;
  }

  // 6. Root Cause & Preventive Measures Card
  if ((settings.includeRootCause && isRootCauseKnown) || (settings.includePreventive && !rootCauseAndActions.preventiveMeasuresSkipped && rootCauseAndActions.preventiveMeasures)) {
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">6. 종합 원인 판정 및 재발방지대책</h4>`;
    consumerHtml += `<div style="font-size: 12px; color: #334155; line-height: 1.6;">`;
    if (settings.includeRootCause && isRootCauseKnown) {
      let rawCause = simplifyTechnicalTerms(rootCauseRaw);
      consumerHtml += `<div style="margin-bottom: 8px;"><strong>[가. 종합 원인 판정]</strong><br/>${rawCause.replace(/\n/g, "<br/>")}</div>`;
    }
    if (settings.includePreventive && !rootCauseAndActions.preventiveMeasuresSkipped && rootCauseAndActions.preventiveMeasures) {
      let rawPrev = simplifyTechnicalTerms(rootCauseAndActions.preventiveMeasures);
      consumerHtml += `<div><strong>[나. 재발방지대책 및 조치사항]</strong><br/>${rawPrev.replace(/\n/g, "<br/>")}</div>`;
    }
    consumerHtml += `</div></div>`;
  }

  // 7. Conclusion Points Card
  if (conclusion.summaryPoints && conclusion.summaryPoints.length > 0) {
    consumerHtml += `<div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #ffffff;">`;
    consumerHtml += `<h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">7. 조사 결론 요약</h4>`;
    consumerHtml += `<ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.65;">`;
    conclusion.summaryPoints.forEach((pt) => {
      consumerHtml += `<li style="margin-bottom: 3px;">${pt}</li>`;
    });
    consumerHtml += `</ol></div>`;
  }

  // Apology Card
  consumerHtml += `<div style="margin-top: 16px; font-size: 12px; line-height: 1.7; color: #1e293b; background-color: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">`;
  consumerHtml += `<strong>[고객 사과 및 안내]</strong><br/>`;
  consumerHtml += rawApology.replace(/\n/g, "<br/>");
  consumerHtml += `</div>`;

  consumerHtml += `<div style="background: #f8fafc; padding: 8px 12px; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 11.5px; color: #475569; margin-top: 14px;">`;
  consumerHtml += `📎 <strong>첨부파일:</strong> ${productInfo.productName || "제품"}_원인조사보고서(식품품질경영팀).pdf (식품품질경영팀장 최종 승인 공문서)`;
  consumerHtml += `</div>`;

  consumerHtml += `<div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">`;
  consumerHtml += `<p style="margin: 0; font-weight: bold; font-size: 13px; color: #0f172a;">${companyName} 식품품질경영팀</p>`;
  consumerHtml += `<p style="margin: 2px 0 0 0;">${researcher} (문의: ${companyTel})</p>`;
  consumerHtml += `</div>`;
  consumerHtml += `</div>`;

  return {
    internal: {
      plainText: internalPlain,
      htmlText: internalHtml,
      subject: internalSubject,
      summaryCount: {
        technicalItems: internalTechnicalCount,
        processItems: internalProcessCount,
      },
    },
    consumer: {
      plainText: consumerPlain,
      htmlText: consumerHtml,
      subject: consumerSubject,
      violationsBlocked: Array.from(new Set(violationsBlocked)),
      simplifiedTermsApplied: settings.useSimplifiedTerms,
      omittedInternalItems,
    },
  };
}
