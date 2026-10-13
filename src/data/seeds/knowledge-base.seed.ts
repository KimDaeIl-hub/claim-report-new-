import { ClaimKnowledgeItem } from "../../types/claimKnowledge";
import { INITIAL_REPORT_DATA } from "../presets";
import { ReportData } from "../../types";
import { PAST_CLAIM_SEEDS } from "./past-claims.seed";

/**
 * 지식 베이스 Seed ([DEMO] 예시 전용, 실제 회사 데이터 아님)
 * - 미승인 항목으로 등록되어 지식 관리 목록에서 확인 가능
 * - 과거 유사사례 검색에는 승인 항목만 노출되므로 검색 오염 없음
 */

const GENERIC = "[범용]";

function buildMethodSnapshot(id: string): ReportData {
  const base = JSON.parse(JSON.stringify(INITIAL_REPORT_DATA)) as ReportData;
  base.id = id;
  base.docNumber = `${GENERIC} 예시 문서번호 (실제 회사 데이터 아님)`;
  base.productInfo = {
    ...base.productInfo,
    productName: `${GENERIC} 예시 제품 (실제 회사 데이터 아님)`,
    lotNumber: `${GENERIC} 예시 (실제 Lot 아님)`,
    manufactureDate: "",
    expiryDate: "",
    manufacturer: `${GENERIC} 예시 (실제 회사 데이터 아님)`,
  };
  base.customerClaim = {
    ...base.customerClaim,
    receivedAt: "",
    customerName: "",
    contact: "",
    claimDetails: "",
    customerPhotos: [],
  };
  base.lotHistory = {
    ...base.lotHistory,
    retainedSampleCheck: "",
    productionLogNote: "",
    qualityTestRecord: "",
    priorClaimsCount: "",
    retainedSamplePhotos: [],
  };
  base.rootCauseAndActions = {
    ...base.rootCauseAndActions,
    rootCause: "",
    preventiveMeasures: "",
  };
  base.conclusion = { summaryPoints: [], apologyText: "", closingRemarks: "" };
  base.attachments = { attachment1Photos: [], attachment2Photos: [], attachment3Photos: [] };
  return base;
}

interface GuideSeedDef {
  id: string;
  claimType: string;
  scope: string;
  investigationItems: string[];
  investigationMethods: string[];
  relatedProcesses: string[];
  relatedEquipments: string[];
  analysisMethods: string[];
  conclusionSummary: string[];
}

