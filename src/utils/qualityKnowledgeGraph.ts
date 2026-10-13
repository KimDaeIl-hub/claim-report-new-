import { ProductMaster, ManufacturerMaster, ManufactureLineMaster, ClaimPreset, StandardPhrase } from "../types";
import { FactoryProcessPreset, loadAllFactoryPresets } from "../data/factoryProcessPresets";
import { loadAllProductMasters } from "../data/productMaster";
import { loadAllManufacturers, loadAllManufactureLines } from "../data/manufacturerMaster";
import { loadAllPresets } from "../data/presets";
import { loadAllPhrases } from "../data/standardPhrases";
import { loadAllHistoricalClaims, PastClaimItem, extractClaimTypeLabel } from "./pastClaimManager";
import { loadAllClaimKnowledge } from "./claimKnowledgeStorage";
import { ClaimKnowledgeItem } from "../types/claimKnowledge";

export interface QualityClaimTypeItem {
  id: string;
  name: string;
  category: string;
  description: string;
  badgeColor: string;
  riskLevel: "고위험" | "중위험" | "일반";
  commonRootCauses: string[];
}

export const STANDARD_CLAIM_TYPE_ITEMS: QualityClaimTypeItem[] = [
  {
    id: "claim-foreign",
    name: "이물 (혼입)",
    category: "foreign",
    description: "유리 파편, 고무 가스켓 마모편, 금속, 탄화물, 벌레 등 외래 및 공정 이물",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    riskLevel: "고위험",
    commonRootCauses: ["충전 노즐 밸브 패킹 마모 박리", "공정 여과망(150 Mesh) 파손", "공병 린싱 불량"],
  },
  {
    id: "claim-spoilage",
    name: "변질 / 산패 / 곰팡이",
    category: "spoilage",
    description: "개봉 후 상온 방치, 효모/진균 증식, 산패, 핀홀 누액으로 인한 기밀 해제",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    riskLevel: "고위험",
    commonRootCauses: ["유통 중 충격으로 인한 미세 핀홀", "개봉 후 음용 지연 상온 방치", "살균 온도(CCP-1B) 기준 미달"],
  },
  {
    id: "claim-breakage",
    name: "용기 파손 / 유리 크랙",
    category: "breakage",
    description: "유리병 외력 타격 파손, 캔 찌그러짐, 파우치 터짐",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    riskLevel: "고위험",
    commonRootCauses: ["물류 운송 중 타격 및 파렛트 적재 충격", "공병 공급처 내압 강도 미달", "소비자 취급 부주의"],
  },
  {
    id: "claim-cap",
    name: "캡 / 밀봉 불량 / 누액",
    category: "cap",
    description: "ROPP 캡 헛돎, 실링 라이너 탄화물, 캡핑 토크 규격 이탈, 파우치 실링 불량",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    riskLevel: "중위험",
    commonRootCauses: ["캡핑 헤드 롤러 마모", "캡핑 토크(Sealing Torque) 규격 미달", "실링 핫멜트 온도 편차"],
  },
  {
    id: "claim-sediment",
    name: "침전물 / 혼탁 / 결정",
    category: "sediment",
    description: "천연 생약/과즙 원료 식이섬유 응집, 칼슘 결정 석출, 혼탁 발생",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
    riskLevel: "일반",
    commonRootCauses: ["천연 옥수수/헛개 추출물 불용성 성분 응집", "저온 보관 시 타우린/비타민C 결정 석출", "살균 후 냉각 편차"],
  },
  {
    id: "claim-taste",
    name: "맛 / 이취 이상",
    category: "taste",
    description: "원료 배합 편차, 탄산 압력 저하, 고온 직사광선 노출 산화취",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
    riskLevel: "중위험",
    commonRootCauses: ["유통 매장 직사광선 장기 노출", "배합 탱크 교반 시간 부족", "보관 온도 관리 기준 이탈"],
  },
  {
    id: "claim-packaging",
    name: "포장 불량 / 라벨 누락",
    category: "packaging",
    description: "라벨 인쇄 번짐, 유통기한 날인 식별 불가, 수축필름 주름",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    riskLevel: "일반",
    commonRootCauses: ["자동 라벨러 롤러 압력 이상", "잉크젯 마킹기 노즐 막힘", "수축터널 열풍 온도 불균일"],
  },
];

