import { ReportData, PhysicochemicalItem, AdditionalTestItem } from "../types";
import { DEFAULT_STANDARD_PHRASES } from "../data/standardPhrases";

/**
 * 조사 구조 통계 정보
 */
export interface InvestigationStructureStats {
  investigationItemsCount: number;
  investigationItemsList: string[];
  investigationMethodsCount: number;
  investigationMethodsList: string[];
  relatedProcessesCount: number;
  relatedProcessesList: string[];
  connectedPhrasesCount: number;
  connectedPhrasesList: string[];
  excludedItems: string[];
}

/**
 * 과거 보고서로부터 적용될 조사 구조 통계 및 상세 항목 분석
 */
export function getInvestigationStructureStats(
  pastReport: ReportData
): InvestigationStructureStats {
  const itemsList: string[] = [];
  const methodsList: string[] = [];
  const processesList: string[] = [];

  const analysis = pastReport.analysisResults;

  // 1. 조사 항목 (Analysis Items)
  if (!analysis.visualInspection?.skipped) {
    itemsList.push("현품 외관 및 이물 정밀 육안 검사");
    methodsList.push("D65 표준 광원 육안 감식법");
  }
  if (!analysis.magnifierInspection?.skipped) {
    itemsList.push(`정밀 확대경 검사 (${analysis.magnifierInspection?.magnification || "30x"})`);
    methodsList.push("파선 및 타격점(Hitted mark) 표면 분석법");
  }
  if (!analysis.opticalMicroscope?.skipped) {
    itemsList.push(`광학 현미경 검사 (${analysis.opticalMicroscope?.magnification || "100x"})`);
    methodsList.push("생체 유래물/세포 조직 고배율 확대경 검사법");
  }
  if (!analysis.ftirAnalysis?.skipped) {
    itemsList.push("FT-IR 적외선 분광 광도 분석");
    methodsList.push("ATR 적외선 흡수 스펙트럼 라이브러리 대조법");
  }
  if (!analysis.xrfAnalysis?.skipped) {
    itemsList.push("XRF 형광 X선 원소 분석");
    methodsList.push("에너지 분산형 X선 원소 스펙트럼 분석법");
  }
  if (!analysis.physicochemicalAnalysis?.skipped) {
    const pItems = analysis.physicochemicalAnalysis?.items || [];
    if (pItems.length > 0) {
      itemsList.push(`이화학 분석 (${pItems.map((p) => p.name).join(", ")})`);
    } else {
      itemsList.push("이화학 규격 분석 (pH, Brix 등)");
    }
    methodsList.push("공정 규격 기준 이화학 정밀 측정법");
  }
  if (!analysis.catalaseTest?.skipped) {
    itemsList.push("카탈라아제 효소 활성 반응 시험");
    methodsList.push("3% H2O2 유기 효소 거품 반응 분석법");
  }
  if (analysis.additionalTests && analysis.additionalTests.length > 0) {
    analysis.additionalTests
      .filter((t) => !t.skipped)
      .forEach((t) => {
        itemsList.push(t.title);
        if (t.includePrinciple && t.principleText) {
          methodsList.push(`${t.title} 원리 및 시험법`);
        }
      });
  }

  // 보관품 및 제조기록 점검 항목
  if (!pastReport.lotHistory?.skipped) {
    itemsList.push("동일 로트 보관품 대조 검사");
    itemsList.push("배치 제조기록서 및 SOP 점검");
    itemsList.push("완제품 CoA 품질 검사 성적서 점검");
  }

  // 2. 관련 공정 (Related Process)
  const mfg = pastReport.manufacturingProcess;
  if (mfg && !mfg.skipped) {
    if (mfg.processSteps && mfg.processSteps.length > 0) {
      mfg.processSteps.forEach((s) => processesList.push(s));
    } else if (mfg.processFlow) {
      mfg.processFlow.split("→").forEach((s) => {
        const tr = s.trim();
        if (tr) processesList.push(tr);
      });
    }
    if (mfg.highlightedStep && !processesList.includes(mfg.highlightedStep)) {
      processesList.unshift(`중점 관리: ${mfg.highlightedStep}`);
    }
    if (mfg.filtrationAnalysis) {
      processesList.push("여과망(Mesh) 규격 및 통과 기준 관리");
    }
    if (mfg.cleaningAnalysis) {
      processesList.push("용기/캡 온수 린싱 및 세척·살균 관리");
    }
  }

  // 3. 관련 상용구 연결 (Connected Standard Phrases)
  const claimType = pastReport.customerClaim?.claimType || "이물";
  const matchedPhrases = DEFAULT_STANDARD_PHRASES.filter(
    (p) =>
      p.isActive &&
      (p.claimType === "공통" || p.claimType === claimType || (p.claimType && claimType.includes(p.claimType)))
  );

  const connectedPhrasesList = matchedPhrases.slice(0, 8).map((p) => p.title);

  // 4. 적용되지 않는 항목 (Excluded Items)
  const excludedItems = [
    "과거 실제 조사결과 (측정치, 관측 성상, 수치)",
    "과거 추정 원인 (원인 분석 텍스트)",
    "과거 최종 결론 (조치계획, 고객 회신문)",
    "과거 소비자 개인정보 (성함, 연락처, 구매처)",
    "과거 제조번호 및 생산일자 (현재 클레임 정보 유지)",
    "과거 사진 및 첨부파일 (현재 보고서 사진 유지)",
  ];

  return {
    investigationItemsCount: itemsList.length,
    investigationItemsList: itemsList,
    investigationMethodsCount: methodsList.length,
    investigationMethodsList: methodsList,
    relatedProcessesCount: processesList.length,
    relatedProcessesList: processesList,
    connectedPhrasesCount: matchedPhrases.length || 6,
    connectedPhrasesList,
    excludedItems,
  };
}

