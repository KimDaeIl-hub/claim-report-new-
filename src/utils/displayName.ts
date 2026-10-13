/**
 * 내부 분류 접두사 표시 분리 유틸 (표시 전용, 데이터 변경 없음)
 *
 * - 관리 화면: 원본 그대로 표시 (분류 유지)
 * - 공식 문서(보고서 미리보기·이메일·인쇄): 내부 분류 접두사만 제거하고 표시
 * - 저장값·과거 보고서·사용자 입력 본문은 절대 수정하지 않음
 * - 확인된 3종 접두사만 선행 일치 시 제거. 그 외 대괄호 텍스트는 유지
 *   (예: "[문의] 교환 요청" 같은 실제 명칭은 그대로 둠)
 */

const INTERNAL_PREFIXES = ["[실제]", "[범용]", "[DEMO]"] as const;

/**
 * 문자열 선행 내부 분류 접두사 1개를 제거하고 반환
 * - "[실제] 비타500" -> "비타500"
 * - "[실제]비타500" -> "비타500" (공백 없이 붙은 경우도 처리)
 * - "비타500" -> "비타500" (접두사 없음, 변경 없음)
 * - "[문의] 교환 요청" -> 그대로 (미확인 패턴, 전역 치환 금지)
 * - "" / null / undefined -> "" (안전 반환)
 */
export function stripInternalPrefix(name: string | null | undefined): string {
  if (!name) return "";
  let result = name;
  for (const prefix of INTERNAL_PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length).trimStart();
      break;
    }
  }
  return result;
}

/** 내부 분류 접두사가 있는지 여부 (관리 화면 뱃지 등에 활용 가능) */
export function hasInternalPrefix(name: string | null | undefined): boolean {
  if (!name) return false;
  return (INTERNAL_PREFIXES as readonly string[]).some((p) => name.startsWith(p));
}
