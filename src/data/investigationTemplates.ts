/**
 * 5대 대상 조사 항목별 표준 문장 Template 및 동적 조립 관리 모듈
 * 
 * 품질팀 또는 관리자가 규격 문구를 쉽게 조회 및 유지보수할 수 있도록 단일 객체로 중앙 집중 관리합니다.
 * AI API 호출 없이 순수 사전 정의 Template 매핑 및 동적 입력 조립으로 동작합니다.
 */

export type InvestigationItemKey =
  | "manufacturingRecord"
  | "retainedSample"
  | "qualityInspection"
  | "manufacturingProcess"
  | "rawMaterial";

export interface InvestigationTemplateConfig {
  itemKey: InvestigationItemKey;
  itemNumber: number;
  itemName: string;
  fieldKey: string;
  templates: Record<string, string>;
}

export interface ExtraInputFieldSpec {
  fieldKey: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  helperText?: string;
  exampleText?: string;
}

export interface ExtraInputOptionSpec {
  itemKey: InvestigationItemKey;
  optionCode: string;
  optionLabel: string;
  warningNotice?: string; // 사실 확정 경고 등
  fields: ExtraInputFieldSpec[];
}

/**
 * 한국어 조사 (이/가, 을/를, 은/는, 으로/로) 자동 판별 헬퍼
 */
export function getJosa(word: string, format: "이/가" | "을/를" | "은/는" | "으로/로"): string {
  if (!word) return "";
  const trimmed = word.trim();
  if (!trimmed) return "";
  const lastChar = trimmed.slice(-1);
  const code = lastChar.charCodeAt(0);

  // 한글 음절 0xAC00 ~ 0xD7A3
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jongseong = (code - 0xac00) % 28;
    const hasBatchim = jongseong > 0;
    const isRieul = jongseong === 8;

    if (format === "이/가") return hasBatchim ? "이" : "가";
    if (format === "을/를") return hasBatchim ? "을" : "를";
    if (format === "은/는") return hasBatchim ? "은" : "는";
    if (format === "으로/로") return hasBatchim && !isRieul ? "으로" : "로";
  }

  // 숫자 받침 매핑
  const digitBatchimMap: Record<string, boolean> = {
    "0": true,  // 영 (ㅇ)
    "1": true,  // 일 (ㄹ)
    "2": false, // 이 (받침 없음)
    "3": true,  // 삼 (ㅁ)
    "4": false, // 사 (받침 없음)
    "5": false, // 오 (받침 없음)
    "6": true,  // 육 (ㄱ)
    "7": true,  // 칠 (ㄹ)
    "8": true,  // 팔 (ㄹ)
    "9": false, // 구 (받침 없음)
  };

  if (lastChar in digitBatchimMap) {
    const hasBatchim = digitBatchimMap[lastChar];
    const isRieul = lastChar === "1" || lastChar === "7" || lastChar === "8";
    if (format === "이/가") return hasBatchim ? "이" : "가";
    if (format === "을/를") return hasBatchim ? "을" : "를";
    if (format === "은/는") return hasBatchim ? "은" : "는";
    if (format === "으로/로") return hasBatchim && !isRieul ? "으로" : "로";
  }

  // 영문 또는 기타 문자 기본값
  if (format === "이/가") return "이";
  if (format === "을/를") return "을";
  if (format === "은/는") return "은";
  if (format === "으로/로") return "로";
  return "";
}

/**
 * 5대 조사 항목 기본 표준 문장 템플릿
 */