export interface InterlinkedKnowledgeGraph {
  products: ProductMaster[];
  manufacturers: ManufacturerMaster[];
  manufactureLines: ManufactureLineMaster[];
  processes: FactoryProcessPreset[];
  claimTypes: QualityClaimTypeItem[];
  templates: ClaimPreset[];
  phrases: StandardPhrase[];
  pastClaims: PastClaimItem[];
  knowledgeItems: ClaimKnowledgeItem[];
}

/** 탭별 검색 범위 안내 (빈 결과 안내용) */
export const KC_SEARCH_SCOPES: Record<string, string> = {
  products: "제품명·코드·용량·포장·제조처·라인",
  manufacturers: "제조처명·소재지·담당 품목군",
  processes: "공정명·흐름·단계·설명",
  claimTypes: "유형명·설명·위험요인",
  templates: "프리셋명·설명·분류",
  phrases: "제목·본문·유형·항목",
  pastClaims: "제품·유형·Lot·라인·조사자",
  knowledge: "제품·유형·Lot·원인분야·상세·제조처",
};

function includesCI(haystack: string | undefined | null, q: string): boolean {
  return !!haystack && haystack.toLowerCase().includes(q);
}

/** 안전 소문자 (비문자열이면 빈 문자열 — 렌더/매칭 중단 방지, 원본 불변) */
function S(v: unknown): string {
  return typeof v === "string" ? v.toLowerCase() : "";
}

/** 안전 배열 (비배열이면 빈 배열) */
function A<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

/**
 * 지식 항목 렌더 안전 정규화 (읽기 전용 복사본)
 * - 저장소에 중첩 객체가 누락된 항목이 있어도 화면 전체가 중단되지 않도록
 *   동일한 스키마 형태의 안전한 기본값으로 채운 복사본을 반환
 * - 원본 객체·저장 데이터는 절대 변경하지 않음 (쓰기 없음)
 * - 누락 표시는 렌더 측에서 "(이름 없음)" 등 폴백 텍스트로 처리
 */
export function normalizeKnowledgeItem(k: ClaimKnowledgeItem): ClaimKnowledgeItem {
  if (!k || typeof k !== "object") return k;
  // Object.assign 사용 (스프레드 중복 키 TS2783 회피, 뒤 인자가 우선 — 기존값 유지 의미)
  const basic = (k.basicInfo || {}) as Partial<ClaimKnowledgeItem["basicInfo"]>;
  const inv = (k.investigationInfo || {}) as Partial<ClaimKnowledgeItem["investigationInfo"]>;
  const res = (k.resultInfo || {}) as Partial<ClaimKnowledgeItem["resultInfo"]>;
  const con = (k.conclusionInfo || {}) as Partial<ClaimKnowledgeItem["conclusionInfo"]>;
  const rep = (k.reportInfo || {}) as Partial<ClaimKnowledgeItem["reportInfo"]>;
  return {
    ...k,
    basicInfo: Object.assign(
      {
        productName: "",
        productType: "",
        manufacturer: "",
        manufactureLine: "",
        lotNumber: "",
        claimType: "",
      },
      basic
    ),
    investigationInfo: Object.assign(
      {
        investigationItems: [],
        investigationMethods: [],
        relatedProcesses: [],
        relatedEquipments: [],
        analysisMethods: [],
      },
      inv
    ),
    resultInfo: Object.assign(
      {
        storageSampleResult: "",
        storageSampleStatus: "",
        manufacturingRecordResult: "",
        manufacturingRecordStatus: "",
        qualityInspectionResult: "",
        qualityInspectionStatus: "",
        processInvestigationResult: "",
        processInvestigationStatus: "",
        rawMaterialResult: "",
        rawMaterialStatus: "",
      },
      res
    ),
    conclusionInfo: Object.assign(
      {
        isCauseIdentified: false,
        causeStatusLabel: "원인 불명",
        causeCategory: "",
        causeDetail: "",
        conclusionSummary: [],
        preventiveMeasures: "",
      },
      con
    ),
    reportInfo: Object.assign(
      {
        usedPhrases: [],
        usedPhraseCount: 0,
        attachmentCount: 0,
        attachmentSummaries: [],
        photoCount: 0,
        photoSummaries: [],
        researcherName: "",
        completedDate: "",
      },
      rep
    ),
  };
}
/**
 * 지식센터 통합 검색 (탭별 필터, 읽기 전용)
 * - 기존 인라인 필터와 동등 + 검색 필드 확장
 * - Master(제품)와 승인 과거클레임은 분리 유지 (합치지 않음)
 */
