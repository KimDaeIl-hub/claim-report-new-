# 실제 회사 품질지식 Data Entry 규격 (P21 확정)

> 원칙: 기존 TypeScript interface / storage key / `mergeById` / Seed Import 구조 변경 없음.
> 새 필드 추가 금지. AI/LLM 사용 금지. 제공되지 않은 값은 추정하지 않는다.

## 0. 실제 Schema (현황 기준)

### ProductMaster (`src/types.ts:437`)

- 필수: `id`, `productName`, `productCode`, `productType`, `subProductType`, `volume`,
  `packageType`, `containerType`, `manufacturer`, `manufactureLine`, `isActive`,
  `primaryClaimTypes: string[]`
- 선택: `manufacturerId?`, `manufactureLineId?`, `description?`,
  `relatedProcessPresetId?`, `relatedProcessName?`, `notes?`,
  `isCustom?`, `createdAt?`, `updatedAt?`
- 저장: `kwangdong_product_master_v1` (`src/data/productMaster.ts`)
- Seed 위치: `src/data/seeds/products.seed.ts`

### ManufacturerMaster (`src/types.ts:473`)

- 필수: `id`, `name`, `type ("internal" | "oem" | "etc")`, `isActive`
- 선택: `notes?`, `factoryLocation?`, `teamOrCategory?`,
  `defaultProcessPresetId?`, `createdAt?`, `updatedAt?`, `isCustom?`
- 저장: `kwangdong_manufacturer_master_v1` (`src/data/manufacturerMaster.ts`)
- Seed 위치: `src/data/seeds/manufacturers.seed.ts`

### ManufactureLineMaster (`src/types.ts:491`)

- 필수: `id`, `manufacturerId` (→ ManufacturerMaster.id), `lineName`,
  `productCategory`, `isActive`
- 선택: `description?`, `notes?`, `createdAt?`, `updatedAt?`, `isCustom?`
- 저장: `kwangdong_manufacture_line_master_v1`
- Seed 위치: `src/data/seeds/manufacturers.seed.ts`

### FactoryProcessPreset (`src/data/factoryProcessPresets.ts:1`)

- 필수: `id`, `name`, `type ("internal" | "oem")`, `teamOrCategory`,
  `description`, `processFlow`, `processSteps: string[]`,
  `filtrationAnalysis`, `cleaningAnalysis`, `criticalControlPoint`
- 선택: `isCustom?`
- 저장: `food_qc_custom_factory_process_presets_v1`
- Seed 위치: `src/data/seeds/processes.seed.ts`
- 주의: CCP 정보 미제공 시 임의 작성 금지. 확인 지시문만 기재.

### ProcessStepMaster (`src/types.ts:508`)

- 필수: `id`, `manufacturer` (명칭), `manufactureLine` (명칭), `stepNumber`,
  `processName`, `description`, `keyEquipment`, `controlPoints`,
  `qualityRisks`, `possibleDefects: string[]`, `isActive`
- 선택: `presetId?` (→ FactoryProcessPreset.id, 권장),
  `manufacturerId?`, `manufactureLineId?`, `rawMaterials?`, `ccpNumber?`,
  `createdAt?`, `updatedAt?`, `isCustom?`
- 저장: `kwangdong_process_step_master_v1`
- Seed 위치: `src/data/seeds/processes.seed.ts`
- 주의: 기준값·합격수치·온도·시간·압력·설비실명·CCP 기준 금지.

### ClaimPreset (`src/types.ts:415`)

- 필수: `id`, `name`, `description`, `data: Partial<ReportData>`
- 선택: `badgeColor?`, `category?`, `scope?` (`in_house` | `oem`),
  `subCategory?` (`all` | `breakage` | `cap` | `spoilage` | `foreign` |
  `quantity` | `fill` | `packaging`),
  `isCustom?`, `isBuiltin?`, `linkedPhraseIds?` (→ StandardPhrase.id)
- 6종 고정 ClaimType 유지, 상위 유형 신설 금지.
- `data`에는 결과·원인·결론·수치를 미리 입력하지 않는다.
- 저장: `food_qc_managed_presets_v4_kwangdong_internal`
- Seed 위치: `src/data/seeds/presets.seed.ts`

### StandardPhrase (`src/types.ts:374`)

- 필수: `id`, `fieldKey`, `title`, `content`
- 선택: `category?`, `subCategory?`, `presetId?`, `isCustom?`,
  `claimType?`, `investigationItem?`, `resultType?`, `usageLocation?`,
  `relatedProcess?`, `relatedProductType?`, `isActive?`
- 원칙: 승인 문구만 등록, 원문 그대로. AI 다듬기·표현 변경·문법 수정·
  의미 변경·원인 단정·수치 추가 금지.
- 저장: `food_qc_managed_phrases_v5_kwangdong_internal`
- Seed 위치: `src/data/seeds/phrases.seed.ts`,
  `src/data/seeds/generic-phrases.seed.ts`

### ClaimKnowledgeItem (`src/types/claimKnowledge.ts:7`)

