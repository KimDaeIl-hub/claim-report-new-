import { ManufacturerMaster, ManufactureLineMaster, ManufacturerType } from "../types";

export const MANUFACTURER_MASTER_STORAGE_KEY = "kwangdong_manufacturer_master_v1";
export const MANUFACTURE_LINE_MASTER_STORAGE_KEY = "kwangdong_manufacture_line_master_v1";

/**
 * [표준 제조처 Master 초기 데이터]
 * 자사 공장 (평택, 송탄) 및 주요 외주(OEM) 생산 협력처 표준 등록
 */
export const DEFAULT_MANUFACTURERS: ManufacturerMaster[] = [
  {
    id: "mfg-kd-pyeongtaek",
    name: "광동제약 평택공장",
    type: "internal",
    isActive: true,
    factoryLocation: "경기도 평택시 서탄면",
    teamOrCategory: "식품생산팀 (혼합음료·다류)",
    defaultProcessPresetId: "internal-food",
    notes: "광동제약 대표 음료 생산 기지 (비타500, 비타500 ZERO 등 주력 대량 생산)",
    createdAt: "2026-01-01",
    updatedAt: "2026-03-15",
  },
  {
    id: "mfg-kd-songtan",
    name: "광동제약 송탄공장",
    type: "internal",
    isActive: true,
    factoryLocation: "경기도 평택시 산단로",
    teamOrCategory: "의약품/생약제제팀 (GMP 인증)",
    defaultProcessPresetId: "internal-food",
    notes: "광동제약 의약품 GMP 규격 생약 제제 공장 (쌍화탕, 경옥고, 우황청심원 등)",
    createdAt: "2026-01-01",
    updatedAt: "2026-03-15",
  },
  {
    id: "mfg-samyang-gwanghyewon",
    name: "삼양패키징 광혜원공장",
    type: "oem",
    isActive: true,
    factoryLocation: "충청북도 진천군 광혜원면",
    teamOrCategory: "Aseptic 무균 충전 PET 라인",
    defaultProcessPresetId: "oem-samyang",
    notes: "국내 최대 Aseptic 무균 충전 전문 외주 협력처 (광동 옥수수수염차 500ml/1.5L 생산)",
    createdAt: "2026-01-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "mfg-lottechilsung-anseong",
    name: "롯데칠성음료 안성공장",
    type: "oem",
    isActive: true,
    factoryLocation: "경기도 안성시 미양면",
    teamOrCategory: "차음료 Aseptic 충전 라인",
    defaultProcessPresetId: "oem-lottechilsung-anseong",
    notes: "차음료 및 고품질 PET 음료 OEM 충전 협력처 (광동 힘찬하루 헛개차 500ml)",
    createdAt: "2026-01-12",
    updatedAt: "2026-02-28",
  },
  {
    id: "mfg-dongwon-yeoncheon",
    name: "동원F&B 연천공장",
    type: "oem",
    isActive: true,
    factoryLocation: "경기도 연천군 전곡읍",
    teamOrCategory: "2피스 알루미늄 CAN 라인",
    defaultProcessPresetId: "oem-dongwon",
    notes: "알루미늄 캔 음료 전용 충전/시밍 협력 라인 (비타500 캔 240ml)",
    createdAt: "2026-01-15",
    updatedAt: "2026-02-15",
  },
  {
    id: "mfg-seohung-osong",
    name: "서흥 오송공장",
    type: "oem",
    isActive: true,
    factoryLocation: "충청북도 청주시 흥덕구 오송읍",
    teamOrCategory: "젤리 성형/연질캡슐 라인",
    defaultProcessPresetId: "oem-seohung",
    notes: "건강기능식품 및 구미 젤리 제형 전문 협력처 (비타500 젤리 130g)",
    createdAt: "2026-02-01",
    updatedAt: "2026-03-08",
  },
  {
    id: "mfg-cosmax-jecheon",
    name: "코스맥스엔비티 제천공장",
    type: "oem",
    isActive: true,
    factoryLocation: "충청북도 제천시 바이오밸리로",
    teamOrCategory: "분말 스틱 / 건기식 라인",
    defaultProcessPresetId: "oem-cosmax",
    notes: "분말 멀티스틱 및 기능성 원료 배합 협력처 (비타500 데일리스틱)",
    createdAt: "2026-02-05",
    updatedAt: "2026-03-01",
  },
  {
    id: "mfg-kolmar-sejong",
    name: "콜마비앤에이치 세종공장",
    type: "oem",
    isActive: true,
    factoryLocation: "세종특별자치시 전의면",
    teamOrCategory: "건기식 정제/하드캡슐",
    defaultProcessPresetId: "oem-kolmar",
    notes: "비타민 정제, 타정 및 PTP 포장 외주 생산 라인",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-01",
  },
  {
    id: "mfg-sample-etc",
    name: "기타 협력 가공처",
    type: "etc",
    isActive: false,
    factoryLocation: "수도권 물류 포장센터",
    teamOrCategory: "2차 임가공/지함 세트 포장",
    notes: "특수 기획 세트 포장 및 외주 물류 임가공 라인 (미사용 샘플)",
    createdAt: "2025-11-01",
    updatedAt: "2025-12-31",
  },
];

