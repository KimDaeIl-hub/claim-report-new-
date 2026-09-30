import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Edit3,
  RotateCcw,
  Check,
  Factory,
  Layers,
  ShieldCheck,
  AlertCircle,
  Package,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Cpu,
  Trash2,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  ManufacturerMaster,
  ManufactureLineMaster,
  ManufacturerType,
  ProductMaster,
} from "../types";
import {
  loadAllManufacturers,
  saveManufacturer,
  toggleManufacturerActive,
  deleteManufacturer,
  loadAllManufactureLines,
  saveManufactureLine,
  toggleManufactureLineActive,
  deleteManufactureLine,
  resetManufacturersAndLinesToDefault,
  getLinesByManufacturerId,
} from "../data/manufacturerMaster";
import { loadAllProducts } from "../data/productMaster";
import { loadAllFactoryPresets } from "../data/factoryProcessPresets";

interface ManufacturerMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManufacturer?: (mfg: ManufacturerMaster) => void;
  onSelectLine?: (line: ManufactureLineMaster, mfg: ManufacturerMaster) => void;
  selectedManufacturerId?: string;
  selectedLineId?: string;
}

export function ManufacturerMasterModal({
  isOpen,
  onClose,
  onSelectManufacturer,
  onSelectLine,
  selectedManufacturerId,
  selectedLineId,
}: ManufacturerMasterModalProps) {
  const [manufacturers, setManufacturers] = useState<ManufacturerMaster[]>([]);
  const [lines, setLines] = useState<ManufactureLineMaster[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);

  // Navigation / Selection State
  const [selectedMfgId, setSelectedMfgId] = useState<string>("");
  const [selectedLineIdState, setSelectedLineIdState] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ManufacturerType>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  // Mode: "view" | "edit-mfg" | "add-mfg" | "edit-line" | "add-line"
  const [currentMode, setCurrentMode] = useState<
    "view" | "edit-mfg" | "add-mfg" | "edit-line" | "add-line"
  >("view");

  // Edit form states
  const [mfgFormData, setMfgFormData] = useState<Partial<ManufacturerMaster>>({});
  const [lineFormData, setLineFormData] = useState<Partial<ManufactureLineMaster>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available factory presets
  const factoryPresets = useMemo(() => loadAllFactoryPresets(), []);

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      const mList = loadAllManufacturers();
      const lList = loadAllManufactureLines();
      const pList = loadAllProducts();

      setManufacturers(mList);
      setLines(lList);
      setProducts(pList);

      const initMfgId =
        selectedManufacturerId || (mList.length > 0 ? mList[0].id : "");
      setSelectedMfgId(initMfgId);
      setSelectedLineIdState(selectedLineId || null);
      setCurrentMode("view");
    }
  }, [isOpen, selectedManufacturerId, selectedLineId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered manufacturers
  const filteredManufacturers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return manufacturers.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (activeFilter === "active" && !m.isActive) return false;
      if (activeFilter === "inactive" && m.isActive) return false;

      if (!q) return true;
      const matchName = m.name.toLowerCase().includes(q);
      const matchTeam = (m.teamOrCategory || "").toLowerCase().includes(q);
      const matchLoc = (m.factoryLocation || "").toLowerCase().includes(q);
      const matchNotes = (m.notes || "").toLowerCase().includes(q);

      // Also check if any child line matches
      const childLines = lines.filter((l) => l.manufacturerId === m.id);
      const lineMatch = childLines.some(
        (l) =>
          l.lineName.toLowerCase().includes(q) ||
          l.productCategory.toLowerCase().includes(q)
      );

      return matchName || matchTeam || matchLoc || matchNotes || lineMatch;
    });
  }, [manufacturers, lines, searchQuery, typeFilter, activeFilter]);

  // Selected Manufacturer object
  const currentMfg = useMemo(() => {
    return manufacturers.find((m) => m.id === selectedMfgId) || manufacturers[0] || null;
  }, [manufacturers, selectedMfgId]);

  // Lines belonging to the selected manufacturer
  const currentMfgLines = useMemo(() => {
    if (!currentMfg) return [];
    return lines.filter((l) => l.manufacturerId === currentMfg.id);
  }, [lines, currentMfg]);

  // Selected line object (if any)
  const currentLine = useMemo(() => {
    if (!selectedLineIdState) return null;
    return lines.find((l) => l.id === selectedLineIdState) || null;
  }, [lines, selectedLineIdState]);

  // Products grouped by line
  const productsByLineMap = useMemo(() => {
    const map: Record<string, ProductMaster[]> = {};
    products.forEach((p) => {
      if (p.manufactureLineId) {
        if (!map[p.manufactureLineId]) map[p.manufactureLineId] = [];
        map[p.manufactureLineId].push(p);
      } else if (p.manufactureLine && p.manufacturer) {
        // Fallback match by name
        const key = `${p.manufacturer}_${p.manufactureLine}`;
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [products]);

  if (!isOpen) return null;

  // Handlers for Manufacturer Actions
  const handleOpenAddMfg = () => {
    const newId = `mfg-custom-${Date.now()}`;
    setMfgFormData({
      id: newId,
      name: "",
      type: "internal",
      isActive: true,
      factoryLocation: "",
      teamOrCategory: "식품생산팀",
      defaultProcessPresetId: "internal-food",
      notes: "",
      isCustom: true,
    });
    setFormErrors({});
    setCurrentMode("add-mfg");
  };

  const handleOpenEditMfg = (mfg: ManufacturerMaster) => {
    setMfgFormData({ ...mfg });
    setFormErrors({});
    setCurrentMode("edit-mfg");
  };

  const handleToggleMfgActive = (mfgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleManufacturerActive(mfgId);
    setManufacturers(updated);
    const target = updated.find((m) => m.id === mfgId);
    showToast(
      `'${target?.name}' 제조처가 ${target?.isActive ? "사용 상태로 활성화" : "미사용으로 변경"}되었습니다.`
    );
  };

  const handleSaveMfgForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!mfgFormData.name?.trim()) {
      errors.name = "제조처명을 입력해 주세요.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const toSave: ManufacturerMaster = {
      id: mfgFormData.id || `mfg-custom-${Date.now()}`,
      name: mfgFormData.name!.trim(),
      type: mfgFormData.type || "internal",
      isActive: mfgFormData.isActive ?? true,
      factoryLocation: mfgFormData.factoryLocation?.trim() || "",
      teamOrCategory: mfgFormData.teamOrCategory?.trim() || "",
      defaultProcessPresetId: mfgFormData.defaultProcessPresetId,
      notes: mfgFormData.notes?.trim() || "",
      isCustom: true,
    };

    const updated = saveManufacturer(toSave);
    setManufacturers(updated);
    setSelectedMfgId(toSave.id);
    setCurrentMode("view");
    showToast(`'${toSave.name}' 제조처 정보가 저장되었습니다.`);
  };

  // Handlers for Line Actions
  const handleOpenAddLine = (targetMfgId?: string) => {
    const parentMfgId = targetMfgId || currentMfg?.id || manufacturers[0]?.id;
    const newId = `line-custom-${Date.now()}`;
    setLineFormData({
      id: newId,
      manufacturerId: parentMfgId,
      lineName: "",
      productCategory: "",
      description: "",
      isActive: true,
      notes: "",
      isCustom: true,
    });
    setFormErrors({});
    setCurrentMode("add-line");
  };

  const handleOpenEditLine = (line: ManufactureLineMaster, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLineFormData({ ...line });
    setFormErrors({});
    setCurrentMode("edit-line");
  };

  const handleToggleLineActive = (lineId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleManufactureLineActive(lineId);
    setLines(updated);
    const target = updated.find((l) => l.id === lineId);
    showToast(
      `'${target?.lineName}' 제조라인이 ${target?.isActive ? "사용 상태로 활성화" : "미사용으로 변경"}되었습니다.`
    );
  };

  const handleSaveLineForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!lineFormData.lineName?.trim()) {
      errors.lineName = "라인명을 입력해 주세요.";
    }
    if (!lineFormData.manufacturerId) {
      errors.manufacturerId = "소속 제조처를 선택해 주세요.";
    }
    if (!lineFormData.productCategory?.trim()) {
      errors.productCategory = "생산 제품군을 입력해 주세요.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const toSave: ManufactureLineMaster = {
      id: lineFormData.id || `line-custom-${Date.now()}`,
      manufacturerId: lineFormData.manufacturerId!,
      lineName: lineFormData.lineName!.trim(),
      productCategory: lineFormData.productCategory!.trim(),
      description: lineFormData.description?.trim() || "",
      isActive: lineFormData.isActive ?? true,
      notes: lineFormData.notes?.trim() || "",
      isCustom: true,
    };

    const updated = saveManufactureLine(toSave);
    setLines(updated);
    setSelectedMfgId(toSave.manufacturerId);
    setSelectedLineIdState(toSave.id);
    setCurrentMode("view");
    showToast(`'${toSave.lineName}' 제조라인 정보가 저장되었습니다.`);
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (
      !confirm(
        "제조처 및 제조라인 Master를 표준 규격으로 초기화하시겠습니까? (사용자 추가 항목이 초기화됩니다)"
      )
    ) {
      return;
    }
    const res = resetManufacturersAndLinesToDefault();
    setManufacturers(res.manufacturers);
    setLines(res.lines);
    if (res.manufacturers.length > 0) setSelectedMfgId(res.manufacturers[0].id);
    setSelectedLineIdState(null);
    setCurrentMode("view");
    showToast("제조처 및 제조라인 Master가 표준 초기 데이터로 복구되었습니다.");
  };

  const getTypeBadge = (type: ManufacturerType) => {
    switch (type) {
      case "internal":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            자사 공장
          </span>
        );
      case "oem":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            외주(OEM)
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            기타
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col overflow-hidden">
        {/* ======================================================== */}
        {/* 모달 상단 헤더 */}
        {/* ======================================================== */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">
                  제조처 / 제조라인 Master 관리
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  제조처 ➔ 라인 ➔ 생산제품
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                자사 공장 및 OEM 협력사의 제조라인 규격을 관리하고, 제품 Master와 1:N으로 연결합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="광동제약 표준 제조처/라인 데이터로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본값 복구</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 토스트 알림 */}
        {/* ======================================================== */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-center gap-2 shadow-inner animate-in slide-in-from-top-2 duration-150 shrink-0">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 검색 및 필터 툴바 */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제조처명, 라인명, 생산제품군 검색..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 제조처 유형 필터 */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  typeFilter === "all"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("internal")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  typeFilter === "internal"
                    ? "bg-white text-blue-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                자사
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("oem")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  typeFilter === "oem"
                    ? "bg-white text-purple-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                OEM
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("etc")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  typeFilter === "etc"
                    ? "bg-white text-slate-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                기타
              </button>
            </div>

            {/* 사용/미사용 필터 */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("active")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === "active"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                사용 중
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("inactive")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === "inactive"
                    ? "bg-white text-slate-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                미사용
              </button>
            </div>

            {/* 제조처 추가 버튼 */}
            <button
              type="button"
              id="btn-add-mfg-master"
              onClick={handleOpenAddMfg}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-200 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>제조처 추가</span>
            </button>

            {/* 라인 추가 버튼 */}
            <button
              type="button"
              id="btn-add-line-master"
              onClick={() => handleOpenAddLine(selectedMfgId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>라인 추가</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2단 분할 레이아웃: 좌측 제조처/라인 트리 + 우측 상세/편집 */}
        {/* ======================================================== */}
        <div className="flex-1 flex min-h-0 bg-slate-50/50">
          {/* [좌측 목록: 제조처 및 소속 라인 트리] */}
          <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-200 bg-white flex flex-col min-h-0">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>제조처 목록 ({filteredManufacturers.length}개소)</span>
              <span className="text-[11px] text-slate-400 font-normal">
                클릭 시 세부 라인 및 제품 연계
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
              {filteredManufacturers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Factory className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">검색 조건에 맞는 제조처가 없습니다.</p>
                </div>
              ) : (
                filteredManufacturers.map((m) => {
                  const isSelected = currentMfg?.id === m.id;
                  const childLines = lines.filter((l) => l.manufacturerId === m.id);

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMfgId(m.id);
                        setSelectedLineIdState(null);
                        setCurrentMode("view");
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-300 shadow-xs ring-1 ring-indigo-400/40"
                          : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                      } ${!m.isActive ? "opacity-60 bg-slate-100/50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getTypeBadge(m.type)}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                m.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-200 text-slate-600 border border-slate-300"
                              }`}
                            >
                              {m.isActive ? "사용 중" : "미사용"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              보유 라인 {childLines.length}개
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                            {m.name}
                          </h4>

                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {m.teamOrCategory || m.factoryLocation || "위치 정보 없음"}
                          </p>

                          {/* 자식 라인 목록 프리뷰 (칩 형태) */}
                          {childLines.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {childLines.map((l) => (
                                <span
                                  key={l.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMfgId(m.id);
                                    setSelectedLineIdState(l.id);
                                    setCurrentMode("view");
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                                    selectedLineIdState === l.id
                                      ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {l.lineName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 mt-2 shrink-0 ${
                            isSelected ? "text-indigo-600" : "text-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* [우측 패널: 제조처 상세 / 라인 목록 / 등록/수정 폼] */}
          <div className="hidden md:flex flex-1 flex-col min-h-0 bg-white overflow-hidden">
            {/* [모드 1] 제조처 등록/수정 폼 */}
            {currentMode === "add-mfg" || currentMode === "edit-mfg" ? (
              <form onSubmit={handleSaveMfgForm} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {currentMode === "edit-mfg" ? "제조처 Master 수정" : "신규 제조처 Master 등록"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      자사 공장 또는 외주 협력처의 명칭과 기본 속성을 입력합니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentMode("view")}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      id="btn-save-mfg-form"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-200 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>저장</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        제조처 ID <span className="text-slate-400 font-normal">(고유 식별자)</span>
                      </label>
                      <input
                        type="text"
                        value={mfgFormData.id || ""}
                        disabled={currentMode === "edit-mfg"}
                        onChange={(e) => setMfgFormData({ ...mfgFormData, id: e.target.value })}
                        placeholder="예: mfg-kd-pyeongtaek"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        제조처명 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mfgFormData.name || ""}
                        onChange={(e) => setMfgFormData({ ...mfgFormData, name: e.target.value })}
                        placeholder="예: 광동제약 평택공장, 삼양패키징 광혜원공장"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {formErrors.name && (
                        <span className="text-[11px] text-rose-500 mt-1 block font-semibold">
                          {formErrors.name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        제조처 유형 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={mfgFormData.type || "internal"}
                        onChange={(e) =>
                          setMfgFormData({
                            ...mfgFormData,
                            type: e.target.value as ManufacturerType,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="internal">자사 공장 (internal)</option>
                        <option value="oem">외주 생산 협력처 (OEM)</option>
                        <option value="etc">기타 가공처 (etc)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        공장 소재지
                      </label>
                      <input
                        type="text"
                        value={mfgFormData.factoryLocation || ""}
                        onChange={(e) =>
                          setMfgFormData({ ...mfgFormData, factoryLocation: e.target.value })
                        }
                        placeholder="예: 경기도 평택시 서탄면"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        주력 생산 품목군 / 팀
                      </label>
                      <input
                        type="text"
                        value={mfgFormData.teamOrCategory || ""}
                        onChange={(e) =>
                          setMfgFormData({ ...mfgFormData, teamOrCategory: e.target.value })
                        }
                        placeholder="예: 식품생산팀 (혼합음료·다류)"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        사용 여부
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="mfgIsActive"
                            checked={mfgFormData.isActive === true}
                            onChange={() => setMfgFormData({ ...mfgFormData, isActive: true })}
                            className="text-indigo-600"
                          />
                          <span className="text-xs font-semibold text-emerald-700">
                            사용 중 (Active)
                          </span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="mfgIsActive"
                            checked={mfgFormData.isActive === false}
                            onChange={() => setMfgFormData({ ...mfgFormData, isActive: false })}
                            className="text-slate-500"
                          />
                          <span className="text-xs font-semibold text-slate-500">
                            미사용 (Inactive)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        기본 연계 제조공정 템플릿
                      </label>
                      <select
                        value={mfgFormData.defaultProcessPresetId || ""}
                        onChange={(e) =>
                          setMfgFormData({
                            ...mfgFormData,
                            defaultProcessPresetId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="">선택 안 함</option>
                        {factoryPresets.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.type === "internal" ? "자사" : "외주"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">비고</label>
                      <textarea
                        rows={3}
                        value={mfgFormData.notes || ""}
                        onChange={(e) => setMfgFormData({ ...mfgFormData, notes: e.target.value })}
                        placeholder="특이사항, 주요 생산 관리점, 인증 규격 등을 입력합니다."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : currentMode === "add-line" || currentMode === "edit-line" ? (
              /* [모드 2] 제조라인 등록/수정 폼 */
              <form onSubmit={handleSaveLineForm} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {currentMode === "edit-line"
                        ? "제조라인 Master 수정"
                        : "신규 제조라인 Master 등록"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      소속 제조처를 지정하고 개별 라인의 명칭과 생산 제품군을 등록합니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentMode("view")}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      id="btn-save-line-form"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-200 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>라인 저장</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        소속 제조처 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={lineFormData.manufacturerId || ""}
                        onChange={(e) =>
                          setLineFormData({ ...lineFormData, manufacturerId: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        {manufacturers.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.type === "internal" ? "자사" : "OEM"}] {m.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.manufacturerId && (
                        <span className="text-[11px] text-rose-500 mt-1 block font-semibold">
                          {formErrors.manufacturerId}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        라인 ID <span className="text-slate-400 font-normal">(고유 식별자)</span>
                      </label>
                      <input
                        type="text"
                        value={lineFormData.id || ""}
                        disabled={currentMode === "edit-line"}
                        onChange={(e) => setLineFormData({ ...lineFormData, id: e.target.value })}
                        placeholder="예: line-kd-pt-01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        라인명 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lineFormData.lineName || ""}
                        onChange={(e) =>
                          setLineFormData({ ...lineFormData, lineName: e.target.value })
                        }
                        placeholder="예: 1호 라인(유리병 충전), Aseptic 2호기"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {formErrors.lineName && (
                        <span className="text-[11px] text-rose-500 mt-1 block font-semibold">
                          {formErrors.lineName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        생산 제품군 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lineFormData.productCategory || ""}
                        onChange={(e) =>
                          setLineFormData({ ...lineFormData, productCategory: e.target.value })
                        }
                        placeholder="예: 유리병 비타민/혼합음료 100ml, 무균 액상차 500ml"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                      {formErrors.productCategory && (
                        <span className="text-[11px] text-rose-500 mt-1 block font-semibold">
                          {formErrors.productCategory}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        사용 여부
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="lineIsActive"
                            checked={lineFormData.isActive === true}
                            onChange={() => setLineFormData({ ...lineFormData, isActive: true })}
                            className="text-indigo-600"
                          />
                          <span className="text-xs font-semibold text-emerald-700">
                            사용 중 (Active)
                          </span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="lineIsActive"
                            checked={lineFormData.isActive === false}
                            onChange={() => setLineFormData({ ...lineFormData, isActive: false })}
                            className="text-slate-500"
                          />
                          <span className="text-xs font-semibold text-slate-500">
                            미사용 (Inactive)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        라인 설명 (설비 및 공정 특징)
                      </label>
                      <textarea
                        rows={2}
                        value={lineFormData.description || ""}
                        onChange={(e) =>
                          setLineFormData({ ...lineFormData, description: e.target.value })
                        }
                        placeholder="설비 제원, 충전 속도, 캡핑 방식 등을 간략히 입력합니다."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        비고 (품질 관리점 / CCP 메모)
                      </label>
                      <input
                        type="text"
                        value={lineFormData.notes || ""}
                        onChange={(e) => setLineFormData({ ...lineFormData, notes: e.target.value })}
                        placeholder="예: 캡핑 토크 온라인 모니터링 적용, 금속검출기 전수 검사"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : currentMfg ? (
              /* [모드 3] 선택된 제조처 및 소속 라인 상세 뷰 */
              <div className="flex-1 flex flex-col min-h-0">
                {/* 상단 제조처 헤더 */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(currentMfg.type)}
                        <h3 className="text-sm font-bold text-slate-900">{currentMfg.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            currentMfg.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-slate-200 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {currentMfg.isActive ? "사용 중" : "미사용"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ID: <code className="font-mono text-slate-700">{currentMfg.id}</code> ·{" "}
                        {currentMfg.factoryLocation || "위치 미입력"} ·{" "}
                        {currentMfg.teamOrCategory || ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMfgActive(currentMfg.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                    >
                      {currentMfg.isActive ? "미사용으로 변경" : "사용 중으로 활성화"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditMfg(currentMfg)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>제조처 수정</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddLine(currentMfg.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-200 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>이 제조처에 라인 추가</span>
                    </button>
                  </div>
                </div>

                {/* 본문: 소속 라인 카드 및 연계 생산제품 목록 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* 제조처 추가 정보 요약 */}
                  {currentMfg.notes && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block mb-0.5">제조처 관리 메모</span>
                        <p className="leading-relaxed">{currentMfg.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* 소속 라인 섹션 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          보유 제조라인 목록 ({currentMfgLines.length}개 라인)
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        제조처 ➔ <strong>제조라인</strong> ➔ <strong>생산제품</strong> 계층 구조
                      </span>
                    </div>

                    {currentMfgLines.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                        <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">등록된 제조라인이 없습니다.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          상단의 <strong>[이 제조처에 라인 추가]</strong>를 눌러 첫 라인을 등록해 주세요.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentMfgLines.map((line) => {
                          const isLineSelected = selectedLineIdState === line.id;
                          const lineProducts =
                            productsByLineMap[line.id] ||
                            productsByLineMap[`${currentMfg.name}_${line.lineName}`] ||
                            [];

                          return (
                            <div
                              key={line.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                isLineSelected
                                  ? "bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-400/30"
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                              }`}
                            >
                              {/* 라인 타이틀 & 액션 */}
                              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100 flex-wrap">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                      {line.id}
                                    </span>
                                    <h5 className="text-xs font-bold text-slate-900">{line.lineName}</h5>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                        line.isActive
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-slate-200 text-slate-600 border border-slate-300"
                                      }`}
                                    >
                                      {line.isActive ? "가동 중" : "비가동"}
                                    </span>
                                    <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                                      {line.productCategory}
                                    </span>
                                  </div>
                                  {line.description && (
                                    <p className="text-[11px] text-slate-500 mt-1">{line.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleLineActive(line.id, e)}
                                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    {line.isActive ? "비활성화" : "활성화"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditLine(line, e)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-500" />
                                    <span>수정</span>
                                  </button>
                                </div>
                              </div>

                              {/* 라인 비고 / CCP 메모 */}
                              {line.notes && (
                                <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                  <strong className="text-slate-700">관리 메모:</strong> {line.notes}
                                </div>
                              )}

                              {/* [계층 3단계] 이 라인에서 생산되는 제품 목록 */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                  <span className="font-bold text-slate-700 flex items-center gap-1">
                                    <Package className="w-3 h-3 text-blue-600" />
                                    <span>생산 제품 ({lineProducts.length}개 제품 연결됨)</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Product Master에서 이 라인 배정
                                  </span>
                                </div>

                                {lineProducts.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic">
                                    현재 이 라인에 배정된 제품이 없습니다. (제품 Master에서 등록 시 선택 가능)
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {lineProducts.map((prod) => (
                                      <span
                                        key={prod.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                                      >
                                        <span className="font-mono text-[10px] text-blue-600">
                                          {prod.productCode}
                                        </span>
                                        <span>{prod.productName}</span>
                                        <span className="text-[10px] text-blue-500 font-normal">
                                          ({prod.packageType} {prod.volume})
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                좌측 목록에서 제조처를 선택해 주세요.
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 모달 하단 푸터 */}
        {/* ======================================================== */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            * 등록된 제조처와 제조라인은 <strong>제품 Master</strong> 등록 시 드롭다운으로 선택하여
            안전하게 ID 기반으로 자동 연계됩니다.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
