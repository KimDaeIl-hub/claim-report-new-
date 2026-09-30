/**
 * Safe Rule-Based Polish Engine
 * 원칙: "확실하지 않으면 원문을 그대로 둔다."
 * 수치, 단위, 날짜, 제품명, Lot번호, 추정/불확실성 표현, 원인 판정 수준을 절대 왜곡하지 않음.
 */

interface SafeReplacementRule {
  pattern: RegExp;
  replacement: string;
  // If true, only replace if not conflicting with uncertainty or negation
  safeOnly?: boolean;
}

export function safeRuleBasedPolish(text: string): string {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length === 0) return "";

  // Split into lines to process each line carefully
  const lines = trimmed.split("\n");
  const processedLines = lines.map((line) => {
    let l = line.trim();
    if (!l) return "";

    // If line has uncertainty words, handle with extra care
    const hasUncertainty =
      l.includes("추정") ||
      l.includes("사료") ||
      l.includes("가능성") ||
      l.includes("의심") ||
      l.includes("불가") ||
      l.includes("불명") ||
      l.includes("미상") ||
      l.includes("유보") ||
      l.includes("것 같");

    // Safe conversational to formal QA phrasing
    // 1. Observation prefixes
    l = l.replace(/(?:육안으로\s*)?(?:봤을 때|확인해보니|체크해보니|확인해봤더니)/g, "확인한 결과");
    l = l.replace(/검사해본\s*결과/g, "검사 결과");

    // 2. Certainty / Normalcy conversions ONLY when unambiguous
    // E.g., "이상 없음" -> "특이사항 및 이상 징후는 확인되지 않았습니다"
    l = l.replace(/(?:특이사항\s*없음|문제\s*없음|이상\s*없음)(?=[,\s.]|$)/g, "특이사항은 확인되지 않았습니다");
    l = l.replace(/(?:이상\s*있음|문제\s*있음)(?=[,\s.]|$)/g, "이상 소견이 확인되었습니다");

    // 3. Uncertainty tone preserving: '인 것 같음', '보임' -> '~것으로 사료됩니다/추정됩니다'
    if (hasUncertainty) {
      l = l.replace(/원인인\s*것\s*같(?:음|다)/g, "원인인 것으로 추정됩니다");
      l = l.replace(/(?:인\s*)?것\s*같(?:음|다)|같(?:음|다)(?=[.\s]|$)/g, "것으로 사료됩니다");
      l = l.replace(/것\s*것으로\s*사료됩니다/g, "것으로 사료됩니다");
      l = l.replace(/의심됨|의심\s*됨/g, "의심 소견이 있습니다");
    } else {
      // 4. Action endings (only if not an uncertainty statement)
      l = l.replace(/정밀\s*검사함/g, "정밀 검사를 실시하였습니다");
      l = l.replace(/조사함/g, "조사를 진행하였습니다");
    }

    // 5. Ending refinement:
    // If the line already has formal endings, DO NOT append anything!
    const endsWithFormal =
      l.endsWith("했습니다.") ||
      l.endsWith("하였습니다.") ||
      l.endsWith("되었습니다.") ||
      l.endsWith("사료됩니다.") ||
      l.endsWith("판단됩니다.") ||
      l.endsWith("확인되었습니다.") ||
      l.endsWith("추정됩니다.") ||
      l.endsWith("있습니다.") ||
      l.endsWith("없습니다.") ||
      l.endsWith("입니다.") ||
      l.endsWith("합니다.");

    if (!endsWithFormal) {
      if (l.endsWith("사료됨") || l.endsWith("판단됨") || l.endsWith("추정됨")) {
        l = l + "니다.";
      } else if (l.endsWith("확인됨") || l.endsWith("검출됨")) {
        l = l.replace(/됨$/, "되었습니다.");
      } else if (l.endsWith("진행함") || l.endsWith("실시함")) {
        l = l.replace(/함$/, "하였습니다.");
      } else if (l.endsWith("특이사항 없음") || l.endsWith("이상 없음")) {
        l = l.replace(/(?:특이사항\s*없음|이상\s*없음)$/, "특이사항은 확인되지 않았습니다.");
      } else if (l.endsWith(".")) {
        // Already ends with dot, keep intact to avoid distorting facts
      } else {
        // If line is incomplete or note style, DO NOT blindly append "을 확인하였습니다."!
        // Just add a period or keep original note structure intact.
        if (l.endsWith("함")) {
          l = l.slice(0, -1) + "하였습니다.";
        } else if (l.endsWith("임")) {
          l = l.slice(0, -1) + "입니다.";
        } else {
          // Conservative preservation: keep original words and add period only if sensible
          l = l + ".";
        }
      }
    }

    return l;
  });

  return processedLines.join("\n");
}
