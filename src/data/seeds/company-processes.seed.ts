import { FactoryProcessPreset } from "../factoryProcessPresets";
import { ProcessStepMaster } from "../../types";

/**
 * 실제 회사 제조공정 Seed — 자사 (사용자 제공 순서 그대로, 추정 없음)
 *
 * - filtrationAnalysis / cleaningAnalysis / criticalControlPoint:
 *   사용자가 제공하지 않았으므로 빈 값 (임의 규격·조건 생성 금지)
 * - Step 설명·설비·관리점·리스크: 제공되지 않았으므로 중립 표기
 *   ("실제 순서 N번째 공정"은 제공된 순서 그대로의 사실 기술)
 * - isCCP: 정보 없음 → false (단정 금지). ccpNumber 미부여
 */

const MFG = "[실제] 광동제약 식품공장";

export const COMPANY_PROCESS_PRESETS: FactoryProcessPreset[] = [
  {
    id: "company-process-drink-bottle",
    name: "[실제] 식품팀 음료 병 라인 공정",
    type: "internal",
    teamOrCategory: "식품팀",
    description: "실제 음료 병 라인 공정 순서 (제공 순서 그대로)",
    processFlow:
      "원료 칭량 → 배합 → 배합액 검사 → 여과 → 초고온살균(UHT) → 저장 → 충전 → 캡핑 → 후살균 → 이물검사 → 라벨링 및 날인 → 10입 포장 → 박스 포장",
    processSteps: [
      "원료 칭량",
      "배합",
      "배합액 검사",
      "여과",
      "초고온살균(UHT)",
      "저장",
      "충전",
      "캡핑",
      "후살균",
      "이물검사",
      "라벨링 및 날인",
      "10입 포장",
      "박스 포장",
    ],
    filtrationAnalysis: "",
    cleaningAnalysis: "",
    criticalControlPoint: "",
  },
  {
    id: "company-process-hwan",
    name: "[실제] 건기식팀 환제 라인 공정",
    type: "internal",
    teamOrCategory: "건기식팀",
    description: "실제 환제 라인 공정 순서 (제공 순서 그대로)",
    processFlow:
      "원료 칭량 → 사별 및 혼합 → 연합 → 압연 → 제환 → 건조 → 환 필름 포장 → 병 포장 → 수축필름(루뗑 포장) → 30환 포장 → X-ray 검사 → 박스 포장",
    processSteps: [
      "원료 칭량",
      "사별 및 혼합",
      "연합",
      "압연",
      "제환",
      "건조",
      "환 필름 포장",
      "병 포장",
      "수축필름(루뗑 포장)",
      "30환 포장",
      "X-ray 검사",
      "박스 포장",
    ],
    filtrationAnalysis: "",
    cleaningAnalysis: "",
    criticalControlPoint: "",
  },
  {
    id: "company-process-pouch",
    name: "[실제] 건기식팀 파우치 라인 공정",
    type: "internal",
    teamOrCategory: "건기식팀",
    description: "실제 파우치 라인 공정 순서 (제공 순서 그대로)",
    processFlow:
      "원료 칭량 → 배합 → 배합액 검사 → 여과 → 초고온살균(UHT) → 저장 → 충전 → 실링 → 압인 → 검사 → 중량 검사 → 케이스 포장 → 박스 포장",
    processSteps: [
      "원료 칭량",
      "배합",
      "배합액 검사",
      "여과",
      "초고온살균(UHT)",
      "저장",
      "충전",
      "실링",
      "압인",
      "검사",
      "중량 검사",
      "케이스 포장",
      "박스 포장",
    ],
    filtrationAnalysis: "",
    cleaningAnalysis: "",
    criticalControlPoint: "",
  },
];

interface CompanyStepDef {
  id: string;
  presetId: string;
  manufactureLine: string;
  stepNumber: number;
  processName: string;
}

function buildCompanySteps(
  presetId: string,
  manufactureLine: string,
  names: string[],
  prefix: string
): ProcessStepMaster[] {
  return names.map((processName, idx) => ({
    id: `${prefix}-${String(idx + 1).padStart(2, "0")}`,
    presetId,
    manufacturerId: "company-mfg-kd-food",
    manufacturer: MFG,
    manufactureLine,
    stepNumber: idx + 1,
    processName,
    description: `[실제] 제공 순서 ${idx + 1}번째 공정 (상세 조건 미제공)`,
    keyEquipment: "",
    controlPoints: "",
    isCCP: false,
    qualityRisks: "",
    possibleDefects: [],
    isActive: true,
  }));
}

export const COMPANY_PROCESS_STEPS: ProcessStepMaster[] = [
  ...buildCompanySteps(
    "company-process-drink-bottle",
    "음료 병 라인",
    [
      "원료 칭량",
      "배합",
      "배합액 검사",
      "여과",
      "초고온살균(UHT)",
      "저장",
      "충전",
      "캡핑",
      "후살균",
      "이물검사",
      "라벨링 및 날인",
      "10입 포장",
      "박스 포장",
    ],
    "company-step-drink"
  ),
  ...buildCompanySteps(
    "company-process-hwan",
    "환제 라인",
    [
      "원료 칭량",
      "사별 및 혼합",
      "연합",
      "압연",
      "제환",
      "건조",
      "환 필름 포장",
      "병 포장",
      "수축필름(루뗑 포장)",
      "30환 포장",
      "X-ray 검사",
      "박스 포장",
    ],
    "company-step-hwan"
  ),
  ...buildCompanySteps(
    "company-process-pouch",
    "파우치 라인",
    [
      "원료 칭량",
      "배합",
      "배합액 검사",
      "여과",
      "초고온살균(UHT)",
      "저장",
      "충전",
      "실링",
      "압인",
      "검사",
      "중량 검사",
      "케이스 포장",
      "박스 포장",
    ],
    "company-step-pouch"
  ),
];