/**
 * [표준 제조라인 Master 초기 데이터]
 * 제조처 ID(manufacturerId)에 1:N으로 연결되는 개별 생산 라인 규격
 */
export const DEFAULT_MANUFACTURE_LINES: ManufactureLineMaster[] = [
  // [광동제약 평택공장 소속 라인]
  {
    id: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    lineName: "1호 라인(유리병 충전)",
    productCategory: "유리병 비타민/혼합음료 100ml",
    description: "비타500 전용 초고속 유리병 세척, 충전 및 로터리 캡핑 라인",
    isActive: true,
    notes: "유리병 파손 방지 완충 이송 레일 및 캡핑 토크 온라인 모니터링 적용",
    createdAt: "2026-01-01",
    updatedAt: "2026-03-15",
  },
  {
    id: "line-kd-pt-02",
    manufacturerId: "mfg-kd-pyeongtaek",
    lineName: "2호 라인(PET 충전)",
    productCategory: "소형 PET 혼합음료 340ml/500ml",
    description: "PET 음료 무균 충전 및 라벨러/수축포장 라인",
    isActive: true,
    notes: "PET 프리폼 블로잉 및 인라인 제트 린싱 검사 시스템 구축",
    createdAt: "2026-01-05",
    updatedAt: "2026-02-20",
  },

  // [광동제약 송탄공장 소속 라인]
  {
    id: "line-kd-st-01",
    manufacturerId: "mfg-kd-songtan",
    lineName: "약사팀 2호 라인",
    productCategory: "전통 한방 생약제제 유리병 100ml",
    description: "광동 쌍화탕 등 전통 생약 추출액 멸균 및 약품용 갈색 유리병 충전 라인",
    isActive: true,
    notes: "의약품 GMP 규격 클린룸 클래스 10,000 및 최종 가압 가열 멸균 공정",
    createdAt: "2026-01-02",
    updatedAt: "2026-03-01",
  },
  {
    id: "line-kd-st-02",
    manufacturerId: "mfg-kd-songtan",
    lineName: "제제팀 파우치 충진라인",
    productCategory: "자양강장 고점도 스틱 파우치",
    description: "경옥고 스틱 파우치 전용 고점도 로터리 충전 및 4중 알루미늄 핫실링 라인",
    isActive: true,
    notes: "파우치 실링 압력/온도(180℃) 실시간 기록 및 이지컷(Easy-Cut) 인장 검사",
    createdAt: "2026-01-20",
    updatedAt: "2026-03-12",
  },
  {
    id: "line-kd-st-03",
    manufacturerId: "mfg-kd-songtan",
    lineName: "약사팀 소용량 액제 라인",
    productCategory: "차광 유리병 순환계 제제 50ml",
    description: "원방 우황청심원액 등 고가 생약 정제액 정밀 소용량 차광병 충전 라인",
    isActive: true,
    notes: "질소 치환 충전 및 3단 외관 비전 선별기 연동 라인",
    createdAt: "2026-01-22",
    updatedAt: "2026-02-18",
  },

  // [삼양패키징 광혜원공장 소속 라인]
  {
    id: "line-samyang-01",
    manufacturerId: "mfg-samyang-gwanghyewon",
    lineName: "Aseptic 2호기(무균 PET 라인)",
    productCategory: "무균 액상차 500ml",
    description: "옥수수수염차 500ml 전용 Aseptic 상온 무균 충전 라인",
    isActive: true,
    notes: "과산화수소(H2O2) 용기 멸균 및 완전 무균 챔버 Class 100 유지",
    createdAt: "2026-01-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "line-samyang-02",
    manufacturerId: "mfg-samyang-gwanghyewon",
    lineName: "대형 PET 라인",
    productCategory: "대용량 무균 액상차 1.5L",
    description: "옥수수수염차 1.5L 대형 무균 PET 고속 충전 및 팰릿타이징 라인",
    isActive: true,
    notes: "대용량 캡 헛돎 방지 서보 토크 캡퍼 운용",
    createdAt: "2026-01-18",
    updatedAt: "2026-03-05",
  },

  // [롯데칠성음료 안성공장 소속 라인]
  {
    id: "line-lotte-01",
    manufacturerId: "mfg-lottechilsung-anseong",
    lineName: "PET 1호 라인",
    productCategory: "Aseptic PET 차음료 500ml",
    description: "광동 힘찬하루 헛개차 500ml 생산 전용 무균 충전 및 수축 슬리브 라벨 라인",
    isActive: true,
    notes: "추출액 마이크로 멤브레인 필터(0.45μm) 정밀 여과 시스템",
    createdAt: "2026-01-12",
    updatedAt: "2026-02-28",
  },

  // [동원F&B 연천공장 소속 라인]
  {
    id: "line-dongwon-01",
    manufacturerId: "mfg-dongwon-yeoncheon",
    lineName: "CAN 충전/시밍 라인",
    productCategory: "2피스 알루미늄 캔 음료 240ml",
    description: "비타500 캔 240ml 전용 탄산 주입 충전 및 더블 시밍(Double Seaming) 라인",
    isActive: true,
    notes: "시밍 치수(외경, 롤러 압착률) 2시간 주기 파괴검사 성적 관리",
    createdAt: "2026-01-15",
    updatedAt: "2026-02-15",
  },

  // [서흥 오송공장 소속 라인]
  {
    id: "line-seohung-01",
    manufacturerId: "mfg-seohung-osong",
    lineName: "젤리 성형/포장라인",
    productCategory: "구미 젤리 / 스탠딩 지퍼백 130g",
    description: "비타500 젤리 성형 몰딩, 당의 코팅 및 질소치환 지퍼백 충전 라인",
    isActive: true,
    notes: "금속검출기(Fe 1.0mm, SUS 1.5mm) 전수 검사 및 중량선별기 통과",
    createdAt: "2026-02-01",
    updatedAt: "2026-03-08",
  },

  // [코스맥스엔비티 제천공장 소속 라인]
  {
    id: "line-cosmax-01",
    manufacturerId: "mfg-cosmax-jecheon",
    lineName: "분말 멀티스틱 라인",
    productCategory: "건강기능식품 분말 스틱 2g",
    description: "비타500 데일리스틱 고속 8열 멀티스틱 분말 충전 라인",
    isActive: true,
    notes: "온습도 제어실(상대습도 40% 이하) 분말 흡습 뭉침 방지 라인",
    createdAt: "2026-02-05",
    updatedAt: "2026-03-01",
  },

  // [콜마비앤에이치 세종공장 소속 라인]
  {
    id: "line-kolmar-01",
    manufacturerId: "mfg-kolmar-sejong",
    lineName: "건식 정제/PTP 블리스터 라인",
    productCategory: "건강기능식품 정제 / PTP",
    description: "로터리 고속 타정기 및 알루미늄 PTP 자동 블리스터 포장 라인",
    isActive: true,
    notes: "정제 경도 및 붕해도 관리, 자동 핀홀 검사기 가동",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-01",
  },
];