/**
 * 과거 사례의 조사 구조만 현재 보고서에 적용
 * (결과, 원인, 결론, 소비자 정보, 로트 번호, 사진은 일체 복사하지 않고 구조와 시험 항목만 복사)
 */
export function applyInvestigationStructureToReport(
  currentReport: ReportData,
  pastReport: ReportData
): ReportData {
  // 깊은 복사
  const next: ReportData = JSON.parse(JSON.stringify(currentReport));
  const pastAnalysis = pastReport.analysisResults;
  const pastMfg = pastReport.manufacturingProcess;
  const pastLot = pastReport.lotHistory;

  // =========================================================================
  // [1] 조사 항목 구성 및 방법 적용 (과학 정밀 분석)
  // * 원칙: 항목 활성화 여부(skipped), 시험 원리(includePrinciple, principleText),
  //         시험 규격 및 배율만 복사하고 '결과 텍스트'와 '상태'는 신규 조사 상태로 리셋.
  // =========================================================================

  // 1-1. 육안 검사
  next.analysisResults.visualInspection = {
    ...next.analysisResults.visualInspection,
    skipped: pastAnalysis.visualInspection?.skipped ?? false,
    includePrinciple: pastAnalysis.visualInspection?.includePrinciple ?? true,
    principleText:
      pastAnalysis.visualInspection?.principleText ||
      next.analysisResults.visualInspection.principleText ||
      "공인 표준 광원(D65 기준) 하에서 시료의 외형 성상, 잔여량, 캡 실링 상태 및 이물의 형태적 특성을 정밀 육안 검사합니다.",
    // 결과 및 상태는 리셋
    sampleCondition:
      next.analysisResults.visualInspection.sampleCondition ||
      "소비자 제공 회수 현품 입고 완료. 포장 밀봉 상태 및 내용물 검증 진행.",
    foreignObjectAppearance:
      next.analysisResults.visualInspection.foreignObjectAppearance ||
      `접수 클레임 내용: ${currentReport.customerClaim.claimDetails || "현품 이물/이상 유무 정밀 분석 대기"}`,
    status: "미실시",
  };

  // 1-2. 정밀 확대경 검사
  next.analysisResults.magnifierInspection = {
    ...next.analysisResults.magnifierInspection,
    skipped: pastAnalysis.magnifierInspection?.skipped ?? true,
    magnification: pastAnalysis.magnifierInspection?.magnification || "30x",
    includePrinciple: pastAnalysis.magnifierInspection?.includePrinciple ?? false,
    principleText:
      pastAnalysis.magnifierInspection?.principleText ||
      next.analysisResults.magnifierInspection.principleText,
    result: "", // 과거 결과 미복사
    status: "미실시",
  };

  // 1-3. 광학 현미경 검사
  next.analysisResults.opticalMicroscope = {
    ...next.analysisResults.opticalMicroscope,
    skipped: pastAnalysis.opticalMicroscope?.skipped ?? true,
    magnification: pastAnalysis.opticalMicroscope?.magnification || "100x",
    includePrinciple: pastAnalysis.opticalMicroscope?.includePrinciple ?? false,
    principleText:
      pastAnalysis.opticalMicroscope?.principleText ||
      next.analysisResults.opticalMicroscope.principleText,
    result: "", // 과거 결과 미복사
    status: "미실시",
  };

  // 1-4. FT-IR 적외선 분광 광도 분석
  next.analysisResults.ftirAnalysis = {
    ...next.analysisResults.ftirAnalysis,
    skipped: pastAnalysis.ftirAnalysis?.skipped ?? true,
    includePrinciple: pastAnalysis.ftirAnalysis?.includePrinciple ?? false,
    principleText:
      pastAnalysis.ftirAnalysis?.principleText ||
      next.analysisResults.ftirAnalysis.principleText,
    // 과거 스펙트럼 분석결과 미복사
    summary: "",
    matchedMaterial: "",
    similarity: "",
    status: "미실시",
  };

  // 1-5. XRF 원소 분석
  next.analysisResults.xrfAnalysis = {
    ...next.analysisResults.xrfAnalysis,
    skipped: pastAnalysis.xrfAnalysis?.skipped ?? true,
    includePrinciple: pastAnalysis.xrfAnalysis?.includePrinciple ?? false,
    principleText:
      pastAnalysis.xrfAnalysis?.principleText ||
      next.analysisResults.xrfAnalysis.principleText,
    elementsRatio: "",
    summary: "",
    status: "미실시",
  };

  // 1-6. 이화학 분석 (항목 구조와 기준치만 복사, 측정치는 빈 값으로 새로 입력)
  if (!pastAnalysis.physicochemicalAnalysis?.skipped && pastAnalysis.physicochemicalAnalysis?.items) {
    const copiedStructureItems: PhysicochemicalItem[] = pastAnalysis.physicochemicalAnalysis.items.map(
      (item, idx) => ({
        id: `pc-item-${Date.now()}-${idx}`,
        name: item.name,
        unit: item.unit,
        standard: item.standard, // 기준치는 구조로서 복사
        controlValue: "", // 측정치는 리셋
        sampleValue: "",  // 측정치는 리셋
        judgment: "해당없음", // 판정 리셋
        remarks: item.remarks ? `기준: ${item.standard}` : "",
      })
    );

    next.analysisResults.physicochemicalAnalysis = {
      ...next.analysisResults.physicochemicalAnalysis,
      skipped: false,
      sampleClass: pastAnalysis.physicochemicalAnalysis.sampleClass || "완제품 규격 시험",
      includePrinciple: pastAnalysis.physicochemicalAnalysis.includePrinciple ?? false,
      principleText: pastAnalysis.physicochemicalAnalysis.principleText || "",
      items: copiedStructureItems,
      summary: "", // 총평 리셋
    };
  } else {
    next.analysisResults.physicochemicalAnalysis = {
      ...next.analysisResults.physicochemicalAnalysis,
      skipped: pastAnalysis.physicochemicalAnalysis?.skipped ?? true,
      includePrinciple: pastAnalysis.physicochemicalAnalysis?.includePrinciple ?? false,
      principleText: pastAnalysis.physicochemicalAnalysis?.principleText || "",
    };
  }

  // 1-7. 카탈라아제 반응 시험
  next.analysisResults.catalaseTest = {
    ...next.analysisResults.catalaseTest,
    skipped: pastAnalysis.catalaseTest?.skipped ?? true,
    includePrinciple: pastAnalysis.catalaseTest?.includePrinciple ?? false,
    principleText: pastAnalysis.catalaseTest?.principleText || "",
    reactionDetail: "",
    resultJudgement: "",
    status: "미실시",
  };

  // 1-8. 추가 특수 분석 항목 (항목 구성과 원리만 복사, 결과는 빈 값)
  if (pastAnalysis.additionalTests && pastAnalysis.additionalTests.length > 0) {
    next.analysisResults.additionalTests = pastAnalysis.additionalTests.map((t, idx) => ({
      id: `add-test-${Date.now()}-${idx}`,
      title: t.title,
      result: "", // 결과 리셋
      includePrinciple: t.includePrinciple,
      principleText: t.principleText,
      skipped: t.skipped,
      status: "미실시",
    }));
  }

  // =========================================================================
  // [2] 관련 제조공정 구조 적용
  // * 복사: 공정 흐름도, 공정 단계, 중점 관리점, 여과 규격 기준, 세척 기준
  // * 미복사: 실제 공정 점검 결과/판정은 리셋
  // =========================================================================
  if (pastMfg) {
    next.manufacturingProcess = {
      ...next.manufacturingProcess,
      skipped: pastMfg.skipped ?? false,
      processFlow: pastMfg.processFlow || next.manufacturingProcess.processFlow,
      processSteps: pastMfg.processSteps && pastMfg.processSteps.length > 0
        ? [...pastMfg.processSteps]
        : next.manufacturingProcess.processSteps,
      highlightedStep: pastMfg.highlightedStep || next.manufacturingProcess.highlightedStep,
      criticalControlPoint: pastMfg.criticalControlPoint || next.manufacturingProcess.criticalControlPoint,
      filtrationAnalysis: pastMfg.filtrationAnalysis || next.manufacturingProcess.filtrationAnalysis,
      cleaningAnalysis: pastMfg.cleaningAnalysis || next.manufacturingProcess.cleaningAnalysis,
      // 공정 조사결과 텍스트 및 상태는 리셋 (새로 조사)
      processInvestigationResult: "no_issue",
      processInvestigationNote: "",
      filtrationStatus: "미실시",
      cleaningStatus: "미실시",
    };
  }

  // =========================================================================
  // [3] 동일 로트 및 보관품 이력 구조 적용
  // * 복사: 점검 섹션 활성화 여부
  // * 미복사: 보관품 확인 결과, 생산일지 확인 결과, 성적서 결과는 공란 처리
  // =========================================================================
  if (pastLot) {
    next.lotHistory = {
      ...next.lotHistory,
      skipped: pastLot.skipped ?? false,
      // 안내 문구만 초기화하고 결과 판정은 미실시
      retainedSampleCheck: "",
      productionLogNote: "",
      qualityTestRecord: "",
      rawMaterialCheck: "",
      retainedSampleStatus: "미실시",
      productionLogStatus: "미실시",
      qualityTestStatus: "미실시",
      rawMaterialStatus: "미실시",
      retainedSamplePhotos: [], // 과거 사진 미복사
      priorClaimsCount: "0건",
    };
  }

  // =========================================================================
  // [4] 과거 조사결과, 원인, 결론, 조치계획 일체 리셋 (복사 금지 원칙)
  // =========================================================================
  next.rootCauseAndActions = {
    ...next.rootCauseAndActions,
    rootCause: "",
    preventiveMeasures: "",
  };

  next.conclusion = {
    summaryPoints: [],
    apologyText: "",
    closingRemarks: "",
  };

  next.investigationResults = {
    manufacturingRecordResult: "no_issue",
    storageSampleResult: "normal",
    qualityInspectionResult: "pass",
    processInvestigationResult: "no_issue",
    materialInvestigationResult: "no_issue",
  };

  return next;
}

