export type InvestigationStatus =
  | "확인 완료"
  | "이상 없음"
  | "이상 확인"
  | "미실시"
  | "확인 불가"
  | "해당 없음"
  | "추가 조사 필요";

export const INVESTIGATION_STATUS_LIST: InvestigationStatus[] = [
  "확인 완료",
  "이상 없음",
  "이상 확인",
  "미실시",
  "확인 불가",
  "해당 없음",
  "추가 조사 필요",
];

export interface PhysicochemicalItem {
  id: string;
  testDate?: string; // 시험일자 (예: 2026.03.03, 출하 시점일 등)
  name: string; // 성상, pH, Brix, 산도, 비중 등
  unit: string;
  standard: string; // 기준치 (예: 3.20 ~ 3.60)
  controlValue: string; // 정상 보관품 수치
  sampleValue: string; // 회수 현품 측정치
  judgment: '적합' | '부적합' | '해당없음';
  remarks?: string; // 비고 (출하 시점 / 현시점 등 수동 기입)
}

export interface AdditionalTestItem {
  id: string;
  title: string;
  result: string;
  includePrinciple: boolean;
  principleText: string;
  skipped: boolean;
  status?: InvestigationStatus;
}

export interface PhotoAttachment {
  id: string;
  url: string;
  caption: string;
  stepName?: string;
}

export interface ReportData {
  id: string;
  title: string;
  docNumber: string;
  issueDate: string;
  companyName: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  companyTel?: string;
  companyFax?: string;
  researcherName?: string;
  department: string;
  teamLeader: string;
  sealType: 'seal' | 'signature' | 'none';
  customSealUrl?: string;
  greetingIntro?: string;

  // [1] 고객 및 클레임 접수 정보
  customerClaim: {
    receivedAt: string;
    sampleReceivedDate?: string;
    customerName: string;
    maskCustomerName: boolean;
    contact?: string;
    channel: string;
    claimDetails: string;
    customerPhotos: PhotoAttachment[];
  };

  // [2] 접수 제품 정보
  productInfo: {
    productName: string;
    lotNumber: string;
    manufactureDate: string;
    expiryDate: string;
    manufacturer: string;
    packageType: string;
    manufacturerType?: "internal" | "oem";
    factoryId?: string;
  };

