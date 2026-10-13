import { ClaimKnowledgeItem } from "../../types/claimKnowledge";
import { INITIAL_REPORT_DATA } from "../presets";
import { ReportData } from "../../types";

function buildDemoSnapshot(docNumber: string): ReportData {
  const base = JSON.parse(JSON.stringify(INITIAL_REPORT_DATA)) as ReportData;
  base.id = "demo-past-report-001";
  base.docNumber = docNumber;
  base.productInfo = {
    ...base.productInfo,
    productName: "[DEMO] 데모 혼합음료 100ml (실제 회사 데이터 아님)",
    lotNumber: "[DEMO] 예시 Lot (실제 회사 데이터 아님)",
    manufacturer: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
  };
  base.customerClaim = {
    ...base.customerClaim,
    customerName: "[DEMO] 예시 소비자 (실제 회사 데이터 아님)",
    contact: "",
    claimDetails: "[DEMO] 예시 클레임 내용 (실제 회사 데이터 아님)",
    customerPhotos: [],
  };
  base.lotHistory = {
    ...base.lotHistory,
    retainedSamplePhotos: [],
    retainedSampleCheck: "[DEMO] 예시 보관품 확인 문구 (실제 회사 데이터 아님)",
    productionLogNote: "[DEMO] 예시 제조기록 문구 (실제 회사 데이터 아님)",
  };
  base.rootCauseAndActions = {
    ...base.rootCauseAndActions,
    rootCause: "[DEMO] 예시 원인 검토 문구 (실제 회사 데이터 아님, 미확정)",
    preventiveMeasures: "[DEMO] 예시 재발방지 문구 (실제 회사 데이터 아님)",
  };
  base.attachments = {
    attachment1Photos: [],
    attachment2Photos: [],
    attachment3Photos: [],
  };
  return base;
}

/**
 * 과거 클레임 Seed ([DEMO] 예시 전용, 실제 회사 데이터 아님)
 * - 승인(approved) 항목으로 등록되어 과거 유사사례 검색·지식 베이스 양쪽에 노출
 * - 실제 고객·Lot·사진 데이터 없음 (빈 배열/예시 문구만)
 */
export const PAST_CLAIM_SEEDS: ClaimKnowledgeItem[] = [
  {
    id: "demo-knowledge-past-001",
    reportId: "demo-past-report-001",
    sourceDocNumber: "[DEMO] 예시 문서번호 (실제 회사 데이터 아님)",
    registeredAt: "2026-01-05T00:00:00.000Z",
    isApprovedForKnowledge: true,
    basicInfo: {
      productName: "[DEMO] 데모 혼합음료 100ml (실제 회사 데이터 아님)",
      productType: "혼합음료",
      manufacturer: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
      manufactureLine: "[DEMO] 데모 A Line (실제 회사 데이터 아님)",
      lotNumber: "[DEMO] 예시 Lot (실제 회사 데이터 아님)",
      claimType: "이물",
    },
    investigationInfo: {
      investigationItems: ["현품 외관 검사", "보관품 대조"],
      investigationMethods: ["[DEMO] 예시 조사방법 (실제 회사 데이터 아님)"],
      relatedProcesses: ["여과", "충전"],
      relatedEquipments: ["[DEMO] 예시 설비 (실제 회사 데이터 아님)"],
      analysisMethods: ["육안 검사"],
    },
    resultInfo: {
      storageSampleResult: "[DEMO] 예시 (실제 회사 데이터 아님)",
      storageSampleStatus: "미실시",
      manufacturingRecordResult: "[DEMO] 예시 (실제 회사 데이터 아님)",
      manufacturingRecordStatus: "미실시",
      qualityInspectionResult: "[DEMO] 예시 (실제 회사 데이터 아님)",
      qualityInspectionStatus: "미실시",
      processInvestigationResult: "[DEMO] 예시 (실제 회사 데이터 아님)",
      processInvestigationStatus: "미실시",
      rawMaterialResult: "[DEMO] 예시 (실제 회사 데이터 아님)",
      rawMaterialStatus: "미실시",
    },
    conclusionInfo: {
      isCauseIdentified: false,
      causeStatusLabel: "원인 불명",
      causeCategory: "[DEMO] 예시 (실제 회사 데이터 아님)",
      causeDetail: "[DEMO] 예시 (실제 회사 데이터 아님, 미확정)",
      conclusionSummary: ["[DEMO] 예시 요약 (실제 회사 데이터 아님)"],
      preventiveMeasures: "[DEMO] 예시 (실제 회사 데이터 아님)",
    },
    reportInfo: {
      usedPhrases: [],
      usedPhraseCount: 0,
      attachmentCount: 0,
      attachmentSummaries: [],
      photoCount: 0,
      photoSummaries: [],
      researcherName: "[DEMO] 예시 조사자 (실제 회사 데이터 아님)",
      completedDate: "2026-01-05",
    },
    reportSnapshot: buildDemoSnapshot("[DEMO] 예시 문서번호 (실제 회사 데이터 아님)"),
  },
];
