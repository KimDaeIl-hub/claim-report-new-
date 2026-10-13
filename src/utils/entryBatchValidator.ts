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
import { SeedClaimType } from "../data/seeds/claim-types.seed";
import {
  SeedBundle,
  SeedValidationIssue,
  validateSeedBundle,
} from "./seedImporter";
import {
  loadAllManufacturers,
  loadAllManufactureLines,
} from "../data/manufacturerMaster";

/**
 * 실제 회사 데이터 Batch 입력 검증기 (읽기 전용, 자동 수정 없음)
 *
 * - 기존 Type/storage/merge/import 구조 변경 없음, 새 필드 없음, AI 없음
 * - Batch = [{ type, data }] 형태의 입력 단위를 SeedBundle로 매핑하여
 *   기존 validateSeedBundle(필수·참조· ID 규칙)로 검증
 * - Batch 내부 ID 중복은 별도 검출
 */

export type EntryBatchType =
  | "Manufacturer"
  | "Line"
  | "Process"
  | "ProcessStep"
  | "Product"
  | "ClaimType"
  | "ClaimPreset"
  | "Phrase"
  | "Knowledge"
  | "PastClaim";

export interface EntryBatchItem {
  type: EntryBatchType;
  data: unknown;
}

export interface EntryBatchResult {
  valid: boolean;
  errors: SeedValidationIssue[];
  /** 자동 판단 불가 항목 (동명 이대상 등) — 사용자 확인용, 적용 차단 아님 */
  warnings: SeedValidationIssue[];
}

const EMPTY_BUNDLE: SeedBundle = {
  products: [],
  manufacturers: [],
  manufactureLines: [],
  factoryPresets: [],
  processSteps: [],
  presets: [],
  phrases: [],
  pastClaims: [],
  knowledgeItems: [],
  claimTypes: [],
};

function pushTyped<T>(arr: T[], value: unknown, typeName: string, errors: SeedValidationIssue[]): void {
  if (value && typeof value === "object") arr.push(value as T);
  else errors.push({ domain: typeName, seedId: "(no-id)", message: "형식 오류: 객체가 아님" });
}

/**
 * Batch 검증 (쓰기 없음, 문제 발견 시 오류 보고만 하고 자동 수정하지 않음)
 */
