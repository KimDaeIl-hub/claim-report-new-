import { ReportData } from "../types";

/**
 * 완료 클레임 지식화 구조적 데이터 모델
 * 클레임 완료 시 향후 유사 클레임 조사의 재사용을 위해 추출/보관되는 5대 핵심 정보
 */
export interface ClaimKnowledgeItem {
  id: string; // "knowledge-{reportId}-{timestamp}"
  reportId: string;
  sourceDocNumber: string;
  registeredAt: string; // ISO string
  isApprovedForKnowledge: boolean; // 조사자 승인 여부

  // [1. 기본정보]
  basicInfo: {
    productName: string;
    productType: string;
    manufacturer: string;
    manufactureLine: string;
    lotNumber: string;
    claimType: string;
  };

  // [2. 조사정보]
  investigationInfo: {
    investigationItems: string[]; // 조사 항목 (예: "현품 외관 검사", "FT-IR 적외선 분광", "150 Mesh 여과망 점검")
    investigationMethods: string[]; // 조사 방법 및 측정 기법
    relatedProcesses: string[]; // 관련 공정 (배합, 여과, UHT 살균, 충전, 캡핑 등)
    relatedEquipments: string[]; // 관련 설비 (충전 밸브 노즐, 150 Mesh 여과기, 시밍기 등)
    analysisMethods: string[]; // 분석방법 (FT-IR, 광학 현미경, XRF, 이화학 등)
  };

  // [3. 결과정보]
  resultInfo: {
    storageSampleResult: string; // 보관품 결과
    storageSampleStatus: string;
    manufacturingRecordResult: string; // 제조기록 결과
    manufacturingRecordStatus: string;
    qualityInspectionResult: string; // 품질검사 결과
    qualityInspectionStatus: string;
    processInvestigationResult: string; // 공정조사 결과
    processInvestigationStatus: string;
    rawMaterialResult: string; // 원부자재 결과
    rawMaterialStatus: string;
  };

  // [4. 결론정보]
  // ★ 중요 원칙: "원인 확인" 여부는 조사자가 명시적으로 입력/승인한 값만 저장하며, 시스템이 보고서 문장만 보고 임의 확정하지 않음
  conclusionInfo: {
    isCauseIdentified: boolean; // 원인 확인 여부 (조사자 명시 승인값)
    causeStatusLabel: "원인 규명 완료" | "원인 미확인 / 추정" | "외력 요인 종결" | "원인 불명";
    causeCategory: string; // 원인 유형 (예: "제조공정 결함 (설비 마모)", "원부자재 유래", "유통외력", "원인 미상")
    causeDetail: string; // 원인 상세 내용
    conclusionSummary: string[]; // 결론 핵심 요약 (가, 나, 다)
    preventiveMeasures: string; // 재발방지대책
  };

  // [5. 보고서 정보]
  reportInfo: {
    usedPhrases: string[]; // 사용 상용구 목록
    usedPhraseCount: number;
    attachmentCount: number; // 첨부자료 건수
    attachmentSummaries: string[]; // 첨부자료 명칭
    photoCount: number; // 사진 건수
    photoSummaries: { caption: string; url?: string }[];
    researcherName: string; // 조사자
    completedDate: string; // 완료일 (YYYY-MM-DD)
  };

  // 원본 보고서 스냅샷 (기존 보고서는 그대로 유지하며 참조 연결)
  reportSnapshot: ReportData;
}

/**
 * 조사자가 모달에서 명시적으로 입력/승인하는 결론 파라미터
 */
export interface ExplicitCauseApproval {
  isCauseIdentified: boolean;
  causeStatusLabel: "원인 규명 완료" | "원인 미확인 / 추정" | "외력 요인 종결" | "원인 불명";
  causeCategory: string;
  causeDetail: string;
  customNote?: string;
}
