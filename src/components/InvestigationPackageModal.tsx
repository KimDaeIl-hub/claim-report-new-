import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Sparkles,
  Zap,
  Package,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Workflow,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Search,
  FileCheck2,
  HelpCircle,
  Edit2,
  Check,
} from "lucide-react";
import {
  InvestigationPackage,
  InvestigationPackageInput,
  InvestigationPackageItem,
  ProductMaster,
  ReportData,
} from "../types";
import { loadAllProducts } from "../data/productMaster";
import {
  assembleInvestigationPackage,
  normalizeClaimTypeCategory,
} from "../data/investigationPackageBuilder";
import { CLAIM_TYPES, ClaimTypeCategory } from "../utils/claimTypeConfig";
import { SimilarClaimRecommendationCard } from "./SimilarClaimRecommendationCard";

interface InvestigationPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInvestigation: (assembledPackage: InvestigationPackage) => void;
  onUseAsInvestigationPackage?: (pastReport: ReportData) => void;
  initialProduct?: string;
  initialLotNumber?: string;
}

export function InvestigationPackageModal({
  isOpen,
  onClose,
  onStartInvestigation,
  onUseAsInvestigationPackage,
  initialProduct,
  initialLotNumber,
}: InvestigationPackageModalProps) {
  const products = useMemo(() => loadAllProducts(), [isOpen]);

  // Form Inputs
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productNameInput, setProductNameInput] = useState<string>(initialProduct || "비타민 음료 A");
  const [lotNumberInput, setLotNumberInput] = useState<string>(initialLotNumber || "2026.04.15 / LOT A1204");
  const [claimTypeCategory, setClaimTypeCategory] = useState<ClaimTypeCategory>("foreign");
  const [claimSubCategoryInput, setClaimSubCategoryInput] = useState<string>("검은색 이물");
  const [customerClaimInput, setCustomerClaimInput] = useState<string>(
    "음료 개봉 직후 바닥에 검은색 작은 이물이 가라앉아 있는 것을 발견하여 제품 안전성 및 공정 이물 확인 요청함."
  );
  const [hasSample, setHasSample] = useState<boolean>(true);

  // Search product dropdown filter
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Auto-Assembled Package State
  const [assembledPackage, setAssembledPackage] = useState<InvestigationPackage | null>(null);

  // Editing single item inside package
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemMethod, setEditingItemMethod] = useState<string>("");

  // New item modal or inline inputs
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newCustomItemMethod, setNewCustomItemMethod] = useState("");

  // Initialize and auto-assemble package whenever inputs change
  useEffect(() => {
    if (!isOpen) return;

    const input: InvestigationPackageInput = {
      productId: selectedProductId || undefined,
      productName: productNameInput.trim() || "비타민 음료 A",
      lotNumber: lotNumberInput.trim(),
      claimType: claimTypeCategory,
      claimSubCategory: claimSubCategoryInput.trim(),
      customerClaim: customerClaimInput.trim(),
      hasSample,
    };

    const pkg = assembleInvestigationPackage(input);
    setAssembledPackage(pkg);
  }, [
    isOpen,
    selectedProductId,
    productNameInput,
    lotNumberInput,
    claimTypeCategory,
    claimSubCategoryInput,
    customerClaimInput,
    hasSample,
  ]);

  if (!isOpen) return null;

  // Toggle item checked state
  const handleToggleItemCheck = (itemId: string) => {
    if (!assembledPackage) return;
    setAssembledPackage({
      ...assembledPackage,
      investigationItems: assembledPackage.investigationItems.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      ),
    });
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    if (!assembledPackage) return;
    setAssembledPackage({
      ...assembledPackage,
      investigationItems: assembledPackage.investigationItems.filter((item) => item.id !== itemId),
    });
  };

  // Save edited method
  const handleSaveEditedMethod = (itemId: string) => {
    if (!assembledPackage) return;
    setAssembledPackage({
      ...assembledPackage,
      investigationItems: assembledPackage.investigationItems.map((item) =>
        item.id === itemId ? { ...item, method: editingItemMethod.trim() } : item
      ),
    });
    setEditingItemId(null);
  };

  // Add custom item
  const handleAddCustomItem = () => {
    if (!assembledPackage || !newCustomItemName.trim()) return;
    const newItem: InvestigationPackageItem = {
      id: `item-custom-${Date.now()}`,
      category: "custom",
      name: newCustomItemName.trim(),
      isRequired: false,
      isChecked: true,
      method: newCustomItemMethod.trim() || "조사자 지정 현장 점검 및 시험 방법 적용",
      targetInspectionPoints: ["현장 지정 검증 대상"],
    };
    setAssembledPackage({
      ...assembledPackage,
      investigationItems: [...assembledPackage.investigationItems, newItem],
    });
    setNewCustomItemName("");
    setNewCustomItemMethod("");
    setIsAddingCustomItem(false);
  };

  // Select product from Master
  const handleSelectProduct = (prod: ProductMaster) => {
    setSelectedProductId(prod.id);
    setProductNameInput(prod.productName);
    setShowProductDropdown(false);
  };

  // Quick preset sample buttons for demo
  const handleLoadDemoVitaA = () => {
    setSelectedProductId("prod-vita-a");
    setProductNameInput("비타민 음료 A");
    setLotNumberInput("2026.04.15 / LOT A1204");
    setClaimTypeCategory("foreign");
    setClaimSubCategoryInput("검은색 이물");
    setCustomerClaimInput("음료 개봉 직후 바닥에 검은색 작은 이물이 가라앉아 있는 것을 발견하여 문의함.");
    setHasSample(true);
  };

  const handleLoadDemoCornTea = () => {
    setSelectedProductId("prod-corn-tea-500");
    setProductNameInput("광동 옥수수수염차 500ml");
    setLotNumberInput("2026.08.20 / LOT K0820");
    setClaimTypeCategory("spoilage");
    setClaimSubCategoryInput("산패 및 이상풍미");
    setCustomerClaimInput("개봉 시 시큼한 냄새가 나고 탁한 침전물이 있어 변질 여부 확인 요청.");
    setHasSample(true);
  };

  const handleStart = () => {
    if (!assembledPackage) return;
    onStartInvestigation(assembledPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md font-black">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                  조사 패키지 자동 구성
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  핵심 기능 · 규칙 기반
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                제품 + 제조번호 + 클레임 유형을 입력하면 Master 기준정보를 자동 결합하여 조사 자료와 조사 항목을 실시간 구성합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDemoVitaA}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition-colors"
              title="예제: 비타민 음료 A + A Line + 검은색 이물 불러오기"
            >
              <span>예시 1 (비타민 A)</span>
            </button>
            <button
              type="button"
              onClick={handleLoadDemoCornTea}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 transition-colors"
              title="예시 2: 옥수수수염차 + 변질/산패 불러오기"
            >
              <span>예시 2 (옥수수차)</span>
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

        {/* Content Body: Split View (Left: Input Panel / Right: Assembled Package Result) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ========================================================================= */}
          {/* [LEFT PANEL] 조사자 기본 입력 영역 (col-span-5) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50/70 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                조사자 입력 기본 정보 (5개 항목)
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                입력 즉시 우측에 패키지가 조합됩니다.
              </span>
            </div>

            {/* 1. 제품 선택 / 입력 */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. 제품 (Product)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  제품 Master에서 선택 {showProductDropdown ? "▴" : "▾"}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={productNameInput}
                  onChange={(e) => {
                    setProductNameInput(e.target.value);
                    setSelectedProductId("");
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="예: 비타민 음료 A 또는 제품명 검색"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Product Master Dropdown */}
              {showProductDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 sticky top-0 border-b border-slate-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="제품명, 라인, 포장 형태 검색..."
                      className="w-full text-xs bg-white px-2 py-1 border border-slate-200 rounded-md focus:outline-none"
                    />
                  </div>
                  {products
                    .filter((p) => {
                      if (!productSearchQuery) return true;
                      const q = productSearchQuery.toLowerCase();
                      return (
                        p.productName.toLowerCase().includes(q) ||
                        p.manufactureLine.toLowerCase().includes(q) ||
                        p.packageType.toLowerCase().includes(q)
                      );
                    })
                    .map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <strong className="text-slate-900 block font-bold">{prod.productName}</strong>
                          <span className="text-[10px] text-slate-500">
                            {prod.manufacturer} · {prod.manufactureLine} ({prod.packageType})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {prod.volume || "100ml"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 2. 제조번호 */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                <span>2. 제조번호 (Lot No / Batch Number)</span>
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={lotNumberInput}
                onChange={(e) => setLotNumberInput(e.target.value)}
                placeholder="예: 2026.04.15 / LOT A1204"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 3. 클레임 유형 */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                <span>3. 클레임 유형 (Claim Type)</span>
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                {(
                  [
                    { id: "foreign", label: "이물 (혼입)", sub: "검은색 이물" },
                    { id: "spoilage", label: "변질/산패", sub: "이상 풍미/침전" },
                    { id: "leak", label: "누액/파손", sub: "캡 헛돎/크랙" },
                    { id: "label", label: "표시오류", sub: "날인/라벨" },
                    { id: "volume", label: "내용량/중량", sub: "충전량 미달" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClaimTypeCategory(c.id);
                      setClaimSubCategoryInput(c.sub);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      claimTypeCategory === c.id
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs font-bold"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[11px] leading-tight font-bold">{c.label}</span>
                    <span
                      className={`text-[9.5px] block truncate mt-0.5 ${
                        claimTypeCategory === c.id ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {c.sub}
                    </span>
                  </button>
                ))}
              </div>

              {/* 클레임 세부 명칭 (예: 검은색 이물) */}
              <input
                type="text"
                value={claimSubCategoryInput}
                onChange={(e) => setClaimSubCategoryInput(e.target.value)}
                placeholder="세부 클레임 명칭 (예: 검은색 이물, 유리 이물)"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* 4. 소비자 주장 */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                <span>4. 소비자 주장 내용 (Customer Claim Statement)</span>
              </label>
              <textarea
                rows={2}
                value={customerClaimInput}
                onChange={(e) => setCustomerClaimInput(e.target.value)}
                placeholder="소비자 접수 주장 내용을 상세히 입력하세요."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 5. 현품 확보 여부 */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                <span>5. 현품 확보 여부 (Sample Status)</span>
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasSample(true)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    hasSample
                      ? "bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs ring-2 ring-emerald-400/30"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs block font-bold">● 현품 확보 (회수 완료)</span>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      hasSample ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    현품 실물 정밀 분석 진행
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasSample(false)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    !hasSample
                      ? "bg-amber-600 text-white border-amber-700 font-bold shadow-xs ring-2 ring-amber-400/30"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs block font-bold">○ 미확보 (사진/진술 접수)</span>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      !hasSample ? "text-amber-100" : "text-slate-400"
                    }`}
                  >
                    보관품 대조 및 기록 조사 중심
                  </span>
                </button>
              </div>
            </div>

            {/* 원칙 명시 카드 */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <strong className="block font-bold flex items-center gap-1 text-amber-950">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>핵심 원칙 안내</span>
              </strong>
              <p className="leading-relaxed">
                시스템은 원인을 확정하지 않으며, Master 기준정보에 기반하여 <strong>조사 대상</strong>을 추천합니다. 최종 원인은 현장 조사와 시험 분석 후 조사자가 확정합니다.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* [RIGHT PANEL] 자동 구성된 조사 패키지 결과 화면 (col-span-7) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 overflow-y-auto">
            {assembledPackage && (
              <>
                {/* Auto-Assemble Banner */}
                <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        {assembledPackage.packageSummary}
                      </h4>
                      <span className="text-[10.5px] text-slate-600 font-medium">
                        제품 Master + 제조공정 Master + 클레임 유형이 100% 매칭되었습니다.
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                    규칙 기반 자동 생성
                  </span>
                </div>

                {/* 1. 기본 매칭 요약 카드 (제품 Master + 라인 + 클레임) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    [1] 연결된 Master 정보
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">제품</span>
                      <strong className="text-slate-900 block truncate" title={assembledPackage.productMaster.productName}>
                        {assembledPackage.productMaster.productName}
                      </strong>
                      <span className="text-[9.5px] text-slate-500">
                        {assembledPackage.productMaster.packageType} ({assembledPackage.productMaster.volume || "100ml"})
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">제조라인</span>
                      <strong className="text-blue-900 block truncate" title={assembledPackage.productMaster.manufactureLine}>
                        {assembledPackage.productMaster.manufactureLine}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {assembledPackage.productMaster.manufacturer}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">클레임 유형</span>
                      <strong className="text-purple-900 block truncate">
                        {assembledPackage.claimTypeMaster.claimTypeName}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {assembledPackage.input.claimSubCategory || "세부 유형"}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">현품 상태</span>
                      <strong className={assembledPackage.input.hasSample ? "text-emerald-700" : "text-amber-700"}>
                        {assembledPackage.input.hasSample ? "현품 확보됨" : "현품 미확보"}
                      </strong>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {assembledPackage.input.lotNumber || "제조번호 미입력"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. 추천 조사대상 포인트 (원인 미확정 원칙) */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>[2] 추천 조사대상 (※ 확정된 원인이 아님 · 현장 점검 대상)</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                      원인 미확정 / 점검 가이드
                    </span>
                  </div>

                  <ul className="space-y-1 pl-1">
                    {assembledPackage.recommendedTargets.map((tgt, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-[11.5px] leading-relaxed">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{tgt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. 자동 구성된 조사 항목 체크리스트 (8대 표준 항목) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        [3] 자동 구성된 조사 ({assembledPackage.investigationItems.filter((i) => i.isChecked).length}개 항목 활성화)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        조사자는 각 항목을 체크/해제하거나 수정, 추가, 삭제할 수 있습니다.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingCustomItem(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>조사 항목 추가</span>
                    </button>
                  </div>

                  {/* Inline Add Custom Item Form */}
                  {isAddingCustomItem && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                      <span className="font-bold text-blue-950 block text-[11px]">
                        새 조사 항목 추가
                      </span>
                      <input
                        type="text"
                        value={newCustomItemName}
                        onChange={(e) => setNewCustomItemName(e.target.value)}
                        placeholder="항목 명칭 (예: 외주 포장재 공급사 시험성적서)"
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                      />
                      <textarea
                        rows={2}
                        value={newCustomItemMethod}
                        onChange={(e) => setNewCustomItemMethod(e.target.value)}
                        placeholder="기본 조사방법 및 점검 기준 설명"
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomItem(false)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-600 font-semibold"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomItem}
                          className="px-3 py-1 bg-blue-600 text-white rounded font-bold"
                        >
                          추가하기
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Item List matching the prompt:
                      ☑ 소비자 제공 현품
                      ☑ 동일 제조번호 보관품
                      ☑ 제조기록
                      ☑ 품질검사
                      ☑ 제조공정
                      ☑ 원부자재
                      ☑ 원인 검토
                      ☑ 결론
                  */}
                  <div className="space-y-2 divide-y divide-slate-100">
                    {assembledPackage.investigationItems.map((item) => (
                      <div
                        key={item.id}
                        className={`pt-2 flex items-start justify-between gap-3 group ${
                          !item.isChecked ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <label className="flex items-center gap-1.5 mt-0.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.isChecked}
                              onChange={() => handleToggleItemCheck(item.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </label>

                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {item.name}
                              </span>
                              {item.isRequired ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                  필수
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                                  선택
                                </span>
                              )}
                            </div>

                            {/* Editing method or viewing method */}
                            {editingItemId === item.id ? (
                              <div className="mt-1 space-y-1">
                                <textarea
                                  rows={2}
                                  value={editingItemMethod}
                                  onChange={(e) => setEditingItemMethod(e.target.value)}
                                  className="w-full text-[11px] p-2 bg-white border border-blue-400 rounded-lg leading-relaxed"
                                />
                                <div className="flex items-center gap-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    className="px-2 py-0.5 text-[10px] bg-slate-200 rounded text-slate-700"
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedMethod(item.id)}
                                    className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded font-bold"
                                  >
                                    수정 완료
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                {item.method}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons (Edit & Remove) */}
                        <div className="flex items-center gap-1 shrink-0">
                          {editingItemId !== item.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditingItemMethod(item.method);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="조사방법 수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="항목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. 연결된 제조공정 시각화 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 block text-[11px] flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-blue-600" />
                      <span>[4] 연결된 제조공정 ({assembledPackage.processMaster.lineName})</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      총 {assembledPackage.processMaster.processSteps.length}개 공정
                    </span>
                  </div>

                  {/* Flow Steps connected by arrows as shown in prompt:
                      배합 → 여과 → UHT → 저장 → 충전 → 캡핑 → 후살균 → 포장
                  */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-1.5 shadow-2xs">
                    {assembledPackage.processMaster.processSteps.map((st, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-blue-50 text-slate-800 border border-slate-300">
                          <span className="text-[10px] font-mono text-blue-600 font-bold">
                            {i + 1}.
                          </span>
                          <span>{st}</span>
                        </span>
                        {i < assembledPackage.processMaster.processSteps.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {assembledPackage.processMaster.criticalControlPoint && (
                    <div className="text-[10.5px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <strong className="text-slate-800 mr-1">중요 관리점(CCP):</strong>
                      <span>{assembledPackage.processMaster.criticalControlPoint}</span>
                    </div>
                  )}
                </div>

                {/* 5. 연계된 과거 유사 사례 참고 (구조적 유사성 자동 추천) */}
                <div className="pt-2">
                  <SimilarClaimRecommendationCard
                    context={{
                      productName: assembledPackage.productMaster.productName,
                      productType: assembledPackage.productMaster.packageType?.includes("PET")
                        ? "다류(액상차)"
                        : "혼합음료",
                      claimMajorCategory: assembledPackage.claimTypeMaster.claimTypeName || "이물",
                      claimMidCategory: assembledPackage.input.claimSubCategory || "검은색 이물",
                      claimDetailType: assembledPackage.input.customerClaim,
                      manufactureLine: assembledPackage.productMaster.manufactureLine,
                      manufacturer: assembledPackage.productMaster.manufacturer,
                      relatedProcess: assembledPackage.processMaster.processSteps?.[4] || "충전",
                      foreignMatterFeatures: assembledPackage.input.customerClaim,
                      customerClaimDetails: assembledPackage.input.customerClaim,
                      lotNumber: assembledPackage.input.lotNumber,
                    }}
                    onApplyMethods={(opts, rec) => {
                      // 조사방법 채택 시 현재 패키지 항목에 추천 포인트 반영
                      if (opts.applyProcessCheckpoints && rec.relatedProcess) {
                        const exists = assembledPackage.recommendedTargets.some((t) =>
                          t.includes(rec.relatedProcess)
                        );
                        if (!exists) {
                          setAssembledPackage({
                            ...assembledPackage,
                            recommendedTargets: [
                              ...assembledPackage.recommendedTargets,
                              `[과거 사례 참고] ${rec.relatedProcess} 공정 노즐 및 필터 점검 가이드 연계`,
                            ],
                          });
                        }
                      }
                    }}
                    onUseAsInvestigationPackage={(pastRep) => {
                      onClose();
                      if (onUseAsInvestigationPackage) {
                        onUseAsInvestigationPackage(pastRep);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer with [조사 시작] Button */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 hidden sm:block">
            <span>※ 시작 시 작성 폼에 제품·제조라인·공정도·조사항목이 즉시 채워집니다.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              닫기
            </button>

            <button
              type="button"
              onClick={handleStart}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-extrabold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span className="text-sm">조사 시작</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
