import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Edit3,
  RotateCcw,
  Check,
  Package,
  Layers,
  Factory,
  ShieldCheck,
  AlertCircle,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Filter,
  ArrowRight,
  Copy,
  Info,
} from "lucide-react";
import { ProductMaster, ManufacturerMaster, ManufactureLineMaster } from "../types";
import {
  loadAllProducts,
  saveProduct,
  toggleProductActive,
  deleteProduct,
  resetProductsToDefault,
  searchProducts,
} from "../data/productMaster";
import {
  loadAllManufacturers,
  loadAllManufactureLines,
  getLinesByManufacturerId,
  findManufacturerById,
  findLineById,
} from "../data/manufacturerMaster";
import { ManufacturerMasterModal } from "./ManufacturerMasterModal";
import { loadAllFactoryPresets } from "../data/factoryProcessPresets";

interface ProductMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: ProductMaster) => void;
  selectedProductId?: string;
  isSelectionMode?: boolean; // When true, primary CTA is "이 제품으로 클레임 작성/적용"
}

const PRODUCT_TYPE_OPTIONS = [
  "혼합음료",
  "다류(액상차)",
  "일반의약품",
  "건강기능식품",
  "탄산음료",
  "과채주스/음료",
  "캔디류(젤리)",
  "의약외품",
];

const PACKAGE_TYPE_OPTIONS = [
  "유리병",
  "Aseptic PET",
  "알루미늄 캔",
  "스틱 파우치",
  "스탠딩 파우치",
  "테트라팩",
  "PTP/블리스터",
];

const CLAIM_TYPE_TAG_OPTIONS = [
  "유리 파손/이물",
  "캡 흠집/탄화",
  "변질/산패",
  "침전물/혼탁",
  "시밍 불량/누액",
  "파우치 실링 불량/누액",
  "용기 변형/찌그러짐",
  "내용량 부족",
  "개봉 불량(이지컷)",
  "성형 불량/응집",
];

