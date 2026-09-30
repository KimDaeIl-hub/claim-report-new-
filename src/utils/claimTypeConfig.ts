import { ReportData, AdditionalTestItem } from "../types";

export type ClaimTypeCategory = "foreign" | "spoilage" | "leak" | "label" | "volume";

export interface ClaimTypeDefinition {
  id: ClaimTypeCategory;
  name: string;
  badgeLabel: string;
  description: string;
  badgeColor: string; // Tailwind color classes for badges
  activeButtonColor: string;
  iconName: "foreign" | "spoilage" | "leak" | "label" | "volume";
  // Analysis items that should be shown/highlighted
  requiredAnalysisKeys: Array<
    | "visualInspection"
    | "magnifierInspection"
    | "opticalMicroscope"
    | "ftirAnalysis"
    | "xrfAnalysis"
    | "physicochemicalAnalysis"
    | "catalaseTest"
  >;
  // Process items highlighted
  processItemHighlights: string[];
  // Linked subCategories in presets
  presetSubCategories: string[];
  // Linked phrase categories
  phraseCategories: string[];
  // Suggested additional test template
  suggestedTestTemplate?: {
    title: string;
    result: string;
    includePrinciple: boolean;
    principleText: string;
  };
}

export const CLAIM_TYPES: Record<ClaimTypeCategory, ClaimTypeDefinition> = {
  foreign: {
    id: "foreign",
    name: "이물 (혼입)",
    badgeLabel: "이물",
    description: "유리, 금속, 플라스틱, 탄화물, 곤충, 이물질 등",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    activeButtonColor: "bg-purple-600 text-white border-purple-700 shadow-xs",
    iconName: "foreign",
    requiredAnalysisKeys: [
      "visualInspection",
      "magnifierInspection",
      "opticalMicroscope",
      "ftirAnalysis",
      "xrfAnalysis",
      "catalaseTest",
    ],
    processItemHighlights: ["여과망 Mesh 규격", "용기/캡 린서 세척", "이물 검출기 CCP"],
    presetSubCategories: ["foreign"],
    phraseCategories: ["foreign_object", "bottle_glass", "bottle_insect", "swelling"],
    suggestedTestTemplate: {
      title: "현미경 미세조직 및 FT-IR 성분 정밀 동정 시험",
      result:
        "공인 표준 라이브러리 대조 결과, 해당 이물은 제조 공정 설비 재질과 불일치하며 외부 유입된 비결정질 유기물로 확인됨.",
      includePrinciple: true,
      principleText:
        "※ FT-IR 적외선 분광 및 고배율 현미경 관찰을 통해 이물의 고유 분자 구조와 표면 미세 마모도를 규명하여 공정 내 혼입 가능성을 과학적으로 검증합니다.",
    },
  },
  spoilage: {
    id: "spoilage",
    name: "변질 (이상풍미/침전/팽창)",
    badgeLabel: "변질",
    description: "산패, 변색, 침전, 곰팡이, 가스 팽창, 이상 풍미",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    activeButtonColor: "bg-amber-600 text-white border-amber-700 shadow-xs",
    iconName: "spoilage",
    requiredAnalysisKeys: [
      "visualInspection",
      "physicochemicalAnalysis",
      "catalaseTest",
      "magnifierInspection",
    ],
    processItemHighlights: ["살균 온도/시간 F0값 CCP", "CIP 배관 세척", "무균 충전"],
    presetSubCategories: ["spoilage"],
    phraseCategories: ["spoilage", "bottle_mold", "bottle_sediment", "precipitate"],
    suggestedTestTemplate: {
      title: "미생물 배양 시험 (일반세균수, 대장균군, 진균류 배양)",
      result:
        "35℃ 48시간 표준평판배양 결과: 일반세균수 음성(0 CFU/ml), 대장균군 불검출, 진균류(곰팡이/효모) 음성으로 무균 규격 적합 확인.",
      includePrinciple: true,
      principleText:
        "※ 식품공전 미생물 시험법에 준하여 표준 한천배지에 시료를 접종 후 배양하여 가열 살균의 완전성과 2차 미생물 증식 여부를 판정합니다.",
    },
  },
  leak: {
    id: "leak",
    name: "누액 (밀봉/캡/파손)",
    badgeLabel: "누액",
    description: "캡 풀림, 라이너 불량, 용기 핀홀, 크랙 파손, 진공 파괴",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    activeButtonColor: "bg-cyan-600 text-white border-cyan-700 shadow-xs",
    iconName: "leak",
    requiredAnalysisKeys: [
      "visualInspection",
      "magnifierInspection",
      "physicochemicalAnalysis",
    ],
    processItemHighlights: ["캡핑기 토크 관리 CCP", "실링 헤드 압력", "진공 타격 검사기"],
    presetSubCategories: ["breakage", "cap"],
    phraseCategories: ["leak", "bottle_glass", "bottle_cap"],
    suggestedTestTemplate: {
      title: "용기 밀봉도 감압 누액 검사 (Methylene Blue 침투 시험)",
      result:
        "진공 데시케이터 -40 kPa 감압 유지 상태에서 외부 색소액 침투 여부 검사 결과: 캡 나사선 및 라이너 접촉부를 통한 액 누출 및 색소 유입 없음 (적합).",
      includePrinciple: true,
      principleText:
        "※ 감압 챔버 내에서 음압을 형성하여 용기 밀봉부의 미세 핀홀 및 캡 체결 불량 부위를 통한 기밀 누설을 비파괴 및 가압 방식으로 정밀 검출합니다.",
    },
  },
  label: {
    id: "label",
    name: "표시오류 (라벨/날인)",
    badgeLabel: "표시오류",
    description: "유통기한 미인쇄/오기, 바코드 미인식, 라벨 오부착",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    activeButtonColor: "bg-emerald-600 text-white border-emerald-700 shadow-xs",
    iconName: "label",
    requiredAnalysisKeys: ["visualInspection", "magnifierInspection"],
    processItemHighlights: ["마킹기 잉크 분사 점검", "비전 검사기(Vision) 로그", "라벨 롤 교체"],
    presetSubCategories: ["packaging"],
    phraseCategories: ["label", "packaging"],
    suggestedTestTemplate: {
      title: "바코드 판독률 (ISO/IEC 15416 Grade) 및 날인 식별성 검사",
      result:
        "산업용 2D/1D 바코드 검증기 판독 결과 Grade A(4.0) 판정. 소비기한 활자 날인 선명도 및 누락 여부 100% 정상 판독 확인.",
      includePrinciple: true,
      principleText:
        "※ 국제 표준 바코드 검증 규격(ISO/IEC 15416)에 의거하여 심볼 대비도, 변조도, 결함도를 수치화 측정하여 스캐너 인식률을 판정합니다.",
    },
  },
  volume: {
    id: "volume",
    name: "내용량 (충전/수량)",
    badgeLabel: "내용량",
    description: "내용량 미달, 충전 편차, 중량 부족, 개수 부족",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    activeButtonColor: "bg-rose-600 text-white border-rose-700 shadow-xs",
    iconName: "volume",
    requiredAnalysisKeys: ["visualInspection", "physicochemicalAnalysis"],
    processItemHighlights: ["충전 노즐 유량계 CCP", "중량선별기(Checkweigher) 로그"],
    presetSubCategories: ["quantity", "fill"],
    phraseCategories: ["volume", "quantity", "fill"],
    suggestedTestTemplate: {
      title: "순 내용량(Net Weight) 정밀 측정 및 식품공전 허용오차율 검증",
      result:
        "정밀 전자저울(0.01g 단위) 3회 반복 측정 평균 순내용량: 101.4g (표시량 100ml 대비 비중 1.012 환산 시 기준 규격 허용오차범위 이내 적합).",
      includePrinciple: true,
      principleText:
        "※ 식품의약품안전처 고시 '식품등의 표시기준'의 내용량 허용부족량 기준에 의거하여 정밀 전자저울로 총중량에서 공용기 중량을 감산하여 실제 순내용량을 산출합니다.",
    },
  },
};