export const INVESTIGATION_TEMPLATES: Record<InvestigationItemKey, Record<string, string>> = {
  // 1. 제조기록 조사
  manufacturingRecord: {
    no_issue:
      "해당 제조번호의 제조기록 및 작업기록을 확인한 결과, 제조 및 품질관리 과정에서 특이사항은 확인되지 않았습니다.",
    process_deviation:
      "해당 제조번호의 제조기록을 확인한 결과, 제조공정 중 공정조건 이탈 사항이 확인되었습니다.",
    work_log_error:
      "해당 제조번호의 작업기록을 확인한 결과, 작업기록상 특이사항이 확인되었습니다.",
    equipment_error:
      "해당 제조번호의 제조기록을 확인한 결과, 제조설비와 관련된 이상사항이 확인되었습니다.",
    test_result_error:
      "해당 제조번호의 품질검사 기록을 확인한 결과, 검사결과상 특이사항이 확인되었습니다.",
    not_applicable:
      "해당 클레임과 관련된 제조기록에 대해서는 별도 확인사항이 없습니다.",
    other:
      "해당 제조번호의 제조기록 확인 결과, 기타 특이사항이 확인되었습니다.",
  },

  // 2. 보관품 조사
  retainedSample: {
    normal:
      "동일 제조번호의 보관품을 확인한 결과, 외관 및 내용물에서 특이사항은 확인되지 않았습니다.",
    appearance_defect:
      "동일 제조번호의 보관품을 확인한 결과, 외관에서 특이사항이 확인되었습니다.",
    content_defect:
      "동일 제조번호의 보관품을 확인한 결과, 내용물에서 특이사항이 확인되었습니다.",
    foreign_matter_found:
      "동일 제조번호의 보관품을 확인한 결과, 소비자 제공 현품과 동일 또는 유사한 이물이 확인되었습니다.",
    no_sample:
      "해당 제조번호의 보관품은 확보되어 있지 않아 별도 확인을 실시하지 못했습니다.",
    unverifiable:
      "보관품 확인이 어려워 해당 사항에 대한 조사를 실시하지 못했습니다.",
    not_applicable:
      "해당 클레임과 관련하여 보관품에 대한 별도 확인사항은 없습니다.",
    other:
      "동일 제조번호의 보관품 확인 결과, 기타 특이사항이 확인되었습니다.",
  },

  // 3. 품질검사 결과
  qualityInspection: {
    pass:
      "해당 제조번호의 품질검사 결과를 확인한 결과, 관련 검사 항목은 기준에 적합한 것으로 확인되었습니다.",
    fail:
      "해당 제조번호의 품질검사 결과를 확인한 결과, 일부 검사 항목에서 기준을 벗어난 결과가 확인되었습니다.",
    no_record:
      "해당 제조번호에 대한 관련 검사결과를 확인할 수 없었습니다.",
    needs_confirmation:
      "해당 제조번호의 품질검사 결과에 대해 추가적인 확인이 필요합니다.",
    not_applicable:
      "해당 클레임과 관련하여 별도의 품질검사 결과 확인은 실시하지 않았습니다.",
    other:
      "해당 제조번호의 품질검사 결과 확인 결과, 기타 특이사항이 확인되었습니다.",
  },

  // 4. 제조공정 조사
  manufacturingProcess: {
    no_issue:
      "제조공정 및 관련 기록을 확인한 결과, 제조과정에서 특이사항은 확인되지 않았습니다.",
    process_anomaly:
      "제조공정 및 관련 기록을 확인한 결과, 공정 중 이상사항이 확인되었습니다.",
    contamination_risk_review:
      "제조공정을 검토한 결과, 해당 공정에서의 혼입 가능성에 대한 추가 검토가 필요합니다.",
    process_cause_identified:
      "제조공정 및 관련 기록을 조사한 결과, 해당 클레임과 관련된 공정상 원인이 확인되었습니다.",
    process_cause_unidentified:
      "제조공정 및 관련 기록을 조사한 결과, 해당 클레임과 직접적으로 연관된 공정상 원인은 확인되지 않았습니다.",
    not_applicable:
      "해당 클레임과 관련하여 제조공정에 대한 별도 조사는 실시하지 않았습니다.",
    other:
      "제조공정 및 관련 기록을 조사한 결과, 기타 특이사항이 확인되었습니다.",
  },

  // 5. 원부자재 조사
  rawMaterial: {
    no_issue:
      "관련 원부자재의 제조 및 입고 기록을 확인한 결과, 특이사항은 확인되지 않았습니다.",
    raw_material_defect:
      "관련 원료를 확인한 결과, 원료와 관련된 특이사항이 확인되었습니다.",
    packaging_material_defect:
      "관련 부자재를 확인한 결과, 부자재와 관련된 특이사항이 확인되었습니다.",
    lot_tracking_needed:
      "관련 원부자재의 LOT에 대한 추가적인 추적 및 확인이 필요합니다.",
    unverifiable:
      "관련 원부자재에 대한 확인이 어려워 해당 사항을 확인하지 못했습니다.",
    not_applicable:
      "해당 클레임과 관련하여 원부자재에 대한 별도 조사는 실시하지 않았습니다.",
    other:
      "관련 원부자재를 확인한 결과, 기타 특이사항이 확인되었습니다.",
  },
};

