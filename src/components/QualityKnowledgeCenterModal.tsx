import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Package,
  Factory,
  Workflow,
  AlertOctagon,
  Sparkles,
  BookOpen,
  History,
  Database,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  ArrowLeft,
  ChevronLeft,
  Tag,
  Microscope,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  ReportData,
  ProductMaster,
  ManufacturerMaster,
  ManufactureLineMaster,
  ClaimPreset,
  StandardPhrase,
} from "../types";
import { FactoryProcessPreset, saveFactoryPreset, deleteFactoryPreset } from "../data/factoryProcessPresets";
import { saveAllPresets } from "../data/presets";
import { saveAllPhrases } from "../data/standardPhrases";
import { PastClaimItem, createCopiedClaimReport, DEFAULT_CLAIM_COPY_OPTIONS } from "../utils/pastClaimManager";
import { ClaimKnowledgeItem } from "../types/claimKnowledge";
import {
  loadCompleteKnowledgeGraph,
  InterlinkedKnowledgeGraph,
  QualityClaimTypeItem,
  getProduct360View,
  getManufacturer360View,
  getProcess360View,
  getClaimType360View,
  filterKnowledgeCenter,
  normalizeKnowledgeItem,
  KC_SEARCH_SCOPES,
} from "../utils/qualityKnowledgeGraph";
import {
  getRegistrationStatus,
  RegistrationStatusReport,
} from "../utils/seedImporter";

export type KnowledgeCenterTab =
  | "products"       // 1. 제품
  | "manufacturers"  // 2. 제조처/라인
  | "processes"      // 3. 제조공정
  | "claimTypes"     // 4. 클레임 유형
  | "templates"      // 5. 조사 템플릿
  | "phrases"        // 6. 상용구
  | "pastClaims"     // 7. 과거 클레임
  | "knowledge";     // 8. 품질 지식

interface QualityKnowledgeCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: KnowledgeCenterTab;
  currentReport: ReportData;
  onApplyProduct?: (product: ProductMaster) => void;
  onApplyProcess?: (process: FactoryProcessPreset) => void;
  onApplyPreset?: (preset: ClaimPreset) => void;
  onApplyPhrase?: (fieldKey: string, content: string) => void;
  onCopyAsNewClaim?: (pastReport: ReportData) => void;
  onUseAsInvestigationPackage?: (pastReport: ReportData) => void;
  // 각 탭 전용 관리 모달 브릿지 (CRUD 편집기는 기존 모달 재사용, 지식센터가 단일 진입점)
  onOpenProductManager?: () => void;
  onOpenManufacturerManager?: () => void;
  onOpenProcessManager?: () => void;
  onOpenPresetManager?: () => void;
  onOpenPhraseManager?: () => void;
  onOpenPastClaimSearch?: () => void;
  onOpenKnowledgeManager?: () => void;
}

interface NavigationHistoryItem {
  tab: KnowledgeCenterTab;
  selectedId: string;
}

/**
 * 지식센터 내부 오류 경계 (최후 방어선)
 * - 근본 원인 수정(정규화·방어 접근)과 별개로, 예상 못한 렌더 예외 시
 *   전체 앱 흰 화면 대신 센터 내부에 안내 + 다시 시도/닫기를 제공
 * - 데이터 쓰기·삭제 없음
 */
interface KcErrorBoundaryProps {
  onClose: () => void;
  children: React.ReactNode;
}

interface KcErrorBoundaryState {
  hasError: boolean;
}

