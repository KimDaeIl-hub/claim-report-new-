import { ReportData } from "../types";

export type WorkflowStepId = "basic" | "investigation" | "cause" | "conclusion";

export interface RequiredFieldItem {
  id: string;
  name: string;
  buttonLabel: string; // 예: "제조번호 입력", "보관품 조사", "원인 분석"
  step: WorkflowStepId;
  targetElementId: string;
  isMissing: (report: ReportData) => boolean;
}

/**
 * 보고서 필수 작성 항목 목록 (엄격한 단계별 우선순위 순서대로 정의)
 * 품질팀 요구사항에 따라 AI 판단 없이 결정론적으로 평가됩니다.
 */
export const REQUIRED_WORKFLOW_FIELDS: RequiredFieldItem[] = [
  // ==========================================
  // [Step 1] 기본 정보 및 접수/제품 정보 (basic)
  // ==========================================
  {
    id: "customer-name",
    name: "고객명",
    buttonLabel: "고객명 입력",
    step: "basic",
    targetElementId: "field-customer-name",
    isMissing: (report) => !report.customerClaim.customerName?.trim(),
  },
  {
    id: "claim-received-at",
    name: "클레임 접수일자",
    buttonLabel: "접수일자 입력",
    step: "basic",
    targetElementId: "field-claim-received-at",
    isMissing: (report) => !report.customerClaim.receivedAt?.trim(),
  },
  {
    id: "claim-product-name",
    name: "대상 제품명",
    buttonLabel: "제품명 입력",
    step: "basic",
    targetElementId: "field-claim-product-name",
    isMissing: (report) => !report.productInfo.productName?.trim(),
  },
  {
    id: "lot-number",
    name: "제조번호(LOT)",
    buttonLabel: "제조번호 입력",
    step: "basic",
    targetElementId: "field-lot-number",
    isMissing: (report) => !report.productInfo.lotNumber?.trim(),
  },
  {
    id: "claim-expiry-date",
    name: "소비기한",
    buttonLabel: "소비기한 입력",
    step: "basic",
    targetElementId: "field-claim-expiry-date",
    isMissing: (report) => !report.productInfo.expiryDate?.trim(),
  },
  {
    id: "claim-details",
    name: "클레임 상세 내용",
    buttonLabel: "클레임 상세 입력",
    step: "basic",
    targetElementId: "field-claim-details",
    isMissing: (report) => !report.customerClaim.claimDetails?.trim(),
  },

  // ==========================================
  // [Step 2] 정밀분석 및 5대 조사 항목 (investigation)
  // 순서: 현품 분석 -> 보관품 조사 -> 제조기록 조사 -> 품질검사 결과 -> 제조공정 조사
  // ==========================================
  {
    id: "visual-inspection",
    name: "현품 분석",
    buttonLabel: "현품 분석",
    step: "investigation",
    targetElementId: "field-visual-sample-condition",
    isMissing: (report) => {
      if (report.analysisResults.visualInspection.skipped) return false;
      const cond = report.analysisResults.visualInspection.sampleCondition?.trim();
      const foreign = report.analysisResults.visualInspection.foreignObjectAppearance?.trim();
      return !cond && !foreign;
    },
  },
  {
    id: "retained-sample",
    name: "보관품 조사",
    buttonLabel: "보관품 조사",
    step: "investigation",
    targetElementId: "field-choice-retained-sample",
    isMissing: (report) => {
      if (report.lotHistory.skipped) return false;
      const hasCode =
        report.investigationSelections?.retainedSample ||
        report.lotHistory.storageSampleResult ||
        report.storageSampleResult;
      const note = report.lotHistory.retainedSampleCheck?.trim();
      // 버튼 선택 또는 조사 내용 작성 중 하나라도 완료되지 않은 경우 미완료로 판단
      return !hasCode || !note;
    },
  },
  {
    id: "manufacturing-record",
    name: "제조기록 조사",
    buttonLabel: "제조기록 조사",
    step: "investigation",
    targetElementId: "field-choice-manufacturing-record",
    isMissing: (report) => {
      if (report.lotHistory.skipped) return false;
      const hasCode =
        report.investigationSelections?.manufacturingRecord ||
        report.lotHistory.manufacturingRecordResult ||
        report.manufacturingRecordResult;
      const note = report.lotHistory.productionLogNote?.trim();
      return !hasCode || !note;
    },
  },
  {
    id: "quality-inspection",
    name: "품질검사 결과",
    buttonLabel: "품질검사 결과",
    step: "investigation",
    targetElementId: "field-choice-quality-inspection",
    isMissing: (report) => {
      if (report.lotHistory.skipped) return false;
      const hasCode =
        report.investigationSelections?.qualityInspection ||
        report.lotHistory.qualityInspectionResult ||
        report.qualityInspectionResult;
      const note = report.lotHistory.qualityTestRecord?.trim();
      return !hasCode || !note;
    },
  },
  {
    id: "manufacturing-process",
    name: "제조공정 조사",
    buttonLabel: "제조공정 조사",
    step: "investigation",
    targetElementId: "field-choice-manufacturing-process",
    isMissing: (report) => {
      if (report.manufacturingProcess.skipped) return false;
      const hasCode =
        report.investigationSelections?.manufacturingProcess ||
        report.manufacturingProcess.processInvestigationResult ||
        report.processInvestigationResult;
      const note =
        report.manufacturingProcess.processInvestigationNote?.trim() ||
        report.manufacturingProcess.criticalControlPoint?.trim();
      return !hasCode || !note;
    },
  },

  // ==========================================
  // [Step 3] 원인 분석 및 재발방지대책 (cause)
  // ==========================================
  {
    id: "root-cause",
    name: "원인 분석",
    buttonLabel: "원인 분석",
    step: "cause",
    targetElementId: "field-root-cause",
    isMissing: (report) => {
      if (report.rootCauseAndActions.skipped) return false;
      return !report.rootCauseAndActions.rootCause?.trim();
    },
  },
  {
    id: "preventive-measures",
    name: "재발방지대책",
    buttonLabel: "재발방지대책 작성",
    step: "cause",
    targetElementId: "field-preventive-measures",
    isMissing: (report) => {
      if (report.rootCauseAndActions.skipped) return false;
      if (report.rootCauseAndActions.preventiveMeasuresSkipped) return false;
      return !report.rootCauseAndActions.preventiveMeasures?.trim();
    },
  },

  // ==========================================
  // [Step 4] 종합 결론 (conclusion)
  // ==========================================
  {
    id: "conclusion-summary",
    name: "결론 핵심 요약",
    buttonLabel: "결론 작성",
    step: "conclusion",
    targetElementId: "field-conclusion-summary",
    isMissing: (report) => {
      const points = report.conclusion.summaryPoints || [];
      return !points.some((p) => p && p.trim().length > 0);
    },
  },
  {
    id: "conclusion-apology",
    name: "고객 안내문",
    buttonLabel: "고객 안내문 작성",
    step: "conclusion",
    targetElementId: "field-conclusion-apology",
    isMissing: (report) => !report.conclusion.apologyText?.trim(),
  },
];

