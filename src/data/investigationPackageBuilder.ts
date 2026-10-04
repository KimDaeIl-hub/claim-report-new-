import {
  InvestigationPackage,
  InvestigationPackageInput,
  InvestigationPackageItem,
  ReportData,
} from "../types";
import { loadAllProducts, findProductById, findProductByName } from "./productMaster";
import { loadAllFactoryPresets, findFactoryPresetByName } from "./factoryProcessPresets";
import { getProcessStepsByPreset, loadAllProcessSteps } from "./processStepMaster";
import { CLAIM_TYPES, ClaimTypeCategory } from "../utils/claimTypeConfig";
import { DEFAULT_STANDARD_PHRASES } from "./standardPhrases";
import {
  getRecommendedSimilarClaims,
  CurrentClaimContext,
} from "../utils/similarClaimRecommender";

/**
 * 클레임 유형 식별자 정규화
 */
export function normalizeClaimTypeCategory(rawType: string): ClaimTypeCategory {
  const lower = (rawType || "").toLowerCase();
  if (lower.includes("이물") || lower === "foreign") return "foreign";
  if (lower.includes("변질") || lower.includes("산패") || lower.includes("곰팡이") || lower.includes("팽창") || lower === "spoilage") return "spoilage";
  if (lower.includes("누액") || lower.includes("파손") || lower.includes("캡") || lower === "leak") return "leak";
  if (lower.includes("라벨") || lower.includes("표시") || lower.includes("날인") || lower === "label") return "label";
  if (lower.includes("내용량") || lower.includes("중량") || lower.includes("수량") || lower === "volume") return "volume";
  return "foreign"; // default fallback
}

/**
 * [규칙 기반] 신규 클레임 기본 입력을 바탕으로 조사 패키지 자동 구성
 *
 * 중요한 원칙:
 * 1. 시스템이 원인을 확정해서는 안 된다.
 * 2. "추천 조사대상"과 "확정된 원인"을 명확히 구분한다.
 * 3. 과거 사례가 없더라도 기본 조사 템플릿으로 정상 작동해야 한다.
 * 4. 자동 구성된 조사 항목은 조사자가 수정/추가/삭제할 수 있다.
 */
