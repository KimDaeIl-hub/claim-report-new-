import React, { useState } from "react";
import {
  X,
  Workflow,
  Check,
  AlertTriangle,
  ShieldCheck,
  Microscope,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { SimilarClaimRecommendation } from "../utils/similarClaimRecommender";
import { ReportData } from "../types";

export interface MethodImportOptions {
  enableAnalysisMethods: boolean;    // 과학 시험 분석 항목 활성화 (FT-IR, 현미경 등)
  applyTestPrinciples: boolean;      // 시험 분석 원리 표준 문구 세팅
  applyProcessCheckpoints: boolean;  // 공정 중점 점검 포인트 및 여과망/세척 관리 기준 적용
  applyInspectionStructure: boolean; // 5대 조사 항목 구조(보관품, 제조기록, 품질검사) 활성화
}

interface ImportInvestigationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: SimilarClaimRecommendation | null;
  onConfirmImport: (options: MethodImportOptions, recommendation: SimilarClaimRecommendation) => void;
}

export function ImportInvestigationMethodModal({
  isOpen,
  onClose,
  recommendation,
  onConfirmImport,
}: ImportInvestigationMethodModalProps) {
  const [options, setOptions] = useState<MethodImportOptions>({
    enableAnalysisMethods: true,
    applyTestPrinciples: true,
    applyProcessCheckpoints: true,
    applyInspectionStructure: true,
  });

  if (!isOpen || !recommendation) return null;

  const past = recommendation.pastClaim;
  const rep = past.report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-300 bg-blue-950/60 border border-blue-400/30 px-2 py-0.5 rounded-full inline-block">
                과거 사례에서 가져오기
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                과거 유사 사례의 조사방법 및 항목 구성 적용
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Past Claim Summary Box */}
        <div className="p-4 bg-blue-50/70 border-b border-blue-200 text-xs text-blue-950 space-y-1">
          <div className="flex items-center justify-between">
            <strong className="text-blue-900">선택된 과거 유사 사례:</strong>
            <span className="font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
              유사도 {recommendation.similarityScore}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
            <div>• 제품: <strong>{recommendation.productName}</strong></div>
            <div>• 클레임: <strong>{recommendation.claimSummary}</strong></div>
            <div>• 제조라인: <strong>{recommendation.manufactureLine}</strong></div>
            <div>• 관련공정: <strong>{recommendation.relatedProcess}</strong></div>
          </div>
        </div>

        {/* Safe Principle Notice Banner */}
        <div className="px-4 py-3 bg-emerald-50/80 border-b border-emerald-200 text-emerald-950 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>조사 독립성 및 안전 보장 원칙 준수</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-emerald-800">
            <li>과거 사례의 발생 원인 및 최종 결론은 현재 클레임에 <strong>절대 복사되지 않습니다.</strong></li>
            <li>조사자가 필요로 하는 <strong>분석 방법, 시험 항목, 공정 관리 기준</strong>만 안전하게 세팅됩니다.</li>
            <li>실제 조사 결과 입력값(보관품 검체 판정 등)은 <strong>공란 또는 조사자의 독립적 입력</strong>으로 유지됩니다.</li>
          </ul>
        </div>

        {/* Selective Checkboxes */}
        <div className="p-4 sm:p-5 space-y-3 text-xs">
          <span className="font-bold text-slate-800 block text-xs">
            가져올 조사방법 항목을 선택하세요:
          </span>

          <div className="space-y-2.5">
            {/* 1. 과학 분석 항목 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.enableAnalysisMethods}
                onChange={(e) =>
                  setOptions({ ...options, enableAnalysisMethods: e.target.checked })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 flex-1">
                <span className="font-bold text-slate-900 block text-xs">
                  1. 당시 수행된 과학 시험·분석 항목 활성화
                </span>
                <p className="text-[11px] text-slate-500">
                  {recommendation.analysisMethodsUsed.join(", ") || "현품 육안 확인, 광학 현미경, FT-IR 적외선 분광"} 등의 시험 항목을 보고서에 자동으로 켜고 활성화합니다.
                </p>
              </div>
            </label>

            {/* 2. 시험 원리 설명 문구 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.applyTestPrinciples}
                onChange={(e) =>
                  setOptions({ ...options, applyTestPrinciples: e.target.checked })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 flex-1">
                <span className="font-bold text-slate-900 block text-xs">
                  2. 시험법 분석 원리 표준 문구 적용
                </span>
                <p className="text-[11px] text-slate-500">
                  식품품질 표준에 등록된 정밀 분석 원리(FT-IR 고분자 스펙트럼 분석 원리, 현미경 감식 원리 등) 설명 문구를 기입합니다.
                </p>
              </div>
            </label>

            {/* 3. 공정 중점 관리 기준 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.applyProcessCheckpoints}
                onChange={(e) =>
                  setOptions({ ...options, applyProcessCheckpoints: e.target.checked })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 flex-1">
                <span className="font-bold text-slate-900 block text-xs">
                  3. 관련 공정 관리점 및 여과망/세척 기준 적용
                </span>
                <p className="text-[11px] text-slate-500">
                  해당 라인의 여과 필터(150 Mesh 등) 규격 설명 및 세척 공정, 충전 밸브 관리 기준을 제조공정 설명란에 적용합니다.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            취소
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmImport(options, recommendation);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>선택한 조사방법 가져오기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
