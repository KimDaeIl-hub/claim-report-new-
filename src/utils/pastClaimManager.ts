import { ReportData } from "../types";
import { getSavedReports } from "../components/ReportListDrawer";
import { CLAIM_PRESETS, INITIAL_REPORT_DATA } from "../data/presets";
import { mergePresetData } from "./storage";

export interface PastClaimSearchFilters {
  productName: string;      // 제품명
  claimType: string;        // 클레임 유형
  lotNumber: string;        // 제조번호
  manufactureLine: string;  // 제조라인
  receivedDate: string;     // 접수일
  researcher: string;       // 조사자
  keyword: string;          // 키워드
}

export interface PastClaimItem {
  id: string;
  report: ReportData;
  receivedAt: string;
  productName: string;
  claimType: string;
  lotNumber: string;
  manufactureLine: string;
  researcherName: string;
  claimDetailsSnippet: string;
  investigationStatus: string;
}

/**
 * 보고서 데이터로부터 클레임 유형 라벨을 안정적으로 추출
 */
export function extractClaimTypeLabel(report: ReportData): string {
  const title = report.title || "";
  const details = report.customerClaim.claimDetails || "";
  const root = report.rootCauseAndActions.rootCause || "";
  const combined = `${title} ${details} ${root}`.toLowerCase();

  if (combined.includes("유리") || combined.includes("파손")) return "유리 파손 / 이물";
  if (combined.includes("캡") || combined.includes("스와빙") || combined.includes("오일")) return "캡 불량 / 오일 탄화";
  if (combined.includes("침전") || combined.includes("혼탁") || combined.includes("결정")) return "침전물 / 혼탁";
  if (combined.includes("곰팡이") || combined.includes("변질") || combined.includes("부패") || combined.includes("핀홀")) return "변질 / 곰팡이";
  if (combined.includes("캔") || combined.includes("찌그러짐") || combined.includes("시밍")) return "캔 파손 / 시밍 불량";
  if (combined.includes("파우치") || combined.includes("실링") || combined.includes("누액")) return "파우치 실링 / 누액";
  if (combined.includes("탄산") || combined.includes("가스") || combined.includes("팽창")) return "탄산 압력 / 팽창";
  if (combined.includes("이취") || combined.includes("맛") || combined.includes("산패")) return "맛 / 이취 이상";
  if (combined.includes("벌레") || combined.includes("곤충")) return "생물 / 벌레 이물";
  if (combined.includes("금속") || combined.includes("쇳가루")) return "금속성 이물";
  if (combined.includes("플라스틱")) return "플라스틱 이물";

  return "일반 품질 클레임";
}

/**
 * 보고서 데이터로부터 조사 완료 상태 라벨을 추출
 */
export function extractInvestigationStatus(report: ReportData): string {
  if (report.rootCauseAndActions.rootCause && report.conclusion.summaryPoints?.length) {
    if (report.rootCauseAndActions.rootCause.includes("유통") || report.rootCauseAndActions.rootCause.includes("외력")) {
      return "외력 요인 종결";
    }
    if (report.rootCauseAndActions.rootCause.includes("공급사") || report.rootCauseAndActions.rootCause.includes("원자재")) {
      return "공급사 불량 판정";
    }
    if (report.rootCauseAndActions.rootCause.includes("자연") || report.rootCauseAndActions.rootCause.includes("원료 성분")) {
      return "원료 특성 규명";
    }
    return "원인 규명 완료";
  }
  return "조사 완료";
}

/**
 * 보관함에 저장된 보고서 및 표준 프리셋 데이터를 융합하여
 * 과거 클레임 검색 대상 목록을 풍부하게 생성합니다.
 */
