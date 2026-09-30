import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react";
import { ReportData } from "../types";
import {
  validateReport,
  ValidationSummary,
  ValidationIssue,
  ValidationSeverity,
} from "../utils/reportValidator";
import { requestAiLogicAdvisory, AiLogicSuggestion } from "../services/aiService";

interface ReportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary?: ValidationSummary;
  report: ReportData;
  onNavigateToField: (
    tabId: "claim" | "product" | "analysis" | "process" | "lot" | "cause" | "conclusion" | "attachments" | string,
    fieldId?: string
  ) => void;
}

type FilterTab = "all" | "error" | "warning" | "info";

export function ReportValidationModal({
  isOpen,
  onClose,
  summary: propSummary,
  report,
  onNavigateToField,
}: ReportValidationModalProps) {
  if (!isOpen) return null;

  const summary = propSummary || validateReport(report);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [aiSuggestions, setAiSuggestions] = useState<AiLogicSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRequestAiLogic = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      // Build lightweight report summary for advisory review
      const reportBrief = {
        title: report.title,
        docNumber: report.docNumber,
        productName: report.productInfo?.productName,
        lotNumber: report.productInfo?.lotNumber,
        claimDetails: report.customerClaim?.claimDetails,
        visualInspection: {
          status: report.analysisResults?.visualInspection?.status,
          sampleCondition: report.analysisResults?.visualInspection?.sampleCondition,
          foreignObject: report.analysisResults?.visualInspection?.foreignObjectAppearance,
        },
        ftirAnalysis: {
          status: report.analysisResults?.ftirAnalysis?.status,
          summary: report.analysisResults?.ftirAnalysis?.summary,
        },
        manufacturingProcess: {
          status: report.manufacturingProcess?.status,
          filtration: report.manufacturingProcess?.filtrationAnalysis,
          cleaning: report.manufacturingProcess?.cleaningAnalysis,
        },
        lotHistory: {
          productionLog: report.lotHistory?.productionLogNote,
          retainedSample: report.lotHistory?.retainedSampleCheck,
        },
        rootCause: {
          status: report.rootCauseAndActions?.status,
          cause: report.rootCauseAndActions?.rootCause,
          preventiveMeasures: report.rootCauseAndActions?.preventiveMeasures,
        },
      };

      const res = await requestAiLogicAdvisory(reportBrief);
      if (res.success && res.suggestions) {
        setAiSuggestions(res.suggestions);
      } else {
        setAiError(res.error || "AI 검토 제안을 불러오지 못했습니다.");
      }
    } catch (e: any) {
      setAiError("AI 검토 제안 요청 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const filteredIssues = summary.issues.filter((issue) => {
    if (activeFilter === "all") return true;
    return issue.severity === activeFilter;
  });

  const getSeverityBadge = (sev: ValidationSeverity) => {
    switch (sev) {
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
            <span>오류 (반드시 수정)</span>
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>경고 (확인 필요)</span>
          </span>
        );
      case "info":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600 shrink-0" />
            <span>참고 (권장)</span>
          </span>
        );
    }
  };

  return (
    <div
      id="report-validation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg border ${
                summary.errorCount > 0
                  ? "bg-red-500/20 text-red-300 border-red-500/30"
                  : summary.warningCount > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {summary.errorCount > 0 ? (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">보고서 누락 및 논리 정합성 사전 검증</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  Pre-Submission Audit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                발송 전 필수 정보 누락, 모순 기재, Lot 불일치, 첨부사진 누락을 자동으로 검사합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div className="shrink-0 p-4 border-b border-slate-200 bg-slate-50">
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              summary.errorCount > 0
                ? "bg-red-50/70 border-red-300 text-red-950"
                : summary.warningCount > 0
                ? "bg-amber-50/70 border-amber-300 text-amber-950"
                : "bg-emerald-50/70 border-emerald-300 text-emerald-950"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              {summary.errorCount > 0 ? (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
              ) : summary.warningCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div>
                <h4 className="text-xs font-bold">
                  {summary.errorCount > 0
                    ? `발송 불가: 반드시 수정해야 할 오류가 ${summary.errorCount}건 있습니다.`
                    : summary.warningCount > 0
                    ? `확인 권장: 확인이 필요한 경고가 ${summary.warningCount}건 있습니다.`
                    : "모든 필수 항목 및 논리 정합성 검증을 통과하였습니다."}
                </h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  각 항목을 클릭하면 작성 폼의 해당 위치로 즉시 이동하여 수정할 수 있습니다.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                오류 {summary.errorCount}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                경고 {summary.warningCount}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                참고 {summary.infoCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tab Bar */}
        <div className="shrink-0 px-4 pt-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                activeFilter === "all"
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              전체 ({summary.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("error")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                activeFilter === "error"
                  ? "border-red-600 text-red-600 bg-red-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              오류 ({summary.errorCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("warning")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                activeFilter === "warning"
                  ? "border-amber-600 text-amber-600 bg-amber-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              경고 ({summary.warningCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("info")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                activeFilter === "info"
                  ? "border-blue-500 text-blue-700 bg-blue-50/40"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              참고 ({summary.infoCount})
            </button>
          </div>

          {/* AI Advisory Trigger Button */}
          <button
            type="button"
            id="btn-request-ai-advisory"
            onClick={handleRequestAiLogic}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shrink-0 disabled:opacity-60 mb-1"
            title="인과관계 개연성 및 소비자 전달 관점의 AI 조언 제안을 요청합니다"
          >
            {isLoadingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>AI 논리 검토 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI 논리 검토 제안 (선택)</span>
              </>
            )}
          </button>
        </div>

        {/* Issue Cards Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/50 space-y-3">
          {/* AI Advisory Box (if loaded) */}
          {aiSuggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 border border-indigo-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-indigo-600 text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">
                      AI 품질경영 논리 검토 제안 (Advisory Suggestion)
                    </h4>
                    <p className="text-[11px] text-indigo-800">
                      * AI 판단은 결론을 강제하지 않는 '참고용 제안'입니다. 실무 맥락에 맞추어 검토하십시오.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold border border-indigo-300">
                  검토 제안
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {sug.targetSection}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900">{sug.title}</h5>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{sug.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToField(sug.targetTab, `tab-${sug.targetTab}`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors shrink-0 self-end sm:self-auto"
                    >
                      <span>해당 탭 이동</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
              <span>{aiError}</span>
              <button
                type="button"
                onClick={() => setAiError(null)}
                className="text-red-500 hover:text-red-700 text-xs font-semibold"
              >
                닫기
              </button>
            </div>
          )}

          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                {activeFilter === "all"
                  ? "검출된 문제가 없습니다!"
                  : `${activeFilter === "error" ? "오류" : activeFilter === "warning" ? "경고" : "참고"} 항목이 없습니다.`}
              </h4>
              <p className="text-xs text-slate-500">
                보고서가 규격에 맞게 작성되었으며, 공문서 인쇄 및 발송이 가능한 상태입니다.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                id={`issue-card-${issue.id}`}
                className={`p-3.5 sm:p-4 rounded-xl border bg-white shadow-2xs transition-all hover:shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  issue.severity === "error"
                    ? "border-red-200 hover:border-red-300"
                    : issue.severity === "warning"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-blue-200 hover:border-blue-300"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  {/* Top metadata row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(issue.severity)}
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {issue.sectionName}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      항목: <strong className="text-slate-800">{issue.fieldLabel}</strong>
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {issue.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {issue.description}
                  </p>

                  {/* Problematic snippet if exists */}
                  {issue.snippet && (
                    <div className="mt-1 p-2 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800 whitespace-pre-wrap">
                      <span className="text-slate-400 font-sans mr-1">[발견 텍스트]:</span>
                      {issue.snippet}
                    </div>
                  )}
                </div>

                {/* Action: Click to navigate */}
                <div className="shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    id={`btn-navigate-${issue.id}`}
                    onClick={() => {
                      onClose();
                      onNavigateToField(issue.tabId, issue.fieldId);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-2xs ${
                      issue.severity === "error"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : issue.severity === "warning"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <span>해당 입력칸으로 이동</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            * 코드로 검증 가능한 항목은 100% 자동 검출되며, 인과관계는 AI 조언을 활용할 수 있습니다.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