/**
 * 한글 라벨 역매핑 사전
 */
export const LABEL_TO_CODE_MAP: Record<InvestigationItemKey, Record<string, string>> = {
  manufacturingRecord: {
    "특이사항 없음": "no_issue",
    "공정조건 이탈": "process_deviation",
    "작업기록 이상": "work_log_error",
    "설비 이상": "equipment_error",
    "검사결과 이상": "test_result_error",
    "해당 없음": "not_applicable",
    "기타": "other",
  },
  retainedSample: {
    "이상 없음": "normal",
    "외관 이상": "appearance_defect",
    "내용물 이상": "content_defect",
    "동일/유사 이물 확인": "foreign_matter_found",
    "보관품 없음": "no_sample",
    "확인 불가": "unverifiable",
    "해당 없음": "not_applicable",
    "기타": "other",
  },
  qualityInspection: {
    "적합": "pass",
    "부적합": "fail",
    "검사결과 없음": "no_record",
    "추가 확인 필요": "needs_confirmation",
    "해당 없음": "not_applicable",
    "기타": "other",
  },
  manufacturingProcess: {
    "특이사항 없음": "no_issue",
    "공정 중 이상 확인": "process_anomaly",
    "해당 공정의 혼입 가능성 검토 필요": "contamination_risk_review",
    "공정상 원인 확인": "process_cause_identified",
    "공정상 원인 확인 불가": "process_cause_unidentified",
    "해당 없음": "not_applicable",
    "기타": "other",
  },
  rawMaterial: {
    "특이사항 없음": "no_issue",
    "원료 이상 확인": "raw_material_defect",
    "부자재 이상 확인": "packaging_material_defect",
    "LOT 추적 필요": "lot_tracking_needed",
    "확인 불가": "unverifiable",
    "해당 없음": "not_applicable",
    "기타": "other",
  },
};

/**
 * 추가 입력이 필요한 선택지별 사양 정의
 * 기본 원칙: 추가 설명이 필요한 선택지를 선택했을 때만 입력창을 표시한다.
 */
export const EXTRA_INPUT_SPECS: Record<
  InvestigationItemKey,
  Record<string, ExtraInputOptionSpec>
