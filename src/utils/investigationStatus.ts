import { ReportData, InvestigationStatus, INVESTIGATION_STATUS_LIST } from "../types";

export { INVESTIGATION_STATUS_LIST };

/**
 * 조사 항목 상태 배지 색상 및 스타일 반환
 */
export function getInvestigationStatusBadgeStyle(status?: InvestigationStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case "이상 없음":
      return {
        bg: "bg-emerald-50 text-emerald-800",
        text: "text-emerald-800",
        border: "border-emerald-300",
        label: "이상 없음",
      };
    case "이상 확인":
      return {
        bg: "bg-red-50 text-red-800",
        text: "text-red-800",
        border: "border-red-300",
        label: "이상 확인",
      };
    case "확인 완료":
      return {
        bg: "bg-blue-50 text-blue-800",
        text: "text-blue-800",
        border: "border-blue-300",
        label: "확인 완료",
      };
    case "미실시":
      return {
        bg: "bg-amber-50 text-amber-900",
        text: "text-amber-900",
        border: "border-amber-400 font-bold",
        label: "미실시",
      };
    case "확인 불가":
      return {
        bg: "bg-orange-50 text-orange-800",
        text: "text-orange-800",
        border: "border-orange-300 font-semibold",
        label: "확인 불가",
      };
    case "해당 없음":
      return {
        bg: "bg-slate-100 text-slate-600",
        text: "text-slate-600",
        border: "border-slate-300",
        label: "해당 없음",
      };
    case "추가 조사 필요":
      return {
        bg: "bg-purple-50 text-purple-800",
        text: "text-purple-800",
        border: "border-purple-300 font-semibold",
        label: "추가 조사 필요",
      };
    default:
      return {
        bg: "bg-slate-100 text-slate-700",
        text: "text-slate-700",
        border: "border-slate-200",
        label: "미지정",
      };
  }
}

/**
 * 조사 항목의 유효 상태 계산
 */
export function resolveItemStatus(
  status: InvestigationStatus | undefined,
  skipped: boolean | undefined,
  content: string | undefined
): InvestigationStatus {
  if (skipped) return "미실시";
  if (status) return status;
  if (!content || content.trim() === "" || content.trim() === "-") {
    return "미실시";
  }
  return "확인 완료";
}

/**
 * 조사하지 않은 상태인지 여부 (미실시, 확인 불가, 비어있음 등)
 */
export function isUnexaminedOrEmpty(
  status: InvestigationStatus | undefined,
  content: string | undefined,
  skipped: boolean | undefined = false
): boolean {
  if (skipped) return true;
  const currentStatus = resolveItemStatus(status, skipped, content);
  return (
    currentStatus === "미실시" ||
    currentStatus === "확인 불가" ||
    (!content || content.trim() === "" || content.trim() === "-")
  );
}

/**
 * 안전한 텍스트 반환 헬퍼:
 * 조사하지 않았거나 상태가 '미실시', '확인 불가'인 경우 절대 "이상 없음", "정상", "안전" 문구를 자동 생성하지 않음!
 */
export function getSafeInvestigationText(
  status: InvestigationStatus | undefined,
  rawText: string | undefined,
  options: {
    itemLabel?: string;
    skipped?: boolean;
    investigatedFallback?: string;
  } = {}
): {
  displayText: string;
  isNormal: boolean;
  isUnexamined: boolean;
  status: InvestigationStatus;
} {
  const currentStatus = resolveItemStatus(status, options.skipped, rawText);
  const trimmed = rawText?.trim() || "";

  if (currentStatus === "미실시" || options.skipped) {
    return {
      displayText: trimmed || "조사 미실시 (해당 시험/점검 미진행)",
      isNormal: false,
      isUnexamined: true,
      status: "미실시",
    };
  }

  if (currentStatus === "확인 불가") {
    return {
      displayText: trimmed || "확인 불가 (시료 부족 또는 현품 상태 한계로 판정 불가)",
      isNormal: false,
      isUnexamined: true,
      status: "확인 불가",
    };
  }

  if (currentStatus === "해당 없음") {
    return {
      displayText: trimmed || "해당 사항 없음",
      isNormal: false,
      isUnexamined: false,
      status: "해당 없음",
    };
  }

  if (currentStatus === "추가 조사 필요") {
    return {
      displayText: trimmed || "추가 조사 및 시험 필요 (진행 중)",
      isNormal: false,
      isUnexamined: true,
      status: "추가 조사 필요",
    };
  }

  if (currentStatus === "이상 확인") {
    return {
      displayText: trimmed || "특이사항 및 이상 소견 확인됨",
      isNormal: false,
      isUnexamined: false,
      status: "이상 확인",
    };
  }

  // 이상 없음 또는 확인 완료인 경우
  const fallback = options.investigatedFallback || (currentStatus === "이상 없음" ? "이상 없음" : "확인 완료");
  return {
    displayText: trimmed || fallback,
    isNormal: currentStatus === "이상 없음",
    isUnexamined: false,
    status: currentStatus,
  };
}

