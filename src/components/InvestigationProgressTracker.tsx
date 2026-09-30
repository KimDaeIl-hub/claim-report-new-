import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { ReportData, InvestigationStatus } from "../types";
import {
  calculateReportProgress,
  getChecklistStatusStyle,
  ChecklistStatus,
  ProgressItem,
} from "../utils/progressTracker";

interface InvestigationProgressTrackerProps {
  report: ReportData;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onNavigateToField: (tabId: string, elementId: string) => void;
  onUpdateStatus?: (
    item: ProgressItem,
    newStatus: ChecklistStatus,
    targetInvestigationStatus?: InvestigationStatus
  ) => void;
  isModalOpen?: boolean;
  onCloseModal?: () => void;
  showInlineCard?: boolean;
}

type FilterType = "all" | "missing" | "review" | "done";

export const InvestigationProgressTracker: React.FC<InvestigationProgressTrackerProps> = ({
  report,
  activeTab,
  onSelectTab,
  onNavigateToField,
  onUpdateStatus,
  isModalOpen,
  onCloseModal,
  showInlineCard = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("missing");

  const progress = calculateReportProgress(report);

  // 모든 아이템 플랫 리스트
  const allItems = progress.sections.flatMap((s) => s.items);

  // 필터링된 아이템 리스트
  const filteredItems = allItems.filter((item) => {
    if (filter === "all") return true;
    if (filter === "missing") return item.status === "미작성" || item.status === "작성중";
    if (filter === "review") return item.status === "추가확인필요";
    if (filter === "done") return item.status === "완료" || item.status === "해당없음";
    return true;
  });

  const missingCount = progress.unwrittenCount + progress.inProgressCount;

  // 체크리스트 렌더링 헬퍼 함수
  const renderChecklistContent = () => (
    <div className="space-y-4">
      {/* 필터 탭 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setFilter("missing")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filter === "missing"
                ? "bg-white text-rose-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            미완료 ({progress.unwrittenCount + progress.inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("review")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filter === "review"
                ? "bg-white text-purple-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            추가확인 ({progress.needReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("done")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filter === "done"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            완료/해당없음 ({progress.completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            전체 ({progress.totalCount})
          </button>
        </div>

        <div className="text-[11px] text-slate-500">
          * 항목 클릭 시 해당 입력칸으로 부드럽게 이동합니다.
        </div>
      </div>

      {/* 아이템 목록 */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            해당 조건의 조사 항목이 없습니다.
          </div>
        ) : (
          filteredItems.map((item) => {
            const statusStyle = getChecklistStatusStyle(item.status);
            return (
              <div
                key={item.id}
                onClick={() => {
                  onNavigateToField(item.tabId, item.elementId);
                  if (onCloseModal) onCloseModal();
                }}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                  item.status === "미작성"
                    ? "bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70"
                    : item.status === "작성중"
                    ? "bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/70"
                    : item.status === "추가확인필요"
                    ? "bg-purple-50/40 border-purple-200/80 hover:bg-purple-50/70"
                    : "bg-white border-slate-200 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 mt-0.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {item.status}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-500">
                        [{item.section}]
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </span>
                      {item.isRequired && (
                        <span className="text-[10px] text-rose-500 font-semibold">
                          *필수
                        </span>
                      )}
                      {item.isSkippedByUser && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                          사용자 스킵
                        </span>
                      )}
                    </div>

                    {item.currentValue ? (
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        <strong className="text-slate-700">작성 내용:</strong> {item.currentValue}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        내용이 아직 작성되지 않았습니다.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onUpdateStatus && (
                    <select
                      value={item.status}
                      onChange={(e) => {
                        const newSt = e.target.value as ChecklistStatus;
                        onUpdateStatus(item, newSt);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-medium cursor-pointer hover:bg-slate-50"
                      title="상태 수동 지정"
                    >
                      <option value="미작성">미작성</option>
                      <option value="작성중">작성중</option>
                      <option value="완료">완료</option>
                      <option value="해당없음">해당없음 (직접 선택)</option>
                      <option value="추가확인필요">추가확인필요</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToField(item.tabId, item.elementId);
                      if (onCloseModal) onCloseModal();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors border border-blue-200"
                    title="해당 입력칸으로 바로 이동"
                  >
                    <span>이동</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. 인라인 프로그레스 카드 (본문용 - 기본 비노출, showInlineCard가 true일 때만) */}
      {showInlineCard && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  {progress.overallPercentage}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      보고서 조사 작성 진행률
                    </h3>
                    {missingCount === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        모든 필수 항목 작성 완료
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        미완료 {missingCount}건 확인 필요
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    전체 {progress.totalCount}개 필수 항목 중{" "}
                    <strong className="text-slate-800 font-bold">
                      {progress.completedCount}개
                    </strong>{" "}
                    완료됨 (완료 {progress.completedCount - progress.notApplicableCount}건 / 직접 해당없음 {progress.notApplicableCount}건)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mr-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    완료 {progress.completedCount - progress.notApplicableCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    작성중 {progress.inProgressCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                    미작성 {progress.unwrittenCount}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    isOpen
                      ? "bg-slate-800 text-white"
                      : missingCount > 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  <span>{isOpen ? "체크리스트 접기" : "체크리스트 보기"}</span>
                  {missingCount > 0 && !isOpen && (
                    <span className="w-4 h-4 rounded-full bg-white text-blue-700 text-[10px] flex items-center justify-center font-bold">
                      {missingCount}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 전체 진행률 게이지 바 */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress.overallPercentage === 100
                    ? "bg-emerald-500"
                    : progress.overallPercentage >= 70
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                    : progress.overallPercentage >= 40
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${progress.overallPercentage}%` }}
              />
            </div>
          </div>

          {/* 펼침 시 인라인 체크리스트 */}
          {isOpen && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 animate-in fade-in duration-150">
              {renderChecklistContent()}
            </div>
          )}
        </div>
      )}

      {/* 2. 전용 모달 다이얼로그 모드 (상단 헤더의 [체크리스트 보기] 클릭 시) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  {progress.overallPercentage}%
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">조사 진행률 및 항목 체크리스트</h3>
                  <p className="text-[11px] text-slate-300">
                    전체 {progress.totalCount}개 중 {progress.completedCount}개 완료 (미완료 {missingCount}건)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                닫기 ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
              {renderChecklistContent()}
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onCloseModal}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