export const ALL_CLAIM_TYPE_KEYS: ClaimTypeCategory[] = [
  "foreign",
  "spoilage",
  "leak",
  "label",
  "volume",
];

/**
 * Check whether an analysis item has existing user-entered content in the report.
 * Used to ensure we NEVER hide or clear fields that the user has already typed into.
 */
export function hasUserContentInAnalysisItem(
  itemKey: string,
  analysisResults: ReportData["analysisResults"]
): boolean {
  if (!analysisResults) return false;

  switch (itemKey) {
    case "visualInspection":
      return Boolean(
        analysisResults.visualInspection?.sampleCondition?.trim() ||
          analysisResults.visualInspection?.foreignObjectAppearance?.trim()
      );
    case "magnifierInspection":
      return Boolean(analysisResults.magnifierInspection?.result?.trim());
    case "opticalMicroscope":
      return Boolean(analysisResults.opticalMicroscope?.result?.trim());
    case "ftirAnalysis":
      return Boolean(
        analysisResults.ftirAnalysis?.summary?.trim() ||
          analysisResults.ftirAnalysis?.matchedMaterial?.trim()
      );
    case "xrfAnalysis":
      return Boolean(
        analysisResults.xrfAnalysis?.summary?.trim() ||
          analysisResults.xrfAnalysis?.elementsRatio?.trim()
      );
    case "physicochemicalAnalysis":
      return Boolean(
        analysisResults.physicochemicalAnalysis?.summary?.trim() ||
          (analysisResults.physicochemicalAnalysis?.items &&
            analysisResults.physicochemicalAnalysis.items.length > 0)
      );
    case "catalaseTest":
      return Boolean(
        analysisResults.catalaseTest?.resultJudgement?.trim() ||
          analysisResults.catalaseTest?.reactionDetail?.trim()
      );
    default:
      return false;
  }
}

