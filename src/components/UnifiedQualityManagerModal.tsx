import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Sparkles,
  RotateCcw,
  BookOpen,
  Tag,
  Building2,
  Factory,
  Search,
  CheckCircle2,
  Layers,
  FileCheck,
  FileText,
  AlertCircle,
  ShieldCheck,
  Workflow,
  Link2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Save,
  HelpCircle,
} from "lucide-react";
import {
  ReportData,
  ClaimPreset,
  StandardPhrase,
  PresetSubCategory,
} from "../types";
import {
  loadAllPresets,
  saveAllPresets,
  resetAllPresetsToDefault,
} from "../data/presets";
import {
  loadAllPhrases,
  saveAllPhrases,
  resetAllPhrasesToDefault,
} from "../data/standardPhrases";
import {
  FactoryProcessPreset,
  loadAllFactoryPresets,
  saveFactoryPreset,
  deleteFactoryPreset,
  resetFactoryPresets,
  findFactoryPresetByName,
} from "../data/factoryProcessPresets";
import { ProcessStepMaster } from "../types";
import {
  getProcessStepsByPreset,
  saveProcessStep,
} from "../data/processStepMaster";
import { ProcessStepDetailModal } from "./ProcessStepDetailModal";

export type ManagerTab = "presets" | "phrases" | "processes";

interface UnifiedQualityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ManagerTab;
  currentReport: ReportData;
  onApplyPreset?: (preset: ClaimPreset) => void;
  onApplyPhrase?: (fieldKey: string, content: string) => void;
  onApplyProcess?: (process: FactoryProcessPreset) => void;
}

export const CLAIM_TYPE_CONFIG: Record<
  string,
  { label: string; badgeColor: string; description: string }
> = {
  spoilage: {
    label: "변질 / 산패",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "개봉 후 상온 방치, 효모/곰팡이 증식, 산패, 기밀 해제",
  },
  foreign: {
    label: "이물 혼입",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    description: "원료 유래물, 설비 탄화물, 벌레/생체 조직, 유리 파편 등",
  },
  breakage: {
    label: "용기 파손",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    description: "유리병 외력 타격 파손, 캔 찌그러짐, 크랙, 핀홀",
  },
  cap: {
    label: "캡 / 밀봉 불량",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    description: "오버캡 헛돎, 실링 라이너 탄화물, 캡핑 토크 이상",
  },
  packaging: {
    label: "포장 불량",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
    description: "라벨 인쇄 누락, 핫멜트 접착 불량, 박스 손상",
  },
  fill: {
    label: "충전 / 액위",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    description: "내용량 부족, 액위 검사 허용오차",
  },
  quantity: {
    label: "수량 부족",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    description: "박스 내 제품 결손, 수량 불일치",
  },
};