> = {
  manufacturingRecord: {
    process_deviation: {
      itemKey: "manufacturingRecord",
      optionCode: "process_deviation",
      optionLabel: "공정조건 이탈",
      fields: [
        {
          fieldKey: "processDeviationDetail",
          label: "이탈 내용",
          placeholder: "예: 후살균 온도 기준 미달",
          exampleText: "후살균 온도 기준 미달",
        },
      ],
    },
    work_log_error: {
      itemKey: "manufacturingRecord",
      optionCode: "work_log_error",
      optionLabel: "작업기록 이상",
      fields: [
        {
          fieldKey: "workLogErrorDetail",
          label: "작업기록 이상 내용",
          placeholder: "예: 원료 투입시간 기록 누락",
          exampleText: "원료 투입시간 기록 누락",
        },
      ],
    },
    equipment_error: {
      itemKey: "manufacturingRecord",
      optionCode: "equipment_error",
      optionLabel: "설비 이상",
      fields: [
        {
          fieldKey: "equipmentErrorDetail",
          label: "설비 이상 내용",
          placeholder: "예: 충전기 노즐 2번 작동 이상",
          exampleText: "충전기 노즐 2번 작동 이상",
        },
      ],
    },
  },

  retainedSample: {
    appearance_defect: {
      itemKey: "retainedSample",
      optionCode: "appearance_defect",
      optionLabel: "외관 이상",
      fields: [
        {
          fieldKey: "appearanceDefectDetail",
          label: "외관 이상 내용",
          placeholder: "예: 용기 표면 긁힘",
          exampleText: "용기 표면 긁힘",
        },
      ],
    },
    content_defect: {
      itemKey: "retainedSample",
      optionCode: "content_defect",
      optionLabel: "내용물 이상",
      fields: [
        {
          fieldKey: "contentDefectDetail",
          label: "내용물 이상 내용",
          placeholder: "예: 미세한 침전 확인",
          exampleText: "미세한 침전 확인",
        },
      ],
    },
    foreign_matter_found: {
      itemKey: "retainedSample",
      optionCode: "foreign_matter_found",
      optionLabel: "동일/유사 이물 확인",
      fields: [
        {
          fieldKey: "foreignMatterDetail",
          label: "이물 특징",
          placeholder: "예: 검은색 섬유상 이물",
          exampleText: "검은색 섬유상 이물",
        },
      ],
    },
  },

  qualityInspection: {
    fail: {
      itemKey: "qualityInspection",
      optionCode: "fail",
      optionLabel: "부적합",
      fields: [
        {
          fieldKey: "testItem",
          label: "검사항목",
          placeholder: "예: pH",
          exampleText: "pH",
        },
        {
          fieldKey: "testValue",
          label: "측정결과",
          placeholder: "예: 3.2",
          exampleText: "3.2",
        },
        {
          fieldKey: "standard",
          label: "기준",
          placeholder: "예: 3.5~4.5",
          exampleText: "3.5~4.5",
        },
      ],
    },
  },

  manufacturingProcess: {
    process_anomaly: {
      itemKey: "manufacturingProcess",
      optionCode: "process_anomaly",
      optionLabel: "공정 중 이상 확인",
      fields: [
        {
          fieldKey: "processAnomalyDetail",
          label: "이상 내용",
          placeholder: "예: 살균 후 냉각수 온도 급상승",
          exampleText: "살균 후 냉각수 온도 급상승",
        },
      ],
    },
    contamination_risk_review: {
      itemKey: "manufacturingProcess",
      optionCode: "contamination_risk_review",
      optionLabel: "해당 공정의 혼입 가능성 검토 필요",
      fields: [
        {
          fieldKey: "contaminationRiskProcess",
          label: "검토 대상 공정",
          placeholder: "예: 충전공정",
          exampleText: "충전공정",
        },
      ],
    },
    process_cause_identified: {
      itemKey: "manufacturingProcess",
      optionCode: "process_cause_identified",
      optionLabel: "공정상 원인 확인",
      warningNotice:
        '주의: "원인"을 확정하는 문구이므로, 입력하신 내용이 최종 보고서에 사실로 확정되어 반영됩니다.',
      fields: [
        {
          fieldKey: "processCauseDetail",
          label: "확인된 원인",
          placeholder: "예: 노즐 패킹 마모로 인한 유격 발생",
          exampleText: "노즐 패킹 마모로 인한 유격 발생",
        },
      ],
    },
  },

  rawMaterial: {},
};

/**
 * 특정 항목 및 옵션이 추가 입력을 요구하는지 확인
 */
export function isExtraInputRequired(
  itemKey: InvestigationItemKey,
  optionCodeOrLabel: string | undefined | null
): boolean {
  if (!optionCodeOrLabel) return false;
  const code = toOptionCode(itemKey, optionCodeOrLabel);
  return Boolean(EXTRA_INPUT_SPECS[itemKey]?.[code]);
}

/**
 * 추가 입력 사양 가져오기
 */
export function getExtraInputSpec(
  itemKey: InvestigationItemKey,
  optionCodeOrLabel: string | undefined | null
): ExtraInputOptionSpec | null {
  if (!optionCodeOrLabel) return null;
  const code = toOptionCode(itemKey, optionCodeOrLabel);
  return EXTRA_INPUT_SPECS[itemKey]?.[code] || null;
}

