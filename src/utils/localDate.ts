/**
 * 로컬 날짜 문자열 유틸 (UTC 변환에 의한 날짜 어긋남 방지)
 * - 클레임 접수일·현품 접수일 등 사용자에게 보이는 날짜 기본값 전용
 * - 저장 형식(YYYY-MM-DD, YYYY-MM-DDTHH:mm)은 기존 그대로 유지
 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 로컬 기준 YYYY-MM-DD */
export function toLocalDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 로컬 기준 YYYY-MM-DDTHH:mm (datetime 입력 호환) */
export function toLocalDateTimeString(d: Date = new Date()): string {
  return `${toLocalDateString(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