const GUIDE_DEFS: GuideSeedDef[] = [
  {
    id: "seed-kb-foreign-001",
    claimType: "이물",
    scope: "이물 조사 시 확인 순서와 관점",
    investigationItems: ["현품 확인", "동일 제조번호 확인", "제조기록 확인", "원부자재 확인", "제조공정 확인", "품질검사 확인"],
    investigationMethods: ["이물의 형태·색상·크기·경도·표면 상태 확인", "제품과의 접촉 상태 및 혼입 위치 확인", "추가 분석이 필요한 경우 시료 상태 기록"],
    relatedProcesses: ["원료 투입", "배합", "여과", "열처리", "충전", "밀봉", "포장"],
    relatedEquipments: ["여과 설비", "충전 설비", "검사 설비"],
    analysisMethods: ["육안 검사", "확대경 관찰", "현미경 관찰", "성분 분석"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-spoilage-001",
    claimType: "변질",
    scope: "변색·변질·이취 등 내용 이상 조사 관점 (원인 단정 없음, 가능성 수준)",
    investigationItems: ["현품 상태 확인", "보관품 확인", "외관·관능 상태 확인", "제조기록 확인", "원료 기록 확인", "제조공정 확인", "품질검사 확인"],
    investigationMethods: ["관능 상태 기록", "보관품 대조", "살균·저장 조건 관련 기록 확인", "필요 시 분석 실시"],
    relatedProcesses: ["배합", "열처리", "저장", "충전"],
    relatedEquipments: ["살균 설비", "저장 설비"],
    analysisMethods: ["육안 검사", "관능 검사", "이화학 시험"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-leak-001",
    claimType: "누액",
    scope: "누액 조사 관점 (원인 특정 없음)",
    investigationItems: ["누액 위치 확인", "용기·포장 상태 확인", "캡·밀봉부 상태 확인", "보관품 확인", "충전공정 확인", "밀봉·캡핑공정 확인", "포장공정 확인", "제조·검사기록 확인"],
    investigationMethods: ["누출 부위 기록", "밀봉 상태 외관 확인", "관련 작업기록 대조"],
    relatedProcesses: ["충전", "밀봉", "캡핑", "포장"],
    relatedEquipments: ["충전 설비", "밀봉 설비"],
    analysisMethods: ["육안 검사", "밀봉 상태 확인"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-breakage-001",
    claimType: "누액",
    scope: "용기·포장 파손 조사 관점 (파손 원인 생성 없음)",
    investigationItems: ["파손 위치 확인", "파손 형태 확인", "파손면 상태 확인", "외부 충격 흔적 확인", "보관품 확인", "자재 관련 기록 확인", "충전·밀봉공정 확인", "포장공정 확인", "출하 전 검사 확인"],
    investigationMethods: ["파손 부위 기록", "보관품 외관 대조", "취급 이력 확인"],
    relatedProcesses: ["충전", "밀봉", "포장"],
    relatedEquipments: ["충전 설비", "포장 설비"],
    analysisMethods: ["육안 검사", "외관 검사"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-volume-001",
    claimType: "내용량",
    scope: "내용량·용량 이상 조사 관점 (수치 생성 없음)",
    investigationItems: ["현품 상태 확인", "보관품 확인", "제조기록 확인", "충전 관련 기록 확인", "내용량 검사기록 확인", "품질검사 결과 확인", "제조공정 확인"],
    investigationMethods: ["잔여량·중량 측정 기록", "보관품 대조", "충전 설정값 대조"],
    relatedProcesses: ["배합", "충전"],
    relatedEquipments: ["충전 설비", "검사 설비"],
    analysisMethods: ["육안 검사", "중량 측정"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-label-001",
    claimType: "표시오류",
    scope: "표시·인쇄 이상 조사 관점 (실제 인쇄값 생성 없음)",
    investigationItems: ["표시사항 확인", "인쇄 상태 확인", "소비기한 확인", "제조번호 확인", "기타 인쇄정보 확인", "보관품 확인", "표시공정 확인", "포장작업 기록 확인", "출하 전 검사기록 확인"],
    investigationMethods: ["인쇄 상태 기록", "보관품 표시 대조", "날인 조건 기록 확인"],
    relatedProcesses: ["포장"],
    relatedEquipments: ["표시 설비", "검사 설비"],
    analysisMethods: ["육안 검사", "외관 검사"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-appearance-001",
    claimType: "전체",
    scope: "외관 이상 조사 관점",
    investigationItems: ["현품 외관 확인", "보관품 외관 확인", "제조기록 확인", "제조공정 확인", "품질검사 확인"],
    investigationMethods: ["외관 상태 기록", "보관품 대조"],
    relatedProcesses: ["충전", "포장"],
    relatedEquipments: ["검사 설비"],
    analysisMethods: ["육안 검사", "외관 검사"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-filling-001",
    claimType: "누액",
    scope: "충전·밀봉 관련 이상 조사 관점",
    investigationItems: ["충전 기록 확인", "밀봉 상태 확인", "보관품 확인", "검사결과 확인"],
    investigationMethods: ["충전 조건 기록 확인", "밀봉 외관 확인"],
    relatedProcesses: ["충전", "밀봉", "캡핑"],
    relatedEquipments: ["충전 설비", "밀봉 설비"],
    analysisMethods: ["육안 검사"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-process-001",
    claimType: "전체",
    scope: "제조공정 조사 관점 (배합→여과→열처리→충전→밀봉→포장→검사)",
    investigationItems: ["배합 기록 확인", "원료 투입기록 확인", "작업기록 확인", "여과 수행 여부 확인", "열처리 관련 기록 확인", "충전 관련 기록 확인", "검사결과 확인", "밀봉 상태 확인", "포장 상태 확인", "검사결과·기록 확인"],
    investigationMethods: ["공정별 작업기록 대조", "설비 운전 기록 확인"],
    relatedProcesses: ["배합", "여과", "열처리", "충전", "밀봉", "포장"],
    relatedEquipments: ["배합 설비", "여과 설비", "살균 설비", "충전 설비", "밀봉 설비", "포장 설비"],
    analysisMethods: ["육안 검사"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-qc-001",
    claimType: "전체",
    scope: "품질검사 관련 이상 조사 관점",
    investigationItems: ["검사결과 확인", "보관품 확인", "제조기록 확인", "출하 현황 확인"],
    investigationMethods: ["성적서 대조", "보관품 재확인"],
    relatedProcesses: ["저장"],
    relatedEquipments: ["검사 설비"],
    analysisMethods: ["육안 검사", "이화학 시험"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-general-001",
    claimType: "전체",
    scope: "일반 품질 클레임 조사 순서",
    investigationItems: ["현품 확인", "보관품 확인", "제조기록 확인", "제조공정 확인", "품질검사 확인", "원인 검토", "결론 정리"],
    investigationMethods: ["현품·보관품 대조", "기록 검토", "공정 점검"],
    relatedProcesses: ["배합", "여과", "충전", "포장"],
    relatedEquipments: ["검사 설비"],
    analysisMethods: ["육안 검사"],
    conclusionSummary: [],
  },
  {
    id: "seed-kb-principle-cause-001",
    claimType: "전체",
    scope: "원인 판단 시 주의사항 (공통 원칙)",
    investigationItems: ["관찰 현상 기록", "보관품·현품 대조", "기록 검토", "근거 종합"],
    investigationMethods: ["사실·추정 구분 기록", "단일 근거 확정 금지", "자료 부족 시 미확인 표현"],
    relatedProcesses: ["공통"],
    relatedEquipments: ["검사 설비"],
    analysisMethods: ["육안 검사"],
    conclusionSummary: [
      "관찰된 현상과 원인을 동일하게 취급하지 않는다.",
      "가능성만 확인된 경우 원인 확정 표현을 사용하지 않는다.",
      "동일 제조번호 보관품 결과와 소비자 현품 결과를 구분한다.",
      "제조공정 조사결과와 분석결과를 구분한다.",
      "자료가 부족한 경우 확인되지 않음 또는 확인할 수 없음 등의 표현을 사용할 수 있다.",
      "단일 근거만으로 원인을 확정하지 않는다.",
      "실제 조사 결과가 확보된 경우에만 해당 결과를 반영한다.",
    ],
  },
  {
    id: "seed-kb-principle-writing-001",
    claimType: "전체",
    scope: "조사결과 작성 원칙 (공통)",
    investigationItems: ["사실·추정 구분 점검"],
    investigationMethods: ["구분 기재 확인", "수치 원문 유지 확인", "상용구 원문 활용"],
    relatedProcesses: ["공통"],
    relatedEquipments: ["검사 설비"],
    analysisMethods: ["육안 검사"],
    conclusionSummary: [
      "소비자 제공 현품 분석 결과와 보관품 결과를 구분한다.",
      "동일 제조번호의 제조 및 품질검사 기록을 구분한다.",
      "제조공정 조사결과와 시험·분석결과를 구분한다.",
      "확인된 사실과 추정 내용을 구분한다.",
      "확인되지 않은 내용을 사실처럼 작성하지 않는다.",
      "수치·단위·날짜·제조번호 등 입력된 정보는 임의 변경하지 않는다.",
      "사용자가 직접 입력한 조사 결과는 수정하지 않는다.",
      "기존 표준 상용구가 있는 경우 해당 문구를 우선 활용할 수 있다.",
    ],
  },
];

function buildGuideItem(def: GuideSeedDef): ClaimKnowledgeItem {
  return {
    id: def.id,
    reportId: `${def.id}-report`,
    sourceDocNumber: `${GENERIC} 예시 (실제 회사 데이터 아님)`,
    registeredAt: "2026-01-01T00:00:00.000Z",
    isApprovedForKnowledge: false,
    basicInfo: {
      productName: `${GENERIC} 예시 제품 (실제 회사 데이터 아님)`,
      productType: `${GENERIC} 예시`,
      manufacturer: `${GENERIC} 예시 (실제 회사 데이터 아님)`,
      manufactureLine: `${GENERIC} 예시 (실제 회사 데이터 아님)`,
      lotNumber: `${GENERIC} 예시 (실제 Lot 아님)`,
      claimType: def.claimType,
    },
    investigationInfo: {
      investigationItems: def.investigationItems,
      investigationMethods: def.investigationMethods,
      relatedProcesses: def.relatedProcesses,
      relatedEquipments: def.relatedEquipments,
      analysisMethods: def.analysisMethods,
    },
    resultInfo: {
      storageSampleResult: `${GENERIC} 해당 없음 (방법 지식)`,
      storageSampleStatus: "미확인",
      manufacturingRecordResult: `${GENERIC} 해당 없음 (방법 지식)`,
      manufacturingRecordStatus: "미확인",
      qualityInspectionResult: `${GENERIC} 해당 없음 (방법 지식)`,
      qualityInspectionStatus: "미확인",
      processInvestigationResult: `${GENERIC} 해당 없음 (방법 지식)`,
      processInvestigationStatus: "미확인",
      rawMaterialResult: `${GENERIC} 해당 없음 (방법 지식)`,
      rawMaterialStatus: "미확인",
    },
    conclusionInfo: {
      isCauseIdentified: false,
      causeStatusLabel: "원인 불명",
      causeCategory: `${GENERIC} 조사 관점`,
      causeDetail: `${def.scope} (실제 회사 데이터 아님, 원인 미확정)`,
      conclusionSummary: def.conclusionSummary,
      preventiveMeasures: `${GENERIC} 해당 없음 (방법 지식)`,
    },
    reportInfo: {
      usedPhrases: [],
      usedPhraseCount: 0,
      attachmentCount: 0,
      attachmentSummaries: [],
      photoCount: 0,
      photoSummaries: [],
      researcherName: `${GENERIC} 예시 (실제 조사자 아님)`,
      completedDate: "2026-01-01",
    },
    reportSnapshot: buildMethodSnapshot(`${def.id}-report`),
  };
}

/** 범용 조사 지식 Seed 13종 (방법·관점·원칙, 승인 제외 → 과거검색 미노출) */
export const GENERIC_KNOWLEDGE_SEEDS: ClaimKnowledgeItem[] = GUIDE_DEFS.map(buildGuideItem);

const base = PAST_CLAIM_SEEDS[0];

export const KNOWLEDGE_SEEDS: ClaimKnowledgeItem[] = [
  {
    ...JSON.parse(JSON.stringify(base)) as ClaimKnowledgeItem,
    id: "demo-knowledge-base-001",
    reportId: "demo-kb-report-001",
    registeredAt: "2026-01-06T00:00:00.000Z",
    isApprovedForKnowledge: false,
  },
];