export interface UnexaminedItemNotice {
  key: string;
  name: string;
  tabId: string;
  status: InvestigationStatus;
  isBlank: boolean;
  section: string;
  itemName: string;
}

/**
 * 보고서 내에서 미입력 또는 미실시/확인불가/추가조사필요인 조사 항목을 모두 집계
 */
export function getUnexaminedInvestigationItems(report: ReportData): UnexaminedItemNotice[] {
  const list: UnexaminedItemNotice[] = [];
  const ar = report.analysisResults;
  const mp = report.manufacturingProcess;
  const lot = report.lotHistory;

  // 1. 현품 외관
  if (!ar.visualInspection.skipped) {
    const isBlank = !ar.visualInspection.sampleCondition?.trim();
    const st = resolveItemStatus(ar.visualInspection.status, ar.visualInspection.skipped, ar.visualInspection.sampleCondition);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "visualInspection",
        name: "현품 외관/성상 확인",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "현품 육안 확인",
      });
    }
  }

  // 2. 확대경 조사
  if (!ar.magnifierInspection.skipped) {
    const isBlank = !ar.magnifierInspection.result?.trim();
    const st = resolveItemStatus(ar.magnifierInspection.status, ar.magnifierInspection.skipped, ar.magnifierInspection.result);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "magnifierInspection",
        name: "확대경 정밀 조사",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "확대경 조사",
      });
    }
  }

  // 3. 광학 현미경
  if (!ar.opticalMicroscope.skipped) {
    const isBlank = !ar.opticalMicroscope.result?.trim();
    const st = resolveItemStatus(ar.opticalMicroscope.status, ar.opticalMicroscope.skipped, ar.opticalMicroscope.result);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "opticalMicroscope",
        name: "광학 현미경 분석",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "광학 현미경 분석",
      });
    }
  }

  // 4. FT-IR
  if (!ar.ftirAnalysis.skipped) {
    const isBlank = !ar.ftirAnalysis.summary?.trim() && !ar.ftirAnalysis.matchedMaterial?.trim();
    const st = resolveItemStatus(ar.ftirAnalysis.status, ar.ftirAnalysis.skipped, ar.ftirAnalysis.summary);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "ftirAnalysis",
        name: "FT-IR 적외선 분광분석",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "FT-IR 분석",
      });
    }
  }

  // 5. XRF
  if (!ar.xrfAnalysis.skipped) {
    const isBlank = !ar.xrfAnalysis.summary?.trim() && !ar.xrfAnalysis.elementsRatio?.trim();
    const st = resolveItemStatus(ar.xrfAnalysis.status, ar.xrfAnalysis.skipped, ar.xrfAnalysis.summary);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "xrfAnalysis",
        name: "XRF 형광분석",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "XRF 원소분석",
      });
    }
  }

  // 6. 이화학 분석
  if (!ar.physicochemicalAnalysis.skipped) {
    const isBlank = (!ar.physicochemicalAnalysis.items || ar.physicochemicalAnalysis.items.length === 0) && !ar.physicochemicalAnalysis.summary?.trim();
    const st = resolveItemStatus(ar.physicochemicalAnalysis.status, ar.physicochemicalAnalysis.skipped, ar.physicochemicalAnalysis.summary);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "physicochemicalAnalysis",
        name: "이화학 시험",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "이화학 분석",
      });
    }
  }

  // 7. 카탈라아제
  if (!ar.catalaseTest.skipped) {
    const isBlank = !ar.catalaseTest.resultJudgement?.trim() && !ar.catalaseTest.reactionDetail?.trim();
    const st = resolveItemStatus(ar.catalaseTest.status, ar.catalaseTest.skipped, ar.catalaseTest.reactionDetail);
    if (isBlank || st === "미실시" || st === "확인 불가" || st === "추가 조사 필요") {
      list.push({
        key: "catalaseTest",
        name: "카탈라아제 효소 시험",
        tabId: "analysis",
        status: st,
        isBlank,
        section: "정밀 과학 분석",
        itemName: "카탈라아제 시험",
      });
    }
  }

  // 8. 제조공정
  if (!mp.skipped) {
    if (!mp.filtrationAnalysis?.trim() || mp.filtrationStatus === "미실시" || mp.filtrationStatus === "확인 불가") {
      list.push({
        key: "filtrationAnalysis",
        name: "여과 공정 점검",
        tabId: "process",
        status: mp.filtrationStatus || (mp.filtrationAnalysis?.trim() ? "확인 완료" : "미실시"),
        isBlank: !mp.filtrationAnalysis?.trim(),
        section: "제조공정 점검",
        itemName: "여과 공정",
      });
    }
    if (!mp.cleaningAnalysis?.trim() || mp.cleaningStatus === "미실시" || mp.cleaningStatus === "확인 불가") {
      list.push({
        key: "cleaningAnalysis",
        name: "용기/세척 공정 점검",
        tabId: "process",
        status: mp.cleaningStatus || (mp.cleaningAnalysis?.trim() ? "확인 완료" : "미실시"),
        isBlank: !mp.cleaningAnalysis?.trim(),
        section: "제조공정 점검",
        itemName: "용기/세척 공정",
      });
    }
  }

  // 9. 동일 Lot 품질 이력
  if (!lot.skipped) {
    // 생산일지
    const prodBlank = !lot.productionLogNote?.trim();
    const prodSt = resolveItemStatus(lot.productionLogStatus, false, lot.productionLogNote);
    if (prodBlank || prodSt === "미실시" || prodSt === "확인 불가" || prodSt === "추가 조사 필요") {
      list.push({
        key: "productionLogNote",
        name: "제조 당시 생산일지 점검",
        tabId: "lot",
        status: prodSt,
        isBlank: prodBlank,
        section: "동일 Lot 이력",
        itemName: "생산일지 점검",
      });
    }

    // 품질검사 성적서
    const coaBlank = !lot.qualityTestRecord?.trim();
    const coaSt = resolveItemStatus(lot.qualityTestStatus, false, lot.qualityTestRecord);
    if (coaBlank || coaSt === "미실시" || coaSt === "확인 불가" || coaSt === "추가 조사 필요") {
      list.push({
        key: "qualityTestRecord",
        name: "출하 전 시험 성적서(COA)",
        tabId: "lot",
        status: coaSt,
        isBlank: coaBlank,
        section: "동일 Lot 이력",
        itemName: "품질 성적서",
      });
    }

    // 공장 보관 검체
    const retainBlank = !lot.retainedSampleCheck?.trim();
    const retainSt = resolveItemStatus(lot.retainedSampleStatus, false, lot.retainedSampleCheck);
    if (retainBlank || retainSt === "미실시" || retainSt === "확인 불가" || retainSt === "추가 조사 필요") {
      list.push({
        key: "retainedSampleCheck",
        name: "자사 공장 보관 검체 확인",
        tabId: "lot",
        status: retainSt,
        isBlank: retainBlank,
        section: "동일 Lot 이력",
        itemName: "공장 보관 검체",
      });
    }
  }

  // 10. 원인 판정
  if (!report.rootCauseAndActions.skipped) {
    const rootBlank = !report.rootCauseAndActions.rootCause?.trim();
    const rootSt = resolveItemStatus(report.rootCauseAndActions.status, false, report.rootCauseAndActions.rootCause);
    if (rootBlank || rootSt === "미실시" || rootSt === "확인 불가" || rootSt === "추가 조사 필요") {
      list.push({
        key: "rootCause",
        name: "종합 원인 판정",
        tabId: "cause",
        status: rootSt,
        isBlank: rootBlank,
        section: "원인 판정 및 재발방지",
        itemName: "종합 원인 판정",
      });
    }
  }

  return list;
}
