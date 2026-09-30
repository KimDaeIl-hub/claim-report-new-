import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Check,
  Edit3,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import { PolishResult } from "../services/aiService";
import { checkFactIntegrity } from "../utils/aiFactChecker";

interface AiComparisonReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  polishResult: PolishResult | null;
  fieldName: string;
  status?: string;
  onApply: (finalText: string) => void;
}

export function AiComparisonReviewModal({
  isOpen,
  onClose,
  originalText,
  polishResult,
  fieldName,
  status,
  onApply,
}: AiComparisonReviewModalProps) {
  if (!isOpen || !polishResult) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(polishResult.polishedText);

  useEffect(() => {
    if (polishResult) {
      setEditedText(polishResult.polishedText);
      setIsEditing(false);
    }
  }, [polishResult]);

  // Re-run fact check if user directly edited
  const currentFactCheck = isEditing
    ? checkFactIntegrity(originalText, editedText)
    : polishResult.factCheck;

  const handleApply = () => {
    onApply(isEditing ? editedText : polishResult.polishedText);
    onClose();
  };

  const handleRestore = () => {
    // Keep original text unchanged
    onClose();
  };

  return (
    <div
      id="ai-comparison-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRestore();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">AI 문장 정돈 및 사실 관계 검증</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  {polishResult.source}
                </span>
                {status && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 font-semibold border border-indigo-700/50">
                    상태: {status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                조사 항목: <span className="text-indigo-200 font-medium">{fieldName}</span> · AI 결과를 원문과 비교 검토 후 적용하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestore}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
            title="닫기 (원문 유지)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fact Integrity Warning / Success Banner */}
        <div className="shrink-0 p-4 border-b border-slate-200 bg-slate-50">
          {currentFactCheck.hasWarnings ? (
            <div
              id="fact-check-warning-banner"
              className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-2 shadow-2xs"
            >
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-xs font-black">
                      [경고]
                    </span>
                    <h4 className="text-xs font-bold text-amber-950">
                      원문 사실 관계(수치·불확실성·단위) 변경 감지
                    </h4>
                  </div>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    AI가 다듬는 과정에서 원문의 수치나 "추정/불확실성" 표현이 확정적 사실로 왜곡되었을 가능성이 있습니다.
                    반드시 확인 후 <strong>[직접 수정]</strong>하여 바로잡거나 <strong>[복원]</strong>을 권장합니다.
                  </p>
                </div>
              </div>

              {/* Warning list details */}
              <div className="space-y-1 pt-1 border-t border-amber-200/80">
                {currentFactCheck.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-amber-900 bg-white/80 p-2 rounded-lg border border-amber-300/60"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-amber-950">
                        {w.type === "number" && "수치 변경/누락: "}
                        {w.type === "uncertainty" && "불확실성 왜곡(추정→확인): "}
                        {w.type === "unit" && "단위 누락: "}
                        {w.type === "assertion" && "근거 없는 단정 추가: "}
                      </span>
                      <span>{w.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              id="fact-check-success-banner"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  사실 관계 보존 검증 완료
                </span>
                <span className="text-xs text-emerald-800">
                  (원문의 수치·단위·추정/불확실성 표현이 왜곡 없이 보존되었습니다)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                Zero Distortion 통과
              </span>
            </div>
          )}
        </div>

        {/* Side-by-side comparison body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original raw note */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-xs font-bold text-slate-700">작성자 원문 (Original)</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  글자수: {originalText.length}자
                </span>
              </div>
              <div className="p-3.5 flex-1 min-h-[160px] text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-text bg-white m-2 rounded-lg border border-slate-200">
                {originalText}
              </div>
              <div className="px-3 py-1.5 bg-slate-50 text-[11px] text-slate-500 border-t border-slate-200 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>원문의 사실과 수치는 변형되지 않고 보존됩니다.</span>
              </div>
            </div>

            {/* Right: AI polished output / Direct edit */}
            <div
              className={`flex flex-col rounded-xl border overflow-hidden transition-colors ${
                isEditing
                  ? "border-blue-300 bg-blue-50/30"
                  : currentFactCheck.hasWarnings
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-indigo-200 bg-indigo-50/20"
              }`}
            >
              <div
                className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                  isEditing
                    ? "bg-blue-100/70 border-blue-200"
                    : currentFactCheck.hasWarnings
                    ? "bg-amber-100/70 border-amber-200"
                    : "bg-indigo-100/70 border-indigo-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      isEditing ? "text-blue-600" : "text-indigo-600"
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {isEditing ? "AI 결과 직접 수정 모드" : "AI 공문서체 정돈 결과"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 font-semibold text-slate-700 shadow-2xs transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-slate-600" />
                    <span>{isEditing ? "수정 완료 (미리보기)" : "직접 수정"}</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-medium">
                    글자수: {(isEditing ? editedText : polishResult.polishedText).length}자
                  </span>
                </div>
              </div>

              {/* Polished View or Textarea */}
              <div className="p-2 flex-1 flex flex-col min-h-[160px]">
                {isEditing ? (
                  <textarea
                    id="ai-polish-direct-edit-textarea"
                    rows={7}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full flex-1 p-3 text-xs text-slate-900 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed font-sans"
                    placeholder="수치나 왜곡된 단어를 직접 수정하세요..."
                  />
                ) : (
                  <div
                    id="ai-polish-preview-box"
                    className="flex-1 p-3.5 text-xs text-slate-900 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed select-text"
                  >
                    {polishResult.polishedText}
                  </div>
                )}
              </div>

              <div className="px-3 py-1.5 bg-white/70 text-[11px] text-slate-500 border-t border-slate-200 flex items-center justify-between">
                <span>
                  {isEditing ? "원하는 표현으로 직접 편집 중" : "식품 품질공문서 표준 어투 적용"}
                </span>
                {isEditing && (
                  <span className="text-blue-700 font-medium">
                    수정 후 아래 [적용하기]를 누르세요
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="ai-modal-restore-btn"
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>복원 (원문 유지)</span>
            </button>
            <span className="text-xs text-slate-500 hidden sm:inline">
              확실하지 않으면 원문을 그대로 두는 것이 안전합니다.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="ai-modal-toggle-edit-btn"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>{isEditing ? "수정 모드 종료" : "직접 수정"}</span>
            </button>

            <button
              type="button"
              id="ai-modal-apply-btn"
              onClick={handleApply}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 text-white ${
                currentFactCheck.hasWarnings
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{currentFactCheck.hasWarnings ? "확인 후 적용하기" : "적용하기"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