/**
 * 사례 스냅샷 정보
 */
export interface CaseSnapshot {
  product: string;
  line: string;
  claim: string;
  relatedProcess: string;
  manufacturer?: string;
}

/**
 * 차이점 또는 일치 항목
 */
export interface DifferenceItem {
  type: "warning" | "identical" | "unconfirmed";
  field: "product" | "line" | "claim" | "relatedProcess" | "manufacturer";
  fieldTitle: string;
  message: string;
  pastValue: string;
  currentValue: string;
}

/**
 * 과거 사례와 현재 사례의 비교 결과
 */
export interface CaseComparisonResult {
  pastCase: CaseSnapshot;
  currentCase: CaseSnapshot;
  differences: DifferenceItem[];
  identicalItems: DifferenceItem[];
  hasCriticalDifferences: boolean;
}

/**
 * 과거 사례와 현재 사례의 구조적 차이점 분석
 * (원인을 판단하지 않고 오직 정보 차이와 확인 필요 사항만 도출)
 */
export function comparePastAndCurrentClaim(
  pastReport: ReportData,
  currentReport?: ReportData | null,
  currentContext?: {
    productName?: string;
    manufactureLine?: string;
    claimMidCategory?: string;
    claimMajorCategory?: string;
    relatedProcess?: string;
    manufacturer?: string;
  } | null
): CaseComparisonResult {
  // 1. 과거 사례 스냅샷 추출
  const pastProd = (pastReport.productInfo?.productName || "제품 정보 없음").trim();
  const pastLine = (pastReport.productInfo?.manufactureLine || pastReport.productInfo?.manufacturer || "A Line").trim();
  const pastClaim = (
    pastReport.customerClaim?.claimType ||
    pastReport.customerClaim?.claimDetails?.slice(0, 20) ||
    "검은색 이물"
  ).trim();

  let pastProc = "충전";
  if (pastReport.manufacturingProcess?.highlightedStep) {
    pastProc = pastReport.manufacturingProcess.highlightedStep;
  } else if (
    pastReport.manufacturingProcess?.processSteps &&
    pastReport.manufacturingProcess.processSteps.length > 0
  ) {
    pastProc = pastReport.manufacturingProcess.processSteps[0];
  } else if (pastReport.manufacturingProcess?.processFlow) {
    const firstStep = pastReport.manufacturingProcess.processFlow.split("→")[0]?.trim();
    if (firstStep) pastProc = firstStep;
  }

  const pastCase: CaseSnapshot = {
    product: pastProd,
    line: pastLine,
    claim: pastClaim,
    relatedProcess: pastProc,
    manufacturer: pastReport.productInfo?.manufacturer,
  };

  // 2. 현재 사례 스냅샷 추출
  const curProdRaw = currentReport?.productInfo?.productName || currentContext?.productName || "";
  const curLineRaw = currentReport?.productInfo?.manufactureLine || currentContext?.manufactureLine || "";
  const curClaimRaw =
    currentReport?.customerClaim?.claimType ||
    currentContext?.claimMidCategory ||
    currentContext?.claimMajorCategory ||
    "";
  const curProcRaw =
    currentReport?.manufacturingProcess?.highlightedStep ||
    currentContext?.relatedProcess ||
    "";

  const curProd = curProdRaw.trim() || "미입력";
  const curLine = curLineRaw.trim() || "미지정";
  const curClaim = curClaimRaw.trim() || "미확인";
  const curProc = curProcRaw.trim() || "미확인";

  const currentCase: CaseSnapshot = {
    product: curProd,
    line: curLine,
    claim: curClaim,
    relatedProcess: curProc,
    manufacturer: currentReport?.productInfo?.manufacturer || currentContext?.manufacturer,
  };

  const differences: DifferenceItem[] = [];
  const identicalItems: DifferenceItem[] = [];

  const clean = (str: string) => str.toLowerCase().replace(/[\s\-_()]/g, "");

  // ==========================================
  // [차이 1] 제품 비교
  // ==========================================
  if (curProd === "미입력" || !curProdRaw) {
    differences.push({
      type: "unconfirmed",
      field: "product",
      fieldTitle: "제품",
      message: "현재 클레임의 제품명이 아직 입력되지 않았습니다.",
      pastValue: pastProd,
      currentValue: "미입력",
    });
  } else if (clean(curProd) === clean(pastProd) || curProd.includes(pastProd) || pastProd.includes(curProd)) {
    identicalItems.push({
      type: "identical",
      field: "product",
      fieldTitle: "제품",
      message: `제품 동일 (${curProd})`,
      pastValue: pastProd,
      currentValue: curProd,
    });
  } else {
    differences.push({
      type: "warning",
      field: "product",
      fieldTitle: "제품",
      message: "제품이 다릅니다.",
      pastValue: pastProd,
      currentValue: curProd,
    });
  }

  // ==========================================
  // [차이 2] 제조라인 비교
  // ==========================================
  if (curLine === "미지정" || curLine === "미확인" || !curLineRaw) {
    differences.push({
      type: "unconfirmed",
      field: "line",
      fieldTitle: "제조라인",
      message: "현재 클레임의 제조라인이 아직 지정되지 않았습니다.",
      pastValue: pastLine,
      currentValue: "미지정",
    });
  } else if (clean(curLine) === clean(pastLine) || curLine.includes(pastLine) || pastLine.includes(curLine)) {
    identicalItems.push({
      type: "identical",
      field: "line",
      fieldTitle: "제조라인",
      message: `제조라인 동일 (${curLine})`,
      pastValue: pastLine,
      currentValue: curLine,
    });
  } else {
    differences.push({
      type: "warning",
      field: "line",
      fieldTitle: "제조라인",
      message: "제조라인이 다릅니다.",
      pastValue: pastLine,
      currentValue: curLine,
    });
  }

  // ==========================================
  // [차이 3] 클레임 유형 비교
  // ==========================================
  if (curClaim === "미확인" || !curClaimRaw) {
    differences.push({
      type: "unconfirmed",
      field: "claim",
      fieldTitle: "클레임 유형",
      message: "현재 클레임의 유형이 아직 선택되지 않았습니다.",
      pastValue: pastClaim,
      currentValue: "미확인",
    });
  } else if (
    clean(curClaim) === clean(pastClaim) ||
    curClaim.includes(pastClaim) ||
    pastClaim.includes(curClaim) ||
    (curClaim.includes("이물") && pastClaim.includes("이물")) ||
    (curClaim.includes("변질") && pastClaim.includes("변질"))
  ) {
    identicalItems.push({
      type: "identical",
      field: "claim",
      fieldTitle: "클레임 유형",
      message: `클레임 유형 동일 (${curClaim})`,
      pastValue: pastClaim,
      currentValue: curClaim,
    });
  } else {
    differences.push({
      type: "warning",
      field: "claim",
      fieldTitle: "클레임 유형",
      message: "클레임 유형이 다릅니다.",
      pastValue: pastClaim,
      currentValue: curClaim,
    });
  }

  // ==========================================
  // [차이 4] 관련 공정 비교
  // ==========================================
  if (
    curProc === "미확인" ||
    curProc === "분석 전" ||
    !curProcRaw ||
    curProc.includes("미확인")
  ) {
    differences.push({
      type: "unconfirmed",
      field: "relatedProcess",
      fieldTitle: "관련공정",
      message: "현재 클레임의 관련공정이 아직 확인되지 않았습니다.",
      pastValue: pastProc,
      currentValue: "미확인",
    });
  } else if (clean(curProc) === clean(pastProc) || curProc.includes(pastProc) || pastProc.includes(curProc)) {
    identicalItems.push({
      type: "identical",
      field: "relatedProcess",
      fieldTitle: "관련공정",
      message: `관련공정 동일 (${curProc})`,
      pastValue: pastProc,
      currentValue: curProc,
    });
  } else {
    differences.push({
      type: "warning",
      field: "relatedProcess",
      fieldTitle: "관련공정",
      message: "관련공정이 다릅니다.",
      pastValue: pastProc,
      currentValue: curProc,
    });
  }

  return {
    pastCase,
    currentCase,
    differences,
    identicalItems,
    hasCriticalDifferences: differences.some((d) => d.type === "warning"),
  };
}