// =========================================================================
// [제조처 Master CRUD & Storage 함수]
// =========================================================================

export function loadAllManufacturers(): ManufacturerMaster[] {
  try {
    const raw = localStorage.getItem(MANUFACTURER_MASTER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        MANUFACTURER_MASTER_STORAGE_KEY,
        JSON.stringify(DEFAULT_MANUFACTURERS)
      );
      return DEFAULT_MANUFACTURERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_MANUFACTURERS;
  } catch (e) {
    console.error("Failed to load manufacturers from storage", e);
    return DEFAULT_MANUFACTURERS;
  }
}

export function saveAllManufacturers(manufacturers: ManufacturerMaster[]): void {
  try {
    localStorage.setItem(
      MANUFACTURER_MASTER_STORAGE_KEY,
      JSON.stringify(manufacturers)
    );
  } catch (e) {
    console.error("Failed to save manufacturers to storage", e);
  }
}

export function saveManufacturer(mfg: ManufacturerMaster): ManufacturerMaster[] {
  const current = loadAllManufacturers();
  const index = current.findIndex((m) => m.id === mfg.id);
  const now = new Date().toISOString().split("T")[0];

  let updated: ManufacturerMaster[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...mfg,
      updatedAt: now,
    };
  } else {
    updated = [
      {
        ...mfg,
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ];
  }

  saveAllManufacturers(updated);
  return updated;
}

