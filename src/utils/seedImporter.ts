import {
  ProductMaster,
  ManufacturerMaster,
  ManufactureLineMaster,
  ProcessStepMaster,
  ClaimPreset,
  StandardPhrase,
} from "../types";
import { FactoryProcessPreset } from "../data/factoryProcessPresets";
import { ClaimKnowledgeItem } from "../types/claimKnowledge";
import { loadAllProducts, saveAllProducts } from "../data/productMaster";
import {
  loadAllManufacturers,
  saveAllManufacturers,
  loadAllManufactureLines,
  saveAllManufactureLines,
} from "../data/manufacturerMaster";
import {
  loadAllFactoryPresets,
  saveAllFactoryPresets,
} from "../data/factoryProcessPresets";
import {
  loadAllProcessSteps,
  saveAllProcessSteps,
} from "../data/processStepMaster";
import { loadAllPresets, saveAllPresets } from "../data/presets";
import { loadAllPhrases, saveAllPhrases } from "../data/standardPhrases";
import {
  loadAllClaimKnowledge,
  CLAIM_KNOWLEDGE_STORAGE_KEY,
} from "../utils/claimKnowledgeStorage";
import { PRODUCT_SEEDS } from "../data/seeds/products.seed";
import { COMPANY_PRODUCT_SEEDS } from "../data/seeds/company-products.seed";
import {
  MANUFACTURER_SEEDS,
  MANUFACTURE_LINE_SEEDS,
} from "../data/seeds/manufacturers.seed";
import {
  COMPANY_MANUFACTURER_SEEDS,
  COMPANY_LINE_SEEDS,
} from "../data/seeds/company-manufacturers.seed";
import {
  FACTORY_PROCESS_SEEDS,
  PROCESS_STEP_SEEDS,
  GENERIC_PROCESS_PRESETS,
  GENERIC_PROCESS_STEPS,
} from "../data/seeds/processes.seed";
import {
  COMPANY_PROCESS_PRESETS,
  COMPANY_PROCESS_STEPS,
} from "../data/seeds/company-processes.seed";
import { PRESET_SEEDS, GENERIC_PRESET_SEEDS } from "../data/seeds/presets.seed";
import { PHRASE_SEEDS } from "../data/seeds/phrases.seed";
import { GENERIC_PHRASE_SEEDS } from "../data/seeds/generic-phrases.seed";
import { PAST_CLAIM_SEEDS } from "../data/seeds/past-claims.seed";
import { KNOWLEDGE_SEEDS, GENERIC_KNOWLEDGE_SEEDS } from "../data/seeds/knowledge-base.seed";
import {
  CLAIM_TYPE_SEEDS,
  SeedClaimType,
} from "../data/seeds/claim-types.seed";

/**
 * 품질 지식 Seed 일괄 입력 엔진 (규칙 기반, AI 호출 없음)
 *
 * 원칙:
 * - 기존 Type·ID·저장 키 그대로 사용, 새 키 생성 없음
 * - ID 기준 병합: 기존 데이터는 절대 덮어쓰지 않음 (기존 우선)
 * - 여러 번 실행해도 중복 생성 없음 (멱등)
 * - 존재하지 않는 ID 참조는 적용 전에 검출 (검증 후 유효 항목만 반영)
 */

export interface SeedBundle {
  products: ProductMaster[];
  manufacturers: ManufacturerMaster[];
  manufactureLines: ManufactureLineMaster[];
  factoryPresets: FactoryProcessPreset[];
  processSteps: ProcessStepMaster[];
  presets: ClaimPreset[];
  phrases: StandardPhrase[];
  pastClaims: ClaimKnowledgeItem[];
  knowledgeItems: ClaimKnowledgeItem[];
  claimTypes: SeedClaimType[];
}

