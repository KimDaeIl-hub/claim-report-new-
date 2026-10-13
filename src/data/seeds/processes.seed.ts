import { FactoryProcessPreset } from "../factoryProcessPresets";
import { ProcessStepMaster } from "../../types";

/**
 * 제조공정 Seed ([DEMO] 예시 전용, 실제 회사 데이터 아님)
 * - step.presetId → 동일 파일의 공정 프리셋 ID 참조
 * - step.manufacturerId → manufacturers.seed.ts 참조
 */
export const FACTORY_PROCESS_SEEDS: FactoryProcessPreset[] = [
  {
    id: "demo-process-001",
    name: "[DEMO] 데모 표준 공정 (실제 회사 데이터 아님)",
    type: "internal",
    teamOrCategory: "[DEMO] 예시 팀",
    description: "[DEMO] Seed 구조 검증용 예시 공정도 (실제 회사 데이터 아님)",
    processFlow: "원료 투입 → 배합 → 여과 → 충전 → 포장",
    processSteps: ["원료 투입", "배합", "여과", "충전", "포장"],
    filtrationAnalysis: "[DEMO] 예시 여과 기준 (실제 회사 데이터 아님)",
    cleaningAnalysis: "[DEMO] 예시 세척 기준 (실제 회사 데이터 아님)",
    criticalControlPoint: "[DEMO] 예시 CCP (실제 회사 데이터 아님)",
    isCustom: true,
  },
];

/**
 * 범용 제조공정 Template Seed (예시 공정, 실제 회사 데이터 아님)
 * - 수치·온도·시간·압력·설비명·CCP 기준 등 실제 조건 일체 없음 (확인 지시만)
 * - "[범용]" 표기로 특정 회사 공정처럼 보이지 않게 구분
 * - 기존 스키마 필드만 사용, 신규 필드 없음
 */
export const GENERIC_PROCESS_PRESETS: FactoryProcessPreset[] = [
  {
    id: "seed-process-bottle-generic",
    name: "[범용] 병입 액상제품 일반 공정 (예시, 실제 회사 데이터 아님)",
    type: "internal",
    teamOrCategory: "[범용] 예시",
    description: "[범용] 병입 액상제품의 일반적인 예시 공정 흐름 (실제 회사 데이터 아님)",
    processFlow: "원료 입고 → 원료 보관 → 계량/투입 → 배합 → 여과 → 초고온살균(UHT) → 저장 → 충전 → 밀봉/캡핑 → 후살균 확인 → 포장 → 완제품 검사",
    processSteps: ["원료 입고", "원료 보관", "계량/투입", "배합", "여과", "초고온살균(UHT)", "저장", "충전", "밀봉/캡핑", "후살균 확인", "포장", "완제품 검사"],
    filtrationAnalysis: "여과 공정의 작업 및 관리 기록을 확인한다.",
    cleaningAnalysis: "용기·설비 세척 상태 및 관련 기록을 확인한다.",
    criticalControlPoint: "살균·밀봉 등 중요 관리점의 기록 여부를 확인한다.",
    isCustom: true,
  },
  {
    id: "seed-process-pouch-generic",
    name: "[범용] 파우치 액상제품 일반 공정 (예시, 실제 회사 데이터 아님)",
    type: "internal",
    teamOrCategory: "[범용] 예시",
    description: "[범용] 파우치 액상제품의 일반적인 예시 공정 흐름 (실제 회사 데이터 아님)",
    processFlow: "원료 입고 → 계량/투입 → 배합 → 여과 → 초고온살균(UHT) → 저장/이송 → 충전 → 실링 → 외관/누액 확인 → 포장 → 완제품 검사",
    processSteps: ["원료 입고", "계량/투입", "배합", "여과", "초고온살균(UHT)", "저장/이송", "충전", "실링", "외관/누액 확인", "포장", "완제품 검사"],
    filtrationAnalysis: "여과 공정의 작업 및 관리 기록을 확인한다.",
    cleaningAnalysis: "설비 세척 상태 및 관련 기록을 확인한다.",
    criticalControlPoint: "살균·실링 등 중요 관리점의 기록 여부를 확인한다.",
    isCustom: true,
  },
  {
    id: "seed-process-stick-generic",
    name: "[범용] 분말/스틱형 제품 일반 공정 (예시, 실제 회사 데이터 아님)",
    type: "internal",
    teamOrCategory: "[범용] 예시",
    description: "[범용] 분말/스틱형 제품의 일반적인 예시 공정 흐름 (실제 회사 데이터 아님)",
    processFlow: "원료 입고 → 원료 확인 → 계량 → 배합 → 충전 → 실링 → 외관검사 → 포장 → 완제품 검사",
    processSteps: ["원료 입고", "원료 확인", "계량", "배합", "충전", "실링", "외관검사", "포장", "완제품 검사"],
    filtrationAnalysis: "해당 없음(분말·스틱 예시 공정에서는 여과 대신 원료 확인 중심).",
    cleaningAnalysis: "설비 세척 상태 및 관련 기록을 확인한다.",
    criticalControlPoint: "배합·실링 등 중요 관리점의 기록 여부를 확인한다.",
    isCustom: true,
  },
  {
    id: "seed-process-solid-generic",
    name: "[범용] 환 제품 일반 공정 (예시, 실제 회사 데이터 아님)",
    type: "internal",
    teamOrCategory: "[범용] 예시",
    description: "[범용] 환 제품의 일반적인 예시 공정 흐름 (실제 회사 데이터 아님, 특정 제조방식 단정 없음)",
    processFlow: "원료 입고 → 원료 확인 → 계량 → 혼합/연합 → 압연/제환 → 환필름 포장 → 케이스 포장 → 표시사항 확인 → 완제품 검사",
    processSteps: ["원료 입고", "원료 확인", "계량", "혼합/연합", "압연/제환", "환필름 포장", "케이스 포장", "표시사항 확인", "완제품 검사"],
    filtrationAnalysis: "해당 없음(환 예시 공정에서는 원료 확인 중심).",
    cleaningAnalysis: "설비 세척 상태 및 관련 기록을 확인한다.",
    criticalControlPoint: "혼합·제환 등 중요 관리점의 기록 여부를 확인한다.",
    isCustom: true,
  },
];

