import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Microscope,
  Layers,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { ReportData } from "../types";
import { ClaimKnowledgeItem } from "../types/claimKnowledge";
import {
  loadAllClaimKnowledge,
  deleteClaimKnowledge,
  CLAIM_KNOWLEDGE_STORAGE_KEY,
} from "../utils/claimKnowledgeStorage";

interface ClaimKnowledgeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAsInvestigationPackage?: (pastReport: ReportData) => void;
}

export function ClaimKnowledgeManagerModal({
  isOpen,
  onClose,
  onApplyAsInvestigationPackage,
}: ClaimKnowledgeManagerModalProps) {
  const [knowledgeList, setKnowledgeList] = useState<ClaimKnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCauseFilter, setSelectedCauseFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setKnowledgeList(loadAllClaimKnowledge());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredList = knowledgeList.filter((item) => {
    // 1. 검색어 (제품명, 클레임유형, 원인, 제조번호)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.basicInfo.productName.toLowerCase().includes(q) ||
        item.basicInfo.claimType.toLowerCase().includes(q) ||
        item.basicInfo.lotNumber.toLowerCase().includes(q) ||
        item.conclusionInfo.causeCategory.toLowerCase().includes(q) ||
        item.conclusionInfo.causeDetail.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. 원인 판정 필터
    if (selectedCauseFilter === "identified") {
      if (!item.conclusionInfo.isCauseIdentified) return false;
    } else if (selectedCauseFilter === "unidentified") {
      if (item.conclusionInfo.isCauseIdentified) return false;
    }

    return true;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("해당 지식 데이터를 Knowledge Base에서 삭제하시겠습니까? (기존 원본 보고서는 보존됩니다)")) {
      deleteClaimKnowledge(id);
      setKnowledgeList(loadAllClaimKnowledge());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  완료 클레임 지식 베이스 (Knowledge Base)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  누적 {knowledgeList.length}건
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                완료된 클레임 보고서로부터 추출·승인된 5대 구조화 지식을 검색하고 새 조사에 재사용합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 및 필터 바 */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제품명, 클레임 유형, 원인 분류, 제조번호 검색..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">원인 판정 필터:</span>
            <select
              value={selectedCauseFilter}
              onChange={(e) => setSelectedCauseFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="all">전체 판정 보기</option>
              <option value="identified">✓ 원인 규명 완료</option>
              <option value="unidentified">? 원인 미확인 / 외력 종결</option>
            </select>
          </div>
        </div>

        {/* 지식 리스트 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">등록된 지식 데이터가 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">
                클레임 조사를 마친 후 상단 [✓ 클레임 완료] 버튼을 눌러 지식화(Knowledge)로 연결하세요.
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all overflow-hidden"
                >
                  {/* 카드 요약 헤더 */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-600 text-white">
                          {item.basicInfo.productName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          {item.basicInfo.claimType}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.basicInfo.manufactureLine}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1 ${
                            item.conclusionInfo.isCauseIdentified
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {item.conclusionInfo.isCauseIdentified ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{item.conclusionInfo.causeStatusLabel}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-800 font-semibold flex items-center gap-2">
                        <span>원인 분류: <strong className="text-slate-900">{item.conclusionInfo.causeCategory}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500 font-normal">
                          조사 항목 {item.investigationInfo.investigationItems.length}개 · 관련 공정 {item.investigationInfo.relatedProcesses.length}개
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {onApplyAsInvestigationPackage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyAsInvestigationPackage(item.reportSnapshot);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-lg shadow-2xs border border-amber-300 active:scale-95 cursor-pointer"
                          title="이 지식의 조사 구조(항목, 방법, 공정, 상용구)를 현재 작성 중인 클레임에 즉시 적용"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                          <span>이 지식을 조사 패키지로 사용</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="지식 데이터 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* 세부 확장 뷰 (5대 구조화 내용) */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-200 bg-white space-y-4 animate-in fade-in-50 duration-150">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. 조사정보 세부 */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                          <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                            <Microscope className="w-3.5 h-3.5 text-indigo-600" />
                            <span>조사항목 및 분석방법</span>
                          </strong>
                          <div className="flex flex-wrap gap-1">
                            {item.investigationInfo.investigationItems.map((itm, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                                ✓ {itm}
                              </span>
                            ))}
                          </div>
                          <div className="pt-1.5 border-t border-slate-200/80">
                            <span className="text-[11px] text-slate-500 font-semibold block mb-1">관련 설비:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.investigationInfo.relatedEquipments.map((eq, i) => (
                                <span key={i} className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-200">
                                  {eq}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 2. 5대 결과정보 세부 */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                          <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>5대 조사 결과 검증</span>
                          </strong>
                          <ul className="space-y-1 text-[11px] text-slate-700">
                            <li>● 보관품: <strong className="text-emerald-700">{item.resultInfo.storageSampleStatus}</strong> ({item.resultInfo.storageSampleResult.slice(0, 45)}...)</li>
                            <li>● 제조기록: <strong className="text-emerald-700">{item.resultInfo.manufacturingRecordStatus}</strong></li>
                            <li>● 완제품 품질검사: <strong className="text-emerald-700">{item.resultInfo.qualityInspectionStatus}</strong></li>
                            <li>● 공정조사: <strong className="text-emerald-700">{item.resultInfo.processInvestigationStatus}</strong></li>
                            <li>● 원부자재: <strong className="text-emerald-700">{item.resultInfo.rawMaterialStatus}</strong></li>
                          </ul>
                        </div>
                      </div>

                      {/* 3. 결론정보 및 조사자 승인 원인 */}
                      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5 text-amber-950">
                        <strong className="font-bold flex items-center gap-1.5 text-amber-900">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>조사자 승인 원인 판정 내용 (시스템 자동 확정 아님)</span>
                        </strong>
                        <p className="text-slate-800 leading-relaxed text-[11px]">
                          {item.conclusionInfo.causeDetail}
                        </p>
                      </div>

                      {/* 하단 메타정보 */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>조사 담당자: <strong>{item.reportInfo.researcherName}</strong></span>
                        <span>완료 일자: <strong>{item.reportInfo.completedDate}</strong></span>
                        <span>사용 상용구: <strong>{item.reportInfo.usedPhraseCount}건</strong></span>
                        <span>증빙 사진: <strong>{item.reportInfo.photoCount}장</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            * 지식 데이터는 브라우저 영구 저장소에 보관되며 신규 클레임 작성 시 자동 추천 엔진에 실시간 반영됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