export function toggleManufacturerActive(mfgId: string): ManufacturerMaster[] {
  const current = loadAllManufacturers();
  const updated = current.map((m) => {
    if (m.id === mfgId) {
      return {
        ...m,
        isActive: !m.isActive,
        updatedAt: new Date().toISOString().split("T")[0],
      };
    }
    return m;
  });
  saveAllManufacturers(updated);
  return updated;
}

export function deleteManufacturer(mfgId: string): ManufacturerMaster[] {
  const current = loadAllManufacturers();
  const target = current.find((m) => m.id === mfgId);

  let updated: ManufacturerMaster[];
  if (target?.isCustom) {
    updated = current.filter((m) => m.id !== mfgId);
  } else {
    // 기본 제조처는 안전을 위해 비활성화 처리
    updated = current.map((m) => (m.id === mfgId ? { ...m, isActive: false } : m));
  }

  saveAllManufacturers(updated);
  return updated;
}

export function findManufacturerById(id?: string): ManufacturerMaster | undefined {
  if (!id) return undefined;
  const list = loadAllManufacturers();
  return list.find((m) => m.id === id);
}

export function findManufacturerByName(name?: string): ManufacturerMaster | undefined {
  if (!name || !name.trim()) return undefined;
  const list = loadAllManufacturers();
  const normalized = name.trim().toLowerCase();

  const exact = list.find((m) => m.name.trim().toLowerCase() === normalized);
  if (exact) return exact;

  return list.find(
    (m) =>
      m.name.toLowerCase().includes(normalized) ||
      normalized.includes(m.name.toLowerCase())
  );
}

// =========================================================================
// [제조라인 Master CRUD & Storage 함수]
// =========================================================================

export function loadAllManufactureLines(): ManufactureLineMaster[] {
  try {
    const raw = localStorage.getItem(MANUFACTURE_LINE_MASTER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        MANUFACTURE_LINE_MASTER_STORAGE_KEY,
        JSON.stringify(DEFAULT_MANUFACTURE_LINES)
      );
      return DEFAULT_MANUFACTURE_LINES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_MANUFACTURE_LINES;
  } catch (e) {
    console.error("Failed to load lines from storage", e);
    return DEFAULT_MANUFACTURE_LINES;
  }
}

