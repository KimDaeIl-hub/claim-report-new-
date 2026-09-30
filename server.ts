import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // API Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Tone & Manner Polish API
  app.post("/api/ai/polish", async (req, res) => {
    try {
      const { text, fieldName = "조사 내용", promptType = "qa_formal", status } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "정돈할 텍스트가 필요합니다." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest"];
        const systemInstruction = `당신은 대한민국 대표 식품 대기업의 식품안전/품질경영팀(QA/QC) 수석 연구원입니다.
작성자가 작성한 클레임 조사 내용을 정형화된 고품격 식품공문서 표준 어투(Tone & Manner)로 다듬어주세요.

[AI 문장 정돈의 제1원칙: 사실 관계(Fact) 절대 불변의 원칙]
AI는 문장의 품격과 어투만 예쁘게 정돈하며, 수치·판단·불확실성은 절대 바꾸지 않습니다.

[AI가 절대 바꾸면 안 되는 정보 (Zero Distortion)]
1. [수치 및 단위 100% 보존]: 원문의 모든 숫자, 소수점, 비율(%), 단위(℃, %, wt%, ppm, mg, g, kg, mm, μm, ml, CFU 등)는 단 1개도 누락하거나 값을 변경하지 말고 원문 그대로 유지하십시오.
2. [제품명 및 Lot번호, 날짜]: 제품명, 제조번호(Lot No.), 제조일자, 유통기한, 접수일자는 절대 변경하지 마십시오.
3. [불확실성 표현 유지 (추정→확인 왜곡 절대 금지)]:
   - 원문의 '추정', '사료', '가능성', '의심', '확인 불가', '불명', '미상', '판단 유보' 등의 표현을 절대로 '확인되었습니다', '판명되었습니다', '입증되었습니다' 등의 단정적/확정적 사실로 바꾸지 마십시오.
   - 추정은 반드시 추정(~것으로 추정됩니다, ~것으로 사료됩니다)으로 유지해야 합니다.
4. [원인 판정 수준 불변]: 원문의 원인 판정 수준(예: "외부 유입 가능성 의심" 등)을 임의로 격상하거나 축소하지 마십시오.
5. [무해성/불검출 임의 생성 금지]: 원문에 "불검출", "무해", "안전"이라는 명시적 서술이 없다면, "불검출", "인체에 무해하다", "안전함" 같은 표현을 절대 날조하지 마십시오.
6. [미실시 사실 보존]: 원문이나 조사 상태가 '미실시' 또는 '확인 불가'인 경우, 이를 임의로 '이상 없음'이나 '정상'으로 둔갑시키지 말고 '미실시' 상태를 사실 그대로 반영하십시오.
7. [불확실 시 원문 유지]: 의미나 사실 관계가 모호하거나 확실하지 않은 경우, 문장을 임의로 재구성하지 말고 원문의 표현을 그대로 두는 것이 원칙입니다.
8. 문미 종결어미: 사실에 기반하여 '~로 확인되었습니다.', '~로 사료됩니다.', '~로 분석되었습니다.'로 공문서 규격에 맞게 정돈하십시오.
9. 설명이나 따옴표 없이, 오직 다듬어진 최종 보고서 문장 텍스트만 출력하십시오.`;

        const ai = new GoogleGenAI({ apiKey });

        for (const model of candidateModels) {
          let succeeded = false;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const response = await ai.models.generateContent({
                model,
                contents: `[조사 항목]: ${fieldName}\n[조사 상태]: ${status || "확인"}\n[원문 메모]:\n${text}\n\n위 원문 메모의 사실(Fact)만을 바탕으로 식품품질공문서 표준 어투로 다듬어주세요. 근거 없는 "불검출", "인체에 무해하다", "외적 요인", "이상 없음" 생성은 엄격히 금지됩니다.`,
                config: {
                  systemInstruction,
                  temperature: 0.1,
                },
              });

              let polished = response.text ? response.text.trim() : null;
              if (polished) {
                // Post-processing guardrail against hallucinated ungrounded claims
                polished = sanitizeAiOutput(text, polished);
                return res.json({
                  success: true,
                  polishedText: polished,
                  source: model,
                });
              }
            } catch (err: any) {
              const isHighDemand =
                err?.status === 503 ||
                err?.code === 503 ||
                (typeof err?.message === "string" &&
                  (err.message.includes("503") ||
                    err.message.includes("high demand") ||
                    err.message.includes("UNAVAILABLE")));

              if (isHighDemand && attempt === 0) {
                await new Promise((resolve) => setTimeout(resolve, 600));
                continue;
              }
              break;
            }
          }
          if (succeeded) break;
        }
      }

      // Fallback Rule-based Polish Engine
      const polished = ruleBasedPolish(text);
      return res.json({
        success: true,
        polishedText: sanitizeAiOutput(text, polished),
        source: "rule-engine",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/polish:", err);
      res.status(500).json({ error: err.message || "문장 다듬기 중 오류가 발생했습니다." });
    }
  });

  // AI Logic & Context Consistency Advisor API
  app.post("/api/ai/validate-logic", async (req, res) => {
    try {
      const { reportSummary } = req.body;
      if (!reportSummary) {
        return res.status(400).json({ error: "보고서 요약 데이터가 필요합니다." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `당신은 대기업 식품안전 및 품질경영(QA/QC) 수석 감사관입니다.
제공된 클레임 보고서 요약본을 검토하고, "인과관계 모순", "소비자 오해 소지 표현", "조사 결과와 종합 결론 간의 논리적 괴리" 관점에서 2~3가지의 '검토 제안(Advisory Suggestion)'을 제시하십시오.
단, 이것은 단정적 지적이 아니며, 실무 연구원에게 참고용으로 권장하는 정중한 조언 어투여야 합니다.
응답은 JSON 형식으로 출력하십시오.
형식:
{
  "suggestions": [
    {
      "title": "제안 제목",
      "targetSection": "관련 섹션명 (예: 원인 및 대책, 정밀 과학 분석 등)",
      "targetTab": "claim | product | analysis | process | lot | cause | conclusion | attachments",
      "description": "구체적인 보완 및 검토 권장 내용"
    }
  ]
}`;

        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `아래 식품 클레임 조사 보고서의 인과관계 및 공문서 정합성을 검토해주세요:\n\n${JSON.stringify(
              reportSummary,
              null,
              2
            )}`,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json({
              success: true,
              suggestions: parsed.suggestions || [],
              source: "gemini-3.8-flash",
            });
          }
        } catch (err: any) {
          console.warn("AI validation call failed, returning rule-based suggestion:", err?.message);
        }
      }

      // Fallback advisory suggestions
      return res.json({
        success: true,
        suggestions: [
          {
            title: "원인과 대책 간의 연계성 검토",
            targetSection: "6. 원인 및 대책",
            targetTab: "cause",
            description: "원인 판정 결과가 '외부 유입' 또는 '보관 중 이상'인 경우, 고객 전달 시 불필요한 감정 자극을 피할 수 있도록 정중하고 중립적인 어휘를 유지하는 것을 권장합니다.",
          },
          {
            title: "공정 제어 및 보관 검체 대조 강화",
            targetSection: "5. 동일 Lot 이력",
            targetTab: "lot",
            description: "동일 Lot 자사 보관품이 정상이라 하더라도, 유통·보관 단계에서의 온도 또는 환경 변화 가능성을 함께 명시하면 결론의 객관성이 향상됩니다.",
          },
        ],
        source: "advisory-rules",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/validate-logic:", err);
      res.status(500).json({ error: "검토 제안 생성 중 오류가 발생했습니다." });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QA/QC Claim Report Server running on http://0.0.0.0:${PORT}`);
  });
}

function ruleBasedPolish(text: string): string {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length === 0) return "";

  // Split into lines to process each line carefully: 확실하지 않으면 원문을 그대로 둔다.
  const lines = trimmed.split("\n");
  const processedLines = lines.map((line) => {
    let l = line.trim();
    if (!l) return "";

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

    // 1. Observation prefixes
    l = l.replace(/(?:육안으로\s*)?(?:봤을 때|확인해보니|체크해보니|확인해봤더니)/g, "확인한 결과");
    l = l.replace(/검사해본\s*결과/g, "검사 결과");

    // 2. Normalcy / issue conversions only when explicitly unambiguous
    l = l.replace(/(?:특이사항\s*없음|문제\s*없음|이상\s*없음)(?=[,\s.]|$)/g, "특이사항은 확인되지 않았습니다");
    l = l.replace(/(?:이상\s*있음|문제\s*있음)(?=[,\s.]|$)/g, "이상 소견이 확인되었습니다");

    // 3. Preserve uncertainty and tone without converting to confirmation
    if (hasUncertainty) {
      l = l.replace(/원인인\s*것\s*같(?:음|다)/g, "원인인 것으로 추정됩니다");
      l = l.replace(/(?:인\s*)?것\s*같(?:음|다)|같(?:음|다)(?=[.\s]|$)/g, "것으로 사료됩니다");
      l = l.replace(/것\s*것으로\s*사료됩니다/g, "것으로 사료됩니다");
      l = l.replace(/의심됨|의심\s*됨/g, "의심 소견이 있습니다");
    } else {
      l = l.replace(/정밀\s*검사함/g, "정밀 검사를 실시하였습니다");
      l = l.replace(/조사함/g, "조사를 진행하였습니다");
    }

    // 4. Safe formal endings without blindly appending '을 확인하였습니다.'
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
        // Keep as is
      } else {
        if (l.endsWith("함")) {
          l = l.slice(0, -1) + "하였습니다.";
        } else if (l.endsWith("임")) {
          l = l.slice(0, -1) + "입니다.";
        } else {
          // If uncertain, keep original wording with simple period
          l = l + ".";
        }
      }
    }

    return l;
  });

  return processedLines.join("\n");
}

function sanitizeAiOutput(rawInput: string, aiOutput: string): string {
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

startServer();