export function ProductMasterModal({
  isOpen,
  onClose,
  onSelectProduct,
  selectedProductId,
  isSelectionMode = false,
}: ProductMasterModalProps) {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerMaster[]>([]);
  const [lines, setLines] = useState<ManufactureLineMaster[]>([]);
  const [isMfgModalOpen, setIsMfgModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);

  // Form State (for adding/editing)
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ProductMaster>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available factory presets for linking related process
  const factoryPresets = useMemo(() => loadAllFactoryPresets(), []);

  // Reload all master data
  const reloadMasterData = () => {
    const pList = loadAllProducts();
    const mList = loadAllManufacturers();
    const lList = loadAllManufactureLines();
    setProducts(pList);
    setManufacturers(mList);
    setLines(lList);
    return { pList, mList, lList };
  };

  // Load products on open
  useEffect(() => {
    if (isOpen) {
      const { pList } = reloadMasterData();
      if (selectedProductId) {
        const found = pList.find((p) => p.id === selectedProductId);
        if (found) setSelectedProduct(found);
        else if (pList.length > 0) setSelectedProduct(pList[0]);
      } else if (pList.length > 0) {
        setSelectedProduct(pList[0]);
      }
      setIsEditing(false);
    }
  }, [isOpen, selectedProductId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return searchProducts(products, searchQuery, activeFilter);
  }, [products, searchQuery, activeFilter]);

  // Lines available for currently selected manufacturer in edit form
  const availableLinesForEdit = useMemo(() => {
    if (!editFormData.manufacturerId) return [];
    return lines.filter((l) => l.manufacturerId === editFormData.manufacturerId);
  }, [lines, editFormData.manufacturerId]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [products]);

  if (!isOpen) return null;

  // Open Edit Form
  const handleOpenEdit = (product: ProductMaster) => {
    setEditFormData({ ...product });
    setFormErrors({});
    setIsEditing(true);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    const newId = `prod-custom-${Date.now()}`;
    const nextSeq = String(products.length + 1).padStart(3, "0");
    const defaultMfg =
      manufacturers.find((m) => m.isActive) ||
      manufacturers[0] || { id: "mfg-kd-pyeongtaek", name: "광동제약 평택공장" };
    const defaultLines = lines.filter((l) => l.manufacturerId === defaultMfg.id && l.isActive);
    const defaultLine = defaultLines[0] || {
      id: "line-kd-pt-01",
      lineName: "1호 라인(유리병 충전)",
    };

    setEditFormData({
      id: newId,
      productName: "",
      productCode: `KD-CUST-${nextSeq}`,
      productType: "혼합음료",
      subProductType: "",
      volume: "100ml",
      packageType: "유리병",
      containerType: "갈색 유리병 100ml",
      manufacturerId: defaultMfg.id,
      manufacturer: defaultMfg.name,
      manufactureLineId: defaultLine.id,
      manufactureLine: defaultLine.lineName,
      isActive: true,
      description: "",
      primaryClaimTypes: ["유리 파손/이물", "캡 흠집/탄화"],
      relatedProcessPresetId: "internal-food",
      relatedProcessName: "광동제약 평택공장 식품팀",
      notes: "",
      isCustom: true,
    });
    setFormErrors({});
    setIsEditing(true);
  };

  // Toggle Active/Inactive
  const handleToggleActive = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleProductActive(productId);
    setProducts(updated);
    if (selectedProduct?.id === productId) {
      const nextSelected = updated.find((p) => p.id === productId);
      if (nextSelected) setSelectedProduct(nextSelected);
    }
    const target = updated.find((p) => p.id === productId);
    showToast(`'${target?.productName}' 제품이 ${target?.isActive ? "사용 상태로 활성화" : "미사용으로 변경"}되었습니다.`);
  };

  // Save Add/Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!editFormData.productName?.trim()) {
      errors.productName = "제품명을 입력해 주세요.";
    }
    if (!editFormData.productCode?.trim()) {
      errors.productCode = "제품코드를 입력해 주세요.";
    }
    if (!editFormData.manufacturer?.trim()) {
      errors.manufacturer = "제조처를 입력해 주세요.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const toSave: ProductMaster = {
      id: editFormData.id || `prod-custom-${Date.now()}`,
      productName: editFormData.productName!.trim(),
      productCode: editFormData.productCode!.trim().toUpperCase(),
      productType: editFormData.productType || "혼합음료",
      subProductType: editFormData.subProductType || "",
      volume: editFormData.volume || "100ml",
      packageType: editFormData.packageType || "유리병",
      containerType: editFormData.containerType || "",
      manufacturerId: editFormData.manufacturerId,
      manufacturer: editFormData.manufacturer!.trim(),
      manufactureLineId: editFormData.manufactureLineId,
      manufactureLine: editFormData.manufactureLine || "기본 라인",
      isActive: editFormData.isActive ?? true,
      description: editFormData.description || "",
      primaryClaimTypes: editFormData.primaryClaimTypes || [],
      relatedProcessPresetId: editFormData.relatedProcessPresetId,
      relatedProcessName: editFormData.relatedProcessName,
      notes: editFormData.notes || "",
      isCustom: true,
    };

    const updated = saveProduct(toSave);
    setProducts(updated);
    setSelectedProduct(toSave);
    setIsEditing(false);
    showToast(`'${toSave.productName}' 제품 마스터가 성공적으로 저장되었습니다.`);
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (!confirm("모든 제품 마스터를 광동제약 초기 표준 규격으로 초기화하시겠습니까? (사용자 추가 항목이 초기화됩니다)")) {
      return;
    }
    const def = resetProductsToDefault();
    setProducts(def);
    if (def.length > 0) setSelectedProduct(def[0]);
    setIsEditing(false);
    showToast("제품 마스터가 표준 초기 데이터로 복구되었습니다.");
  };

  // Apply to Claim Action
  const handleApplyToClaim = (product: ProductMaster) => {
    if (onSelectProduct) {
      onSelectProduct(product);
      onClose();
    }
  };

  // Toggle claim type in multi-selection tag
  const handleToggleClaimTag = (tag: string) => {
    const current = editFormData.primaryClaimTypes || [];
    if (current.includes(tag)) {
      setEditFormData({
        ...editFormData,
        primaryClaimTypes: current.filter((t) => t !== tag),
      });
    } else {
      setEditFormData({
        ...editFormData,
        primaryClaimTypes: [...current, tag],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col overflow-hidden">
        {/* ======================================================== */}
        {/* 상단 모달 헤더 */}
        {/* ======================================================== */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">제품 Master (Product Master) 관리</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  표준 제원 관리
                </span>
                {isSelectionMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    선택 모드
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                제품 기본정보, 규격, 포장형태, 제조라인을 관리하고 신규 클레임 작성 및 프리셋에 재사용합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="광동제약 표준 제품 마스터로 복구"
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
          <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제품명, 제품코드, 유형, 제조처 검색..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
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
            {/* 사용 여부 필터 탭 */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeFilter === "all"
                    ? "bg-white text-blue-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                전체 ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("active")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeFilter === "active"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                사용 중 ({counts.active})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("inactive")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeFilter === "inactive"
                    ? "bg-white text-slate-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                미사용 ({counts.inactive})
              </button>
            </div>

            {/* 제품 추가 버튼 */}
            <button
              type="button"
              id="btn-add-product-master"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>제품 추가</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 본문 2단 분할 레이아웃: 좌측 목록 + 우측 상세/편집 */}
        {/* ======================================================== */}
        <div className="flex-1 flex min-h-0 bg-slate-50/50">
          {/* [좌측] 제품 목록 리스트 */}
          <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-200 bg-white flex flex-col min-h-0">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>제품 목록 ({filteredProducts.length}건)</span>
              <span className="text-[11px] text-slate-400 font-normal">코드 순 / 사용 상태 정렬</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">검색 조건에 맞는 제품이 없습니다.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">검색어를 변경하거나 [제품 추가]를 진행해 주세요.</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setIsEditing(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-300 shadow-xs ring-1 ring-blue-400/40"
                          : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                      } ${!p.isActive ? "opacity-60 bg-slate-100/50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {p.productCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                p.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-200 text-slate-600 border border-slate-300"
                              }`}
                            >
                              {p.isActive ? "사용 중" : "미사용"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">{p.productType}</span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{p.productName}</h4>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 truncate">
                            <span>{p.packageType}</span>
                            <span>·</span>
                            <span>{p.volume}</span>
                            <span>·</span>
                            <span className="truncate">{p.manufacturer}</span>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 mt-2 shrink-0 ${
                            isSelected ? "text-blue-600" : "text-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* [우측] 제품 상세 뷰 또는 수정/추가 폼 */}
          <div className="hidden md:flex flex-1 flex-col min-h-0 bg-white overflow-hidden">
            {isEditing ? (
              /* ======================================================== */
              /* [우측 화면 A] 제품 등록 / 수정 폼 */
              /* ======================================================== */
              <form onSubmit={handleSaveForm} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {editFormData.id && products.some((p) => p.id === editFormData.id)
                        ? "제품 마스터 수정"
                        : "신규 제품 마스터 등록"}
                    </h3>
                    <p className="text-[11px] text-slate-500">제품의 기본 제원 및 제조공정 정보를 입력합니다.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      id="btn-save-product-form"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>저장</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* [기본정보 카드] */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">기본정보 (필수 및 주요 제원)</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          제품명 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editFormData.productName || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                          placeholder="예: 비타500 100ml"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.productName && (
                          <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.productName}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          제품코드 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editFormData.productCode || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, productCode: e.target.value })}
                          placeholder="예: KD-VIT-001"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.productCode && (
                          <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.productCode}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">제품 유형</label>
                        <select
                          value={editFormData.productType || "혼합음료"}
                          onChange={(e) => setEditFormData({ ...editFormData, productType: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        >
                          {PRODUCT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">세부 제품 유형</label>
                        <input
                          type="text"
                          value={editFormData.subProductType || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, subProductType: e.target.value })}
                          placeholder="예: 비타민 음료, 옥수수수염차"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">용량 / 규격</label>
                        <input
                          type="text"
                          value={editFormData.volume || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, volume: e.target.value })}
                          placeholder="예: 100ml, 500ml, 1.5L"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">포장 형태</label>
                        <select
                          value={editFormData.packageType || "유리병"}
                          onChange={(e) => setEditFormData({ ...editFormData, packageType: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        >
                          {PACKAGE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">용기 종류 상세</label>
                        <input
                          type="text"
                          value={editFormData.containerType || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, containerType: e.target.value })}
                          placeholder="예: 갈색 유리병 100ml, 내열 무균 PET 500ml"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>

                      {/* 제조처 선택 (제조처 Master 연동) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            제조처 <span className="text-rose-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsMfgModalOpen(true)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                            title="제조처 및 제조라인 Master 관리창 열기"
                          >
                            <Factory className="w-3 h-3" />
                            <span>제조처 Master 관리</span>
                          </button>
                        </div>
                        <select
                          value={editFormData.manufacturerId || ""}
                          onChange={(e) => {
                            const foundMfg = manufacturers.find((m) => m.id === e.target.value);
                            const childLines = lines.filter((l) => l.manufacturerId === foundMfg?.id);
                            const firstLine = childLines[0];
                            setEditFormData({
                              ...editFormData,
                              manufacturerId: foundMfg?.id,
                              manufacturer: foundMfg?.name || e.target.value,
                              manufactureLineId: firstLine?.id,
                              manufactureLine: firstLine?.lineName || "",
                              relatedProcessPresetId:
                                foundMfg?.defaultProcessPresetId || editFormData.relatedProcessPresetId,
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                        >
                          <option value="">제조처 Master에서 선택...</option>
                          {manufacturers.map((m) => (
                            <option key={m.id} value={m.id}>
                              [{m.type === "internal" ? "자사" : "OEM"}] {m.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.manufacturer && (
                          <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.manufacturer}</span>
                        )}
                      </div>

                      {/* 제조라인 선택 (제조라인 Master 연동) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">제조라인</label>
                          {editFormData.manufacturerId && (
                            <span className="text-[10px] text-indigo-600 font-medium">
                              소속 라인 {availableLinesForEdit.length}개
                            </span>
                          )}
                        </div>
                        <select
                          value={editFormData.manufactureLineId || ""}
                          onChange={(e) => {
                            const foundLine = lines.find((l) => l.id === e.target.value);
                            setEditFormData({
                              ...editFormData,
                              manufactureLineId: foundLine?.id,
                              manufactureLine: foundLine?.lineName || e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                        >
                          <option value="">제조라인 Master에서 선택...</option>
                          {availableLinesForEdit.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.lineName} ({l.productCategory})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">사용 여부</label>
                        <div className="flex items-center gap-3 mt-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isActive"
                              checked={editFormData.isActive === true}
                              onChange={() => setEditFormData({ ...editFormData, isActive: true })}
                              className="text-blue-600"
                            />
                            <span className="text-xs font-semibold text-emerald-700">사용 중 (Active)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isActive"
                              checked={editFormData.isActive === false}
                              onChange={() => setEditFormData({ ...editFormData, isActive: false })}
                              className="text-slate-500"
                            />
                            <span className="text-xs font-semibold text-slate-500">미사용 (Inactive)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* [추가정보 카드] */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">추가정보 (설명, 클레임 유형 및 연계 공정)</h4>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">제품 설명</label>
                        <textarea
                          rows={2}
                          value={editFormData.description || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          placeholder="제품의 주요 특징, 규격, 핵심 성분 등을 간략히 입력합니다."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                          주요 클레임 유형 (해당 제품에서 빈발하는 불만 유형 태그 선택)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {CLAIM_TYPE_TAG_OPTIONS.map((tag) => {
                            const isSelected = (editFormData.primaryClaimTypes || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleClaimTag(tag)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                {isSelected ? "✓ " : "+ "}
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">관련 제조공정 템플릿 연계</label>
                          <select
                            value={editFormData.relatedProcessPresetId || ""}
                            onChange={(e) => {
                              const found = factoryPresets.find((f) => f.id === e.target.value);
                              setEditFormData({
                                ...editFormData,
                                relatedProcessPresetId: e.target.value,
                                relatedProcessName: found?.name || "",
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                          >
                            <option value="">선택 안 함 (미지정)</option>
                            {factoryPresets.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.type === "internal" ? "자사" : "외주"})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">비고 (내부 품질 관리 메모)</label>
                          <input
                            type="text"
                            value={editFormData.notes || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            placeholder="예: 캡핑 토크(Sealing) 중점 관리 대상"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            ) : selectedProduct ? (
              /* ======================================================== */
              /* [우측 화면 B] 선택된 제품 상세 보기 화면 */
              /* ======================================================== */
              <div className="flex-1 flex flex-col min-h-0">
                {/* 상세 헤더 */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {selectedProduct.productName.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 rounded bg-slate-200">
                          {selectedProduct.productCode}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{selectedProduct.productName}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            selectedProduct.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-slate-200 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {selectedProduct.isActive ? "사용 중" : "미사용"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {selectedProduct.productType} · {selectedProduct.packageType} · {selectedProduct.volume}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 사용/미사용 토글 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(selectedProduct.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        selectedProduct.isActive
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-bold"
                      }`}
                    >
                      {selectedProduct.isActive ? "미사용으로 변경" : "사용 중으로 활성화"}
                    </button>

                    {/* 수정 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedProduct)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>수정</span>
                    </button>

                    {/* 클레임 적용 메인 버튼 */}
                    {onSelectProduct && (
                      <button
                        type="button"
                        id="btn-apply-product-to-claim"
                        onClick={() => handleApplyToClaim(selectedProduct)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-100" />
                        <span>이 제품으로 클레임 작성/적용</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 상세 본문 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* [기본 제원 정보 카드] */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>기본 제원 정보</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">제품코드</span>
                        <strong className="text-slate-900 font-mono">{selectedProduct.productCode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">제품명</span>
                        <strong className="text-slate-900">{selectedProduct.productName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">제품 유형</span>
                        <span className="font-semibold text-slate-800">{selectedProduct.productType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">세부 제품 유형</span>
                        <span className="font-semibold text-slate-800">{selectedProduct.subProductType || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">용량 / 규격</span>
                        <span className="font-semibold text-slate-800">{selectedProduct.volume || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">포장 형태</span>
                        <span className="font-semibold text-slate-800">{selectedProduct.packageType}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 text-[11px] block">용기 종류 상세</span>
                        <span className="font-semibold text-slate-800">{selectedProduct.containerType || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">사용 상태</span>
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                            selectedProduct.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {selectedProduct.isActive ? "사용 중 (활성)" : "미사용 (비활성)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* [생산 및 제조라인 카드] */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Factory className="w-4 h-4 text-indigo-600" />
                        <span>제조처 및 생산라인 (Master 연계)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsMfgModalOpen(true)}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-indigo-600" />
                        <span>제조처/라인 Master 열기</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">담당 제조처</span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <strong className="text-slate-900">{selectedProduct.manufacturer}</strong>
                          {selectedProduct.manufacturerId && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {selectedProduct.manufacturerId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">배정 제조라인</span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <strong className="text-slate-900">{selectedProduct.manufactureLine || "-"}</strong>
                          {selectedProduct.manufactureLineId && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              {selectedProduct.manufactureLineId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 text-[11px] block">연계 제조공정 템플릿</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs">
                            {selectedProduct.relatedProcessName || "미지정"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* [클레임 유형 및 비고 카드] */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-600" />
                      <span>추가정보 및 관리 메모</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      {selectedProduct.description && (
                        <div>
                          <span className="text-slate-500 text-[11px] block mb-1">제품 설명</span>
                          <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                            {selectedProduct.description}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-slate-500 text-[11px] block mb-1.5">주요 클레임 유형</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProduct.primaryClaimTypes && selectedProduct.primaryClaimTypes.length > 0 ? (
                            selectedProduct.primaryClaimTypes.map((t) => (
                              <span
                                key={t}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">지정된 주요 클레임 유형이 없습니다.</span>
                          )}
                        </div>
                      </div>

                      {selectedProduct.notes && (
                        <div>
                          <span className="text-slate-500 text-[11px] block mb-1">비고 (품질 메모)</span>
                          <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                            {selectedProduct.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                좌측 목록에서 제품을 선택해 주세요.
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 모달 하단 푸터 */}
        {/* ======================================================== */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            * 등록된 제품 마스터는 클레임 작성 시 <strong>[제품 마스터에서 선택]</strong>으로 1초 만에 자동 완성됩니다.
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

      {/* 제조처 / 제조라인 Master 관리 모달 */}
      <ManufacturerMasterModal
        isOpen={isMfgModalOpen}
        onClose={() => {
          setIsMfgModalOpen(false);
          const mList = loadAllManufacturers();
          const lList = loadAllManufactureLines();
          setManufacturers(mList);
          setLines(lList);
        }}
        selectedManufacturerId={editFormData.manufacturerId || selectedProduct?.manufacturerId}
        selectedLineId={editFormData.manufactureLineId || selectedProduct?.manufactureLineId}
      />
    </div>
  );
}
