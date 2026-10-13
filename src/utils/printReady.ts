/**
 * 인쇄 전 보고서 이미지 로딩 대기 (빈 이미지 출력 방지)
 * - #printable-report 내 모든 img의 로딩 완료/실패를 기다림
 * - 타임아웃 시에도 resolve하여 인쇄를 막지 않음 (읽기 전용 대기)
 */
export function waitForReportImages(timeoutMs = 2500): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof document === "undefined") {
        resolve();
        return;
      }
      const root = document.getElementById("printable-report");
      const imgs = root
        ? Array.from(root.querySelectorAll("img"))
        : [];
      if (imgs.length === 0) {
        resolve();
        return;
      }
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      const timer = window.setTimeout(done, timeoutMs);
      let pending = imgs.length;
      const one = () => {
        pending -= 1;
        if (pending <= 0) {
          window.clearTimeout(timer);
          done();
        }
      };
      imgs.forEach((img) => {
        const el = img as HTMLImageElement;
        if (el.complete && el.naturalWidth > 0) {
          one();
        } else {
          el.addEventListener("load", one, { once: true });
          el.addEventListener("error", one, { once: true });
        }
      });
    } catch {
      resolve();
    }
  });
}
