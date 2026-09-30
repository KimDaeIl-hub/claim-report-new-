import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, MinusCircle, Clock } from "lucide-react";
import { InvestigationStatus, INVESTIGATION_STATUS_LIST } from "../types";
import { getInvestigationStatusBadgeStyle } from "../utils/investigationStatus";

interface InvestigationStatusSelectorProps {
  status?: InvestigationStatus;
  onChange: (status: InvestigationStatus) => void;
  hasContent?: boolean;
  label?: string;
  itemLabel?: string;
  size?: "sm" | "md";
}

export function InvestigationStatusSelector({
  status = "확인 완료",
  onChange,
  hasContent = true,
  label,
  itemLabel,
  size = "md",
}: InvestigationStatusSelectorProps) {
  const displayLabel = itemLabel || label || "조사 상태";
  const isUnexamined = status === "미실시" || status === "확인 불가";
  const isNeedsMore = status === "추가 조사 필요";
  const isAbnormal = status === "이상 확인";
  const isBlank = !hasContent;
  const isWarning = isUnexamined || isBlank || isNeedsMore;

  const style = getInvestigationStatusBadgeStyle(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Label and Warning Notice */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-600">{displayLabel}:</span>

        {/* [주의] 배지: 미입력 또는 미실시인 경우 명확하게 노출 */}
        {isWarning && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-bold animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
            <span>[주의{isBlank ? ": 미입력" : `: ${status}`}]</span>
          </span>
        )}

        {isAbnormal && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 text-[10.5px] font-bold">
            <XCircle className="w-3 h-3 text-red-700 shrink-0" />
            <span>[이상 소견]</span>
          </span>
        )}
      </div>

      {/* Dropdown Selector */}
      <div className="relative inline-flex items-center">
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as InvestigationStatus)}
          className={`appearance-none font-medium border rounded-md px-2.5 py-1 pr-7 text-xs cursor-pointer transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
            style.bg
          } ${style.border} ${
            isWarning ? "border-amber-400 ring-1 ring-amber-300/60" : "border-slate-300"
          }`}
        >
          {INVESTIGATION_STATUS_LIST.map((opt) => (
            <option key={opt} value={opt} className="bg-white text-slate-900">
              {opt === "미실시"
                ? "⚠️ 미실시 (조사 미진행)"
                : opt === "확인 불가"
                ? "❓ 확인 불가 (시료/상태 한계)"
                : opt === "추가 조사 필요"
                ? "⏳ 추가 조사 필요"
                : opt === "이상 없음"
                ? "✅ 이상 없음 (정상 확인)"
                : opt === "이상 확인"
                ? "🚨 이상 확인 (특이사항 관찰)"
                : opt === "해당 없음"
                ? "➖ 해당 없음"
                : "🔹 확인 완료"}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 flex items-center text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * 인쇄용/보고서용 고정 상태 배지
 */
export function StatusDisplayBadge({
  status,
  isUnexaminedWarning = false,
}: {
  status?: InvestigationStatus;
  isUnexaminedWarning?: boolean;
}) {
  const currentStatus = status || "확인 완료";
  const style = getInvestigationStatusBadgeStyle(currentStatus);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${style.bg} ${style.border}`}
    >
      {currentStatus === "이상 없음" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
      {currentStatus === "이상 확인" && <XCircle className="w-3 h-3 text-red-600" />}
      {(currentStatus === "미실시" || isUnexaminedWarning) && (
        <AlertTriangle className="w-3 h-3 text-amber-600" />
      )}
      {currentStatus === "확인 불가" && <HelpCircle className="w-3 h-3 text-orange-600" />}
      {currentStatus === "추가 조사 필요" && <Clock className="w-3 h-3 text-purple-600" />}
      {currentStatus === "해당 없음" && <MinusCircle className="w-3 h-3 text-slate-500" />}
      <span>
        {isUnexaminedWarning && currentStatus !== "미실시" ? `[주의: ${currentStatus}]` : `[${currentStatus}]`}
      </span>
    </span>
  );
}