class KcErrorBoundary extends React.Component<KcErrorBoundaryProps, KcErrorBoundaryState> {
  state: KcErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): KcErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[QC] 지식센터 렌더 오류:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-300 p-6 text-center space-y-3 text-slate-900">
          <p className="text-sm font-black">지식센터 화면을 표시하는 중 문제가 발생했습니다.</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            저장된 일부 데이터 형식이 달라 렌더링에 실패했습니다.
            <br />
            저장 데이터는 변경되지 않았습니다. 다시 시도하거나 닫았다가 열어주세요.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={this.props.onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function QualityKnowledgeCenterModal({
  isOpen,
  onClose,
  initialTab = "products",
  currentReport,
  onApplyProduct,
  onApplyProcess,
  onApplyPreset,
  onApplyPhrase,
  onCopyAsNewClaim,
  onUseAsInvestigationPackage,
  onOpenProductManager,
  onOpenManufacturerManager,
  onOpenProcessManager,
  onOpenPresetManager,
  onOpenPhraseManager,
  onOpenPastClaimSearch,
  onOpenKnowledgeManager,
}: QualityKnowledgeCenterModalProps) {
  // 전체 8대 지식 저장소 로드
  const [graph, setGraph] = useState<InterlinkedKnowledgeGraph>(() => loadCompleteKnowledgeGraph());

  // 현재 활성 탭 (1 ~ 8)
  const [activeTab, setActiveTab] = useState<KnowledgeCenterTab>(initialTab);

  // 검색어
  const [searchQuery, setSearchQuery] = useState("");

  // 각 탭별 선택된 항목 ID
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMfgId, setSelectedMfgId] = useState<string>("");
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [selectedClaimTypeId, setSelectedClaimTypeId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedPhraseId, setSelectedPhraseId] = useState<string>("");
  const [selectedPastClaimId, setSelectedPastClaimId] = useState<string>("");
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string>("");

  // 상호 연계 네비게이션 히스토리 (뒤로가기 지원)
  const [navHistory, setNavHistory] = useState<NavigationHistoryItem[]>([]);

  // 토스트 메시지
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 모달 오픈 시 데이터 갱신 및 초기 선택값 세팅
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      const freshGraph = loadCompleteKnowledgeGraph();
      setGraph(freshGraph);
      if (!selectedProductId && freshGraph.products.length > 0) {
        setSelectedProductId(freshGraph.products[0].id);
      }
      if (!selectedMfgId && freshGraph.manufacturers.length > 0) {
        setSelectedMfgId(freshGraph.manufacturers[0].id);
      }
      if (!selectedProcessId && freshGraph.processes.length > 0) {
        setSelectedProcessId(freshGraph.processes[0].id);
      }
      if (!selectedClaimTypeId && freshGraph.claimTypes.length > 0) {
        setSelectedClaimTypeId(freshGraph.claimTypes[0].id);
      }
      if (!selectedTemplateId && freshGraph.templates.length > 0) {
        setSelectedTemplateId(freshGraph.templates[0].id);
      }
      if (!selectedPhraseId && freshGraph.phrases.length > 0) {
        setSelectedPhraseId(freshGraph.phrases[0].id);
      }
      if (!selectedPastClaimId && freshGraph.pastClaims.length > 0) {
        setSelectedPastClaimId(freshGraph.pastClaims[0].id);
      }
      if (!selectedKnowledgeId && freshGraph.knowledgeItems.length > 0) {
        setSelectedKnowledgeId(freshGraph.knowledgeItems[0].id);
      }
    }
  }, [isOpen, initialTab]);

  // 상호 연계 점프 핸들러 (어떤 정보에서든 관련 정보로 1-클릭 이동)
  const navigateToEntity = (targetTab: KnowledgeCenterTab, targetId: string) => {
    // 현재 위치를 히스토리에 기록
    let currentSelectedId = "";
    if (activeTab === "products") currentSelectedId = selectedProductId;
    else if (activeTab === "manufacturers") currentSelectedId = selectedMfgId;
    else if (activeTab === "processes") currentSelectedId = selectedProcessId;
    else if (activeTab === "claimTypes") currentSelectedId = selectedClaimTypeId;
    else if (activeTab === "templates") currentSelectedId = selectedTemplateId;
    else if (activeTab === "phrases") currentSelectedId = selectedPhraseId;
    else if (activeTab === "pastClaims") currentSelectedId = selectedPastClaimId;
    else if (activeTab === "knowledge") currentSelectedId = selectedKnowledgeId;

    if (currentSelectedId) {
      setNavHistory((prev) => [...prev, { tab: activeTab, selectedId: currentSelectedId }]);
    }

    setActiveTab(targetTab);
    setSearchQuery(""); // 검색어 초기화

    if (targetTab === "products") setSelectedProductId(targetId);
    else if (targetTab === "manufacturers") setSelectedMfgId(targetId);
    else if (targetTab === "processes") setSelectedProcessId(targetId);
    else if (targetTab === "claimTypes") setSelectedClaimTypeId(targetId);
    else if (targetTab === "templates") setSelectedTemplateId(targetId);
    else if (targetTab === "phrases") setSelectedPhraseId(targetId);
    else if (targetTab === "pastClaims") setSelectedPastClaimId(targetId);
    else if (targetTab === "knowledge") setSelectedKnowledgeId(targetId);
  };

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    if (navHistory.length === 0) return;
    const last = navHistory[navHistory.length - 1];
    setNavHistory((prev) => prev.slice(0, prev.length - 1));

    setActiveTab(last.tab);
    if (last.tab === "products") setSelectedProductId(last.selectedId);
    else if (last.tab === "manufacturers") setSelectedMfgId(last.selectedId);
    else if (last.tab === "processes") setSelectedProcessId(last.selectedId);
    else if (last.tab === "claimTypes") setSelectedClaimTypeId(last.selectedId);
    else if (last.tab === "templates") setSelectedTemplateId(last.selectedId);
    else if (last.tab === "phrases") setSelectedPhraseId(last.selectedId);
    else if (last.tab === "pastClaims") setSelectedPastClaimId(last.selectedId);
    else if (last.tab === "knowledge") setSelectedKnowledgeId(last.selectedId);
  };

  // =========================================================================
  // 파생 데이터 (Hook은 조기 반환보다 앞에서 항상 같은 순서로 호출)
  // =========================================================================
  // =========================================================================
  // FILTERED LISTS (공통 검색 헬퍼 사용 — 탭별 확장 매칭, Master/승인건 분리 유지)
  // =========================================================================
  const {
    products: filteredProducts,
    manufacturers: filteredManufacturers,
    processes: filteredProcesses,
    claimTypes: filteredClaimTypes,
    templates: filteredTemplates,
    phrases: filteredPhrases,
    pastClaims: filteredPastClaims,
    knowledgeItems: filteredKnowledge,
  } = filterKnowledgeCenter(graph, searchQuery);

  // 등록 현황 (읽기 전용: 저장/Seed 미반영/연결끊김 집계)
  const registrationStatus: RegistrationStatusReport = useMemo(
    () => (isOpen ? getRegistrationStatus() : { domains: [], totalStored: 0, totalPending: 0, totalBroken: 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, graph]
  );

  // Selected Entities
  const activeProduct = graph.products.find((p) => p.id === selectedProductId) || graph.products[0];
  const activeMfg = graph.manufacturers.find((m) => m.id === selectedMfgId) || graph.manufacturers[0];
  const activeProcess = graph.processes.find((pr) => pr.id === selectedProcessId) || graph.processes[0];
  const activeClaimType = graph.claimTypes.find((ct) => ct.id === selectedClaimTypeId) || graph.claimTypes[0];
  const activeTemplate = graph.templates.find((tpl) => tpl.id === selectedTemplateId) || graph.templates[0];
  const activePhrase = graph.phrases.find((ph) => ph.id === selectedPhraseId) || graph.phrases[0];
  const activePastClaim = graph.pastClaims.find((c) => c.id === selectedPastClaimId) || graph.pastClaims[0];
  const activeKnowledgeRaw =
    graph.knowledgeItems.find((k) => k.id === selectedKnowledgeId) || graph.knowledgeItems[0];
  // 상세 화면 렌더 안전 정규화 (원본·저장 데이터 불변, 읽기 전용 복사본)
  const activeKnowledge = useMemo(
    () => (activeKnowledgeRaw ? normalizeKnowledgeItem(activeKnowledgeRaw) : activeKnowledgeRaw),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKnowledgeId, graph]
  );

  // 360 Views
  const product360 = activeProduct ? getProduct360View(activeProduct, graph) : null;
  const mfg360 = activeMfg ? getManufacturer360View(activeMfg, graph) : null;
  const process360 = activeProcess ? getProcess360View(activeProcess, graph) : null;
  const claimType360 = activeClaimType ? getClaimType360View(activeClaimType, graph) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <KcErrorBoundary onClose={onClose}>
      <div className="bg-white w-full max-w-7xl max-h-[94vh] rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden text-slate-900">
        
        {/* ========================================================================= */}
        {/* GLOBAL HEADER: TITLE + 8 MASTER MENUS + BREADCRUMB NAVIGATION */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 shrink-0 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    광동제약 품질 지식센터 (Quality Knowledge Center)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                    8대 통합 정보 상호 연계 그래프
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  제품 · 라인 · 공정 · 클레임유형 · 템플릿 · 상용구 · 과거사례 · 품질지식을 유기적으로 연결하여 탐색합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {navHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors"
                  title="이전 연계 정보로 이동"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>이전 연결 ({navHistory.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 8 MASTER TABS BAR (1 제품 → 2 제조처·라인 → 3 제조공정 → 4 프리셋 → 5 상용구 → 6 과거 클레임 → 7 지식 베이스 → 8 클레임 유형) */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-800/80 pt-2.5 text-xs font-bold scrollbar-thin">
            {/* 1. 제품 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("products");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-blue-300" />
              <span>1. 제품</span>
              <span className="text-[10px] bg-slate-950/40 text-blue-200 px-1.5 py-0.2 rounded-full">
                {graph.products.length}
              </span>
            </button>

            {/* 2. 제조처/라인 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("manufacturers");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "manufacturers"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Factory className="w-3.5 h-3.5 text-indigo-300" />
              <span>2. 제조처/라인</span>
              <span className="text-[10px] bg-slate-950/40 text-indigo-200 px-1.5 py-0.2 rounded-full">
                {graph.manufacturers.length}
              </span>
            </button>

            {/* 3. 제조공정 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("processes");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "processes"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Workflow className="w-3.5 h-3.5 text-cyan-300" />
              <span>3. 제조공정</span>
              <span className="text-[10px] bg-slate-950/40 text-cyan-200 px-1.5 py-0.2 rounded-full">
                {graph.processes.length}
              </span>
            </button>

            {/* 4. 프리셋 (조사 템플릿) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("templates");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "templates"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>4. 프리셋</span>
              <span className="text-[10px] bg-slate-950/40 text-purple-200 px-1.5 py-0.2 rounded-full">
                {graph.templates.length}
              </span>
            </button>

            {/* 5. 상용구 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("phrases");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "phrases"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>5. 상용구</span>
              <span className="text-[10px] bg-slate-950/40 text-emerald-200 px-1.5 py-0.2 rounded-full">
                {graph.phrases.length}
              </span>
            </button>

            {/* 6. 과거 클레임 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("pastClaims");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "pastClaims"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-300" />
              <span>6. 과거 클레임</span>
              <span className="text-[10px] bg-slate-950/40 text-amber-200 px-1.5 py-0.2 rounded-full">
                {graph.pastClaims.length}
              </span>
            </button>

            {/* 7. 지식 베이스 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("knowledge");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "knowledge"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-teal-300" />
              <span>7. 지식 베이스</span>
              <span className="text-[10px] bg-slate-950/40 text-teal-200 px-1.5 py-0.2 rounded-full">
                {graph.knowledgeItems.length}
              </span>
            </button>

            {/* 8. 클레임 유형 (기존 조사 항목 필터 연계 유지) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("claimTypes");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                activeTab === "claimTypes"
                  ? "bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-300" />
              <span>8. 클레임 유형</span>
              <span className="text-[10px] bg-slate-950/40 text-rose-200 px-1.5 py-0.2 rounded-full">
                {graph.claimTypes.length}
              </span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in shrink-0">
            {toastMsg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN BODY: 2-PANEL SPLIT (LEFT: ITEM LIST, RIGHT: 360° INTERLINKED DETAILS) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          
          {/* LEFT LIST PANEL */}
          <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
            {/* Search Box */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "products"
                      ? "제품명, 코드, 용량, 포장, 제조처, 라인 검색..."
                      : activeTab === "manufacturers"
                      ? "제조처명, 소재지, 품목군 검색..."
                      : activeTab === "processes"
                      ? "공정명, 흐름, 단계, 설명 검색..."
                      : activeTab === "claimTypes"
                      ? "유형명, 설명, 위험요인 검색..."
                      : activeTab === "templates"
                      ? "프리셋명, 설명, 분류 검색..."
                      : activeTab === "phrases"
                      ? "제목, 본문, 유형, 항목 검색..."
                      : activeTab === "pastClaims"
                      ? "제품, 유형, Lot, 라인, 조사자 검색..."
                      : "제품, 유형, Lot, 원인분야, 원인상세, 제조처 검색..."
                  }
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 등록 현황 (읽기 전용: 저장/미반영 Seed/연결끊김 집계) */}
            <details className="mx-3 mt-2 mb-1 rounded-lg border border-slate-200 bg-white text-xs">
              <summary className="px-2.5 py-1.5 cursor-pointer font-bold text-slate-700 list-none flex items-center justify-between">
                <span>
                  등록 현황: 저장 {registrationStatus.totalStored}건
                  {registrationStatus.totalPending > 0 && (
                    <span className="text-amber-700"> · 미반영 Seed {registrationStatus.totalPending}건</span>
                  )}
                  {registrationStatus.totalBroken > 0 && (
                    <span className="text-red-700"> · 연결끊김 {registrationStatus.totalBroken}건</span>
                  )}
                </span>
                <span className="text-slate-400">▾</span>
              </summary>
              <div className="px-2.5 pb-2 space-y-1">
                {registrationStatus.domains.map((d) => (
                  <div key={d.domain} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-slate-600">{d.domain}</span>
                    <span className="text-slate-500">
                      저장 {d.stored}건
                      {d.pending > 0 && <span className="text-amber-700"> · 미반영 {d.pending}건</span>}
                      {d.brokenLinks.length > 0 && (
                        <span className="text-red-700" title={d.brokenLinks.slice(0, 5).join("\n")}>
                          {" "}· 연결끊김 {d.brokenLinks.length}건
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {registrationStatus.totalPending > 0 && (
                  <p className="text-[10px] text-slate-400 pt-1">
                    미반영 Seed는 `?seed=demo` 1회 적용으로 반영됩니다 (기존 데이터 우선, 덮어쓰기 없음).
                  </p>
                )}
              </div>
            </details>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {/* 1. 제품 리스트 */}
              {activeTab === "products" &&
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedProductId === p.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-xs font-bold text-slate-900">{p.productName}</strong>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600">
                        {p.packageType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {p.manufacturer} · {p.manufactureLine}
                    </div>
                  </div>
                ))}

              {/* 2. 제조처 리스트 */}
              {activeTab === "manufacturers" &&
                filteredManufacturers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMfgId(m.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedMfgId === m.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-xs font-bold text-slate-900">{m.name}</strong>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          m.type === "internal"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {m.type === "internal" ? "자사" : "OEM"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {m.teamOrCategory || m.factoryLocation}
                    </div>
                  </div>
                ))}

              {/* 3. 제조공정 리스트 */}
              {activeTab === "processes" &&
                filteredProcesses.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => setSelectedProcessId(pr.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedProcessId === pr.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <strong className="text-xs font-bold text-slate-900 block truncate">{pr.name}</strong>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {(pr.processSteps || []).length}단계 공정 ({pr.teamOrCategory})
                    </div>
                  </div>
                ))}

              {/* 4. 클레임 유형 리스트 */}
              {activeTab === "claimTypes" &&
                filteredClaimTypes.map((ct) => (
                  <div
                    key={ct.id}
                    onClick={() => setSelectedClaimTypeId(ct.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedClaimTypeId === ct.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-xs font-bold text-slate-900">{ct.name}</strong>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-bold ${ct.badgeColor}`}>
                        {ct.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {ct.description}
                    </div>
                  </div>
                ))}

              {/* 5. 조사 템플릿 리스트 */}
              {activeTab === "templates" &&
                filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedTemplateId === tpl.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <strong className="text-xs font-bold text-slate-900 block truncate">{tpl.name}</strong>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {tpl.description || "표준 조사 템플릿"}
                    </div>
                  </div>
                ))}

              {/* 6. 상용구 리스트 */}
              {activeTab === "phrases" &&
                filteredPhrases.map((ph) => (
                  <div
                    key={ph.id}
                    onClick={() => setSelectedPhraseId(ph.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedPhraseId === ph.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <strong className="text-xs font-bold text-slate-900 block truncate">{ph.title}</strong>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {ph.content}
                    </div>
                  </div>
                ))}

              {/* 7. 과거 클레임 리스트 */}
              {activeTab === "pastClaims" &&
                filteredPastClaims.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedPastClaimId(c.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedPastClaimId === c.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-xs font-bold text-slate-900 truncate">{c.productName}</strong>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold shrink-0">
                        {c.claimType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {c.receivedAt} · {c.manufactureLine} · {c.lotNumber}
                    </div>
                  </div>
                ))}

              {/* 8. 품질 지식 리스트 */}
              {activeTab === "knowledge" &&
                filteredKnowledge.map((k) => (
                  <div
                    key={k.id}
                    onClick={() => setSelectedKnowledgeId(k.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedKnowledgeId === k.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-xs font-bold text-slate-900 truncate">{k.basicInfo.productName}</strong>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                          k.conclusionInfo.isCauseIdentified
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {k.conclusionInfo.isCauseIdentified ? "규명 완료" : "미확인"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {k.basicInfo.claimType} · {k.conclusionInfo.causeCategory}
                    </div>
                  </div>
                ))}

            </div>

            {/* 빈 결과 안내 (검색 범위 + 상태 명시) */}
            {(() => {
              const counts: Record<string, number> = {
                products: filteredProducts.length,
                manufacturers: filteredManufacturers.length,
                processes: filteredProcesses.length,
                claimTypes: filteredClaimTypes.length,
                templates: filteredTemplates.length,
                phrases: filteredPhrases.length,
                pastClaims: filteredPastClaims.length,
                knowledge: filteredKnowledge.length,
              };
              if ((counts[activeTab] || 0) > 0) return null;
              return (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                  <p className="font-bold text-slate-700">
                    {searchQuery.trim()
                      ? `“${searchQuery.trim()}”에 대한 검색 결과가 없습니다.`
                      : "등록된 항목이 없습니다."}
                  </p>
                  <p className="mt-1">
                    검색 범위: {KC_SEARCH_SCOPES[activeTab] || ""}
                  </p>
                  {activeTab === "pastClaims" && (
                    <p className="mt-1 text-[11px]">
                      과거 클레임은 승인된 지식·보관함 보고서·완료 사례에서 구성됩니다 (미승인 지식 제외).
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* RIGHT 360° INTERLINKED KNOWLEDGE VIEW PANEL */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100 space-y-5">

            {/* ========================================================================= */}
            {/* VIEW 1: 제품 360° 연계 상세 화면 (사용자 예시 완벽 구현) */}
            {/* ========================================================================= */}
            {activeTab === "products" && product360 && (
              <div className="space-y-4">
                {/* 상단 타이틀 카드 */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        <Package className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{product360.product.productName}]
                      </h2>
                      <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                        {product360.product.productCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {product360.product.description || "광동제약 표준 제품 마스터"}
                    </p>
                  </div>

                  {onApplyProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyProduct(product360.product);
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      현재 보고서에 이 제품 적용
                    </button>
                  )}
                  {onOpenProductManager && (
                    <button
                      type="button"
                      onClick={onOpenProductManager}
                      className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      title="제품 추가·수정·비활성화 관리창 열기"
                    >
                      제품 관리
                    </button>
                  )}
                </div>

                {/* 1. 기본정보 카드 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>기본정보</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div
                      onClick={() => product360.manufacturer && navigateToEntity("manufacturers", product360.manufacturer.id)}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <span className="text-[11px] text-slate-500 block">제조처</span>
                      <strong className="text-blue-700 font-bold flex items-center gap-1">
                        <span>{product360.product.manufacturer}</span>
                        <ChevronRight className="w-3 h-3" />
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">제조라인</span>
                      <strong className="text-slate-800 font-bold">{product360.product.manufactureLine}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">제품 유형</span>
                      <span className="text-slate-800 font-semibold">{product360.product.productType}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">포장 규격 / 용량</span>
                      <span className="text-slate-800 font-semibold">{product360.product.packageType} ({product360.product.volume || "규격"})</span>
                    </div>
                  </div>
                </div>

                {/* 2. 관련 제조공정 카드 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-cyan-600" />
                      <span>관련 제조공정</span>
                    </h4>
                    {product360.process && (
                      <button
                        type="button"
                        onClick={() => navigateToEntity("processes", product360.process!.id)}
                        className="text-[11px] font-bold text-cyan-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>제조공정 탭에서 자세히 보기</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {product360.process ? (
                    <div
                      onClick={() => navigateToEntity("processes", product360.process!.id)}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-cyan-400 transition-colors cursor-pointer space-y-1.5"
                    >
                      <strong className="text-xs font-bold text-slate-900 block">{product360.process.name}</strong>
                      <p className="text-xs text-slate-600 font-medium">
                        {product360.process.processFlow}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span>여과: {product360.process.filtrationAnalysis?.slice(0, 30)}...</span>
                        <span>·</span>
                        <span>CCP: {product360.process.criticalControlPoint?.slice(0, 30)}...</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 p-2">연결된 제조공정도가 없습니다.</p>
                  )}
                </div>

                {/* 3. 관련 클레임 유형 카드 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    <span>관련 클레임 유형 ({product360.linkedClaimTypes.length}개)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product360.linkedClaimTypes.map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => navigateToEntity("claimTypes", ct.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1 ${ct.badgeColor}`}
                      >
                        <span>{ct.name}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. 관련 조사 템플릿 카드 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>관련 조사 템플릿 ({product360.templates.length}건)</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product360.templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => navigateToEntity("templates", tpl.id)}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 cursor-pointer transition-colors space-y-0.5"
                      >
                        <strong className="text-xs font-bold text-slate-900 block truncate">{tpl.name}</strong>
                        <span className="text-[11px] text-slate-500 block truncate">{tpl.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. 관련 상용구 (12개) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>관련 상용구 ({product360.phrases.length}개)</span>
                    </h4>
                    {product360.phrases.length > 0 && (
                      <button
                        type="button"
                        onClick={() => navigateToEntity("phrases", product360.phrases[0].id)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>상용구 탭에서 전체 확인</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product360.phrases.slice(0, 8).map((ph) => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => navigateToEntity("phrases", ph.id)}
                        className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:border-emerald-300 text-xs font-medium text-slate-800 transition-colors cursor-pointer text-left truncate max-w-xs"
                      >
                        ● {ph.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. 과거 클레임 (35건) & 7. 관련 품질지식 (8건) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 과거 클레임 */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-amber-600" />
                        <span>과거 클레임 이력 ({product360.pastClaims.length}건)</span>
                      </h4>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {product360.pastClaims.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => navigateToEntity("pastClaims", c.id)}
                          className="p-2 rounded bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{c.claimType}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{c.receivedAt}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{c.claimDetailsSnippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 관련 품질지식 */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-teal-600" />
                        <span>관련 품질 지식 ({product360.knowledgeItems.length}건)</span>
                      </h4>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {product360.knowledgeItems.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => navigateToEntity("knowledge", k.id)}
                          className="p-2 rounded bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-teal-900">{k.basicInfo.claimType}</span>
                            <span className="text-[10px] px-1 rounded bg-teal-100 text-teal-800 font-semibold">
                              {k.conclusionInfo.causeStatusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{k.conclusionInfo.causeCategory}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: 제조처/라인 360° 연계 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "manufacturers" && mfg360 && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        <Factory className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{mfg360.mfg.name}]
                      </h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          mfg360.mfg.type === "internal"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {mfg360.mfg.type === "internal" ? "자사 공장" : "외주(OEM) 생산 협력처"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      소재지: {mfg360.mfg.factoryLocation || "위치 정보 미기재"} · {mfg360.mfg.teamOrCategory}
                    </p>
                  </div>
                  {onOpenManufacturerManager && (
                    <button
                      type="button"
                      onClick={onOpenManufacturerManager}
                      className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="제조처·라인 추가·수정·비활성화 관리창 열기"
                    >
                      제조처·라인 관리
                    </button>
                  )}
                </div>

                {/* 제조라인 목록 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">보유 제조라인 ({mfg360.lines.length}개 라인)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {mfg360.lines.map((l) => (
                      <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                        <strong className="text-slate-900 font-bold block">{l.lineName}</strong>
                        <span className="text-[11px] text-slate-500 block">{l.productCategory} · {l.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 생산 대상 제품 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">생산 대상 제품 ({mfg360.products.length}종)</h4>
                  <div className="flex flex-wrap gap-2">
                    {mfg360.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigateToEntity("products", p.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-bold text-blue-900 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span>{p.productName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 연계 제조공정 */}
                {mfg360.process && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">표준 제조공정도</h4>
                    <div
                      onClick={() => navigateToEntity("processes", mfg360.process!.id)}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-cyan-400 transition-colors cursor-pointer space-y-1"
                    >
                      <strong className="text-xs font-bold text-slate-900 block">{mfg360.process.name}</strong>
                      <p className="text-xs text-slate-600">{mfg360.process.processFlow}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: 제조공정 360° 연계 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "processes" && process360 && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                        <Workflow className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{process360.process.name}]
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      공정 구분: {process360.process.teamOrCategory} · {process360.process.description}
                    </p>
                  </div>

                  {onApplyProcess && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyProcess(process360.process);
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      보고서에 이 제조공정도 적용
                    </button>
                  )}
                  {onOpenProcessManager && (
                    <button
                      type="button"
                      onClick={onOpenProcessManager}
                      className="px-3 py-2 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors cursor-pointer"
                      title="제조공정도 추가·수정·삭제 관리창 열기"
                    >
                      공정 관리
                    </button>
                  )}
                </div>

                {/* 공정 흐름도 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">공정 흐름 단계 ({(process360.process.processSteps || []).length}단계)</h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-800 font-medium">
                    {(process360.process.processSteps || []).map((st, i, arr) => (
                      <React.Fragment key={i}>
                        <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                          {i + 1}. {st}
                        </span>
                        {i < arr.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* 핵심 제어 기준 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-800 font-bold block">1. 여과망(Mesh) 및 이물 차단 기준</strong>
                    <p className="text-slate-600 leading-relaxed">{process360.process.filtrationAnalysis}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-800 font-bold block">2. 중요 관리점 (CCP)</strong>
                    <p className="text-slate-600 leading-relaxed">{process360.process.criticalControlPoint}</p>
                  </div>
                </div>

                {/* 관련 적용 제품 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">적용 제품 ({process360.products.length}종)</h4>
                  <div className="flex flex-wrap gap-2">
                    {process360.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigateToEntity("products", p.id)}
                        className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 transition-colors cursor-pointer"
                      >
                        {p.productName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 4: 클레임 유형 360° 연계 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "claimTypes" && claimType360 && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                        <AlertOctagon className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{claimType360.claimType.name}]
                      </h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${claimType360.claimType.badgeColor}`}>
                        위험도: {claimType360.claimType.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{claimType360.claimType.description}</p>
                  </div>
                </div>

                {/* 주요 원인 가설 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">주요 발생 원인 및 취약 포인트</h4>
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                    {claimType360.claimType.commonRootCauses.map((rc, i) => (
                      <li key={i}>{rc}</li>
                    ))}
                  </ul>
                </div>

                {/* 관련 적용 제품 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">주요 연관 제품 ({claimType360.products.length}종)</h4>
                  <div className="flex flex-wrap gap-2">
                    {claimType360.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigateToEntity("products", p.id)}
                        className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 transition-colors cursor-pointer"
                      >
                        {p.productName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 과거 클레임 및 지식 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">과거 발생 사례 ({claimType360.pastClaims.length}건)</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                      {claimType360.pastClaims.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => navigateToEntity("pastClaims", c.id)}
                          className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer truncate"
                        >
                          ● {c.productName} ({c.receivedAt})
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">연계 품질 지식 ({claimType360.knowledgeItems.length}건)</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
                      {claimType360.knowledgeItems.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => navigateToEntity("knowledge", k.id)}
                          className="p-1.5 rounded bg-teal-50 hover:bg-teal-100 cursor-pointer truncate text-teal-900"
                        >
                          ● {k.basicInfo.productName}: {k.conclusionInfo.causeCategory}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 5: 조사 템플릿 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "templates" && activeTemplate && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{activeTemplate.name}]
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500">{activeTemplate.description}</p>
                  </div>

                  {onApplyPreset && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPreset(activeTemplate);
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      현재 작성 중인 보고서에 적용
                    </button>
                  )}
                  {onOpenPresetManager && (
                    <button
                      type="button"
                      onClick={onOpenPresetManager}
                      className="px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                      title="프리셋 추가·수정·삭제 관리창 열기"
                    >
                      프리셋 관리
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">템플릿 기본 원인 판정문:</span>
                    <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
                      {activeTemplate.data?.rootCauseAndActions?.rootCause || "등록된 표준 원인 문구"}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1">재발방지대책:</span>
                    <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
                      {activeTemplate.data?.rootCauseAndActions?.preventiveMeasures || "등록된 대책 문구"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 6: 상용구 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "phrases" && activePhrase && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{activePhrase.title}]
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                        적용 위치: {activePhrase.fieldKey}
                      </span>
                    </div>
                  </div>

                  {onApplyPhrase && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPhrase(activePhrase.fieldKey, activePhrase.content);
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      현재 보고서에 삽입
                    </button>
                  )}
                  {onOpenPhraseManager && (
                    <button
                      type="button"
                      onClick={onOpenPhraseManager}
                      className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      title="상용구 추가·수정·삭제 관리창 열기"
                    >
                      상용구 관리
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">상용구 본문:</h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {activePhrase.content}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 7: 과거 클레임 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "pastClaims" && activePastClaim && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                        <History className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{activePastClaim.productName}] {activePastClaim.claimType}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-50 text-amber-900 font-bold border border-amber-200">
                        {activePastClaim.lotNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      접수일자: {activePastClaim.receivedAt} · 제조라인: {activePastClaim.manufactureLine} · 조사자: {activePastClaim.researcherName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onUseAsInvestigationPackage && activePastClaim.report && (
                      <button
                        type="button"
                        onClick={() => {
                          onUseAsInvestigationPackage(activePastClaim.report);
                          onClose();
                        }}
                        className="px-3.5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-lg shadow-xs border border-amber-300 active:scale-95 cursor-pointer"
                      >
                        이 사례를 조사 패키지로 사용
                      </button>
                    )}
                    {onCopyAsNewClaim && activePastClaim.report && (
                      <button
                        type="button"
                        onClick={() => {
                          // 원본 ID 재사용 금지: 기본 복사 옵션으로 새 ID/문서번호 발급 후 복사
                          const copied = createCopiedClaimReport(activePastClaim.report, DEFAULT_CLAIM_COPY_OPTIONS);
                          onCopyAsNewClaim(copied);
                          onClose();
                        }}
                        className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        새 클레임으로 복사
                      </button>
                    )}
                    {onOpenPastClaimSearch && (
                      <button
                        type="button"
                        onClick={onOpenPastClaimSearch}
                        className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        title="조건 검색·복사 옵션 등 상세 검색 관리창 열기"
                      >
                        상세 검색
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">클레임 인입 상세:</span>
                    <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                      {activePastClaim.claimDetailsSnippet}
                    </p>
                  </div>

                  {activePastClaim.report?.rootCauseAndActions?.rootCause && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">조사 원인 판정:</span>
                      <p className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-950 leading-relaxed">
                        {activePastClaim.report.rootCauseAndActions.rootCause}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 8: 품질 지식(Knowledge) 상세 화면 */}
            {/* ========================================================================= */}
            {activeTab === "knowledge" && activeKnowledge && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                        <Database className="w-4 h-4" />
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        [{activeKnowledge.basicInfo.productName}] 구조화 지식
                      </h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeKnowledge.conclusionInfo.isCauseIdentified
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {activeKnowledge.conclusionInfo.causeStatusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      등록일: {activeKnowledge.reportInfo.completedDate} · 조사자: {activeKnowledge.reportInfo.researcherName}
                    </p>
                  </div>

                  {onUseAsInvestigationPackage && activeKnowledge.reportSnapshot && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseAsInvestigationPackage(activeKnowledge.reportSnapshot);
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      이 지식을 조사 패키지로 사용
                    </button>
                  )}
                  {onOpenKnowledgeManager && (
                    <button
                      type="button"
                      onClick={onOpenKnowledgeManager}
                      className="px-3 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                      title="지식 검색·삭제 관리창 열기"
                    >
                      지식 관리
                    </button>
                  )}
                </div>

                {/* 5대 구조화 내용 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 조사 항목 및 분석방법 */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <strong className="text-slate-800 font-bold block">조사항목 ({activeKnowledge.investigationInfo.investigationItems.length}개)</strong>
                    <div className="flex flex-wrap gap-1">
                      {activeKnowledge.investigationInfo.investigationItems.map((itm: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700">
                          ✓ {itm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 5대 결과정보 */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <strong className="text-slate-800 font-bold block">5대 조사 결과 판정</strong>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      <li>● 보관품: <strong className="text-emerald-700">{activeKnowledge.resultInfo.storageSampleStatus}</strong></li>
                      <li>● 제조기록: <strong className="text-emerald-700">{activeKnowledge.resultInfo.manufacturingRecordStatus}</strong></li>
                      <li>● 품질검사: <strong className="text-emerald-700">{activeKnowledge.resultInfo.qualityInspectionStatus}</strong></li>
                      <li>● 공정조사: <strong className="text-emerald-700">{activeKnowledge.resultInfo.processInvestigationStatus}</strong></li>
                    </ul>
                  </div>
                </div>

                {/* 승인된 원인 판정 */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5 text-amber-950">
                  <strong className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>조사자 직접 승인 원인 판정</span>
                  </strong>
                  <p className="text-slate-800 leading-relaxed text-[11px] whitespace-pre-line">
                    {activeKnowledge.conclusionInfo.causeDetail}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">8대 지식 저장소:</span>
            <span>제품 {graph.products.length}</span>
            <span>·</span>
            <span>제조처 {graph.manufacturers.length}</span>
            <span>·</span>
            <span>공정 {graph.processes.length}</span>
            <span>·</span>
            <span>유형 {graph.claimTypes.length}</span>
            <span>·</span>
            <span>템플릿 {graph.templates.length}</span>
            <span>·</span>
            <span>상용구 {graph.phrases.length}</span>
            <span>·</span>
            <span>과거사례 {graph.pastClaims.length}</span>
            <span>·</span>
            <span>품질지식 {graph.knowledgeItems.length}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
      </KcErrorBoundary>
    </div>
  );
}