export function collectSeedBundle(): SeedBundle {
  return {
    products: [...PRODUCT_SEEDS, ...COMPANY_PRODUCT_SEEDS],
    manufacturers: [...MANUFACTURER_SEEDS, ...COMPANY_MANUFACTURER_SEEDS],
    manufactureLines: [...MANUFACTURE_LINE_SEEDS, ...COMPANY_LINE_SEEDS],
    factoryPresets: [...FACTORY_PROCESS_SEEDS, ...GENERIC_PROCESS_PRESETS, ...COMPANY_PROCESS_PRESETS],
    processSteps: [...PROCESS_STEP_SEEDS, ...GENERIC_PROCESS_STEPS, ...COMPANY_PROCESS_STEPS],
    presets: [...PRESET_SEEDS, ...GENERIC_PRESET_SEEDS],
    phrases: [...PHRASE_SEEDS, ...GENERIC_PHRASE_SEEDS],
    pastClaims: PAST_CLAIM_SEEDS,
    knowledgeItems: [...KNOWLEDGE_SEEDS, ...GENERIC_KNOWLEDGE_SEEDS],
    claimTypes: CLAIM_TYPE_SEEDS,
  };
}

export interface MergeResult<T> {
  merged: T[];
  added: number;
  kept: number;
}

/** ID 기준 병합 (기존 우선, 중복 생성 없음) */
export function mergeById<T extends { id: string }>(existing: T[], seeds: T[]): MergeResult<T> {
  const seen = new Set(existing.map((e) => e.id));
  const merged = [...existing];
  let added = 0;
  for (const seed of seeds) {
    if (!seed || typeof seed.id !== "string" || seed.id.trim() === "") continue;
    if (seen.has(seed.id)) continue;
    seen.add(seed.id);
    merged.push(seed);
    added++;
  }
  return { merged, kept: existing.length, added };
}

export interface SeedValidationIssue {
  domain: string;
  seedId: string;
  message: string;
}

