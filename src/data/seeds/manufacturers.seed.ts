import { ManufacturerMaster, ManufactureLineMaster } from "../../types";

/**
 * 제조처·라인 Seed ([DEMO] 예시 전용, 실제 회사 데이터 아님)
 * - line.manufacturerId → 동일 파일의 제조처 ID 참조
 */
export const MANUFACTURER_SEEDS: ManufacturerMaster[] = [
  {
    id: "demo-mfg-001",
    name: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
    type: "etc",
    isActive: true,
    notes: "[DEMO] Seed 구조 검증용 예시 (실제 회사 데이터 아님)",
    factoryLocation: "[DEMO] 예시 소재지",
    teamOrCategory: "[DEMO] 예시 품목군",
    defaultProcessPresetId: "demo-process-001",
    isCustom: true,
  },
];

export const MANUFACTURE_LINE_SEEDS: ManufactureLineMaster[] = [
  {
    id: "demo-line-001",
    manufacturerId: "demo-mfg-001",
    lineName: "[DEMO] 데모 A Line (실제 회사 데이터 아님)",
    description: "[DEMO] Seed 구조 검증용 예시 라인",
    productCategory: "[DEMO] 예시 제품군",
    isActive: true,
    notes: "[DEMO] 예시",
    isCustom: true,
  },
];
