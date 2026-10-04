import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  Microscope,
  FileText,
  Tag,
  Building,
  Calendar,
  User,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
  Database,
  Check,
  Info,
} from "lucide-react";
import { ReportData } from "../types";
import { ClaimKnowledgeItem, ExplicitCauseApproval } from "../types/claimKnowledge";
import { extractKnowledgeFromReport } from "../utils/claimKnowledgeExtractor";

interface CompleteClaimKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportData;
  onApproveKnowledge: (knowledgeItem: ClaimKnowledgeItem, updatedReport: ReportData) => void;
  onCompleteWithoutKnowledge?: (updatedReport: ReportData) => void;
}

export function CompleteClaimKnowledgeModal({
  isOpen,
  onClose,
  report,
  onApproveKnowledge,
  onCompleteWithoutKnowledge,
}: CompleteClaimKnowledgeModalProps) {
  // 초기 추출 데이터 (조사자 승인 전 기본 상태)
  const initialDraft = useMemo(() => {
    return extractKnowledgeFromReport(report);
  }, [report]);

  // ★ 중요 원칙: "원인 확인" 여부는 조사자가 명시적으로 입력/승인한 값만 저장
  const [isCauseIdentified, setIsCauseIdentified] = useState<boolean>(() => {
    return initialDraft.conclusionInfo.isCauseIdentified;
  });

  const [causeStatusLabel, setCauseStatusLabel] = useState<
    "원인 규명 완료" | "원인 미확인 / 추정" | "외력 요인 종결" | "원인 불명"
  >(() => {
    return initialDraft.conclusionInfo.causeStatusLabel;
  });

  const [causeCategory, setCauseCategory] = useState<string>(() => {
    return initialDraft.conclusionInfo.causeCategory;
  });

  const [causeDetail, setCauseDetail] = useState<string>(() => {
    return initialDraft.conclusionInfo.causeDetail;
  });

  // 활성 탭 (전체 미리보기 vs 세부 탭)
  const [activeTab, setActiveTab] = useState<"all" | "basic" | "investigation" | "result" | "conclusion" | "report">("all");

  if (!isOpen) return null;

  // 조사자 명시적 선택 반영된 실시간 Knowledge Item 산출
  const approvedCauseInput: ExplicitCauseApproval = {
    isCauseIdentified,
    causeStatusLabel,
    causeCategory,
    causeDetail,
  };

  const previewKnowledgeItem = extractKnowledgeFromReport(report, approvedCauseInput);

  const handleApprove = () => {
    // 1. 기존 보고서 상태 보존 및 완료 마킹
    const updatedReport: ReportData = {
      ...JSON.parse(JSON.stringify(report)),
      isCompleted: true,
      completedAt: new Date().toISOString(),
      investigationStatus: isCauseIdentified ? "원인 규명 완료" : "조사 완료",
      rootCauseAndActions: {
        ...report.rootCauseAndActions,
        status: isCauseIdentified ? "이상 확인" : "이상 없음",
        rootCause: causeDetail || report.rootCauseAndActions.rootCause,
      },
    };

    // 2. 승인된 지식 아이템 생성
    const finalKnowledgeItem: ClaimKnowledgeItem = {
      ...previewKnowledgeItem,
      isApprovedForKnowledge: true,
      reportSnapshot: updatedReport,
    };

    onApproveKnowledge(finalKnowledgeItem, updatedReport);
    onClose();
  };

  const handleCompleteOnly = () => {
    const updatedReport: ReportData = {
      ...JSON.parse(JSON.stringify(report)),
      isCompleted: true,
      completedAt: new Date().toISOString(),
      investigationStatus: "조사 완료 (지식화 제외)",
    };

    if (onCompleteWithoutKnowledge) {
      onCompleteWithoutKnowledge(updatedReport);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  이 클레임을 향후 유사사례 검색에 활용하시겠습니까?
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs">
                  완료 클레임 지식화
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                보고서를 완료 처리하고, 5대 핵심 조사 구조를 Knowledge 데이터베이스에 등록하여 향후 유사 클레임에 재사용합니다.
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

        {/* 탭 네비게이션 */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-blue-700 shadow-2xs font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            전체 5대 지식 한눈에 보기
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "basic"
                ? "bg-white text-blue-700 shadow-2xs font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            1. 기본정보
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("investigation")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "investigation"
                ? "bg-white text-blue-700 shadow-2xs font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            2. 조사정보 ({previewKnowledgeItem.investigationInfo.investigationItems.length}건)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("result")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "result"
                ? "bg-white text-blue-700 shadow-2xs font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            3. 결과정보 (5대 검증)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("conclusion")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === "conclusion"
                ? "bg-amber-100 text-amber-900 shadow-2xs font-black border border-amber-300"
                : "text-amber-700 hover:text-amber-900 hover:bg-amber-50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>4. 결론정보 (원인 승인)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "report"
                ? "bg-white text-blue-700 shadow-2xs font-black border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            5. 보고서 정보
          </button>
        </div>

        {/* 바디 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 알림 배너 */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">기존 보고서 보존 원칙:</span> 현재 작성된 보고서 원문은 보관함에 온전히 유지되며,
              아래의 5대 구조화된 지식 데이터만 독립된 <strong className="text-blue-950 font-black">Knowledge Base</strong>에 연결되어
              향후 유사 클레임 접수 시 최적의 조사 모델로 자동 추천됩니다.
            </div>
          </div>

          {/* 1. 기본정보 카드 */}
          {(activeTab === "all" || activeTab === "basic") && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-600 text-white">
                    1. 기본정보
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">클레임 대상 및 발생 기본 사양</h4>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  문서번호: {previewKnowledgeItem.sourceDocNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">제품명</span>
                  <strong className="text-slate-900 text-xs sm:text-sm font-bold">
                    {previewKnowledgeItem.basicInfo.productName}
                  </strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">제품 유형</span>
                  <strong className="text-slate-800 font-semibold">
                    {previewKnowledgeItem.basicInfo.productType}
                  </strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">클레임 유형</span>
                  <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200 text-xs">
                    {previewKnowledgeItem.basicInfo.claimType}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">제조처</span>
                  <span className="text-slate-800 font-medium">
                    {previewKnowledgeItem.basicInfo.manufacturer}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">제조라인</span>
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                    {previewKnowledgeItem.basicInfo.manufactureLine}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">제조번호 (Lot)</span>
                  <span className="font-mono font-bold text-blue-700">
                    {previewKnowledgeItem.basicInfo.lotNumber}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. 조사정보 카드 */}
          {(activeTab === "all" || activeTab === "investigation") && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-indigo-600 text-white">
                    2. 조사정보
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    조사항목 · 조사방법 · 관련공정 · 관련설비 · 분석방법
                  </h4>
                </div>
                <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  총 {previewKnowledgeItem.investigationInfo.investigationItems.length}개 조사 항목 도출
                </span>
              </div>

              {/* 조사 항목 구성 */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ● 조사 항목 구성 ({previewKnowledgeItem.investigationInfo.investigationItems.length}개)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {previewKnowledgeItem.investigationInfo.investigationItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* 조사 방법 및 분석기법 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <strong className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-indigo-600" />
                    <span>분석방법 및 계측기법 ({previewKnowledgeItem.investigationInfo.analysisMethods.length}종)</span>
                  </strong>
                  <div className="flex flex-wrap gap-1">
                    {previewKnowledgeItem.investigationInfo.analysisMethods.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold text-[11px] border border-indigo-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <strong className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>관련 설비 및 핵심 장치 ({previewKnowledgeItem.investigationInfo.relatedEquipments.length}대)</span>
                  </strong>
                  <div className="flex flex-wrap gap-1">
                    {previewKnowledgeItem.investigationInfo.relatedEquipments.map((eq, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 관련 공정 흐름 */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  ● 관련 공정 단계 ({previewKnowledgeItem.investigationInfo.relatedProcesses.length}개 공정)
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-800 font-medium">
                  {previewKnowledgeItem.investigationInfo.relatedProcesses.map((proc, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {proc}
                      </span>
                      {idx < previewKnowledgeItem.investigationInfo.relatedProcesses.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. 결과정보 카드 */}
          {(activeTab === "all" || activeTab === "result") && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-600 text-white">
                    3. 결과정보
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    5대 핵심 조사 결과 (보관품 · 제조기록 · 품질검사 · 공정조사 · 원부자재)
                  </h4>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* 보관품 결과 */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-slate-800">1) 보관품 조사 결과</span>
                    <p className="text-slate-600 leading-relaxed">
                      {previewKnowledgeItem.resultInfo.storageSampleResult}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      previewKnowledgeItem.resultInfo.storageSampleStatus === "이상 확인"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {previewKnowledgeItem.resultInfo.storageSampleStatus}
                  </span>
                </div>

                {/* 제조기록 결과 */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-slate-800">2) 생산일지 및 제조기록 결과</span>
                    <p className="text-slate-600 leading-relaxed">
                      {previewKnowledgeItem.resultInfo.manufacturingRecordResult}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      previewKnowledgeItem.resultInfo.manufacturingRecordStatus === "이상 확인"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {previewKnowledgeItem.resultInfo.manufacturingRecordStatus}
                  </span>
                </div>

                {/* 품질검사 결과 */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-slate-800">3) 완제품 품질검사 결과</span>
                    <p className="text-slate-600 leading-relaxed">
                      {previewKnowledgeItem.resultInfo.qualityInspectionResult}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      previewKnowledgeItem.resultInfo.qualityInspectionStatus === "이상 확인"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {previewKnowledgeItem.resultInfo.qualityInspectionStatus}
                  </span>
                </div>

                {/* 공정조사 결과 */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-slate-800">4) 제조공정 조사 결과</span>
                    <p className="text-slate-600 leading-relaxed">
                      {previewKnowledgeItem.resultInfo.processInvestigationResult}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      previewKnowledgeItem.resultInfo.processInvestigationStatus === "이상 확인"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {previewKnowledgeItem.resultInfo.processInvestigationStatus}
                  </span>
                </div>

                {/* 원부자재 결과 */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <span className="font-bold text-slate-800">5) 원부자재 조사 결과</span>
                    <p className="text-slate-600 leading-relaxed">
                      {previewKnowledgeItem.resultInfo.rawMaterialResult}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                      previewKnowledgeItem.resultInfo.rawMaterialStatus === "이상 확인"
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {previewKnowledgeItem.resultInfo.rawMaterialStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. 결론정보 카드 (★ 중요 원칙 준수 영역) */}
          {(activeTab === "all" || activeTab === "conclusion") && (
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-amber-600 text-white">
                    4. 결론정보
                  </span>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>조사자 원인 확인 여부 승인 (명시적 선택 필수)</span>
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-950">
                  원칙: 시스템 자동 확정 금지
                </span>
              </div>

              {/* 핵심 원칙 준수 안내 */}
              <div className="p-3 rounded-lg bg-amber-100/60 border border-amber-300 text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>시스템 중요 원칙:</strong> "원인 확인" 여부는 시스템이 보고서 문장만 보고 임의로 확정하지 않으며,
                  <strong> 조사자가 아래에서 직접 선택·승인한 값만 Knowledge 데이터로 영구 보관</strong>됩니다.
                </div>
              </div>

              {/* 1) 원인 확인 여부 라디오 선택 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 block">
                  ● 원인 확인 여부 (조사자 명시적 승인):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 옵션 1: 원인 규명 완료 */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isCauseIdentified && causeStatusLabel === "원인 규명 완료"
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950"
                        : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="causeStatus"
                      checked={isCauseIdentified && causeStatusLabel === "원인 규명 완료"}
                      onChange={() => {
                        setIsCauseIdentified(true);
                        setCauseStatusLabel("원인 규명 완료");
                        if (!causeCategory || causeCategory.includes("미확인") || causeCategory.includes("외력")) {
                          setCauseCategory("제조공정 결함 (설비 마모/공정 이상)");
                        }
                      }}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <strong className="text-xs font-black block">원인 규명 완료 (확인됨)</strong>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        공정, 설비, 원자재 등 명확한 인과관계 원인이 밝혀짐
                      </span>
                    </div>
                  </label>

                  {/* 옵션 2: 원인 미확인 / 추정 */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      !isCauseIdentified && causeStatusLabel === "원인 미확인 / 추정"
                        ? "bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950"
                        : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="causeStatus"
                      checked={!isCauseIdentified && causeStatusLabel === "원인 미확인 / 추정"}
                      onChange={() => {
                        setIsCauseIdentified(false);
                        setCauseStatusLabel("원인 미확인 / 추정");
                        if (!causeCategory || causeCategory.includes("제조공정")) {
                          setCauseCategory("원인 미확정 (단발성 추정 조사 종결)");
                        }
                      }}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <strong className="text-xs font-black block">원인 미확인 / 추정</strong>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        보관품 전수 이상 없으며 단발성으로 원인이 확정되지 않음
                      </span>
                    </div>
                  </label>

                  {/* 옵션 3: 외력 요인 종결 */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      !isCauseIdentified && causeStatusLabel === "외력 요인 종결"
                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400 text-blue-950"
                        : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="causeStatus"
                      checked={!isCauseIdentified && causeStatusLabel === "외력 요인 종결"}
                      onChange={() => {
                        setIsCauseIdentified(false);
                        setCauseStatusLabel("외력 요인 종결");
                        setCauseCategory("유통/보관/소비자 외력 요인");
                      }}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-xs font-black block">외력 요인 종결</strong>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        유통 중 충격, 개봉 후 보관 과실 등 외부 요인 판정
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2) 원인 유형 분류 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    ● 원인 유형 분류 (향후 유사 클레임 매칭 키워드):
                  </label>
                  <select
                    value={causeCategory}
                    onChange={(e) => setCauseCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="제조공정 결함 (충전 노즐 EPDM 고무 패킹 마모)">
                      제조공정 결함 (충전 노즐 패킹 마모/파편)
                    </option>
                    <option value="제조공정 (여과 공정 / 원료 뭉침 현상)">
                      제조공정 (여과 공정 / 원료 뭉침 현상)
                    </option>
                    <option value="제조공정 (설비 마찰 탄화물 발생)">
                      제조공정 (설비 마찰 탄화물 발생)
                    </option>
                    <option value="원부자재 결함 (공병/용기 공급처 불량)">
                      원부자재 결함 (공병/용기 공급처 불량)
                    </option>
                    <option value="유통/보관 외력 요인 (물류 충격 핀홀/누액)">
                      유통/보관 외력 요인 (물류 충격 핀홀/누액)
                    </option>
                    <option value="소비자 보관 과실 (개봉 후 상온 방치 변질)">
                      소비자 보관 과실 (개봉 후 상온 방치 변질)
                    </option>
                    <option value="천연 원료 특성 (자연 침전물 / 결정 생성)">
                      천연 원료 특성 (자연 침전물 / 결정 생성)
                    </option>
                    <option value="원인 미확정 (단발성 추정 조사 종결)">
                      원인 미확정 (단발성 추정 조사 종결)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    ● 결론 요약 (가, 나, 다):
                  </label>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 max-h-24 overflow-y-auto space-y-1">
                    {previewKnowledgeItem.conclusionInfo.conclusionSummary.map((pt, idx) => (
                      <p key={idx} className="leading-snug text-[11px]">
                        {pt}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3) 원인 상세 내용 */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  ● 조사자 승인 원인 상세 기술:
                </label>
                <textarea
                  rows={2}
                  value={causeDetail}
                  onChange={(e) => setCauseDetail(e.target.value)}
                  placeholder="조사자가 최종 확인 및 승인한 원인 판정 내용을 기술하세요."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 5. 보고서 정보 카드 */}
          {(activeTab === "all" || activeTab === "report") && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-700 text-white">
                    5. 보고서 정보
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    상용구 · 첨부자료 · 증빙사진 · 조사자 · 완료일
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">사용 상용구</span>
                  <strong className="text-blue-700 font-bold">
                    {previewKnowledgeItem.reportInfo.usedPhraseCount}건 연계
                  </strong>
                  {previewKnowledgeItem.reportInfo.usedPhrases.length > 0 && (
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {previewKnowledgeItem.reportInfo.usedPhrases.join(", ")}
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">첨부자료 문서</span>
                  <strong className="text-slate-800 font-bold">
                    {previewKnowledgeItem.reportInfo.attachmentCount}부 첨부
                  </strong>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">증빙 사진</span>
                  <strong className="text-slate-800 font-bold">
                    총 {previewKnowledgeItem.reportInfo.photoCount}장 보관
                  </strong>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">조사자 / 완료일</span>
                  <strong className="text-slate-900 block font-bold truncate">
                    {previewKnowledgeItem.reportInfo.researcherName}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {previewKnowledgeItem.reportInfo.completedDate}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 모달 하단 액션 버튼 바 */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCompleteOnly}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              title="Knowledge 데이터베이스 등록 없이 현재 보고서만 완료 처리합니다."
            >
              지식화 제외하고 보고서만 완료
            </button>
          </div>

          <button
            type="button"
            id="btn-confirm-approve-knowledge"
            onClick={handleApprove}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-600 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer ring-2 ring-emerald-300/50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>✓ 승인: Knowledge 데이터로 연결 및 조사 완료</span>
          </button>
        </div>

      </div>
    </div>
  );
}
