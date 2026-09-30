import React from "react";
import { AlertTriangle, Edit3, HelpCircle } from "lucide-react";
import {
  InvestigationItemKey,
  getExtraInputSpec,
  toOptionCode,
} from "../data/investigationTemplates";

interface InvestigationDetailInputsCardProps {
  itemKey: InvestigationItemKey;
  optionCodeOrLabel: string | undefined | null;
  values?: Record<string, string | undefined>;
  onChange: (fieldKey: string, value: string) => void;
  className?: string;
}

export function InvestigationDetailInputsCard({
  itemKey,
  optionCodeOrLabel,
  values = {},
  onChange,
  className = "",
}: InvestigationDetailInputsCardProps) {
  if (!optionCodeOrLabel) return null;

  const spec = getExtraInputSpec(itemKey, optionCodeOrLabel);
  // 추가 설명이 필요한 선택지가 아니면 아무것도 렌더링하지 않음 (기본 원칙 준수)
  if (!spec) return null;

  const isThreeCols = spec.fields.length === 3;

  return (
    <div
      className={`my-2.5 rounded-xl border border-amber-250 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-amber-50/60 p-3 shadow-2xs transition-all ${className}`}
    >
      {/* 헤더: 추가 입력 섹션 안내 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2.5 border-b border-amber-200/80">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Edit3 className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-amber-950">
            추가 세부 정보 입력 ({spec.optionLabel})
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
            필수 입력
          </span>
        </div>
        <span className="text-[10.5px] text-amber-700 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-amber-600" />
          <span>입력 즉시 하단 자동 문장에 포함됩니다</span>
        </span>
      </div>

      {/* ⚠️ 원인 확정 주의 경고 (공정상 원인 확인 등 사실 확정 시 필수 표시) */}
      {spec.warningNotice && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 shadow-2xs animate-pulse duration-1000">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold text-rose-700 mr-1.5">[주의 사항]</span>
            <span className="font-medium text-rose-900">{spec.warningNotice}</span>
          </div>
        </div>
      )}

      {/* 입력 필드 그리드 */}
      <div className={isThreeCols ? "grid grid-cols-1 sm:grid-cols-3 gap-2.5" : "space-y-2.5"}>
        {spec.fields.map((field) => {
          const val = values[field.fieldKey] || "";
          return (
            <div key={field.fieldKey} className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{field.label}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                {field.exampleText && !val && (
                  <button
                    type="button"
                    onClick={() => onChange(field.fieldKey, field.exampleText!)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline decoration-blue-300 cursor-pointer"
                    title={`예시 내용 '${field.exampleText}' 자동 입력`}
                  >
                    예시 적용
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs font-medium"
                />
              </div>

              {field.helperText && (
                <p className="text-[10px] text-slate-500 mt-0.5">{field.helperText}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