export const PROCESS_STEP_SEEDS: ProcessStepMaster[] = [
  {
    id: "demo-step-001",
    presetId: "demo-process-001",
    manufacturerId: "demo-mfg-001",
    manufacturer: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
    manufactureLineId: "demo-line-001",
    manufactureLine: "[DEMO] 데모 A Line (실제 회사 데이터 아님)",
    stepNumber: 3,
    processName: "여과",
    description: "[DEMO] 예시 공정 설명 (실제 회사 데이터 아님)",
    keyEquipment: "[DEMO] 예시 스트레이너",
    controlPoints: "[DEMO] 예시 관리기준",
    isCCP: false,
    qualityRisks: "[DEMO] 예시 리스크",
    possibleDefects: ["이물 혼입"],
    isActive: true,
    isCustom: true,
  },
  {
    id: "demo-step-002",
    presetId: "demo-process-001",
    manufacturerId: "demo-mfg-001",
    manufacturer: "[DEMO] 데모 제조처 (실제 회사 데이터 아님)",
    manufactureLineId: "demo-line-001",
    manufactureLine: "[DEMO] 데모 A Line (실제 회사 데이터 아님)",
    stepNumber: 4,
    processName: "충전",
    description: "[DEMO] 예시 공정 설명 (실제 회사 데이터 아님)",
    keyEquipment: "[DEMO] 예시 충전기",
    controlPoints: "[DEMO] 예시 관리기준",
    isCCP: true,
    ccpNumber: "DEMO-CCP-1",
    qualityRisks: "[DEMO] 예시 리스크",
    possibleDefects: ["이물 혼입", "누액"],
    isActive: true,
    isCustom: true,
  },
];

