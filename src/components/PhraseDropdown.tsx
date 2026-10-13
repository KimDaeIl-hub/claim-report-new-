import React, { useState, useEffect, useRef, useMemo } from "react";
import { BookOpen, Plus, ChevronDown, Check, Tag, Sparkles, Search, Zap, X, History } from "lucide-react";
import { getAllPhrasesForField, loadAllPhrases, loadFavoritePhraseIds, toggleFavoritePhraseId, StandardPhrase } from "../data/standardPhrases";
import {
  getRecommendedPhrases,
  SituationRecommendationContext,
  RecommendationMatchResult,
  normalizeClaimType,
  normalizeInvestigationItem,
  normalizeResultType,
} from "../utils/situationPhraseRecommender";
import {
  CurrentClaimContext,
  SimilarClaimRecommendation,
  getRecommendedSimilarClaims,
} from "../utils/similarClaimRecommender";
import {
  buildInsertedText,
  extractReusablePastSentences,
  recordPhraseUse,
  getRecentPhrases,
} from "../utils/phraseInsert";

interface PhraseDropdownProps {
  fieldKey: string;
  activePresetId?: string;
  situationContext?: SituationRecommendationContext;
  /** 현재 입력값: 제공되면 상용구를 덮어쓰지 않고 이어서 삽입 */
  currentValue?: string;
  /** 유사 사례 문구 섹션용 컨텍스트 (없으면 섹션 미표시) */
  pastContext?: CurrentClaimContext | null;
  onSelectPhrase: (content: string) => void;
  onOpenManager?: (fieldKey?: string) => void;
  buttonLabel?: string;
  size?: "sm" | "xs";
}

