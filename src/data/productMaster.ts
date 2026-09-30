import { ProductMaster } from "../types";
import { findManufacturerByName, findLineByName } from "./manufacturerMaster";

export const PRODUCT_MASTER_STORAGE_KEY = "kwangdong_product_master_v1";

/**
 * 광동제약 표준 제품 마스터 초기 데이터
 * (제조처 Master ID 및 제조라인 Master ID와 완벽 연동)
 */
export const DEFAULT_PRODUCT_MASTERS: ProductMaster[] = [
  {
    id: "prod-vita500-100",
    productName: "비타500 100ml",
    productCode: "KD-VIT-001",
    productType: "혼합음료",
    subProductType: "비타민 음료",
    volume: "100ml",
    packageType: "유리병",
    containerType: "갈색 유리병 100ml",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    isActive: true,
    description: "광동제약 대표 비타민C 500mg 함유 음료 (비타민B2, 타우린 배합)",
    primaryClaimTypes: ["유리 파손/이물", "캡 흠집/탄화", "변질/산패", "침전물/혼탁"],
    relatedProcessPresetId: "internal-food",
    relatedProcessName: "광동제약 평택공장 식품팀 (유리병 혼합음료 공정)",
    notes: "주력 대량 생산 제품군, 유리병 파손 및 캡핑 토크(Sealing) 중점 관리 대상",
    createdAt: "2026-01-01",
    updatedAt: "2026-03-15",
  },
  {
    id: "prod-vita500-zero-100",
    productName: "비타500 ZERO 100ml",
    productCode: "KD-VIT-002",
    productType: "혼합음료",
    subProductType: "제로칼로리 비타민 음료",
    volume: "100ml",
    packageType: "유리병",
    containerType: "갈색 유리병 100ml",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    isActive: true,
    description: "당류 및 칼로리 0kcal 비타민C 500mg 건강 음료",
    primaryClaimTypes: ["유리 파손/이물", "캡 흠집/탄화", "침전물/혼탁"],
    relatedProcessPresetId: "internal-food",
    relatedProcessName: "광동제약 평택공장 식품팀 (유리병 혼합음료 공정)",
    notes: "대체 감미료 배합 라인 점검 및 관능 품질 관리",
    createdAt: "2026-01-05",
    updatedAt: "2026-02-20",
  },
  {
    id: "prod-corn-tea-500",
    productName: "광동 옥수수수염차 500ml",
    productCode: "KD-TEA-001",
    productType: "다류(액상차)",
    subProductType: "옥수수수염차",
    volume: "500ml",
    packageType: "Aseptic PET",
    containerType: "내열 무균 PET 500ml",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    isActive: true,
    description: "국산 옥수수수염 추출액을 함유하여 맛이 구수하고 깔끔한 대표 차음료",
    primaryClaimTypes: ["변질/산패", "용기 변형/찌그러짐", "침전물/혼탁"],
    relatedProcessPresetId: "oem-samyang",
    relatedProcessName: "삼양패키징 Aseptic 무균 충전공정",
    notes: "천연 곡물 원료 유래 미세 침전물과 미생물 변질 감별 분석 다발",
    createdAt: "2026-01-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "prod-hovenia-500",
    productName: "광동 힘찬하루 헛개차 500ml",
    productCode: "KD-TEA-002",
    productType: "다류(액상차)",
    subProductType: "헛개 음료",
    volume: "500ml",
    packageType: "Aseptic PET",
    containerType: "내열 무균 PET 500ml",
    manufacturerId: "mfg-lottechilsung-anseong",
    manufacturer: "롯데칠성음료 안성공장",
    manufactureLineId: "line-lotte-01",
    manufactureLine: "PET 1호 라인",
    isActive: true,
    description: "헛개나무 열매 추출농축액 함유 남성 건강 및 갈증 해소 차음료",
    primaryClaimTypes: ["변질/산패", "캡 실링 불량", "침전물/혼탁"],
    relatedProcessPresetId: "oem-lottechilsung-anseong",
    relatedProcessName: "롯데칠성 안성공장 Aseptic 충전라인",
    notes: "농축액 특유의 향기 성분 및 고형분 침전 상용구 연계",
    createdAt: "2026-01-12",
    updatedAt: "2026-02-28",
  },
  {
    id: "prod-ssanghwa-100",
    productName: "광동 쌍화탕 100ml",
    productCode: "KD-MED-001",
    productType: "일반의약품",
    subProductType: "전통 한방 생약제제",
    volume: "100ml",
    packageType: "유리병",
    containerType: "갈색 약품용 유리병 100ml",
    manufacturerId: "mfg-kd-songtan",
    manufacturer: "광동제약 송탄공장",
    manufactureLineId: "line-kd-st-01",
    manufactureLine: "약사팀 2호 라인",
    isActive: true,
    description: "동의보감 원방 처방 9가지 생약 복합 처방 일반의약품",
    primaryClaimTypes: ["유리 파손/이물", "캡 밀봉 불량", "침전물/혼탁"],
    relatedProcessPresetId: "internal-food",
    relatedProcessName: "광동제약 자사 생약 추출/멸균 라인",
    notes: "생약 전탕액 고유 침전물 판별 및 의약품 GMP 품질기준 준수",
    createdAt: "2026-01-02",
    updatedAt: "2026-03-01",
  },
  {
    id: "prod-vita500-can-240",
    productName: "광동 비타500 캔 240ml",
    productCode: "KD-VIT-003",
    productType: "혼합음료",
    subProductType: "캔 비타민 음료",
    volume: "240ml",
    packageType: "알루미늄 캔",
    containerType: "2피스 알루미늄 캔 240ml",
    manufacturerId: "mfg-dongwon-yeoncheon",
    manufacturer: "동원F&B 연천공장",
    manufactureLineId: "line-dongwon-01",
    manufactureLine: "CAN 충전/시밍 라인",
    isActive: true,
    description: "상쾌한 탄산감과 활력 비타민C를 담은 캔 음료",
    primaryClaimTypes: ["시밍 불량/누액", "캔 찌그러짐", "내용량 부족"],
    relatedProcessPresetId: "oem-dongwon",
    relatedProcessName: "동원F&B CAN/파우치 충전라인",
    notes: "이중 권체(Double Seaming) 3대 치수 검사 및 시밍 누액 중점 조사",
    createdAt: "2026-01-15",
    updatedAt: "2026-02-15",
  },
  {
    id: "prod-corn-tea-1500",
    productName: "광동 옥수수수염차 1.5L",
    productCode: "KD-TEA-003",
    productType: "다류(액상차)",
    subProductType: "옥수수수염차 대용량",
    volume: "1.5L",
    packageType: "Aseptic PET",
    containerType: "대용량 무균 PET 1.5L",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-02",
    manufactureLine: "대형 PET 라인",
    isActive: true,
    description: "온 가족이 넉넉하게 마시는 가정용 대용량 옥수수수염차",
    primaryClaimTypes: ["변질/산패", "개봉 후 보관 변질", "캡 헛돎"],
    relatedProcessPresetId: "oem-samyang",
    relatedProcessName: "삼양패키징 Aseptic 무균 충전공정",
    notes: "개봉 후 상온 보관 시 침전 및 곰팡이 증식 클레임 분석 표준 문구 연계",
    createdAt: "2026-01-18",
    updatedAt: "2026-03-05",
  },
  {
    id: "prod-kyungokgo-stick",
    productName: "광동 경옥고 스틱 20g",
    productCode: "KD-MED-002",
    productType: "일반의약품",
    subProductType: "자양강장 한방제제",
    volume: "20g",
    packageType: "스틱 파우치",
    containerType: "알루미늄 증착 4중 스틱 파우치",
    manufacturerId: "mfg-kd-songtan",
    manufacturer: "광동제약 송탄공장",
    manufactureLineId: "line-kd-st-02",
    manufactureLine: "제제팀 파우치 충진라인",
    isActive: true,
    description: "인삼, 생지황, 백복령, 꿀을 전통 방식으로 120시간 증숙한 자양강장제",
    primaryClaimTypes: ["파우치 실링 불량/누액", "내용량 편차", "개봉 불량(이지컷)"],
    relatedProcessPresetId: "internal-food",
    relatedProcessName: "광동제약 고점도 파우치 충전/살균 공정",
    notes: "파우치 열융착 핫실링 온도 및 이지컷(Easy-Cut) 인장 강도 관리",
    createdAt: "2026-01-20",
    updatedAt: "2026-03-12",
  },
  {
    id: "prod-woohwang-liquid",
    productName: "광동 원방 우황청심원액 50ml",
    productCode: "KD-MED-003",
    productType: "일반의약품",
    subProductType: "순환계 생약제제",
    volume: "50ml",
    packageType: "유리병",
    containerType: "갈색 차광 유리병 50ml",
    manufacturerId: "mfg-kd-songtan",
    manufacturer: "광동제약 송탄공장",
    manufactureLineId: "line-kd-st-03",
    manufactureLine: "약사팀 소용량 액제 라인",
    isActive: true,
    description: "천연 우황, 사향을 정밀 배합한 뇌졸중 및 고혈압 보조 치료제",
    primaryClaimTypes: ["유리 파손/이물", "캡 실링 불량", "침전물/혼탁"],
    relatedProcessPresetId: "internal-food",
    relatedProcessName: "광동제약 생약 정제 및 차광병 충전라인",
    notes: "고가 의약품 현품 정밀 회수 및 외력 타격 현미경 분석 필수",
    createdAt: "2026-01-22",
    updatedAt: "2026-02-18",
  },
  {
    id: "prod-vita500-jelly",
    productName: "광동 비타500 젤리 130g",
    productCode: "KD-VIT-004",
    productType: "캔디류(젤리)",
    subProductType: "구미 젤리",
    volume: "130g",
    packageType: "스탠딩 파우치",
    containerType: "지퍼 스탠딩 파우치",
    manufacturerId: "mfg-seohung-osong",
    manufacturer: "서흥 오송공장",
    manufactureLineId: "line-seohung-01",
    manufactureLine: "젤리 성형/포장라인",
    isActive: true,
    description: "비타민C와 비타민B군을 간편하게 섭취하는 구미 젤리",
    primaryClaimTypes: ["이물 혼입", "성형 불량/응집", "포장 밀봉 불량"],
    relatedProcessPresetId: "oem-seohung",
    relatedProcessName: "서흥 오송공장 젤리/연질캡슐 라인",
    notes: "하절기 젤리 멜팅(응집) 현상 및 금속검출기 전수 검사 기록 연계",
    createdAt: "2026-02-01",
    updatedAt: "2026-03-08",
  },
  {
    id: "prod-vita500-stick-old",
    productName: "광동 비타500 데일리스틱 (구버전)",
    productCode: "KD-VIT-OLD-01",
    productType: "건강기능식품",
    subProductType: "분말 스틱",
    volume: "140g",
    packageType: "스틱 파우치",
    containerType: "스틱 파우치 + 지함",
    manufacturerId: "mfg-cosmax-jecheon",
    manufacturer: "코스맥스엔비티 제천공장",
    manufactureLineId: "line-cosmax-01",
    manufactureLine: "분말 멀티스틱 라인",
    isActive: false, // 미사용(비활성화) 제품 예시
    description: "물 없이 털어먹는 분말형 비타민 (구 규격 단종 제품)",
    primaryClaimTypes: ["포장 실링 불량", "분말 뭉침", "중량 미달"],
    relatedProcessPresetId: "oem-cosmax",
    relatedProcessName: "코스맥스엔비티 분말 스틱 라인",
    notes: "리뉴얼로 인해 단종 처리된 제품 (미사용 필터 테스트용)",
    createdAt: "2025-06-01",
    updatedAt: "2025-12-31",
  },
];

