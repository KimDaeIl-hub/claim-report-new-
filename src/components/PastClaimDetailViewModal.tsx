import React from "react";
import {
  X,
  Calendar,
  Package,
  Factory,
  Cpu,
  Layers,
  FileText,
  AlertTriangle,
  Microscope,
  CheckCircle2,
  Workflow,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import { ReportData } from "../types";
import { PastClaimItem } from "../utils/pastClaimManager";
import { SimilarClaimRecommendation } from "../utils/similarClaimRecommender";
import { ImportInvestigationStructureModal } from "./ImportInvestigationStructureModal";

interface PastClaimDetailViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: SimilarClaimRecommendation | null;
  currentReport?: ReportData;
  currentContext?: any;
  onImportMethods?: (recommendation: SimilarClaimRecommendation) => void;
  onUseAsInvestigationPackage?: (pastReport: ReportData) => void;
}

export function PastClaimDetailViewModal({
  isOpen,
  onClose,
  recommendation,
  currentReport,
  currentContext,
  onImportMethods,
  onUseAsInvestigationPackage,
}: PastClaimDetailViewModalProps) {
  const [isConfirmStructureOpen, setIsConfirmStructureOpen] = React.useState(false);

  if (!isOpen || !recommendation) return null;

  const past = recommendation.pastClaim;
  const rep = past.report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  과거 완료 클레임 상세 열람
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  구조적 유사도 {recommendation.similarityScore}%
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {rep.docNumber || past.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1">
                {rep.title || past.productName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-center gap-2 text-xs font-semibold shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>[조사자 주의 원칙]</strong> 본 과거 사례는 조사 방법 및 항목 구성을 참고하기 위한 기록입니다. 유사도가 높더라도 이번 클레임의 원인을 동일하게 예단하거나 결론을 단정해서는 안 됩니다.
          </span>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-700">
          {/* 1. 구조적 유사성 매칭 현황 */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>현재 클레임과의 구조적 유사성 분석 (11대 차원)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-extrabold text-xs">
                유사도 {recommendation.similarityScore}%
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {recommendation.matchedSummaryTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-900 font-bold text-[11px] shadow-2xs"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100 text-[11px]">
              <div>
                <span className="text-slate-400 block">발생일자:</span>
                <span className="font-bold text-slate-800">{recommendation.dateFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block">제조라인:</span>
                <span className="font-bold text-slate-800">{recommendation.manufactureLine}</span>
              </div>
              <div>
                <span className="text-slate-400 block">관련공정:</span>
                <span className="font-bold text-slate-800">{recommendation.relatedProcess}</span>
              </div>
              <div>
                <span className="text-slate-400 block">조사자:</span>
                <span className="font-bold text-slate-800">{past.researcherName}</span>
              </div>
            </div>
          </div>

          {/* 2. 제품 및 접수 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>접수 제품 정보</span>
              </span>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="text-slate-500">제품명: </span>
                  <strong className="text-slate-900">{rep.productInfo?.productName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">제조번호: </span>
                  <span className="font-mono font-bold text-blue-900">{rep.productInfo?.lotNumber || past.lotNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">제조처: </span>
                  <span>{rep.productInfo?.manufacturer}</span>
                </div>
                <div>
                  <span className="text-slate-500">용기형태: </span>
                  <span>{rep.productInfo?.packageType}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>소비자 주장 및 접수 내용</span>
              </span>
              <p className="text-[11px] text-slate-800 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                {rep.customerClaim?.claimDetails || past.claimDetailsSnippet}
              </p>
            </div>
          </div>

          {/* 3. 당시 수행된 조사 항목 및 방법 */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Microscope className="w-4 h-4 text-blue-600" />
              <span>당시 수행된 과학 분석 및 조사방법</span>
            </span>

            <div className="space-y-2">
              {/* 육안 */}
              {!rep.analysisResults?.visualInspection?.skipped && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-800 block mb-0.5">1. 현품 육안 확인:</span>
                  <p className="text-slate-600">
                    {rep.analysisResults?.visualInspection?.sampleCondition || rep.analysisResults?.visualInspection?.foreignObjectAppearance}
                  </p>
                </div>
              )}

              {/* 확대경 */}
              {!rep.analysisResults?.magnifierInspection?.skipped && rep.analysisResults?.magnifierInspection?.result && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-800 block mb-0.5">2. 정밀 확대경({rep.analysisResults.magnifierInspection.magnification || "30x"}):</span>
                  <p className="text-slate-600">{rep.analysisResults.magnifierInspection.result}</p>
                </div>
              )}

              {/* 현미경 */}
              {!rep.analysisResults?.opticalMicroscope?.skipped && rep.analysisResults?.opticalMicroscope?.result && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-800 block mb-0.5">3. 광학 현미경({rep.analysisResults.opticalMicroscope.magnification || "100x"}):</span>
                  <p className="text-slate-600">{rep.analysisResults.opticalMicroscope.result}</p>
                </div>
              )}

              {/* FT-IR */}
              {!rep.analysisResults?.ftirAnalysis?.skipped && rep.analysisResults?.ftirAnalysis?.summary && (
                <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-200 text-[11px]">
                  <span className="font-bold text-indigo-900 block mb-0.5">4. FT-IR 적외선 분광분석:</span>
                  <p className="text-indigo-950">{rep.analysisResults.ftirAnalysis.summary}</p>
                  {rep.analysisResults.ftirAnalysis.matchedMaterial && (
                    <span className="inline-block mt-1 font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      매칭 물질: {rep.analysisResults.ftirAnalysis.matchedMaterial} ({rep.analysisResults.ftirAnalysis.similarity})
                    </span>
                  )}
                </div>
              )}

              {/* 이화학 */}
              {!rep.analysisResults?.physicochemicalAnalysis?.skipped && rep.analysisResults?.physicochemicalAnalysis?.summary && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-800 block mb-0.5">5. 이화학 분석:</span>
                  <p className="text-slate-600">{rep.analysisResults.physicochemicalAnalysis.summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. 당시 조사 결과 & 결론 (참고용 명시) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-slate-800 text-xs block">
                당시 동일 Lot 보관품 및 제조기록 결과
              </span>
              <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {rep.lotHistory?.retainedSampleCheck || recommendation.investigationResult}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-slate-800 text-xs block">
                당시 판정된 최종 결론 (참고용 기록)
              </span>
              <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {rep.rootCauseAndActions?.rootCause || recommendation.conclusion}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {onImportMethods && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onImportMethods(recommendation);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>이 사례의 조사방법 가져오기</span>
              </button>
            )}

            {onUseAsInvestigationPackage && (
              <button
                type="button"
                onClick={() => setIsConfirmStructureOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                title="과거 사례의 조사 항목, 시험방법, 공정 점검 기준 및 상용구 연결 구조를 현재 클레임의 조사 틀로 세팅합니다. (결과 및 결론은 복사되지 않음)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>[이 사례를 조사 패키지로 사용]</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ImportInvestigationStructureModal
        isOpen={isConfirmStructureOpen}
        onClose={() => setIsConfirmStructureOpen(false)}
        pastReport={rep}
        currentReport={currentReport}
        currentContext={currentContext}
        claimTitle={`${recommendation.productName} (${recommendation.claimSummary})`}
        claimDate={recommendation.dateFormatted}
        onConfirm={(pastRep) => {
          if (onUseAsInvestigationPackage) {
            onUseAsInvestigationPackage(pastRep);
          }
          setIsConfirmStructureOpen(false);
          onClose();
        }}
      />
    </div>
  );
}