export function UnifiedQualityManagerModal({
  isOpen,
  onClose,
  initialTab = "presets",
  currentReport,
  onApplyPreset,
  onApplyPhrase,
  onApplyProcess,
}: UnifiedQualityManagerModalProps) {
  // Top-level active tab: presets | phrases | processes
  const [activeTab, setActiveTab] = useState<ManagerTab>(initialTab);

  // Master Data state
  const [presets, setPresets] = useState<ClaimPreset[]>([]);
  const [phrases, setPhrases] = useState<StandardPhrase[]>([]);
  const [factoryPresets, setFactoryPresets] = useState<FactoryProcessPreset[]>([]);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Reload all data
  const reloadMasterData = () => {
    setPresets(loadAllPresets());
    setPhrases(loadAllPhrases());
    setFactoryPresets(loadAllFactoryPresets());
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      reloadMasterData();
    }
  }, [isOpen, initialTab]);

  // =========================================================================
  // TAB 1: PRESET STATE & HELPERS
  // =========================================================================
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [presetSearchQuery, setPresetSearchQuery] = useState("");
  const [presetFilterScope, setPresetFilterScope] = useState<"all" | "in_house" | "oem">("all");
  const [presetFilterClaimType, setPresetFilterClaimType] = useState<string>("all");
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [editingPresetDraft, setEditingPresetDraft] = useState<ClaimPreset | null>(null);

  // Set initial selected preset
  useEffect(() => {
    if (presets.length > 0 && (!selectedPresetId || !presets.some((p) => p.id === selectedPresetId))) {
      setSelectedPresetId(presets[0].id);
      setEditingPresetDraft(JSON.parse(JSON.stringify(presets[0])));
    }
  }, [presets, selectedPresetId]);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId) || presets[0];

  const handleSelectPreset = (p: ClaimPreset) => {
    setSelectedPresetId(p.id);
    setEditingPresetDraft(JSON.parse(JSON.stringify(p)));
    setIsEditingPreset(false);
  };

  const handleStartCreatePreset = () => {
    const newId = `custom-preset-${Date.now()}`;
    const newPreset: ClaimPreset = {
      id: newId,
      name: "새 클레임 조사 프리셋",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "신규 클레임 조사 및 공정도·상용구 연계 템플릿",
      category: "spoilage",
      scope: "oem",
      subCategory: "spoilage",
      isCustom: true,
      data: {
        productInfo: {
          productName: "새 대상 제품명",
          lotNumber: "LOT-26X01-V1",
          manufactureDate: "2026-06-01",
          expiryDate: "2027-05-31",
          manufacturer: "삼양패키징 광혜원공장",
          packageType: "PET",
        } as any,
        manufacturingProcess: {
          skipped: false,
          processFlow: "원료 입고 → 추출 및 배합액 조제 → 150 Mesh 정밀 여과 → 살균 → 충진 및 캡핑 → 금속검출기 → 포장",
          processSteps: ["원료 입고", "추출 및 배합액 조제", "150 Mesh 정밀 여과", "살균", "충진 및 캡핑", "금속검출기", "포장"],
          filtrationAnalysis: "150 Mesh(105㎛) 스트레이너 필터를 통과하여 이물 혼입 차단.",
          cleaningAnalysis: "충진 직전 용기 및 캡 고온 린싱 진행.",
          criticalControlPoint: "살균 온도 모니터링(CCP-1B) 및 금속검출기(CCP-2P) 전수 검사.",
          highlightedStep: "살균 및 충진 밀봉 공정",
        } as any,
        rootCauseAndActions: {
          skipped: false,
          rootCause: "개봉 후 보관 중 외부 미생물 유입에 의한 변질 건.",
          preventiveMeasuresSkipped: false,
          preventiveMeasures: "개봉 후 냉장 보관 및 조속 음용 소비자 안내 강화.",
        } as any,
        conclusion: {
          summaryPoints: ["원인 및 안전성 확인 완료"],
          apologyText: "제품 음용 중 염려를 끼쳐드려 깊이 사과드립니다.",
          closingRemarks: "광동제약주식회사 식품품질경영팀",
        } as any,
      },
    };
    setSelectedPresetId(newId);
    setEditingPresetDraft(newPreset);
    setIsEditingPreset(true);
  };

  const handleSavePresetDraft = () => {
    if (!editingPresetDraft) return;
    if (!editingPresetDraft.name.trim()) {
      alert("프리셋 명칭을 입력해 주세요.");
      return;
    }
    const all = loadAllPresets();
    const idx = all.findIndex((p) => p.id === editingPresetDraft.id);
    let updated: ClaimPreset[];
    if (idx >= 0) {
      all[idx] = { ...editingPresetDraft, isCustom: true };
      updated = [...all];
    } else {
      updated = [{ ...editingPresetDraft, isCustom: true }, ...all];
    }
    saveAllPresets(updated);
    setPresets(updated);
    setIsEditingPreset(false);
    showToast(`'${editingPresetDraft.name}' 프리셋이 저장되었습니다.`);
  };

  const handleDeletePreset = (id: string) => {
    if (!confirm("정말 이 프리셋을 삭제하시겠습니까?")) return;
    const all = loadAllPresets();
    const filtered = all.filter((p) => p.id !== id);
    saveAllPresets(filtered);
    setPresets(filtered);
    if (selectedPresetId === id && filtered.length > 0) {
      setSelectedPresetId(filtered[0].id);
      setEditingPresetDraft(JSON.parse(JSON.stringify(filtered[0])));
    }
    showToast("프리셋이 삭제되었습니다.");
  };

  // Sync manufacturing process from factory presets into the current preset draft
  const handleSyncProcessFromFactory = (factoryName: string) => {
    if (!editingPresetDraft) return;
    const factory = factoryPresets.find(
      (f) => f.name === factoryName || (factoryName && factoryName.includes(f.name)) || (factoryName && f.name.includes(factoryName))
    );
    if (!factory) {
      alert(`'${factoryName}'에 일치하는 제조공정도 템플릿을 찾을 수 없습니다.`);
      return;
    }
    setEditingPresetDraft({
      ...editingPresetDraft,
      data: {
        ...editingPresetDraft.data,
        productInfo: {
          ...editingPresetDraft.data.productInfo,
          manufacturer: factory.name,
          manufacturerType: factory.type,
          factoryId: factory.id,
        } as any,
        manufacturingProcess: {
          ...editingPresetDraft.data.manufacturingProcess,
          skipped: false,
          processFlow: factory.processFlow,
          processSteps: factory.processSteps,
          filtrationAnalysis: factory.filtrationAnalysis,
          cleaningAnalysis: factory.cleaningAnalysis,
          criticalControlPoint: factory.criticalControlPoint,
        } as any,
      },
    });
    showToast(`'${factory.name}' 제조공정도가 이 프리셋에 동기화되었습니다.`);
  };

  // 1-Click insert phrase content into preset draft
  const handleInsertPhraseIntoPreset = (targetField: "rootCause" | "preventiveMeasures" | "apologyText" | "sampleCondition", text: string) => {
    if (!editingPresetDraft) return;
    if (targetField === "rootCause") {
      setEditingPresetDraft({
        ...editingPresetDraft,
        data: {
          ...editingPresetDraft.data,
          rootCauseAndActions: {
            ...editingPresetDraft.data.rootCauseAndActions,
            rootCause: text,
          } as any,
        },
      });
    } else if (targetField === "preventiveMeasures") {
      setEditingPresetDraft({
        ...editingPresetDraft,
        data: {
          ...editingPresetDraft.data,
          rootCauseAndActions: {
            ...editingPresetDraft.data.rootCauseAndActions,
            preventiveMeasures: text,
          } as any,
        },
      });
    } else if (targetField === "apologyText") {
      setEditingPresetDraft({
        ...editingPresetDraft,
        data: {
          ...editingPresetDraft.data,
          conclusion: {
            ...editingPresetDraft.data.conclusion,
            apologyText: text,
          } as any,
        },
      });
    } else if (targetField === "sampleCondition") {
      setEditingPresetDraft({
        ...editingPresetDraft,
        data: {
          ...editingPresetDraft.data,
          analysisResults: {
            ...editingPresetDraft.data.analysisResults,
            visualInspection: {
              ...editingPresetDraft.data.analysisResults?.visualInspection,
              sampleCondition: text,
            } as any,
          } as any,
        },
      });
    }
    showToast(`상용구 내용이 프리셋의 '${targetField}' 항목에 입력되었습니다.`);
  };

  // Filtered Presets
  const filteredPresets = presets.filter((p) => {
    if (presetFilterScope === "in_house" && p.scope !== "in_house") return false;
    if (presetFilterScope === "oem" && p.scope !== "oem") return false;
    if (presetFilterClaimType !== "all" && p.subCategory !== presetFilterClaimType && p.category !== presetFilterClaimType) return false;
    if (presetSearchQuery) {
      const q = presetSearchQuery.toLowerCase();
      const mfg = p.data.productInfo?.manufacturer?.toLowerCase() || "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        mfg.includes(q)
      );
    }
    return true;
  });

  // Phrases linked to the active preset's claim type
  const activePresetClaimType = editingPresetDraft?.subCategory || editingPresetDraft?.category || selectedPreset?.subCategory || "spoilage";
  const linkedPhrasesForActivePreset = phrases.filter((ph) => {
    if (activePresetClaimType === "spoilage") {
      return ph.category?.includes("spoilage") || ph.category?.includes("mold") || ph.fieldKey === "rootCause" || ph.fieldKey === "preventiveAction";
    }
    if (activePresetClaimType === "foreign") {
      return ph.category?.includes("foreign") || ph.category?.includes("insect") || ph.fieldKey === "magnifierResult" || ph.fieldKey === "rootCause";
    }
    if (activePresetClaimType === "breakage") {
      return ph.category?.includes("glass") || ph.category?.includes("bottle") || ph.fieldKey === "principle_magnifier";
    }
    return ph.fieldKey === "rootCause" || ph.fieldKey === "preventiveAction" || ph.fieldKey === "apologyText";
  });

  // Factory linked to the active preset's manufacturer
  const activePresetMfgName = editingPresetDraft?.data.productInfo?.manufacturer || selectedPreset?.data.productInfo?.manufacturer || "";
  const linkedFactoryForActivePreset = factoryPresets.find(
    (f) =>
      f.name === activePresetMfgName ||
      (activePresetMfgName && activePresetMfgName.includes(f.name)) ||
      (activePresetMfgName && f.name.includes(activePresetMfgName))
  );

  // =========================================================================
  // TAB 2: PHRASES STATE & HELPERS
  // =========================================================================
  const [phraseFilterCategory, setPhraseFilterCategory] = useState<string>("all");
  const [phraseSearchQuery, setPhraseSearchQuery] = useState("");
  const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null);
  const [isEditingPhrase, setIsEditingPhrase] = useState(false);
  const [editingPhraseDraft, setEditingPhraseDraft] = useState<StandardPhrase | null>(null);

  const filteredPhrases = phrases.filter((ph) => {
    if (phraseFilterCategory !== "all") {
      if (phraseFilterCategory === "oem_spoilage" && !ph.category?.includes("spoilage") && !ph.category?.includes("oem")) return false;
      if (phraseFilterCategory === "test_principle" && !ph.fieldKey.startsWith("principle_")) return false;
      if (phraseFilterCategory === "bottle" && !ph.category?.includes("bottle")) return false;
      if (phraseFilterCategory === "foreign_object" && !ph.category?.includes("foreign") && !ph.category?.includes("insect")) return false;
    }
    if (phraseSearchQuery) {
      const q = phraseSearchQuery.toLowerCase();
      return (
        ph.title.toLowerCase().includes(q) ||
        ph.content.toLowerCase().includes(q) ||
        ph.fieldKey.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartCreatePhrase = () => {
    const newPhrase: StandardPhrase = {
      id: `custom-phrase-${Date.now()}`,
      title: "새 상용구 제목",
      fieldKey: "rootCause",
      category: activePresetClaimType || "spoilage",
      content: "원인 분석 및 품질 점검 표준 문구를 작성하세요.",
      isCustom: true,
    };
    setSelectedPhraseId(newPhrase.id);
    setEditingPhraseDraft(newPhrase);
    setIsEditingPhrase(true);
  };

  const handleSavePhraseDraft = () => {
    if (!editingPhraseDraft) return;
    if (!editingPhraseDraft.title.trim()) {
      alert("상용구 제목을 입력해 주세요.");
      return;
    }
    const all = loadAllPhrases();
    const idx = all.findIndex((p) => p.id === editingPhraseDraft.id);
    let updated: StandardPhrase[];
    if (idx >= 0) {
      all[idx] = { ...editingPhraseDraft, isCustom: true };
      updated = [...all];
    } else {
      updated = [{ ...editingPhraseDraft, isCustom: true }, ...all];
    }
    saveAllPhrases(updated);
    setPhrases(updated);
    setIsEditingPhrase(false);
    showToast(`'${editingPhraseDraft.title}' 상용구가 저장되었습니다.`);
  };

  const handleDeletePhrase = (id: string) => {
    if (!confirm("정말 이 상용구를 삭제하시겠습니까?")) return;
    const all = loadAllPhrases();
    const filtered = all.filter((p) => p.id !== id);
    saveAllPhrases(filtered);
    setPhrases(filtered);
    showToast("상용구가 삭제되었습니다.");
  };

  // =========================================================================
  // TAB 3: PROCESS STATE & HELPERS
  // =========================================================================
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>("");
  const [factorySearchQuery, setFactorySearchQuery] = useState("");
  const [factoryFilterType, setFactoryFilterType] = useState<"all" | "internal" | "oem">("all");
  const [editingFactoryDraft, setEditingFactoryDraft] = useState<FactoryProcessPreset | null>(null);

  useEffect(() => {
    if (factoryPresets.length > 0 && (!selectedFactoryId || !factoryPresets.some((f) => f.id === selectedFactoryId))) {
      const match = factoryPresets.find(
        (f) => f.name === activePresetMfgName || (activePresetMfgName && activePresetMfgName.includes(f.name))
      );
      const initial = match ? match : factoryPresets[0];
      setSelectedFactoryId(initial.id);
      setEditingFactoryDraft(JSON.parse(JSON.stringify(initial)));
    }
  }, [factoryPresets, activePresetMfgName, selectedFactoryId]);

  // Structured Process Step Master states for Unified Manager Tab 3
  const [structuredStepsForFactory, setStructuredStepsForFactory] = useState<ProcessStepMaster[]>([]);
  const [selectedStepForDetail, setSelectedStepForDetail] = useState<ProcessStepMaster | null>(null);
  const [isStepDetailOpen, setIsStepDetailOpen] = useState(false);
  const [showStructuredTableInUnified, setShowStructuredTableInUnified] = useState(true);

  useEffect(() => {
    if (editingFactoryDraft) {
      setStructuredStepsForFactory(getProcessStepsByPreset(editingFactoryDraft));
    } else {
      setStructuredStepsForFactory([]);
    }
  }, [editingFactoryDraft?.id, editingFactoryDraft?.processFlow]);

  const handleOpenStepDetail = (step: ProcessStepMaster) => {
    setSelectedStepForDetail(step);
    setIsStepDetailOpen(true);
  };

  const handleStepUpdated = (updated: ProcessStepMaster) => {
    const next = structuredStepsForFactory.map((s) => (s.id === updated.id ? updated : s));
    setStructuredStepsForFactory(next);
    if (editingFactoryDraft) {
      const newStepNames = next.map((s) => s.processName);
      setEditingFactoryDraft({
        ...editingFactoryDraft,
        processSteps: newStepNames,
        processFlow: newStepNames.join(" → "),
      });
    }
    showToast(`'${updated.processName}' 공정 정보가 갱신되었습니다.`);
  };

  const handleAddNewStepInUnified = () => {
    if (!editingFactoryDraft) return;
    const nextNumber = structuredStepsForFactory.length + 1;
    const newStep: ProcessStepMaster = {
      id: `step-${editingFactoryDraft.id}-${String(nextNumber).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
      presetId: editingFactoryDraft.id,
      manufacturer: editingFactoryDraft.name,
      manufactureLine: editingFactoryDraft.teamOrCategory || "표준 생산라인",
      stepNumber: nextNumber,
      processName: `신규 공정 ${nextNumber}`,
      description: `${editingFactoryDraft.name}의 ${nextNumber}번째 공정입니다.`,
      keyEquipment: "자동화 생산 설비",
      controlPoints: "표준 공정 작업 기준서(SOP) 준수",
      isCCP: false,
      qualityRisks: "공정 작업 기준 미준수 리스크",
      possibleDefects: ["품질 이상"],
      isActive: true,
      isCustom: true,
    };
    saveProcessStep(newStep);
    const updatedList = [...structuredStepsForFactory, newStep];
    setStructuredStepsForFactory(updatedList);
    const newStepNames = updatedList.map((s) => s.processName);
    setEditingFactoryDraft({
      ...editingFactoryDraft,
      processSteps: newStepNames,
      processFlow: newStepNames.join(" → "),
    });
    setSelectedStepForDetail(newStep);
    setIsStepDetailOpen(true);
  };

  const handleSelectFactory = (f: FactoryProcessPreset) => {
    setSelectedFactoryId(f.id);
    setEditingFactoryDraft(JSON.parse(JSON.stringify(f)));
  };

  const handleStartCreateFactory = () => {
    const newId = `custom-factory-${Date.now()}`;
    const newFactory: FactoryProcessPreset = {
      id: newId,
      name: "새 제조처 공정도",
      type: "oem",
      teamOrCategory: "Aseptic PET",
      description: "신규 제조처 표준 공정도 및 이물 제어 기준",
      processFlow: "원료 입고 및 칭량 → 추출 및 배합 → 여과망 통과 → 살균 → 충진 및 캡핑 → 금속검출기 → 포장",
      processSteps: ["원료 입고 및 칭량", "추출 및 배합", "여과망 통과", "살균", "충진 및 캡핑", "금속검출기", "포장"],
      filtrationAnalysis: "원료 배합 후 정밀 스트레이너/카트리지 필터를 통과하여 이물 혼입 차단.",
      cleaningAnalysis: "충진 직전 용기 및 캡 고온 온수 린싱 및 에어 블로우로 내부 이물 제거.",
      criticalControlPoint: "살균 온도 모니터링(CCP-1B) 및 포장 전 금속검출기 전수 검사(CCP-2P) 적합.",
      isCustom: true,
    };
    setSelectedFactoryId(newId);
    setEditingFactoryDraft(newFactory);
  };

  const handleSaveFactoryDraft = () => {
    if (!editingFactoryDraft) return;
    if (!editingFactoryDraft.name.trim()) {
      alert("제조처명을 입력해 주세요.");
      return;
    }
    const steps = editingFactoryDraft.processFlow
      .split(/→|->/)
      .map((s) => s.trim())
      .filter(Boolean);
    const toSave: FactoryProcessPreset = {
      ...editingFactoryDraft,
      name: editingFactoryDraft.name.trim(),
      processSteps: steps.length > 0 ? steps : [editingFactoryDraft.name],
      isCustom: true,
    };
    saveFactoryPreset(toSave);
    const updated = loadAllFactoryPresets();
    setFactoryPresets(updated);
    showToast(`"${toSave.name}" 제조공정도 템플릿이 저장되었습니다.`);
  };

  const handleDeleteFactory = (id: string) => {
    if (!confirm("정말 이 제조공정도 템플릿을 삭제하시겠습니까?")) return;
    deleteFactoryPreset(id);
    const updated = loadAllFactoryPresets();
    setFactoryPresets(updated);
    if (updated.length > 0) {
      setSelectedFactoryId(updated[0].id);
      setEditingFactoryDraft(JSON.parse(JSON.stringify(updated[0])));
    }
    showToast("제조공정도 템플릿이 삭제되었습니다.");
  };

  const filteredFactories = factoryPresets.filter((f) => {
    if (factoryFilterType === "internal" && f.type !== "internal") return false;
    if (factoryFilterType === "oem" && f.type !== "oem") return false;
    if (factorySearchQuery) {
      const q = factorySearchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.teamOrCategory.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.processFlow.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Jump from factory or phrase to linked presets
  const handleJumpToPresetWithManufacturer = (mfgName: string) => {
    const match = presets.find((p) => p.data.productInfo?.manufacturer?.includes(mfgName) || mfgName.includes(p.data.productInfo?.manufacturer || ""));
    if (match) {
      setSelectedPresetId(match.id);
      setEditingPresetDraft(JSON.parse(JSON.stringify(match)));
    }
    setActiveTab("presets");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* GLOBAL HEADER: TITLE + 3 MASTER TABS + CONNECTION INDICATOR */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  품질경영 기준정보 통합 관리 센터
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                  프리셋 · 상용구 · 제조공정도 3대 연계
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3 Master Tabs Nav Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "presets"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>1. 클레임 종합 프리셋</span>
                <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.2 rounded-full">
                  {presets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("phrases")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "phrases"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>2. 상용구 라이브러리</span>
                <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.2 rounded-full">
                  {phrases.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("processes")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "processes"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-cyan-300" />
                <span>3. 제조공정도 템플릿</span>
                <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.2 rounded-full">
                  {factoryPresets.length}
                </span>
              </button>
            </div>

            {/* Dynamic Linkage Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <Link2 className="w-3.5 h-3.5" />
                <span>클레임 종류 ↔ 상용구 연계</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                <Factory className="w-3.5 h-3.5" />
                <span>제조처 ↔ 제조공정도 동기화</span>
              </span>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in shrink-0">
            {toastMsg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: CLUSTERED PRESET MANAGER WITH DIRECT LINKAGES */}
        {/* ========================================================================= */}
        {activeTab === "presets" && (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Presets List */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleStartCreatePreset}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 종합 프리셋 추가</span>
                </button>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <select
                    value={presetFilterScope}
                    onChange={(e) => setPresetFilterScope(e.target.value as any)}
                    className="p-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="all">구분 전체</option>
                    <option value="in_house">자사 제품</option>
                    <option value="oem">외주 OEM</option>
                  </select>

                  <select
                    value={presetFilterClaimType}
                    onChange={(e) => setPresetFilterClaimType(e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="all">클레임 유형 전체</option>
                    <option value="spoilage">변질 / 산패</option>
                    <option value="foreign">이물 혼입</option>
                    <option value="breakage">용기 파손</option>
                    <option value="cap">캡 / 밀봉</option>
                    <option value="packaging">포장 불량</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={presetSearchQuery}
                    onChange={(e) => setPresetSearchQuery(e.target.value)}
                    placeholder="프리셋명, 제조처 검색..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* List items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredPresets.map((p) => {
                  const isSelected = p.id === selectedPresetId;
                  const mfg = p.data.productInfo?.manufacturer || "제조처 미지정";
                  const claimInfo = CLAIM_TYPE_CONFIG[p.subCategory || ""] || CLAIM_TYPE_CONFIG.spoilage;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "bg-blue-50/90 border-blue-400 text-blue-950 font-bold shadow-xs ring-1 ring-blue-300"
                          : "bg-white border-slate-200/80 text-slate-800 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            p.scope === "in_house"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {p.scope === "in_house" ? "자사" : "외주"}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${claimInfo.badgeColor}`}>
                          {claimInfo.label}
                        </span>
                        <span className="font-bold truncate text-slate-900 flex-1">{p.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 pl-0.5">
                        <span className="truncate max-w-[170px] text-slate-600 font-medium">
                          🏭 {mfg}
                        </span>
                        {p.isCustom && (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded border border-purple-200 font-semibold">
                            등록
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Reset to defaults */}
              <div className="p-2 border-t border-slate-200 bg-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("모든 프리셋을 표준 기본값으로 초기화하시겠습니까?")) {
                      resetAllPresetsToDefault();
                      reloadMasterData();
                      showToast("프리셋이 기본값으로 초기화되었습니다.");
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>기본 프리셋 복원</span>
                </button>
                <span className="text-[11px] text-slate-400">총 {presets.length}건</span>
              </div>
            </div>

            {/* Right Main Editor: Preset Details & Real-Time Linkages */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {editingPresetDraft ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Preset Header Actions */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {editingPresetDraft.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            editingPresetDraft.scope === "in_house"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {editingPresetDraft.scope === "in_house" ? "자사 생산" : "외주 OEM"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {editingPresetDraft.description || "클레임 원인 조사 및 공정도 연계 템플릿"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingPresetDraft.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(editingPresetDraft.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors"
                          title="프리셋 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>삭제</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSavePresetDraft}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      >
                        <Save className="w-3.5 h-3.5 text-slate-500" />
                        <span>프리셋 저장</span>
                      </button>

                      {onApplyPreset && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSavePresetDraft();
                            onApplyPreset(editingPresetDraft);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>보고서에 프리셋 적용</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                    {/* Basic Meta Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          프리셋 명칭
                        </label>
                        <input
                          type="text"
                          value={editingPresetDraft.name}
                          onChange={(e) =>
                            setEditingPresetDraft({ ...editingPresetDraft, name: e.target.value })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          클레임 종류 (상용구 연계 기준)
                        </label>
                        <select
                          value={editingPresetDraft.subCategory || "spoilage"}
                          onChange={(e) =>
                            setEditingPresetDraft({
                              ...editingPresetDraft,
                              subCategory: e.target.value as any,
                              category: e.target.value,
                            })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="spoilage">변질 / 산패 (개봉 후 변질, 곰팡이)</option>
                          <option value="foreign">이물 혼입 (곤충, 설비 탄화물, 유리)</option>
                          <option value="breakage">용기 파손 (타격 파선, 크랙, 핀홀)</option>
                          <option value="cap">캡 / 밀봉 불량 (라이너 탄화물, 오버캡)</option>
                          <option value="packaging">포장 불량 (라벨 인쇄, 핫멜트)</option>
                          <option value="fill">충전 / 액위 (내용량 오차)</option>
                          <option value="quantity">수량 부족 (결손)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          제조처 (제조공정도 연동 기준)
                        </label>
                        <select
                          value={editingPresetDraft.data.productInfo?.manufacturer || ""}
                          onChange={(e) => {
                            const newMfg = e.target.value;
                            setEditingPresetDraft({
                              ...editingPresetDraft,
                              data: {
                                ...editingPresetDraft.data,
                                productInfo: {
                                  ...editingPresetDraft.data.productInfo,
                                  manufacturer: newMfg,
                                } as any,
                              },
                            });
                            // Automatically sync process flow
                            handleSyncProcessFromFactory(newMfg);
                          }}
                          className="w-full text-xs p-2 border border-emerald-300 rounded-lg bg-white font-semibold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="" disabled>제조처를 선택하세요</option>
                          <optgroup label="자사 생산팀 (2개소)">
                            {factoryPresets.filter((f) => f.type === "internal").map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="외주 OEM 제조처 (14개소)">
                            {factoryPresets.filter((f) => f.type === "oem").map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* LINKAGE CARD 1: FACTORY PROCESS LINKAGE */}
                    {/* ========================================================================= */}
                    <div className="p-3.5 bg-gradient-to-r from-cyan-50/70 to-blue-50/70 border border-cyan-200 rounded-xl space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Factory className="w-4 h-4 text-cyan-700" />
                          <span className="text-xs font-bold text-cyan-950">
                            제조처 ↔ 제조공정도 템플릿 연계 허브
                          </span>
                          <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-semibold border border-cyan-300">
                            연계 제조처: {activePresetMfgName || "미지정"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {activePresetMfgName && (
                            <button
                              type="button"
                              onClick={() => handleSyncProcessFromFactory(activePresetMfgName)}
                              className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                              title="현재 선택된 제조처의 표준 공정도를 프리셋에 즉시 덮어씌웁니다"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>제조처 표준 공정도 자동 동기화</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (linkedFactoryForActivePreset) {
                                setSelectedFactoryId(linkedFactoryForActivePreset.id);
                                setEditingFactoryDraft(JSON.parse(JSON.stringify(linkedFactoryForActivePreset)));
                              }
                              setActiveTab("processes");
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Workflow className="w-3 h-3 text-slate-500" />
                            <span>제조공정도 탭에서 편집</span>
                          </button>
                        </div>
                      </div>

                      {/* Process text summary */}
                      <div className="bg-white p-2.5 rounded-lg border border-cyan-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700">
                            프리셋에 저장된 제조공정 흐름 (화살표 연결):
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {editingPresetDraft.data.manufacturingProcess?.processSteps?.length || 0}단계
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2 rounded border border-slate-200 text-[11.5px]">
                          {editingPresetDraft.data.manufacturingProcess?.processFlow || "공정도 미입력"}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                          <div>
                            <strong className="text-slate-800">여과 이물 제어:</strong>{" "}
                            {editingPresetDraft.data.manufacturingProcess?.filtrationAnalysis || "기본 150 Mesh 여과망"}
                          </div>
                          <div>
                            <strong className="text-slate-800">CCP 관리점:</strong>{" "}
                            {editingPresetDraft.data.manufacturingProcess?.criticalControlPoint || "살균 CCP-1B, 금속검출 CCP-2P"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* LINKAGE CARD 2: CLAIM TYPE STANDARD PHRASES LINKAGE */}
                    {/* ========================================================================= */}
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-950">
                            클레임 종류 ↔ 맞춤 상용구 연계 허브
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-300">
                            {CLAIM_TYPE_CONFIG[activePresetClaimType]?.label || "변질류"} 관련 상용구 ({linkedPhrasesForActivePreset.length}건)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("phrases");
                            setPhraseFilterCategory("oem_spoilage");
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3 text-slate-500" />
                          <span>상용구 탭에서 전체 보기</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600">
                        아래 추천 상용구의 <strong>[프리셋에 삽입]</strong>을 클릭하면 해당 내용이 원인 분석, 재발방지대책, 현품 관찰 항목에 원클릭 자동 기입됩니다.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {linkedPhrasesForActivePreset.slice(0, 6).map((ph) => (
                          <div
                            key={ph.id}
                            className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                                {ph.title}
                              </span>
                              <span className="text-[9.5px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold shrink-0">
                                {ph.fieldKey === "rootCause" ? "원인 판정" : ph.fieldKey === "preventiveAction" ? "재발 방지" : ph.fieldKey === "sampleCondition" ? "현품 성상" : "시험 원리"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2">
                              {ph.content}
                            </p>
                            <div className="pt-1 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const targetField = ph.fieldKey === "rootCause" ? "rootCause" : ph.fieldKey === "preventiveAction" ? "preventiveMeasures" : ph.fieldKey === "apologyText" ? "apologyText" : "sampleCondition";
                                  handleInsertPhraseIntoPreset(targetField, ph.content);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10.5px] font-bold transition-colors shadow-2xs"
                              >
                                프리셋에 삽입
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preset Core Investigation Content */}
                    <div className="space-y-3 pt-1">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>프리셋 기본 기입 내용 (원인 조사 및 결론)</span>
                      </h5>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          원인 분석 종합 판정 (Root Cause)
                        </label>
                        <textarea
                          rows={3}
                          value={editingPresetDraft.data.rootCauseAndActions?.rootCause || ""}
                          onChange={(e) =>
                            setEditingPresetDraft({
                              ...editingPresetDraft,
                              data: {
                                ...editingPresetDraft.data,
                                rootCauseAndActions: {
                                  ...editingPresetDraft.data.rootCauseAndActions,
                                  rootCause: e.target.value,
                                } as any,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                          placeholder="원인 분석 종합 판정 문구를 입력하세요..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          재발방지대책 수립 (Preventive Measures)
                        </label>
                        <textarea
                          rows={3}
                          value={editingPresetDraft.data.rootCauseAndActions?.preventiveMeasures || ""}
                          onChange={(e) =>
                            setEditingPresetDraft({
                              ...editingPresetDraft,
                              data: {
                                ...editingPresetDraft.data,
                                rootCauseAndActions: {
                                  ...editingPresetDraft.data.rootCauseAndActions,
                                  preventiveMeasures: e.target.value,
                                } as any,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                          placeholder="재발방지대책 문구를 입력하세요..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          고객 사과 및 안내문 (Apology & Closing)
                        </label>
                        <textarea
                          rows={2}
                          value={editingPresetDraft.data.conclusion?.apologyText || ""}
                          onChange={(e) =>
                            setEditingPresetDraft({
                              ...editingPresetDraft,
                              data: {
                                ...editingPresetDraft.data,
                                conclusion: {
                                  ...editingPresetDraft.data.conclusion,
                                  apologyText: e.target.value,
                                } as any,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                          placeholder="고객 안내 및 사과 문구를 입력하세요..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
                  좌측에서 프리셋을 선택해 주세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STANDARD PHRASES LIBRARY */}
        {/* ========================================================================= */}
        {activeTab === "phrases" && (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Phrase List */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleStartCreatePhrase}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 상용구 추가</span>
                </button>

                <select
                  value={phraseFilterCategory}
                  onChange={(e) => setPhraseFilterCategory(e.target.value)}
                  className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="all">전체 상용구 카테고리</option>
                  <option value="oem_spoilage">🧃 외주 변질류 (개봉 후 변질)</option>
                  <option value="test_principle">🔬 시험법 및 분석 원리</option>
                  <option value="bottle">🍾 병 제품 클레임</option>
                  <option value="foreign_object">🔍 이물 / 곰팡이</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={phraseSearchQuery}
                    onChange={(e) => setPhraseSearchQuery(e.target.value)}
                    placeholder="상용구 제목, 본문 검색..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredPhrases.map((ph) => {
                  const isSelected = ph.id === selectedPhraseId;
                  return (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setSelectedPhraseId(ph.id);
                        setEditingPhraseDraft(JSON.parse(JSON.stringify(ph)));
                        setIsEditingPhrase(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-300"
                          : "bg-white border-slate-200/80 text-slate-800 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate text-slate-900">{ph.title}</span>
                        <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                          {ph.fieldKey}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{ph.content}</p>
                    </button>
                  );
                })}
              </div>

              {/* Reset to defaults */}
              <div className="p-2 border-t border-slate-200 bg-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("모든 상용구를 표준 기본값으로 초기화하시겠습니까?")) {
                      resetAllPhrasesToDefault();
                      reloadMasterData();
                      showToast("상용구가 기본값으로 복원되었습니다.");
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>표준 상용구 복원</span>
                </button>
                <span className="text-[11px] text-slate-400">총 {phrases.length}건</span>
              </div>
            </div>

            {/* Right Editor: Phrase Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {editingPhraseDraft ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{editingPhraseDraft.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        적용 항목: <code>{editingPhraseDraft.fieldKey}</code> · 카테고리: {editingPhraseDraft.category || "일반"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingPhraseDraft.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhrase(editingPhraseDraft.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>삭제</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSavePhraseDraft}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      >
                        <Save className="w-3.5 h-3.5 text-slate-500" />
                        <span>상용구 저장</span>
                      </button>

                      {onApplyPhrase && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSavePhraseDraft();
                            onApplyPhrase(editingPhraseDraft.fieldKey, editingPhraseDraft.content);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>보고서에 적용하기</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">상용구 제목</label>
                        <input
                          type="text"
                          value={editingPhraseDraft.title}
                          onChange={(e) =>
                            setEditingPhraseDraft({ ...editingPhraseDraft, title: e.target.value })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">적용 대상 항목 필드</label>
                        <select
                          value={editingPhraseDraft.fieldKey}
                          onChange={(e) =>
                            setEditingPhraseDraft({ ...editingPhraseDraft, fieldKey: e.target.value })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="rootCause">원인 분석 종합 판정 (rootCause)</option>
                          <option value="preventiveAction">재발방지대책 수립 (preventiveAction)</option>
                          <option value="apologyText">고객 사과 및 안내문 (apologyText)</option>
                          <option value="sampleCondition">현품 외관 및 이물 육안 확인 (sampleCondition)</option>
                          <option value="magnifierResult">확대경 정밀 검경 소견 (magnifierResult)</option>
                          <option value="microscopeResult">광학 현미경 관찰 소견 (microscopeResult)</option>
                          <option value="ftirSummary">FT-IR 적외선 정성 판정 (ftirSummary)</option>
                          <option value="retainedSampleCheck">동일 Lot 공장 보관품 확인 (retainedSampleCheck)</option>
                          <option value="productionLogNote">생산일지 모니터링 (productionLogNote)</option>
                          <option value="principle_visual">🔬 [시험원리] 육안 검사 원리</option>
                          <option value="principle_magnifier">🔬 [시험원리] 확대경 파선 감식</option>
                          <option value="principle_microscope">🔬 [시험원리] 광학 현미경 원리</option>
                          <option value="principle_ftir">🔬 [시험원리] FT-IR 적외선 분광</option>
                          <option value="principle_physicochemical">🔬 [시험원리] 이화학 진공도 측정</option>
                          <option value="principle_catalase">🔬 [시험원리] 카탈라아제 열변성</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">상용구 본문 내용</label>
                      <textarea
                        rows={8}
                        value={editingPhraseDraft.content}
                        onChange={(e) =>
                          setEditingPhraseDraft({ ...editingPhraseDraft, content: e.target.value })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
                  좌측에서 상용구를 선택해 주세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MANUFACTURING PROCESS TEMPLATES (14 OEM + 2 INTERNAL) */}
        {/* ========================================================================= */}
        {activeTab === "processes" && (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Factory List */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleStartCreateFactory}
                  className="w-full py-1.5 px-3 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 제조공정도 추가</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setFactoryFilterType("all")}
                    className={`flex-1 py-1 rounded text-center transition-colors ${
                      factoryFilterType === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600"
                    }`}
                  >
                    전체 ({factoryPresets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactoryFilterType("internal")}
                    className={`flex-1 py-1 rounded text-center transition-colors ${
                      factoryFilterType === "internal" ? "bg-white text-blue-700 shadow-xs font-bold" : "text-slate-600"
                    }`}
                  >
                    자사 (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactoryFilterType("oem")}
                    className={`flex-1 py-1 rounded text-center transition-colors ${
                      factoryFilterType === "oem" ? "bg-white text-emerald-700 shadow-xs font-bold" : "text-slate-600"
                    }`}
                  >
                    외주 (14)
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={factorySearchQuery}
                    onChange={(e) => setFactorySearchQuery(e.target.value)}
                    placeholder="제조처명, 공정 검색..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredFactories.map((f) => {
                  const isSelected = f.id === selectedFactoryId;
                  const linkedPresetsCount = presets.filter(
                    (p) => p.data.productInfo?.manufacturer?.includes(f.name) || f.name.includes(p.data.productInfo?.manufacturer || "")
                  ).length;

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFactory(f)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "bg-cyan-50/90 border-cyan-400 text-cyan-950 font-bold shadow-xs ring-1 ring-cyan-300"
                          : "bg-white border-slate-200/80 text-slate-800 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                              f.type === "internal"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {f.type === "internal" ? "자사" : "외주"}
                          </span>
                          <span className="font-bold truncate text-slate-900">{f.name}</span>
                        </div>
                        {linkedPresetsCount > 0 && (
                          <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded font-semibold shrink-0">
                            프리셋 {linkedPresetsCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {f.processSteps?.slice(0, 3).join(" → ")}...
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Reset to defaults */}
              <div className="p-2 border-t border-slate-200 bg-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("모든 공정도를 표준 기본값(16개소)으로 초기화하시겠습니까?")) {
                      resetFactoryPresets();
                      reloadMasterData();
                      showToast("제조공정도가 표준 기본값으로 복원되었습니다.");
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>표준 공정도 복원</span>
                </button>
                <span className="text-[11px] text-slate-400">총 {factoryPresets.length}건</span>
              </div>
            </div>

            {/* Right Editor: Factory Process Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {editingFactoryDraft ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {editingFactoryDraft.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            editingFactoryDraft.type === "internal"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {editingFactoryDraft.type === "internal" ? "자사 생산팀" : "외주 OEM 제조처"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{editingFactoryDraft.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingFactoryDraft.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFactory(editingFactoryDraft.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>삭제</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveFactoryDraft}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                      >
                        <Save className="w-3.5 h-3.5 text-slate-500" />
                        <span>공정도 저장</span>
                      </button>

                      {onApplyProcess && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveFactoryDraft();
                            onApplyProcess(editingFactoryDraft);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>보고서에 공정도 적용</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* Basic Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">제조처명</label>
                        <input
                          type="text"
                          value={editingFactoryDraft.name}
                          onChange={(e) =>
                            setEditingFactoryDraft({ ...editingFactoryDraft, name: e.target.value })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">구분</label>
                        <select
                          value={editingFactoryDraft.type}
                          onChange={(e) =>
                            setEditingFactoryDraft({ ...editingFactoryDraft, type: e.target.value as any })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none"
                        >
                          <option value="internal">자사 생산팀</option>
                          <option value="oem">외주 OEM 제조처</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">설명 / 비고</label>
                        <input
                          type="text"
                          value={editingFactoryDraft.description}
                          onChange={(e) =>
                            setEditingFactoryDraft({ ...editingFactoryDraft, description: e.target.value })
                          }
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Linked presets using this factory */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-950">
                          이 제조처 공정도를 사용하는 클레임 프리셋:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {presets
                            .filter((p) => p.data.productInfo?.manufacturer?.includes(editingFactoryDraft.name) || editingFactoryDraft.name.includes(p.data.productInfo?.manufacturer || ""))
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleJumpToPresetWithManufacturer(editingFactoryDraft.name)}
                                className="text-[10px] bg-white text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-300 hover:bg-blue-100 flex items-center gap-1 transition-colors"
                              >
                                <span>{p.name}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          {presets.filter((p) => p.data.productInfo?.manufacturer?.includes(editingFactoryDraft.name) || editingFactoryDraft.name.includes(p.data.productInfo?.manufacturer || "")).length === 0 && (
                            <span className="text-[11px] text-slate-500">현재 연계된 프리셋 없음</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Process Flow Text */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          1. 제품 전체 제조공정 텍스트 (화살표 '→' 연결 형식)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const lines = editingFactoryDraft.processFlow
                              .split(/\r?\n/)
                              .map((l) => l.replace(/^[\d\s.\-•*)]+/, "").trim())
                              .filter(Boolean);
                            if (lines.length > 1) {
                              setEditingFactoryDraft({
                                ...editingFactoryDraft,
                                processFlow: lines.join(" → "),
                                processSteps: lines,
                              });
                              showToast("줄바꿈을 '→' 화살표 연결 형식으로 변환하였습니다.");
                            }
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>줄바꿈을 '→'로 변환</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={editingFactoryDraft.processFlow}
                        onChange={(e) => {
                          const val = e.target.value;
                          const steps = val
                            .split(/→|->/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setEditingFactoryDraft({
                            ...editingFactoryDraft,
                            processFlow: val,
                            processSteps: steps,
                          });
                        }}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                      />

                      {/* Interactive Step Flow Pills */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-700 font-bold">
                            공정 단계 흐름도 ({structuredStepsForFactory.length}단계) · 클릭 시 공정 상세정보 조회/수정:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowStructuredTableInUnified(!showStructuredTableInUnified)}
                            className="text-[11px] text-cyan-700 hover:text-cyan-900 font-semibold cursor-pointer"
                          >
                            {showStructuredTableInUnified ? "Master 테이블 접기 ▴" : "Master 테이블 펼치기 ▾"}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
                          {structuredStepsForFactory.map((st, i) => (
                            <div key={st.id || i} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenStepDetail(st)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                                  st.isCCP
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-200"
                                    : st.isActive
                                    ? "bg-slate-50 hover:bg-cyan-50 text-slate-800 hover:text-cyan-950 border-slate-300 hover:border-cyan-400"
                                    : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                                }`}
                                title={`${st.processName} (클릭 시 설비/CCP/품질리스크 상세정보 확인)`}
                              >
                                <span className="font-mono text-[10px] text-cyan-700 font-bold">{i + 1}.</span>
                                <span>{st.processName}</span>
                                {st.isCCP && (
                                  <span className="text-[9px] font-black bg-rose-600 text-white px-1 py-0.2 rounded">
                                    {st.ccpNumber || "CCP"}
                                  </span>
                                )}
                              </button>
                              {i < structuredStepsForFactory.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                              )}
                            </div>
                          ))}
                          {structuredStepsForFactory.length === 0 && (
                            <span className="text-[11px] text-slate-400">
                              공정 텍스트를 입력하면 단계가 자동 파싱 및 구조화됩니다.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Structured Process Step Table in Unified Manager */}
                      {showStructuredTableInUnified && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Workflow className="w-4 h-4 text-cyan-700" />
                              <span className="text-xs font-bold text-slate-900">
                                공정별 구조화 데이터 Master ({structuredStepsForFactory.length}개 공정)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddNewStepInUnified}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-md transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>새 공정 추가</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto max-h-56 overflow-y-auto">
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
                                  <th className="py-2 px-2.5 text-center w-16">관리</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {structuredStepsForFactory.map((st, idx) => (
                                  <tr
                                    key={st.id || idx}
                                    className="hover:bg-cyan-50/40 transition-colors cursor-pointer"
                                    onClick={() => handleOpenStepDetail(st)}
                                  >
                                    <td className="py-2 px-2.5 text-center font-bold text-slate-500">
                                      {st.stepNumber || idx + 1}
                                    </td>
                                    <td className="py-2 px-2.5 font-mono text-[10.5px] text-slate-600 font-semibold truncate max-w-[120px]" title={st.id}>
                                      {st.id}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-slate-900">
                                      <span>{st.processName}</span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-700 truncate max-w-[130px]" title={st.keyEquipment}>
                                      {st.keyEquipment || "-"}
                                    </td>
                                    <td className="py-2 px-3 text-slate-700 truncate max-w-[150px]" title={st.controlPoints}>
                                      {st.controlPoints || "-"}
                                    </td>
                                    <td className="py-2 px-2.5 text-center">
                                      {st.isCCP ? (
                                        <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                                          {st.ccpNumber || "CCP"}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">-</span>
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
                                    <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenStepDetail(st)}
                                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-cyan-700 hover:text-white hover:bg-cyan-700 border border-cyan-300 transition-colors cursor-pointer"
                                      >
                                        상세
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filtration */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        2. 여과 공정 및 여과망(Mesh/μm 규격)을 통한 이물 제어 설명
                      </label>
                      <textarea
                        rows={2}
                        value={editingFactoryDraft.filtrationAnalysis}
                        onChange={(e) =>
                          setEditingFactoryDraft({ ...editingFactoryDraft, filtrationAnalysis: e.target.value })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      />
                    </div>

                    {/* Cleaning */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        3. 용기 및 캡 세척·살균 공정 설명 (온수 린싱, H2O2 살균 등)
                      </label>
                      <textarea
                        rows={2}
                        value={editingFactoryDraft.cleaningAnalysis}
                        onChange={(e) =>
                          setEditingFactoryDraft({ ...editingFactoryDraft, cleaningAnalysis: e.target.value })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      />
                    </div>

                    {/* CCP */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        4. 표준 공정 중요 관리점 (CCP 모니터링 기준)
                      </label>
                      <textarea
                        rows={2}
                        value={editingFactoryDraft.criticalControlPoint}
                        onChange={(e) =>
                          setEditingFactoryDraft({ ...editingFactoryDraft, criticalControlPoint: e.target.value })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
                  좌측에서 제조처를 선택해 주세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Footer */}
        <div className="px-5 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 flex items-center gap-2">
            <span>총 등록:</span>
            <span className="font-semibold text-slate-700">프리셋 {presets.length}건</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">상용구 {phrases.length}건</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">제조공정도 {factoryPresets.length}건</span>
          </div>

          <div className="flex items-center gap-2">
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