export function filterKnowledgeCenter(graph: InterlinkedKnowledgeGraph, rawQuery: string) {
  const q = (rawQuery || "").toLowerCase().trim();
  const products = graph.products.filter((p) => {
    if (!q) return true;
    return (
      includesCI(p.productName, q) ||
      includesCI(p.productCode, q) ||
      includesCI(p.volume, q) ||
      includesCI(p.packageType, q) ||
      includesCI(p.containerType, q) ||
      includesCI(p.manufacturer, q) ||
      includesCI(p.manufactureLine, q) ||
      includesCI(p.subProductType, q) ||
      A(p.primaryClaimTypes).some((ct) => includesCI(ct, q))
    );
  });
  const manufacturers = graph.manufacturers.filter((m) => {
    if (!q) return true;
    return (
      includesCI(m.name, q) ||
      includesCI(m.factoryLocation, q) ||
      includesCI(m.teamOrCategory, q)
    );
  });
  const processes = graph.processes.filter((pr) => {
    if (!q) return true;
    return (
      includesCI(pr.name, q) ||
      includesCI(pr.processFlow, q) ||
      includesCI(pr.description, q) ||
      A(pr.processSteps).some((s) => includesCI(s, q))
    );
  });
  const claimTypes = graph.claimTypes.filter((ct) => {
    if (!q) return true;
    return (
      includesCI(ct.name, q) ||
      includesCI(ct.description, q) ||
      includesCI(ct.category, q) ||
      includesCI(ct.riskLevel, q) ||
      A(ct.commonRootCauses).some((c) => includesCI(c, q))
    );
  });
  const templates = graph.templates.filter((tpl) => {
    if (!q) return true;
    return (
      includesCI(tpl.name, q) ||
      includesCI(tpl.description, q) ||
      includesCI(tpl.category, q) ||
      includesCI(tpl.subCategory, q)
    );
  });
  const phrases = graph.phrases.filter((ph) => {
    if (!q) return true;
    return (
      includesCI(ph.title, q) ||
      includesCI(ph.content, q) ||
      includesCI(ph.claimType, q) ||
      includesCI(ph.investigationItem, q) ||
      includesCI(ph.fieldKey, q)
    );
  });
  const pastClaims = graph.pastClaims.filter((c) => {
    if (!q) return true;
    return (
      includesCI(c.productName, q) ||
      includesCI(c.claimType, q) ||
      includesCI(c.lotNumber, q) ||
      includesCI(c.manufactureLine, q) ||
      includesCI(c.researcherName, q) ||
      includesCI(c.receivedAt, q)
    );
  });
  // 지식 항목은 렌더 안전 정규화 후 필터 (중첩 누락 시에도 화면 중단 없음)
  const knowledgeItems = graph.knowledgeItems.map(normalizeKnowledgeItem).filter((k) => {
    if (!q) return true;
    return (
      includesCI(k.basicInfo.productName, q) ||
      includesCI(k.basicInfo.claimType, q) ||
      includesCI(k.basicInfo.lotNumber, q) ||
      includesCI(k.basicInfo.manufacturer, q) ||
      includesCI(k.basicInfo.manufactureLine, q) ||
      includesCI(k.conclusionInfo.causeCategory, q) ||
      includesCI(k.conclusionInfo.causeDetail, q) ||
      A(k.conclusionInfo.conclusionSummary).some((s) => includesCI(s, q))
    );
  });
  return {
    products,
    manufacturers,
    processes,
    claimTypes,
    templates,
    phrases,
    pastClaims,
    knowledgeItems,
  };
}

