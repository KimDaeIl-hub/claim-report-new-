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
  const pName = product.productName.toLowerCase();

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
      (manufacturer && pr.name.includes(manufacturer.name)) ||
      pr.name.includes(product.manufacturer)
  ) || null;

  // 3. 관련 클레임 유형
  const linkedClaimTypes = graph.claimTypes.filter((ct) => {
    if (product.primaryClaimTypes?.some((pct) => ct.name.includes(pct) || pct.includes(ct.name))) return true;
    return false;
  });

  // 4. 관련 조사 템플릿
  const templates = graph.templates.filter((tpl) => {
    const tName = tpl.name.toLowerCase();
    const tDesc = (tpl.description || "").toLowerCase();
    const tProduct = (tpl.data.productInfo?.productName || "").toLowerCase();
    return (
      tName.includes(pName) ||
      tProduct.includes(pName) ||
      tDesc.includes(pName) ||
      linkedClaimTypes.some((ct) => tpl.category === ct.category || tpl.subCategory === ct.category)
    );
  });

  // 5. 관련 상용구
  const phrases = graph.phrases.filter((ph) => {
    const text = `${ph.title} ${ph.content} ${ph.category || ""}`.toLowerCase();
    if (text.includes(pName)) return true;
    if (linkedClaimTypes.some((ct) => ph.category && ph.category.includes(ct.category))) return true;
    return false;
  });

  // 6. 과거 클레임 이력
  const pastClaims = graph.pastClaims.filter((c) => {
    const cProd = c.productName.toLowerCase();
    return cProd.includes(pName) || pName.includes(cProd);
  });

  // 7. 품질 지식 (Knowledge)
  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kProd = k.basicInfo.productName.toLowerCase();
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
  const mName = mfg.name.toLowerCase();

  const lines = graph.manufactureLines.filter((l) => l.manufacturerId === mfg.id);

  const products = graph.products.filter(
    (p) => p.manufacturerId === mfg.id || p.manufacturer.toLowerCase().includes(mName)
  );

  const process = graph.processes.find(
    (pr) => pr.id === mfg.defaultProcessPresetId || pr.name.toLowerCase().includes(mName) || mName.includes(pr.name.toLowerCase())
  ) || null;

  const pastClaims = graph.pastClaims.filter((c) => {
    const cLine = c.manufactureLine.toLowerCase();
    const cRepMfg = (c.report?.productInfo?.manufacturer || "").toLowerCase();
    return cLine.includes(mName) || cRepMfg.includes(mName);
  });

  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kMfg = k.basicInfo.manufacturer.toLowerCase();
    return kMfg.includes(mName);
  });

  const templates = graph.templates.filter((tpl) => {
    const tMfg = (tpl.data.productInfo?.manufacturer || "").toLowerCase();
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
  const prName = process.name.toLowerCase();

  const manufacturer = graph.manufacturers.find(
    (m) => prName.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(prName)
  ) || null;

  const products = graph.products.filter(
    (p) =>
      p.relatedProcessPresetId === process.id ||
      (manufacturer && p.manufacturerId === manufacturer.id) ||
      prName.includes(p.manufacturer.toLowerCase())
  );

  const pastClaims = graph.pastClaims.filter((c) => {
    const cFlow = (c.report?.manufacturingProcess?.processFlow || "").toLowerCase();
    const cMfg = (c.report?.productInfo?.manufacturer || "").toLowerCase();
    return cFlow.includes(prName) || (manufacturer && cMfg.includes(manufacturer.name.toLowerCase()));
  });

  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kProc = k.investigationInfo.relatedProcesses.join(" ").toLowerCase();
    const kMfg = k.basicInfo.manufacturer.toLowerCase();
    return kProc.includes(prName) || (manufacturer && kMfg.includes(manufacturer.name.toLowerCase()));
  });

  const templates = graph.templates.filter((tpl) => {
    const tFlow = (tpl.data.manufacturingProcess?.processFlow || "").toLowerCase();
    return tFlow.includes(prName);
  });

  const phrases = graph.phrases.filter((ph) => {
    return ph.fieldKey.includes("process") || ph.fieldKey.includes("filtration") || ph.fieldKey.includes("cleaning");
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
    return p.primaryClaimTypes?.some((pct) => pct.toLowerCase().includes(ctName) || ctName.includes(pct.toLowerCase()));
  });

  const templates = graph.templates.filter((tpl) => {
    return tpl.category === ctCat || tpl.subCategory === ctCat || tpl.name.toLowerCase().includes(ctName);
  });

  const phrases = graph.phrases.filter((ph) => {
    return (ph.category || "").toLowerCase().includes(ctCat) || ph.title.toLowerCase().includes(ctName);
  });

  const pastClaims = graph.pastClaims.filter((c) => {
    const cType = c.claimType.toLowerCase();
    return cType.includes(ctName) || ctName.includes(cType);
  });

  const knowledgeItems = graph.knowledgeItems.filter((k) => {
    const kType = k.basicInfo.claimType.toLowerCase();
    return kType.includes(ctName) || ctName.includes(kType);
  });

  const processes = graph.processes.filter((pr) => {
    if (ctCat === "foreign") return pr.filtrationAnalysis || pr.cleaningAnalysis;
    if (ctCat === "spoilage") return pr.criticalControlPoint.includes("살균") || pr.criticalControlPoint.includes("CCP");
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
