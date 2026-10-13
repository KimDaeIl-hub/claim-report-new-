import { ReportData, PhotoAttachment } from "../types";

/**
 * 메일 회신 복사 첨부 사진 유틸 (읽기 전용, 원본 불변)
 *
 * - 수집 순서: 고객 사진 → 보관품 → 첨부1 → 첨부2 → 첨부3 (보고서 저장 순서 유지)
 * - 동일 id 중복 참조 시 최초 1회만 포함 (중복 삽입 금지)
 * - showInReport === false 제외, 미지정 레거시는 포함 (A4 출력 정책과 일치)
 * - blob: URL은 외부 프로그램에서 해석 불가하므로 제외 (data:/http(s):만 허용)
 * - 빈 url·손상 데이터는 제외 (깨진 이미지 요소 생성 금지)
 */

function isCopyablePhoto(p: PhotoAttachment | null | undefined): boolean {
  if (!p || typeof p.url !== "string") return false;
  const url = p.url.trim();
  if (!url) return false;
  if (url.includes("unsplash.com") || url.includes("placeholder")) return false;
  const lower = url.toLowerCase();
  if (!(lower.startsWith("data:image/") || lower.startsWith("http://") || lower.startsWith("https://"))) {
    return false;
  }
  if ((p.showInReport ?? true) === false) return false;
  return true;
}

export function collectEmailPhotos(report: ReportData): PhotoAttachment[] {
  const buckets: Array<PhotoAttachment[] | undefined> = [
    report.customerClaim?.customerPhotos,
    report.lotHistory?.retainedSamplePhotos,
    report.attachments?.attachment1Photos,
    report.attachments?.attachment2Photos,
    report.attachments?.attachment3Photos,
  ];
  const seen = new Set<string>();
  const result: PhotoAttachment[] = [];
  for (const bucket of buckets) {
    for (const p of bucket || []) {
      if (!p || seen.has(p.id)) continue;
      if (!isCopyablePhoto(p)) continue;
      seen.add(p.id);
      result.push(p);
    }
  }
  return result;
}

/** HTML 삽입용 최소 이스케이프 (기존 포매터 경로 미변경, 사진 캡션·분류에만 적용) */
export function escapeEmailHtml(text: string | null | undefined): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function photoDisplayLabel(p: PhotoAttachment, index: number): string {
  const cat = (p.category || "").trim();
  const cap = (p.caption || "").trim();
  if (cat && cap) return `[사진 ${index + 1}: ${cat} — ${cap}]`;
  if (cat) return `[사진 ${index + 1}: ${cat}]`;
  if (cap) return `[사진 ${index + 1}: ${cap}]`;
  return `[사진 ${index + 1}]`;
}

/**
 * 이메일 전용 이미지 표시 상한 (표시용 제한, 원본·보고서 미리보기 불변)
 * - S/M/L/XL 설정과 무관하게 이메일 삽입 시 이 상한을 적용 (XL 상한, S 확대 금지)
 */
export const EMAIL_IMAGE_MAX_WIDTH = 520;
export const EMAIL_IMAGE_MAX_HEIGHT = 420;

/**
 * 메일 본문 하단 첨부 사진 HTML (이메일 호환 인라인 스타일, A4 레이아웃 클래스 미사용)
 * - 작은 이미지 확대 금지 (width:100% 미사용), 큰 이미지는 상한 내 축소
 * - 원본 비율 유지 (고정 width/height 미지정), 외부 리소스 없음
 */
export function buildEmailPhotosHtml(photos: PhotoAttachment[]): string {
  if (photos.length === 0) return "";
  let html = `<div style="margin-top:16px;padding-top:12px;border-top:2px solid #1e3a8a;">`;
  html += `<p style="font-size:13px;color:#1e3a8a;"><strong>[첨부 사진 ${photos.length}장]</strong></p>`;
  photos.forEach((p, i) => {
    const cat = escapeEmailHtml((p.category || "").trim());
    const cap = escapeEmailHtml((p.caption || "").trim());
    const label =
      cat && cap
        ? `<strong>[사진 ${i + 1}] ${cat}</strong> — ${cap}`
        : cat || cap
          ? `<strong>[사진 ${i + 1}] ${cat || cap}</strong>`
          : `<strong>[사진 ${i + 1}]</strong>`;
    html += `<div style="margin:12px 0;">`;
    html += `<p style="font-size:12px;color:#0f172a;margin:0 0 4px 0;">${label}</p>`;
    html +=
      `<img src="${p.url}" alt="${escapeEmailHtml(`첨부 사진 ${i + 1}`)}" ` +
      `style="display:block;width:auto;height:auto;` +
      `max-width:${EMAIL_IMAGE_MAX_WIDTH}px;max-height:${EMAIL_IMAGE_MAX_HEIGHT}px;border:0;" />`;
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

/**
 * 일반 텍스트 동반용 사진 위치 안내 (이미지 자체가 복사된 것처럼 오인 방지 문구 포함)
 */
export function buildEmailPhotosText(photos: PhotoAttachment[]): string {
  if (photos.length === 0) return "";
  let text = `\n[첨부 사진 ${photos.length}장 — 아래 목록은 HTML(서식) 붙여넣기에서 확인]\n`;
  photos.forEach((p, i) => {
    text += `${photoDisplayLabel(p, i)}\n`;
  });
  return text;
}
