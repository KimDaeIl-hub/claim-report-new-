export interface InvestigationOption {
  label: string; // 한글 표기 (예: "특이사항 없음")
  value: string; // 고유 코드 (예: "no_issue")
}

export interface InvestigationChoiceItem {
  id: string;
  resultField:
    | "manufacturingRecordResult"
    | "storageSampleResult"
    | "qualityInspectionResult"
    | "processInvestigationResult"
    | "materialInvestigationResult";
  number: number;
  title: string;
  subtitle: string;
  fieldKey: string;
  options: readonly InvestigationOption[];
}

export const INVESTIGATION_CHOICES = {
  // 1. 제조기록 조사
  manufacturingRecord: {
    id: "manufacturingRecord",
    resultField: "manufacturingRecordResult",
    number: 1,
    title: "제조기록 조사",
    subtitle: "생산일지, 설비 가동기록, 공정조건 이탈 여부 점검",
    fieldKey: "productionLogNote",
    options: [
      { label: "특이사항 없음", value: "no_issue" },
      { label: "공정조건 이탈", value: "process_deviation" },
      { label: "작업기록 이상", value: "work_log_error" },
      { label: "설비 이상", value: "equipment_error" },
      { label: "검사결과 이상", value: "test_result_error" },
      { label: "기타", value: "other" },
      { label: "해당 없음", value: "not_applicable" },
    ],
  },

  // 2. 보관품 조사
  retainedSample: {
    id: "retainedSample",
    resultField: "storageSampleResult",
    number: 2,
    title: "보관품 조사",
    subtitle: "동일 Lot 공장 보관 검체 외관/성상/이물 대조 점검",
    fieldKey: "retainedSampleCheck",
    options: [
      { label: "이상 없음", value: "normal" },
      { label: "외관 이상", value: "appearance_defect" },
      { label: "내용물 이상", value: "content_defect" },
      { label: "동일/유사 이물 확인", value: "foreign_matter_found" },
      { label: "보관품 없음", value: "no_sample" },
      { label: "확인 불가", value: "unverifiable" },
      { label: "기타", value: "other" },
      { label: "해당 없음", value: "not_applicable" },
    ],
  },

  // 3. 품질검사 결과
  qualityInspection: {
    id: "qualityInspection",
    resultField: "qualityInspectionResult",
    number: 3,
    title: "품질검사 결과",
    subtitle: "출하 전 완제품 시험성적서(COA) 및 규격 적합 여부",
    fieldKey: "qualityTestRecord",
    options: [
      { label: "적합", value: "pass" },
      { label: "부적합", value: "fail" },
      { label: "검사결과 없음", value: "no_record" },
      { label: "추가 확인 필요", value: "needs_confirmation" },
      { label: "해당 없음", value: "not_applicable" },
    ],
  },

  // 4. 제조공정 조사
  manufacturingProcess: {
    id: "manufacturingProcess",
    resultField: "processInvestigationResult",
    number: 4,
    title: "제조공정 조사",
    subtitle: "생산 공정 흐름, 이물 혼입 가능성 및 공정상 원인 점검",
    fieldKey: "criticalControlPoint",
    options: [
      { label: "특이사항 없음", value: "no_issue" },
      { label: "공정 중 이상 확인", value: "process_anomaly" },
      { label: "해당 공정의 혼입 가능성 검토 필요", value: "contamination_risk_review" },
      { label: "공정상 원인 확인", value: "process_cause_identified" },
      { label: "공정상 원인 확인 불가", value: "process_cause_unidentified" },
      { label: "기타", value: "other" },
      { label: "해당 없음", value: "not_applicable" },
    ],
  },

  // 5. 원부자재 조사
  rawMaterial: {
    id: "rawMaterial",
    resultField: "materialInvestigationResult",
    number: 5,
    title: "원부자재 조사",
    subtitle: "원료 및 부자재(용기/캡/라벨) 입고검사 및 LOT 추적 점검",
    fieldKey: "rawMaterialCheck",
    options: [
      { label: "특이사항 없음", value: "no_issue" },
      { label: "원료 이상 확인", value: "raw_material_defect" },
      { label: "부자재 이상 확인", value: "packaging_material_defect" },
      { label: "LOT 추적 필요", value: "lot_tracking_needed" },
      { label: "확인 불가", value: "unverifiable" },
      { label: "기타", value: "other" },
      { label: "해당 없음", value: "not_applicable" },
    ],
  },
} as const;

export type InvestigationChoiceKey = keyof typeof INVESTIGATION_CHOICES;

export const INVESTIGATION_CHOICE_LIST: InvestigationChoiceItem[] = [
  INVESTIGATION_CHOICES.manufacturingRecord,
  INVESTIGATION_CHOICES.retainedSample,
  INVESTIGATION_CHOICES.qualityInspection,
  INVESTIGATION_CHOICES.manufacturingProcess,
  INVESTIGATION_CHOICES.rawMaterial,
];

/**
 * 주어진 항목과 입력값(한글 라벨 또는 고유 영문 코드)에 대해 고유 영문 코드 반환
 */
export function getChoiceOptionCode(
  itemKey: InvestigationChoiceKey | string,
  labelOrCode: string | undefined | null
): string {
  if (!labelOrCode) return "";
  const config = (INVESTIGATION_CHOICES as any)[itemKey];
  if (!config) return labelOrCode;
  const match = config.options.find(
    (opt: InvestigationOption) => opt.value === labelOrCode || opt.label === labelOrCode
  );
  return match ? match.value : labelOrCode;
}

/**
 * 주어진 항목과 입력값(고유 영문 코드 또는 한글 라벨)에 대해 한글 표기 라벨 반환
 */
export function getChoiceOptionLabel(
  itemKey: InvestigationChoiceKey | string,
  codeOrLabel: string | undefined | null
): string {
  if (!codeOrLabel) return "";
  const config = (INVESTIGATION_CHOICES as any)[itemKey];
  if (!config) return codeOrLabel;
  const match = config.options.find(
    (opt: InvestigationOption) => opt.value === codeOrLabel || opt.label === codeOrLabel
  );
  return match ? match.label : codeOrLabel;
}
