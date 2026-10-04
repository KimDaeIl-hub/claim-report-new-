import { ReportData } from "../types";
import { ClaimKnowledgeItem, ExplicitCauseApproval } from "../types/claimKnowledge";
import { extractClaimTypeLabel } from "./pastClaimManager";
import { DEFAULT_STANDARD_PHRASES } from "../data/standardPhrases";

/**
 * 보고서 데이터로부터 5대 핵심 지식 정보를 체계적으로 추출합니다.
 * 
 * ★ 원칙 준수:
 * "원인 확인" 여부는 조사자가 명시적으로 입력/승인한 값만 저장하며,
 * 시스템이 보고서 문장만 보고 임의로 원인을 확정하지 않습니다.
 */
export function extractKnowledgeFromReport(
  report: ReportData,
  explicitApproval?: ExplicitCauseApproval
): ClaimKnowledgeItem {
  const ar = report.analysisResults;
  const mp = report.manufacturingProcess;
  const lot = report.lotHistory;
  const root = report.rootCauseAndActions;
  const conc = report.conclusion;

  // 1. [기본정보] 추출
  const productName = report.productInfo?.productName?.trim() || "제품명 미기재";
  const productType =
    report.productInfo?.productType?.trim() ||
    report.productInfo?.subProductType?.trim() ||
    "혼합음료 / 일반식품";
  const manufacturer = report.productInfo?.manufacturer?.trim() || "광동제약 평택공장";
  const manufactureLine = report.productInfo?.manufactureLine?.trim() || "생산 라인";
  const lotNumber = report.productInfo?.lotNumber?.trim() || "LOT-미기재";
  const claimType = report.customerClaim?.claimType?.trim() || extractClaimTypeLabel(report);

  // 2. [조사정보] 추출
  const investigationItems: string[] = [];
  const investigationMethods: string[] = [];
  const analysisMethods: string[] = [];

  // 현품 외관
  if (!ar.visualInspection.skipped) {
    investigationItems.push("현품 외관 및 성상 검사");
    investigationMethods.push(
      ar.visualInspection.includePrinciple && ar.visualInspection.principleText
        ? ar.visualInspection.principleText
        : "육안 관찰 및 이물 형태/색상/크기 정밀 감식"
    );
    analysisMethods.push("현품 육안 관찰");
  }

  // 실체현미경
  if (!ar.magnifierInspection.skipped) {
    investigationItems.push("정밀 확대경 조사");
    investigationMethods.push(
      ar.magnifierInspection.includePrinciple && ar.magnifierInspection.principleText
        ? ar.magnifierInspection.principleText
        : `${ar.magnifierInspection.magnification || "40x"} 실체현미경 파단면 및 표면 미세 마모 궤적 추적`
    );
    analysisMethods.push("실체현미경 (확대경)");
  }

  // 광학 현미경
  if (!ar.opticalMicroscope.skipped) {
    investigationItems.push("광학 현미경 미세조직 검경");
    investigationMethods.push(
      ar.opticalMicroscope.includePrinciple && ar.opticalMicroscope.principleText
        ? ar.opticalMicroscope.principleText
        : `${ar.opticalMicroscope.magnification || "100x"} 광학 현미경 생물성(진균/세포) 배제 및 수지 매트릭스 검경`
    );
    analysisMethods.push("광학 현미경");
  }

  // FT-IR 적외선 분광
  if (!ar.ftirAnalysis.skipped) {
    investigationItems.push("FT-IR 적외선 분광 스펙트럼 분석");
    investigationMethods.push(
      ar.ftirAnalysis.includePrinciple && ar.ftirAnalysis.principleText
        ? ar.ftirAnalysis.principleText
        : "FT-IR 분광분석 고분자 유기 결합 피크 스펙트럼 라이브러리 매칭"
    );
    analysisMethods.push("FT-IR 적외선 분광분석");
  }

  // XRF 형광 X선
  if (!ar.xrfAnalysis.skipped) {
    investigationItems.push("XRF 형광 X선 원소 성분 분석");
    investigationMethods.push(
      ar.xrfAnalysis.includePrinciple && ar.xrfAnalysis.principleText
        ? ar.xrfAnalysis.principleText
        : "XRF 형광 X선 무기 원소 정성·정량 분석"
    );
    analysisMethods.push("XRF 원소분석");
  }

  // 이화학 분석
  if (!ar.physicochemicalAnalysis.skipped) {
    investigationItems.push("이화학 규격 성분 정밀 시험");
    const itemNames = ar.physicochemicalAnalysis.items.map((i) => i.name).join(", ");
    investigationMethods.push(
      itemNames ? `이화학 시험 규격 대조 측정 (${itemNames})` : "pH, Brix, 산도 이화학 성분 측정"
    );
    analysisMethods.push("이화학 시험");
  }

  // 카탈라아제
  if (!ar.catalaseTest.skipped) {
    investigationItems.push("카탈라아제(Catalase) 효소 활성 반응 시험");
    investigationMethods.push(
      ar.catalaseTest.includePrinciple && ar.catalaseTest.principleText
        ? ar.catalaseTest.principleText
        : "과산화수소수(3% H2O2) 분해 기포 반응을 통한 생물체/가열 살균 유무 감별"
    );
    analysisMethods.push("카탈라아제 활성 시험");
  }

  // 추가 시험
  if (ar.additionalTests && ar.additionalTests.length > 0) {
    for (const test of ar.additionalTests) {
      if (!test.skipped) {
        investigationItems.push(test.title);
        investigationMethods.push(test.principleText || `${test.title} 시험`);
        analysisMethods.push(test.title);
      }
    }
  }

  // 제조공정 조사 항목
  if (!mp.skipped) {
    investigationItems.push("제조공정 흐름도 및 관리기준 검증");
    investigationItems.push("공정 여과망(Mesh) 및 이물 제어망 점검");
    investigationItems.push("공병 린싱 및 세척 공정 검증");
    investigationMethods.push("공정 흐름 단계별 CCP 관리기준 및 여과 차압 모니터링");
  }

  // 보관품 및 제조기록 항목
  if (!lot.skipped) {
    investigationItems.push("동일 Lot 보관품 전수 검사");
    investigationItems.push("당일 생산일지 및 설비 가동기록 점검");
    investigationItems.push("출하 전 완제품 품질검사 성적서 확인");
    investigationItems.push("원부자재 입고 검사 이력 조사");
    investigationMethods.push("공장 보관 검체 정밀 육안 검경 및 출하 성적서 기준 대조");
  }

  // 관련 공정 추출
  const relatedProcesses: string[] = [];
  if (mp.processSteps && mp.processSteps.length > 0) {
    relatedProcesses.push(...mp.processSteps);
  } else if (mp.processFlow) {
    const steps = mp.processFlow.split(/→|->|>|,/).map((s) => s.trim()).filter(Boolean);
    if (steps.length > 0) {
      relatedProcesses.push(...steps);
    }
  }
  if (mp.highlightedStep && !relatedProcesses.includes(mp.highlightedStep)) {
    relatedProcesses.push(mp.highlightedStep);
  }
  if (relatedProcesses.length === 0) {
    relatedProcesses.push("배합", "여과", "UHT 살균", "충전", "캡핑", "포장");
  }

  // 관련 설비 추출
  const relatedEquipments: string[] = [];
  const textToScanForEquip = `${mp.processFlow} ${mp.filtrationAnalysis} ${mp.cleaningAnalysis} ${mp.criticalControlPoint} ${mp.highlightedStep} ${root.rootCause}`.toLowerCase();
  
  const equipKeywords: { word: string; label: string }[] = [
    { word: "충전", label: "충전기 및 노즐 밸브" },
    { word: "여과", label: "150 Mesh 정밀 여과기" },
    { word: "살균", label: "UHT 초고온 살균기" },
    { word: "캡핑", label: "ROPP 자동 캡핑기" },
    { word: "시밍", label: "캔 시밍기 (Seamer)" },
    { word: "린서", label: "공병 온수 린서 및 에어 블로우" },
    { word: "세병", label: "세병기 (Bottle Washer)" },
    { word: "패킹", label: "충전 밸브 EPDM 고무 패킹" },
    { word: "배합", label: "원료 배합 탱크 및 교반기" },
    { word: "저장", label: "무균 저장 탱크" },
    { word: "비전", label: "이물 자동 비전 검사기" },
    { word: "금속", label: "금속 검출기 (Metal Detector)" },
    { word: "x-ray", label: "X-ray 이물 검사기" },
  ];

  for (const eq of equipKeywords) {
    if (textToScanForEquip.includes(eq.word) && !relatedEquipments.includes(eq.label)) {
      relatedEquipments.push(eq.label);
    }
  }
  if (relatedEquipments.length === 0) {
    relatedEquipments.push("충전기 밸브 노즐", "배합 탱크", "공정 여과기");
  }

  // 3. [결과정보] 추출
  const storageSampleResult =
    lot.retainedSampleCheck?.trim() ||
    (lot.retainedSampleStatus === "이상 확인"
      ? "동일 제조번호 보관품에서 이상 징후 확인됨"
      : "동일 제조번호 보관품 전수 검사 결과 특이사항 없음 (정상)");
  const storageSampleStatus = lot.retainedSampleStatus || "이상 없음";

  const manufacturingRecordResult =
    lot.productionLogNote?.trim() ||
    (lot.productionLogStatus === "이상 확인"
      ? "당일 생산일지 상 공정 조건 이탈 또는 설비 경보 확인"
      : "당일 생산일지 확인 결과 온도/압력/차압 정상 가동 기록 확인됨");
  const manufacturingRecordStatus = lot.productionLogStatus || "이상 없음";

  const qualityInspectionResult =
    lot.qualityTestRecord?.trim() ||
    (lot.qualityTestStatus === "이상 확인"
      ? "완제품 시험 성적서 상 규격 이탈 항목 발견"
      : "완제품 출하 전 시험성적서 전 항목 규격 적합 판정");
  const qualityInspectionStatus = lot.qualityTestStatus || "이상 없음";

  const processInvestigationResult =
    mp.processInvestigationNote?.trim() ||
    mp.filtrationAnalysis?.trim() ||
    (mp.status === "이상 확인"
      ? "제조공정 점검 결과 설비 이상 또는 필터 결함 확인"
      : "제조공정 점검 결과 여과망 파손 및 세척 이상 없음");
  const processInvestigationStatus = mp.status || "이상 없음";

  const rawMaterialResult =
    lot.rawMaterialCheck?.trim() ||
    (lot.rawMaterialStatus === "이상 확인"
      ? "원부자재 입고 검사 결과 이상 확인"
      : "원부자재 입고 검사 성적서 확인 결과 전 항목 적합");
  const rawMaterialStatus = lot.rawMaterialStatus || "이상 없음";

  // 4. [결론정보] 추출
  // ★ "원인 확인" 여부는 조사자가 명시적으로 입력/승인한 값만 저장
  let isCauseIdentified: boolean;
  let causeStatusLabel: "원인 규명 완료" | "원인 미확인 / 추정" | "외력 요인 종결" | "원인 불명";
  let causeCategory: string;
  let causeDetail: string;

  if (explicitApproval) {
    // 조사자가 모달에서 명시적으로 승인한 값 직접 사용
    isCauseIdentified = explicitApproval.isCauseIdentified;
    causeStatusLabel = explicitApproval.causeStatusLabel;
    causeCategory = explicitApproval.causeCategory;
    causeDetail = explicitApproval.causeDetail || root.rootCause || "";
  } else {
    // 초기 제안값 (모달에서 조사자가 직접 승인/수정하기 전의 후보)
    // 원인 필드에 내용이 있고 "이상 확인"인 경우에 한해 '원인 규명 완료' 후보 제시
    const hasRootCause = Boolean(root.rootCause && root.rootCause.trim().length > 10);
    const isStatusAnomaly = root.status === "이상 확인";
    
    if (hasRootCause && isStatusAnomaly) {
      isCauseIdentified = true;
      causeStatusLabel = "원인 규명 완료";
      causeCategory = "제조공정 결함 (설비 마모/점검 필요)";
    } else if (root.rootCause?.includes("외력") || root.rootCause?.includes("유통") || root.rootCause?.includes("소비자")) {
      isCauseIdentified = false;
      causeStatusLabel = "외력 요인 종결";
      causeCategory = "유통/보관 외력 요인";
    } else {
      isCauseIdentified = false;
      causeStatusLabel = "원인 미확인 / 추정";
      causeCategory = "원인 미확정 (추정 조사 종결)";
    }
    causeDetail = root.rootCause || "종합 원인 판정 내용";
  }

  const conclusionSummary =
    conc.summaryPoints && conc.summaryPoints.length > 0
      ? conc.summaryPoints
      : ["가. 현품 정밀 분석 결과 확인", "나. 동일 Lot 보관품 및 제조기록 무결성 확인", "다. 향후 선제적 공정 관리 강화"];
  const preventiveMeasures = root.preventiveMeasures || "";

  // 5. [보고서 정보] 추출
  const usedPhrases: string[] = [];
  const fullText = JSON.stringify(report);
  for (const p of DEFAULT_STANDARD_PHRASES) {
    if (fullText.includes(p.content.slice(0, 20))) {
      usedPhrases.push(p.title);
    }
  }

  // 첨부자료 건수 및 명칭
  const attachmentSummaries: string[] = [];
  if (report.attachments?.attachment1Photos?.length) {
    attachmentSummaries.push(report.attachments.attachment1Title || "[첨부 1] 현품 및 분석 사진");
  }
  if (report.attachments?.attachment2Photos?.length) {
    attachmentSummaries.push(report.attachments.attachment2Title || "[첨부 2] 동일 Lot 보관품 사진");
  }
  if (report.attachments?.attachment3Photos?.length) {
    attachmentSummaries.push(report.attachments.attachment3Title || "[첨부 3] 주요 공정 사진");
  }

  // 사진 건수 및 요약
  const photoSummaries: { caption: string; url?: string }[] = [];
  const collectPhotos = (list?: { caption?: string; url?: string }[]) => {
    if (!list) return;
    for (const photo of list) {
      if (photo?.url) {
        photoSummaries.push({
          caption: photo.caption || "사진 증빙",
          url: photo.url,
        });
      }
    }
  };
  collectPhotos(report.customerClaim?.customerPhotos);
  collectPhotos(report.lotHistory?.retainedSamplePhotos);
  collectPhotos(report.attachments?.attachment1Photos);
  collectPhotos(report.attachments?.attachment2Photos);
  collectPhotos(report.attachments?.attachment3Photos);

  const photoCount = photoSummaries.length;
  const researcherName = report.researcherName || "식품품질경영팀 담당 연구원";
  const completedDate = new Date().toISOString().split("T")[0];

  const knowledgeId = `knowledge-${report.id || "rep"}-${Date.now()}`;

  return {
    id: knowledgeId,
    reportId: report.id,
    sourceDocNumber: report.docNumber || "QM-2026",
    registeredAt: new Date().toISOString(),
    isApprovedForKnowledge: Boolean(explicitApproval),
    basicInfo: {
      productName,
      productType,
      manufacturer,
      manufactureLine,
      lotNumber,
      claimType,
    },
    investigationInfo: {
      investigationItems,
      investigationMethods,
      relatedProcesses,
      relatedEquipments,
      analysisMethods,
    },
    resultInfo: {
      storageSampleResult,
      storageSampleStatus,
      manufacturingRecordResult,
      manufacturingRecordStatus,
      qualityInspectionResult,
      qualityInspectionStatus,
      processInvestigationResult,
      processInvestigationStatus,
      rawMaterialResult,
      rawMaterialStatus,
    },
    conclusionInfo: {
      isCauseIdentified,
      causeStatusLabel,
      causeCategory,
      causeDetail,
      conclusionSummary,
      preventiveMeasures,
    },
    reportInfo: {
      usedPhrases,
      usedPhraseCount: usedPhrases.length,
      attachmentCount: attachmentSummaries.length,
      attachmentSummaries,
      photoCount,
      photoSummaries,
      researcherName,
      completedDate,
    },
    reportSnapshot: JSON.parse(JSON.stringify(report)),
  };
}
