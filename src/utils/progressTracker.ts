import { ReportData, InvestigationStatus } from "../types";

export type ChecklistStatus = "미작성" | "작성중" | "완료" | "해당없음" | "추가확인필요";

export interface ProgressItem {
  id: string;
  name: string;
  section: string;
  tabId: string;
  elementId: string;
  status: ChecklistStatus;
  statusDetail?: InvestigationStatus;
  isSkippedByUser: boolean;
  isRequired: boolean;
  currentValue?: string;
}

export interface SectionProgress {
  sectionKey: string;
  sectionName: string;
  tabId: string;
  totalCount: number;
  completedCount: number; // 완료 + 해당없음
  percentage: number;
  items: ProgressItem[];
}

export interface OverallProgress {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  unwrittenCount: number;
  notApplicableCount: number;
  needReviewCount: number;
  overallPercentage: number;
  sections: SectionProgress[];
}

/**
 * 텍스트 내용과 설정된 조사 상태를 바탕으로 5개 체크리스트 상태 중 하나를 도출
 * 규칙:
 * - "해당없음"은 사용자가 명시적으로 skipped: true를 했거나 status: "해당 없음"을 직접 지정한 경우에만 반환!
 *   (절대 자동으로 미작성 항목을 해당없음으로 처리하지 않음)
 */
export function determineChecklistStatus(
  value: string | undefined | null,
  status: InvestigationStatus | undefined,
  skipped: boolean | undefined = false
): ChecklistStatus {
  // 1. 사용자가 직접 Skip 또는 '해당 없음'을 선택한 경우
  if (skipped === true || status === "해당 없음") {
    return "해당없음";
  }

  // 2. 사용자가 '추가 조사 필요' 또는 '확인 불가'를 선택한 경우
  if (status === "추가 조사 필요" || status === "확인 불가") {
    return "추가확인필요";
  }

  const trimmed = (value || "").trim();

  // 3. 내용이 전혀 없는 경우 -> 무조건 미작성
  if (!trimmed || trimmed === "-") {
    return "미작성";
  }

  // 4. 내용이 있지만 상태가 '미실시'로 남아있거나 내용이 너무 짧은 경우(10자 미만)
  if (status === "미실시" || trimmed.length < 5) {
    return "작성중";
  }

  // 5. 완료 상태이거나 유의미한 내용이 기재된 경우
  return "완료";
}

/**
 * 보고서 데이터로부터 전체 진행률 및 각 항목 상태를 계산
 */
