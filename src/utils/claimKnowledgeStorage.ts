import { ClaimKnowledgeItem } from "../types/claimKnowledge";
import { COMPLETED_HISTORICAL_CLAIMS } from "../data/completedHistoricalClaims";
import { extractKnowledgeFromReport } from "./claimKnowledgeExtractor";

export const CLAIM_KNOWLEDGE_STORAGE_KEY = "food_qc_completed_claim_knowledge_items";

/**
 * 표준 완료 과거 클레임으로부터 초기 시드 지식 데이터 생성
 */
function createSeedKnowledgeItems(): ClaimKnowledgeItem[] {
  const seedItems: ClaimKnowledgeItem[] = [];

  for (const hist of COMPLETED_HISTORICAL_CLAIMS) {
    if (hist.report) {
      // 1. 비타민 A 2026.08.20 사례: 설비 노즐 패킹 마모 추정이나 원인은 미확정 종결
      const isIdentified = hist.id.includes("20260513"); // 2026.05.13은 원료 뭉침으로 원인 규명
      const seedKnowledge = extractKnowledgeFromReport(hist.report, {
        isCauseIdentified: isIdentified,
        causeStatusLabel: isIdentified ? "원인 규명 완료" : "원인 미확인 / 추정",
        causeCategory: isIdentified
          ? "제조공정 (여과 공정 / 원료 뭉침)"
          : "제조공정 (충전 노즐 EPDM 고무 패킹 마모 추정)",
        causeDetail: hist.report.rootCauseAndActions.rootCause,
      });

      seedKnowledge.id = `knowledge-${hist.id}`;
      seedKnowledge.isApprovedForKnowledge = true;
      seedItems.push(seedKnowledge);
    }
  }

  return seedItems;
}

/**
 * 저장된 모든 완료 클레임 지식 데이터 로드
 */
export function loadAllClaimKnowledge(): ClaimKnowledgeItem[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return createSeedKnowledgeItems();
  }

  try {
    const raw = localStorage.getItem(CLAIM_KNOWLEDGE_STORAGE_KEY);
    if (!raw) {
      const initial = createSeedKnowledgeItems();
      localStorage.setItem(CLAIM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = createSeedKnowledgeItems();
    localStorage.setItem(CLAIM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch (e) {
    console.error("Failed to load claim knowledge base", e);
    return createSeedKnowledgeItems();
  }
}

/**
 * 완료 클레임 지식 데이터를 저장소에 영구 보관
 */
export function saveClaimKnowledge(item: ClaimKnowledgeItem): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  const current = loadAllClaimKnowledge();
  const existingIdx = current.findIndex(
    (k) => k.id === item.id || (item.reportId && k.reportId === item.reportId)
  );

  let updated: ClaimKnowledgeItem[];
  if (existingIdx >= 0) {
    updated = current.map((k, i) => (i === existingIdx ? item : k));
  } else {
    updated = [item, ...current];
  }

  try {
    localStorage.setItem(CLAIM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Storage quota exceeded, trying compact save", e);
    // 사진 URL을 제외한 컴팩트 저장
    const compactUpdated = updated.map((it) => ({
      ...it,
      reportSnapshot: {
        ...it.reportSnapshot,
        customerClaim: {
          ...it.reportSnapshot.customerClaim,
          customerPhotos: [],
        },
        lotHistory: {
          ...it.reportSnapshot.lotHistory,
          retainedSamplePhotos: [],
        },
        attachments: {
          attachment1Photos: [],
          attachment2Photos: [],
          attachment3Photos: [],
        },
      },
    }));
    try {
      localStorage.setItem(CLAIM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(compactUpdated));
    } catch (inner) {
      console.error("Final compact save failed", inner);
    }
  }
}

/**
 * 특정 보고서 ID로 등록된 지식 항목 찾기
 */
export function findClaimKnowledgeByReportId(reportId: string): ClaimKnowledgeItem | undefined {
  const all = loadAllClaimKnowledge();
  return all.find((k) => k.reportId === reportId);
}

/**
 * 특정 지식 항목 삭제
 */
export function deleteClaimKnowledge(id: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const current = loadAllClaimKnowledge();
  const filtered = current.filter((k) => k.id !== id);
  localStorage.setItem(CLAIM_KNOWLEDGE_STORAGE_KEY, JSON.stringify(filtered));
}
