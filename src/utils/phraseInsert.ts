import { ReportData, StandardPhrase } from "../types";
import {
  loadAllPhrases,
  getRecentPhraseIdsOrdered,
  recordRecentPhraseUse,
} from "../data/standardPhrases";

/**
 * 상용구 원클릭 재사용 지원 유틸 (규칙 기반, AI/LLM 호출 없음)
 *
 * 원칙:
 * - 추천 문구는 "선택 가능한 참고/삽입 옵션"으로만 제공 (자동 삽입 금지)
 * - 삽입 시 기존 사용자 입력은 절대 덮어쓰지 않음 (이어쓰기 + 중복 방지)
 * - 상용구 원문은 그대로 삽입 (표현 수정·요약·교정 없음)
 */

// ---------------------------------------------------------------------------
// [1] 이어쓰기 삽입 (기존 입력 보존)
// ---------------------------------------------------------------------------
export function buildInsertedText(
  current: string | undefined | null,
  addition: string | undefined | null
): string {
  const cur = (current || "").trim();
  const add = (addition || "").trim();
  if (!add) return cur;
  if (!cur) return add;
  if (cur.includes(add)) return cur; // 중복 삽입 방지
  return `${cur}\n${add}`;
}

// ---------------------------------------------------------------------------
// [2] 입력 중 키워드 기반 상용구 매칭 (규칙 기반 텍스트 일치)
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  "및", "또는", "통해", "대해", "통한", "대한", "결과", "확인", "있습니다", "없습니다",
  "것으로", "것을", "것이", "있는", "없는", "같은", "같이", "위해", "통해", "에서", "으로",
  "하고", "하여", "하신", "합니다", "됩니다", "또한", "현재", "해당", "이번", "위와",
]);

export function extractKeywords(text: string | undefined | null): string[] {
  if (!text) return [];
  const tokens = text
    .toLowerCase()
    .split(/[^가-힣a-z0-9]+/g)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

/**
 * 입력 텍스트와 상용구 본문의 키워드 겹침 점수 (0 = 무관)
 */
export function scoreTextMatch(typed: string, phraseContent: string): number {
  const typedKeys = extractKeywords(typed);
  if (typedKeys.length === 0) return 0;
  const contentLower = (phraseContent || "").toLowerCase();
  let score = 0;
  for (const key of typedKeys) {
    if (contentLower.includes(key)) {
      // 긴 키워드일수록 변별력이 높음
      score += key.length >= 4 ? 3 : 2;
    }
  }
  return score;
}

export interface TextMatchedPhrase {
  phrase: StandardPhrase;
  score: number;
  matchedKeywords: string[];
}

export function suggestPhrasesForText(
  candidates: StandardPhrase[],
  typed: string,
  limit = 3
): TextMatchedPhrase[] {
  const typedKeys = extractKeywords(typed);
  if (typedKeys.length === 0) return [];
  const scored: TextMatchedPhrase[] = [];
  for (const phrase of candidates) {
    if (phrase.isActive === false) continue;
    const contentLower = (phrase.content || "").toLowerCase();
    const matched = typedKeys.filter((k) => contentLower.includes(k));
    if (matched.length === 0) continue;
    let score = 0;
    for (const k of matched) score += k.length >= 4 ? 3 : 2;
    // 이미 본문에 포함된 문구는 제외 (중복 삽입 방지)
    if ((typed || "").includes(phrase.content.trim())) continue;
    scored.push({ phrase, score, matchedKeywords: matched });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ---------------------------------------------------------------------------
// [3] 과거 클레임 재사용 가능 문구 추출
// ---------------------------------------------------------------------------
export interface ReusablePastSentence {
  key: string;
  label: string; // 조사 항목명 (예: "보관품 확인")
  text: string; // 원문 그대로
}

type SentenceFieldGetter = (report: ReportData) => string | undefined;

// 사실정보(제조번호·날짜·소비자·측정값·원인·결론·사진)는 제외하고,
// 서술형 조사 문구만 추출 (원문 유지, 수정 없음)
const REUSABLE_SENTENCE_FIELDS: { key: string; label: string; get: SentenceFieldGetter }[] = [
  { key: "sampleCondition", label: "현품 성상", get: (r) => r.analysisResults?.visualInspection?.sampleCondition },
  { key: "retainedSampleCheck", label: "보관품 확인", get: (r) => r.lotHistory?.retainedSampleCheck },
  { key: "productionLogNote", label: "제조기록 확인", get: (r) => r.lotHistory?.productionLogNote },
  { key: "qualityTestRecord", label: "품질검사 기록", get: (r) => r.lotHistory?.qualityTestRecord },
  { key: "filtrationAnalysis", label: "여과 공정", get: (r) => r.manufacturingProcess?.filtrationAnalysis },
  { key: "cleaningAnalysis", label: "세척 공정", get: (r) => r.manufacturingProcess?.cleaningAnalysis },
];

export function extractReusablePastSentences(report: ReportData | null | undefined): ReusablePastSentence[] {
  if (!report) return [];
  const out: ReusablePastSentence[] = [];
  for (const field of REUSABLE_SENTENCE_FIELDS) {
    try {
      const text = (field.get(report) || "").trim();
      if (text.length >= 4) {
        out.push({ key: field.key, label: field.label, text });
      }
    } catch {
      // ignore
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// [4] 최근·자주 사용 상용구 (기존 저장구조 활용: ID+횟수+시각, 본문 복제 없음)
// ---------------------------------------------------------------------------
export function recordPhraseUse(phrase: StandardPhrase): void {
  try {
    recordRecentPhraseUse(phrase.id);
  } catch {
    // ignore (메모리 폴백 없이 조용히 통과)
  }
}

export function getRecentPhrases(limit = 3): StandardPhrase[] {
  try {
    const ids = getRecentPhraseIdsOrdered(limit);
    if (ids.length === 0) return [];
    const byId = new Map(loadAllPhrases().map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is StandardPhrase => !!p && p.isActive !== false);
  } catch {
    return [];
  }
}
