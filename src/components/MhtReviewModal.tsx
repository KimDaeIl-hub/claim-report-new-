import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { ReportData } from "../types";
import { ParsedMhtClaimData } from "../utils/mhtParser";

export interface MhtReviewItem {
  key: string;
  label: string;
  category: "접수 정보" | "제품 정보" | "기타 정보";
  extractedValue: string; // extracted from MHT, or ""
  currentValue: string; // currently in ReportData, or ""
  targetValue: string; // value to be applied (user editable)
  status: "new" | "conflict" | "identical" | "failed";
  apply: boolean; // whether to apply to report
  isEdited: boolean; // whether targetValue was changed by user
  description?: string;
}

interface MhtReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  parsedData: ParsedMhtClaimData;
  currentReport: ReportData;
  onApply: (approvedItems: Record<string, string>, rawParsed: ParsedMhtClaimData) => void;
}

export function MhtReviewModal({
  isOpen,
  onClose,
  fileName,
  parsedData,
  currentReport,
  onApply,
}: MhtReviewModalProps) {
  const [items, setItems] = useState<MhtReviewItem[]>([]);
  const [showConfirmOverride, setShowConfirmOverride] = useState(false);

  // Initialize items from parsedData and currentReport
  useEffect(() => {
    if (!isOpen) return;

    const newClaim = currentReport.customerClaim;
    const newProduct = currentReport.productInfo;

    const rawDefinitions: Array<{
      key: string;
      label: string;
      category: "접수 정보" | "제품 정보" | "기타 정보";
      extracted: string | undefined;
      current: string | undefined;
      description?: string;
    }> = [
      {
        key: "customerName",
        label: "소비자명 / 상호명",
        category: "접수 정보",
        extracted: parsedData.customerName,
        current: newClaim?.customerName,
        description: "클레임 접수 고객 또는 거래처명",
      },
      {
        key: "receivedAt",
        label: "클레임 접수일자",
        category: "접수 정보",
        extracted: parsedData.receivedAt,
        current: newClaim?.receivedAt ? newClaim.receivedAt.split("T")[0] : "",
        description: "고객 접수 인입 일자 (YYYY-MM-DD)",
      },
      {
        key: "channel",
        label: "접수 경로 / 인입 부서",
        category: "접수 정보",
        extracted: parsedData.channel,
        current: newClaim?.channel,
        description: "인입 접수 부서 및 전자결재 채널",
      },
      {
        key: "productName",
        label: "제품명 (규격/용량)",
        category: "제품 정보",
        extracted: parsedData.productName,
        current: newProduct?.productName,
        description: "접수 대상 제품명 및 규격",
      },
      {
        key: "lotNumber",
        label: "제조번호 (Lot No.)",
        category: "제품 정보",
        extracted: parsedData.lotNumber,
        current: newProduct?.lotNumber,
        description: "제품 제조번호(Lot)",
      },
      {
        key: "expiryDate",
        label: "소비(사용)기한",
        category: "제품 정보",
        extracted: parsedData.expiryDate,
        current: newProduct?.expiryDate,
        description: "제품 소비기한/유통기한 (YYYY-MM-DD)",
      },
      {
        key: "manufacturer",
        label: "제조처 / 생산공장",
        category: "제품 정보",
        extracted: parsedData.manufacturer,
        current: newProduct?.manufacturer,
        description: "외주처 또는 생산 공장/라인",
      },
      {
        key: "claimDetails",
        label: "클레임 접수 및 불만 내용",
        category: "접수 정보",
        extracted: parsedData.claimDetails,
        current: newClaim?.claimDetails,
        description: "불만사항, 접수경위, 고객 요청사항 종합",
      },
      {
        key: "incomingDocNumber",
        label: "접수 전자결재 문서번호",
        category: "기타 정보",
        extracted: parsedData.incomingDocNumber,
        current: currentReport.docNumber,
        description: "그룹웨어 인입 결재번호 (참고용)",
      },
    ];

    const built: MhtReviewItem[] = rawDefinitions.map((def) => {
      const extractedVal = (def.extracted || "").trim();
      const currentVal = (def.current || "").trim();

      // Check status
      let status: MhtReviewItem["status"] = "new";
      let apply = true;

      if (!extractedVal) {
        status = "failed"; // 추출 실패 (데이터 없음) - 임의로 채우지 않음
        apply = false;
      } else if (currentVal && currentVal !== extractedVal) {
        status = "conflict"; // 이미 입력된 값과 추출값이 다름 -> 충돌
        apply = true; // 기본값은 반영 후보이나 충돌 경고 표시
      } else if (currentVal && currentVal === extractedVal) {
        status = "identical"; // 기존값과 완전히 동일함
        apply = false; // 굳이 안 덮어써도 동일
      } else {
        status = "new"; // 기존값이 비어있고 새로 추출됨
        apply = true;
      }

      return {
        key: def.key,
        label: def.label,
        category: def.category,
        extractedValue: extractedVal,
        currentValue: currentVal,
        targetValue: extractedVal || "",
        status,
        apply,
        isEdited: false,
        description: def.description,
      };
    });

    setItems(built);
    setShowConfirmOverride(false);
  }, [isOpen, fileName, parsedData, currentReport]);

  if (!isOpen) return null;

  // Statistics
  const totalCount = items.length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const conflictCount = items.filter((i) => i.status === "conflict").length;
  const newCount = items.filter((i) => i.status === "new").length;
  const identicalCount = items.filter((i) => i.status === "identical").length;
  const selectedCount = items.filter((i) => i.apply && i.status !== "failed").length;
  const selectedConflictCount = items.filter((i) => i.apply && i.status === "conflict").length;

  const handleToggleApply = (key: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, apply: !item.apply } : item
      )
    );
  };

  const handleTargetChange = (key: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        return {
          ...item,
          targetValue: value,
          isEdited: value !== item.extractedValue,
          apply: true, // 사용자가 직접 수정하면 자동으로 반영 대상으로 체크
        };
      })
    );
  };

  const handleUseCurrentValue = (key: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        return {
          ...item,
          targetValue: item.currentValue,
          apply: false, // 기존값 유지이므로 덮어쓰기 제외
          isEdited: false,
        };
      })
    );
  };

  const handleUseExtractedValue = (key: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        return {
          ...item,
          targetValue: item.extractedValue,
          apply: true,
          isEdited: false,
        };
      })
    );
  };

  // Bulk actions
  const handleSelectAll = (apply: boolean) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        apply: item.status === "failed" ? false : apply,
      }))
    );
  };

  const handleKeepAllCurrent = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.status === "conflict") {
          return {
            ...item,
            targetValue: item.currentValue,
            apply: false,
            isEdited: false,
          };
        }
        return item;
      })
    );
  };

  const handleUseAllExtracted = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.status === "conflict") {
          return {
            ...item,
            targetValue: item.extractedValue,
            apply: true,
            isEdited: false,
          };
        }
        return item;
      })
    );
  };

  const handleConfirmApply = () => {
    // If there are conflicts being overwritten and confirmation hasn't been shown, show confirmation
    if (selectedConflictCount > 0 && !showConfirmOverride) {
      setShowConfirmOverride(true);
      return;
    }

    const approvedRecord: Record<string, string> = {};
    items.forEach((item) => {
      if (item.apply && item.targetValue.trim()) {
        approvedRecord[item.key] = item.targetValue.trim();
      }
    });

    onApply(approvedRecord, parsedData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-200">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  MHT 파싱 결과 검토 및 보고서 반영
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40 font-mono">
                  {fileName || "전자결재_클레임보고서.mht"}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                MHT 파일에서 추출한 항목을 확인하고, 필요한 경우 직접 수정한 후 승인하세요. (추출 실패 항목은 임의로 채우지 않습니다)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Quick Actions Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">추출 통계:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              신규 추출 {newCount}건
            </span>
            {conflictCount > 0 ? (
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                기존값 충돌 {conflictCount}건
              </span>
            ) : null}
            {identicalCount > 0 ? (
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                일치(중복) {identicalCount}건
              </span>
            ) : null}
            {failedCount > 0 ? (
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                추출 실패 {failedCount}건
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium mr-1">일괄 제어:</span>
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold transition-colors"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold transition-colors"
            >
              전체 해제
            </button>
            {conflictCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleKeepAllCurrent}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded text-amber-900 font-bold transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  충돌 시 기존값 유지
                </button>
                <button
                  type="button"
                  onClick={handleUseAllExtracted}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-blue-900 font-bold transition-colors"
                >
                  충돌 시 추출값 적용
                </button>
              </>
            )}
          </div>
        </div>

        {/* Warning banner if conflicts exist */}
        {conflictCount > 0 && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>주의:</strong> 기존 보고서에 이미 작성된 값과 추출된 값이 다른 항목이 <strong>{conflictCount}건</strong> 있습니다. 덮어쓰기를 원하지 않는 항목은 <strong>[기존값 유지]</strong>를 클릭하거나 선택을 해제하세요.
              </span>
            </div>
          </div>
        )}

        {/* Override Confirmation Alert Modal/Overlay */}
        {showConfirmOverride && (
          <div className="mx-6 my-3 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-950 text-xs flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm">
                  기존에 입력된 데이터 {selectedConflictCount}개가 새 추출값으로 덮어써집니다!
                </p>
                <p className="text-red-700 mt-0.5">
                  현재 보고서에 작성되어 있던 내용이 수정될 수 있습니다. 정말로 덮어쓰시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmOverride(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg"
              >
                다시 검토하기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmOverride(false);
                  const approvedRecord: Record<string, string> = {};
                  items.forEach((item) => {
                    if (item.apply && item.targetValue.trim()) {
                      approvedRecord[item.key] = item.targetValue.trim();
                    }
                  });
                  onApply(approvedRecord, parsedData);
                  onClose();
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs"
              >
                네, 덮어쓰기 승인
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden border-separate border-spacing-0">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center border-b border-slate-200">반영</th>
                <th className="py-2.5 px-3 w-40 border-b border-slate-200">항목명</th>
                <th className="py-2.5 px-3 w-52 border-b border-slate-200">현재 입력된 값 (기존값)</th>
                <th className="py-2.5 px-3 w-56 border-b border-slate-200">MHT 추출된 값</th>
                <th className="py-2.5 px-3 border-b border-slate-200">
                  최종 반영될 값 <span className="font-normal text-blue-600">(직접 수정 가능)</span>
                </th>
                <th className="py-2.5 px-3 w-32 text-center border-b border-slate-200">상태 / 수정 여부</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const isConflict = item.status === "conflict";
                const isFailed = item.status === "failed";
                const isIdentical = item.status === "identical";
                const isMultiline = item.key === "claimDetails";

                return (
                  <tr
                    key={item.key}
                    className={`transition-colors ${
                      !item.apply
                        ? "bg-slate-50/60 opacity-60"
                        : isConflict
                        ? "bg-amber-50/50 hover:bg-amber-50"
                        : isFailed
                        ? "bg-red-50/20"
                        : "hover:bg-blue-50/30"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center align-top">
                      <input
                        type="checkbox"
                        checked={item.apply}
                        disabled={isFailed}
                        onChange={() => handleToggleApply(item.key)}
                        className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer ${
                          isFailed ? "cursor-not-allowed opacity-30" : ""
                        }`}
                      />
                    </td>

                    {/* Field Name & Category */}
                    <td className="py-2.5 px-3 align-top">
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                          {item.category}
                        </span>
                        {item.description && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.description}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Current Value in Report */}
                    <td className="py-2.5 px-3 align-top text-slate-600">
                      {item.currentValue ? (
                        <div className="space-y-1">
                          <div
                            className={`p-1.5 rounded text-[11px] font-mono whitespace-pre-wrap break-all border ${
                              isConflict
                                ? "bg-amber-100/70 border-amber-300 text-amber-950 font-semibold"
                                : "bg-slate-100 border-slate-200 text-slate-700"
                            }`}
                          >
                            {item.currentValue.length > 100
                              ? `${item.currentValue.slice(0, 100)}...`
                              : item.currentValue}
                          </div>
                          {isConflict && (
                            <button
                              type="button"
                              onClick={() => handleUseCurrentValue(item.key)}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-800 hover:text-amber-950 font-bold underline"
                              title="현재 입력값을 유지하고 새 추출값 덮어쓰기를 취소합니다"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              기존값 유지
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">[비어 있음]</span>
                      )}
                    </td>

                    {/* Extracted Value from MHT */}
                    <td className="py-2.5 px-3 align-top font-mono">
                      {isFailed ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-800 text-[11px] font-bold">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>추출 실패 (문서 내 없음)</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-950 text-[11px] whitespace-pre-wrap break-all">
                            {item.extractedValue.length > 120
                              ? `${item.extractedValue.slice(0, 120)}...`
                              : item.extractedValue}
                          </div>
                          {isConflict && (
                            <button
                              type="button"
                              onClick={() => handleUseExtractedValue(item.key)}
                              className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 font-bold underline"
                              title="기존값 대신 새 추출값으로 교체합니다"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                              새 추출값 선택
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Target Value (Editable) */}
                    <td className="py-2.5 px-3 align-top">
                      {isFailed ? (
                        <div className="text-[11px] text-slate-400 italic py-1">
                          (추출되지 않아 임의 기입하지 않음)
                        </div>
                      ) : isMultiline ? (
                        <textarea
                          rows={3}
                          value={item.targetValue}
                          onChange={(e) => handleTargetChange(item.key, e.target.value)}
                          placeholder="반영될 값을 입력하세요"
                          className="w-full text-[11px] p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-mono leading-relaxed"
                        />
                      ) : (
                        <input
                          type="text"
                          value={item.targetValue}
                          onChange={(e) => handleTargetChange(item.key, e.target.value)}
                          placeholder="반영될 값을 입력하세요"
                          className="w-full text-[11px] px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-mono font-medium"
                        />
                      )}
                    </td>

                    {/* Status & Edit Indicator */}
                    <td className="py-2.5 px-3 text-center align-top">
                      <div className="flex flex-col items-center gap-1">
                        {isFailed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            추출 실패
                          </span>
                        ) : isConflict ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                            덮어쓰기 충돌
                          </span>
                        ) : isIdentical ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            기존값과 일치
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            신규 반영
                          </span>
                        )}

                        {item.isEdited && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-600 text-white">
                            사용자 수정됨
                          </span>
                        )}

                        {!item.apply && !isFailed && (
                          <span className="text-[10px] text-slate-400 italic">
                            [반영 제외됨]
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            총 <strong>{totalCount}개</strong> 항목 중{" "}
            <strong className="text-blue-700 font-bold">{selectedCount}개</strong> 선택됨
            {selectedConflictCount > 0 && (
              <span className="text-amber-800 font-bold ml-2">
                (기존값 대체 {selectedConflictCount}건 포함)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              취소 (반영 안 함)
            </button>
            <button
              type="button"
              onClick={handleConfirmApply}
              disabled={selectedCount === 0}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 ${
                selectedCount === 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : selectedConflictCount > 0
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>선택한 {selectedCount}개 항목 보고서에 반영</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