/**
 * 기존 제품 데이터에 manufacturerId / manufactureLineId가 없는 경우,
 * 명확히 일치하는 마스터가 있을 때만 안전하게 연결 (불확실한 경우 강제 연결 안 함)
 */
export function resolveProductManufacturerAndLine(p: ProductMaster): ProductMaster {
  let updated = { ...p };
  if (!updated.manufacturerId && updated.manufacturer) {
    const matchedMfg = findManufacturerByName(updated.manufacturer);
    if (matchedMfg) {
      updated.manufacturerId = matchedMfg.id;
    }
  }
  if (updated.manufacturerId && !updated.manufactureLineId && updated.manufactureLine) {
    const matchedLine = findLineByName(updated.manufacturerId, updated.manufactureLine);
    if (matchedLine) {
      updated.manufactureLineId = matchedLine.id;
    }
  }
  return updated;
}

/**
 * 모든 제품 마스터 불러오기 (localStorage 저장분 + 초기 데이터 병합)
 */
export function loadAllProducts(): ProductMaster[] {
  try {
    const raw = localStorage.getItem(PRODUCT_MASTER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCT_MASTER_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCT_MASTERS));
      return DEFAULT_PRODUCT_MASTERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(resolveProductManufacturerAndLine);
    }
    return DEFAULT_PRODUCT_MASTERS;
  } catch (e) {
    console.error("Failed to load products from localStorage", e);
    return DEFAULT_PRODUCT_MASTERS;
  }
}

