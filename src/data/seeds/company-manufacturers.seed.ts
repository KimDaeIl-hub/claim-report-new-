import { ManufacturerMaster, ManufactureLineMaster } from "../../types";

/**
 * 실제 회사 제조처·라인 Seed — 자사 (사용자 제공값만 기재, 추정 없음)
 *
 * - 제조처: 광동제약 식품공장 (자사, internal)
 * - 제공되지 않은 필드(factoryLocation 등)는 생략 (선택 필드)
 * - 배합 방식 원문은 라인 notes에 verbatim 보존 ("주로" 표현 유지)
 */

export const COMPANY_MANUFACTURER_SEEDS: ManufacturerMaster[] = [
  {
    id: "company-mfg-kd-food",
    name: "[실제] 광동제약 식품공장",
    type: "internal",
    isActive: true,
  },
];

export const COMPANY_LINE_SEEDS: ManufactureLineMaster[] = [
  {
    id: "company-line-a",
    manufacturerId: "company-mfg-kd-food",
    lineName: "[실제] A라인",
    productCategory: "음료 병 라인",
    isActive: true,
    notes: "배합 방식: 도징 배합 주로 사용(A라인). 배치 배합(수동 배합) 가능.",
  },
  {
    id: "company-line-b",
    manufacturerId: "company-mfg-kd-food",
    lineName: "[실제] B라인",
    productCategory: "음료 병 라인",
    isActive: true,
    notes: "배합 방식: 인라인 배합 주로 사용(B라인). 배치 배합(수동 배합) 가능.",
  },
  {
    id: "company-line-c",
    manufacturerId: "company-mfg-kd-food",
    lineName: "[실제] C라인",
    productCategory: "음료 병 라인",
    isActive: true,
    notes: "배합 방식: 인라인 배합 주로 사용(C라인). 배치 배합(수동 배합) 가능.",
  },
  {
    id: "company-line-hwan",
    manufacturerId: "company-mfg-kd-food",
    lineName: "[실제] 환제 라인",
    productCategory: "환제 라인",
    isActive: true,
  },
  {
    id: "company-line-pouch-shape",
    manufacturerId: "company-mfg-kd-food",
    lineName: "[실제] 형상(스탠딩) 파우치 라인",
    productCategory: "파우치 라인",
    isActive: true,
  },
  {
    id: "company-line-pouch-stick",
    manufacturerId: "company-mfg-kd-food",
    lineName: "[실제] 스틱 파우치 라인",
    productCategory: "파우치 라인",
    isActive: true,
  },
];
