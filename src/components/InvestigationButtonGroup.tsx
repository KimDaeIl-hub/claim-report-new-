import React from "react";
import { Check, AlertCircle, RotateCcw } from "lucide-react";

export type InvestigationButtonGroupOption =
  | string
  | { label: string; value: string };

export interface InvestigationButtonGroupProps {
  label: string;
  itemNumber?: number;
  description?: string;
  options: readonly InvestigationButtonGroupOption[] | InvestigationButtonGroupOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  allowDeselect?: boolean;
  className?: string;
  badgeLabel?: string;
}

function getOptionInfo(opt: InvestigationButtonGroupOption): { label: string; value: string } {
  if (typeof opt === "string") {
    return { label: opt, value: opt };
  }
  return opt;
}

// 옵션의 성격(정상/이상/중립)에 따라 시각적 톤을 구분하여 직관성 극대화
function getOptionTone(label: string, value: string): "positive" | "negative" | "neutral" {
  if (
    label === "특이사항 없음" ||
    label === "이상 없음" ||
    label === "적합" ||
    value === "no_issue" ||
    value === "normal" ||
    value === "pass"
  ) {
    return "positive";
  }
  if (
    label.includes("이상") ||
    label === "공정조건 이탈" ||
    label === "부적합" ||
    label === "공정상 원인 확인" ||
    value.includes("defect") ||
    value.includes("error") ||
    value === "fail" ||
    value === "process_deviation" ||
    value === "process_anomaly"
  ) {
    return "negative";
  }
  return "neutral";
}

export function InvestigationButtonGroup({
  label,
  itemNumber,
  description,
  options,
  value,
  onChange,
  multiple = false,
  allowDeselect = true,
  className = "",
  badgeLabel,
}: InvestigationButtonGroupProps) {
  const isSelected = (opt: InvestigationButtonGroupOption): boolean => {
    const info = getOptionInfo(opt);
    if (multiple) {
      if (!Array.isArray(value)) return false;
      return value.includes(info.value) || value.includes(info.label);
    }
    return value === info.value || value === info.label;
  };

  const handleToggle = (opt: InvestigationButtonGroupOption) => {
    const info = getOptionInfo(opt);
    if (multiple) {
      const currentList = Array.isArray(value)
        ? [...value]
        : value
        ? [value]
        : [];
      if (currentList.includes(info.value) || currentList.includes(info.label)) {
        onChange(currentList.filter((item) => item !== info.value && item !== info.label));
      } else {
        onChange([...currentList, info.value]);
      }
    } else {
      // 단일 선택 모드
      if (allowDeselect && (value === info.value || value === info.label)) {
        onChange("");
      } else {
        onChange(info.value);
      }
    }
  };

  const handleClear = () => {
    onChange(multiple ? [] : "");
  };

  // 선택 현황 한글 표기 텍스트 산출
  const getDisplayLabelForValue = (v: string): string => {
    for (const opt of options) {
      const info = getOptionInfo(opt);
      if (info.value === v || info.label === v) {
        return info.label;
      }
    }
    return v;
  };

  const selectedCount = Array.isArray(value)
    ? value.length
    : value
    ? 1
    : 0;

  const selectedDisplay = Array.isArray(value)
    ? value.map(getDisplayLabelForValue).join(", ")
    : value
    ? getDisplayLabelForValue(value)
    : "";

  return (
    <div
      className={`rounded-xl border border-slate-250 bg-slate-50/70 p-3 transition-all ${className}`}
    >
      {/* 헤더: 항목 번호, 제목, 선택 모드 및 현재 선택 상태 표시 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2 min-w-0">
          {itemNumber !== undefined && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
              {itemNumber}
            </span>
          )}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{label}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                {multiple ? "복수 선택 가능" : "단일 선택"}
              </span>
              {badgeLabel && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  {badgeLabel}
                </span>
              )}
            </div>
            {description && (
              <p className="text-[10.5px] text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* 현재 선택 상태 배지 & 초기화 버튼 */}
        <div className="flex items-center gap-1.5">
          {selectedCount > 0 ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                <Check className="w-3 h-3 text-blue-700 stroke-[3]" />
                <span className="truncate max-w-[160px] sm:max-w-[240px]">
                  선택: {selectedDisplay}
                </span>
              </span>
              <button
                type="button"
                onClick={handleClear}
                title="선택 취소"
                className="text-[10.5px] text-slate-400 hover:text-slate-700 px-1.5 py-1 rounded hover:bg-slate-200/70 transition-colors inline-flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>취소</span>
              </button>
            </>
          ) : (
            <span className="text-[10.5px] text-slate-400 font-medium italic">
              (버튼 클릭으로 선택)
            </span>
          )}
        </div>
      </div>

      {/* 버튼 선택 그리드 */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((opt) => {
          const info = getOptionInfo(opt);
          const selected = isSelected(opt);
          const tone = getOptionTone(info.label, info.value);

          // 선택 상태에 따른 시각적 스타일: 높은 대비와 명확한 테두리/그림자
          let activeClasses = "";
          let icon = null;

          if (selected) {
            if (tone === "positive") {
              activeClasses =
                "bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm ring-2 ring-emerald-300/60 scale-[1.02]";
              icon = <Check className="w-3.5 h-3.5 mr-1 stroke-[3] inline shrink-0" />;
            } else if (tone === "negative") {
              activeClasses =
                "bg-rose-600 text-white font-bold border-rose-600 shadow-sm ring-2 ring-rose-300/60 scale-[1.02]";
              icon = <AlertCircle className="w-3.5 h-3.5 mr-1 stroke-[3] inline shrink-0" />;
            } else {
              activeClasses =
                "bg-blue-600 text-white font-bold border-blue-600 shadow-sm ring-2 ring-blue-300/60 scale-[1.02]";
              icon = <Check className="w-3.5 h-3.5 mr-1 stroke-[3] inline shrink-0" />;
            }
          } else {
            activeClasses =
              "bg-white text-slate-700 font-medium border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 shadow-2xs";
          }

          return (
            <button
              key={info.value}
              type="button"
              onClick={() => handleToggle(opt)}
              aria-pressed={selected}
              data-value={info.value}
              className={`inline-flex items-center justify-center px-2.5 py-1.5 text-xs rounded-lg border transition-all duration-150 cursor-pointer active:scale-95 ${activeClasses}`}
            >
              {icon}
              {!selected && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5 shrink-0" />
              )}
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