/**
 * 전체 제품 마스터 저장하기
 */
export function saveAllProducts(products: ProductMaster[]): void {
  try {
    localStorage.setItem(PRODUCT_MASTER_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save products to localStorage", e);
  }
}

/**
 * 단일 제품 마스터 추가 또는 수정
 */
export function saveProduct(product: ProductMaster): ProductMaster[] {
  const current = loadAllProducts();
  const index = current.findIndex((p) => p.id === product.id);
  const now = new Date().toISOString().split("T")[0];

  let updated: ProductMaster[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...product,
      updatedAt: now,
    };
  } else {
    updated = [
      {
        ...product,
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ];
  }

  saveAllProducts(updated);
  return updated;
}

/**
 * 제품 활성화/비활성화 토글
 */
export function toggleProductActive(productId: string): ProductMaster[] {
  const current = loadAllProducts();
  const updated = current.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        isActive: !p.isActive,
        updatedAt: new Date().toISOString().split("T")[0],
      };
    }
    return p;
  });
  saveAllProducts(updated);
  return updated;
}

/**
 * 제품 삭제 (커스텀 등록 제품은 배열에서 제거, 기본 제품은 비활성화 처리 권장)
 */
export function deleteProduct(productId: string): ProductMaster[] {
  const current = loadAllProducts();
  const target = current.find((p) => p.id === productId);

  let updated: ProductMaster[];
  if (target?.isCustom) {
    updated = current.filter((p) => p.id !== productId);
  } else {
    // 기본 내장 제품은 삭제 대신 비활성화 권장
    updated = current.map((p) => (p.id === productId ? { ...p, isActive: false } : p));
  }

  saveAllProducts(updated);
  return updated;
}

