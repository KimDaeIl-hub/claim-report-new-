import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Check, Copy, BookOpen, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import {
  getRecommendedPhrases,
  SituationRecommendationContext,
  RecommendationMatchResult,
  normalizeClaimType,
  normalizeInvestigationItem,
  normalizeResultType,
} from "../utils/situationPhraseRecommender";
import { buildInsertedText, recordPhraseUse } from "../utils/phraseInsert";
import { loadAllPhrases } from "../data/standardPhrases";

interface SituationPhraseRecommendationCardProps {
  context: SituationRecommendationContext;
  currentValue?: string;
  onApplySentence: (sentence: string) => void;
  onOpenPhraseManager?: (fieldKey?: string) => void;
  fieldKey?: string;
  compact?: boolean;
}

export function SituationPhraseRecommendationCard({
  context,
  currentValue = "",
  onApplySentence,
  onOpenPhraseManager,
  fieldKey,
  compact = false,
}: SituationPhraseRecommendationCardProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  // Load phrases and filter by recommendation
  const recommendations: RecommendationMatchResult[] = useMemo(() => {
    // If neither item nor result is specified, return empty
    if (!context.investigationItem && !context.resultType) return [];
    const allPhrases = loadAllPhrases();
    return getRecommendedPhrases(allPhrases, context);
  }, [context.claimType, context.investigationItem, context.resultType, context.usageLocation, context.relatedProcess, context.relatedProductType]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [context.claimType, context.investigationItem, context.resultType]);

  if (recommendations.length === 0) {
    return null;
  }

  const activeRec = recommendations[selectedIdx] || recommendations[0];
  const activePhrase = activeRec?.phrase;
  if (!activePhrase) return null;

  const isAlreadyApplied =
    currentValue &&
    (currentValue.trim() === activePhrase.content.trim() ||
      currentValue.includes(activePhrase.content.trim()));

  const handleApply = (content: string) => {
    // 기존 직접 입력은 유지하고 이어서 삽입 (덮어쓰기 금지)
    onApplySentence(buildInsertedText(currentValue, content));
    if (activePhrase) recordPhraseUse(activePhrase);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normClaim = normalizeClaimType(context.claimType);
  const normItem = normalizeInvestigationItem(context.investigationItem);
  const normResult = normalizeResultType(context.resultType);

  return (
    <div
      className={`my-2 rounded-xl border transition-all ${
        activeRec.isExactMatch
          ? "bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-amber-50/70 border-blue-300 ring-1 ring-blue-400/50 shadow-xs"
          : "bg-amber-50/60 border-amber-300/80 shadow-2xs"
      } p-3 sm:p-3.5`}
    >
      {/* Header with Situation Tags */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-extrabold text-blue-900 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>상황 기반 자동 추천 상용구</span>
          </span>

          {activeRec.isExactMatch && (
            <span className="font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-emerald-600" />
              <span>정밀 상황 일치</span>
            </span>
          )}

          {/* Condition Tags */}
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">
            <span>클레임: <strong className="text-slate-800 font-bold">{normClaim}</strong></span>
            <span className="text-slate-300">•</span>
            <span>항목: <strong className="text-slate-800 font-bold">{normItem}</strong></span>
            <span className="text-slate-300">•</span>
            <span>결과: <strong className="text-blue-700 font-bold">{normResult}</strong></span>
          </div>
        </div>

        {/* Counter & Manager Link */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {recommendations.length > 1 && (
            <span className="text-[10px] text-slate-500 font-semibold">
              추천 {recommendations.length}건
            </span>
          )}
          {onOpenPhraseManager && (
            <button
              type="button"
              onClick={() => onOpenPhraseManager(fieldKey || activePhrase.fieldKey)}
              className="text-[10px] font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
            >
              <BookOpen className="w-3 h-3 text-slate-400" />
              <span>라이브러리</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs if multiple candidates */}
      {recommendations.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-thin">
          {recommendations.slice(0, 4).map((rec, idx) => {
            const isTabActive = idx === selectedIdx;
            return (
              <button
                key={rec.phrase.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all shrink-0 flex items-center gap-1 border ${
                  isTabActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white/80 text-slate-600 border-slate-200 hover:bg-white"
                }`}
              >
                <span>{rec.phrase.title}</span>
                {rec.isExactMatch && <span className="text-[9px] opacity-90">★</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Sentence Content Box */}
      <div className="bg-white/95 rounded-lg border border-slate-200 p-2.5 sm:p-3 shadow-2xs mb-2.5">
        <p className="text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans font-medium whitespace-pre-wrap">
          {activePhrase.content}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">{activePhrase.title}</span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] text-slate-400">
            {activePhrase.usageLocation || "분석 내용"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCopy(activePhrase.content)}
            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
            title="문구 클립보드 복사"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? "복사됨!" : "복사"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleApply(activePhrase.content)}
            className={`px-3 py-1 text-xs font-bold rounded-md shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 ${
              isAlreadyApplied || justApplied
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xs"
            }`}
            title="클릭하여 보고서 본문에 이 추천 상용구를 즉시 삽입합니다"
          >
            {isAlreadyApplied || justApplied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{justApplied ? "보고서에 삽입됨!" : "현재 본문에 적용됨"}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>보고서에 바로 삽입 (클릭)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