export function PhraseDropdown({
  fieldKey,
  activePresetId,
  situationContext,
  currentValue = "",
  pastContext = null,
  onSelectPhrase,
  onOpenManager,
  buttonLabel = "표준 상용구",
  size = "sm",
}: PhraseDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phrases, setPhrases] = useState<StandardPhrase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [keepOpen, setKeepOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setFavoriteIds(loadFavoritePhraseIds());
  }, [isOpen]);

  // 즐겨찾기 토글 (ID 참조만 변경, 회사 표준·원문 불변)
  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteIds(toggleFavoritePhraseId(id));
  };

  const renderFavStar = (phrase: StandardPhrase) => {
    const fav = favoriteIds.includes(phrase.id);
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => handleToggleFavorite(e, phrase.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            setFavoriteIds(toggleFavoritePhraseId(phrase.id));
          }
        }}
        title={fav ? "즐겨찾기 해제" : "내 즐겨찾기에 등록 (회사 표준은 변경되지 않음)"}
        className={`shrink-0 text-sm leading-none cursor-pointer select-none px-0.5 ${
          fav ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
        }`}
      >
        {fav ? "★" : "☆"}
      </span>
    );
  };

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

  // 세션 내 최근 사용 (동일 필드 우선, 저장소 기록 없음)
  const recentPhrases = useMemo(() => {
    if (!isOpen) return [];
    return getRecentPhrases(6).filter((p) => p.fieldKey === fieldKey).slice(0, 3);
  }, [isOpen, fieldKey, phrases]);

  // 유사 사례 재사용 가능 문구 (사실정보 제외, 서술형 조사 문구만)
  const pastSentences = useMemo(() => {
    if (!isOpen || !pastContext) return [];
    try {
      const recs: SimilarClaimRecommendation[] = getRecommendedSimilarClaims(pastContext, undefined, 2);
      const out: { rec: SimilarClaimRecommendation; key: string; label: string; text: string }[] = [];
      for (const rec of recs) {
        const sentences = extractReusablePastSentences(rec.pastClaim?.report);
        for (const s of sentences.slice(0, 3)) {
          out.push({ rec, key: `${rec.pastClaim.id}-${s.key}`, label: s.label, text: s.text });
          if (out.length >= 4) break;
        }
        if (out.length >= 4) break;
      }
      return out;
    } catch {
      return [];
    }
  }, [isOpen, pastContext]);

  // 클릭 삽입: 기존 입력은 유지하고 이어쓰기 (원문 그대로, 수정 없음)
  const handleInsert = (content: string) => {
    onSelectPhrase(buildInsertedText(currentValue, content));
    const found =
      phrases.find((p) => p.content === content) ||
      recommendations.find((r) => r.phrase.content === content)?.phrase;
    if (found) recordPhraseUse(found);
    if (!keepOpen) setIsOpen(false);
  };

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
          <div className="px-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              대상: <strong className="text-slate-700">{fieldKey}</strong>
              <span className="text-slate-400"> · 클릭하면 입력란에 이어서 삽입 (기존 입력 유지)</span>
            </span>
            <label className="flex items-center gap-1 cursor-pointer shrink-0" title="ON이면 클릭 후에도 목록을 유지하여 여러 문구를 연속으로 담을 수 있습니다">
              <input
                type="checkbox"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="w-3 h-3 rounded text-blue-600"
              />
              <span className="font-semibold">연속 담기</span>
            </label>
          </div>
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

          {/* [0] MY FAVORITES (PERSONAL, ID-REFERENCED) */}
          {(() => {
            const favs = phrases.filter((p) => favoriteIds.includes(p.id));
            if (favs.length === 0 || searchQuery) return null;
            return (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 space-y-1">
                <div className="px-1 text-[11px] font-extrabold text-amber-900">
                  <span>⭐ 내 즐겨찾기 ({favs.length}건)</span>
                  <span className="font-normal text-amber-700"> · 클릭하면 입력란에 이어서 삽입</span>
                </div>
                {favs.slice(0, 5).map((phrase) => (
                  <button
                    key={`fav-${phrase.id}`}
                    type="button"
                    onClick={() => handleInsert(phrase.content)}
                    className="w-full text-left p-2 bg-white hover:bg-amber-100/70 border border-amber-200 rounded-lg transition-colors group flex items-start gap-1"
                    title="클릭하면 입력란에 이어서 삽입 (원문 그대로)"
                  >
                    {renderFavStar(phrase)}
                    <span className="flex-1 min-w-0">
                      <span className="font-bold text-slate-900 text-xs block truncate">
                        {phrase.title}
                        {phrase.isCustom && (
                          <span className="ml-1 text-[9px] px-1 bg-amber-100 text-amber-700 rounded font-normal">
                            개인
                          </span>
                        )}
                        {!phrase.isCustom && (
                          <span className="ml-1 text-[9px] px-1 bg-slate-100 text-slate-500 rounded font-normal">
                            표준
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500 line-clamp-1 text-[11px] block">
                        {phrase.content}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            );
          })()}

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
                      handleInsert(rec.phrase.content);
                    }}
                    className="w-full text-left p-2 bg-white/95 hover:bg-blue-100/70 border border-blue-200 hover:border-blue-400 rounded-lg transition-all group shadow-2xs flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 group-hover:text-blue-900 flex items-center gap-1 text-xs">
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{rec.phrase.title}</span>
                        {renderFavStar(rec.phrase)}
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

          {/* [1-2] RECENTLY USED (SESSION ONLY, NO STORAGE) */}
          {recentPhrases.length > 0 && !searchQuery && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 space-y-1">
              <div className="px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>최근 사용 (이번 세션)</span>
              </div>
              {recentPhrases.map((phrase) => (
                <button
                  key={`recent-${phrase.id}`}
                  type="button"
                  onClick={() => handleInsert(phrase.content)}
                  className="w-full text-left p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group flex flex-col gap-0.5"
                  title="클릭하면 입력란에 이어서 삽입"
                >
                  <span className="font-semibold text-slate-800 text-xs truncate flex items-center gap-1">
                    {renderFavStar(phrase)}
                    <span className="truncate">{phrase.title}</span>
                  </span>
                  <span className="text-slate-500 line-clamp-1 text-[11px]">{phrase.content}</span>
                </button>
              ))}
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
                      handleInsert(phrase.content);
                    }}
                    className={`w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors group flex flex-col gap-0.5 border ${
                      isLinked ? "bg-blue-50/30 border-blue-200" : "border-slate-100"
                    }`}
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {isLinked && <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />}
                        <span>{phrase.title}</span>
                        {renderFavStar(phrase)}
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

          {/* [3] PAST CASE SENTENCES (STRUCTURE/SENTENCE REUSE ONLY, NO FACT COPY) */}
          {pastSentences.length > 0 && !searchQuery && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2 space-y-1.5">
              <div className="px-1 flex items-center justify-between">
                <span className="font-extrabold text-amber-900 flex items-center gap-1 text-[11px]">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  <span>유사 사례에서 사용된 조사 문구</span>
                </span>
              </div>
              <p className="px-1 text-[10px] text-amber-800 leading-relaxed">
                제조번호·날짜·측정값·원인·결론은 제외된 서술 문구입니다. 신규 사실과 맞는지 확인 후 클릭하세요.
              </p>
              {pastSentences.map((s) => (
                <button
                  key={`past-${s.key}`}
                  type="button"
                  onClick={() => handleInsert(s.text)}
                  className="w-full text-left p-2 bg-white/95 hover:bg-amber-100/70 border border-amber-200 rounded-lg transition-all group flex flex-col gap-0.5"
                  title="클릭하면 입력란에 이어서 삽입 (원문 그대로)"
                >
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-bold">
                      {s.label}
                    </span>
                    <span className="truncate">유사 사례 문구</span>
                  </span>
                  <span className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          )}

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