export function saveAllManufactureLines(lines: ManufactureLineMaster[]): void {
  try {
    localStorage.setItem(
      MANUFACTURE_LINE_MASTER_STORAGE_KEY,
      JSON.stringify(lines)
    );
  } catch (e) {
    console.error("Failed to save lines to storage", e);
  }
}

export function saveManufactureLine(line: ManufactureLineMaster): ManufactureLineMaster[] {
  const current = loadAllManufactureLines();
  const index = current.findIndex((l) => l.id === line.id);
  const now = new Date().toISOString().split("T")[0];

  let updated: ManufactureLineMaster[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...line,
      updatedAt: now,
    };
  } else {
    updated = [
      {
        ...line,
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ];
  }

  saveAllManufactureLines(updated);
  return updated;
}

export function toggleManufactureLineActive(lineId: string): ManufactureLineMaster[] {
  const current = loadAllManufactureLines();
  const updated = current.map((l) => {
    if (l.id === lineId) {
      return {
        ...l,
        isActive: !l.isActive,
        updatedAt: new Date().toISOString().split("T")[0],
      };
    }
    return l;
  });
  saveAllManufactureLines(updated);
  return updated;
}

export function deleteManufactureLine(lineId: string): ManufactureLineMaster[] {
  const current = loadAllManufactureLines();
  const target = current.find((l) => l.id === lineId);

  let updated: ManufactureLineMaster[];
  if (target?.isCustom) {
    updated = current.filter((l) => l.id !== lineId);
  } else {
    updated = current.map((l) => (l.id === lineId ? { ...l, isActive: false } : l));
  }

  saveAllManufactureLines(updated);
  return updated;
}

export function getLinesByManufacturerId(manufacturerId?: string): ManufactureLineMaster[] {
  if (!manufacturerId) return [];
  const list = loadAllManufactureLines();
  return list.filter((l) => l.manufacturerId === manufacturerId);
}

export function findLineById(lineId?: string): ManufactureLineMaster | undefined {
  if (!lineId) return undefined;
  const list = loadAllManufactureLines();
  return list.find((l) => l.id === lineId);
}

export function findLineByName(
  manufacturerId: string,
  lineName?: string
): ManufactureLineMaster | undefined {
  if (!lineName || !lineName.trim()) return undefined;
  const lines = getLinesByManufacturerId(manufacturerId);
  const normalized = lineName.trim().toLowerCase();

  const exact = lines.find((l) => l.lineName.trim().toLowerCase() === normalized);
  if (exact) return exact;

  return lines.find(
    (l) =>
      l.lineName.toLowerCase().includes(normalized) ||
      normalized.includes(l.lineName.toLowerCase())
  );
}

/**
 * 기본 표준 데이터로 리셋
 */
export function resetManufacturersAndLinesToDefault(): {
  manufacturers: ManufacturerMaster[];
  lines: ManufactureLineMaster[];
} {
  try {
    localStorage.setItem(
      MANUFACTURER_MASTER_STORAGE_KEY,
      JSON.stringify(DEFAULT_MANUFACTURERS)
    );
    localStorage.setItem(
      MANUFACTURE_LINE_MASTER_STORAGE_KEY,
      JSON.stringify(DEFAULT_MANUFACTURE_LINES)
    );
    return {
      manufacturers: DEFAULT_MANUFACTURERS,
      lines: DEFAULT_MANUFACTURE_LINES,
    };
  } catch (e) {
    console.error("Failed to reset manufacturers and lines", e);
    return {
      manufacturers: DEFAULT_MANUFACTURERS,
      lines: DEFAULT_MANUFACTURE_LINES,
    };
  }
}
