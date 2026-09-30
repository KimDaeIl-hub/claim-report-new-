import React, { useState } from "react";
import { Sparkles, RotateCcw, Copy, Check, FileText, AlertCircle } from "lucide-react";

interface GeneratedSentenceCardProps {
  sentence: string;
  currentValue?: string;
  onResetToDefault: (sentence: string) => void;
  className?: string;
  isExtraInputRequired?: boolean;
  isMissingInput?: boolean;
  missingFields?: string[];
}

export function GeneratedSentenceCard({
  sentence,
  currentValue,
  onResetToDefault,
  className = "",
  isExtraInputRequired = false,
  isMissingInput = false,
  missingFields = [],
}: GeneratedSentenceCardProps) {
  const [copied, setCopied] = useState(false);

  // 추가 입력이 필요한 선택지인데 필수 입력값이 비어있는 경우:
  // "추가 입력이 필요한 선택지를 선택했는데 입력값이 비어 있으면 자동 문장을 생성하지 말고 '추가 내용을 입력해주세요.' 라고 표시한다."
  if (isExtraInputRequired && isMissingInput) {
    return (
      <div
        className={`my-2.5 rounded-xl border border-amber-300 bg-amber-50/80 p-3 shadow-2xs transition-all ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-amber-200">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span>자동 생성 문장</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                추가 내용 입력 대기
              </span>
            </h3>
          </div>
        </div>

        <div className="bg-white/95 p-3 rounded-lg border border-amber-200 shadow-2xs flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-bold">추가 내용을 입력해주세요.</span>
        </div>

        <p className="text-[10.5px] text-amber-700 mt-1.5 pl-1">
          {missingFields.length > 0
            ? `위 추가 입력창에 '${missingFields.join(", ")}'을(를) 입력하시면 조사문장이 자동으로 조립됩니다.`
            : "위 추가 입력창에 내용을 입력하시면 조사문장이 자동으로 조립됩니다."}
        </p>
      </div>
    );
  }

  // 아무 버튼도 선택되지 않은 초기 상태
  if (!sentence) {
    return (
      <div
        className={`my-2 p-3 rounded-xl border border-dashed border-slate-250 bg-slate-50/60 text-slate-400 text-xs flex items-center gap-2 ${className}`}
      >
        <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
        <span>위 버튼을 선택하면 표준 조사 문장이 자동으로 조립되어 표시됩니다.</span>
      </div>
    );
  }

  const isModified = currentValue !== undefined && currentValue.trim() !== sentence.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`my-2.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-slate-50/80 to-blue-50/60 p-3 shadow-2xs transition-all ${className}`}
    >
      {/* 헤더: 자동 생성 문장 제목 + 기본 문장으로 되돌리기 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-blue-200/70">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-3 h-3" />
          </div>
          <h3 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
            <span>자동 생성 문장</span>
            {isModified && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-250">
                수정됨
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md transition-colors shadow-2xs cursor-pointer"
            title="문장 클립보드 복사"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700 font-bold">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>복사</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onResetToDefault(sentence)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/80 border border-blue-300 px-2.5 py-0.5 rounded-md transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="하단 입력창의 내용을 이 기본 문장으로 되돌립니다"
          >
            <RotateCcw className="w-3 h-3 text-blue-600" />
            <span>기본 문장으로 되돌리기</span>
          </button>
        </div>
      </div>

      {/* 생성된 문장 본문 */}
      <div className="bg-white/90 p-2.5 rounded-lg border border-blue-150 shadow-2xs">
        <p className="text-xs font-semibold text-slate-800 leading-relaxed break-keep">
          "{sentence}"
        </p>
      </div>

      <p className="text-[10.5px] text-slate-400 mt-1.5 flex items-center gap-1">
        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
        <span>하단 입력창에서 내용을 자유롭게 수정하거나 추가 내용을 기입할 수 있습니다.</span>
      </p>
    </div>
  );
}
