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
import { PastClaimItem } from "../utils/pastClaimManager";
import { ClaimKnowledgeItem } from "../types/claimKnowledge";
import {
  loadCompleteKnowledgeGraph,
  InterlinkedKnowledgeGraph,
  QualityClaimTypeItem,
  getProduct360View,
  getManufacturer360View,
  getProcess360View,
  getClaimType360View,
} from "../utils/qualityKnowledgeGraph";

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
}

interface NavigationHistoryItem {
  tab: KnowledgeCenterTab;
  selectedId: string;
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
  }, [isOpen]);

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

  if (!isOpen) return null;

  // =========================================================================
  // FILTERED LISTS
  // =========================================================================
  const q = searchQuery.toLowerCase().trim();

  const filteredProducts = graph.products.filter((p) => {
    if (!q) return true;
    return (
      p.productName.toLowerCase().includes(q) ||
      p.manufacturer.toLowerCase().includes(q) ||
      p.manufactureLine.toLowerCase().includes(q) ||
      (p.subProductType || "").toLowerCase().includes(q) ||
      (p.primaryClaimTypes || []).some((ct) => ct.toLowerCase().includes(q))
    );
  });

  const filteredManufacturers = graph.manufacturers.filter((m) => {
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || (m.factoryLocation || "").toLowerCase().includes(q);
  });

  const filteredProcesses = graph.processes.filter((pr) => {
    if (!q) return true;
    return pr.name.toLowerCase().includes(q) || pr.processFlow.toLowerCase().includes(q);
  });

  const filteredClaimTypes = graph.claimTypes.filter((ct) => {
    if (!q) return true;
    return ct.name.toLowerCase().includes(q) || ct.description.toLowerCase().includes(q);
  });

  const filteredTemplates = graph.templates.filter((tpl) => {
    if (!q) return true;
    return tpl.name.toLowerCase().includes(q) || (tpl.description || "").toLowerCase().includes(q);
  });

  const filteredPhrases = graph.phrases.filter((ph) => {
    if (!q) return true;
    return ph.title.toLowerCase().includes(q) || ph.content.toLowerCase().includes(q);
  });

  const filteredPastClaims = graph.pastClaims.filter((c) => {
    if (!q) return true;
    return (
      c.productName.toLowerCase().includes(q) ||
      c.claimType.toLowerCase().includes(q) ||
      c.lotNumber.toLowerCase().includes(q) ||
      c.manufactureLine.toLowerCase().includes(q)
    );
  });

  const filteredKnowledge = graph.knowledgeItems.filter((k) => {
    if (!q) return true;
    return (
      k.basicInfo.productName.toLowerCase().includes(q) ||
      k.basicInfo.claimType.toLowerCase().includes(q) ||
      k.basicInfo.lotNumber.toLowerCase().includes(q) ||
      k.conclusionInfo.causeCategory.toLowerCase().includes(q)
    );
  });

  // Selected Entities
  const activeProduct = graph.products.find((p) => p.id === selectedProductId) || graph.products[0];
  const activeMfg = graph.manufacturers.find((m) => m.id === selectedMfgId) || graph.manufacturers[0];
  const activeProcess = graph.processes.find((pr) => pr.id === selectedProcessId) || graph.processes[0];
  const activeClaimType = graph.claimTypes.find((ct) => ct.id === selectedClaimTypeId) || graph.claimTypes[0];
  const activeTemplate = graph.templates.find((tpl) => tpl.id === selectedTemplateId) || graph.templates[0];
  const activePhrase = graph.phrases.find((ph) => ph.id === selectedPhraseId) || graph.phrases[0];
  const activePastClaim = graph.pastClaims.find((c) => c.id === selectedPastClaimId) || graph.pastClaims[0];
  const activeKnowledge = graph.knowledgeItems.find((k) => k.id === selectedKnowledgeId) || graph.knowledgeItems[0];

  // 360 Views
  const product360 = activeProduct ? getProduct360View(activeProduct, graph) : null;
  const mfg360 = activeMfg ? getManufacturer360View(activeMfg, graph) : null;
  const process360 = activeProcess ? getProcess360View(activeProcess, graph) : null;
  const claimType360 = activeClaimType ? getClaimType360View(activeClaimType, graph) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
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

          {/* 8 MASTER TABS BAR (사용자 요청 메뉴 순서 1 ~ 8 준수) */}
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

            {/* 4. 클레임 유형 */}
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
              <span>4. 클레임 유형</span>
              <span className="text-[10px] bg-slate-950/40 text-rose-200 px-1.5 py-0.2 rounded-full">
                {graph.claimTypes.length}
              </span>
            </button>

            {/* 5. 조사 템플릿 */}
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
              <span>5. 조사 템플릿</span>
              <span className="text-[10px] bg-slate-950/40 text-purple-200 px-1.5 py-0.2 rounded-full">
                {graph.templates.length}
              </span>
            </button>

            {/* 6. 상용구 */}
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
              <span>6. 상용구</span>
              <span className="text-[10px] bg-slate-950/40 text-emerald-200 px-1.5 py-0.2 rounded-full">
                {graph.phrases.length}
              </span>
            </button>

            {/* 7. 과거 클레임 */}
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
              <span>7. 과거 클레임</span>
              <span className="text-[10px] bg-slate-950/40 text-amber-200 px-1.5 py-0.2 rounded-full">
                {graph.pastClaims.length}
              </span>
            </button>

            {/* 8. 품질 지식 */}
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
              <span>8. 품질 지식</span>
              <span className="text-[10px] bg-slate-950/40 text-teal-200 px-1.5 py-0.2 rounded-full">
                {graph.knowledgeItems.length}
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
                      ? "제품명, 제조처, 라인 검색..."
                      : activeTab === "manufacturers"
                      ? "제조처명, 소재지 검색..."
                      : activeTab === "processes"
                      ? "공정명, 공정단계 검색..."
                      : activeTab === "claimTypes"
                      ? "클레임 유형 검색..."
                      : activeTab === "templates"
                      ? "조사 템플릿 검색..."
                      : activeTab === "phrases"
                      ? "상용구 제목, 본문 검색..."
                      : activeTab === "pastClaims"
                      ? "과거 사례 제품, Lot 검색..."
                      : "품질 지식 검색..."
                  }
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

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
                      {pr.processSteps.length}단계 공정 ({pr.teamOrCategory})
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
                </div>

                {/* 공정 흐름도 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">공정 흐름 단계 ({process360.process.processSteps.length}단계)</h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-800 font-medium">
                    {process360.process.processSteps.map((st, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                          {i + 1}. {st}
                        </span>
                        {i < process360.process.processSteps.length - 1 && (
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
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">템플릿 기본 원인 판정문:</span>
                    <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
                      {activeTemplate.data.rootCauseAndActions?.rootCause || "등록된 표준 원인 문구"}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1">재발방지대책:</span>
                    <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
                      {activeTemplate.data.rootCauseAndActions?.preventiveMeasures || "등록된 대책 문구"}
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
                          onCopyAsNewClaim(activePastClaim.report);
                          onClose();
                        }}
                        className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        새 클레임으로 복사
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
    </div>
  );
}
