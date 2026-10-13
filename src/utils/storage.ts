import { ReportData, PhotoAttachment } from "../types";

const DB_NAME = "FoodQcReportDb";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const DRAFT_KEY = "active_report";
export const DRAFT_STORAGE_KEY = "food_qc_draft_report";

// Simple native IndexedDB helper (safe in iframes and modern browsers)
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface SaveResult {
  ok: boolean;
  idbWritten: boolean;
  lsWritten: boolean;
  error?: string;
}

// 저장 직렬화 큐: 연속 저장이 transaction 완료 순서대로 기록되도록 보장
let saveChain: Promise<SaveResult> = Promise.resolve({ ok: true, idbWritten: false, lsWritten: false });

/**
 * 단일 스냅샷 기록 (예외를 던지지 않고 결과로 반환)
 * - 사진은 어떤 경우에도 삭제·축소하지 않음 (용량 초과 시 실패 상태로 보고만 함)
 * - 입력 report 객체를 변경하지 않음
 */
async function writeReportSnapshot(report: ReportData): Promise<SaveResult> {
  let idbWritten = false;
  let lsWritten = false;
  let error: string | undefined;

  // 1. IndexedDB (대용량 사진 포함 전체 초안의 primary 보관처)
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(report, DRAFT_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    idbWritten = true;
  } catch (err: any) {
    error = err?.message || "IndexedDB 저장 실패";
    console.warn("IndexedDB save note:", err);
  }

  // 2. localStorage (동기 즉시 복구용 보조 보관처)
  try {
    if (typeof localStorage === "undefined") {
      throw new Error("localStorage unavailable");
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(report));
    lsWritten = true;
  } catch (err: any) {
    // 용량 초과여도 사진을 삭제하지 않음! 실패 상태로 보고하고 메모리는 그대로 둠.
    const msg = err?.message || "localStorage 저장 실패";
    error = error ? `${error} / ${msg}` : msg;
    console.warn("Notice: LocalStorage save failed. Photos are kept in memory and IndexedDB.", err);
  }

  return { ok: idbWritten || lsWritten, idbWritten, lsWritten, error: idbWritten || lsWritten ? (lsWritten ? undefined : error) : error };
}

export async function saveReportToDb(report: ReportData): Promise<SaveResult> {
  // 저장 큐에 직렬로 적재: 빠른 연속 수정도 순서대로 기록되어
  // 오래 걸린 이전 저장이 최신 데이터를 덮어쓰지 않음. (반환값으로 결과 확인)
  const task: Promise<SaveResult> = saveChain.then(() => writeReportSnapshot(report));
  // 체인이 끊어지지 않도록 항상 resolve되는 형태로 연결
  saveChain = task.then(
    (r) => r,
    (err) => ({ ok: false, idbWritten: false, lsWritten: false, error: err?.message || "저장 실패" })
  );
  return task;
}

/**
 * 초안 삭제 (사용자가 "버리고 새로 시작"을 명시 선택한 경우에만 호출)
 * 보관함(food_qc_saved_reports_v1)·지식·마스터에는 손대지 않음
 */
