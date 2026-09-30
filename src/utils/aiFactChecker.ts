/**
 * Fact & Semantic Integrity Verification Engine
 * AI 문장 정돈 시 사실 관계(수치, 단위, 불확실성/추정 표현, 날짜, 단정 등)가 왜곡되지 않았는지 검증
 */

export interface FactWarning {
  type: 'number' | 'uncertainty' | 'unit' | 'assertion' | 'date';
  message: string;
  severity: 'high' | 'medium';
  originalExcerpt?: string;
  polishedExcerpt?: string;
}

export interface FactCheckResult {
  hasWarnings: boolean;
  warnings: FactWarning[];
  numberCheck: {
    passed: boolean;
    originalNumbers: string[];
    polishedNumbers: string[];
    missing: string[];
    added: string[];
  };
  uncertaintyCheck: {
    passed: boolean;
    detectedOriginalTerms: string[];
    convertedToCertaintyTerms: string[];
  };
  unitCheck: {
    passed: boolean;
    missingUnits: string[];
  };
  assertionCheck: {
    passed: boolean;
    detectedUngroundedTerms: string[];
  };
}

// Regex to extract numbers (integers, decimals, percentages, ranges)
const NUMBER_REGEX = /(?:\b|\D)(\d+(?:\.\d+)?)(?:\b|\D)/g;

// List of common measurement units in food QA
const COMMON_UNITS = [
  '℃', '°c', '°C', '%', 'wt%', 'ppm', 'ppb', 'mg/kg', 'mg', 'g', 'kg',
  'mm', 'μm', 'um', 'cm', 'ml', 'mL', 'l', 'L', 'cfu', 'CFU', 'CFU/g',
  'rpm', 'mesh', 'ea', '개', '건', '봉', '박스', 'box'
];

// Uncertainty terms (원문에 있을 때 확정으로 바꾸면 안 되는 단어들)
const UNCERTAINTY_TERMS = [
  '추정',
  '추측',
  '사료',
  '가능성',
  '의심',
  '불가',
  '확인불가',
  '확인 불가',
  '미상',
  '불명',
  '유보',
  '판단 유보',
  '알 수 없음',
  '판단 곤란',
  '인 것 같음',
  '인것 같음',
  '것으로 봄',
  '보임',
  '것 같다',
  '것 같음',
];

// Certainty terms (AI가 추정을 확정으로 바꿨는지 감지하기 위한 확정적 어휘)
const CERTAINTY_INDICATORS = [
  '확인되었습니다',
  '확인되었음',
  '판명되었습니다',
  '판명되었음',
  '입증되었습니다',
  '입증되었음',
  '단정할 수 있습니다',
  '명백합니다',
  '확실합니다',
  '증명되었습니다',
  '밝혀졌습니다',
  '기인한 것으로 확정',
  '전혀 문제 없음',
];

// Ungrounded assertion terms (원문에 없는데 AI가 날조하면 안 되는 단어들)
const SENSITIVE_ASSERTIONS = [
  { term: '불검출', aliases: ['불검출', '미검출', '음성'] },
  { term: '인체 무해', aliases: ['무해', '안전', '독성 없음', '위해성 없음'] },
  { term: '외적 요인 단정', aliases: ['외적 요인', '외부 요인', '유통 중', '소비자 과실'] },
  { term: '완전 정상', aliases: ['전혀 이상 없음', '완벽', '무결'] },
];

/**
 * Extract clean numbers from text
 */
export function extractNumbers(text: string): string[] {
  const matches = text.match(NUMBER_REGEX);
  if (!matches) return [];
  
  // Extract just the numeric values
  const numbers: string[] = [];
  const regex = /(\d+(?:\.\d+)?)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    numbers.push(match[1]);
  }
  return numbers;
}

/**
 * Extract units present in text
 */
export function extractUnits(text: string): string[] {
  const found: string[] = [];
  for (const unit of COMMON_UNITS) {
    if (text.includes(unit)) {
      found.push(unit);
    }
  }
  return found;
}

/**
 * Check fact integrity between original note and polished text
 */
