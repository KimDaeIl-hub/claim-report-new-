import { StandardPhrase } from "../../types";

/**
 * 표준 상용구 Seed ([DEMO] 예시 전용, 실제 회사 데이터 아님)
 * - 기존 StandardPhrase 구조 그대로 (ID·fieldKey·title·content 필수)
 */
export const PHRASE_SEEDS: StandardPhrase[] = [
  {
    id: "demo-phrase-001",
    fieldKey: "retainedSampleCheck",
    title: "[DEMO] 데모 보관품 상용구 (실제 회사 데이터 아님)",
    content: "[DEMO] 동일 제조번호 보관품을 확인한 결과, 특이사항은 확인되지 않았습니다. (실제 회사 데이터 아님)",
    category: "general",
    claimType: "이물",
    investigationItem: "보관품",
    resultType: "이상 없음",
    usageLocation: "보관품 점검",
    relatedProcess: "공통",
    relatedProductType: "전체",
    isActive: true,
    isCustom: true,
  },
  {
    id: "demo-phrase-002",
    fieldKey: "rootCause",
    title: "[DEMO] 데모 원인 상용구 (실제 회사 데이터 아님)",
    content: "[DEMO] 조사 결과는 추가 확인이 필요하며 단정하지 않습니다. (실제 회사 데이터 아님)",
    category: "general",
    claimType: "이물",
    investigationItem: "원인판정",
    resultType: "확인 불가",
    usageLocation: "원인 분석",
    relatedProcess: "공통",
    relatedProductType: "전체",
    isActive: true,
    isCustom: true,
  },
];