export function assembleInvestigationPackage(input: InvestigationPackageInput): InvestigationPackage {
  // -------------------------------------------------------------------------
  // [1] 제품 Master 연동
  // -------------------------------------------------------------------------
  const allProducts = loadAllProducts();
  let matchedProduct = input.productId ? findProductById(input.productId) : null;
  if (!matchedProduct && input.productName) {
    matchedProduct = findProductByName(input.productName);
  }
  // Try partial match if not exact
  if (!matchedProduct && input.productName) {
    const q = input.productName.trim().toLowerCase();
    matchedProduct = allProducts.find((p) => p.productName.toLowerCase().includes(q) || q.includes(p.productName.toLowerCase())) || null;
  }

  // 제품 기본 정보 확정 (미등록 신규 제품인 경우에도 입력값 기반으로 안전하게 초기화)
  const productMaster = {
    productName: matchedProduct ? matchedProduct.productName : input.productName || "비타민 음료 A",
    subProductType: matchedProduct ? matchedProduct.subProductType || matchedProduct.productType : "혼합음료",
    packageType: matchedProduct ? matchedProduct.packageType : "유리병",
    containerType: matchedProduct ? matchedProduct.containerType : "갈색 유리병 100ml",
    volume: matchedProduct ? matchedProduct.volume : "100ml",
    manufacturer: matchedProduct ? matchedProduct.manufacturer : "광동제약 평택공장",
    manufactureLine: matchedProduct ? matchedProduct.manufactureLine : "A Line",
    productCode: matchedProduct?.productCode,
  };

  // -------------------------------------------------------------------------
  // [2] 제조공정 Master 연동
  // -------------------------------------------------------------------------
  const allPresets = loadAllFactoryPresets();
  let matchedPreset = null;

  if (matchedProduct?.relatedProcessPresetId) {
    matchedPreset = allPresets.find((p) => p.id === matchedProduct?.relatedProcessPresetId) || null;
  }
  if (!matchedPreset) {
    // 제조라인 명칭 또는 제조처 명칭으로 검색
    const lineSearch = productMaster.manufactureLine.toLowerCase();
    matchedPreset = allPresets.find((p) =>
      p.id.toLowerCase().includes(lineSearch) ||
      p.name.toLowerCase().includes(lineSearch) ||
      p.teamOrCategory.toLowerCase().includes(lineSearch)
    ) || null;
  }
  if (!matchedPreset && productMaster.manufacturer) {
    matchedPreset = findFactoryPresetByName(productMaster.manufacturer);
  }
  // Fallback to A Line if still not found
  if (!matchedPreset) {
    matchedPreset = allPresets.find((p) => p.id === "line-kd-pt-01") || allPresets[0];
  }

  const stepsDetail = matchedPreset ? getProcessStepsByPreset(matchedPreset) : [];
  const keyEquipments = Array.from(
    new Set(
      stepsDetail
        .map((s) => s.keyEquipment)
        .filter(Boolean)
        .flatMap((eq) => eq.split(",").map((t) => t.trim()))
    )
  );

  const processMaster = {
    presetId: matchedPreset?.id,
    lineName: productMaster.manufactureLine || matchedPreset?.name || "A Line",
    processFlow: matchedPreset?.processFlow || "원료 투입 → 배합 → 여과 → UHT → 저장 → 충전 → 캡핑 → 후살균 → 포장",
    processSteps: matchedPreset?.processSteps && matchedPreset.processSteps.length > 0
      ? matchedPreset.processSteps
      : ["원료 투입", "배합", "여과", "UHT", "저장", "충전", "캡핑", "후살균", "포장"],
    keyEquipments: keyEquipments.length > 0 ? keyEquipments : ["배합탱크", "150 Mesh 스트레이너", "UHT 살균기", "로터리 충전기", "ROPP 캡핑기"],
    filtrationAnalysis: matchedPreset?.filtrationAnalysis,
    cleaningAnalysis: matchedPreset?.cleaningAnalysis,
    criticalControlPoint: matchedPreset?.criticalControlPoint,
    stepsDetail,
  };

  // -------------------------------------------------------------------------
  // [3] 클레임 유형 Master 연동
  // -------------------------------------------------------------------------
  const categoryKey = normalizeClaimTypeCategory(input.claimType || input.claimSubCategory || "");
  const claimTypeDef = CLAIM_TYPES[categoryKey] || CLAIM_TYPES.foreign;

  const claimTypeMaster = {
    claimTypeId: claimTypeDef.id,
    claimTypeName: claimTypeDef.name,
    description: claimTypeDef.description,
    badgeColor: claimTypeDef.badgeColor,
    suggestedTestTitle: claimTypeDef.suggestedTestTemplate?.title,
    suggestedTestMethod: claimTypeDef.suggestedTestTemplate?.result,
  };

  // -------------------------------------------------------------------------
  // [4] 추천 조사대상 (추천 조사대상 vs 확정된 원인 명확 구분)
  // -------------------------------------------------------------------------
  const recommendedTargets: string[] = [];

  if (categoryKey === "foreign") {
    recommendedTargets.push(`${processMaster.lineName} 여과 공정 스트레이너/카트리지 필터(Mesh 규격) 건전성 점검`);
    recommendedTargets.push(`충전기 노즐부 테플론/실리콘 패킹 마모 및 캡핑기 롤러 마찰 발생 여부 확인`);
    recommendedTargets.push(`원료 투입 시 외래 포장재 개봉 파편 및 원료 유래물 혼입 가능성 검토`);
    recommendedTargets.push(`공병 세척 온수 린싱(85℃ 이상) 압력 및 에어 블로우 이물 배출 이력 확인`);
    recommendedTargets.push(`소비자 현품 이물의 성분 분석(FT-IR/현미경)을 통한 제조 설비 재질 대조`);
  } else if (categoryKey === "spoilage") {
    recommendedTargets.push(`UHT 살균기 실시간 살균 온도 차트 레코더 및 자동 리턴 밸브 작동 로그 전수 검토`);
    recommendedTargets.push(`캡핑 토크(Sealing) 실시간 측정치 및 라이너 압착 균일도 점검`);
    recommendedTargets.push(`동일 제조번호(${input.lotNumber}) 보관품 관능/Brix/pH/미생물 무균성 대조 시험`);
    recommendedTargets.push(`용기 개봉 후 보관 조건 및 유통 중 2차 미생물 오염 경로 검토`);
  } else if (categoryKey === "leak") {
    recommendedTargets.push(`캡핑 헤드 롤러 마모 상태, 캡핑 토크(기준 12~16 kgf·cm), 림 깊이 점검`);
    recommendedTargets.push(`후살균/냉각 공정 중 급격한 온도차로 인한 유리병/용기 미세 크랙 여부 점검`);
    recommendedTargets.push(`진공 데시케이터 감압(-40 kPa) Methylene Blue 누액 침투 시험`);
  } else if (categoryKey === "label") {
    recommendedTargets.push(`포장 라인 CIJ 연속 잉크젯 날인기 노즐 막힘 및 소비기한 인자 로그 확인`);
    recommendedTargets.push(`비전 검사기(Vision Inspector) 불량 감지 및 자동 배출 이력 검토`);
    recommendedTargets.push(`바코드 판독률(ISO/IEC 15416 Grade) 및 라벨 부착 위치 정렬 검사`);
  } else {
    // volume
    recommendedTargets.push(`충전 노즐 밸브 정량 유량계(Flowmeter) 교정 및 편차 이력 점검`);
    recommendedTargets.push(`포장 라인 중량선별기(Checkweigher) 실시간 중량 로그 및 허용오차율 비교`);
    recommendedTargets.push(`정밀 전자저울을 통한 순 내용량(Net Weight) 정밀 검증`);
  }

  // -------------------------------------------------------------------------
  // [5] 자동 구성된 8대 표준 조사 항목 (조사자 수정/추가/삭제 가능)
  // -------------------------------------------------------------------------
  const investigationItems: InvestigationPackageItem[] = [
    {
      id: "item-sample",
      category: "sample",
      name: "소비자 제공 현품",
      isRequired: input.hasSample === true,
      isChecked: true,
      method: input.hasSample
        ? `소비자 회수 현품 외관, 캡 밀봉 토크 및 개봉 상태 확인, 내용물 상태 관능 및 고배율 실체현미경/기기 정밀 분석`
        : `[현품 미확보 건] 소비자가 제공한 접수 사진 및 진술 내용을 면밀히 판독하고, 용기 형태 및 표시사항 간접 검증 진행`,
      targetInspectionPoints: input.hasSample
        ? ["회수품 잔여 내용물 성상", "외관 흠집/파손 여부", "캡 개봉 브릿지 단락 여부", "이물/이상 부위 정밀 관찰"]
        : ["접수 사진 속 제품 외형", "소비기한 날인 형태", "소비자 진술 경로"],
    },
    {
      id: "item-retained",
      category: "retained",
      name: "동일 제조번호 보관품",
      isRequired: true,
      isChecked: true,
      method: `해당 제조번호(${input.lotNumber || "해당 롯트"})의 공장 보관검체(보관품) 2병 이상을 무작위 개봉하여 외관, 성상, Brix 당도, pH 및 밀봉도 대조 시험 실시`,
      targetInspectionPoints: ["보관품 외관 이상 여부", "Brix/pH 규격 일치도", "내용물 침전/이물/변질 유무", "동일 로트 재현성 검증"],
    },
    {
      id: "item-record",
      category: "record",
      name: "제조기록",
      isRequired: true,
      isChecked: true,
      method: `해당 롯트(${input.lotNumber || "해당 제조번호"})의 배치 제조기록서, 작업일지, 설비 운전 데이터 및 작업자 특이사항 보고서 전수 검토`,
      targetInspectionPoints: ["원료 칭량 및 투입 일치 여부", "배합 시간 및 교반 속도", "살균 온도/시간 자동 차트", "설비 이상 정지/조치 이력"],
    },
    {
      id: "item-qc",
      category: "qc",
      name: "품질검사",
      isRequired: true,
      isChecked: true,
      method: `출하 전 완제품 시험성적서(CoA) 및 인라인 공정 품질 검사(미생물, 이화학, 중량 선별) 기록의 규격 적합 여부 확인`,
      targetInspectionPoints: ["출하 시험성적서(CoA) 전 항목 적합", "공정 중 금속검출기/이물검출기 모니터링 일지", "미생물 무균 규격"],
    },
    {
      id: "item-process",
      category: "process",
      name: "제조공정",
      isRequired: true,
      isChecked: true,
      method: `해당 생산라인(${processMaster.lineName})의 단계별 표준 작업 기준서(SOP) 준수 여부 및 설비 세척·살균(CIP) 이력 검증`,
      targetInspectionPoints: [
        `${processMaster.lineName} 공정도 흐름 준수 여부`,
        "여과망(Mesh 규격) 건전성",
        "용기 고온 린싱 세척 상태",
        "CCP 관리점 실시간 모니터링",
      ],
    },
    {
      id: "item-material",
      category: "material",
      name: "원부자재",
      isRequired: false,
      isChecked: true,
      method: `투입된 주원료 및 부형제, 용기(유리병/PET), 캡(뚜껑), 포장재의 입고 검사 시험성적서 및 공급사 품질 보증 확인`,
      targetInspectionPoints: ["원료 입고 검사 적합 기록", "용기 및 캡 청정도 및 치수 규격", "포장재 외래 이물 여부"],
    },
    {
      id: "item-cause",
      category: "cause",
      name: "원인 검토",
      isRequired: true,
      isChecked: true,
      method: `현품 분석, 보관품 대조, 제조/품질 기록 및 공정 점검 데이터를 종합하여 발생 기전 및 추정 경로 다각도 검토 (※ 원인 미확정 상태에서 객관적 사실 기반 분석)`,
      targetInspectionPoints: ["제조 단계 혼입/발생 가능성", "유통 및 보관 단계 요인 검토", "소비자 음용/취급 환경 분석", "재현 시험 결과"],
    },
    {
      id: "item-conclusion",
      category: "conclusion",
      name: "결론",
      isRequired: true,
      isChecked: true,
      method: `클레임 조사 결과 종합 요약, 고객 안내 및 공정 품질 재발방지 관리 방안 도출`,
      targetInspectionPoints: ["과학적·객관적 사실에 근거한 종합 결론", "재발방지 공정 점검 계획", "소비자 설명 및 예의를 갖춘 안내"],
    },
  ];

  // -------------------------------------------------------------------------
  // [6] 추천 상용구 (현재 상황 및 클레임 유형 맞춤형)
  // -------------------------------------------------------------------------
  const recommendedPhrases = DEFAULT_STANDARD_PHRASES.filter((ph) => {
    const pText = `${ph.title} ${ph.content} ${ph.category || ""}`.toLowerCase();
    const subCat = (input.claimSubCategory || "").toLowerCase();
    if (subCat && pText.includes(subCat)) return true;
    if (categoryKey === "foreign" && (pText.includes("이물") || pText.includes("여과") || pText.includes("패킹") || pText.includes("현품"))) return true;
    if (categoryKey === "spoilage" && (pText.includes("변질") || pText.includes("살균") || pText.includes("산패") || pText.includes("보관"))) return true;
    if (categoryKey === "leak" && (pText.includes("캡") || pText.includes("누액") || pText.includes("파손") || pText.includes("실링"))) return true;
    return false;
  }).slice(0, 6);

  // -------------------------------------------------------------------------
  // [7] 추천 조사 공정 (관련 중점 점검 대상 공정)
  // -------------------------------------------------------------------------
  const recommendedProcesses: {
    stepName: string;
    equipmentName: string;
    focusPoint: string;
    verificationMethod: string;
  }[] = [];

  if (categoryKey === "foreign") {
    recommendedProcesses.push({
      stepName: "충전 및 분주 공정",
      equipmentName: "A Line 로터리 충전기 / 테플론 노즐 밸브",
      focusPoint: "충전 밸브 테플론/실리콘 가스켓 피스톤 마찰 마모 및 탄화물 탈락 여부",
      verificationMethod: "충전 밸브 전수 분해 세척 점검 및 가스켓 교체 주기(3개월) 이력 대조",
    });
    recommendedProcesses.push({
      stepName: "정밀 여과 공정",
      equipmentName: "150 Mesh 마이크로 스트레이너 / 카트리지 필터",
      focusPoint: "여과망 메쉬 파손 및 압력차(ΔP) 규격 준수 여부",
      verificationMethod: "배치 전/후 스트레이너 메쉬 건전성 육안 점검 및 세척 검사 일지 확인",
    });
    recommendedProcesses.push({
      stepName: "공병 린싱 세척 공정",
      equipmentName: "고온 온수 린서 / 에어 블로우 노즐",
      focusPoint: "공병 투입 후 85℃ 고온 온수 분사 압력 및 이물 배출 적합성",
      verificationMethod: "온수 린서 압력계(0.2~0.3 MPa) 및 에어 블로우 필터 점검 기록 검토",
    });
  } else if (categoryKey === "spoilage") {
    recommendedProcesses.push({
      stepName: "UHT 초고온 살균 공정",
      equipmentName: "플레이트식 UHT 살균기 (CCP-1B)",
      focusPoint: "살균 온도(135℃ ± 2℃) 및 유지 시간(30초) 기준 이탈 여부",
      verificationMethod: "실시간 온도 차트 레코더 및 자동 리턴 밸브 동작 로그 전수 분석",
    });
    recommendedProcesses.push({
      stepName: "캡핑 및 실링 공정",
      equipmentName: "ROPP 자동 캡핑기 (헤드 4련)",
      focusPoint: "캡핑 토크(Sealing Torque) 규격(12~16 kgf·cm) 및 라이너 기밀 압착",
      verificationMethod: "시간당 캡핑 토크 실측 데이터 및 감압 데시케이터 밀봉도 검사 일지",
    });
  } else if (categoryKey === "leak") {
    recommendedProcesses.push({
      stepName: "캡핑 및 성형 공정",
      equipmentName: "캡핑 헤드 롤러 & 나사산 성형 척",
      focusPoint: "캡핑 롤러 편마모 및 나사산 헛돎/바이어스 체결 여부",
      verificationMethod: "토크 게이지 측정 및 캡 개봉 브릿지 단락 하중 검사",
    });
    recommendedProcesses.push({
      stepName: "후살균 및 냉각 공정",
      equipmentName: "터널식 샤워 냉각기",
      focusPoint: "급격한 온도 편차에 의한 유리병 미세 크랙(Thermal Shock)",
      verificationMethod: "냉각수 단계별 수온 구배(70℃→50℃→30℃) 모니터링 로그 확인",
    });
  } else {
    recommendedProcesses.push({
      stepName: "포장 및 날인 공정",
      equipmentName: "CIJ 잉크젯 마킹기 & 비전 검사기",
      focusPoint: "소비기한/로트 인쇄 선명도 및 라벨 부착 정렬 상태",
      verificationMethod: "비전 검사기 불량 배출 이력 및 바코드 판독률 검사 일지",
    });
  }

  // -------------------------------------------------------------------------
  // [8] 과거 유사 사례 (11대 항목 구조적 유사도 자동 검색)
  // -------------------------------------------------------------------------
  const claimContext: CurrentClaimContext = {
    productName: productMaster.productName,
    productType: productMaster.subProductType,
    manufactureLine: productMaster.manufactureLine,
    manufacturer: productMaster.manufacturer,
    claimMajorCategory: categoryKey,
    claimMidCategory: input.claimSubCategory || categoryKey,
    claimDetailType: input.claimSubCategory,
    customerClaimDetails: input.customerClaim,
    lotNumber: input.lotNumber,
  };
  const similarPastClaims = getRecommendedSimilarClaims(claimContext, undefined, 3);

  return {
    input,
    productMaster,
    processMaster,
    claimTypeMaster,
    investigationItems,
    recommendedTargets,
    recommendedPhrases,
    recommendedProcesses,
    similarPastClaims,
    packageSummary: "조사 패키지가 구성되었습니다.",
    createdAt: new Date().toISOString().split("T")[0],
  };
}