export function checkFactIntegrity(originalText: string, polishedText: string): FactCheckResult {
  const warnings: FactWarning[] = [];
  const rawClean = (originalText || '').trim();
  const polishedClean = (polishedText || '').trim();

  // 1. Number integrity check
  const origNumbers = extractNumbers(rawClean);
  const polNumbers = extractNumbers(polishedClean);

  const missingNumbers = origNumbers.filter((n) => !polNumbers.includes(n));
  const addedNumbers = polNumbers.filter((n) => !origNumbers.includes(n));

  const numberPassed = missingNumbers.length === 0 && addedNumbers.length === 0;
  if (!numberPassed) {
    if (missingNumbers.length > 0) {
      warnings.push({
        type: 'number',
        severity: 'high',
        message: `원문에 기재된 수치 [${missingNumbers.join(', ')}] 가 AI 결과에서 누락되거나 변경되었습니다.`,
        originalExcerpt: missingNumbers.join(', '),
      });
    }
    if (addedNumbers.length > 0) {
      warnings.push({
        type: 'number',
        severity: 'high',
        message: `원문에 없던 새로운 수치 [${addedNumbers.join(', ')}] 가 AI 결과에 임의로 추가되었습니다.`,
        polishedExcerpt: addedNumbers.join(', '),
      });
    }
  }

  // 2. Uncertainty to Certainty check (불확실성 왜곡 검사: 추정 -> 확정)
  const detectedOrigUncertainties = UNCERTAINTY_TERMS.filter((term) => rawClean.includes(term));
  const convertedToCertainties: string[] = [];

  if (detectedOrigUncertainties.length > 0) {
    // If original had uncertainty words, check if polished turned them into rigid confirmations
    for (const indicator of CERTAINTY_INDICATORS) {
      if (polishedClean.includes(indicator)) {
        convertedToCertainties.push(indicator);
      }
    }

    if (convertedToCertainties.length > 0) {
      warnings.push({
        type: 'uncertainty',
        severity: 'high',
        message: `원문의 추정/불확실성 표현 [${detectedOrigUncertainties.join(', ')}] 이(가) 확정적 표현 [${convertedToCertainties.join(', ')}] 으로 왜곡되었습니다.`,
        originalExcerpt: detectedOrigUncertainties.join(', '),
        polishedExcerpt: convertedToCertainties.join(', '),
      });
    }
  }

  // 3. Units check
  const origUnits = extractUnits(rawClean);
  const polUnits = extractUnits(polishedClean);
  const missingUnits = origUnits.filter((u) => !polUnits.includes(u));

  const unitPassed = missingUnits.length === 0;
  if (!unitPassed) {
    warnings.push({
      type: 'unit',
      severity: 'medium',
      message: `원문에 기재된 측정 단위 [${missingUnits.join(', ')}] 가 AI 결과에서 누락되었습니다.`,
      originalExcerpt: missingUnits.join(', '),
    });
  }

  // 4. Sensitive ungrounded assertions check (원문에 없는 무해성, 불검출, 외적 요인 날조)
  const detectedUngrounded: string[] = [];
  for (const item of SENSITIVE_ASSERTIONS) {
    const rawHas = item.aliases.some((alias) => rawClean.includes(alias));
    const polishedHas = item.aliases.some((alias) => polishedClean.includes(alias));

    if (!rawHas && polishedHas) {
      detectedUngrounded.push(item.term);
      warnings.push({
        type: 'assertion',
        severity: 'high',
        message: `원문에 근거 없는 단정적 표현 [${item.term}] 이(가) 임의로 추가되었습니다.`,
      });
    }
  }

  return {
    hasWarnings: warnings.length > 0,
    warnings,
    numberCheck: {
      passed: numberPassed,
      originalNumbers: origNumbers,
      polishedNumbers: polNumbers,
      missing: missingNumbers,
      added: addedNumbers,
    },
    uncertaintyCheck: {
      passed: convertedToCertainties.length === 0,
      detectedOriginalTerms: detectedOrigUncertainties,
      convertedToCertaintyTerms: convertedToCertainties,
    },
    unitCheck: {
      passed: unitPassed,
      missingUnits,
    },
    assertionCheck: {
      passed: detectedUngrounded.length === 0,
      detectedUngroundedTerms: detectedUngrounded,
    },
  };
}