export async function clearDraftFromDb(): Promise<void> {
  try {
    if (typeof window !== "undefined" && window.indexedDB) {
      const db = await openDatabase();
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(DRAFT_KEY);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  } catch (err) {
    console.warn("IndexedDB draft clear note:", err);
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch (err) {
    console.warn("LocalStorage draft clear note:", err);
  }
}

/**
 * 초안에 사용자가 입력한 내용이 있는지 판정 (복구 배너 표시용, 순수 함수)
 */
export function hasUserContent(report: ReportData | null | undefined): boolean {
  if (!report) return false;
  const t = (s: unknown) => typeof s === "string" && s.trim().length > 0;
  if (t(report.customerClaim?.customerName)) return true;
  if (t(report.customerClaim?.contact)) return true;
  if (t(report.customerClaim?.claimDetails)) return true;
  if (t(report.productInfo?.productName)) return true;
  if (t(report.productInfo?.lotNumber)) return true;
  if (t(report.productInfo?.manufactureDate)) return true;
  if (t(report.productInfo?.expiryDate)) return true;
  if (t(report.rootCauseAndActions?.rootCause)) return true;
  if (t(report.rootCauseAndActions?.preventiveMeasures)) return true;
  if (t(report.conclusion?.apologyText)) return true;
  if ((report.conclusion?.summaryPoints || []).some((p) => t(p))) return true;
  if (countUserPhotos(report) > 0) return true;
  return false;
}

/**
 * 복구 배너 표시 여부 (순수 함수)
 * - 사용자 입력이 전혀 없으면 false
 * - 초기 양식과 동일하면(자동 저장된 빈 껍데기) false
 * - 비교 불가 시에는 선택권을 제공하는 쪽으로 true
 */
export function isRecoverableDraft(draft: ReportData | null | undefined, freshInitialJson: string): boolean {
  if (!hasUserContent(draft)) return false;
  try {
    const norm = (r: any) => JSON.stringify({ ...r, companyLogoUrl: "", customSealUrl: "" });
    const fresh = JSON.parse(freshInitialJson);
    return norm(draft) !== norm(fresh);
  } catch {
    return true;
  }
}
/**
 * 보고서 전체 사용자 사진 수 (소비자 사진 + 보관품 + 첨부 1/2/3)
 */
export function countUserPhotos(report: ReportData | null | undefined): number {
  if (!report) return 0;
  const lists = [
    report.customerClaim?.customerPhotos,
    report.lotHistory?.retainedSamplePhotos,
    report.attachments?.attachment1Photos,
    report.attachments?.attachment2Photos,
    report.attachments?.attachment3Photos,
  ];
  return lists.reduce((sum, list) => sum + (list || []).filter(isUserPhoto).length, 0);
}

export async function loadReportFromDb(): Promise<ReportData | null> {
  // 1. Try IndexedDB first (most complete, preserves high-res photos)
  try {
    const db = await openDatabase();
    const data = await new Promise<ReportData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DRAFT_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (data && typeof data === "object") {
      return data;
    }
  } catch (err) {
    console.warn("IndexedDB load note:", err);
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("LocalStorage load note:", err);
  }

  return null;
}

// Check if a photo is valid user-uploaded photo
export const isUserPhoto = (p: any): boolean =>
  Boolean(
    p &&
    typeof p.url === "string" &&
    p.url.trim() !== "" &&
    !p.url.includes("unsplash.com") &&
    !p.url.includes("placeholder")
  );

/**
 * Merges a preset into the current report while STRICTLY PRESERVING
 * all photos uploaded by the user and existing customer information.
 */
export function mergePresetData(currentReport: ReportData, presetData: Partial<ReportData>): ReportData {
  // Extract all existing user-attached photos
  const existingCustomerPhotos = (currentReport.customerClaim?.customerPhotos || []).filter(isUserPhoto);
  const existingLotPhotos = (currentReport.lotHistory?.retainedSamplePhotos || []).filter(isUserPhoto);
  const existingAtt1 = (currentReport.attachments?.attachment1Photos || []).filter(isUserPhoto);
  const existingAtt2 = (currentReport.attachments?.attachment2Photos || []).filter(isUserPhoto);
  const existingAtt3 = (currentReport.attachments?.attachment3Photos || []).filter(isUserPhoto);

  const merged: ReportData = {
    ...currentReport,
    ...presetData,
    id: currentReport.id,
    docNumber: currentReport.docNumber || presetData.docNumber || "",
    companyLogoUrl: currentReport.companyLogoUrl || presetData.companyLogoUrl,
    // 담당자가 직접 입력한 제조번호는 프리셋 적용 시에도 덮어쓰지 않음
    productInfo: {
      ...currentReport.productInfo,
      ...presetData.productInfo,
      lotNumber:
        currentReport.productInfo?.lotNumber?.trim() ||
        presetData.productInfo?.lotNumber ||
        "",
    },
    customerClaim: {
      ...currentReport.customerClaim,
      ...presetData.customerClaim,
      // Preserve customer contact info if user already typed it
      customerName: currentReport.customerClaim?.customerName || presetData.customerClaim?.customerName || "",
      contact: currentReport.customerClaim?.contact || presetData.customerClaim?.contact || "",
      channel: currentReport.customerClaim?.channel || presetData.customerClaim?.channel || "고객상담센터 (유선 접수)",
      receivedAt: currentReport.customerClaim?.receivedAt || presetData.customerClaim?.receivedAt || "",
      claimDetails: currentReport.customerClaim?.claimDetails || presetData.customerClaim?.claimDetails || "",
      maskCustomerName: currentReport.customerClaim?.maskCustomerName ?? presetData.customerClaim?.maskCustomerName ?? true,
      // Keep customer photos!
      customerPhotos: existingCustomerPhotos.length > 0
        ? existingCustomerPhotos
        : ((presetData.customerClaim?.customerPhotos || []).filter(isUserPhoto)),
    },
    lotHistory: {
      ...currentReport.lotHistory,
      ...presetData.lotHistory,
      skipped: presetData.lotHistory?.skipped ?? currentReport.lotHistory?.skipped ?? false,
      productionLogNote: presetData.lotHistory?.productionLogNote ?? currentReport.lotHistory?.productionLogNote ?? "",
      qualityTestRecord: presetData.lotHistory?.qualityTestRecord ?? currentReport.lotHistory?.qualityTestRecord ?? "",
      priorClaimsCount: presetData.lotHistory?.priorClaimsCount ?? currentReport.lotHistory?.priorClaimsCount ?? "",
      retainedSampleCheck: presetData.lotHistory?.retainedSampleCheck ?? currentReport.lotHistory?.retainedSampleCheck ?? "",
      rawMaterialCheck: presetData.lotHistory?.rawMaterialCheck ?? currentReport.lotHistory?.rawMaterialCheck ?? "",
      rawMaterialStatus: presetData.lotHistory?.rawMaterialStatus ?? currentReport.lotHistory?.rawMaterialStatus,
      manufacturingRecordResult: presetData.lotHistory?.manufacturingRecordResult ?? currentReport.lotHistory?.manufacturingRecordResult,
      storageSampleResult: presetData.lotHistory?.storageSampleResult ?? currentReport.lotHistory?.storageSampleResult,
      qualityInspectionResult: presetData.lotHistory?.qualityInspectionResult ?? currentReport.lotHistory?.qualityInspectionResult,
      materialInvestigationResult: presetData.lotHistory?.materialInvestigationResult ?? currentReport.lotHistory?.materialInvestigationResult,
      // Keep lot photos!
      retainedSamplePhotos: existingLotPhotos.length > 0
        ? existingLotPhotos
        : ((presetData.lotHistory?.retainedSamplePhotos || []).filter(isUserPhoto)),
    },
    manufacturingProcess: {
      ...currentReport.manufacturingProcess,
      ...presetData.manufacturingProcess,
      processInvestigationResult: presetData.manufacturingProcess?.processInvestigationResult ?? currentReport.manufacturingProcess?.processInvestigationResult,
    },
    investigationResults: {
      ...(currentReport.investigationResults || {}),
      ...(presetData.investigationResults || {}),
    },
    manufacturingRecordResult: presetData.manufacturingRecordResult ?? currentReport.manufacturingRecordResult,
    storageSampleResult: presetData.storageSampleResult ?? currentReport.storageSampleResult,
    qualityInspectionResult: presetData.qualityInspectionResult ?? currentReport.qualityInspectionResult,
    processInvestigationResult: presetData.processInvestigationResult ?? currentReport.processInvestigationResult,
    materialInvestigationResult: presetData.materialInvestigationResult ?? currentReport.materialInvestigationResult,
    investigationSelections: {
      ...(currentReport.investigationSelections || {}),
      ...(presetData.investigationSelections || {}),
    },
    attachments: {
      attachment1Photos: existingAtt1.length > 0
        ? existingAtt1
        : ((presetData.attachments?.attachment1Photos || []).filter(isUserPhoto)),
      attachment2Photos: existingLotPhotos.length > 0
        ? existingLotPhotos
        : (existingAtt2.length > 0
            ? existingAtt2
            : ((presetData.attachments?.attachment2Photos || []).filter(isUserPhoto))),
      attachment3Photos: existingAtt3.length > 0
        ? existingAtt3
        : ((presetData.attachments?.attachment3Photos || []).filter(isUserPhoto)),
    },
  };

  return merged;
}