export function calculateReportProgress(report: ReportData): OverallProgress {
  const sections: SectionProgress[] = [];

  // 1. 기본 정보 (접수 / 고객 / 제품)
  const cc = report.customerClaim;
  const pi = report.productInfo;

  const basicItems: ProgressItem[] = [
    {
      id: "claim-reception",
      name: "클레임 접수일자 및 고객명",
      section: "기본정보",
      tabId: "basic",
      elementId: "field-customer-name",
      status:
        cc.receivedAt && cc.customerName
          ? "완료"
          : cc.receivedAt || cc.customerName
          ? "작성중"
          : "미작성",
      isSkippedByUser: false,
      isRequired: true,
      currentValue: `${cc.customerName || ""} (${cc.receivedAt?.split("T")[0] || ""})`,
    },
    {
      id: "product-name",
      name: "대상 제품명 및 용량",
      section: "기본정보",
      tabId: "basic",
      elementId: "field-claim-product-name",
      status: pi.productName ? "완료" : "미작성",
      isSkippedByUser: false,
      isRequired: true,
      currentValue: pi.productName,
    },
    {
      id: "product-expiry",
      name: "소비기한 및 로트번호",
      section: "기본정보",
      tabId: "basic",
      elementId: "field-claim-expiry-date",
      status:
        pi.expiryDate || pi.lotNumber
          ? "완료"
          : "미작성",
      isSkippedByUser: false,
      isRequired: true,
      currentValue: `${pi.expiryDate || ""} / Lot: ${pi.lotNumber || ""}`,
    },
    {
      id: "claim-description",
      name: "불만 인입 내용 상세 (고객 진술)",
      section: "기본정보",
      tabId: "basic",
      elementId: "field-claim-details",
      status: determineChecklistStatus(cc.claimDetails, undefined, false),
      isSkippedByUser: false,
      isRequired: true,
      currentValue: cc.claimDetails,
    },
    {
      id: "product-manufacturer",
      name: "제조원 및 생산 라인",
      section: "기본정보",
      tabId: "basic",
      elementId: "field-product-manufacturer",
      status: pi.manufacturer ? "완료" : "미작성",
      isSkippedByUser: false,
      isRequired: false,
      currentValue: pi.manufacturer,
    },
  ];

  // 2. 현품 정밀 분석 (analysisResults)
  const ar = report.analysisResults;
  const analysisItems: ProgressItem[] = [
    {
      id: "visual-inspection",
      name: "1. 현품 육안 확인 결과",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-visual-sample-condition",
      status: determineChecklistStatus(
        ar.visualInspection.sampleCondition || ar.visualInspection.foreignObjectAppearance,
        ar.visualInspection.status,
        ar.visualInspection.skipped
      ),
      statusDetail: ar.visualInspection.status,
      isSkippedByUser: !!ar.visualInspection.skipped,
      isRequired: true,
      currentValue: ar.visualInspection.sampleCondition,
    },
    {
      id: "magnifier-inspection",
      name: "2. 확대경 정밀 관찰",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-magnifier-result",
      status: determineChecklistStatus(
        ar.magnifierInspection.result,
        ar.magnifierInspection.status,
        ar.magnifierInspection.skipped
      ),
      statusDetail: ar.magnifierInspection.status,
      isSkippedByUser: !!ar.magnifierInspection.skipped,
      isRequired: false,
      currentValue: ar.magnifierInspection.result,
    },
    {
      id: "microscope-inspection",
      name: "3. 광학 현미경 분석",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-microscope-result",
      status: determineChecklistStatus(
        ar.opticalMicroscope.result,
        ar.opticalMicroscope.status,
        ar.opticalMicroscope.skipped
      ),
      statusDetail: ar.opticalMicroscope.status,
      isSkippedByUser: !!ar.opticalMicroscope.skipped,
      isRequired: false,
      currentValue: ar.opticalMicroscope.result,
    },
    {
      id: "ftir-analysis",
      name: "4. FT-IR 적외선 분광분석",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-ftir-summary",
      status: determineChecklistStatus(
        ar.ftirAnalysis.summary || ar.ftirAnalysis.matchedMaterial,
        ar.ftirAnalysis.status,
        ar.ftirAnalysis.skipped
      ),
      statusDetail: ar.ftirAnalysis.status,
      isSkippedByUser: !!ar.ftirAnalysis.skipped,
      isRequired: false,
      currentValue: ar.ftirAnalysis.matchedMaterial,
    },
    {
      id: "xrf-analysis",
      name: "5. XRF X선 형광분석",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-xrf-summary",
      status: determineChecklistStatus(
        ar.xrfAnalysis.summary || ar.xrfAnalysis.elementsRatio,
        ar.xrfAnalysis.status,
        ar.xrfAnalysis.skipped
      ),
      statusDetail: ar.xrfAnalysis.status,
      isSkippedByUser: !!ar.xrfAnalysis.skipped,
      isRequired: false,
      currentValue: ar.xrfAnalysis.elementsRatio,
    },
    {
      id: "physicochemical-analysis",
      name: "6. 이화학 분석 (성상/pH/Brix 등)",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-physicochemical-table",
      status: ar.physicochemicalAnalysis.skipped
        ? "해당없음"
        : (ar.physicochemicalAnalysis.items && ar.physicochemicalAnalysis.items.length > 0) ||
          ar.physicochemicalAnalysis.summary
        ? "완료"
        : ar.physicochemicalAnalysis.status === "추가 조사 필요"
        ? "추가확인필요"
        : "미작성",
      statusDetail: ar.physicochemicalAnalysis.status,
      isSkippedByUser: !!ar.physicochemicalAnalysis.skipped,
      isRequired: false,
      currentValue: ar.physicochemicalAnalysis.summary,
    },
    {
      id: "catalase-test",
      name: "7. 카탈라아제 효소활성 시험",
      section: "현품분석",
      tabId: "investigation",
      elementId: "field-catalase-judgement",
      status: determineChecklistStatus(
        ar.catalaseTest.resultJudgement || ar.catalaseTest.reactionDetail,
        ar.catalaseTest.status,
        ar.catalaseTest.skipped
      ),
      statusDetail: ar.catalaseTest.status,
      isSkippedByUser: !!ar.catalaseTest.skipped,
      isRequired: false,
      currentValue: ar.catalaseTest.resultJudgement,
    },
  ];

  // 3. 제조공정 분석 (manufacturingProcess)
  const mp = report.manufacturingProcess;
  const processItems: ProgressItem[] = [
    {
      id: "process-filtration",
      name: "여과망/체 공정 점검",
      section: "제조공정",
      tabId: "investigation",
      elementId: "field-process-filtration",
      status: determineChecklistStatus(mp.filtrationAnalysis, mp.filtrationStatus, mp.skipped),
      statusDetail: mp.filtrationStatus,
      isSkippedByUser: !!mp.skipped,
      isRequired: true,
      currentValue: mp.filtrationAnalysis,
    },
    {
      id: "process-cleaning",
      name: "용기/세척/충전 공정 점검",
      section: "제조공정",
      tabId: "investigation",
      elementId: "field-process-cleaning",
      status: determineChecklistStatus(mp.cleaningAnalysis, mp.cleaningStatus, mp.skipped),
      statusDetail: mp.cleaningStatus,
      isSkippedByUser: !!mp.skipped,
      isRequired: true,
      currentValue: mp.cleaningAnalysis,
    },
    {
      id: "process-ccp",
      name: "CCP 중점관리점 분석",
      section: "제조공정",
      tabId: "investigation",
      elementId: "field-process-ccp",
      status: determineChecklistStatus(
        mp.criticalControlPoint,
        mp.ccpStatus,
        mp.skipped
      ),
      statusDetail: mp.ccpStatus,
      isSkippedByUser: !!mp.skipped,
      isRequired: true,
      currentValue: mp.criticalControlPoint,
    },
  ];

  // 4. 동일 Lot 품질 이력 (lotHistory)
  const lot = report.lotHistory;
  const lotItems: ProgressItem[] = [
    {
      id: "lot-production-log",
      name: "제조 당시 생산일지 점검",
      section: "동일Lot",
      tabId: "investigation",
      elementId: "field-lot-production-log",
      status: determineChecklistStatus(lot.productionLogNote, lot.productionLogStatus, lot.skipped),
      statusDetail: lot.productionLogStatus,
      isSkippedByUser: !!lot.skipped,
      isRequired: true,
      currentValue: lot.productionLogNote,
    },
    {
      id: "lot-quality-test",
      name: "출하 전 검사 성적서(COA)",
      section: "동일Lot",
      tabId: "investigation",
      elementId: "field-lot-quality-test",
      status: determineChecklistStatus(lot.qualityTestRecord, lot.qualityTestStatus, lot.skipped),
      statusDetail: lot.qualityTestStatus,
      isSkippedByUser: !!lot.skipped,
      isRequired: true,
      currentValue: lot.qualityTestRecord,
    },
    {
      id: "lot-retained-sample",
      name: "공장 보관 검체 대조 확인",
      section: "동일Lot",
      tabId: "investigation",
      elementId: "field-lot-retained-sample",
      status: determineChecklistStatus(lot.retainedSampleCheck, lot.retainedSampleStatus, lot.skipped),
      statusDetail: lot.retainedSampleStatus,
      isSkippedByUser: !!lot.skipped,
      isRequired: true,
      currentValue: lot.retainedSampleCheck,
    },
  ];

  // 5. 원인 판정 및 재발방지 (rootCauseAndActions)
  const rc = report.rootCauseAndActions;
  const causeItems: ProgressItem[] = [
    {
      id: "cause-root",
      name: "종합 원인 판정 소견",
      section: "원인판정",
      tabId: "cause",
      elementId: "field-root-cause",
      status: determineChecklistStatus(rc.rootCause, rc.status, rc.skipped),
      statusDetail: rc.status,
      isSkippedByUser: !!rc.skipped,
      isRequired: true,
      currentValue: rc.rootCause,
    },
    {
      id: "cause-actions",
      name: "재발 방지 개선 대책",
      section: "원인판정",
      tabId: "cause",
      elementId: "field-preventive-measures",
      status: determineChecklistStatus(
        rc.preventiveMeasures,
        undefined,
        rc.preventiveMeasuresSkipped || rc.skipped
      ),
      isSkippedByUser: !!(rc.preventiveMeasuresSkipped || rc.skipped),
      isRequired: true,
      currentValue: rc.preventiveMeasures,
    },
  ];

  // 6. 종합 결론 (conclusion)
  const conc = report.conclusion;
  const conclusionItems: ProgressItem[] = [
    {
      id: "conclusion-summary",
      name: "조사 결과 핵심 요약 (가, 나, 다)",
      section: "종합결론",
      tabId: "conclusion",
      elementId: "field-conclusion-summary",
      status: conc.summaryPoints && conc.summaryPoints.some((p) => p.trim()) ? "완료" : "미작성",
      isSkippedByUser: false,
      isRequired: true,
      currentValue: conc.summaryPoints?.filter((p) => p.trim()).join(" / "),
    },
    {
      id: "conclusion-apology",
      name: "고객 안심 및 사과 문구",
      section: "종합결론",
      tabId: "conclusion",
      elementId: "field-conclusion-apology",
      status: determineChecklistStatus(conc.apologyText, undefined, false),
      isSkippedByUser: false,
      isRequired: true,
      currentValue: conc.apologyText,
    },
  ];

  // 섹션별 묶기 및 퍼센트 계산
  const sectionGroups = [
    { key: "basic", name: "기본정보", tabId: "basic", items: basicItems },
    { key: "analysis", name: "현품분석", tabId: "investigation", items: analysisItems },
    { key: "process", name: "공정점검", tabId: "investigation", items: processItems },
    { key: "lot", name: "품질이력", tabId: "investigation", items: lotItems },
    { key: "cause", name: "원인판정", tabId: "cause", items: causeItems },
    { key: "conclusion", name: "종합결론", tabId: "conclusion", items: conclusionItems },
  ];

  let totalItemsCount = 0;
  let totalCompletedCount = 0;
  let totalInProgressCount = 0;
  let totalUnwrittenCount = 0;
  let totalNotApplicableCount = 0;
  let totalNeedReviewCount = 0;

  for (const group of sectionGroups) {
    const total = group.items.length;
    // 완료 + 해당없음은 작성 완료(100% 기여)로 계산
    const completed = group.items.filter((i) => i.status === "완료" || i.status === "해당없음").length;
    const inProgress = group.items.filter((i) => i.status === "작성중").length;
    const unwritten = group.items.filter((i) => i.status === "미작성").length;
    const notApp = group.items.filter((i) => i.status === "해당없음").length;
    const needReview = group.items.filter((i) => i.status === "추가확인필요").length;

    totalItemsCount += total;
    totalCompletedCount += completed;
    totalInProgressCount += inProgress;
    totalUnwrittenCount += unwritten;
    totalNotApplicableCount += notApp;
    totalNeedReviewCount += needReview;

    // 작성중인 항목은 0.5 가중치 부여하여 부드러운 진행률 표시
    const effectiveCompleted = completed + inProgress * 0.5;
    const percentage = total > 0 ? Math.round((effectiveCompleted / total) * 100) : 100;

    sections.push({
      sectionKey: group.key,
      sectionName: group.name,
      tabId: group.tabId,
      totalCount: total,
      completedCount: completed,
      percentage: Math.min(100, Math.max(0, percentage)),
      items: group.items,
    });
  }

  const effectiveTotalCompleted = totalCompletedCount + totalInProgressCount * 0.5;
  const overallPercentage =
    totalItemsCount > 0
      ? Math.round((effectiveTotalCompleted / totalItemsCount) * 100)
      : 100;

  return {
    totalCount: totalItemsCount,
    completedCount: totalCompletedCount,
    inProgressCount: totalInProgressCount,
    unwrittenCount: totalUnwrittenCount,
    notApplicableCount: totalNotApplicableCount,
    needReviewCount: totalNeedReviewCount,
    overallPercentage: Math.min(100, Math.max(0, overallPercentage)),
    sections,
  };
}

/**
 * 상태별 배지 스타일 및 아이콘 색상
 */
export function getChecklistStatusStyle(status: ChecklistStatus): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
  label: string;
} {
  switch (status) {
    case "완료":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-300",
        indicator: "bg-emerald-500",
        label: "완료",
      };
    case "작성중":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-300",
        indicator: "bg-amber-500",
        label: "작성중",
      };
    case "미작성":
      return {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-300",
        indicator: "bg-rose-500",
        label: "미작성",
      };
    case "해당없음":
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-300",
        indicator: "bg-slate-400",
        label: "해당없음",
      };
    case "추가확인필요":
      return {
        bg: "bg-purple-50",
        text: "text-purple-800",
        border: "border-purple-300",
        indicator: "bg-purple-500",
        label: "추가확인필요",
      };
  }
}
