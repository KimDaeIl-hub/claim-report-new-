import React from "react";
import {
  Sparkles,
  Layers,
  Check,
  Plus,
  Eye,
  EyeOff,
  Info,
  ShieldCheck,
  Beaker,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  ClaimTypeCategory,
  CLAIM_TYPES,
  ALL_CLAIM_TYPE_KEYS,
  getAnalysisItemVisibility,
} from "../utils/claimTypeConfig";
import { ReportData, AdditionalTestItem } from "../types";

export interface ClaimTypeFilterBarProps {
  selectedTypes: ClaimTypeCategory[];
  onChangeSelectedTypes: (types: ClaimTypeCategory[]) => void;
  showAllItems: boolean;
  onToggleShowAll: (showAll: boolean) => void;
  report: ReportData;
  onAddAdditionalTest?: (test: AdditionalTestItem) => void;
  onSelectPresetFilter?: (categoryKey: string) => void;
}

export function ClaimTypeFilterBar({
  selectedTypes,
  onChangeSelectedTypes,
  showAllItems,
  onToggleShowAll,
  report,
  onAddAdditionalTest,
  onSelectPresetFilter,
}: ClaimTypeFilterBarProps) {
  // Toggle a claim type (multi-selection)
  const handleToggleType = (typeKey: ClaimTypeCategory) => {
    if (selectedTypes.includes(typeKey)) {
      onChangeSelectedTypes(selectedTypes.filter((t) => t !== typeKey));
    } else {
      onChangeSelectedTypes([...selectedTypes, typeKey]);
    }
  };

  const handleSelectAllTypes = () => {
    onChangeSelectedTypes([...ALL_CLAIM_TYPE_KEYS]);
  };

  const handleClearTypes = () => {
    onChangeSelectedTypes([]);
  };

  const visibilityInfo = getAnalysisItemVisibility(
    selectedTypes,
    report.analysisResults,
    showAllItems
  );

  const visibleCount = Object.values(visibilityInfo).filter((v) => v.isVisible).length;
  const totalCount = Object.keys(visibilityInfo).length;
  const hiddenCount = totalCount - visibleCount;
  const preservedDataCount = Object.values(visibilityInfo).filter(
    (v) => !v.isRequiredByType && v.hasContent && !showAllItems && selectedTypes.length > 0
  ).length;

  return (
    <div className="bg-linear-to-r from-slate-50 via-blue-50/40 to-indigo-50/30 border border-blue-200 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">클레임 유형별 맞춤 조사 항목</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                다중 선택 가능
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              유형을 선택하면 필요한 정밀 분석 및 공정 항목만 나타나며,{" "}
              <strong className="text-slate-700 font-semibold">이미 입력한 데이터는 절대로 지워지지 않고 보존</strong>됩니다.
            </p>
          </div>
        </div>

        {/* Show all toggle switch */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleShowAll(!showAllItems)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-all ${
              showAllItems
                ? "bg-blue-600 text-white border-blue-700 font-bold shadow-2xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300 font-medium"
            }`}
            title="유형 필터와 관계없이 모든 7대 조사 항목을 펼쳐서 확인합니다"
          >
            {showAllItems ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>전체 항목 보기 {showAllItems ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Claim Type Selection Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {ALL_CLAIM_TYPE_KEYS.map((typeKey) => {
          const typeDef = CLAIM_TYPES[typeKey];
          const isSelected = selectedTypes.includes(typeKey);

          return (
            <button
              key={typeKey}
              type="button"
              id={`btn-claim-type-${typeKey}`}
              onClick={() => handleToggleType(typeKey)}
              className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                isSelected
                  ? typeDef.activeButtonColor
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
              title={`${typeDef.name}: ${typeDef.description}`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  isSelected ? "bg-white scale-110" : "bg-slate-300 group-hover:bg-slate-400"
                }`}
              />
              <span>{typeDef.badgeLabel}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-white/90 stroke-[3]" />}
            </button>
          );
        })}

        <div className="flex items-center gap-1 ml-auto text-[11px] text-slate-500">
          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={handleClearTypes}
              className="text-slate-500 hover:text-slate-800 underline px-1.5 py-0.5"
            >
              필터 해제
            </button>
          )}
          {selectedTypes.length < ALL_CLAIM_TYPE_KEYS.length && (
            <button
              type="button"
              onClick={handleSelectAllTypes}
              className="text-blue-600 hover:text-blue-800 underline px-1.5 py-0.5 font-medium"
            >
              모든 유형 선택
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Status & Info Strip */}
      <div className="pt-1 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-700">
          {selectedTypes.length === 0 ? (
            <span className="text-slate-500 italic">
              선택된 유형 없음: 기본 전체 7대 과학 분석 항목을 모두 표시합니다.
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-blue-900">
                선택된 유형 [{selectedTypes.map((k) => CLAIM_TYPES[k].badgeLabel).join(", ")}]:
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                조사 항목 {visibleCount}개 활성
              </span>
              {hiddenCount > 0 && !showAllItems && (
                <span className="text-slate-500">
                  (불필요한 {hiddenCount}개 숨김 처리됨)
                </span>
              )}
            </div>
          )}

          {preservedDataCount > 0 && !showAllItems && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              기존 입력 데이터 {preservedDataCount}건 자동 보존 및 표시 중
            </span>
          )}
        </div>

        {/* Suggested Additional Test Button for selected types */}
        {onAddAdditionalTest && selectedTypes.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {selectedTypes.map((typeKey) => {
              const def = CLAIM_TYPES[typeKey];
              if (!def.suggestedTestTemplate) return null;

              // Check if already added
              const isAlreadyAdded = (report.analysisResults?.additionalTests || []).some(
                (t) => t.title.includes(def.badgeLabel) || t.title === def.suggestedTestTemplate?.title
              );

              if (isAlreadyAdded) return null;

              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => {
                    if (def.suggestedTestTemplate) {
                      onAddAdditionalTest({
                        id: `test-auto-${typeKey}-${Date.now()}`,
                        title: def.suggestedTestTemplate.title,
                        result: def.suggestedTestTemplate.result,
                        includePrinciple: def.suggestedTestTemplate.includePrinciple,
                        principleText: def.suggestedTestTemplate.principleText,
                        skipped: false,
                        status: "이상 없음",
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-700 font-bold border border-blue-300 transition-colors shadow-2xs"
                  title={`[${def.badgeLabel}] 관련 공인 시험 템플릿을 정밀 분석에 추가합니다`}
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  <span>+ [{def.badgeLabel}] 전용 시험 추가</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
