import React, { useState, useMemo } from "react";
import {
  Sparkles,
  History,
  Eye,
  Workflow,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { ReportData } from "../types";
import {
  CurrentClaimContext,
  SimilarClaimRecommendation,
  getRecommendedSimilarClaims,
} from "../utils/similarClaimRecommender";
import { PastClaimDetailViewModal } from "./PastClaimDetailViewModal";
import {
  ImportInvestigationMethodModal,
  MethodImportOptions,
} from "./ImportInvestigationMethodModal";
import { ImportInvestigationStructureModal } from "./ImportInvestigationStructureModal";

interface SimilarClaimRecommendationCardProps {
  context: CurrentClaimContext;
  currentReport?: ReportData;
  onApplyMethods?: (options: MethodImportOptions, recommendation: SimilarClaimRecommendation) => void;
  onUseAsInvestigationPackage?: (pastReport: ReportData) => void;
  onOpenManualSearch?: () => void;
}

export function SimilarClaimRecommendationCard({
  context,
  currentReport,
  onApplyMethods,
  onUseAsInvestigationPackage,
  onOpenManualSearch,
}: SimilarClaimRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [viewDetailTarget, setViewDetailTarget] = useState<SimilarClaimRecommendation | null>(null);
  const [importMethodTarget, setImportMethodTarget] = useState<SimilarClaimRecommendation | null>(null);
  const [importStructureTarget, setImportStructureTarget] = useState<SimilarClaimRecommendation | null>(null);

  // 현재 입력 상태에 맞춰 실시간으로 구조적 유사 과거 클레임 계산
  const recommendations = useMemo(() => {
    return getRecommendedSimilarClaims(context, undefined, 4);
  }, [
    context.productName,
    context.productType,
    context.claimMajorCategory,
    context.claimMidCategory,
    context.claimDetailType,
    context.manufactureLine,
    context.manufacturer,
    context.relatedProcess,
    context.foreignMatterFeatures,
    context.customerClaimDetails,
    context.lotNumber,
  ]);

  const topMatch = recommendations[0];
  const hasStrongMatch = topMatch && topMatch.similarityScore >= 60;

  // 번호 원문자 (①, ②, ③, ④, ⑤)
  const circledNumbers = ["①", "②", "③", "④", "⑤"];

  return (
    <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/40 shadow-xs overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>[과거 유사 사례]</span>
                <span className="text-[11px] font-medium text-blue-200">
                  (완료된 과거 클레임 11대 항목 구조적 유사도 자동 추천)
                </span>
              </h3>
              {hasStrongMatch && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse">
                  유사 사례 {recommendations.length}건 발견
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              제품, 제품 유형, 대·중·상세분류, 라인, 제조처, 공정, 이물특징, 분석방법, 키워드 종합 분석
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenManualSearch && (
            <button
              type="button"
              onClick={onOpenManualSearch}
              className="text-[11px] font-bold text-blue-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="조건별 과거 클레임 전체 목록 수동 검색창 열기"
            >
              <Search className="w-3 h-3" />
              <span>이전 클레임 수동 검색</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={isExpanded ? "추천 목록 접기" : "추천 목록 펼치기"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Safety Principle Disclaimer Banner */}
      <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200 text-amber-950 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>조사자 원칙 준수:</strong> 유사도는 "원인 유사도"가 아닌 <strong>"구조적 유사성"</strong>을 나타내며, 과거 사례의 결론을 현재 사례에 자동 적용하지 않습니다.
          </span>
        </div>
        <span className="text-[10px] text-amber-700 font-semibold shrink-0">
          * 조사자가 과거 사례를 확인하고 선택하여 조사방법을 참조합니다.
        </span>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-3.5 sm:p-5 space-y-4">
          {recommendations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-300 p-6">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">현재 입력된 정보와 일치하는 완료된 과거 사례가 없습니다.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                제품명이나 클레임 유형(예: 비타민 음료 A, 검은색 이물 등)을 입력하시면 구조적으로 가장 유사한 완료 사례를 자동 추천합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recommendations.map((rec, index) => {
                const numIcon = circledNumbers[index] || `[${index + 1}]`;

                return (
                  <div
                    key={rec.pastClaim.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    {/* Top Row: Index + Date + Structural Similarity Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-indigo-900">
                          {numIcon} {rec.dateFormatted}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {rec.pastClaim.report.docNumber || rec.pastClaim.id}
                        </span>
                      </div>

                      {/* Structural Similarity Badge & Factor Breakdown */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black border shadow-2xs ${
                            rec.similarityScore >= 80
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : rec.similarityScore >= 60
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          유사도 {rec.similarityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Structural Factor Matching Tags (Requested by user) */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="font-semibold text-slate-400 mr-0.5">구조적 일치:</span>
                      {rec.matchedSummaryTags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold border border-indigo-200"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>

                    {/* Main Information Grid (Exact format requested by user) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">제품</span>
                        <strong className="text-slate-900 text-xs">{rec.productName}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">클레임</span>
                        <span className="font-bold text-blue-900 text-xs">{rec.claimSummary}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">제조라인</span>
                        <span className="font-semibold text-slate-800 text-xs">{rec.manufactureLine}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">관련공정</span>
                        <span className="font-semibold text-indigo-900 text-xs">{rec.relatedProcess}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">조사결과</span>
                        <span className="font-semibold text-emerald-800 text-xs">{rec.investigationResult}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">결론</span>
                        <span className="font-semibold text-amber-900 text-xs truncate block" title={rec.conclusion}>
                          {rec.conclusion}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: [내용 보기] [조사방법 가져오기] */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        분석방법: {rec.analysisMethodsUsed.slice(0, 3).join(", ") || "현품 육안 확인"}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* [내용 보기] */}
                        <button
                          type="button"
                          onClick={() => setViewDetailTarget(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>[내용 보기]</span>
                        </button>

                        {/* [조사방법 가져오기] */}
                        {onApplyMethods && (
                          <button
                            type="button"
                            onClick={() => setImportMethodTarget(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-300 hover:border-blue-600 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Workflow className="w-3.5 h-3.5" />
                            <span>[조사방법 가져오기]</span>
                          </button>
                        )}

                        {/* [이 사례를 조사 패키지로 사용] */}
                        {onUseAsInvestigationPackage && (
                          <button
                            type="button"
                            onClick={() => setImportStructureTarget(rec)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 border border-indigo-700 rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                            title="과거 사례의 조사 항목, 시험방법, 공정 점검 기준 및 상용구 연결 구조를 현재 클레임의 조사 틀로 세팅합니다. (결과 및 결론은 복사되지 않음)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>[이 사례를 조사 패키지로 사용]</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: [내용 보기] */}
      <PastClaimDetailViewModal
        isOpen={Boolean(viewDetailTarget)}
        onClose={() => setViewDetailTarget(null)}
        recommendation={viewDetailTarget}
        currentReport={currentReport}
        currentContext={context}
        onImportMethods={(rec) => setImportMethodTarget(rec)}
        onUseAsInvestigationPackage={(pastRep) => {
          if (onUseAsInvestigationPackage) onUseAsInvestigationPackage(pastRep);
        }}
      />

      {/* Modal 2: [조사방법 가져오기] */}
      <ImportInvestigationMethodModal
        isOpen={Boolean(importMethodTarget)}
        onClose={() => setImportMethodTarget(null)}
        recommendation={importMethodTarget}
        onConfirmImport={(opts, rec) => {
          if (onApplyMethods) onApplyMethods(opts, rec);
        }}
      />

      {/* Modal 3: [이 사례를 조사 패키지로 사용] - 구조 적용 전 확인 모달 */}
      <ImportInvestigationStructureModal
        isOpen={Boolean(importStructureTarget)}
        onClose={() => setImportStructureTarget(null)}
        pastReport={importStructureTarget?.pastClaim.report || null}
        currentReport={currentReport}
        currentContext={context}
        claimTitle={`${importStructureTarget?.productName || ""} (${importStructureTarget?.claimSummary || ""})`}
        claimDate={importStructureTarget?.dateFormatted}
        onConfirm={(pastRep) => {
          if (onUseAsInvestigationPackage) {
            onUseAsInvestigationPackage(pastRep);
          }
        }}
      />
    </div>
  );
}
