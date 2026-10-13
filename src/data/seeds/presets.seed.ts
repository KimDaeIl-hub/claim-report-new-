import { ClaimPreset } from "../../types";

/**
 * 범용 조사 프리셋 (제품 무관, 조사 실행 가이드용)
 * - data에는 결과·원인·결론을 절대 미리 입력하지 않음 (조사 항목 구성 + 확인 지시만)
 * - 적용 시 사용자 입력·사진은 mergePresetData 보존 규칙을 따름
 * - linkedPhraseIds는 기존 등록 상용구 ID만 참조
 */
export const GENERIC_PRESET_SEEDS: ClaimPreset[] = [
  {
    id: "seed-preset-foreign-metal",
    name: "[범용] 금속 이물 조사",
    description:
      "금속성 이물 혼입 의심 시 확인 순서: 1. 현품 외관·이물 위치 확인 2. 자성 여부 확인 3. 동일 Lot 보관품 대조 4. 제조기록(금속검출기 동작일지) 확인 5. 여과·충전 공정 점검 6. 원부자재 입고검사 확인 7. 필요 시 성분 분석 8. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-glass-sample-1", "phrase-retained-lot-normal", "principle-vis-kd-1", "seed-ph-sample-02"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 충전 → 캡핑 → 포장",
        processSteps: ["원료 투입", "배합", "여과", "충전", "캡핑", "포장"],
        filtrationAnalysis: "여과망 Mesh 규격·차압 기록 및 세척 이력을 확인한다.",
        cleaningAnalysis: "설비 세척 상태 및 이물 배출 이력을 확인한다.",
        criticalControlPoint: "금속검출기 동작 기록을 확인한다.",
        highlightedStep: "여과 및 충전 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-foreign-plastic",
    name: "[범용] 플라스틱 이물 조사",
    description:
      "플라스틱 조각·필름 혼입 의심 시 확인 순서: 1. 현품 외관·이물 형태 확인 2. 동일 Lot 보관품 대조 3. 제조기록 확인 4. 포장·충전 공정 점검 5. 원부자재 포장재 입고검사 확인 6. 필요 시 재질 대조 분석 7. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-glass-sample-1", "phrase-retained-common-1", "principle-vis-kd-1", "seed-ph-sample-02"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 충전 → 캡핑 → 포장",
        processSteps: ["원료 투입", "배합", "여과", "충전", "캡핑", "포장"],
        filtrationAnalysis: "여과망 건전성 및 포장재 파편 유입 경로를 확인한다.",
        cleaningAnalysis: "라인 세척 시 포장재 잔류물 여부를 확인한다.",
        criticalControlPoint: "충전·포장 구간의 이물 관리점을 확인한다.",
        highlightedStep: "충전 및 포장 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-foreign-glass",
    name: "[범용] 유리 파편 조사",
    description:
      "유리 파편 혼입 의심 시 확인 순서: 1. 현품 파편 형태·타격점 확인 2. 동일 Lot 보관품 대조 3. 제조기록 확인 4. 용기 세척·충전 공정 점검 5. 용기 입고검사 확인 6. 필요 시 파편 대조 분석 7. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-glass-sample-1", "phrase-retained-lot-normal", "principle-glass-ripple-1"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "용기 입고 → 세척 → 충전 → 캡핑 → 포장",
        processSteps: ["용기 입고", "세척", "충전", "캡핑", "포장"],
        filtrationAnalysis: "해당 없음(용기 기인 의심 시 세척 공정 중심 확인).",
        cleaningAnalysis: "용기 세척 압력·이물 배출 이력을 확인한다.",
        criticalControlPoint: "용기 세척 및 충전 구간의 파손 관리점을 확인한다.",
        highlightedStep: "용기 세척 및 충전 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-foreign-fiber",
    name: "[범용] 섬유·종이류 이물 조사",
    description:
      "섬유·종이·머리카락 혼입 의심 시 확인 순서: 1. 현품 이물 형태 확인 2. 동일 Lot 보관품 대조 3. 제조기록 확인 4. 작업장 복장·포장재 개봉 공정 점검 5. 필요 시 현미경 관찰 6. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-glass-sample-1", "phrase-retained-common-1"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 충전 → 포장",
        processSteps: ["원료 투입", "배합", "여과", "충전", "포장"],
        filtrationAnalysis: "여과 단계의 섬유상 이물 차단 상태를 확인한다.",
        cleaningAnalysis: "작업장 청결 및 복장 관리 상태를 확인한다.",
        criticalControlPoint: "원료 개봉·투입 구간의 이물 관리점을 확인한다.",
        highlightedStep: "원료 투입 및 여과 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-foreign-insect",
    name: "[범용] 곤충·벌레 혼입 조사",
    description:
      "곤충 혼입 의심 시 확인 순서: 1. 현품 곤충 형태 확인 2. 카탈라아제 등 가열 여부 판별 시험 검토 3. 동일 Lot 보관품 대조 4. 제조기록(살균 조건) 확인 5. 방충·세척 관리 점검 6. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-insect-sample-1", "phrase-insect-cat-1", "principle-catalase-heat-1"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 살균 → 저장 → 충전 → 포장",
        processSteps: ["원료 투입", "배합", "살균", "저장", "충전", "포장"],
        filtrationAnalysis: "여과 단계의 생물체 차단 상태를 확인한다.",
        cleaningAnalysis: "방충망·트랩 관리 및 세척 이력을 확인한다.",
        criticalControlPoint: "살균 조건(CCP) 준수 여부를 확인한다.",
        highlightedStep: "살균 및 충전 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-foreign-sediment",
    name: "[범용] 탄화물·침전물 조사",
    description:
      "탄화물·침전·결정 의심 시 확인 순서: 1. 현품 침전 형태·위치 확인 2. 동일 Lot 보관품 대조 3. 제조기록 확인 4. 원료 용해·배합 상태 확인 5. 여과·열처리 공정 점검 6. 필요 시 성분 분석 7. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-sedi-sample-1", "phrase-sedi-dissolve-1", "principle-hot-dissolve-1", "seed-ph-test-03"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 열처리 → 저장 → 충전",
        processSteps: ["원료 투입", "배합", "여과", "열처리", "저장", "충전"],
        filtrationAnalysis: "여과 조건 및 원료 미용해분 잔류 가능성을 확인한다.",
        cleaningAnalysis: "열처리 설비 스케일·탄화물 관리 상태를 확인한다.",
        criticalControlPoint: "배합 용해 조건 및 열처리 조건을 확인한다.",
        highlightedStep: "배합 및 열처리 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-foreign-unknown",
    name: "[범용] 미확인 이물 종합 조사",
    description:
      "정체 불명 이물 종합 확인 순서: 1. 현품 외관·이물 정밀 관찰 2. 확대경·현미경 관찰 검토 3. 동일 Lot 보관품 대조 4. 제조기록 확인 5. 여과·충전·포장 공정 점검 6. 원부자재 입고검사 확인 7. 필요 시 기기 분석 8. 결과 종합",
    category: "범용",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["phrase-glass-sample-1", "phrase-retained-lot-normal", "principle-vis-kd-1", "seed-ph-sample-02"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 충전 → 캡핑 → 포장",
        processSteps: ["원료 투입", "배합", "여과", "충전", "캡핑", "포장"],
        filtrationAnalysis: "전 공정 구간의 이물 차단 상태를 확인한다.",
        cleaningAnalysis: "설비·용기 세척 상태를 확인한다.",
        criticalControlPoint: "이물 관리 CCP 전반을 확인한다.",
        highlightedStep: "여과·충전·포장 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-spoilage-odor",
    name: "[범용] 변질·이상취 조사",
    description:
      "변질·이상취 의심 시 확인 순서: 1. 현품 관능 상태 확인 2. 동일 Lot 보관품 관능·이화학 대조 3. 제조기록(살균 조건) 확인 4. 살균·저장 공정 점검 5. 유통·보관 조건 검토 6. 필요 시 미생물 시험 검토 7. 결과 종합",
    category: "범용",
    subCategory: "spoilage",
    isCustom: true,
    linkedPhraseIds: ["phrase-sedi-sample-1", "phrase-retained-lot-normal", "seed-ph-qc-01"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "배합 → 살균 → 저장 → 충전 → 캡핑",
        processSteps: ["배합", "살균", "저장", "충전", "캡핑"],
        filtrationAnalysis: "해당 없음(미생물·살균 중심 확인).",
        cleaningAnalysis: "살균기·저장탱크 세척(CIP) 이력을 확인한다.",
        criticalControlPoint: "살균 조건 및 밀봉 상태(CCP)를 확인한다.",
        highlightedStep: "살균 및 저장 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-spoilage-turbid",
    name: "[범용] 혼탁·침전·부유물 조사",
    description:
      "혼탁·침전·부유물 확인 순서: 1. 현품 외관·침전 형태·위치 확인 2. 내용물 상태 확인 3. 동일 Lot 보관품 대조 4. 제조기록 확인 5. 원료 투입·배합 상태 확인 6. 여과·열처리 공정 점검 7. 완제품 품질검사 결과 확인 8. 필요 시 이물 분석 9. 동일 Lot 출하 현황 확인 10. 결과 종합",
    category: "범용",
    subCategory: "spoilage",
    isCustom: true,
    linkedPhraseIds: ["phrase-sedi-sample-1", "phrase-sedi-dissolve-1", "phrase-retained-common-1", "seed-ph-lot-04"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 열처리 → 저장 → 충전",
        processSteps: ["원료 투입", "배합", "여과", "열처리", "저장", "충전"],
        filtrationAnalysis: "여과 조건 및 미용해분 여부를 확인한다.",
        cleaningAnalysis: "배합·저장 설비 세척 상태를 확인한다.",
        criticalControlPoint: "배합 용해 조건 및 열처리 조건을 확인한다.",
        highlightedStep: "배합·여과·열처리 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-spoilage-discolor",
    name: "[범용] 변색·층분리 조사",
    description:
      "변색·층분리 확인 순서: 1. 현품 색상·층 상태 확인 2. 동일 Lot 보관품 대조 3. 제조기록 확인 4. 원료 특성·배합비 확인 5. 열처리·저장 조건 점검 6. 결과 종합",
    category: "범용",
    subCategory: "spoilage",
    isCustom: true,
    linkedPhraseIds: ["phrase-sedi-sample-1", "phrase-retained-lot-normal", "seed-ph-sample-02"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 열처리 → 저장 → 충전",
        processSteps: ["원료 투입", "배합", "열처리", "저장", "충전"],
        filtrationAnalysis: "해당 없음(원료·배합 중심 확인).",
        cleaningAnalysis: "배합 설비 세척 상태를 확인한다.",
        criticalControlPoint: "원료 배합비 및 열처리 조건을 확인한다.",
        highlightedStep: "배합 및 저장 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-volume-shortage",
    name: "[범용] 내용량 부족·중량 이상 조사",
    description:
      "내용량·중량 이상 확인 순서: 1. 현품 잔여량·중량 측정 2. 동일 Lot 보관품 중량 대조 3. 제조기록(충전량 설정값) 확인 4. 충전 공정(유량계·밸브) 점검 5. 중량선별기 동작 기록 확인 6. 결과 종합",
    category: "범용",
    subCategory: "quantity",
    isCustom: true,
    linkedPhraseIds: ["phrase-short-weight-1", "phrase-fill-measure-1", "principle-fill-tolerance-1"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "충전 → 중량선별 → 포장",
        processSteps: ["충전", "중량선별", "포장"],
        filtrationAnalysis: "해당 없음(충전·계량 중심 확인).",
        cleaningAnalysis: "해당 없음(충전·계량 중심 확인).",
        criticalControlPoint: "충전량 설정 및 중량선별기 허용오차를 확인한다.",
        highlightedStep: "충전 및 중량선별 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-leak-seal",
    name: "[범용] 누액·밀봉 불량 조사",
    description:
      "누액·밀봉 불량 확인 순서: 1. 현품 누출 부위·밀봉 상태 확인 2. 동일 Lot 보관품 밀봉 대조 3. 제조기록(캡핑 토크) 확인 4. 캡핑·실링 공정 점검 5. 용기·캡 입고검사 확인 6. 필요 시 기밀 시험 검토 7. 결과 종합",
    category: "범용",
    subCategory: "breakage",
    isCustom: true,
    linkedPhraseIds: ["phrase-mold-vacuum-1", "principle-vacuum-gauge-1", "seed-ph-pack-02"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "충전 → 캡핑 → 실링 검사 → 포장",
        processSteps: ["충전", "캡핑", "실링 검사", "포장"],
        filtrationAnalysis: "해당 없음(밀봉 중심 확인).",
        cleaningAnalysis: "캡핑부 이물 끼임 여부를 확인한다.",
        criticalControlPoint: "캡핑 토크 및 실링 검사 기준을 확인한다.",
        highlightedStep: "캡핑 및 실링 검사 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-leak-cap",
    name: "[범용] 캡 불량·헛돎 조사",
    description:
      "캡 불량·헛돎 확인 순서: 1. 현품 캡 체결 상태 확인 2. 동일 Lot 보관품 캡 대조 3. 제조기록(캡핑 조건) 확인 4. 캡핑기 롤러·척 점검 5. 캡 입고검사 확인 6. 결과 종합",
    category: "범용",
    subCategory: "cap",
    isCustom: true,
    linkedPhraseIds: ["phrase-cap-plastic-ftir-1", "phrase-retained-common-1", "seed-ph-cap-01"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "캡 입고 → 공급 → 캡핑 → 검사",
        processSteps: ["캡 입고", "공급", "캡핑", "검사"],
        filtrationAnalysis: "해당 없음(캡핑 중심 확인).",
        cleaningAnalysis: "캡 공급 라인 청정 상태를 확인한다.",
        criticalControlPoint: "캡핑 토크 및 체결 상태를 확인한다.",
        highlightedStep: "캡핑 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-fill-defect",
    name: "[범용] 충전 불량 조사",
    description:
      "충전 불량 확인 순서: 1. 현품 충전 상태 확인 2. 동일 Lot 보관품 대조 3. 제조기록(충전 설정) 확인 4. 충전 노즐·밸브 점검 5. 결과 종합",
    category: "범용",
    subCategory: "fill",
    isCustom: true,
    linkedPhraseIds: ["phrase-fill-measure-1", "principle-fill-tolerance-1"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "배합 → 충전 → 검사",
        processSteps: ["배합", "충전", "검사"],
        filtrationAnalysis: "해당 없음(충전 중심 확인).",
        cleaningAnalysis: "충전 노즐 세척 상태를 확인한다.",
        criticalControlPoint: "충전 설정값 및 노즐 상태를 확인한다.",
        highlightedStep: "충전 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-pack-container",
    name: "[범용] 용기 파손·변형 조사",
    description:
      "용기 파손·변형 확인 순서: 1. 현품 파손·변형 부위 확인 2. 동일 Lot 보관품 외관 대조 3. 제조기록 확인 4. 충전·포장 취급 공정 점검 5. 용기 입고검사 확인 6. 유통 취급 조건 검토 7. 결과 종합",
    category: "범용",
    subCategory: "breakage",
    isCustom: true,
    linkedPhraseIds: ["phrase-glass-sample-1", "phrase-retained-common-1", "seed-ph-pack-01"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "용기 입고 → 충전 → 포장 → 출하",
        processSteps: ["용기 입고", "충전", "포장", "출하"],
        filtrationAnalysis: "해당 없음(용기·취급 중심 확인).",
        cleaningAnalysis: "용기 세척·취급 상태를 확인한다.",
        criticalControlPoint: "용기 강도 및 취급 기준을 확인한다.",
        highlightedStep: "충전 및 포장 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-pack-pouch",
    name: "[범용] 파우치 파손·실링 불량 조사",
    description:
      "파우치 파손·실링 불량 확인 순서: 1. 현품 파손·실링부 확인 2. 동일 Lot 보관품 대조 3. 제조기록(실링 조건) 확인 4. 실링 공정(온도·압력·시간) 점검 5. 포장재 입고검사 확인 6. 결과 종합",
    category: "범용",
    subCategory: "breakage",
    isCustom: true,
    linkedPhraseIds: ["phrase-hotmelt-sample-1", "principle-case-impression-1"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "충전 → 실링 → 검사 → 포장",
        processSteps: ["충전", "실링", "검사", "포장"],
        filtrationAnalysis: "해당 없음(실링 중심 확인).",
        cleaningAnalysis: "실링부 이물 끼임 여부를 확인한다.",
        criticalControlPoint: "실링 온도·압력·시간 조건을 확인한다.",
        highlightedStep: "실링 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-pack-print",
    name: "[범용] 표시·인쇄 이상 조사",
    description:
      "소비기한·제조번호·라벨 이상 확인 순서: 1. 현품 인쇄·부착 상태 확인 2. 동일 Lot 보관품 표시 대조 3. 제조기록(날인 조건) 확인 4. 날인·라벨 공정 점검 5. 결과 종합",
    category: "범용",
    subCategory: "packaging",
    isCustom: true,
    linkedPhraseIds: ["phrase-label-sample-1", "phrase-retained-common-1", "seed-ph-label-01"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "포장 → 날인 → 검사",
        processSteps: ["포장", "날인", "검사"],
        filtrationAnalysis: "해당 없음(표시 중심 확인).",
        cleaningAnalysis: "날인 헤드 오염 여부를 확인한다.",
        criticalControlPoint: "날인 조건 및 검사기 동작을 확인한다.",
        highlightedStep: "날인 및 검사 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-process-sterilize",
    name: "[범용] 살균·충전·배합·여과 공정 점검",
    description:
      "공정 조건 의심 시 확인 순서: 1. 제조기록(공정 조건 기록) 확인 2. 설비 운전 데이터 확인 3. 세척(CIP) 이력 확인 4. 동일 Lot 보관품 대조 5. 완제품 품질검사 결과 확인 6. 결과 종합",
    category: "범용",
    subCategory: "spoilage",
    isCustom: true,
    linkedPhraseIds: ["phrase-retained-common-1", "phrase-retained-lot-normal", "seed-ph-sterilize-01"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "원료 투입 → 배합 → 여과 → 살균 → 저장 → 충전",
        processSteps: ["원료 투입", "배합", "여과", "살균", "저장", "충전"],
        filtrationAnalysis: "여과 조건 및 기록을 확인한다.",
        cleaningAnalysis: "CIP·세척 이력을 확인한다.",
        criticalControlPoint: "살균 조건 등 CCP 기록을 확인한다.",
        highlightedStep: "배합·여과·살균 공정",
      },
      lotHistory: { skipped: false } as never,
    },
  },
  {
    id: "seed-preset-process-storage",
    name: "[범용] 보관품·품질검사 이상 대응",
    description:
      "보관품·성적서 이상 시 확인 순서: 1. 동일 Lot 보관품 재확인 2. 제조기록 확인 3. 완제품 성적서 전수 확인 4. 동일 Lot 출하 현황·이전 클레임 확인 5. 저장 조건 검토 6. 결과 종합",
    category: "범용",
    subCategory: "all",
    isCustom: true,
    linkedPhraseIds: ["phrase-retained-lot-normal", "phrase-retained-common-1", "seed-ph-retained-01"],
    data: {
      manufacturingProcess: {
        skipped: false,
        processFlow: "저장 → 출하 검사 → 출하",
        processSteps: ["저장", "출하 검사", "출하"],
        filtrationAnalysis: "해당 없음(보관·검사 중심 확인).",
        cleaningAnalysis: "보관 창고 청결 상태를 확인한다.",
        criticalControlPoint: "보관 조건 및 출하 검사 기준을 확인한다.",
        highlightedStep: "저장 및 출하 검사",
      },
      lotHistory: { skipped: false } as never,
    },
  },
];
export const PRESET_SEEDS: ClaimPreset[] = [
  {
    id: "demo-preset-001",
    name: "[DEMO] 데모 이물 조사 프리셋 (실제 회사 데이터 아님)",
    description: "[DEMO] Seed 구조 검증용 예시 프리셋 (실제 회사 데이터 아님)",
    category: "이물",
    subCategory: "foreign",
    isCustom: true,
    linkedPhraseIds: ["demo-phrase-001"],
    data: {
      productInfo: {
        productName: "[DEMO] 데모 혼합음료 100ml (실제 회사 데이터 아님)",
        lotNumber: "",
        manufactureDate: "",
        expiryDate: "",
        manufacturer: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
        packageType: "유리병",
      },
    },
  },
];
