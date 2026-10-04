import React, { useState, useEffect, useRef, useMemo } from "react";
import { BookOpen, Plus, ChevronDown, Check, Tag, Sparkles, Search, Zap, X } from "lucide-react";
import { getAllPhrasesForField, loadAllPhrases, StandardPhrase } from "../data/standardPhrases";
import {
  getRecommendedPhrases,
  SituationRecommendationContext,
  RecommendationMatchResult,
  normalizeClaimType,
  normalizeInvestigationItem,
  normalizeResultType,
} from "../utils/situationPhraseRecommender";

interface PhraseDropdownProps {
  fieldKey: string;
  activePresetId?: string;
  situationContext?: SituationRecommendationContext;
  onSelectPhrase: (content: string) => void;
  onOpenManager?: (fieldKey?: string) => void;
  buttonLabel?: string;
  size?: "sm" | "xs";
}

export function PhraseDropdown({
  fieldKey,
  activePresetId,
  situationContext,
  onSelectPhrase,
  onOpenManager,
  buttonLabel = "표준 상용구",
  size = "sm",
}: PhraseDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phrases, setPhrases] = useState<StandardPhrase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhrases(getAllPhrasesForField(fieldKey, activePresetId));
  }, [fieldKey, activePresetId, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute situation recommendations if context is provided
  const recommendations: RecommendationMatchResult[] = useMemo(() => {
    if (!situationContext) return [];
    if (!situationContext.investigationItem && !situationContext.resultType) return [];
    const all = loadAllPhrases();
    return getRecommendedPhrases(all, situationContext);
  }, [situationContext, isOpen]);

  const hasSituationRecs = recommendations.length > 0;

  // Filtered standard phrases for search
  const filteredPhrases = useMemo(() => {
    if (!searchQuery.trim()) return phrases;
    const q = searchQuery.toLowerCase().trim();
    return phrases.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.claimType && p.claimType.toLowerCase().includes(q))
    );
  }, [phrases, searchQuery]);

  if (phrases.length === 0 && recommendations.length === 0 && !onOpenManager) {
    return null;
  }

  const isSmall = size === "xs";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id={`phrase-btn-${fieldKey}`}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 ${
          isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        } font-semibold transition-all rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
          hasSituationRecs
            ? "text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-300 ring-1 ring-blue-400/40 shadow-2xs"
            : "text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300"
        }`}
        title={hasSituationRecs ? "현재 상황 맞춤 추천 상용구 있음 (클릭)" : "자주 쓰는 표준 상용구 / 시험법 설명 선택"}
      >
        {hasSituationRecs ? (
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
        ) : (
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
        )}
        <span>{buttonLabel}</span>
        {hasSituationRecs && (
          <span className="text-[10px] px-1 py-0.2 bg-blue-600 text-white rounded font-bold">
            상황추천 {recommendations.length}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-88 sm:w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-[480px] overflow-y-auto space-y-2">
          {/* Top Quick Search Bar inside dropdown */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상용구 검색 (키워드, 제목, 문장)..."
              className="w-full text-xs pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* [1] SITUATION-BASED RECOMMENDATIONS (HIGHEST PRIORITY)                     */}
          {/* ========================================================================= */}
          {hasSituationRecs && !searchQuery && (
            <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/60 rounded-lg border border-blue-200 p-2 space-y-1.5">
              <div className="px-1 flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-blue-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>현재 조사 상황 맞춤 추천</span>
                </span>
                {situationContext && (
                  <span className="text-[10px] text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                    {normalizeClaimType(situationContext.claimType)} • {normalizeInvestigationItem(situationContext.investigationItem)} • {normalizeResultType(situationContext.resultType)}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {recommendations.slice(0, 3).map((rec) => (
                  <button
                    key={`rec-${rec.phrase.id}`}
                    type="button"
                    onClick={() => {
                      onSelectPhrase(rec.phrase.content);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-2 bg-white/95 hover:bg-blue-100/70 border border-blue-200 hover:border-blue-400 rounded-lg transition-all group shadow-2xs flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 group-hover:text-blue-900 flex items-center gap-1 text-xs">
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{rec.phrase.title}</span>
                      </span>
                      {rec.isExactMatch ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                          정밀 일치
                        </span>
                      ) : (
                        <span className="text-[9px] px-1 bg-blue-100 text-blue-800 rounded font-semibold">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                      {rec.phrase.content}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400">
                      <span>{rec.matchReasons.join(" • ")}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* [2] STANDARD PHRASES LIST (WITH PRESET EMPHASIS & SEARCH)                */}
          {/* ========================================================================= */}
          <div className="space-y-1 pt-1">
            <div className="px-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>{searchQuery ? `검색 결과 (${filteredPhrases.length}건)` : "전체 표준 상용구 목록"}</span>
              {activePresetId && !searchQuery && (
                <span className="text-[10px] text-blue-600 font-normal">프리셋 연계 우선</span>
              )}
            </div>

            {filteredPhrases.length === 0 ? (
              <div className="px-2.5 py-3 text-slate-400 text-center italic bg-slate-50 rounded-lg">
                일치하는 상용구가 없습니다.
              </div>
            ) : (
              filteredPhrases.map((phrase) => {
                const isLinked = activePresetId && phrase.presetId === activePresetId;
                return (
                  <button
                    key={phrase.id}
                    type="button"
                    onClick={() => {
                      onSelectPhrase(phrase.content);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors group flex flex-col gap-0.5 border ${
                      isLinked ? "bg-blue-50/30 border-blue-200" : "border-slate-100"
                    }`}
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {isLinked && <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />}
                        <span>{phrase.title}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {phrase.claimType && (
                          <span className="text-[9px] px-1 bg-slate-100 text-slate-600 rounded">
                            {phrase.claimType}
                          </span>
                        )}
                        {phrase.isCustom ? (
                          <span className="text-[9px] px-1 bg-amber-100 text-amber-700 rounded font-normal">
                            맞춤
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 bg-slate-100 text-slate-500 rounded font-normal">
                            표준
                          </span>
                        )}
                      </div>
                    </span>
                    <span className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed">
                      {phrase.content}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom link to PhraseManagerModal */}
          {onOpenManager && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManager(fieldKey);
                }}
                className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>상용구 / 시험원리 전체 관리자 열기</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