export interface NextRequiredActionResult {
  type: "current_step_missing" | "next_step_missing" | "final_review";
  buttonText: string;          // 예: "제조번호 입력 →", "보관품 조사 →", "최종 검토 →"
  actionLabel: string;         // 예: "제조번호 입력", "보관품 조사"
  targetStep: WorkflowStepId;
  targetElementId?: string;
  missingFieldItem?: RequiredFieldItem;
  remainingCount: number;
  isAllCompleted: boolean;
  stepRemainingCount: number;
}

/**
 * 사용자의 현재 작성 단계와 보고서 데이터를 기반으로
 * 다음에 실제로 작성해야 하는 필수 항목을 도출합니다.
 *
 * 기본 원칙:
 * 1. 현재 단계에서 필수 입력 누락 여부 확인
 * 2. 현재 클레임에서 다음으로 작성해야 하는 필수 조사 항목 확인
 * 3. 원인 분석
 * 4. 결론
 * 5. 최종 검토
 */
export function getNextRequiredAction(
  report: ReportData,
  currentStep: WorkflowStepId,
  currentSubTab?: string
): NextRequiredActionResult {
  // 전체 누락 항목 파악
  const allMissing = REQUIRED_WORKFLOW_FIELDS.filter((item) => item.isMissing(report));

  // 1. 현재 단계에서 누락된 필수 항목이 있는지 우선 확인
  const currentStepMissing = allMissing.filter((item) => item.step === currentStep);

  // 제품 정보 서브탭(product)에 위치한 경우, 제품 영역 필수 항목(제조번호, 소비기한 등)을 최우선으로 안내
  if (currentStep === "basic" && currentSubTab === "product") {
    const productSpecificMissing = currentStepMissing.filter(
      (item) => item.id === "lot-number" || item.id === "claim-expiry-date" || item.id === "claim-product-name"
    );
    if (productSpecificMissing.length > 0) {
      const firstMissing = productSpecificMissing[0];
      return {
        type: "current_step_missing",
        buttonText: `${firstMissing.buttonLabel} →`,
        actionLabel: firstMissing.buttonLabel,
        targetStep: firstMissing.step,
        targetElementId: firstMissing.targetElementId,
        missingFieldItem: firstMissing,
        remainingCount: allMissing.length,
        isAllCompleted: false,
        stepRemainingCount: currentStepMissing.length,
      };
    }
  }

  if (currentStepMissing.length > 0) {
    const firstMissing = currentStepMissing[0];
    return {
      type: "current_step_missing",
      buttonText: `${firstMissing.buttonLabel} →`,
      actionLabel: firstMissing.buttonLabel,
      targetStep: firstMissing.step,
      targetElementId: firstMissing.targetElementId,
      missingFieldItem: firstMissing,
      remainingCount: allMissing.length,
      isAllCompleted: false,
      stepRemainingCount: currentStepMissing.length,
    };
  }

  // 2. 현재 단계는 완료되었으므로, 워크플로우 순서상 다음 필수 항목 탐색
  // 순서: basic -> investigation -> cause -> conclusion
  const stepOrder: WorkflowStepId[] = ["basic", "investigation", "cause", "conclusion"];
  const currentIdx = stepOrder.indexOf(currentStep);

  // 현재 단계 이후의 단계부터 먼저 탐색
  for (let i = currentIdx + 1; i < stepOrder.length; i++) {
    const step = stepOrder[i];
    const missingInStep = allMissing.filter((item) => item.step === step);
    if (missingInStep.length > 0) {
      const target = missingInStep[0];
      return {
        type: "next_step_missing",
        buttonText: `${target.buttonLabel} →`,
        actionLabel: target.buttonLabel,
        targetStep: target.step,
        targetElementId: target.targetElementId,
        missingFieldItem: target,
        remainingCount: allMissing.length,
        isAllCompleted: false,
        stepRemainingCount: missingInStep.length,
      };
    }
  }

  // 앞선 단계 중 건너뛰었던 누락 항목이 남아있는 경우 탐색
  for (let i = 0; i < currentIdx; i++) {
    const step = stepOrder[i];
    const missingInStep = allMissing.filter((item) => item.step === step);
    if (missingInStep.length > 0) {
      const target = missingInStep[0];
      return {
        type: "next_step_missing",
        buttonText: `${target.buttonLabel} →`,
        actionLabel: target.buttonLabel,
        targetStep: target.step,
        targetElementId: target.targetElementId,
        missingFieldItem: target,
        remainingCount: allMissing.length,
        isAllCompleted: false,
        stepRemainingCount: missingInStep.length,
      };
    }
  }

  // 5. 모든 필수 항목이 완료된 경우 -> [최종 검토 →]
  return {
    type: "final_review",
    buttonText: "최종 검토 →",
    actionLabel: "최종 검토",
    targetStep: "conclusion",
    remainingCount: 0,
    isAllCompleted: true,
    stepRemainingCount: 0,
  };
}