export function loadAllHistoricalClaims(): PastClaimItem[] {
  const items: PastClaimItem[] = [];
  const seenIds = new Set<string>();

  // 1. 사용자 보관함에 저장된 실제 보고서 불러오기
  const savedReports = getSavedReports();
  for (const rep of savedReports) {
    if (rep && rep.id && !seenIds.has(rep.id)) {
      seenIds.add(rep.id);
      items.push({
        id: rep.id,
        report: rep,
        receivedAt: rep.customerClaim?.receivedAt || rep.issueDate || "2026-06-20",
        productName: rep.productInfo?.productName || "광동제약 제품",
        claimType: extractClaimTypeLabel(rep),
        lotNumber: rep.productInfo?.lotNumber || "LOT-미기재",
        manufactureLine: rep.productInfo?.manufacturer || "광동제약 평택공장",
        researcherName: rep.researcherName || "식품품질경영팀",
        claimDetailsSnippet: (rep.customerClaim?.claimDetails || "").slice(0, 120),
        investigationStatus: extractInvestigationStatus(rep),
      });
    }
  }

  // 2. 표준 과거 클레임 프리셋 데이터를 완전한 ReportData로 병합하여 등록
  for (const preset of CLAIM_PRESETS) {
    const virtualId = `hist-${preset.id}`;
    if (!seenIds.has(virtualId)) {
      seenIds.add(virtualId);
      const fullReport = mergePresetData(INITIAL_REPORT_DATA, preset.data);
      // 고유 ID 및 접수일자 등 보존
      fullReport.id = virtualId;
      fullReport.title = preset.data.title || preset.name;

      items.push({
        id: virtualId,
        report: fullReport,
        receivedAt: fullReport.customerClaim?.receivedAt || "2026-06-15",
        productName: fullReport.productInfo?.productName || "광동 음료 제품",
        claimType: extractClaimTypeLabel(fullReport),
        lotNumber: fullReport.productInfo?.lotNumber || "LOT-26E10-F1",
        manufactureLine: fullReport.productInfo?.manufacturer || "평택공장 생산라인",
        researcherName: fullReport.researcherName || "김진영 대리",
        claimDetailsSnippet: (fullReport.customerClaim?.claimDetails || "").slice(0, 120),
        investigationStatus: extractInvestigationStatus(fullReport),
      });
    }
  }

  // 접수일 기준 최신순 정렬
  return items.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/**
 * 다중 검색 조건에 따른 과거 클레임 필터링
 * "모든 조건을 입력할 필요는 없다." 규칙 준수
 */
export function filterPastClaims(
  claims: PastClaimItem[],
  filters: PastClaimSearchFilters
): PastClaimItem[] {
  return claims.filter((item) => {
    // 1. 제품명
    if (filters.productName.trim()) {
      const q = filters.productName.trim().toLowerCase();
      if (!item.productName.toLowerCase().includes(q)) return false;
    }

    // 2. 클레임 유형
    if (filters.claimType.trim() && filters.claimType !== "전체") {
      const q = filters.claimType.trim().toLowerCase();
      if (!item.claimType.toLowerCase().includes(q)) return false;
    }

    // 3. 제조번호
    if (filters.lotNumber.trim()) {
      const q = filters.lotNumber.trim().toLowerCase();
      if (!item.lotNumber.toLowerCase().includes(q)) return false;
    }

    // 4. 제조라인
    if (filters.manufactureLine.trim()) {
      const q = filters.manufactureLine.trim().toLowerCase();
      if (!item.manufactureLine.toLowerCase().includes(q)) return false;
    }

    // 5. 접수일 (YYYY-MM 또는 YYYY-MM-DD 접두사 매칭)
    if (filters.receivedDate.trim()) {
      const q = filters.receivedDate.trim();
      if (!item.receivedAt.startsWith(q)) return false;
    }

    // 6. 조사자
    if (filters.researcher.trim()) {
      const q = filters.researcher.trim().toLowerCase();
      if (!item.researcherName.toLowerCase().includes(q)) return false;
    }

    // 7. 통합 키워드 (제목, 클레임내용, 원인, 조치, 결과 등 포괄 검색)
    if (filters.keyword.trim()) {
      const q = filters.keyword.trim().toLowerCase();
      const rep = item.report;
      const haystack = [
        item.productName,
        item.lotNumber,
        item.claimType,
        item.manufactureLine,
        item.researcherName,
        rep.title,
        rep.docNumber,
        rep.customerClaim.claimDetails,
        rep.customerClaim.customerName,
        rep.rootCauseAndActions.rootCause,
        rep.rootCauseAndActions.preventiveMeasures,
        ...(rep.conclusion.summaryPoints || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export interface ClaimCopyOptions {
  // 1. 기본정보 (Default: true)
  basicInfo: {
    productName: boolean;      // 제품명
    packageType: boolean;      // 제품 유형
    claimType: boolean;        // 클레임 유형
    manufactureLine: boolean;  // 제조라인
  };

  // 2. 조사 Template (Default: true)
  investigationTemplate: {
    investigationItems: boolean;      // 조사 항목
    investigationMethods: boolean;    // 조사 방법
    standardPhrases: boolean;         // 표준 조사문장
    processBasicDescription: boolean; // 제조공정 기본 설명
  };

  // 3. 과거 조사결과 (Default: false)
  investigationResults: {
    visualAndInstrumentAnalysis: boolean; // 현품 분석 결과
    retainedSampleResult: boolean;        // 보관품 조사 결과
    manufacturingRecordResult: boolean;   // 제조기록 조사 결과
    qualityInspectionResult: boolean;     // 품질검사 결과
    processInvestigationResult: boolean;  // 제조공정 조사 결과
    materialInvestigationResult: boolean; // 원부자재 조사 결과
    rootCause: boolean;                   // 원인판정
    conclusion: boolean;                  // 최종결론
  };

  // 4. 첨부자료 (Default: false)
  attachments: {
    photos: boolean;  // 사진
    files: boolean;   // 첨부파일
  };
}

export const DEFAULT_CLAIM_COPY_OPTIONS: ClaimCopyOptions = {
  basicInfo: {
    productName: true,
    packageType: true,
    claimType: true,
    manufactureLine: true,
  },
  investigationTemplate: {
    investigationItems: true,
    investigationMethods: true,
    standardPhrases: true,
    processBasicDescription: true,
  },
  investigationResults: {
    visualAndInstrumentAnalysis: false,
    retainedSampleResult: false,
    manufacturingRecordResult: false,
    qualityInspectionResult: false,
    processInvestigationResult: false,
    materialInvestigationResult: false,
    rootCause: false,
    conclusion: false,
  },
  attachments: {
    photos: false,
    files: false,
  },
};

/**
 * 과거 클레임으로부터 조사 구조, 템플릿, 제품정보, 표준 문장을 계승하여
 * 완전히 새로운 클레임 보고서 데이터를 생성합니다.
 *
 * [중요 원칙]:
 * 1. 기존 클레임 ID를 절대 재사용하지 않고 새 ID 생성
 * 2. 원본 클레임 데이터를 일체 변경하지 않음
 * 3. 사용자 선택 옵션(ClaimCopyOptions)에 따라 선택된 정보만 선택적으로 복사
 * 4. 과거 실제 조사결과/첨부파일은 안전을 위해 기본 OFF
 * 5. copiedFromClaimId를 통해 내부적으로 복사 출처 추적
 */
export function createCopiedClaimReport(
  sourceReport: ReportData,
  options: ClaimCopyOptions = DEFAULT_CLAIM_COPY_OPTIONS
): ReportData {
  const newId = `clm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const currentYear = new Date().getFullYear();
  const randomSeq = String(Math.floor(Math.random() * 899) + 100);
  const newDocNumber = `광동 QM ${currentYear}-C${randomSeq}`;
  const todayStr = new Date().toISOString().split("T")[0];

  const originalRefId = sourceReport.docNumber?.trim() || sourceReport.id;

  const copiedReport: ReportData = {
    // 1. 고유 메타데이터 (신규 발급)
    id: newId,
    title: options.basicInfo.claimType
      ? sourceReport.title || "고객 불만 접수 조사 결과 보고서"
      : "고객 불만 접수 조사 결과 보고서",
    docNumber: newDocNumber,
    issueDate: todayStr,
    companyName: sourceReport.companyName || "광동제약주식회사",
    companyLogoUrl: sourceReport.companyLogoUrl,
    companyAddress: sourceReport.companyAddress,
    companyTel: sourceReport.companyTel,
    companyFax: sourceReport.companyFax,
    researcherName: sourceReport.researcherName || "식품품질경영팀 연구원",
    department: "식품품질경영팀",
    teamLeader: sourceReport.teamLeader || "품질보증부문장",
    sealType: sourceReport.sealType || "seal",
    greetingIntro: sourceReport.greetingIntro,

    // 2. 고객 및 클레임 접수 정보 (반드시 초기화)
    customerClaim: {
      receivedAt: todayStr,
      sampleReceivedDate: "",
      customerName: "",
      maskCustomerName: sourceReport.customerClaim?.maskCustomerName ?? false,
      contact: "",
      channel: sourceReport.customerClaim?.channel || "고객만족팀 VOC",
      claimDetails: "",
      customerPhotos: options.attachments.photos
        ? [...(sourceReport.customerClaim?.customerPhotos || [])]
        : [],
    },

    // 3. 접수 제품 정보 (선택 옵션 반영, 제조번호·일자는 반드시 초기화)
    productInfo: {
      productName: options.basicInfo.productName ? sourceReport.productInfo?.productName || "" : "",
      lotNumber: "",
      manufactureDate: "",
      expiryDate: "",
      manufacturer: options.basicInfo.manufactureLine
        ? sourceReport.productInfo?.manufacturer || "광동제약 평택공장"
        : "광동제약 평택공장",
      packageType: options.basicInfo.packageType
        ? sourceReport.productInfo?.packageType || "유리병 (100ml)"
        : "유리병 (100ml)",
      manufacturerType: options.basicInfo.manufactureLine
        ? sourceReport.productInfo?.manufacturerType || "internal"
        : "internal",
      factoryId: options.basicInfo.manufactureLine ? sourceReport.productInfo?.factoryId : undefined,
    },

    // 4. 정밀 분석 결과
    analysisResults: {
      visualInspection: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.visualInspection?.skipped ?? false
          : false,
        sampleCondition: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.visualInspection?.sampleCondition || ""
          : "",
        foreignObjectAppearance: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.visualInspection?.foreignObjectAppearance || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.visualInspection?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.visualInspection?.principleText || ""
          : "",
      },
      magnifierInspection: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.magnifierInspection?.skipped ?? false
          : false,
        magnification: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.magnifierInspection?.magnification || "40x ~ 100x"
          : "40x ~ 100x",
        result: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.magnifierInspection?.result || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.magnifierInspection?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.magnifierInspection?.principleText || ""
          : "",
      },
      opticalMicroscope: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.opticalMicroscope?.skipped ?? false
          : false,
        magnification: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.opticalMicroscope?.magnification || "100x ~ 400x"
          : "100x ~ 400x",
        result: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.opticalMicroscope?.result || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.opticalMicroscope?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.opticalMicroscope?.principleText || ""
          : "",
      },
      ftirAnalysis: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.ftirAnalysis?.skipped ?? false
          : false,
        summary: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.ftirAnalysis?.summary || ""
          : "",
        matchedMaterial: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.ftirAnalysis?.matchedMaterial || ""
          : "",
        similarity: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.ftirAnalysis?.similarity || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.ftirAnalysis?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.ftirAnalysis?.principleText || ""
          : "",
      },
      xrfAnalysis: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.xrfAnalysis?.skipped ?? false
          : false,
        elementsRatio: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.xrfAnalysis?.elementsRatio || ""
          : "",
        summary: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.xrfAnalysis?.summary || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.xrfAnalysis?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.xrfAnalysis?.principleText || ""
          : "",
      },
      physicochemicalAnalysis: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.physicochemicalAnalysis?.skipped ?? false
          : false,
        testDate: todayStr,
        sampleClass: sourceReport.analysisResults?.physicochemicalAnalysis?.sampleClass || "",
        items: (sourceReport.analysisResults?.physicochemicalAnalysis?.items || []).map((item) => ({
          ...item,
          testDate: todayStr,
          controlValue: options.investigationResults.visualAndInstrumentAnalysis
            ? item.controlValue || ""
            : "",
          sampleValue: options.investigationResults.visualAndInstrumentAnalysis
            ? item.sampleValue || ""
            : "",
          judgment: options.investigationResults.visualAndInstrumentAnalysis
            ? item.judgment
            : "해당없음",
          remarks: options.investigationResults.visualAndInstrumentAnalysis ? item.remarks || "" : "",
        })),
        summary: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.physicochemicalAnalysis?.summary || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.physicochemicalAnalysis?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.physicochemicalAnalysis?.principleText || ""
          : "",
      },
      catalaseTest: {
        skipped: options.investigationTemplate.investigationItems
          ? sourceReport.analysisResults?.catalaseTest?.skipped ?? false
          : false,
        resultJudgement: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.catalaseTest?.resultJudgement || ""
          : "",
        reactionDetail: options.investigationResults.visualAndInstrumentAnalysis
          ? sourceReport.analysisResults?.catalaseTest?.reactionDetail || ""
          : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.catalaseTest?.includePrinciple ?? false
          : false,
        principleText: options.investigationTemplate.investigationMethods
          ? sourceReport.analysisResults?.catalaseTest?.principleText || ""
          : "",
      },
      additionalTests: (sourceReport.analysisResults?.additionalTests || []).map((t) => ({
        ...t,
        result: options.investigationResults.visualAndInstrumentAnalysis ? t.result || "" : "",
        includePrinciple: options.investigationTemplate.investigationMethods
          ? t.includePrinciple
          : false,
        principleText: options.investigationTemplate.investigationMethods ? t.principleText : "",
      })),
    },

    // 5. 제조공정 분석
    manufacturingProcess: {
      skipped: options.investigationTemplate.investigationItems
        ? sourceReport.manufacturingProcess?.skipped ?? false
        : false,
      processFlow: options.investigationTemplate.processBasicDescription
        ? sourceReport.manufacturingProcess?.processFlow || ""
        : "",
      processSteps: options.investigationTemplate.processBasicDescription
        ? [...(sourceReport.manufacturingProcess?.processSteps || [])]
        : [],
      filtrationAnalysis: options.investigationTemplate.standardPhrases
        ? sourceReport.manufacturingProcess?.filtrationAnalysis || ""
        : "",
      cleaningAnalysis: options.investigationTemplate.standardPhrases
        ? sourceReport.manufacturingProcess?.cleaningAnalysis || ""
        : "",
      criticalControlPoint: options.investigationTemplate.processBasicDescription
        ? sourceReport.manufacturingProcess?.criticalControlPoint || ""
        : "",
      highlightedStep: options.investigationTemplate.processBasicDescription
        ? sourceReport.manufacturingProcess?.highlightedStep || ""
        : "",
      processInvestigationResult: options.investigationResults.processInvestigationResult
        ? sourceReport.manufacturingProcess?.processInvestigationResult || ""
        : "",
      processInvestigationNote: options.investigationResults.processInvestigationResult
        ? sourceReport.manufacturingProcess?.processInvestigationNote || ""
        : "",
    },

    // 6. 동일 Lot 제조 및 품질검사 이력
    lotHistory: {
      skipped: options.investigationTemplate.investigationItems
        ? sourceReport.lotHistory?.skipped ?? false
        : false,
      productionLogNote: options.investigationResults.manufacturingRecordResult
        ? sourceReport.lotHistory?.productionLogNote || ""
        : "",
      qualityTestRecord: options.investigationResults.qualityInspectionResult
        ? sourceReport.lotHistory?.qualityTestRecord || ""
        : "",
      priorClaimsCount: "0건",
      retainedSampleCheck: options.investigationResults.retainedSampleResult
        ? sourceReport.lotHistory?.retainedSampleCheck || ""
        : "",
      rawMaterialCheck: options.investigationResults.materialInvestigationResult
        ? sourceReport.lotHistory?.rawMaterialCheck || ""
        : "",
      retainedSamplePhotos: options.attachments.photos
        ? [...(sourceReport.lotHistory?.retainedSamplePhotos || [])]
        : [],
      manufacturingRecordResult: options.investigationResults.manufacturingRecordResult
        ? sourceReport.lotHistory?.manufacturingRecordResult || ""
        : "",
      storageSampleResult: options.investigationResults.retainedSampleResult
        ? sourceReport.lotHistory?.storageSampleResult || ""
        : "",
      qualityInspectionResult: options.investigationResults.qualityInspectionResult
        ? sourceReport.lotHistory?.qualityInspectionResult || ""
        : "",
      materialInvestigationResult: options.investigationResults.materialInvestigationResult
        ? sourceReport.lotHistory?.materialInvestigationResult || ""
        : "",
    },

    // 7. 원인 분석 및 재발방지대책
    rootCauseAndActions: {
      skipped: false,
      rootCause: options.investigationResults.rootCause
        ? sourceReport.rootCauseAndActions?.rootCause || ""
        : "",
      preventiveMeasuresSkipped: false,
      preventiveMeasures: options.investigationResults.rootCause
        ? sourceReport.rootCauseAndActions?.preventiveMeasures || ""
        : "",
    },

    // 8. 결론 및 맺음말
    conclusion: {
      summaryPoints: options.investigationResults.conclusion
        ? [...(sourceReport.conclusion?.summaryPoints || [])]
        : [],
      apologyText: options.investigationResults.conclusion
        ? sourceReport.conclusion?.apologyText || ""
        : "",
      closingRemarks: options.investigationResults.conclusion
        ? sourceReport.conclusion?.closingRemarks || ""
        : "광동제약은 고객 만족과 최고 품질의 제품 공급을 위해 철저한 공정 관리와 위생 검사를 지속하고 있습니다.",
    },

    // 9. 첨부 사진 및 파일
    attachments: {
      attachment1Title: options.attachments.files
        ? sourceReport.attachments?.attachment1Title || "[첨부 1] 외관 및 이물 확대 사진"
        : "[첨부 1] 외관 및 이물 확대 사진",
      attachment1Photos: options.attachments.photos
        ? [...(sourceReport.attachments?.attachment1Photos || [])]
        : [],
      attachment2Title: options.attachments.files
        ? sourceReport.attachments?.attachment2Title || "[첨부 2] 동일 Lot 공장 보관품 사진"
        : "[첨부 2] 동일 Lot 공장 보관품 사진",
      attachment2Photos: options.attachments.photos
        ? [...(sourceReport.attachments?.attachment2Photos || [])]
        : [],
      attachment3Title: options.attachments.files
        ? sourceReport.attachments?.attachment3Title || "[첨부 3] 주요 제조공정 사진 그리드"
        : "[첨부 3] 주요 제조공정 사진 그리드",
      attachment3Photos: options.attachments.photos
        ? [...(sourceReport.attachments?.attachment3Photos || [])]
        : [],
    },

    // 10. 조사 항목 선택 구조 복사
    investigationSelections: options.investigationTemplate.investigationItems
      ? sourceReport.investigationSelections
        ? { ...sourceReport.investigationSelections }
        : undefined
      : undefined,
    investigationDetails: undefined,

    // 11. 복사 이력 추적 필드 (소비자용 보고서 미노출, 내부 관리용)
    copiedFromClaimId: originalRefId,
    copiedFromDocNumber: sourceReport.docNumber || originalRefId,
  };

  return copiedReport;
}