/**
 * 한글 라벨 또는 영문 코드를 영문 코드로 정규화
 */
export function toOptionCode(
  itemKey: InvestigationItemKey,
  optionCodeOrLabel: string | undefined | null
): string {
  if (!optionCodeOrLabel) return "";
  const labelMap = LABEL_TO_CODE_MAP[itemKey];
  if (labelMap && labelMap[optionCodeOrLabel]) {
    return labelMap[optionCodeOrLabel];
  }
  return optionCodeOrLabel;
}

export interface AssembledSentenceResult {
  sentence: string;
  isComplete: boolean;
  isExtraInputRequired: boolean;
  missingFields: string[];
}

/**
 * 선택값 및 추가 입력 내용을 종합하여 표준 조사문장을 자동 조립합니다.
 * 추가 입력이 필요한 선택지인데 입력값이 비어있으면 isComplete: false 를 반환하며 문장을 생성하지 않습니다.
 */
export function assembleInvestigationSentence(
  itemKey: InvestigationItemKey,
  optionCodeOrLabel: string | undefined | null,
  inputs?: Record<string, string | undefined> | null
): AssembledSentenceResult {
  if (!optionCodeOrLabel) {
    return {
      sentence: "",
      isComplete: false,
      isExtraInputRequired: false,
      missingFields: [],
    };
  }

  const code = toOptionCode(itemKey, optionCodeOrLabel);
  const spec = EXTRA_INPUT_SPECS[itemKey]?.[code];

  // 1. 추가 입력이 필요 없는 선택지인 경우: 정적 템플릿 반환
  if (!spec) {
    const template = INVESTIGATION_TEMPLATES[itemKey]?.[code] || "";
    return {
      sentence: template,
      isComplete: Boolean(template),
      isExtraInputRequired: false,
      missingFields: [],
    };
  }

  // 2. 추가 입력이 필요한 선택지인 경우: 필수 필드 검증
  const missingFields: string[] = [];
  const safeInputs: Record<string, string> = {};

  for (const field of spec.fields) {
    const rawVal = inputs?.[field.fieldKey];
    const val = typeof rawVal === "string" ? rawVal.trim() : "";
    safeInputs[field.fieldKey] = val;
    if (!val) {
      missingFields.push(field.label);
    }
  }

  // 입력값이 하나라도 비어 있으면 문장을 생성하지 않음 ("추가 내용을 입력해주세요.")
  if (missingFields.length > 0) {
    return {
      sentence: "",
      isComplete: false,
      isExtraInputRequired: true,
      missingFields,
    };
  }

  // 3. 필드가 모두 채워진 경우 템플릿 규칙에 맞춰 정교하게 조립
  let assembled = "";

  if (itemKey === "manufacturingRecord") {
    if (code === "process_deviation") {
      const val = safeInputs.processDeviationDetail;
      const josa = getJosa(val, "이/가");
      assembled = `해당 제조번호의 제조기록을 확인한 결과, 제조공정 중 공정조건 이탈 사항이 확인되었으며, ${val}${josa} 확인되었습니다.`;
    } else if (code === "work_log_error") {
      const val = safeInputs.workLogErrorDetail;
      const part = val.endsWith("사항") ? `${val}이` : `${val} 사항이`;
      assembled = `해당 제조번호의 작업기록을 확인한 결과, ${part} 확인되었습니다.`;
    } else if (code === "equipment_error") {
      const val = safeInputs.equipmentErrorDetail;
      // "충전기 노즐 2번 작동 이상" -> "충전기 노즐 2번의 작동 이상"
      const cleanSubject = val
        .replace(/\s*의?\s*작동\s*이상$/, "")
        .replace(/\s*의?\s*이상$/, "")
        .trim();
      const subject = cleanSubject || val;
      assembled = `해당 제조번호의 제조기록을 확인한 결과, ${subject}의 작동 이상이 확인되었습니다.`;
    }
  } else if (itemKey === "retainedSample") {
    if (code === "appearance_defect") {
      const val = safeInputs.appearanceDefectDetail;
      // "용기 표면 긁힘" -> "용기 표면에서 긁힘이 확인되었습니다."
      if (val.includes("에서")) {
        const josa = getJosa(val, "이/가");
        assembled = `동일 제조번호의 보관품을 확인한 결과, ${val}${josa} 확인되었습니다.`;
      } else {
        const match = val.match(/^(.+?)\s+([^\s]+)$/);
        if (match) {
          const place = match[1];
          const defect = match[2];
          const josa = getJosa(defect, "이/가");
          assembled = `동일 제조번호의 보관품을 확인한 결과, ${place}에서 ${defect}${josa} 확인되었습니다.`;
        } else {
          const josa = getJosa(val, "이/가");
          assembled = `동일 제조번호의 보관품을 확인한 결과, 외관에서 ${val}${josa} 확인되었습니다.`;
        }
      }
    } else if (code === "content_defect") {
      const val = safeInputs.contentDefectDetail;
      // "미세한 침전 확인" -> "미세한 침전"
      const cleanVal = val.replace(/\s*(확인|발견)$/, "").trim() || val;
      const josa = getJosa(cleanVal, "이/가");
      assembled = `동일 제조번호의 보관품을 확인한 결과, 내용물에서 ${cleanVal}${josa} 확인되었습니다.`;
    } else if (code === "foreign_matter_found") {
      const val = safeInputs.foreignMatterDetail;
      const cleanVal = val.replace(/\s*(확인|발견)$/, "").trim() || val;
      const josa = getJosa(cleanVal, "이/가");
      assembled = `동일 제조번호의 보관품을 확인한 결과, ${cleanVal}${josa} 확인되었습니다.`;
    }
  } else if (itemKey === "qualityInspection") {
    if (code === "fail") {
      const item = safeInputs.testItem;
      const testVal = safeInputs.testValue;
      const standard = safeInputs.standard;
      const josa = getJosa(testVal, "으로/로");
      assembled = `해당 제조번호의 품질검사 결과를 확인한 결과, ${item} 항목에서 ${testVal}${josa} 기준(${standard})을 벗어난 결과가 확인되었습니다.`;
    }
  } else if (itemKey === "manufacturingProcess") {
    if (code === "process_anomaly") {
      const val = safeInputs.processAnomalyDetail;
      const part = val.endsWith("사항") ? `${val}이` : `${val} 사항이`;
      assembled = `제조공정 및 관련 기록을 확인한 결과, 공정 중 ${part} 확인되었습니다.`;
    } else if (code === "contamination_risk_review") {
      const val = safeInputs.contaminationRiskProcess;
      const processName = val.endsWith("공정") ? val : `${val} 공정`;
      assembled = `제조공정을 검토한 결과, ${processName}에서의 혼입 가능성에 대한 추가 검토가 필요합니다.`;
    } else if (code === "process_cause_identified") {
      const val = safeInputs.processCauseDetail;
      assembled = `제조공정 및 관련 기록을 조사한 결과, 해당 클레임과 관련된 공정상 원인(${val})이 확인되었습니다.`;
    }
  }

  // 조립 결과가 없는 예외 처리 시 기본 템플릿 폴백
  if (!assembled) {
    assembled = INVESTIGATION_TEMPLATES[itemKey]?.[code] || "";
  }

  return {
    sentence: assembled,
    isComplete: Boolean(assembled),
    isExtraInputRequired: true,
    missingFields: [],
  };
}

/**
 * 기존 인터페이스와의 100% 하위 호환성을 위한 헬퍼
 */
export function getInvestigationSentenceTemplate(
  itemKey: InvestigationItemKey,
  optionCodeOrLabel: string | undefined | null,
  detailInputs?: Record<string, string | undefined> | null
): string {
  if (!optionCodeOrLabel) return "";
  const result = assembleInvestigationSentence(itemKey, optionCodeOrLabel, detailInputs);
  return result.sentence;
}
