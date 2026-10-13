import React, { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { getAllPhrasesForField, loadAllPhrases, saveAllPhrases, toggleFavoritePhraseId } from "../data/standardPhrases";
import { suggestPhrasesForText, buildInsertedText } from "../utils/phraseInsert";

interface InlinePhraseSuggestProps {
  fieldKey: string;
  /** 현재 입력 중인 전체 텍스트 (매칭 재료 + 이어쓰기 기준) */
  currentText: string;
  activePresetId?: string;
  /** 최종 텍스트(기존 입력 + 선택 문구)를 받아 필드에 반영 */
  onInsert: (finalText: string) => void;
  minChars?: number;
  limit?: number;
}

/**
 * 입력 중 관련 상용구 추천 (규칙 기반 키워드 일치, AI 호출 없음)
 * - 자동 삽입하지 않음: 클릭한 문구만 이어서 삽입
 * - 기존 직접 입력은 그대로 보존
 */
export function InlinePhraseSuggest({
  fieldKey,
  currentText,
  activePresetId,
  onInsert,
  minChars = 6,
  limit = 3,
}: InlinePhraseSuggestProps) {
  const matches = useMemo(() => {
    if ((currentText || "").trim().length < minChars) return [];
    const candidates = getAllPhrasesForField(fieldKey, activePresetId);
    return suggestPhrasesForText(candidates, currentText, limit);
  }, [fieldKey, currentText, activePresetId, minChars, limit]);

  const [savedMark, setSavedMark] = useState(false);

  // 현재 직접 입력문을 개인 즐겨찾기로 저장 (원문 그대로, 회사 표준 불변)
  const handleSaveCurrentAsFavorite = () => {
    const text = (currentText || "").trim();
    if (text.length < 2) return;
    const now = new Date();
    const stamp = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newPhrase = {
      id: `custom-user-${Date.now()}`,
      fieldKey,
      title: `내 문구 ${stamp} (${text.slice(0, 14)}${text.length > 14 ? "…" : ""})`,
      content: text,
      category: "general",
      isCustom: true,
      isActive: true,
    };
    const current = loadAllPhrases();
    saveAllPhrases([newPhrase, ...current]);
    toggleFavoritePhraseId(newPhrase.id);
    setSavedMark(true);
    setTimeout(() => setSavedMark(false), 2500);
  };

  if (matches.length === 0 && (currentText || "").trim().length >= minChars) {
    // 일치 상용구가 없어도 직접 입력문 저장 진입은 제공
    return (
      <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
        <button
          type="button"
          onClick={handleSaveCurrentAsFavorite}
          className="text-[11px] font-bold text-amber-700 hover:text-amber-900"
          title="현재 직접 입력한 문구를 그대로 개인 즐겨찾기에 저장 (회사 표준은 변경되지 않음)"
        >
          {savedMark ? "★ 저장됨! 내 즐겨찾기에서 확인" : "☆ 현재 입력문을 내 즐겨찾기에 저장"}
        </button>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="mt-1.5 rounded-lg border border-blue-200 bg-blue-50/70 p-2 space-y-1.5">
      <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-blue-900">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>입력 내용 관련 상용구 {matches.length}건</span>
          <span className="font-normal text-blue-700">· 클릭하면 이어서 삽입 (기존 입력 유지)</span>
        </span>
        <button
          type="button"
          onClick={handleSaveCurrentAsFavorite}
          className="shrink-0 font-bold text-amber-700 hover:text-amber-900"
          title="현재 직접 입력한 문구를 그대로 개인 즐겨찾기에 저장 (회사 표준은 변경되지 않음)"
        >
          {savedMark ? "★ 저장됨!" : "☆ 내 즐겨찾기 저장"}
        </button>
      </div>
      {matches.map((m) => (
        <button
          key={m.phrase.id}
          type="button"
          onClick={() => onInsert(buildInsertedText(currentText, m.phrase.content))}
          className="w-full text-left p-2 bg-white hover:bg-blue-100/60 border border-blue-200/70 rounded-lg transition-colors group"
          title={`클릭하여 삽입 (일치 키워드: ${m.matchedKeywords.join(", ")})`}
        >
          <span className="font-bold text-slate-900 text-xs block truncate">
            ① {m.phrase.title}
          </span>
          <span className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed block">
            {m.phrase.content}
          </span>
        </button>
      ))}
    </div>
  );
}