  // [3] 정밀 분석 결과 (각 항목별 Skip 및 원리 토글)
  analysisResults: {
    // 1. 현품 확인
    visualInspection: {
      skipped: boolean;
      status?: InvestigationStatus;
      sampleCondition: string;
      foreignObjectAppearance: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 2. 확대경 조사
    magnifierInspection: {
      skipped: boolean;
      status?: InvestigationStatus;
      magnification: string;
      result: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 3. 광학 현미경 조사
    opticalMicroscope: {
      skipped: boolean;
      status?: InvestigationStatus;
      magnification: string;
      result: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 4. FT-IR 적외선 분광 분석
    ftirAnalysis: {
      skipped: boolean;
      status?: InvestigationStatus;
      summary: string;
      matchedMaterial: string;
      similarity: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 5. XRF X선 형광 분석
    xrfAnalysis: {
      skipped: boolean;
      status?: InvestigationStatus;
      elementsRatio: string;
      summary: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 6. 이화학 분석 (테이블)
    physicochemicalAnalysis: {
      skipped: boolean;
      status?: InvestigationStatus;
      testDate: string;
      sampleClass: string;
      items: PhysicochemicalItem[];
      summary: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 7. 카탈라아제(Catalase) 시험
    catalaseTest: {
      skipped: boolean;
      status?: InvestigationStatus;
      resultJudgement: string; // 유기물/생물체/가열 여부
      reactionDetail: string;
      includePrinciple: boolean;
      principleText: string;
    };
    // 8. 기타 추가 시험 항목
    additionalTests: AdditionalTestItem[];
  };

  // [4] 제조공정 분석
  manufacturingProcess: {
    skipped: boolean;
    status?: InvestigationStatus;
    processFlow: string; // 텍스트 및 흐름도
    processSteps: string[];
    filtrationAnalysis: string; // 여과망 Mesh 규격 및 제어 설명
    filtrationStatus?: InvestigationStatus;
    cleaningAnalysis: string; // 용기/캡 세척 공정 설명
    cleaningStatus?: InvestigationStatus;
    criticalControlPoint: string; // 클레임 발생 유력 지점 연계 분석
    ccpStatus?: InvestigationStatus;
    highlightedStep: string;
    processInvestigationResult?: string; // 제조공정 조사 고유값 (예: "no_issue")
    processInvestigationNote?: string;   // 제조공정 조사 세부 기술 내용
  };

  // [5] 동일 Lot 제조 및 품질검사 이력
  lotHistory: {
    skipped: boolean;
    status?: InvestigationStatus;
    productionLogNote: string; // 생산일지 특이사항
    productionLogStatus?: InvestigationStatus;
    qualityTestRecord: string; // 완제품 성적서 적합 여부
    qualityTestStatus?: InvestigationStatus;
    priorClaimsCount: string; // 동일 Lot 이전 클레임 접수 이력
    priorClaimsStatus?: InvestigationStatus;
    retainedSampleCheck: string; // 당사 보관품 확인 결과
    retainedSampleStatus?: InvestigationStatus;
    rawMaterialCheck?: string; // 원부자재 조사 결과
    rawMaterialStatus?: InvestigationStatus;
    retainedSamplePhotos: PhotoAttachment[];
    manufacturingRecordResult?: string; // 제조기록 조사 고유값 (예: "no_issue")
    storageSampleResult?: string;       // 보관품 조사 고유값 (예: "normal")
    qualityInspectionResult?: string;   // 품질검사 결과 고유값 (예: "pass")
    materialInvestigationResult?: string;// 원부자재 조사 고유값 (예: "no_issue")
  };

  // [6] 원인 분석 및 재발방지대책
  rootCauseAndActions: {
    skipped: boolean;
    status?: InvestigationStatus;
    rootCause: string; // 종합 원인 판정
    preventiveMeasuresSkipped: boolean; // 재발방지대책 개별 Skip 가능
    preventiveMeasures: string; // 재발방지대책
  };

  // [7] 결론 및 맺음말
  conclusion: {
    summaryPoints: string[]; // 가, 나, 다 핵심 요약
    apologyText: string; // 고객 안심 및 사과 문구
    closingRemarks: string;
  };

  // [8] 첨부 문서 (사진 그리드)
  attachments: {
    attachment1Title?: string; // [첨부 1] 제목/파일명 (수정 가능)
    attachment1Photos: PhotoAttachment[]; // 현품 외관, 이물 확대, FT-IR 그래프
    attachment2Title?: string; // [첨부 2] 제목/파일명 (수정 가능)
    attachment2Photos: PhotoAttachment[]; // 동일 Lot 보관품
    attachment3Title?: string; // [첨부 3] 제목/파일명 (수정 가능)
    attachment3Photos: PhotoAttachment[]; // 주요 공정 사진
  };

  // [9] 내부용 이메일 vs 소비자용 안내문 항목별 포함 설정
  emailAudienceSettings?: EmailAudienceSettings;

  // [10] 5대 핵심 항목 조사결과 고유값 및 버튼 선택 상태 (완벽한 상호 호환)
  investigationResults?: InvestigationResultsData;
  manufacturingRecordResult?: string;
  storageSampleResult?: string;
  qualityInspectionResult?: string;
  processInvestigationResult?: string;
  materialInvestigationResult?: string;
  investigationSelections?: InvestigationItemSelection;
  investigationDetails?: InvestigationDetailInputs;
}

export interface InvestigationDetailInputs {
  // 1. 제조기록 조사
  manufacturingRecord?: {
    processDeviationDetail?: string; // 공정조건 이탈 내용 (예: "후살균 온도 기준 미달")
    workLogErrorDetail?: string;     // 작업기록 이상 내용 (예: "원료 투입시간 기록 누락")
    equipmentErrorDetail?: string;   // 설비 이상 내용 (예: "충전기 노즐 2번 작동 이상")
    [key: string]: string | undefined;
  };
  // 2. 보관품 조사
  retainedSample?: {
    appearanceDefectDetail?: string; // 외관 이상 내용 (예: "용기 표면 긁힘")
    contentDefectDetail?: string;    // 내용물 이상 내용 (예: "미세한 침전 확인")
    foreignMatterDetail?: string;    // 이물 특징 (예: "검은색 섬유상 이물")
    [key: string]: string | undefined;
  };
  // 3. 품질검사 결과
  qualityInspection?: {
    testItem?: string;               // 검사항목 (예: "pH")
    testValue?: string;              // 측정결과 (예: "3.2")
    standard?: string;               // 기준 (예: "3.5~4.5")
    [key: string]: string | undefined;
  };
  // 4. 제조공정 조사
  manufacturingProcess?: {
    processAnomalyDetail?: string;     // 공정 중 이상 내용 (예: "살균 후 냉각수 온도 급상승")
    contaminationRiskProcess?: string; // 검토 대상 공정 (예: "충전공정")
    processCauseDetail?: string;       // 확인된 원인 (예: "충전 노즐 패킹 마모")
    [key: string]: string | undefined;
  };
  // 5. 원부자재 조사
  rawMaterial?: {
    rawMaterialDetail?: string;
    packagingMaterialDetail?: string;
    [key: string]: string | undefined;
  };
  [key: string]: Record<string, string | undefined> | undefined;
}

export type ManufacturingRecordOptionCode =
  | "no_issue"
  | "process_deviation"
  | "work_log_error"
  | "equipment_error"
  | "test_result_error"
  | "other"
  | "not_applicable"
  | string;

export type StorageSampleOptionCode =
  | "normal"
  | "appearance_defect"
  | "content_defect"
  | "foreign_matter_found"
  | "no_sample"
  | "unverifiable"
  | "other"
  | "not_applicable"
  | string;

export type QualityInspectionOptionCode =
  | "pass"
  | "fail"
  | "no_record"
  | "needs_confirmation"
  | "not_applicable"
  | string;

export type ProcessInvestigationOptionCode =
  | "no_issue"
  | "process_anomaly"
  | "contamination_risk_review"
  | "process_cause_identified"
  | "process_cause_unidentified"
  | "other"
  | "not_applicable"
  | string;

export type MaterialInvestigationOptionCode =
  | "no_issue"
  | "raw_material_defect"
  | "packaging_material_defect"
  | "lot_tracking_needed"
  | "unverifiable"
  | "other"
  | "not_applicable"
  | string;

export interface InvestigationResultsData {
  manufacturingRecordResult?: ManufacturingRecordOptionCode;
  storageSampleResult?: StorageSampleOptionCode;
  qualityInspectionResult?: QualityInspectionOptionCode;
  processInvestigationResult?: ProcessInvestigationOptionCode;
  materialInvestigationResult?: MaterialInvestigationOptionCode;
}

export interface InvestigationItemSelection {
  manufacturingRecord?: string | string[]; // 1. 제조기록 조사
  retainedSample?: string | string[];      // 2. 보관품 조사
  qualityInspection?: string | string[];   // 3. 품질검사 결과
  manufacturingProcess?: string | string[];// 4. 제조공정 조사
  rawMaterial?: string | string[];         // 5. 원부자재 조사
  [key: string]: string | string[] | undefined;
}

export interface EmailAudienceSettings {
  // 항목별: true면 소비자용에도 포함, false면 "내부용에만 포함"
  includeVisual: boolean;          // 현품 육안 및 성상 (Visual Inspection)
  includeInstrumental: boolean;    // 정밀 기기분석 (FTIR / XRF)
  includeMicroscope: boolean;      // 확대경 / 현미경 관찰 결과
  includePhysicochemical: boolean; // 이화학 및 카탈라아제 시험 성적
  includeProcessDetails: boolean;  // 제조공정 및 여과망/세척 세부 내역
  includeLotHistory: boolean;      // 동일 Lot 생산일지 및 보관품
  includeRootCause: boolean;       // 종합 원인 판정 소견
  includePreventive: boolean;      // 재발방지 및 설비개선 대책
  includeUncertainty?: boolean;    // 조사 한계점 (선택적)
  useSimplifiedTerms: boolean;     // 소비자용 쉬운 용어 변환 적용
  strictSafetyGuard: boolean;      // 근거 없는 안전/무해 단정 표현 엄격 차단 및 대체
}

export interface StandardPhrase {
  id: string;
  fieldKey: string;
  title: string;
  content: string;
  category?: string; // 'foreign_object' | 'spoilage' | 'precipitate' | 'leak' | 'swelling' | 'test_principle' | 'general'
  subCategory?: string;
  presetId?: string; // optional linked preset ID
  isCustom?: boolean;
}

export interface SavedReportSummary {
  id: string;
  title: string;
  docNumber: string;
  customerName: string;
  productName: string;
  claimType: string;
  updatedAt: string;
}

export type PresetScope = "all" | "in_house" | "oem";
export type PresetSubCategory =
  | "all"
  | "breakage" // 파손
  | "cap" // 캡불량
  | "spoilage" // 변질
  | "foreign" // 혼입 (이물)
  | "quantity" // 수량부족
  | "fill" // 충전불량
  | "packaging"; // 포장불량 (용기/라벨)

export interface ClaimPreset {
  id: string;
  name: string;
  badgeColor?: string;
  description: string;
  category?: string;
  scope?: "in_house" | "oem"; // 자사 vs 외주
  subCategory?: PresetSubCategory; // 파손, 캡불량, 변질, 혼입, 수량부족, 충전불량, 포장불량
  isCustom?: boolean;
  isBuiltin?: boolean;
  linkedPhraseIds?: string[];
  data: Partial<ReportData>;
}