- 5블록: `basicInfo` / `investigationInfo` / `resultInfo` /
  `conclusionInfo` (원인 미확정 시 단정 금지) / `reportInfo`
  + `reportSnapshot: ReportData` + `isApprovedForKnowledge`
- 원칙: 조사방법·절차·확인방법·문서·관리방법만 등록.
  근거 없는 원인·CCP·수치·조건 등록 금지.
- 저장: `food_qc_completed_claim_knowledge_items`
- Seed 위치: `src/data/seeds/knowledge-base.seed.ts`,
  `src/data/seeds/past-claims.seed.ts`

### ClaimType

- 6종 고정 (`foreign` | `spoilage` | `leak` | `label` | `volume` | `etc`)
  + 세부유형은 `src/data/seeds/claim-types.seed.ts` 레지스트리로 세분화 (상위 신설 금지)
- 상위 유형 신설 금지. 기존 6종 중 소속을 먼저 검토.

## 1. ID 규칙 (기존 관측 규칙 준수, 신규 생성 금지)

- Prefix + 영구 ID: `prod-*`, `mfg-*`, `line-*`, `preset-*`,
  `principle-*` / `phrase-*` / `seed-ph-*` / `custom-*`,
  `knowledge-*`, `rep-*`, `clm-*`, `hist-*`
- 문서번호: `광동 QM {연도}-C{순번}` 형식 유지
- 영구 유지, 중복 금지, 이름 변경 시에도 ID 불변, 참조 중 ID 불변

## 2. 참조 관계

- Line.manufacturerId → Manufacturer.id (직접ID)
- Product.manufacturerId → Manufacturer.id (직접ID, 선택)
- Product.manufactureLineId → ManufactureLine.id (직접ID, 선택)
- Product.relatedProcessPresetId → FactoryProcessPreset.id (직접ID, 선택)
  — **실측 공정 연결의 최우선 직접 경로**
- ProcessStep.presetId → FactoryProcessPreset.id (직접ID, 선택)
- Line → Process 직접 링크 없음 (라인명·제조처명 포함 매칭 폴백)
- ClaimPreset.linkedPhraseIds → StandardPhrase.id (직접ID, 선택)
- ClaimType → Preset: `subCategory`→유형 매핑 (간접 분류)
- Process → Knowledge: `relatedProcesses` 텍스트 (간접)
- Knowledge → Phrase: 상황엔진 6축 점수 (간접)

## 3. 실제 데이터 입력 순서 (ID 의존 순)

1. Manufacturer → 2. ManufactureLine → 3. FactoryProcessPreset →
2. ProcessStep → 5. Product(링크 3종 기재) → 6. ClaimType(기존 6종 소속 판정) →
3. ClaimPreset → 8. StandardPhrase → 9. Knowledge → 10. Past Claim(최종, 5요소 완비 시)

## 4. Batch 단위

Batch 1 제조처 → Batch 2 제조라인 → Batch 3 제조공정 →
Batch 4 ProcessStep → Batch 5 제품 → Batch 6 제품↔공정 연결 검증 →
Batch 7 실제 StandardPhrase → Batch 8 실제 Knowledge →
Batch 9 실제 Past Claim

각 Batch 완료 시: lint, build, seed validation, 기존 데이터 보존,
ID 중복, 참조 무결성 확인.

## 5. [DATA BATCH] 입력 형식

```text
[DATA BATCH]

TYPE:
Manufacturer / Line / Process / ProcessStep / Product /
ClaimType / ClaimPreset / Phrase / Knowledge / PastClaim

SOURCE:
사용자가 제공한 실제 회사 정보

DATA:

{실제 데이터}

RULE:
- 제공되지 않은 값은 추정하지 않는다.
- 기존 Schema를 변경하지 않는다.
- 기존 데이터 삭제 금지
- 기존 ID 변경 금지
- AI/LLM 사용 금지
- 실제 데이터와 범용 Seed 혼동 금지
```

검증기: `src/utils/entryBatchValidator.ts` → `validateEntryBatch()`
(쓰기 없음, 오류 보고만, 자동 수정 없음).

## 6. 범용/실제 구분

- 범용: `seed-*` / `demo-*` ID + `[범용]` / `[DEMO]` 표기
- 실제: `company-*` 권장 + `[실제]` 표기 (예: `company-process-XXXX`)
- `source` 필드 없음 → 추가하지 않음. `isCustom` 등 기존 필드 활용.
- 범용 Template을 실제 공정으로 자동 복사 금지.

## 7. 주의사항

- 제품명만으로 공정/CCP 생성 금지. 라인명만으로 조건 생성 금지.
- Past Claim은 실제 5요소(제품·제조번호·접수내용·조사결과·결론) 완비 시에만.
- 승인 플래그가 과거검색 노출을 결정하므로 실측 지식 승인 시 비식별 확인.
- 라인→공정·프리셋→공정·지식→상용구는 직접 링크가 없어 이름 변경 시
  포함 매칭이 약해질 수 있음 — 실측 규모 확대 시 별도 설계 권장.