/**
 * Determine which analysis items are visible based on selected claim types and user content.
 * Rule:
 * 1. If showAll is true OR no claim types are selected -> all items are visible.
 * 2. If claim types are selected -> union of required items from selected types.
 * 3. CRITICAL: If an item has user-entered content, it is ALWAYS visible so data is never lost or obscured!
 */
export function getAnalysisItemVisibility(
  selectedTypes: ClaimTypeCategory[],
  analysisResults: ReportData["analysisResults"],
  showAll: boolean
): Record<string, { isVisible: boolean; isRequiredByType: boolean; hasContent: boolean }> {
  const allKeys = [
    "visualInspection",
    "magnifierInspection",
    "opticalMicroscope",
    "ftirAnalysis",
    "xrfAnalysis",
    "physicochemicalAnalysis",
    "catalaseTest",
  ];

  // Set of keys required by any of the selected claim types
  const requiredKeysSet = new Set<string>();
  if (selectedTypes.length > 0) {
    selectedTypes.forEach((typeKey) => {
      const def = CLAIM_TYPES[typeKey];
      if (def) {
        def.requiredAnalysisKeys.forEach((k) => requiredKeysSet.add(k));
      }
    });
  }

  const result: Record<string, { isVisible: boolean; isRequiredByType: boolean; hasContent: boolean }> = {};

  allKeys.forEach((key) => {
    const isRequired = requiredKeysSet.has(key);
    const hasContent = hasUserContentInAnalysisItem(key, analysisResults);

    // Visible if showAll, or no filter, or required by type, OR has content entered by user!
    const isVisible = showAll || selectedTypes.length === 0 || isRequired || hasContent;

    result[key] = {
      isVisible,
      isRequiredByType: isRequired,
      hasContent,
    };
  });

  return result;
}

/**
 * Maps a preset's subCategory to a ClaimTypeCategory
 */
export function mapPresetSubCategoryToClaimType(subCat?: string): ClaimTypeCategory | null {
  if (!subCat) return null;
  switch (subCat) {
    case "foreign":
      return "foreign";
    case "spoilage":
      return "spoilage";
    case "breakage":
    case "cap":
      return "leak";
    case "packaging":
      return "label";
    case "quantity":
    case "fill":
      return "volume";
    default:
      return null;
  }
}