export function validateEntryBatch(items: EntryBatchItem[]): EntryBatchResult {
  const errors: SeedValidationIssue[] = [];
  const bundle: SeedBundle = {
    ...EMPTY_BUNDLE,
    products: [],
    manufacturers: [],
    manufactureLines: [],
    factoryPresets: [],
    processSteps: [],
    presets: [],
    phrases: [],
    pastClaims: [],
    knowledgeItems: [],
    claimTypes: [],
  };

  for (const item of items) {
    switch (item.type) {
      case "Manufacturer":
        pushTyped<ManufacturerMaster>(bundle.manufacturers, item.data, "manufacturers", errors);
        break;
      case "Line":
        pushTyped<ManufactureLineMaster>(bundle.manufactureLines, item.data, "manufactureLines", errors);
        break;
      case "Process":
        pushTyped<FactoryProcessPreset>(bundle.factoryPresets, item.data, "factoryPresets", errors);
        break;
      case "ProcessStep":
        pushTyped<ProcessStepMaster>(bundle.processSteps, item.data, "processSteps", errors);
        break;
      case "Product":
        pushTyped<ProductMaster>(bundle.products, item.data, "products", errors);
        break;
      case "ClaimType":
        pushTyped<SeedClaimType>(bundle.claimTypes, item.data, "claimTypes", errors);
        break;
      case "ClaimPreset":
        pushTyped<ClaimPreset>(bundle.presets, item.data, "presets", errors);
        break;
      case "Phrase":
        pushTyped<StandardPhrase>(bundle.phrases, item.data, "phrases", errors);
        break;
      case "Knowledge":
        pushTyped<ClaimKnowledgeItem>(bundle.knowledgeItems, item.data, "knowledgeItems", errors);
        break;
      case "PastClaim":
        pushTyped<ClaimKnowledgeItem>(bundle.pastClaims, item.data, "pastClaims", errors);
        break;
      default:
        errors.push({ domain: "batch", seedId: "(no-id)", message: `지원하지 않는 TYPE: ${String((item as EntryBatchItem).type)}` });
        break;
    }
  }

  // Batch 내부 ID 중복 검출 (도메인 무관, ID는 전역 유일 취급이 아님에 주의:
  // 동일 도메인 내에서만 검사 — 도메인마다 네임스페이스가 다름)
  const domains: [string, { id?: string }[]][] = [
    ["products", bundle.products],
    ["manufacturers", bundle.manufacturers],
    ["manufactureLines", bundle.manufactureLines],
    ["factoryPresets", bundle.factoryPresets],
    ["processSteps", bundle.processSteps],
    ["presets", bundle.presets],
    ["phrases", bundle.phrases],
    ["pastClaims", bundle.pastClaims],
    ["knowledgeItems", bundle.knowledgeItems],
    ["claimTypes", bundle.claimTypes],
  ];
  for (const [domain, list] of domains) {
    const seen = new Set<string>();
    for (const entry of list) {
      const id = entry?.id;
      if (!id) continue;
      if (seen.has(id)) errors.push({ domain, seedId: id, message: "Batch 내 ID 중복" });
      seen.add(id);
    }
  }

  errors.push(...validateSeedBundle(bundle));

  // 동일명 이대상 충돌 감지 (자동 병합하지 않고 사용자 확인용 경고)
  // - 제조처: 기존 저장소와 이름이 같으나 ID가 다르면 경고
  // - 라인: 동일 제조처 내에서 이름이 같으나 ID가 다르면 경고
  //         (제조처가 다르면 서로 다른 데이터로 취급, 경고 없음)
  const warnings: SeedValidationIssue[] = [];
  const normName = (s: unknown) =>
    typeof s === "string" ? s.trim().replace(/\s+/g, " ").toLowerCase() : "";
  let existingMfgs: { id: string; name: string }[] = [];
  let existingLines: { id: string; manufacturerId: string; lineName: string }[] = [];
  try {
    existingMfgs = loadAllManufacturers();
  } catch {
    // ignore
  }
  try {
    existingLines = loadAllManufactureLines();
  } catch {
    // ignore
  }
  const mfgNameToIds = new Map<string, string[]>();
  for (const m of existingMfgs) {
    const key = normName(m.name);
    if (!key) continue;
    const list = mfgNameToIds.get(key) || [];
    list.push(m.id);
    mfgNameToIds.set(key, list);
  }
  const resolveMfgId = (manufacturerId?: string, manufacturerName?: string): string | null => {
    if (manufacturerId) return manufacturerId;
    if (!manufacturerName) return null;
    const key = normName(manufacturerName);
    const inBatch = bundle.manufacturers.find((m) => normName(m.name) === key);
    if (inBatch) return inBatch.id;
    const existing = mfgNameToIds.get(key);
    if (existing && existing.length === 1) return existing[0];
    return null;
  };
  for (const m of bundle.manufacturers) {
    const key = normName((m as ManufacturerMaster).name);
    if (!key) continue;
    const clashing = (mfgNameToIds.get(key) || []).filter((id) => id !== m.id);
    if (clashing.length > 0) {
      warnings.push({
        domain: "manufacturers",
        seedId: m.id,
        message: `동일 제조처명 존재(ID 다름: ${clashing.join(",")}) — 동일 대상이면 기존 ID 사용, 다른 대상이면 유지. 사용자 확인 필요`,
      });
    }
  }
  const lineKey = (manufacturerId: string, lineName: string) =>
    `${manufacturerId}||${normName(lineName)}`;
  const existingLineKeys = new Map<string, string[]>();
  for (const l of existingLines) {
    const key = lineKey(l.manufacturerId, l.lineName);
    const list = existingLineKeys.get(key) || [];
    list.push(l.id);
    existingLineKeys.set(key, list);
  }
  for (const l of bundle.manufactureLines) {
    const lineName = normName((l as ManufactureLineMaster).lineName);
    if (!lineName) continue;
    const resolvedMfg = resolveMfgId(
      (l as ManufactureLineMaster).manufacturerId,
      (l as unknown as { manufacturer?: string }).manufacturer
    );
    if (!resolvedMfg) continue;
    const clashing = (existingLineKeys.get(lineKey(resolvedMfg, lineName)) || []).filter(
      (id) => id !== l.id
    );
    if (clashing.length > 0) {
      warnings.push({
        domain: "manufactureLines",
        seedId: l.id,
        message: `동일 제조처 내 동일 라인명 존재(ID 다름: ${clashing.join(",")}) — 사용자 확인 필요`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
