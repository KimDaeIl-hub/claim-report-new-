import { ProductMaster } from "../../types";

/**
 * 제품 Seed ([DEMO] 예시 전용, 실제 회사 데이터 아님)
 * - 실데이터 등록 시 이 파일을 복제하여 ID/값을 교체하면 됨
 * - manufacturerId → manufacturers.seed.ts, relatedProcessPresetId → processes.seed.ts 참조
 */
export const PRODUCT_SEEDS: ProductMaster[] = [
  {
    id: "demo-prod-001",
    productName: "[DEMO] 데모 혼합음료 100ml (실제 회사 데이터 아님)",
    productCode: "DEMO-001",
    productType: "혼합음료",
    subProductType: "데모 비타민음료",
    volume: "100ml",
    packageType: "유리병",
    containerType: "DEMO 갈색 유리병 100ml",
    manufacturerId: "demo-mfg-001",
    manufacturer: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
    manufactureLineId: "demo-line-001",
    manufactureLine: "[DEMO] 데모 A Line (실제 회사 데이터 아님)",
    isActive: true,
    description: "[DEMO] Seed 구조 검증용 예시 제품 (실제 회사 데이터 아님)",
    primaryClaimTypes: ["이물"],
    relatedProcessPresetId: "demo-process-001",
    relatedProcessName: "[DEMO] 데모 표준 공정 (실제 회사 데이터 아님)",
    notes: "[DEMO] 예시",
    isCustom: true,
  },
];