/**
 * 범용 공정 Step Seed (예시, 실제 회사 데이터 아님)
 * - 각 Step은 "무엇을 확인할 것인가" 중심의 지시문만 포함
 * - 기준값·합격수치·온도·시간·압력·설비명·CCP 기준 없음
 * - isCCP 표기는 예시상 중요 관리 후보 표시이며 기준값 없음 (ccpNumber 미부여)
 */
const G = "[범용]";
interface GenericStepSeed {
  id: string;
  presetId: string;
  stepNumber: number;
  processName: string;
  description: string;
  keyEquipment: string;
  controlPoints: string;
  isCCP: boolean;
  qualityRisks: string;
  possibleDefects: string[];
}

const GENERIC_STEP_DEFS: GenericStepSeed[] = [
  // ---- 병입 액상 (12) ----
  { id: "seed-step-bottle-01", presetId: "seed-process-bottle-generic", stepNumber: 1, processName: "원료 입고", description: "원료 입고 여부와 입고 기록을 확인한다.", keyEquipment: "원료 입고 설비", controlPoints: "입고 기록", isCCP: false, qualityRisks: "입고 누락·오기재", possibleDefects: ["이물 혼입"] },
  { id: "seed-step-bottle-02", presetId: "seed-process-bottle-generic", stepNumber: 2, processName: "원료 보관", description: "원료 보관 상태와 보관 기록을 확인한다.", keyEquipment: "원료 보관 설비", controlPoints: "보관 기록", isCCP: false, qualityRisks: "보관 상태 이상", possibleDefects: ["변질"] },
  { id: "seed-step-bottle-03", presetId: "seed-process-bottle-generic", stepNumber: 3, processName: "계량/투입", description: "원료 투입 여부와 작업기록의 일치 여부를 확인한다.", keyEquipment: "계량 설비", controlPoints: "투입 기록", isCCP: false, qualityRisks: "투입 오류", possibleDefects: ["내용량 이상"] },
  { id: "seed-step-bottle-04", presetId: "seed-process-bottle-generic", stepNumber: 4, processName: "배합", description: "배합 작업 기록과 실제 제조기록의 일치 여부를 확인한다.", keyEquipment: "배합 설비", controlPoints: "배합 기록", isCCP: false, qualityRisks: "배합 조건 이탈", possibleDefects: ["변질"] },
  { id: "seed-step-bottle-05", presetId: "seed-process-bottle-generic", stepNumber: 5, processName: "여과", description: "여과 작업 여부와 여과망 관리 상태를 확인한다.", keyEquipment: "여과 설비", controlPoints: "여과 기록", isCCP: false, qualityRisks: "여과 불량", possibleDefects: ["이물 혼입"] },
  { id: "seed-step-bottle-06", presetId: "seed-process-bottle-generic", stepNumber: 6, processName: "초고온살균(UHT)", description: "살균 작업 여부와 관련 기록을 확인한다.", keyEquipment: "살균 설비", controlPoints: "살균 기록", isCCP: true, qualityRisks: "살균 조건 이탈", possibleDefects: ["변질"] },
  { id: "seed-step-bottle-07", presetId: "seed-process-bottle-generic", stepNumber: 7, processName: "저장", description: "저장 상태와 관련 기록을 확인한다.", keyEquipment: "저장 설비", controlPoints: "저장 기록", isCCP: false, qualityRisks: "저장 조건 이상", possibleDefects: ["변질"] },
  { id: "seed-step-bottle-08", presetId: "seed-process-bottle-generic", stepNumber: 8, processName: "충전", description: "충전 작업기록, 충전 상태, 용기 상태 및 관련 검사기록을 확인한다.", keyEquipment: "충전 설비", controlPoints: "충전 기록", isCCP: false, qualityRisks: "충전 이상", possibleDefects: ["이물 혼입", "내용량 이상"] },
  { id: "seed-step-bottle-09", presetId: "seed-process-bottle-generic", stepNumber: 9, processName: "밀봉/캡핑", description: "밀봉 상태, 외관 상태, 누액 여부 및 작업기록을 확인한다.", keyEquipment: "밀봉 설비", controlPoints: "밀봉 기록", isCCP: true, qualityRisks: "밀봉 불량", possibleDefects: ["누액"] },
  { id: "seed-step-bottle-10", presetId: "seed-process-bottle-generic", stepNumber: 10, processName: "후살균 확인", description: "후살균 관련 확인 여부와 기록을 확인한다.", keyEquipment: "후살균 설비", controlPoints: "후살균 기록", isCCP: false, qualityRisks: "후살균 누락", possibleDefects: ["변질"] },
  { id: "seed-step-bottle-11", presetId: "seed-process-bottle-generic", stepNumber: 11, processName: "포장", description: "포장 상태, 포장자재, 포장 작업기록 및 외관 이상 여부를 확인한다.", keyEquipment: "포장 설비", controlPoints: "포장 기록", isCCP: false, qualityRisks: "포장 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-bottle-12", presetId: "seed-process-bottle-generic", stepNumber: 12, processName: "완제품 검사", description: "검사기록, 검사결과 및 동일 제조번호의 검사 이력을 확인한다.", keyEquipment: "검사 설비", controlPoints: "검사 기록", isCCP: false, qualityRisks: "검사 누락", possibleDefects: ["변질", "이물 혼입"] },
  // ---- 파우치 액상 (11) ----
  { id: "seed-step-pouch-01", presetId: "seed-process-pouch-generic", stepNumber: 1, processName: "원료 입고", description: "원료 입고 여부와 입고 기록을 확인한다.", keyEquipment: "원료 입고 설비", controlPoints: "입고 기록", isCCP: false, qualityRisks: "입고 누락·오기재", possibleDefects: ["이물 혼입"] },
  { id: "seed-step-pouch-02", presetId: "seed-process-pouch-generic", stepNumber: 2, processName: "계량/투입", description: "원료 투입 여부와 작업기록의 일치 여부를 확인한다.", keyEquipment: "계량 설비", controlPoints: "투입 기록", isCCP: false, qualityRisks: "투입 오류", possibleDefects: ["내용량 이상"] },
  { id: "seed-step-pouch-03", presetId: "seed-process-pouch-generic", stepNumber: 3, processName: "배합", description: "배합 작업 기록과 실제 제조기록의 일치 여부를 확인한다.", keyEquipment: "배합 설비", controlPoints: "배합 기록", isCCP: false, qualityRisks: "배합 조건 이탈", possibleDefects: ["변질"] },
  { id: "seed-step-pouch-04", presetId: "seed-process-pouch-generic", stepNumber: 4, processName: "여과", description: "여과 작업 여부와 여과망 관리 상태를 확인한다.", keyEquipment: "여과 설비", controlPoints: "여과 기록", isCCP: false, qualityRisks: "여과 불량", possibleDefects: ["이물 혼입"] },
  { id: "seed-step-pouch-05", presetId: "seed-process-pouch-generic", stepNumber: 5, processName: "초고온살균(UHT)", description: "살균 작업 여부와 관련 기록을 확인한다.", keyEquipment: "살균 설비", controlPoints: "살균 기록", isCCP: true, qualityRisks: "살균 조건 이탈", possibleDefects: ["변질"] },
  { id: "seed-step-pouch-06", presetId: "seed-process-pouch-generic", stepNumber: 6, processName: "저장/이송", description: "저장·이송 상태와 관련 기록을 확인한다.", keyEquipment: "저장 설비", controlPoints: "저장 기록", isCCP: false, qualityRisks: "저장 조건 이상", possibleDefects: ["변질"] },
  { id: "seed-step-pouch-07", presetId: "seed-process-pouch-generic", stepNumber: 7, processName: "충전", description: "충전 작업기록, 충전 상태 및 관련 검사기록을 확인한다.", keyEquipment: "충전 설비", controlPoints: "충전 기록", isCCP: false, qualityRisks: "충전 이상", possibleDefects: ["내용량 이상"] },
  { id: "seed-step-pouch-08", presetId: "seed-process-pouch-generic", stepNumber: 8, processName: "실링", description: "실링 상태와 관련 기록을 확인한다.", keyEquipment: "실링 설비", controlPoints: "실링 기록", isCCP: true, qualityRisks: "실링 불량", possibleDefects: ["누액"] },
  { id: "seed-step-pouch-09", presetId: "seed-process-pouch-generic", stepNumber: 9, processName: "외관/누액 확인", description: "외관 상태와 누액 여부를 확인한다.", keyEquipment: "검사 설비", controlPoints: "외관 검사 기록", isCCP: false, qualityRisks: "외관 불량", possibleDefects: ["누액", "포장 불량"] },
  { id: "seed-step-pouch-10", presetId: "seed-process-pouch-generic", stepNumber: 10, processName: "포장", description: "포장 상태, 포장자재 및 포장 작업기록을 확인한다.", keyEquipment: "포장 설비", controlPoints: "포장 기록", isCCP: false, qualityRisks: "포장 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-pouch-11", presetId: "seed-process-pouch-generic", stepNumber: 11, processName: "완제품 검사", description: "검사기록, 검사결과 및 동일 제조번호의 검사 이력을 확인한다.", keyEquipment: "검사 설비", controlPoints: "검사 기록", isCCP: false, qualityRisks: "검사 누락", possibleDefects: ["변질"] },
  // ---- 분말/스틱형 (9) ----
  { id: "seed-step-stick-01", presetId: "seed-process-stick-generic", stepNumber: 1, processName: "원료 입고", description: "원료 입고 여부와 입고 기록을 확인한다.", keyEquipment: "원료 입고 설비", controlPoints: "입고 기록", isCCP: false, qualityRisks: "입고 누락·오기재", possibleDefects: ["이물 혼입"] },
  { id: "seed-step-stick-02", presetId: "seed-process-stick-generic", stepNumber: 2, processName: "원료 확인", description: "원료의 상태와 관련 기록을 확인한다.", keyEquipment: "원료 확인 설비", controlPoints: "원료 기록", isCCP: false, qualityRisks: "원료 이상", possibleDefects: ["변질"] },
  { id: "seed-step-stick-03", presetId: "seed-process-stick-generic", stepNumber: 3, processName: "계량", description: "계량 여부와 작업기록의 일치 여부를 확인한다.", keyEquipment: "계량 설비", controlPoints: "계량 기록", isCCP: false, qualityRisks: "계량 오류", possibleDefects: ["내용량 이상"] },
  { id: "seed-step-stick-04", presetId: "seed-process-stick-generic", stepNumber: 4, processName: "배합", description: "배합 작업 기록과 실제 제조기록의 일치 여부를 확인한다.", keyEquipment: "배합 설비", controlPoints: "배합 기록", isCCP: false, qualityRisks: "배합 조건 이탈", possibleDefects: ["변질"] },
  { id: "seed-step-stick-05", presetId: "seed-process-stick-generic", stepNumber: 5, processName: "충전", description: "충전 작업기록과 충전 상태를 확인한다.", keyEquipment: "충전 설비", controlPoints: "충전 기록", isCCP: false, qualityRisks: "충전 이상", possibleDefects: ["내용량 이상"] },
  { id: "seed-step-stick-06", presetId: "seed-process-stick-generic", stepNumber: 6, processName: "실링", description: "실링 상태와 관련 기록을 확인한다.", keyEquipment: "실링 설비", controlPoints: "실링 기록", isCCP: true, qualityRisks: "실링 불량", possibleDefects: ["누액"] },
  { id: "seed-step-stick-07", presetId: "seed-process-stick-generic", stepNumber: 7, processName: "외관검사", description: "외관 상태와 관련 검사기록을 확인한다.", keyEquipment: "검사 설비", controlPoints: "외관 검사 기록", isCCP: false, qualityRisks: "외관 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-stick-08", presetId: "seed-process-stick-generic", stepNumber: 8, processName: "포장", description: "포장 상태, 포장자재 및 포장 작업기록을 확인한다.", keyEquipment: "포장 설비", controlPoints: "포장 기록", isCCP: false, qualityRisks: "포장 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-stick-09", presetId: "seed-process-stick-generic", stepNumber: 9, processName: "완제품 검사", description: "검사기록, 검사결과 및 동일 제조번호의 검사 이력을 확인한다.", keyEquipment: "검사 설비", controlPoints: "검사 기록", isCCP: false, qualityRisks: "검사 누락", possibleDefects: ["변질"] },
  // ---- 환 제품 (9) ----
  { id: "seed-step-solid-01", presetId: "seed-process-solid-generic", stepNumber: 1, processName: "원료 입고", description: "원료 입고 여부와 입고 기록을 확인한다.", keyEquipment: "원료 입고 설비", controlPoints: "입고 기록", isCCP: false, qualityRisks: "입고 누락·오기재", possibleDefects: ["이물 혼입"] },
  { id: "seed-step-solid-02", presetId: "seed-process-solid-generic", stepNumber: 2, processName: "원료 확인", description: "원료의 상태와 관련 기록을 확인한다.", keyEquipment: "원료 확인 설비", controlPoints: "원료 기록", isCCP: false, qualityRisks: "원료 이상", possibleDefects: ["변질"] },
  { id: "seed-step-solid-03", presetId: "seed-process-solid-generic", stepNumber: 3, processName: "계량", description: "계량 여부와 작업기록의 일치 여부를 확인한다.", keyEquipment: "계량 설비", controlPoints: "계량 기록", isCCP: false, qualityRisks: "계량 오류", possibleDefects: ["내용량 이상"] },
  { id: "seed-step-solid-04", presetId: "seed-process-solid-generic", stepNumber: 4, processName: "혼합/연합", description: "혼합·연합 작업 기록을 확인한다.", keyEquipment: "혼합 설비", controlPoints: "혼합 기록", isCCP: false, qualityRisks: "혼합 불균일", possibleDefects: ["변질"] },
  { id: "seed-step-solid-05", presetId: "seed-process-solid-generic", stepNumber: 5, processName: "압연/제환", description: "압연·제환 작업 기록을 확인한다.", keyEquipment: "제환 설비", controlPoints: "제환 기록", isCCP: false, qualityRisks: "성형 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-solid-06", presetId: "seed-process-solid-generic", stepNumber: 6, processName: "환필름 포장", description: "환필름 포장 상태와 관련 기록을 확인한다.", keyEquipment: "포장 설비", controlPoints: "포장 기록", isCCP: false, qualityRisks: "포장 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-solid-07", presetId: "seed-process-solid-generic", stepNumber: 7, processName: "케이스 포장", description: "케이스 포장 상태와 관련 기록을 확인한다.", keyEquipment: "포장 설비", controlPoints: "포장 기록", isCCP: false, qualityRisks: "포장 불량", possibleDefects: ["포장 불량"] },
  { id: "seed-step-solid-08", presetId: "seed-process-solid-generic", stepNumber: 8, processName: "표시사항 확인", description: "표시사항, 소비기한·제조번호 등의 인쇄 상태와 인쇄 누락·오표기 여부를 확인한다.", keyEquipment: "검사 설비", controlPoints: "표시 검사 기록", isCCP: false, qualityRisks: "표시 이상", possibleDefects: ["표시 이상"] },
  { id: "seed-step-solid-09", presetId: "seed-process-solid-generic", stepNumber: 9, processName: "완제품 검사", description: "검사기록, 검사결과 및 동일 제조번호의 검사 이력을 확인한다.", keyEquipment: "검사 설비", controlPoints: "검사 기록", isCCP: false, qualityRisks: "검사 누락", possibleDefects: ["변질"] },
];

export const GENERIC_PROCESS_STEPS: ProcessStepMaster[] = GENERIC_STEP_DEFS.map((s) => ({
  id: s.id,
  presetId: s.presetId,
  manufacturer: `${G} 예시 (실제 회사 데이터 아님)`,
  manufactureLine: `${G} 예시 라인 (실제 회사 데이터 아님)`,
  stepNumber: s.stepNumber,
  processName: s.processName,
  description: s.description,
  keyEquipment: s.keyEquipment,
  controlPoints: s.controlPoints,
  isCCP: s.isCCP,
  qualityRisks: s.qualityRisks,
  possibleDefects: s.possibleDefects,
  isActive: true,
  isCustom: true,
}));
