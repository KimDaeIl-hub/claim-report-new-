import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { polishTextWithAI, PolishResult } from "../services/aiService";
import { AiComparisonReviewModal } from "./AiComparisonReviewModal";

interface AiPolishButtonProps {
  text: string;
  fieldName: string;
  status?: string;
  onApply: (polishedText: string) => void;
}

export function AiPolishButton({ text, fieldName, status, onApply }: AiPolishButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [justPolished, setJustPolished] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polishResult, setPolishResult] = useState<PolishResult | null>(null);

  const handlePolish = async () => {
    if (!text || text.trim().length === 0) {
      alert("먼저 내용을 입력하신 후 AI 문장 정돈 버튼을 눌러주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await polishTextWithAI(text, fieldName, status);
      if (result.success && result.polishedText) {
        setPolishResult(result);
        setIsModalOpen(true);
      } else {
        alert(result.error || "AI 문장 정돈에 실패했습니다.");
      }
    } catch (e: any) {
      console.error(e);
      alert("AI 문장 정돈 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFromModal = (finalText: string) => {
    onApply(finalText);
    setJustPolished(true);
    setTimeout(() => setJustPolished(false), 2500);
  };

  return (
    <>
      <button
        type="button"
        id={`ai-polish-btn-${fieldName.replace(/\s+/g, "_")}`}
        onClick={handlePolish}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
          justPolished
            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 active:scale-95"
        } disabled:opacity-60 shadow-2xs`}
        title="원문과 AI 결과를 나란히 비교 검토하고 사실 관계(수치/추정 표현)를 검증합니다"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>공문서체 윤문 중...</span>
          </>
        ) : justPolished ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>적용 완료!</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI 문장 정돈 (비교 검토)</span>
          </>
        )}
      </button>

      {/* Side-by-side Comparison & Fact-Check Review Modal */}
      {isModalOpen && polishResult && (
        <AiComparisonReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          originalText={text}
          polishResult={polishResult}
          fieldName={fieldName}
          status={status}
          onApply={handleApplyFromModal}
        />
      )}
    </>
  );
}

