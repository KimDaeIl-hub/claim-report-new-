import { stripInternalPrefix } from "./displayName";

/**
 * A4 보고서 제목 자동 생성·상태 판정 유틸 (스키마 변경 없음)
 *
 * - 자동/직접 수정 구분은 휴리스틱으로 판정: 현재 제목이 비어 있거나,
 *   현재 제품명·클레임유형으로 계산한 자동 제목과 일치하면 "자동 상태"
 * - 신규 필드·저장 구조 변경 없이 report.title 하나로 운용
 */

const TYPE_LABELS: Array<{ label: string; keywords: string[] }> = [
  { label: "이물", keywords: ["이물", "혼입", "foreign"] },
  { label: "변질", keywords: ["변질", "산패", "곰팡이", "팽창", "spoilage"] },
  { label: "누액", keywords: ["누액", "파손", "캡", "leak"] },
  { label: "표시오류", keywords: ["라벨", "표시", "날인", "label"] },
  { label: "내용량", keywords: ["내용량", "중량", "수량", "volume"] },
];

/** 확인된 정보로만 유형 라벨 판정. 미확인 시 null (임의 라벨 생성 금지) */
export function resolveTitleTypeLabel(claimTypeId?: string | null): string | null {
  const raw = (claimTypeId || "").trim().toLowerCase();
  if (!raw) return null;
  for (const t of TYPE_LABELS) {
    if (t.keywords.some((k) => raw.includes(k))) return t.label;
  }
  return null;
}

/**
 * 자동 제목 생성. 확인된 제품명·유형만 사용, 없으면 일반형으로 축소 (날조 금지)
 * 예: "“비타500 100ml” 이물 클레임 조사 보고의 건."
 */
export function buildAutoReportTitle(
  productName?: string | null,
  claimTypeId?: string | null
): string {
  const name = stripInternalPrefix((productName || "").trim());
  const label = resolveTitleTypeLabel(claimTypeId);
  if (!name) return "소비자 클레임 조사 보고의 건.";
  if (!label) return `“${name}” 소비자 클레임 조사 보고의 건.`;
  return `“${name}” ${label} 클레임 조사 보고의 건.`;
}

/**
 * 자동 상태 판정: 비어 있거나 현재 정보 기준 자동 제목과 일치하면 true.
 * (담당자가 우연히 동일 문구를 입력한 경우는 자동 상태로 취급 — 무해)
 */
export function isAutoReportTitle(
  title?: string | null,
  productName?: string | null,
  claimTypeId?: string | null
): boolean {
  if (!title || !title.trim()) return true;
  return title === buildAutoReportTitle(productName, claimTypeId);
}