/**
 * 전체 8대 지식 저장소 통합 데이터베이스 로드
 */
export function loadCompleteKnowledgeGraph(): InterlinkedKnowledgeGraph {
  const products = loadAllProductMasters();
  const manufacturers = loadAllManufacturers();
  const manufactureLines = loadAllManufactureLines();
  const processes = loadAllFactoryPresets();
  const claimTypes = STANDARD_CLAIM_TYPE_ITEMS;
  const templates = loadAllPresets();
  const phrases = loadAllPhrases();
  const pastClaims = loadAllHistoricalClaims();
  const knowledgeItems = loadAllClaimKnowledge();

  return {
    products,
    manufacturers,
    manufactureLines,
    processes,
    claimTypes,
    templates,
    phrases,
    pastClaims,
    knowledgeItems,
  };
}

/**
 * 특정 제품(Product) 기준 연계된 모든 정보 360° 조회
 */
export function getProduct360View(product: ProductMaster, graph: InterlinkedKnowledgeGraph) {
  const pName = S(product.productName);

  // 1. 제조처 & 라인
  const manufacturer = graph.manufacturers.find(
    (m) => m.id === product.manufacturerId || m.name === product.manufacturer
  ) || null;

  const lines = graph.manufactureLines.filter(
    (l) => l.manufacturerId === product.manufacturerId || l.id === product.manufactureLineId
  );

  // 2. 관련 제조공정
  const process = graph.processes.find(
    (pr) =>
      pr.id === product.relatedProcessPresetId ||
      (manufacturer && S(pr.name).includes(S(manufacturer.name))) ||
      S(pr.name).includes(S(product.manufacturer))
  ) || null;

  // 3. 관련 클레임 유형
  const linkedClaimTypes = graph.claimTypes.filter((ct) => {
    if (A(product.primaryClaimTypes).some((pct) => ct.name.includes(S(pct)) || S(pct).includes(ct.name))) return true;
    return false;
  });

  // 4. 관련 조사 템플릿
  const templates = graph.templates.filter((tpl) => {
    const tName = S(tpl.name);
    const tDesc = S(tpl.description);
    const tProduct = S(tpl.data?.productInfo?.productName);
    return (
      tName.includes(pName) ||
      tProduct.includes(pName) ||
      tDesc.includes(pName) ||
      linkedClaimTypes.some((ct) => tpl.category === ct.category || tpl.subCategory === ct.category)
    );
  });

  // 5. 관련 상용구
  const phrases = graph.phrases.filter((ph) => {
    const text = `${ph.title || ""} ${ph.content || ""} ${ph.category || ""}`.toLowerCase();
    if (text.includes(pName)) return true;
    if (linkedClaimTypes.some((ct) => ph.category && ph.category.includes(ct.category))) return true;
    return false;
  });

  // 6. 과거 클레임 이력
  const pastClaims = graph.pastClaims.filter((c) => {
    const cProd = S(c.productName);
    return cProd.includes(pName) || pName.includes(cProd);
  });

  // 7. 품질 지식 (Knowledge)
  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kProd = S(k.basicInfo?.productName);
    return kProd.includes(pName) || pName.includes(kProd);
  });

  return {
    product,
    manufacturer,
    lines,
    process,
    linkedClaimTypes,
    templates,
    phrases,
    pastClaims,
    knowledgeItems,
  };
}

/**
 * 특정 제조처(Manufacturer) 기준 연계된 모든 정보 360° 조회
 */
