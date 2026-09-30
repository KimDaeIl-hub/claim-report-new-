import { ReportData, InvestigationStatus } from "../types";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationCategory =
  | "missing"
  | "mismatch"
  | "investigation_conflict"
  | "cause_conflict"
  | "photo_missing"
  | "suggestion";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity; // 'error' | 'warning' | 'info'
  category: ValidationCategory;
  tabId: "claim" | "product" | "analysis" | "process" | "lot" | "cause" | "conclusion" | "attachments";
  fieldId: string; // DOM element ID for focus & scroll
  fieldLabel: string; // UI label (e.g. "제품명")
  sectionName: string; // UI section (e.g. "2. 제품 정보")
  title: string; // Short summary
  description: string; // Detailed guidance
  snippet?: string; // Problematic context snippet
  isAiSuggestion?: boolean;
}

export interface ValidationSummary {
  total: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  isValidForPrint: boolean;
  issues: ValidationIssue[];
}

/**
 * Deterministic code-based validator for ReportData
 */
export function validateReport(report: ReportData): ValidationSummary {
  const issues: ValidationIssue[] = [];

  // Helper to add issue
  const addIssue = (
    severity: ValidationSeverity,
    category: ValidationCategory,
    tabId: ValidationIssue["tabId"],
    fieldId: string,
    fieldLabel: string,
    sectionName: string,
    title: string,
    description: string,
    snippet?: string
  ) => {
    issues.push({
      id: `${severity}-${category}-${fieldId}-${issues.length}`,
      severity,
      category,
      tabId,
      fieldId,
      fieldLabel,
      sectionName,
      title,
      description,
      snippet,
    });
  };

  // -------------------------------------------------------------
  // [1] 필수 정보 누락 (Errors)
  // -------------------------------------------------------------

  // 1-1. 제품명
  if (!report.productInfo?.productName?.trim()) {
    addIssue(
      "error",
      "missing",
      "product",
      "field-product-name",
      "제품명 (규격/용량)",
      "2. 제품 정보",
      "필수 정보 누락: 제품명이 입력되지 않았습니다.",
      "보고서의 기본 식별자인 제품명(예: 썬키스트 훼미리 감귤 1.5L)을 반드시 입력하십시오."
    );
  }

  // 1-2. 제조번호 / Lot No.
  if (!report.productInfo?.lotNumber?.trim()) {
    addIssue(
      "error",
      "missing",
      "product",
      "field-lot-number",
      "제조번호 (Lot No.)",
      "2. 제품 정보",
      "필수 정보 누락: 제조번호(Lot No.)가 입력되지 않았습니다.",
      "제조일자 및 공정 추적, 동일 Lot 검체 대조를 위해 제조번호를 반드시 기재해야 합니다."
    );
  }

  // 1-3. 클레임 접수일자
  if (!report.customerClaim?.receivedAt?.trim()) {
    addIssue(
      "error",
      "missing",
      "claim",
      "field-claim-received-at",
      "클레임 접수일자",
      "1. 클레임 접수",
      "필수 정보 누락: 클레임 접수일자가 비어 있습니다.",
      "소비자로부터 클레임이 인입된 공식 접수일자를 선택하십시오."
    );
  }

  // 1-4. 소비기한 (유통기한)
  if (!report.productInfo?.expiryDate?.trim()) {
    addIssue(
      "error",
      "missing",
      "product",
      "field-expiry-date",
      "소비기한 (유통기한)",
      "2. 제품 정보",
      "필수 정보 누락: 소비기한(유통기한)이 기재되지 않았습니다.",
      "회수 시점의 소비기한 경과 여부 및 보존 상태를 확인하기 위해 필수 기재 항목입니다."
    );
  }

  // 1-5. 클레임 접수 세부 내용
  if (!report.customerClaim?.claimDetails?.trim()) {
    addIssue(
      "error",
      "missing",
      "claim",
      "field-claim-details",
      "클레임 접수 세부 내용",
      "1. 클레임 접수",
      "필수 정보 누락: 클레임 인입 경위 및 증상 내용이 비어 있습니다.",
      "소비자가 제기한 불편 사항 및 현품 상태의 구체적 인입 경위를 작성하십시오."
    );
  }

  // 1-6. 종합 원인 판정 누락 (skip이 아닐 때)
  if (!report.rootCauseAndActions?.skipped && !report.rootCauseAndActions?.rootCause?.trim()) {
    addIssue(
      "error",
      "missing",
      "cause",
      "field-root-cause",
      "종합 원인 판정",
      "6. 원인 및 대책",
      "필수 정보 누락: 종합 원인 판정 내용이 비어 있습니다.",
      "조사 결과에 따른 최종 판정 내용을 기재하십시오. 조사가 진행 중이라면 상태를 '추가 조사 필요' 등으로 지정하고 사유를 명시하십시오."
    );
  }

  // -------------------------------------------------------------
  // [2] 논리 모순: 조사 안 한 항목을 "정상"으로 쓴 경우 (Errors)
  // -------------------------------------------------------------
  const normalKeywords = ["정상", "이상 없음", "이상없음", "특이사항 없음", "특이사항없음", "적합", "규격 합격", "불검출", "문제 없음"];

  const checkUnexaminedNormalConflict = (
    status: InvestigationStatus | undefined,
    skipped: boolean,
    text: string | undefined,
    tabId: ValidationIssue["tabId"],
    fieldId: string,
    fieldLabel: string,
    sectionName: string
  ) => {
    if (!text || !text.trim()) return;

    // 만약 상태가 '미실시', '확인 불가'인데 본문에 '정상/특이사항 없음/적합/불검출'이 들어있는 경우
    if (status === "미실시" || status === "확인 불가") {
      const matched = normalKeywords.find((kw) => text.includes(kw));
      if (matched) {
        addIssue(
          "error",
          "investigation_conflict",
          tabId,
          fieldId,
          fieldLabel,
          sectionName,
          `논리 모순: 조사를 안 했는데 '${matched}'으로 기재됨`,
          `해당 항목 상태가 [${status}]로 설정되어 있으나, 본문에 '${matched}'(으)로 작성되어 상호 모순됩니다. 상태를 [이상 없음]으로 변경하거나 본문 텍스트를 바로잡으십시오.`,
          text.slice(0, 70)
        );
      }
    }
  };

  // 정밀분석 각 항목 체크
  const a = report.analysisResults;
  if (a) {
    if (!a.visualInspection.skipped) {
      checkUnexaminedNormalConflict(
        a.visualInspection.status,
        a.visualInspection.skipped,
        `${a.visualInspection.sampleCondition} ${a.visualInspection.foreignObjectAppearance}`,
        "analysis",
        "field-visual-sample-condition",
        "현품 확인 결과",
        "3. 정밀 과학 분석"
      );
    }

    if (!a.magnifierInspection.skipped) {
      checkUnexaminedNormalConflict(
        a.magnifierInspection.status,
        a.magnifierInspection.skipped,
        a.magnifierInspection.result,
        "analysis",
        "field-magnifier-result",
        "확대경 조사 결과",
        "3. 정밀 과학 분석"
      );
    }

    if (!a.opticalMicroscope.skipped) {
      checkUnexaminedNormalConflict(
        a.opticalMicroscope.status,
        a.opticalMicroscope.skipped,
        a.opticalMicroscope.result,
        "analysis",
        "field-microscope-result",
        "광학 현미경 조사 결과",
        "3. 정밀 과학 분석"
      );
    }

    if (!a.ftirAnalysis.skipped) {
      checkUnexaminedNormalConflict(
        a.ftirAnalysis.status,
        a.ftirAnalysis.skipped,
        a.ftirAnalysis.summary,
        "analysis",
        "field-ftir-summary",
        "FT-IR 분석 결과",
        "3. 정밀 과학 분석"
      );
    }

    if (!a.xrfAnalysis.skipped) {
      checkUnexaminedNormalConflict(
        a.xrfAnalysis.status,
        a.xrfAnalysis.skipped,
        a.xrfAnalysis.summary,
        "analysis",
        "field-xrf-summary",
        "XRF 분석 결과",
        "3. 정밀 과학 분석"
      );
    }
  }

  // 제조공정 분석 체크
  const m = report.manufacturingProcess;
  if (m && !m.skipped) {
    checkUnexaminedNormalConflict(
      m.filtrationStatus,
      false,
      m.filtrationAnalysis,
      "process",
      "field-process-filtration",
      "여과망 관리 분석",
      "4. 제조공정 분석"
    );
    checkUnexaminedNormalConflict(
      m.cleaningStatus,
      false,
      m.cleaningAnalysis,
      "process",
      "field-process-cleaning",
      "용기 세척 공정 분석",
      "4. 제조공정 분석"
    );
  }

  // 동일 Lot 이력 체크
  const l = report.lotHistory;
  if (l && !l.skipped) {
    checkUnexaminedNormalConflict(
      l.productionLogStatus,
      false,
      l.productionLogNote,
      "lot",
      "field-lot-production-log",
      "생산일지 확인",
      "5. 동일 Lot 이력"
    );
    checkUnexaminedNormalConflict(
      l.retainedSampleStatus,
      false,
      l.retainedSampleCheck,
      "lot",
      "field-lot-retained-sample",
      "보관 검체 확인 결과",
      "5. 동일 Lot 이력"
    );
  }

  // -------------------------------------------------------------
  // [3] 논리 모순: 원인 미확인인데 원인을 확정한 경우 (Errors)
  // -------------------------------------------------------------
  const root = report.rootCauseAndActions;
  if (root && !root.skipped) {
    const isUncertainStatus =
      root.status === "미실시" ||
      root.status === "확인 불가" ||
      root.status === "추가 조사 필요";

    if (isUncertainStatus && root.rootCause) {
      const definitiveKeywords = [
        "확정되었습니다",
        "확정됨",
        "판명되었습니다",
        "판명됨",
        "입증되었습니다",
        "입증됨",
        "기인한 것으로 확인",
        "원인으로 확인",
        "단정할 수 있음",
      ];
      const foundDefinitive = definitiveKeywords.find((kw) =>
        root.rootCause.includes(kw)
      );

      if (foundDefinitive) {
        addIssue(
          "error",
          "cause_conflict",
          "cause",
          "field-root-cause",
          "종합 원인 판정",
          "6. 원인 및 대책",
          `논리 모순: 원인 상태는 [${root.status}]인데 내용에 '${foundDefinitive}' 단정 표현 사용`,
          `종합 판정 상태가 '${root.status}'인 상태에서 '${foundDefinitive}'와 같은 단정적 표현을 쓰면 공식 문서로서 심각한 신뢰성 결함이 발생합니다. 원인 상태를 '이상 없음' 등으로 바꾸거나 문장을 '~것으로 추정/사료됩니다'로 완화하십시오.`,
          root.rootCause.slice(0, 80)
        );
      }
    }
  }

  // -------------------------------------------------------------
  // [4] 제품명·Lot번호 불일치 검사 (Warnings)
  // -------------------------------------------------------------
  const currentLot = (report.productInfo?.lotNumber || "").trim();
  const currentProduct = (report.productInfo?.productName || "").trim();

  // 본문 전체 텍스트에서 다른 Lot 번호 표기가 있는지 대조
  if (currentLot) {
    const checkTextForLotMismatch = (
      text: string,
      tabId: ValidationIssue["tabId"],
      fieldId: string,
      fieldLabel: string,
      sectionName: string
    ) => {
      if (!text) return;
      // Look for patterns like Lot: 260301A, Lot.12345, 제조번호 260301B
      const lotRegex = /(?:Lot|LOT|제조번호|로트번호|로트)\s*[:#.]?\s*([A-Za-z0-9-_]+)/gi;
      let match;
      while ((match = lotRegex.exec(text)) !== null) {
        const found = match[1].trim();
        // If found lot is substantive (>= 4 chars) and not matching productInfo.lotNumber
        if (found.length >= 4 && found.toLowerCase() !== currentLot.toLowerCase()) {
          addIssue(
            "warning",
            "mismatch",
            tabId,
            fieldId,
            fieldLabel,
            sectionName,
            `제조번호(Lot) 불일치 의심: '${found}' 발견 (기준: '${currentLot}')`,
            `제품 정보에 기재된 제조번호는 [${currentLot}]이나, ${fieldLabel} 본문에서 [${found}]이(가) 언급되었습니다. 오타나 다른 로트 번호 기재가 아닌지 확인하십시오.`,
            match[0]
          );
        }
      }
    };

    checkTextForLotMismatch(
      report.customerClaim?.claimDetails,
      "claim",
      "field-claim-details",
      "클레임 접수 세부 내용",
      "1. 클레임 접수"
    );
    checkTextForLotMismatch(
      report.lotHistory?.productionLogNote,
      "lot",
      "field-lot-production-log",
      "생산일지 확인",
      "5. 동일 Lot 이력"
    );
    checkTextForLotMismatch(
      report.rootCauseAndActions?.rootCause,
      "cause",
      "field-root-cause",
      "종합 원인 판정",
      "6. 원인 및 대책"
    );
  }

  // 제품명 오타/이종 제품 언급 감지 (예: 비타500 vs 옥수수수염차)
  if (currentProduct) {
    const knownProducts = [
      { name: "비타500", keywords: ["비타500", "비타오백", "비타 500"] },
      { name: "옥수수수염차", keywords: ["옥수수수염차", "옥수수", "수염차"] },
      { name: "헛개차", keywords: ["헛개차", "헛개파워", "헛개"] },
      { name: "삼다수", keywords: ["삼다수"] },
      { name: "쌍화탕", keywords: ["쌍화탕", "광동쌍화"] },
      { name: "경옥고", keywords: ["경옥고"] },
      { name: "우황청심원", keywords: ["우황청심원", "청심원"] },
      { name: "썬키스트", keywords: ["썬키스트", "감귤", "훼미리"] },
    ];

    const currentKnown = knownProducts.find((p) =>
      p.keywords.some((k) => currentProduct.includes(k))
    );

    if (currentKnown) {
      // Check claimDetails if a completely different known product is mentioned
      const details = report.customerClaim?.claimDetails || "";
      for (const other of knownProducts) {
        if (other.name !== currentKnown.name) {
          const conflictingKeyword = other.keywords.find((k) => details.includes(k));
          if (conflictingKeyword && !currentProduct.includes(conflictingKeyword)) {
            addIssue(
              "warning",
              "mismatch",
              "claim",
              "field-claim-details",
              "클레임 접수 세부 내용",
              "1. 클레임 접수",
              `제품명 불일치 의심: 접수 내용에 타 제품명 '${conflictingKeyword}' 언급`,
              `접수 제품명은 [${currentProduct}]인데, 클레임 접수 본문에서 타 제품군 [${conflictingKeyword}]이(가) 언급되었습니다. 복사-붙여넣기 시 잔류 텍스트가 아닌지 확인하십시오.`,
              conflictingKeyword
            );
            break;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // [5] 첨부사진이 있다고 기술했으나 실제 사진이 없는 경우 (Warnings)
  // -------------------------------------------------------------
  const photoMentionKeywords = [
    "[사진]",
    "[사진 1]",
    "[사진 2]",
    "[사진 3]",
    "사진 참조",
    "첨부 사진",
    "첨부사진",
    "아래 사진",
    "현품 사진",
    "현품사진",
    "보관품 사진",
    "보관품사진",
    "이물 사진",
    "이물사진",
    "별첨 사진",
  ];

  const checkPhotoMentionWithoutFiles = (
    text: string,
    photoCount: number,
    tabId: ValidationIssue["tabId"],
    fieldId: string,
    fieldLabel: string,
    sectionName: string,
    targetPhotoLabel: string
  ) => {
    if (!text || photoCount > 0) return;
    const foundKeyword = photoMentionKeywords.find((kw) => text.includes(kw));
    if (foundKeyword) {
      addIssue(
        "warning",
        "photo_missing",
        tabId,
        fieldId,
        fieldLabel,
        sectionName,
        `첨부사진 누락: 본문에 '${foundKeyword}' 언급되었으나 사진 파일 없음`,
        `본문에 '${foundKeyword}'(으)로 사진 참조를 유도하고 있으나, ${targetPhotoLabel}에 실제 업로드된 사진이 0장입니다. 사진을 업로드하거나 본문에서 사진 참조 문구를 제거하십시오.`,
        foundKeyword
      );
    }
  };

  // 5-1. 클레임 접수 사진
  const customerPhotoCount = report.customerClaim?.customerPhotos?.length || 0;
  checkPhotoMentionWithoutFiles(
    report.customerClaim?.claimDetails,
    customerPhotoCount,
    "claim",
    "field-customer-photos",
    "클레임 접수 사진",
    "1. 클레임 접수",
    "클레임 접수 사진 영역"
  );

  // 5-2. 현품 및 이물 분석 사진 (attachment1)
  const att1Count = report.attachments?.attachment1Photos?.length || 0;
  const visualText = `${report.analysisResults?.visualInspection?.sampleCondition || ""} ${
    report.analysisResults?.visualInspection?.foreignObjectAppearance || ""
  }`;
  checkPhotoMentionWithoutFiles(
    visualText,
    att1Count,
    "attachments",
    "field-attachment-1",
    "현품 및 이물 확대 사진",
    "8. 사진 첨부",
    "첨부 1 (현품 및 이물 사진) 영역"
  );

  // 5-3. 보관 검체 확인 사진
  const retainedPhotoCount =
    (report.lotHistory?.retainedSamplePhotos?.length || 0) +
    (report.attachments?.attachment2Photos?.length || 0);
  checkPhotoMentionWithoutFiles(
    report.lotHistory?.retainedSampleCheck,
    retainedPhotoCount,
    "lot",
    "field-lot-retained-photos",
    "보관 검체 확인 사진",
    "5. 동일 Lot 이력",
    "보관 검체 사진 영역"
  );

  // -------------------------------------------------------------
  // [6] 기타 논리 및 정합성 검사 (Warnings & Info)
  // -------------------------------------------------------------

  // 6-1. 텍스트는 비어있는데 상태만 '이상 없음' / '확인 완료'인 경우 (Warning)
  const checkEmptyContentWithStatus = (
    status: InvestigationStatus | undefined,
    text: string | undefined,
    tabId: ValidationIssue["tabId"],
    fieldId: string,
    fieldLabel: string,
    sectionName: string
  ) => {
    if ((status === "이상 없음" || status === "확인 완료") && (!text || !text.trim())) {
      addIssue(
        "warning",
        "missing",
        tabId,
        fieldId,
        fieldLabel,
        sectionName,
        `조사 내용 누락: 상태는 [${status}]이나 구체적 내용이 비어있음`,
        `상태가 [${status}]로 설정되었으나 구체적인 소견이나 점검 결과 내용이 적혀있지 않습니다. 구체적인 확인 사실을 1~2줄 기재하십시오.`
      );
    }
  };

  if (!a.ftirAnalysis.skipped) {
    checkEmptyContentWithStatus(
      a.ftirAnalysis.status,
      a.ftirAnalysis.summary,
      "analysis",
      "field-ftir-summary",
      "FT-IR 분석 결과",
      "3. 정밀 과학 분석"
    );
  }

  if (!l.skipped) {
    checkEmptyContentWithStatus(
      l.productionLogStatus,
      l.productionLogNote,
      "lot",
      "field-lot-production-log",
      "생산일지 확인",
      "5. 동일 Lot 이력"
    );
    checkEmptyContentWithStatus(
      l.retainedSampleStatus,
      l.retainedSampleCheck,
      "lot",
      "field-lot-retained-sample",
      "보관 검체 확인 결과",
      "5. 동일 Lot 이력"
    );
  }

  // 6-2. 재발방지대책 누락 (원인에 이상이 확인되었을 때) (Warning)
  if (
    !root.skipped &&
    root.status === "이상 확인" &&
    (root.preventiveMeasuresSkipped || !root.preventiveMeasures?.trim())
  ) {
    addIssue(
      "warning",
      "missing",
      "cause",
      "field-preventive-measures",
      "재발방지대책",
      "6. 원인 및 대책",
      "재발방지대책 누락: 이상이 확인되었으나 대책이 미기재됨",
      "원인 판정에서 이상이 확인되었으므로, 고객 신뢰 확보 및 재발 방지를 위한 설비/공정 개선 대책을 반드시 수립하여 기재해야 합니다."
    );
  }

  // 6-3. 이화학 분석 부적합 항목이 있는데 요약이 비어있거나 이상 없음인 경우 (Warning)
  const pChem = report.analysisResults?.physicochemicalAnalysis;
  if (pChem && !pChem.skipped && pChem.items) {
    const unsuited = pChem.items.filter((item) => item.judgment === "부적합");
    if (unsuited.length > 0 && pChem.status === "이상 없음") {
      addIssue(
        "warning",
        "investigation_conflict",
        "analysis",
        "field-physicochemical-table",
        "이화학 분석 결과",
        "3. 정밀 과학 분석",
        `이화학 분석 모순: 부적합 항목(${unsuited.map((u) => u.name).join(", ")})이 있으나 상태가 [이상 없음]임`,
        `이화학 측정 결과 부적합으로 판정된 항목이 존재합니다. 이화학 분석 상태를 [이상 확인]으로 변경하거나 측정 판정을 점검하십시오.`
      );
    }
  }

  // -------------------------------------------------------------
  // [7] 권장 사항 (Info)
  // -------------------------------------------------------------

  // 7-1. 문서번호
  if (!report.docNumber?.trim() || report.docNumber.includes("커뮤니케이션팀")) {
    addIssue(
      "info",
      "suggestion",
      "claim",
      "field-doc-number",
      "문서 번호",
      "기본 정보",
      "문서 번호 확인 권장",
      "공식 공문서 양식에 맞추어 품질경영팀 표준 문서번호(예: 광동 QM 2026-C04)가 지정되었는지 확인하십시오."
    );
  }

  // 7-2. 결론 핵심 요약문 개수
  const summaryPoints = report.conclusion?.summaryPoints || [];
  const validPoints = summaryPoints.filter((p) => p && p.trim().length > 0);
  if (validPoints.length < 2) {
    addIssue(
      "info",
      "suggestion",
      "conclusion",
      "field-conclusion-summary",
      "결론 핵심 요약",
      "7. 결론/사과문",
      "결론 핵심 요약문 추가 권장",
      "보고서 하단의 핵심 요약(가, 나, 다)을 2개 이상 작성하면 보고서를 읽는 고객이나 사내 유관부서가 결과를 한눈에 파악하기 훨씬 수월합니다."
    );
  }

  // 7-3. 고객 사과/안심 문구
  if (!report.conclusion?.apologyText?.trim()) {
    addIssue(
      "info",
      "suggestion",
      "conclusion",
      "field-conclusion-apology",
      "고객 안심 및 사과 문구",
      "7. 결론/사과문",
      "고객 안심 및 사과 문구 보완 권장",
      "불편을 겪은 소비자의 불안감을 해소하고 기업 신뢰도를 높이기 위한 정중한 안심 문구를 기재하십시오."
    );
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    total: issues.length,
    errorCount,
    warningCount,
    infoCount,
    isValidForPrint: errorCount === 0,
    issues,
  };
}
