import { checkFactIntegrity, FactCheckResult } from "../utils/aiFactChecker";
import { safeRuleBasedPolish } from "../utils/safeRulePolish";

export interface PolishResult {
  success: boolean;
  originalText: string;
  polishedText: string;
  source: 'gemini-3.8-flash' | 'gemini-flash-latest' | 'rule-engine' | 'client-fallback' | string;
  factCheck: FactCheckResult;
  error?: string;
}

export async function polishTextWithAI(
  text: string,
  fieldName: string = "조사 내용",
  status?: string
): Promise<PolishResult> {
  if (!text || text.trim().length === 0) {
    const emptyCheck = checkFactIntegrity("", "");
    return {
      success: false,
      originalText: text,
      polishedText: text,
      source: 'client-fallback',
      factCheck: emptyCheck,
      error: "내용을 입력해주세요.",
    };
  }

  try {
    const response = await fetch("/api/ai/polish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        fieldName,
        status,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.polishedText) {
        const cleaned = sanitizeClientOutput(text, data.polishedText);
        const factCheck = checkFactIntegrity(text, cleaned);
        return {
          success: true,
          originalText: text,
          polishedText: cleaned,
          source: data.source || 'gemini-3.8-flash',
          factCheck,
        };
      }
    }
  } catch (err) {
    console.warn("Server AI polish endpoint unreachable, using safe client rule engine fallback:", err);
  }

  // Safe client-side fallback rule engine: 확실하지 않으면 원문을 그대로 둔다.
  const polished = safeRuleBasedPolish(text);
  const cleaned = sanitizeClientOutput(text, polished);
  const factCheck = checkFactIntegrity(text, cleaned);

  return {
    success: true,
    originalText: text,
    polishedText: cleaned,
    source: 'client-fallback',
    factCheck,
  };
}

function sanitizeClientOutput(rawInput: string, aiOutput: string): string {
  let cleaned = aiOutput.trim();
  const rawLower = rawInput.toLowerCase();

  // Guardrail 1: Check if "불검출" was hallucinated without basis in original note
  const rawHasNonDetect = rawLower.includes("불검출") || rawLower.includes("미검출") || rawLower.includes("음성");
  if (!rawHasNonDetect && (cleaned.includes("불검출") || cleaned.includes("미검출"))) {
    cleaned = cleaned
      .replace(/유해\s*미생물\s*(및|과)?\s*(독성\s*물질)?\s*(이|가)?\s*불검출되었습니다/g, "조사 대상 항목을 확인하였습니다")
      .replace(/불검출되었습니다/g, "확인되지 않았습니다")
      .replace(/불검출(되었음|됨)?/g, "확인 사실 없음");
  }

  // Guardrail 2: Check if "인체에 무해" or "안전함" was hallucinated
  const rawHasSafety = rawLower.includes("무해") || rawLower.includes("안전") || rawLower.includes("독성 없음");
  if (!rawHasSafety) {
    cleaned = cleaned
      .replace(/인체에\s*(전혀\s*)?무해(함|하다|합니다|한 것으로 판명|한 것으로 확인)/g, "인체 영향은 객관적 시험 결과에 따름")
      .replace(/안전(함이|성이)?\s*(확인|검증|입증)되었습니다/g, "조사 결과가 확인되었습니다")
      .replace(/안전(합니다|함)/g, "규격 기준 검토 대상임");
  }

  // Guardrail 3: Check if "외적 요인" was hallucinated
  const rawHasExternal = rawLower.includes("외적") || rawLower.includes("외부") || rawLower.includes("유통") || rawLower.includes("보관");
  if (!rawHasExternal && cleaned.includes("외적 요인")) {
    cleaned = cleaned.replace(/외적\s*요인(에\s*기인한\s*것으로|으로\s*사료됩니다|으로\s*판단됩니다)/g, "원인 규명을 위한 추가 확인이 필요합니다");
  }

  return cleaned;
}

export interface AiLogicSuggestion {
  title: string;
  targetSection: string;
  targetTab: "claim" | "product" | "analysis" | "process" | "lot" | "cause" | "conclusion" | "attachments";
  description: string;
}

export async function requestAiLogicAdvisory(reportSummary: any): Promise<{
  success: boolean;
  suggestions: AiLogicSuggestion[];
  source?: string;
  error?: string;
}> {
  try {
    const response = await fetch("/api/ai/validate-logic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportSummary }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        suggestions: data.suggestions || [],
        source: data.source || "gemini-3.8-flash",
      };
    }
  } catch (err: any) {
    console.warn("AI logic advisory network error:", err);
  }

  return {
    success: true,
    suggestions: [
      {
        title: "원인과 대책 간의 연계성 검토",
        targetSection: "6. 원인 및 대책",
        targetTab: "cause",
        description: "원인 판정 결과가 '외부 유입'인 경우, 고객 전달 시 불필요한 마찰을 방지하기 위해 중립적 사실과 보존 환경 소견을 명확히 제시하십시오.",
      },
    ],
    source: "fallback-advisory",
  };
}
