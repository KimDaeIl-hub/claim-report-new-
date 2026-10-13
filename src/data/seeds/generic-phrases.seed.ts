import { StandardPhrase } from "../../types";

/**
 * 범용 표준 상용구 Seed (정적 문구, 원문 그대로 삽입용)
 *
 * 원칙:
 * - 결과·원인·수치·날짜·회사 사실을 미리 단정하지 않음 (확인/미확인 선택형으로만 제공)
 * - 숫자·단위·날짜·회사명·제품명 포함 금지 (작성자가 입력)
 * - 기존 StandardPhrase 스키마 필드만 사용, 새 필드 없음
 * - isCustom: true (표준/개인 구분은 기존 플래그 유지, ID prefix seed- 로 구분)
 */

interface GenericPhraseSeed {
  id: string;
  fieldKey: string;
  title: string;
  content: string;
  claimType?: string;
  investigationItem?: string;
  resultType?: string;
  usageLocation?: string;
  relatedProcess?: string;
  relatedProductType?: string;
}

const G: GenericPhraseSeed[] = [
  // ---------- A. 현품 분석 (sampleCondition) ----------
  { id: "seed-ph-sample-01", fieldKey: "sampleCondition", title: "현품 외관 확인", content: "소비자 제공 현품을 확인한 결과, 외관상 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "현품", resultType: "이상 없음", usageLocation: "현품 외관", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-sample-02", fieldKey: "sampleCondition", title: "현품 외관·내용물 확인", content: "소비자 제공 현품의 외관 및 내용물을 확인하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "전체", usageLocation: "현품 외관", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-sample-03", fieldKey: "sampleCondition", title: "현품 이상 현상 확인", content: "제공된 현품에서 해당 이상 현상을 확인하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "이상 확인", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-sample-04", fieldKey: "sampleCondition", title: "현품 특이사항 미확인", content: "제공된 현품에서 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "현품", resultType: "이상 없음", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- B. 보관품 확인 (retainedSampleCheck) ----------
  { id: "seed-ph-retained-01", fieldKey: "retainedSampleCheck", title: "보관품 확인 실시", content: "동일 제조번호 보관품을 확인하였습니다.", claimType: "전체", investigationItem: "보관품", resultType: "전체", usageLocation: "보관품 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-retained-02", fieldKey: "retainedSampleCheck", title: "보관품 특이사항 없음", content: "동일 제조번호 보관품 확인 결과 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "보관품", resultType: "이상 없음", usageLocation: "보관품 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-retained-03", fieldKey: "retainedSampleCheck", title: "보관품 재현 없음", content: "동일 제조번호 보관품에서는 해당 이상 현상이 재현되지 않았습니다.", claimType: "전체", investigationItem: "보관품", resultType: "이상 없음", usageLocation: "보관품 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-retained-04", fieldKey: "retainedSampleCheck", title: "보관품 외관·내용물 확인", content: "동일 제조번호 보관품의 외관 및 내용물을 확인하였습니다.", claimType: "전체", investigationItem: "보관품", resultType: "전체", usageLocation: "보관품 점검", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- C. 동일 제조번호 확인 ----------
  { id: "seed-ph-lot-01", fieldKey: "productionLogNote", title: "동일번호 제조·품질 이력 확인", content: "동일 제조번호 제품의 제조 및 품질관리 이력을 확인하였습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "전체", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-lot-02", fieldKey: "productionLogNote", title: "동일번호 이력 특이사항 없음", content: "동일 제조번호 제품의 제조 및 품질관리 이력 확인 결과 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "이상 없음", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-lot-03", fieldKey: "productionLogNote", title: "동일번호 제조기록 확인", content: "동일 제조번호 제품의 제조기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "전체", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-lot-04", fieldKey: "qualityTestRecord", title: "동일번호 품질검사 확인", content: "동일 제조번호 제품의 품질검사 결과를 확인하였습니다.", claimType: "전체", investigationItem: "품질검사", resultType: "전체", usageLocation: "품질검사", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-lot-05", fieldKey: "qualityTestRecord", title: "동일번호 관련 검사 확인", content: "동일 제조번호 제품에 대한 관련 검사 결과를 확인하였습니다.", claimType: "전체", investigationItem: "품질검사", resultType: "전체", usageLocation: "품질검사", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-lot-06", fieldKey: "priorClaimsCount", title: "동일번호 이전 클레임 이력 확인", content: "동일 제조번호의 이전 클레임 접수 이력을 확인하였습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "전체", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- D. 제조기록 확인 (productionLogNote) ----------
  { id: "seed-ph-record-01", fieldKey: "productionLogNote", title: "제조기록 확인", content: "해당 제조번호의 제조기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "전체", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-record-02", fieldKey: "productionLogNote", title: "제조기록 특이사항 없음", content: "제조기록 확인 결과 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "이상 없음", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-record-03", fieldKey: "productionLogNote", title: "제조·작업기록 확인", content: "해당 제조번호의 제조기록 및 작업기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조기록", resultType: "전체", usageLocation: "제조기록 점검", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- E. 원료 확인 (rawMaterialCheck) ----------
  { id: "seed-ph-material-01", fieldKey: "rawMaterialCheck", title: "원료 입고·사용 이력 확인", content: "해당 제조번호에 사용된 원료의 입고 및 사용 이력을 확인하였습니다.", claimType: "전체", investigationItem: "원부자재", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-material-02", fieldKey: "rawMaterialCheck", title: "원료 품질 특이사항 없음", content: "해당 제조번호에 사용된 원료의 품질 및 입고검사 결과 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "원부자재", resultType: "이상 없음", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-material-03", fieldKey: "rawMaterialCheck", title: "관련 원료 검사결과 확인", content: "관련 원료의 품질 및 입고검사 결과를 확인하였습니다.", claimType: "전체", investigationItem: "원부자재", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-material-04", fieldKey: "rawMaterialCheck", title: "원료 관련 기록 확인", content: "해당 제조번호에 사용된 원료의 관련 기록을 확인하였습니다.", claimType: "전체", investigationItem: "원부자재", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- F. 제조공정 확인 (processInvestigationNote) ----------
  { id: "seed-ph-process-01", fieldKey: "processInvestigationNote", title: "제조공정·작업기록 확인", content: "해당 제조번호의 제조공정 및 작업기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-process-02", fieldKey: "processInvestigationNote", title: "관련 공정 작업기록 확인", content: "관련 제조공정의 작업기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-process-03", fieldKey: "processInvestigationNote", title: "작업조건·관리기록 확인", content: "해당 공정의 작업조건 및 관리기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- G. 품질검사 (qualityTestRecord) ----------
  { id: "seed-ph-qc-01", fieldKey: "qualityTestRecord", title: "품질검사 결과 확인", content: "해당 제조번호의 품질검사 결과를 확인하였습니다.", claimType: "전체", investigationItem: "품질검사", resultType: "전체", usageLocation: "품질검사", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-qc-02", fieldKey: "qualityTestRecord", title: "제조 당시 품질검사 확인", content: "제조 당시 실시한 품질검사 결과를 확인하였습니다.", claimType: "전체", investigationItem: "품질검사", resultType: "전체", usageLocation: "품질검사", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-qc-03", fieldKey: "qualityTestRecord", title: "품질검사 특이사항 없음", content: "관련 품질검사 결과에서 특이사항은 확인되지 않았습니다.", claimType: "전체", investigationItem: "품질검사", resultType: "이상 없음", usageLocation: "품질검사", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- H. 포장/용기 + 공정별 (filtrationAnalysis / cleaningAnalysis / processInvestigationNote) ----------
  { id: "seed-ph-pack-01", fieldKey: "processInvestigationNote", title: "용기·포장 상태 확인", content: "해당 제조번호의 용기 및 포장 상태를 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },
  { id: "seed-ph-pack-02", fieldKey: "processInvestigationNote", title: "포장공정·검사기록 확인", content: "포장공정 및 관련 검사기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },
  { id: "seed-ph-pack-03", fieldKey: "cleaningAnalysis", title: "용기·포장재 검사결과 확인", content: "용기 및 포장재 관련 검사 결과를 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },
  { id: "seed-ph-filter-01", fieldKey: "filtrationAnalysis", title: "여과공정 확인", content: "해당 제조번호의 여과공정 및 여과망 관리 상태를 확인하였습니다.", claimType: "이물", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "여과", relatedProductType: "전체" },
  { id: "seed-ph-sterilize-01", fieldKey: "processInvestigationNote", title: "살균공정 확인", content: "해당 제조번호의 살균공정 조건 및 기록을 확인하였습니다.", claimType: "변질", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "UHT", relatedProductType: "전체" },
  { id: "seed-ph-fill-01", fieldKey: "processInvestigationNote", title: "충전공정 확인", content: "해당 제조번호의 충전공정 조건 및 기록을 확인하였습니다.", claimType: "전체", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "충전", relatedProductType: "전체" },
  { id: "seed-ph-cap-01", fieldKey: "processInvestigationNote", title: "캡핑공정 확인", content: "해당 제조번호의 캡핑공정 조건 및 기록을 확인하였습니다.", claimType: "누액", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "캡핑", relatedProductType: "전체" },

  // ---------- I. 표시/인쇄 (processInvestigationNote) ----------
  { id: "seed-ph-label-01", fieldKey: "processInvestigationNote", title: "표시·인쇄 상태 확인", content: "해당 제조번호의 표시 및 인쇄 상태를 확인하였습니다.", claimType: "표시오류", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },
  { id: "seed-ph-label-02", fieldKey: "processInvestigationNote", title: "표시·인쇄 특이사항 없음", content: "해당 제조번호의 표시 및 인쇄 상태를 확인한 결과 특이사항은 없습니다.", claimType: "표시오류", investigationItem: "제조공정", resultType: "이상 없음", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },
  { id: "seed-ph-label-03", fieldKey: "processInvestigationNote", title: "소비기한·제조번호 인쇄 확인", content: "소비기한 및 제조번호 인쇄 상태를 확인하였습니다.", claimType: "표시오류", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },
  { id: "seed-ph-label-04", fieldKey: "processInvestigationNote", title: "인쇄 작업기록 확인", content: "포장공정의 인쇄 관련 작업기록을 확인하였습니다.", claimType: "표시오류", investigationItem: "제조공정", resultType: "전체", usageLocation: "분석 내용", relatedProcess: "포장", relatedProductType: "전체" },

  // ---------- J. 분석/시험 실시 ----------
  { id: "seed-ph-test-01", fieldKey: "magnifierResult", title: "확대경 분석 실시", content: "제공된 현품에 대해 확대경 관찰을 실시하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "전체", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-test-02", fieldKey: "ftirSummary", title: "이물 분석 실시", content: "해당 이물에 대한 분석을 실시하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "전체", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-test-03", fieldKey: "sampleCondition", title: "분석결과 종합 검토", content: "분석 결과를 종합하여 관련 특성을 검토하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "전체", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-test-04", fieldKey: "physicochemicalSummary", title: "이화학 시험 실시", content: "관련 항목에 대해 이화학 시험을 실시하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "전체", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-test-05", fieldKey: "catalaseResult", title: "가열 여부 판별 시험", content: "가열 여부를 판별하기 위한 시험을 실시하였습니다.", claimType: "전체", investigationItem: "현품", resultType: "전체", usageLocation: "현품 분석", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- K. 원인 미확인 (rootCause, 중립 표현) ----------
  { id: "seed-ph-cause-unknown-01", fieldKey: "rootCause", title: "직접 원인 미확인", content: "조사 결과 해당 현상의 직접적인 발생 원인은 확인되지 않았습니다.", claimType: "전체", investigationItem: "원인판정", resultType: "확인 불가", usageLocation: "원인 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-cause-unknown-02", fieldKey: "rootCause", title: "원인 특정 곤란", content: "확인된 자료만으로는 발생 원인을 특정하기 어려웠습니다.", claimType: "전체", investigationItem: "원인판정", resultType: "확인 불가", usageLocation: "원인 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-cause-unknown-03", fieldKey: "rootCause", title: "기록·현품 대조 후 미확인", content: "관련 기록 및 현품을 확인하였으나 명확한 원인은 확인되지 않았습니다.", claimType: "전체", investigationItem: "원인판정", resultType: "확인 불가", usageLocation: "원인 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-cause-unknown-04", fieldKey: "rootCause", title: "조사 범위 내 미확인", content: "조사 범위 내에서 직접적인 원인을 확인하기 어려웠습니다.", claimType: "전체", investigationItem: "원인판정", resultType: "확인 불가", usageLocation: "원인 분석", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- L. 원인 확인 구조형 (○○ placeholder, 구체 원인 없음) ----------
  { id: "seed-ph-cause-struct-01", fieldKey: "rootCause", title: "과정 관련 확인 구조문", content: "조사 결과, 해당 이상은 ○○ 과정과 관련된 것으로 확인되었습니다.", claimType: "전체", investigationItem: "원인판정", resultType: "이상 확인", usageLocation: "원인 분석", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-cause-struct-02", fieldKey: "rootCause", title: "발생 위치 확인 구조문", content: "조사 결과, 해당 현상은 ○○에서 발생한 것으로 확인되었습니다.", claimType: "전체", investigationItem: "원인판정", resultType: "이상 확인", usageLocation: "원인 분석", relatedProcess: "공통", relatedProductType: "전체" },

  // ---------- M. 재발방지/관리 (preventiveAction, 조사·작성용 표현) ----------
  { id: "seed-ph-act-01", fieldKey: "preventiveAction", title: "관련 공정 재점검", content: "관련 공정에 대한 관리상태를 재점검하였습니다.", claimType: "전체", investigationItem: "재발방지", resultType: "전체", usageLocation: "재발방지", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-act-02", fieldKey: "preventiveAction", title: "작업자 공유", content: "관련 작업자에게 해당 내용을 공유하였습니다.", claimType: "전체", investigationItem: "재발방지", resultType: "전체", usageLocation: "재발방지", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-act-03", fieldKey: "preventiveAction", title: "재발방지 관리 재점검", content: "동일 사례의 재발 방지를 위해 관련 관리사항을 재점검하였습니다.", claimType: "전체", investigationItem: "재발방지", resultType: "전체", usageLocation: "재발방지", relatedProcess: "공통", relatedProductType: "전체" },
  { id: "seed-ph-act-04", fieldKey: "preventiveAction", title: "추가 확인 필요", content: "해당 항목에 대한 추가 확인이 필요합니다.", claimType: "전체", investigationItem: "재발방지", resultType: "전체", usageLocation: "재발방지", relatedProcess: "공통", relatedProductType: "전체" },
];

export const GENERIC_PHRASE_SEEDS: StandardPhrase[] = G.map((g) => ({
  id: g.id,
  fieldKey: g.fieldKey,
  title: g.title,
  content: g.content,
  category: "general",
  claimType: g.claimType,
  investigationItem: g.investigationItem,
  resultType: g.resultType,
  usageLocation: g.usageLocation,
  relatedProcess: g.relatedProcess,
  relatedProductType: g.relatedProductType,
  isActive: true,
  isCustom: true,
}));