export function getManufacturer360View(mfg: ManufacturerMaster, graph: InterlinkedKnowledgeGraph) {
  const mName = S(mfg.name);

  const lines = graph.manufactureLines.filter((l) => l.manufacturerId === mfg.id);

  const products = graph.products.filter(
    (p) => p.manufacturerId === mfg.id || S(p.manufacturer).includes(mName)
  );

  const process = graph.processes.find(
    (pr) => pr.id === mfg.defaultProcessPresetId || S(pr.name).includes(mName) || mName.includes(S(pr.name))
  ) || null;

  const pastClaims = graph.pastClaims.filter((c) => {
    const cLine = S(c.manufactureLine);
    const cRepMfg = S(c.report?.productInfo?.manufacturer);
    return cLine.includes(mName) || cRepMfg.includes(mName);
  });

  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kMfg = S(k.basicInfo?.manufacturer);
    return kMfg.includes(mName);
  });

  const templates = graph.templates.filter((tpl) => {
    const tMfg = S(tpl.data?.productInfo?.manufacturer);
    return tMfg.includes(mName);
  });

  const phrases = graph.phrases.filter((ph) => {
    const text = `${ph.title} ${ph.content}`.toLowerCase();
    return text.includes(mName) || (mfg.type === "oem" && text.includes("oem"));
  });

  return {
    mfg,
    lines,
    products,
    process,
    templates,
    phrases,
    pastClaims,
    knowledgeItems,
  };
}

/**
 * 특정 제조공정(Process) 기준 연계된 모든 정보 360° 조회
 */
export function getProcess360View(process: FactoryProcessPreset, graph: InterlinkedKnowledgeGraph) {
  const prName = S(process.name);

  const manufacturer = graph.manufacturers.find(
    (m) => prName.includes(S(m.name)) || S(m.name).includes(prName)
  ) || null;

  const products = graph.products.filter(
    (p) =>
      p.relatedProcessPresetId === process.id ||
      (manufacturer && p.manufacturerId === manufacturer.id) ||
      prName.includes(S(p.manufacturer))
  );

  const pastClaims = graph.pastClaims.filter((c) => {
    const cFlow = S(c.report?.manufacturingProcess?.processFlow);
    const cMfg = S(c.report?.productInfo?.manufacturer);
    return cFlow.includes(prName) || (manufacturer && cMfg.includes(S(manufacturer.name)));
  });

  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kProc = A(k.investigationInfo?.relatedProcesses).join(" ").toLowerCase();
    const kMfg = S(k.basicInfo?.manufacturer);
    return kProc.includes(prName) || (manufacturer && kMfg.includes(S(manufacturer.name)));
  });

  const templates = graph.templates.filter((tpl) => {
    const tFlow = S(tpl.data?.manufacturingProcess?.processFlow);
    return tFlow.includes(prName);
  });

  const phrases = graph.phrases.filter((ph) => {
    const key = S(ph.fieldKey);
    return key.includes("process") || key.includes("filtration") || key.includes("cleaning");
  });

  return {
    process,
    manufacturer,
    products,
    templates,
    phrases,
    pastClaims,
    knowledgeItems,
  };
}

/**
 * 특정 클레임 유형(Claim Type) 기준 연계된 모든 정보 360° 조회
 */
export function getClaimType360View(claimType: QualityClaimTypeItem, graph: InterlinkedKnowledgeGraph) {
  const ctName = claimType.name.toLowerCase();
  const ctCat = claimType.category.toLowerCase();

  const products = graph.products.filter((p) => {
    return A(p.primaryClaimTypes).some((pct) => ctName.includes(S(pct)) || S(pct).includes(ctName));
  });

  const templates = graph.templates.filter((tpl) => {
    return tpl.category === ctCat || tpl.subCategory === ctCat || S(tpl.name).includes(ctName);
  });

  const phrases = graph.phrases.filter((ph) => {
    return S(ph.category).includes(ctCat) || S(ph.title).includes(ctName);
  });

  const pastClaims = graph.pastClaims.filter((c) => {
    const cType = S(c.claimType);
    return cType.includes(ctName) || ctName.includes(cType);
  });

  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kType = S(k.basicInfo?.claimType);
    return kType.includes(ctName) || ctName.includes(kType);
  });

  const processes = graph.processes.filter((pr) => {
    if (ctCat === "foreign") return pr.filtrationAnalysis || pr.cleaningAnalysis;
    if (ctCat === "spoilage") return S(pr.criticalControlPoint).includes("살균") || S(pr.criticalControlPoint).includes("ccp");
    return true;
  });

  return {
    claimType,
    products,
    templates,
    phrases,
    pastClaims,
    knowledgeItems,
    processes,
  };
}