/**
 * 자동 구성된 조사 패키지를 보고서 데이터(ReportData)에 실제 반영
 * (조사자가 수정한 항목 선택 및 체크 상태가 그대로 적용됨)
 */
export function applyInvestigationPackageToReport(
  prevReport: ReportData,
  pkg: InvestigationPackage
): ReportData {
  const next: ReportData = JSON.parse(JSON.stringify(prevReport));

  // 1. [제품 정보 반영]
  next.productInfo = {
    ...next.productInfo,
    productName: pkg.productMaster.productName,
    subProductType: pkg.productMaster.subProductType,
    packageType: pkg.productMaster.packageType,
    containerType: pkg.productMaster.containerType,
    volume: pkg.productMaster.volume,
    productCode: pkg.productMaster.productCode,
    manufacturer: pkg.productMaster.manufacturer,
    manufactureLine: pkg.productMaster.manufactureLine,
    manufacturerType: pkg.productMaster.manufacturer.includes("광동") ? "internal" : "oem",
    lotNumber: pkg.input.lotNumber || next.productInfo.lotNumber,
    factoryId: pkg.processMaster.presetId || next.productInfo.factoryId,
    claimTypeId: pkg.claimTypeMaster.claimTypeId,
  };

  // 2. [고객 접수 및 소비자 주장 반영]
  next.customerClaim = {
    ...next.customerClaim,
    claimDetails: pkg.input.customerClaim || next.customerClaim.claimDetails,
    sampleReceivedDate: pkg.input.hasSample
      ? next.customerClaim.sampleReceivedDate || new Date().toISOString().split("T")[0]
      : undefined,
  };

  // 3. [제조공정 Master 반영]
  next.manufacturingProcess = {
    ...next.manufacturingProcess,
    processFlow: pkg.processMaster.processFlow,
    processSteps: pkg.processMaster.processSteps,
    filtrationAnalysis: pkg.processMaster.filtrationAnalysis || next.manufacturingProcess.filtrationAnalysis,
    cleaningAnalysis: pkg.processMaster.cleaningAnalysis || next.manufacturingProcess.cleaningAnalysis,
    criticalControlPoint: pkg.processMaster.criticalControlPoint || next.manufacturingProcess.criticalControlPoint,
  };

  // 4. [조사 항목 기반 초기화 - 현품 상태 및 보관품 점검]
  const sampleItem = pkg.investigationItems.find((i) => i.id === "item-sample");
  if (sampleItem && sampleItem.isChecked) {
    if (!pkg.input.hasSample) {
      next.analysisResults.visualInspection.skipped = false;
      next.analysisResults.visualInspection.sampleCondition =
        "※ 소비자로부터 현품 미확보(접수 사진 및 진술 기준 조사 진행). 동영상/사진 대조 및 동일 로트 보관품 중심으로 조사 실시함.";
      next.analysisResults.visualInspection.foreignObjectAppearance =
        `소비자 접수 주장: ${pkg.input.customerClaim || "특이 이물 의심 건"}`;
    } else {
      next.analysisResults.visualInspection.skipped = false;
      next.analysisResults.visualInspection.sampleCondition =
        "소비자 제공 회수 현품 입고 완료. 포장 밀봉 상태 및 내용물 검증 진행.";
      next.analysisResults.visualInspection.foreignObjectAppearance =
        `접수 클레임 내용: ${pkg.input.customerClaim || "현품 이물/이상 유무 정밀 분석 중"}`;
    }
  }

  // 보관품 점검
  const retainedItem = pkg.investigationItems.find((i) => i.id === "item-retained");
  if (retainedItem && retainedItem.isChecked) {
    next.lotHistory.retainedSampleCheck =
      `동일 제조번호(${pkg.input.lotNumber || "해당 로트"}) 공장 보관품 검체(2병) 개봉 후 관능, 성상 및 규격 대조 검사 결과 이상 없음.`;
    next.lotHistory.retainedSampleStatus = "이상 없음";
  }

  // 제조기록 점검
  const recordItem = pkg.investigationItems.find((i) => i.id === "item-record");
  if (recordItem && recordItem.isChecked) {
    next.lotHistory.productionLogNote =
      `해당 제조번호(${pkg.input.lotNumber || "해당 로트"}) ${pkg.processMaster.lineName} 배치 제조기록서 및 설비 점검 일지 확인 결과, 공정 표준 작업 기준(SOP) 준수 및 특이사항 없음.`;
    next.lotHistory.productionLogStatus = "이상 없음";
  }

  // 품질검사 기록
  const qcItem = pkg.investigationItems.find((i) => i.id === "item-qc");
  if (qcItem && qcItem.isChecked) {
    next.lotHistory.qualityTestRecord =
      `출하 전 완제품 시험성적서(CoA) 검토 결과, 전 항목 기준 규격에 적합하여 정상 출하된 로트임.`;
    next.lotHistory.qualityTestStatus = "이상 없음";
  }

  // 5. [추천 조사대상 알림 - 원인 미확정 원칙 엄격 준수]
  // 시스템이 원인을 함부로 단정하지 않고 객관적인 조사 진행 상태로 둡니다.
  next.rootCauseAndActions.rootCause =
    `[조사 진행 중] 조사 패키지 추천 조사대상(${pkg.recommendedTargets.slice(0, 2).join(", ")})에 대한 현장 검증 및 시험 분석 진행 중. (※ 객관적 사실에 근거하여 조사자가 최종 원인 판정 예정)`;

  return next;
}