function guardedLoad<T>(loader: () => T[], fallback: T[] = []): T[] {
  try {
    const result = loader();
    return Array.isArray(result) ? result : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Seed 번들 검증 (쓰기 없음)
 * - 필수 필드 누락 검출
 * - 존재하지 않는 ID 참조 검출 (Seed 내 + 기존 저장소 합집합 기준)
 */
export function validateSeedBundle(bundle: SeedBundle): SeedValidationIssue[] {
  const issues: SeedValidationIssue[] = [];
  const err = (domain: string, seedId: string, message: string) =>
    issues.push({ domain, seedId, message });

  const existingProductIds = new Set(guardedLoad(loadAllProducts).map((p) => p.id));
  const existingMfgIds = new Set(guardedLoad(loadAllManufacturers).map((m) => m.id));
  const existingLineIds = new Set(guardedLoad(loadAllManufactureLines).map((l) => l.id));
  const existingFactoryIds = new Set(guardedLoad(loadAllFactoryPresets).map((p) => p.id));
  const existingPhraseIds = new Set(guardedLoad(loadAllPhrases).map((p) => p.id));

  const seedMfgIds = new Set(bundle.manufacturers.map((m) => m.id));
  const seedLineIds = new Set(bundle.manufactureLines.map((l) => l.id));
  const seedFactoryIds = new Set(bundle.factoryPresets.map((p) => p.id));
  const seedPhraseIds = new Set(bundle.phrases.map((p) => p.id));

  const mfgUnion = new Set([...existingMfgIds, ...seedMfgIds]);
  const lineUnion = new Set([...existingLineIds, ...seedLineIds]);
  const factoryUnion = new Set([...existingFactoryIds, ...seedFactoryIds]);
  const phraseUnion = new Set([...existingPhraseIds, ...seedPhraseIds]);

  for (const p of bundle.products) {
    if (!p.id?.trim()) err("products", "(no-id)", "ID 누락");
    if (!p.productName?.trim()) err("products", p.id || "(no-id)", "제품명 누락");
    if (p.manufacturerId && !mfgUnion.has(p.manufacturerId))
      err("products", p.id, `제조처 ID 미존재: ${p.manufacturerId}`);
    if (p.manufactureLineId && !lineUnion.has(p.manufactureLineId))
      err("products", p.id, `제조라인 ID 미존재: ${p.manufactureLineId}`);
    if (p.relatedProcessPresetId && !factoryUnion.has(p.relatedProcessPresetId))
      err("products", p.id, `제조공정 ID 미존재: ${p.relatedProcessPresetId}`);
  }
  for (const m of bundle.manufacturers) {
    if (!m.id?.trim()) err("manufacturers", "(no-id)", "ID 누락");
    if (!m.name?.trim()) err("manufacturers", m.id || "(no-id)", "제조처명 누락");
    if (typeof m.isActive !== "boolean")
      err("manufacturers", m.id || "(no-id)", "isActive 값 유효성 (boolean 필요)");
  }
  for (const l of bundle.manufactureLines) {
    if (!l.id?.trim()) err("manufactureLines", "(no-id)", "ID 누락");
    if (!l.lineName?.trim()) err("manufactureLines", l.id || "(no-id)", "라인명 누락");
    if (typeof l.isActive !== "boolean")
      err("manufactureLines", l.id || "(no-id)", "isActive 값 유효성 (boolean 필요)");
    if (!mfgUnion.has(l.manufacturerId))
      err("manufactureLines", l.id, `제조처 ID 미존재: ${l.manufacturerId}`);
  }
  for (const f of bundle.factoryPresets) {
    if (!f.id?.trim()) err("factoryPresets", "(no-id)", "ID 누락");
    if (!f.name?.trim()) err("factoryPresets", f.id || "(no-id)", "공정명 누락");
    if (!Array.isArray(f.processSteps) || f.processSteps.length === 0)
      err("factoryPresets", f.id, "공정 단계 비어 있음");
  }
  for (const s of bundle.processSteps) {
    if (!s.id?.trim()) err("processSteps", "(no-id)", "ID 누락");
    if (!s.processName?.trim()) err("processSteps", s.id || "(no-id)", "공정 단계명 누락");
    if (typeof s.stepNumber !== "number")
      err("processSteps", s.id, "stepNumber 누락");
    if (s.presetId && !factoryUnion.has(s.presetId))
      err("processSteps", s.id, `공정 프리셋 ID 미존재: ${s.presetId}`);
    if (s.manufacturerId && !mfgUnion.has(s.manufacturerId))
      err("processSteps", s.id, `제조처 ID 미존재: ${s.manufacturerId}`);
  }
  for (const p of bundle.presets) {
    if (!p.id?.trim()) err("presets", "(no-id)", "ID 누락");
    if (!p.name?.trim()) err("presets", p.id || "(no-id)", "프리셋명 누락");
    if (!p.data || typeof p.data !== "object")
      err("presets", p.id, "data 누락");
    for (const pid of p.linkedPhraseIds || []) {
      if (!phraseUnion.has(pid)) err("presets", p.id, `연계 상용구 ID 미존재: ${pid}`);
    }
  }
  for (const p of bundle.phrases) {
    if (!p.id?.trim()) err("phrases", "(no-id)", "ID 누락");
    if (!p.fieldKey?.trim()) err("phrases", p.id || "(no-id)", "fieldKey 누락");
    if (!p.title?.trim()) err("phrases", p.id || "(no-id)", "제목 누락");
    if (!p.content?.trim()) err("phrases", p.id || "(no-id)", "본문 누락");
  }
  for (const k of [...bundle.pastClaims, ...bundle.knowledgeItems]) {
    const domain = bundle.pastClaims.includes(k) ? "pastClaims" : "knowledgeItems";
    if (!k.id?.trim()) err(domain, "(no-id)", "ID 누락");
    if (!k.basicInfo?.productName?.trim())
      err(domain, k.id || "(no-id)", "basicInfo.productName 누락");
    if (!k.reportSnapshot || typeof k.reportSnapshot !== "object" || !k.reportSnapshot.id)
      err(domain, k.id || "(no-id)", "reportSnapshot 누락");
    if (typeof k.isApprovedForKnowledge !== "boolean")
      err(domain, k.id || "(no-id)", "isApprovedForKnowledge 누락");
  }
  for (const c of bundle.claimTypes) {
    if (!c.id?.trim()) err("claimTypes", "(no-id)", "ID 누락");
    if (!c.name?.trim()) err("claimTypes", c.id || "(no-id)", "유형명 누락");
  }

  // 번들 내 ID 중복 검출
  const checkDupes = (domain: string, ids: (string | undefined)[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (!id) continue;
      if (seen.has(id)) err(domain, id, "번들 내 ID 중복");
      seen.add(id);
    }
  };
  checkDupes("products", bundle.products.map((p) => p.id));
  checkDupes("phrases", bundle.phrases.map((p) => p.id));
  checkDupes("presets", bundle.presets.map((p) => p.id));

  return issues;
}

export interface SeedDomainPreview {
  domain: string;
  seeded: number;
  added: number;
  kept: number;
}

export interface DomainRegistrationStatus {
  domain: string;
  stored: number;
  seededTotal: number;
  pending: number;
  brokenLinks: string[];
}

export interface RegistrationStatusReport {
  domains: DomainRegistrationStatus[];
  totalStored: number;
  totalPending: number;
  totalBroken: number;
}

/**
 * 데이터 등록 현황 (읽기 전용, 쓰기 없음)
 * - 저장 건수 vs Seed 총수 vs 미반영(pending) vs 연결끊김(broken)
 * - 기존 데이터 우선 원칙 그대로 (여기서는 계산만 수행)
 */
export function getRegistrationStatus(): RegistrationStatusReport {
  const bundle = collectSeedBundle();
  const domains: DomainRegistrationStatus[] = [];

  const storedProducts = guardedLoad(loadAllProducts);
  const storedMfgs = guardedLoad(loadAllManufacturers);
  const storedLines = guardedLoad(loadAllManufactureLines);
  const storedFactory = guardedLoad(loadAllFactoryPresets);
  const storedSteps = guardedLoad(loadAllProcessSteps);
  const storedPresets = guardedLoad(loadAllPresets);
  const storedPhrases = guardedLoad(loadAllPhrases);
  const storedKnowledge = guardedLoad(loadAllClaimKnowledge);

  const pendingIds = <T extends { id: string }>(stored: T[], seeds: T[]): number => {
    const have = new Set(stored.map((s) => s.id));
    return seeds.filter((s) => s.id && !have.has(s.id)).length;
  };

  const mfgIds = new Set(storedMfgs.map((m) => m.id));
  const lineIds = new Set(storedLines.map((l) => l.id));
  const factoryIds = new Set(storedFactory.map((f) => f.id));
  const phraseIds = new Set(storedPhrases.map((p) => p.id));

  const brokenProducts: string[] = [];
  for (const p of storedProducts) {
    if (p.manufacturerId && !mfgIds.has(p.manufacturerId))
      brokenProducts.push(`${p.id}: 제조처 ID 미존재(${p.manufacturerId})`);
    if (p.manufactureLineId && !lineIds.has(p.manufactureLineId))
      brokenProducts.push(`${p.id}: 라인 ID 미존재(${p.manufactureLineId})`);
    if (p.relatedProcessPresetId && !factoryIds.has(p.relatedProcessPresetId))
      brokenProducts.push(`${p.id}: 공정 ID 미존재(${p.relatedProcessPresetId})`);
  }
  const brokenLines: string[] = [];
  for (const l of storedLines) {
    if (!mfgIds.has(l.manufacturerId))
      brokenLines.push(`${l.id}: 제조처 ID 미존재(${l.manufacturerId})`);
  }
  const brokenSteps: string[] = [];
  for (const s of storedSteps) {
    if (s.presetId) {
      const presetExists =
        factoryIds.has(s.presetId) ||
        bundle.factoryPresets.some((f) => f.id === s.presetId);
      if (!presetExists) brokenSteps.push(`${s.id}: 공정 ID 미존재(${s.presetId})`);
    }
  }
  const brokenPresets: string[] = [];
  for (const p of storedPresets) {
    for (const pid of p.linkedPhraseIds || []) {
      if (!phraseIds.has(pid)) brokenPresets.push(`${p.id}: 상용구 ID 미존재(${pid})`);
    }
  }
  const brokenKnowledge: string[] = [];
  for (const k of storedKnowledge) {
    if (!k.reportSnapshot || !k.reportSnapshot.id)
      brokenKnowledge.push(`${k.id}: 스냅샷 누락`);
  }

  const push = (
    domain: string,
    stored: { id: string }[],
    seeds: { id: string }[],
    broken: string[]
  ) => {
    domains.push({
      domain,
      stored: stored.length,
      seededTotal: seeds.length,
      pending: pendingIds(stored, seeds),
      brokenLinks: broken,
    });
  };

  push("products", storedProducts, bundle.products, brokenProducts);
  push("manufacturers", storedMfgs, bundle.manufacturers, []);
  push("manufactureLines", storedLines, bundle.manufactureLines, brokenLines);
  push("factoryPresets", storedFactory, bundle.factoryPresets, []);
  push("processSteps", storedSteps, bundle.processSteps, brokenSteps);
  push("presets", storedPresets, bundle.presets, brokenPresets);
  push("phrases", storedPhrases, bundle.phrases, []);
  push(
    "knowledgeItems",
    storedKnowledge,
    [...bundle.pastClaims, ...bundle.knowledgeItems],
    brokenKnowledge
  );
  push("claimTypes", [], bundle.claimTypes, []);

  return {
    domains,
    totalStored: domains.reduce((n, d) => n + d.stored, 0),
    totalPending: domains.reduce((n, d) => n + d.pending, 0),
    totalBroken: domains.reduce((n, d) => n + d.brokenLinks.length, 0),
  };
}

export interface SeedPreview {
  domains: SeedDomainPreview[];
  errors: SeedValidationIssue[];
  totalSeeded: number;
  totalAdded: number;
}

/** Import Preview (쓰기 없음): 영역별 건수 + 신규/유지 + 검증 오류 */
export function previewSeedImport(bundle: SeedBundle): SeedPreview {
  const errors = validateSeedBundle(bundle);
  const errorIds = new Set(errors.map((e) => `${e.domain}:${e.seedId}`));
  const valid = <T extends { id: string }>(domain: string, items: T[]): T[] =>
    items.filter((i) => !errorIds.has(`${domain}:${i.id}`));

  const domains: SeedDomainPreview[] = [];
  const measure = <T extends { id: string }>(
    domain: string,
    loader: () => T[],
    seeds: T[]
  ) => {
    const existing = guardedLoad(loader);
    const m = mergeById(existing, valid(domain, seeds));
    domains.push({ domain, seeded: seeds.length, added: m.added, kept: m.kept });
  };

  measure("products", loadAllProducts, bundle.products);
  measure("manufacturers", loadAllManufacturers, bundle.manufacturers);
  measure("manufactureLines", loadAllManufactureLines, bundle.manufactureLines);
  measure("factoryPresets", loadAllFactoryPresets, bundle.factoryPresets);
  measure("processSteps", loadAllProcessSteps, bundle.processSteps);
  measure("presets", loadAllPresets, bundle.presets);
  measure("phrases", loadAllPhrases, bundle.phrases);
  // 지식/과거클레임은 동일 저장소 공유, 검증 도메인별로 필터 후 합산
  const validKnowledge = valid("pastClaims", bundle.pastClaims).concat(
    valid("knowledgeItems", bundle.knowledgeItems)
  );
  const knowledgeMerge = mergeById(guardedLoad(loadAllClaimKnowledge), validKnowledge);
  domains.push({
    domain: "knowledgeItems",
    seeded: bundle.pastClaims.length + bundle.knowledgeItems.length,
    added: knowledgeMerge.added,
    kept: knowledgeMerge.kept,
  });
  domains.push({
    domain: "claimTypes",
    seeded: bundle.claimTypes.length,
    added: 0, // 별도 저장소 없음: 레지스트리 참조·검증용 (프리셋/상용구 claimType 참조 검증에 사용)
    kept: 0,
  });

  return {
    domains,
    errors,
    totalSeeded: domains.reduce((n, d) => n + d.seeded, 0),
    totalAdded: domains.reduce((n, d) => n + d.added, 0),
  };
}

function guardedSave<T>(saver: (items: T[]) => void, items: T[]): boolean {
  try {
    saver(items);
    return true;
  } catch {
    return false;
  }
}

function saveKnowledgeItems(items: ClaimKnowledgeItem[]): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(CLAIM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export interface SeedApplyReport extends SeedPreview {
  saved: Record<string, boolean>;
}

/**
 * Seed 적용 결과 안내 문구 (반환값 근거, 읽기 전용)
 * - 신규 0건이면 이미 등록된 상태로 구분 안내
 * - URL 존재만으로 성공 판단하지 않음 (호출 측에서 반환값으로 판정)
 */
export function describeSeedApplyResult(report: SeedApplyReport): string {
  const domains = Array.isArray((report as any)?.domains) ? report.domains : [];
  const kept = domains.reduce((n, d) => n + (d?.kept || 0), 0);
  const added = typeof report?.totalAdded === "number" ? report.totalAdded : 0;
  if (added > 0) {
    return `Seed 적용 완료: 신규 ${added}건 추가됨 (기존 ${kept}건 유지, 덮어쓰기 없음)`;
  }
  return `Seed 적용 완료: 이미 등록된 상태입니다 (추가 0건, 기존 ${kept}건 유지)`;
}

/**
 * Seed 일괄 적용 (멱등, 기존 데이터 보호)
 * - 검증 오류 항목은 제외하고 유효 항목만 반영
 * - 기존 ID는 절대 덮어쓰지 않음
 */
export function applySeedBundle(bundle: SeedBundle): SeedApplyReport {
  const preview = previewSeedImport(bundle);
  const errorIds = new Set(preview.errors.map((e) => `${e.domain}:${e.seedId}`));
  const valid = <T extends { id: string }>(domain: string, items: T[]): T[] =>
    items.filter((i) => !errorIds.has(`${domain}:${i.id}`));
  const saved: Record<string, boolean> = {};

  const applyStored = <T extends { id: string }>(
    domain: string,
    loader: () => T[],
    saver: (items: T[]) => void,
    seeds: T[]
  ) => {
    const m = mergeById(guardedLoad(loader), valid(domain, seeds));
    saved[domain] = guardedSave(saver, m.merged);
  };

  applyStored("products", loadAllProducts, saveAllProducts, bundle.products);
  applyStored("manufacturers", loadAllManufacturers, saveAllManufacturers, bundle.manufacturers);
  applyStored("manufactureLines", loadAllManufactureLines, saveAllManufactureLines, bundle.manufactureLines);
  applyStored("factoryPresets", loadAllFactoryPresets, saveAllFactoryPresets, bundle.factoryPresets);
  applyStored("processSteps", loadAllProcessSteps, saveAllProcessSteps, bundle.processSteps);
  applyStored("presets", loadAllPresets, saveAllPresets, bundle.presets);
  applyStored("phrases", loadAllPhrases, saveAllPhrases, bundle.phrases);

  const knowledgeSeeds = valid("pastClaims", bundle.pastClaims).concat(
    valid("knowledgeItems", bundle.knowledgeItems)
  );
  const knowledgeMerge = mergeById(guardedLoad(loadAllClaimKnowledge), knowledgeSeeds);
  saved["knowledgeItems"] = saveKnowledgeItems(knowledgeMerge.merged);
  saved["claimTypes"] = true; // 레지스트리 참조용 (별도 저장소 없음)

  return { ...preview, saved };
}
