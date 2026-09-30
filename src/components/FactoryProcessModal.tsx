import { useState, useEffect } from "react";
import {
  X,
  Factory,
  Save,
  RotateCcw,
  Check,
  Building2,
  Workflow,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Edit3,
  SlidersHorizontal,
} from "lucide-react";
import {
  FactoryProcessPreset,
  loadAllFactoryPresets,
  saveFactoryPreset,
  deleteFactoryPreset,
  resetFactoryPresets,
} from "../data/factoryProcessPresets";
import { ProcessStepMaster } from "../types";
import {
  getProcessStepsByPreset,
  saveProcessStep,
  saveAllProcessSteps,
  loadAllProcessSteps,
} from "../data/processStepMaster";
import { ProcessStepDetailModal } from "./ProcessStepDetailModal";

interface FactoryProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentManufacturer: string;
  onApplyProcess: (factory: FactoryProcessPreset) => void;
}

export function FactoryProcessModal({
  isOpen,
  onClose,
  currentManufacturer,
  onApplyProcess,
}: FactoryProcessModalProps) {
  const [presets, setPresets] = useState<FactoryProcessPreset[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "oem" | "custom">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPreset, setEditingPreset] = useState<FactoryProcessPreset | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Structured Process Step Master states
  const [structuredSteps, setStructuredSteps] = useState<ProcessStepMaster[]>([]);
  const [selectedStepForDetail, setSelectedStepForDetail] = useState<ProcessStepMaster | null>(null);
  const [isStepDetailOpen, setIsStepDetailOpen] = useState(false);
  const [showStructuredTable, setShowStructuredTable] = useState(true);

  // Sync structured steps whenever editingPreset changes
  useEffect(() => {
    if (editingPreset) {
      const steps = getProcessStepsByPreset(editingPreset);
      setStructuredSteps(steps);
    } else {
      setStructuredSteps([]);
    }
  }, [editingPreset?.id, editingPreset?.processFlow]);

  const handleOpenStepDetail = (step: ProcessStepMaster) => {
    setSelectedStepForDetail(step);
    setIsStepDetailOpen(true);
  };

  const handleStepUpdated = (updated: ProcessStepMaster) => {
    const next = structuredSteps.map((s) => (s.id === updated.id ? updated : s));
    setStructuredSteps(next);
    // If the step name changed, sync editingPreset.processSteps and processFlow as well
    if (editingPreset) {
      const newStepNames = next.map((s) => s.processName);
      setEditingPreset({
        ...editingPreset,
        processSteps: newStepNames,
        processFlow: newStepNames.join(" → "),
      });
    }
    showToast(`'${updated.processName}' 공정 정보가 갱신되었습니다.`);
  };

  const handleAddNewStep = () => {
    if (!editingPreset) return;
    const nextNumber = structuredSteps.length + 1;
    const newStep: ProcessStepMaster = {
      id: `step-${editingPreset.id}-${String(nextNumber).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
      presetId: editingPreset.id,
      manufacturer: editingPreset.name,
      manufactureLine: editingPreset.teamOrCategory || "표준 생산라인",
      stepNumber: nextNumber,
      processName: `신규 공정 ${nextNumber}`,
      description: `${editingPreset.name}의 ${nextNumber}번째 공정입니다.`,
      keyEquipment: "자동화 생산 설비",
      controlPoints: "표준 공정 작업 기준서(SOP) 준수",
      isCCP: false,
      qualityRisks: "공정 작업 기준 미준수 리스크",
      possibleDefects: ["품질 이상"],
      isActive: true,
      isCustom: true,
    };
    saveProcessStep(newStep);
    const updatedList = [...structuredSteps, newStep];
    setStructuredSteps(updatedList);
    const newStepNames = updatedList.map((s) => s.processName);
    setEditingPreset({
      ...editingPreset,
      processSteps: newStepNames,
      processFlow: newStepNames.join(" → "),
    });
    setSelectedStepForDetail(newStep);
    setIsStepDetailOpen(true);
  };

  const reloadPresets = (selectPresetId?: string) => {
    const all = loadAllFactoryPresets();
    setPresets(all);
    if (selectPresetId) {
      const match = all.find((p) => p.id === selectPresetId);
      if (match) {
        setSelectedId(match.id);
        setEditingPreset({ ...match });
        setIsCreatingNew(false);
        return;
      }
    }
    if (all.length > 0) {
      const first = all[0];
      setSelectedId(first.id);
      setEditingPreset({ ...first });
    } else {
      setSelectedId("");
      setEditingPreset(null);
    }
    setIsCreatingNew(false);
  };

  useEffect(() => {
    if (isOpen) {
      const all = loadAllFactoryPresets();
      setPresets(all);

      // Find match with currentManufacturer
      const match = all.find(
        (p) =>
          p.name === currentManufacturer ||
          (currentManufacturer && currentManufacturer.includes(p.name)) ||
          (currentManufacturer && p.name.includes(currentManufacturer))
      );
      const initial = match ? match : all[0];
      if (initial) {
        setSelectedId(initial.id);
        setEditingPreset({ ...initial });
      }
      setIsCreatingNew(false);
      setConfirmDeleteId(null);
    }
  }, [isOpen, currentManufacturer]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  if (!isOpen) return null;

  const filtered = presets.filter((p) => {
    if (filterType === "internal" && p.type !== "internal") return false;
    if (filterType === "oem" && p.type !== "oem") return false;
    if (filterType === "custom" && !p.isCustom) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.teamOrCategory && p.teamOrCategory.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.processFlow && p.processFlow.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSelectPreset = (p: FactoryProcessPreset) => {
    setIsCreatingNew(false);
    setSelectedId(p.id);
    setEditingPreset({ ...p });
    setConfirmDeleteId(null);
  };

  const handleStartCreateNew = () => {
    const newId = `custom-process-${Date.now()}`;
    const newPreset: FactoryProcessPreset = {
      id: newId,
      name: "",
      type: "oem",
      teamOrCategory: "",
      description: "",
      processFlow: "원료 입고 및 칭량 → 추출 및 배합 → 여과망 통과 → 살균 공정 → 세척 및 충진 → 캡핑 밀봉 → 금속검출기/이물검사 → 포장",
      processSteps: [
        "원료 입고 및 칭량",
        "추출 및 배합",
        "여과망 통과",
        "살균 공정",
        "세척 및 충진",
        "캡핑 밀봉",
        "금속검출기/이물검사",
        "포장",
      ],
      filtrationAnalysis: "원료 투입 및 배합 공정 후 정밀 스트레이너/카트리지 필터를 통과하여 이물 혼입을 차단함.",
      cleaningAnalysis: "충진 직전 용기 및 캡 정밀 세척/린싱을 통하여 이물을 제거함.",
      criticalControlPoint: "살균 온도 모니터링(CCP-1B) 및 포장 전 금속검출기 전수 검사(CCP-2P) 적합.",
      isCustom: true,
    };
    setIsCreatingNew(true);
    setSelectedId(newId);
    setEditingPreset(newPreset);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = () => {
    if (!editingPreset) return;
    if (!editingPreset.name.trim()) {
      alert("제조처 또는 템플릿 명칭을 입력해 주세요.");
      return;
    }

    // Ensure steps are updated
    const steps = editingPreset.processFlow
      .split(/→|->/)
      .map((s) => s.trim())
      .filter(Boolean);

    const toSave: FactoryProcessPreset = {
      ...editingPreset,
      name: editingPreset.name.trim(),
      processSteps: steps.length > 0 ? steps : [editingPreset.name],
      isCustom: true,
    };

    saveFactoryPreset(toSave);
    reloadPresets(toSave.id);
    showToast(`"${toSave.name}" 공정도 템플릿이 저장되었습니다.`);
  };

  const handleDelete = (id: string) => {
    const target = presets.find((p) => p.id === id);
    const targetName = target ? target.name : "선택한";
    deleteFactoryPreset(id);
    reloadPresets();
    setConfirmDeleteId(null);
    showToast(`"${targetName}" 공정도 템플릿이 삭제되었습니다.`);
  };

  const handleApply = () => {
    if (!editingPreset) return;
    if (!editingPreset.name.trim()) {
      alert("제조처명을 입력 후 적용해 주세요.");
      return;
    }
    // Automatically save changes before applying
    const steps = editingPreset.processFlow
      .split(/→|->/)
      .map((s) => s.trim())
      .filter(Boolean);

    const toApply: FactoryProcessPreset = {
      ...editingPreset,
      name: editingPreset.name.trim(),
      processSteps: steps.length > 0 ? steps : [editingPreset.name],
    };

    saveFactoryPreset(toApply);
    onApplyProcess(toApply);
    showToast(`"${toApply.name}" 공정도가 보고서에 적용되었습니다.`);
    setTimeout(() => onClose(), 400);
  };

  const handleResetDefaults = () => {
    if (confirm("모든 제조공정도 템플릿을 표준 기본값(자사 2개소 + 외주 14개소)으로 초기화하시겠습니까?\n\n직접 추가하거나 수정한 템플릿도 초기화됩니다.")) {
      resetFactoryPresets();
      reloadPresets();
      showToast("표준 공정도 기본 템플릿으로 초기화되었습니다.");
    }
  };

  // Convert line breaks to arrows
  const handleConvertNewlinesToArrows = () => {
    if (!editingPreset) return;
    const lines = editingPreset.processFlow
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\d\s.\-•*)]+/, "").trim())
      .filter(Boolean);
    if (lines.length > 1) {
      const converted = lines.join(" → ");
      setEditingPreset({
        ...editingPreset,
        processFlow: converted,
        processSteps: lines,
      });
      showToast("줄바꿈 단계들을 '→' 연결 형식으로 자동 변환하였습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Workflow className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>제조공정도 관리 &amp; 템플릿 설정</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-medium">
                  추가 · 수정 · 삭제 지원
                </span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in shrink-0">
            {toastMsg}
          </div>
        )}

        {/* Content Body: Left List + Right Editor */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Factory List */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            {/* Action Bar: Add New + Filters */}
            <div className="p-3 border-b border-slate-200 space-y-2">
              <button
                type="button"
                onClick={handleStartCreateNew}
                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 공정도 템플릿 추가</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    filterType === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  전체 ({presets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("internal")}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    filterType === "internal" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  자사
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("oem")}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    filterType === "oem" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  외주
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("custom")}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    filterType === "custom" ? "bg-white text-purple-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  직접등록
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제조처명 또는 공정 검색..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.map((p) => {
                const isSelected = p.id === selectedId;
                const isCurrent =
                  p.name === currentManufacturer || (currentManufacturer && currentManufacturer.includes(p.name));

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-blue-50/90 border-blue-400 text-blue-950 font-bold shadow-xs ring-1 ring-blue-300"
                        : "bg-white border-slate-200/80 text-slate-800 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                            p.type === "internal"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.type === "internal" ? "자사" : "외주"}
                        </span>
                        <span className="font-bold truncate text-slate-900">{p.name}</span>
                        {p.isCustom && (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded border border-purple-200 font-semibold">
                            등록
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {p.processSteps?.slice(0, 3).join(" → ")}
                        {(p.processSteps?.length || 0) > 3 ? "..." : ""}
                      </p>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded shrink-0">
                        현재적용
                      </span>
                    )}
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  일치하는 제조공정 템플릿이 없습니다.
                </div>
              )}
            </div>

            {/* Reset Defaults button */}
            <div className="p-2 border-t border-slate-200 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                title="모든 제조공정을 기본 16개 표준 템플릿으로 되돌립니다"
              >
                <RotateCcw className="w-3 h-3" />
                <span>표준 기본값 복원</span>
              </button>
              <span className="text-[11px] text-slate-400">
                총 {presets.length}건
              </span>
            </div>
          </div>

          {/* Right Panel: Detail Editor */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {editingPreset ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header Banner */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        {isCreatingNew ? "신규 제조공정도 템플릿 등록" : `${editingPreset.name || "제조공정도 템플릿"} 수정`}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          editingPreset.type === "internal"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {editingPreset.type === "internal" ? "자사 생산팀" : "외주 OEM 제조처"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {isCreatingNew
                        ? "새로운 제조처명과 공정 흐름 및 이물 제어 기준을 입력 후 저장하세요."
                        : "템플릿을 수정하거나 삭제할 수 있으며, '보고서에 공정도 적용하기'를 누르면 즉시 반영됩니다."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete button (only when not creating fresh or if it exists) */}
                    {!isCreatingNew && (
                      <>
                        {confirmDeleteId === editingPreset.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in">
                            <button
                              type="button"
                              onClick={() => handleDelete(editingPreset.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>정말 삭제</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(editingPreset.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 shadow-2xs transition-colors"
                            title="이 템플릿을 삭제합니다"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>삭제</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      title="입력한 공정도 설정을 템플릿에 저장합니다"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isCreatingNew ? "템플릿 등록" : "수정사항 저장"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApply}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>보고서에 적용하기</span>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Basic Info: Name, Type, Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        제조처 / 템플릿 명칭 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingPreset.name}
                        onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                        placeholder="예: 삼양패키징 광혜원공장"
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        제조 구분
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingPreset({ ...editingPreset, type: "internal" })}
                          className={`flex-1 py-1.5 px-2 text-xs rounded-lg font-bold border transition-colors ${
                            editingPreset.type === "internal"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          자사 생산팀
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPreset({ ...editingPreset, type: "oem" })}
                          className={`flex-1 py-1.5 px-2 text-xs rounded-lg font-bold border transition-colors ${
                            editingPreset.type === "oem"
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          외주 OEM
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        설명 / 비고
                      </label>
                      <input
                        type="text"
                        value={editingPreset.description || ""}
                        onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                        placeholder="예: 음료 주력 생산라인"
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 1. Process Flow Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        1. 제품 전체 제조공정 텍스트 (화살표 '→' 연결 형식) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleConvertNewlinesToArrows}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        title="줄바꿈으로 작성된 텍스트를 '→' 연결 형태로 자동 변환합니다"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>줄바꿈을 '→'로 변환</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={editingPreset.processFlow}
                      onChange={(e) => {
                        const val = e.target.value;
                        const steps = val
                          .split(/→|->/)
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setEditingPreset({
                          ...editingPreset,
                          processFlow: val,
                          processSteps: steps,
                        });
                      }}
                      placeholder="원료 입고 → 추출 및 배합액 조제 → 여과망 통과 → 살균 → 충진 및 캡핑 → 금속검출기 → 포장"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                    />

                    {/* Live Preview of parsed steps with Click-to-Detail */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-800 font-bold">
                            공정 단계 흐름도 시각화 ({structuredSteps.length}단계):
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                            공정 클릭 시 상세 조회 / 수정
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowStructuredTable(!showStructuredTable)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>{showStructuredTable ? "공정 Master 테이블 접기 ▴" : "공정 Master 테이블 펼치기 ▾"}</span>
                        </button>
                      </div>

                      {/* Interactive Step Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        {structuredSteps.map((st, i) => (
                          <div key={st.id || i} className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenStepDetail(st)}
                              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                st.isCCP
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-200"
                                  : st.isActive
                                  ? "bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border-slate-300 hover:border-blue-400"
                                  : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                              }`}
                              title={`${st.processName} (클릭 시 설비/CCP/품질리스크 상세정보 확인)`}
                            >
                              <span className="text-[10px] font-mono font-bold text-blue-600">
                                {i + 1}.
                              </span>
                              <span>{st.processName}</span>
                              {st.isCCP && (
                                <span className="text-[9px] font-black bg-rose-600 text-white px-1 py-0.2 rounded">
                                  {st.ccpNumber || "CCP"}
                                </span>
                              )}
                            </button>
                            {i < structuredSteps.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                            )}
                          </div>
                        ))}
                        {structuredSteps.length === 0 && (
                          <span className="text-[11px] text-slate-400 py-1">
                            공정 텍스트를 입력하면 단계가 자동 파싱 및 구조화 데이터로 변환됩니다.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* [구조화 데이터 관리] 공정 Master 테이블 */}
                    {showStructuredTable && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="px-3.5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Workflow className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-900">
                              제조공정 구조화 Master 관리 ({structuredSteps.length}개 공정)
                            </span>
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              (공정별 고유 ID · 주요 설비 · CCP 여부 · 품질 리스크 데이터)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddNewStep}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>새 공정 추가</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                                <th className="py-2 px-2.5 w-12 text-center">순서</th>
                                <th className="py-2 px-2.5 w-28">공정 ID</th>
                                <th className="py-2 px-3">공정명</th>
                                <th className="py-2 px-3">주요 설비</th>
                                <th className="py-2 px-3">주요 관리항목</th>
                                <th className="py-2 px-2.5 text-center w-16">CCP</th>
                                <th className="py-2 px-2.5 text-center w-16">상태</th>
                                <th className="py-2 px-2.5 text-center w-20">상세</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {structuredSteps.map((st, idx) => (
                                <tr
                                  key={st.id || idx}
                                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                  onClick={() => handleOpenStepDetail(st)}
                                >
                                  <td className="py-2 px-2.5 text-center font-bold text-slate-500">
                                    {st.stepNumber || idx + 1}
                                  </td>
                                  <td
                                    className="py-2 px-2.5 font-mono text-[10.5px] text-slate-600 font-semibold truncate max-w-[120px]"
                                    title={st.id}
                                  >
                                    {st.id}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <span>{st.processName}</span>
                                      {st.isCustom && (
                                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-semibold">
                                          등록
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td
                                    className="py-2 px-3 text-slate-700 truncate max-w-[140px]"
                                    title={st.keyEquipment}
                                  >
                                    {st.keyEquipment || "-"}
                                  </td>
                                  <td
                                    className="py-2 px-3 text-slate-700 truncate max-w-[160px]"
                                    title={st.controlPoints}
                                  >
                                    {st.controlPoints || "-"}
                                  </td>
                                  <td className="py-2 px-2.5 text-center">
                                    {st.isCCP ? (
                                      <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                                        {st.ccpNumber || "CCP"}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 text-[11px]">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2.5 text-center">
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        st.isActive
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-slate-100 text-slate-400"
                                      }`}
                                    >
                                      {st.isActive ? "가동" : "비가동"}
                                    </span>
                                  </td>
                                  <td
                                    className="py-2 px-2.5 text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleOpenStepDetail(st)}
                                      className="px-2 py-0.5 rounded text-[11px] font-semibold text-blue-700 hover:text-white hover:bg-blue-600 border border-blue-300 transition-colors cursor-pointer"
                                    >
                                      상세
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {structuredSteps.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={8}
                                    className="p-4 text-center text-xs text-slate-400"
                                  >
                                    등록된 구조화 공정이 없습니다.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Filtration */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      2. 여과 공정 및 여과망(Mesh/μm 규격)을 통한 이물 제어 설명
                    </label>
                    <textarea
                      rows={2}
                      value={editingPreset.filtrationAnalysis || ""}
                      onChange={(e) =>
                        setEditingPreset({ ...editingPreset, filtrationAnalysis: e.target.value })
                      }
                      placeholder="예: 원료 배합 후 150 Mesh(105㎛) 스트레이너를 통과하여 이물 혼입을 차단함."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>

                  {/* 3. Cleaning */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      3. 용기 및 캡 세척·살균 공정 설명 (온수 린싱, H2O2 살균 등)
                    </label>
                    <textarea
                      rows={2}
                      value={editingPreset.cleaningAnalysis || ""}
                      onChange={(e) =>
                        setEditingPreset({ ...editingPreset, cleaningAnalysis: e.target.value })
                      }
                      placeholder="예: 85℃ 이상 고온 온수 린싱 및 청정 에어 블로우를 진행하여 용기 내부 이물을 제거함."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>

                  {/* 4. CCP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      4. 표준 공정 중요 관리점 (CCP 모니터링 기준)
                    </label>
                    <textarea
                      rows={2}
                      value={editingPreset.criticalControlPoint || ""}
                      onChange={(e) =>
                        setEditingPreset({ ...editingPreset, criticalControlPoint: e.target.value })
                      }
                      placeholder="예: 초고온 살균 온도(CCP-1B: 135±2℃) 및 금속검출기(CCP-2P: Fe 1.5mm, Sus 2.0mm) 전수 적합 검증."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-xs text-slate-400 space-y-3">
                <Factory className="w-10 h-10 text-slate-300" />
                <p>좌측 목록에서 제조공정 템플릿을 선택하거나 새 템플릿을 추가해 주세요.</p>
                <button
                  type="button"
                  onClick={handleStartCreateNew}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  새 공정도 템플릿 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500">
            총 <strong>{presets.length}</strong>개소 제조처 공정도 등록됨 (자사 {presets.filter(p => p.type === 'internal').length}, 외주 {presets.filter(p => p.type === 'oem').length})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold transition-colors"
            >
              닫기
            </button>
            {editingPreset && (
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors shadow-xs"
              >
                현재 선택 공정도 적용
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Structured Process Step Detail & Edit Modal */}
      <ProcessStepDetailModal
        isOpen={isStepDetailOpen}
        onClose={() => setIsStepDetailOpen(false)}
        step={selectedStepForDetail}
        onStepUpdated={handleStepUpdated}
      />
    </div>
  );
}