/**
 * ID로 단일 제품 조회
 */
export function findProductById(productId?: string): ProductMaster | undefined {
  if (!productId) return undefined;
  const list = loadAllProducts();
  return list.find((p) => p.id === productId);
}

/**
 * 제품명으로 일치하는 제품 마스터 조회 (기존 클레임과의 자동 매핑 지원)
 */
export function findProductByName(productName?: string): ProductMaster | undefined {
  if (!productName || !productName.trim()) return undefined;
  const list = loadAllProducts();
  const normalized = productName.trim().toLowerCase();

  // 1. 정확한 제품명 일치
  const exact = list.find((p) => p.productName.trim().toLowerCase() === normalized);
  if (exact) return exact;

  // 2. 부분 일치 (예: "비타500" -> "비타500 100ml")
  const partial = list.find(
    (p) =>
      p.productName.toLowerCase().includes(normalized) ||
      normalized.includes(p.productName.toLowerCase())
  );
  return partial;
}

/**
 * 제품명 또는 제품코드 검색 및 사용 여부 필터링
 */
export function searchProducts(
  products: ProductMaster[],
  searchQuery: string,
  activeFilter: "all" | "active" | "inactive" = "all"
): ProductMaster[] {
  const q = searchQuery.trim().toLowerCase();

  return products.filter((p) => {
    // 1. 사용 여부 필터
    if (activeFilter === "active" && !p.isActive) return false;
    if (activeFilter === "inactive" && p.isActive) return false;

    // 2. 검색어 필터 (제품명, 제품코드, 제품유형, 제조처, 제조라인)
    if (!q) return true;

    const matchName = p.productName.toLowerCase().includes(q);
    const matchCode = p.productCode.toLowerCase().includes(q);
    const matchType = p.productType.toLowerCase().includes(q);
    const matchSubType = p.subProductType.toLowerCase().includes(q);
    const matchMfg = p.manufacturer.toLowerCase().includes(q);
    const matchLine = p.manufactureLine.toLowerCase().includes(q);

    return matchName || matchCode || matchType || matchSubType || matchMfg || matchLine;
  });
}

/**
 * 기본 초기 데이터로 복구
 */
export function resetProductsToDefault(): ProductMaster[] {
  try {
    localStorage.setItem(PRODUCT_MASTER_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCT_MASTERS));
    return DEFAULT_PRODUCT_MASTERS;
  } catch (e) {
    console.error("Failed to reset products", e);
    return DEFAULT_PRODUCT_MASTERS;
  }
}
