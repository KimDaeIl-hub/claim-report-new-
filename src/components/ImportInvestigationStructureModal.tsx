import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  Microscope,
  Cpu,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  Workflow,
  Sparkles,
  ShieldCheck,
  Check,
  FileSearch,
  ArrowRight,
  Info,
} from "lucide-react";
import { ReportData } from "../types";
import {
  getInvestigationStructureStats,
  InvestigationStructureStats,
  comparePastAndCurrentClaim,
  CaseComparisonResult,
} from "../utils/investigationStructureImporter";

interface ImportInvestigationStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastReport: ReportData | null;
  currentReport?: ReportData | null;
  currentContext?: {
    productName?: string;
    manufactureLine?: string;
    claimMidCategory?: string;
    claimMajorCategory?: string;
    relatedProcess?: string;
    manufacturer?: string;
  } | null;
  onConfirm: (pastReport: ReportData) => void;
  claimTitle?: string;
  claimDate?: string;
}

export function ImportInvestigationStructureModal({
  isOpen,
  onClose,
  pastReport,
  currentReport,
  currentContext,
  onConfirm,
  claimTitle,
  claimDate,
}: ImportInvestigationStructureModalProps) {
  const [showItemDetails, setShowItemDetails] = useState(false);

  if (!isOpen || !pastReport) return null;

  const stats: InvestigationStructureStats = getInvestigationStructureStats(pastReport);
  const comparison: CaseComparisonResult = comparePastAndCurrentClaim(
    pastReport,
    currentReport,
    currentContext
  );

  const targetName =
    claimTitle ||
    pastReport.productInfo.productName ||
    pastReport.title ||
    "과거 완료 클레임";

  const handleApply = () => {
    onConfirm(pastReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  과거 사례에서 가져오기
                </span>
                {claimDate && (
                  <span className="text-[10px] text-slate-300">
                    {claimDate}
                  </span>
                )}
                {comparison.hasCriticalDifferences && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    차이점 사전 확인 필요
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                과거 사례 조사 구조를 적용하시겠습니까?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target summary banner */}
        <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 shrink-0">
          <span className="font-semibold truncate">
            대상 사례: <strong>{targetName}</strong>
          </span>
          <span className="text-[11px] text-blue-700 shrink-0 font-medium ml-2">
            조사 구조/방법만 복사 (결과 미복사)
          </span>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {/* ======================================================== */}
          {/* [핵심 개선] 과거 사례 vs 현재 사례 대조 및 차이점 자동 표시 */}
          {/* ======================================================== */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FileSearch className="w-4 h-4 text-indigo-600" />
                <span>과거 사례 vs 현재 사례 대조</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                * 오적용 방지 사전 차이 분석
              </span>
            </div>

            {/* Side-by-side comparative cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* [과거 사례] */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>[과거 사례]</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {claimDate || "완료 이력"}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">제품:</span>
                    <strong className="text-slate-900 text-right">{comparison.pastCase.product}</strong>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">라인:</span>
                    <span className="font-semibold text-slate-800 text-right">{comparison.pastCase.line}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">클레임:</span>
                    <span className="font-semibold text-blue-900 text-right">{comparison.pastCase.claim}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">관련공정:</span>
                    <span className="font-semibold text-indigo-900 text-right">{comparison.pastCase.relatedProcess}</span>
                  </div>
                </div>
              </div>

              {/* [현재 사례] */}
              <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>[현재 사례]</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                    작성 중
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">제품:</span>
                    <strong className="text-slate-900 text-right">{comparison.currentCase.product}</strong>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">라인:</span>
                    <span
                      className={`font-semibold text-right ${
                        comparison.currentCase.line === "미지정" ? "text-amber-600" : "text-slate-800"
                      }`}
                    >
                      {comparison.currentCase.line}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">클레임:</span>
                    <span className="font-semibold text-blue-900 text-right">{comparison.currentCase.claim}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 shrink-0">관련공정:</span>
                    <span
                      className={`font-semibold text-right ${
                        comparison.currentCase.relatedProcess === "미확인"
                          ? "text-amber-600"
                          : "text-indigo-900"
                      }`}
                    >
                      {comparison.currentCase.relatedProcess}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator ↓ */}
            <div className="text-center text-slate-400 text-xs font-black select-none">
              ↓
            </div>

            {/* [차이점] 박스 */}
            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>[차이점]</span>
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">
                  * 확인이 필요한 사항 안내
                </span>
              </div>

              {/* 1. Differences list (Warnings & Unconfirmed) */}
              {comparison.differences.length > 0 ? (
                <div className="space-y-2">
                  {comparison.differences.map((diff, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs space-y-1 text-xs"
                    >
                      <div className="font-bold text-amber-950 flex items-start gap-1.5">
                        <span className="text-amber-600 text-sm leading-none mt-0.5">⚠</span>
                        <span>{diff.message}</span>
                      </div>
                      {diff.type === "warning" && (
                        <div className="text-[11px] text-slate-600 pl-4 space-y-0.5">
                          <div>
                            과거: <strong className="text-slate-900">{diff.pastValue}</strong>
                          </div>
                          <div>
                            현재: <strong className="text-amber-900">{diff.currentValue}</strong>
                          </div>
                        </div>
                      )}
                      {diff.type === "unconfirmed" && (
                        <div className="text-[10.5px] text-amber-800 pl-4">
                          * 과거 기준: <strong>{diff.pastValue}</strong> (현재 클레임 현장/일지 확인 필요)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-[11px] text-emerald-800 bg-white/80 rounded border border-emerald-200 font-medium">
                  과거 사례와 주요 구조적 정보(제품, 라인, 클레임 유형, 관련공정)가 일치합니다.
                </div>
              )}

              {/* 2. Identical items (✓ 제품 동일, ✓ 클레임 유형 동일 등) */}
              {comparison.identicalItems.length > 0 && (
                <div className="pt-2 border-t border-amber-200/70 space-y-1 text-xs text-emerald-800 font-bold">
                  {comparison.identicalItems.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-1.5">
                      <span className="text-emerald-600">✓</span>
                      <span>{item.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Objective Guardrail Notice */}
              <div className="pt-1 text-[10px] text-slate-500 leading-relaxed border-t border-amber-200/60">
                <strong>[중요 가이드]:</strong> 본 기능의 목적은 과거 사례를 그대로 복사하여 잘못된 정보를 사용하는 것을 방지하는 것입니다. 시스템은 차이점을 바탕으로 원인을 단정하거나 판단하지 않으며, 단순 정보 차이와 확인이 필요한 사항만 표시합니다.
              </div>
            </div>
          </div>

          {/* Section 1: 적용되는 항목 (Checkmarks) */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>적용되는 항목:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowItemDetails(!showItemDetails)}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>{showItemDetails ? "세부 접기" : "세부 보기"}</span>
                {showItemDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <ul className="space-y-1.5 text-xs text-emerald-900 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>
                  <strong>조사 항목 {stats.investigationItemsCount}개</strong> (활성화 항목 및 점검 틀 구성)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>
                  <strong>조사방법 {stats.investigationMethodsCount}개</strong> (시험 원리, 표준 측정법, 기준 규격)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>
                  <strong>관련 공정 {stats.relatedProcessesCount}개</strong> (공정 흐름도, 여과망 및 세척 기준)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</span>
                <span>
                  <strong>상용구 {stats.connectedPhrasesCount}개</strong> (클레임 유형 및 공정 맞춤 상용구 연결)
                </span>
              </li>
            </ul>

            {/* Expandable details */}
            {showItemDetails && (
              <div className="pt-2 mt-2 border-t border-emerald-200/80 text-[11px] text-emerald-800 space-y-2 bg-emerald-100/40 p-2.5 rounded-lg">
                <div>
                  <strong className="block text-[10px] text-emerald-900">포함된 조사 항목:</strong>
                  <span>{stats.investigationItemsList.join(" · ")}</span>
                </div>
                <div>
                  <strong className="block text-[10px] text-emerald-900">포함된 시험 방법 및 원리:</strong>
                  <span>{stats.investigationMethodsList.join(" · ")}</span>
                </div>
                <div>
                  <strong className="block text-[10px] text-emerald-900">관련 제조공정:</strong>
                  <span>{stats.relatedProcessesList.join(" → ")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: 적용되지 않는 항목 (X Marks) */}
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
            <span className="font-bold text-rose-950 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>적용되지 않는 항목:</span>
            </span>

            <ul className="space-y-1 text-xs text-rose-900 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold text-[10px]">×</span>
                <span>과거 조사결과 (수치, 성상 측정값 공란 처리)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold text-[10px]">×</span>
                <span>과거 결론 (원인 판정, 고객 회신문 미복사)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold text-[10px]">×</span>
                <span>과거 사진 및 첨부파일 (현재 보고서 첨부자료 유지)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold text-[10px]">×</span>
                <span>과거 소비자 개인정보 및 과거 제조번호/유통기한</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>적용</span>
          </button>
        </div>
      </div>
    </div>
  );
}
