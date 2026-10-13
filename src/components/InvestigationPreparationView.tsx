import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Zap,
  Package,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Workflow,
  ArrowRight,
  ShieldCheck,
  Search,
  FileCheck2,
  HelpCircle,
  Check,
  History,
  BookOpen,
  ChevronDown,
  Layers,
  Info,
  Calendar,
  Microscope,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  InvestigationPackage,
  InvestigationPackageInput,
  ProductMaster,
  ReportData,
} from "../types";
import { loadAllProducts } from "../data/productMaster";
import { stripInternalPrefix } from "../utils/displayName";
import {
  assembleInvestigationPackage,
  normalizeClaimTypeCategory,
  getRecommendedPresetsForClaim,
  getPackageInputCompleteness,
} from "../data/investigationPackageBuilder";
import { CLAIM_TYPES, ClaimTypeCategory } from "../utils/claimTypeConfig";

interface InvestigationPreparationViewProps {
  currentReport: ReportData;
  onStartInvestigation: (assembledPackage: InvestigationPackage) => void;
  onDirectToFormMode: () => void;
}

export function InvestigationPreparationView({
  currentReport,
  onStartInvestigation,
  onDirectToFormMode,
}: InvestigationPreparationViewProps) {
  const products = useMemo(() => loadAllProducts(), []);

  // 업무용 제품 목록 노출 기준: 비활성(단종 등) 및 [DEMO] 예시 제품 제외
  // ([실제] 제품은 유지 + 표시 시 접두어만 제거, [범용] 제품은 존재하지 않음)
  const isWorkProduct = (p: ProductMaster) =>
    p.isActive !== false && !p.productName.startsWith("[DEMO]");

  // [1. 기본정보] 입력 상태 (초안·보관함 재진입 시 직접 입력 상태 복원)
  const initialProductId = currentReport.productInfo.productId || "";
  const initialProductName = currentReport.productInfo.productName || "";
  const initialMatch: ProductMaster | undefined = (() => {
    if (initialProductId) {
      const byId = products.find((p) => p.id === initialProductId);
      if (byId) return byId;
    }
    const q = initialProductName.trim().toLowerCase();
    if (q) {
      return (
        products.find((p) => p.productName.trim().toLowerCase() === q) ||
        products.find(
          (p) => p.productName.toLowerCase().includes(q) || q.includes(p.productName.toLowerCase())
        )
      );
    }
    return undefined;
  })();
  const [isDirectInput, setIsDirectInput] = useState<boolean>(
    () => !initialMatch && initialProductName.trim().length > 0
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialMatch ? initialMatch.id : ""
  );
  const [productNameInput, setProductNameInput] = useState<string>(
    initialProductName || "비타민 음료 A"
  );
  const [lotNumberInput, setLotNumberInput] = useState<string>(
    currentReport.productInfo.lotNumber || ""
  );
  const [claimTypeCategory, setClaimTypeCategory] = useState<ClaimTypeCategory>(
    normalizeClaimTypeCategory(currentReport.productInfo.claimTypeId || "foreign")
  );
  const [claimSubCategoryInput, setClaimSubCategoryInput] = useState<string>(
    currentReport.productInfo.claimTypeId ? "검은색 이물" : "검은색 이물"
  );
  const [customerClaimInput, setCustomerClaimInput] = useState<string>(
    currentReport.customerClaim.claimDetails ||
      "음료 개봉 후 음용 중 검은색 고무 조각 형태의 이물이 발견되었다고 주장하며, 성분 분석 및 공정 혼입 가능성 확인을 요청함."
  );
  const [hasSample, setHasSample] = useState<boolean>(
    currentReport.customerClaim.sampleReceivedDate ? true : true
  );

  // 제품 검색 드롭다운 상태
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // [2. 조사 패키지 자동 구성] 상태
  const [isPackageAssembled, setIsPackageAssembled] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembledPackage, setAssembledPackage] = useState<InvestigationPackage | null>(null);
  const [autoAssembledAt, setAutoAssembledAt] = useState<string>("");

  const buildPackageFromInputs = () => {
    const input: InvestigationPackageInput = {
      productId: isDirectInput ? undefined : selectedProductId || selectedProductObj?.id,
      productName: productNameInput.trim() || selectedProductObj?.productName || "비타민 음료 A",
      lotNumber: lotNumberInput.trim(),
      claimType: claimTypeCategory,
      claimSubCategory: claimSubCategoryInput.trim(),
      customerClaim: customerClaimInput.trim(),
      hasSample,
    };
    return assembleInvestigationPackage(input);
  };

  // [자동 구성] 필수 조건(제품·제조번호)이 충족되면 입력 변경 시 자동 재구성
  // (수동 버튼 없이 UX 자동화, 기존 assemble 로직 그대로 재사용)
  useEffect(() => {
    const { ready } = getPackageInputCompleteness({
      productName: productNameInput,
      lotNumber: lotNumberInput,
    });
    if (!ready) {
      setIsPackageAssembled(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setAssembledPackage(buildPackageFromInputs());
      setIsPackageAssembled(true);
      setIsAssembling(false);
      const now = new Date();
      setAutoAssembledAt(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`
      );
    }, 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDirectInput,
    selectedProductId,
    productNameInput,
    lotNumberInput,
    claimTypeCategory,
    claimSubCategoryInput,
    customerClaimInput,
    hasSample,
  ]);

  // 클레임 유형 맞춤 추천 프리셋 (동일 저장소, UI 표시용)
  const recommendedPresets = useMemo(
    () => getRecommendedPresetsForClaim(claimTypeCategory, 2),
    [claimTypeCategory]
  );

  // 활성 탭 (결과 뷰 상세 카드 탭)
  const [activePackageTab, setActivePackageTab] = useState<
    "all" | "product" | "process" | "template" | "past" | "phrases" | "targetProcess"
  >("all");

  // 검색된 제품 목록 (업무용만: 비활성·[DEMO] 제외)
  const filteredProducts = useMemo(() => {
    const workList = products.filter(isWorkProduct);
    if (!productSearchQuery.trim()) return workList;
    const q = productSearchQuery.toLowerCase().trim();
    return workList.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.manufactureLine.toLowerCase().includes(q)
    );
  }, [products, productSearchQuery]);

  // 현재 선택된 제품 객체 (직접 입력 모드에서는 마스터 연결 없음)
  const selectedProductObj = useMemo(() => {
    if (isDirectInput) return null;
    return (
      products.find((p) => p.id === selectedProductId) ||
      products.find((p) => p.productName === productNameInput) ||
      products[0]
    );
  }, [products, selectedProductId, productNameInput, isDirectInput]);

  // [🔍 조사 패키지 수동 재구성] 실행 핸들러 (보조 기능, 자동 구성과 동일 로직)
  const handleAssemblePackage = () => {
    setIsAssembling(true);
    setTimeout(() => {
      const pkg = buildPackageFromInputs();
      setAssembledPackage(pkg);
      setIsPackageAssembled(true);
      setIsAssembling(false);
      const now = new Date();
      setAutoAssembledAt(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`
      );

      // 화면 스크롤 부드럽게 결과 영역으로 이동
      setTimeout(() => {
        document.getElementById("package-results-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }, 400);
  };

  // 제품 선택 적용 (마스터 모드로 전환, 마스터 자동 등록 없음)
  const handleSelectProduct = (prod: ProductMaster) => {
    setIsDirectInput(false);
    setSelectedProductId(prod.id);
    setProductNameInput(prod.productName);
    setShowProductDropdown(false);
    // 패키지 재구성을 유도
    setIsPackageAssembled(false);
  };

  // 직접 입력 적용 (마스터 ID 부여 없음, 마스터에 자동 등록하지 않음)
  const handleDirectInput = (name: string) => {
    setIsDirectInput(true);
    setSelectedProductId("");
    setProductNameInput(name);
    setIsPackageAssembled(false);
  };

  // [3. 조사 진행하기 →] 핸들러
  const handleProceedToInvestigation = () => {
    if (!assembledPackage) {
      // 아직 버튼을 누르지 않은 경우 즉시 구성 후 진행
      const input: InvestigationPackageInput = {
        productId: isDirectInput ? undefined : selectedProductId || selectedProductObj?.id,
        productName: productNameInput.trim() || selectedProductObj?.productName || "비타민 음료 A",
        lotNumber: lotNumberInput.trim(),
        claimType: claimTypeCategory,
        claimSubCategory: claimSubCategoryInput.trim(),
        customerClaim: customerClaimInput.trim(),
        hasSample,
      };
      const pkg = assembleInvestigationPackage(input);
      onStartInvestigation(pkg);
    } else {
      onStartInvestigation(assembledPackage);
    }
  };

  return (
    <div className="min-h-full bg-slate-100 flex flex-col py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* 상단 안내 배너 (조사 준비 화면 개념 명확화) */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  신규 클레임 조사 준비 단계
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  원클릭 지능형 조사 패키징
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                신규 클레임 조사 준비 & 패키지 자동 구성
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                조사자가 프리셋, 상용구, 공정도를 일일이 찾아다니지 않고, <strong>기본정보</strong>만 입력하면
                시스템이 제품 규격, 생산 공정도, 조사 템플릿, 과거 유사사례, 추천 상용구, 추천 공정을 자동으로 결합하여 최적의 조사 세트를 구성합니다.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={onDirectToFormMode}
                className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-2xs"
                title="조사 패키지 구성 없이 빈 보고서 작성 폼으로 바로 이동"
              >
                기존 양식으로 직접 작성 →
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* [1. 기본정보] 입력 카드 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                1
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  [1. 기본정보 입력]
                </h2>
                <p className="text-xs text-slate-500">
                  클레임 접수 시 파악된 5대 핵심 기본정보를 입력하세요.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              * 표시 항목은 패키지 구성 필수
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            {/* 1) 제품 [제품 검색 ▼ / 직접 입력] */}
            <div className="space-y-1.5 relative">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>제품명 (Product) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-blue-600">
                  {isDirectInput ? (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                      직접 입력 · 마스터 미등록
                    </span>
                  ) : (
                    selectedProductObj ? `${selectedProductObj.manufacturer} · ${selectedProductObj.manufactureLine}` : ""
                  )}
                </span>
              </label>

              {/* 마스터 선택 / 직접 입력 전환 */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectInput(false);
                    setIsPackageAssembled(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    !isDirectInput ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  마스터 선택
                </button>
                <button
                  type="button"
                  id="btn-product-direct-input-mode"
                  onClick={() => handleDirectInput(productNameInput)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    isDirectInput ? "bg-white text-amber-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="마스터에 없는 제품명을 직접 입력 (마스터에 자동 등록되지 않음)"
                >
                  직접 입력
                </button>
              </div>

              {isDirectInput ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    id="input-direct-product-name"
                    value={productNameInput}
                    onChange={(e) => handleDirectInput(e.target.value)}
                    placeholder="예: 신규 음료 제품명 직접 입력"
                    className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    마스터에 자동 등록되지 않으며, 제조처·라인은 미등록 상태로 유지됩니다.
                  </p>
                </div>
              ) : (
              <>
              {/* 제품 검색 드롭다운 트리거 버튼 */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-product-search-dropdown"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-left font-bold text-slate-900 flex items-center justify-between transition-colors focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{productNameInput || "제품을 검색하거나 선택하세요"}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* 드롭다운 검색 패널 */}
                {showProductDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-slate-300 rounded-xl shadow-xl p-3 space-y-2 animate-in fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="제품명, 제품코드, 라인 검색..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-center space-y-1.5">
                          <p className="text-xs text-slate-500">검색 결과가 없습니다.</p>
                          <button
                            type="button"
                            onClick={() => {
                              handleDirectInput(productSearchQuery);
                              setProductSearchQuery("");
                              setShowProductDropdown(false);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors"
                          >
                            “{productSearchQuery.trim()}”(으)로 직접 입력 전환
                          </button>
                        </div>
                      ) : (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                            selectedProductId === p.id ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{stripInternalPrefix(p.productName)}</div>
                            <div className="text-[10px] text-slate-500">
                              {p.productCode} · {stripInternalPrefix(p.manufacturer)} · {stripInternalPrefix(p.manufactureLine)}
                            </div>
                          </div>
                          {selectedProductId === p.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                      ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              </>
              )}

              {/* 빠른 제품 선택 칩 (업무용만) */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {products.filter(isWorkProduct).slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                      selectedProductId === p.id
                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {stripInternalPrefix(p.productName)}
                  </button>
                ))}
              </div>
            </div>

            {/* 2) 제조번호 [               ] */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>제조번호 / LOT (Lot Number) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400">보관품 및 배치일지 조회 기준</span>
              </label>
              <input
                type="text"
                value={lotNumberInput}
                onChange={(e) => {
                  setLotNumberInput(e.target.value);
                  setIsPackageAssembled(false);
                }}
                placeholder="제조번호를 입력하세요"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
              <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                <span>예시:</span>
                <button
                  type="button"
                  onClick={() => setLotNumberInput("2026.04.15 / LOT A1204")}
                  className="text-blue-600 hover:underline font-mono"
                >
                  LOT A1204
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setLotNumberInput("LOT 26H18-A01")}
                  className="text-blue-600 hover:underline font-mono"
                >
                  LOT 26H18-A01
                </button>
              </div>
            </div>

            {/* 3) 클레임 유형 [클레임 유형 선택 ▼] */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>클레임 유형 (Claim Type) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400">조사 템플릿 및 추천 공정 결정</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={claimTypeCategory}
                  onChange={(e) => {
                    const cat = e.target.value as ClaimTypeCategory;
                    setClaimTypeCategory(cat);
                    const defSub =
                      cat === "foreign" ? "검은색 이물" :
                      cat === "spoilage" ? "변질/산패" :
                      cat === "leak" ? "캡 헛돎/누액" :
                      cat === "label" ? "날인 불량" : "내용량 미달";
                    setClaimSubCategoryInput(defSub);
                    setIsPackageAssembled(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="foreign">이물 (혼입/외래/탄화물)</option>
                  <option value="spoilage">변질 / 산패 / 곰팡이</option>
                  <option value="leak">용기 파손 / 누액 / 캡 불량</option>
                  <option value="label">포장 불량 / 라벨 / 날인</option>
                  <option value="volume">내용량 / 충전량 미달</option>
                </select>

                <input
                  type="text"
                  value={claimSubCategoryInput}
                  onChange={(e) => {
                    setClaimSubCategoryInput(e.target.value);
                    setIsPackageAssembled(false);
                  }}
                  placeholder="세부 유형 (예: 검은색 고무 이물)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            {/* 5) 현품 확보 [○ 확보 / ○ 미확보] */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                현품 확보 여부 (Sample Status) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    hasSample
                      ? "bg-emerald-50/80 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-400/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="hasSampleRadio"
                    checked={hasSample}
                    onChange={() => {
                      setHasSample(true);
                      setIsPackageAssembled(false);
                    }}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-bold">● 현품 확보</span>
                    <span className="block text-[10px] text-slate-500">실물 기기·현미경 정밀 분석</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    !hasSample
                      ? "bg-amber-50/80 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-400/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="radio"
                    name="hasSampleRadio"
                    checked={!hasSample}
                    onChange={() => {
                      setHasSample(false);
                      setIsPackageAssembled(false);
                    }}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="block text-xs font-bold">○ 미확보 (사진 접수)</span>
                    <span className="block text-[10px] text-slate-500">접수 사진 판독 및 간접 검증</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 4) 소비자 주장 [               ] (전체 너비) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>소비자 주장 내용 (Customer Claim Statement)</span>
                <span className="text-[11px] text-slate-400">상담실 접수 원문 및 고객 진술</span>
              </label>
              <textarea
                rows={2}
                value={customerClaimInput}
                onChange={(e) => {
                  setCustomerClaimInput(e.target.value);
                  setIsPackageAssembled(false);
                }}
                placeholder="소비자가 접수한 이상 현상 및 불만 사항을 기재하세요."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* [2. 조사 패키지 자동 구성 상태 + 수동 재구성 (보조)] */}
        {/* 기본정보 입력 시 자동 구성되며, 버튼은 수동 재구성용으로 유지 */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          {(() => {
            const { ready, missing } = getPackageInputCompleteness({
              productName: productNameInput,
              lotNumber: lotNumberInput,
            });
            if (!ready) {
              return (
                <p className="text-xs text-slate-500 text-center">
                  제품·제조번호를 입력하면 조사 패키지가 자동으로 구성됩니다.
                  <span className="text-slate-400"> (부족: {missing.join("·")})</span>
                </p>
              );
            }
            if (assembledPackage && isPackageAssembled) {
              const presetCount = recommendedPresets.length;
              const phraseCount = assembledPackage.recommendedPhrases?.length || 0;
              const similarCount = assembledPackage.similarPastClaims?.length || 0;
              return (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-center">
                  ✓ 조사 패키지 자동 구성 완료 (기본 조사 {assembledPackage.investigationItems.filter((i) => i.isChecked).length}항목
                  · 유사 {similarCount}건 · 상용구 {phraseCount}건 · 프리셋 {presetCount}건{autoAssembledAt ? ` · ${autoAssembledAt}` : ""})
                </p>
              );
            }
            return null;
          })()}
          <button
            type="button"
            id="btn-trigger-assemble-package"
            onClick={handleAssemblePackage}
            disabled={isAssembling}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md hover:shadow-lg transition-all active:scale-95 border border-amber-300 flex items-center justify-center gap-2.5 cursor-pointer ${
              isAssembling ? "opacity-75 cursor-wait" : ""
            }`}
          >
            {isAssembling ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                <span>6대 조사 패키지 분석 및 조합 중...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                <span>조사 패키지 재구성</span>
                <span className="text-xs bg-slate-950/15 px-2 py-0.5 rounded-full font-bold">
                  보조 기능
                </span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 text-center">
            제품 마스터, 제조공정도, 클레임 유형, 과거 사례, 상용구 데이터를 연동하여 6대 조사 정보를 자동 생성합니다.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* [2. 자동 표시되는 6대 정보 카드 영역] */}
        {/* ========================================================================= */}
        {assembledPackage && (
          <div id="package-results-section" className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            
            {/* 결과 상단 상태 바 */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>조사 패키지가 성공적으로 구성되었습니다.</span>
                <span className="text-emerald-700 font-normal">
                  ({stripInternalPrefix(assembledPackage.productMaster.productName)} · {assembledPackage.claimTypeMaster.claimTypeName})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-800">
                <span className="bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  {assembledPackage.productMaster.manufactureLine}
                </span>
                <span>·</span>
                <span>{hasSample ? "현품 확보 분석" : "현품 미확보 간접 검증"}</span>
              </div>
            </div>

            {/* 6대 자동 표시 정보 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* [정보 1. 제품정보] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>[제품정보]</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {assembledPackage.productMaster.productCode || "KD-STD"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10.5px] text-slate-500 block">제품명</span>
                    <strong className="text-slate-900 block truncate font-bold">
                      {stripInternalPrefix(assembledPackage.productMaster.productName)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10.5px] text-slate-500 block">제품유형</span>
                    <span className="text-slate-800 font-semibold block truncate">
                      {assembledPackage.productMaster.subProductType}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10.5px] text-slate-500 block">제조처</span>
                    <strong className="text-blue-700 block truncate font-bold">
                      {stripInternalPrefix(assembledPackage.productMaster.manufacturer)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10.5px] text-slate-500 block">제조라인</span>
                    <strong className="text-slate-900 block truncate font-bold">
                      {stripInternalPrefix(assembledPackage.productMaster.manufactureLine)}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>포장: {assembledPackage.productMaster.packageType} ({assembledPackage.productMaster.volume || "규격"})</span>
                  <span>로트: <strong className="font-mono text-slate-700">{assembledPackage.input.lotNumber}</strong></span>
                </div>
              </div>

              {/* [정보 2. 제조공정] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Workflow className="w-4 h-4 text-cyan-600" />
                    <span>[제조공정] 해당 라인의 공정도</span>
                  </h3>
                  <span className="text-[10.5px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full font-bold">
                    {assembledPackage.processMaster.lineName}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10.5px] text-slate-500 block font-semibold">단계별 공정 흐름도</span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {assembledPackage.processMaster.processFlow}
                  </p>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span className="font-semibold text-slate-700">여과 관리:</span>
                    <span className="truncate">{assembledPackage.processMaster.filtrationAnalysis?.slice(0, 36) || "150 Mesh 여과 통과"}...</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-700">CCP 관리:</span>
                    <span className="truncate">{assembledPackage.processMaster.criticalControlPoint?.slice(0, 36) || "CCP-1B 살균 및 금속검출"}...</span>
                  </div>
                </div>
              </div>

              {/* [정보 3. 기본 조사] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-purple-600" />
                    <span>[기본 조사] 클레임 유형별 조사 템플릿</span>
                  </h3>
                  <span className="text-[10.5px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                    {assembledPackage.investigationItems.length}개 조사 항목
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assembledPackage.investigationItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                          <span>{item.name}</span>
                        </strong>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {item.isRequired ? "필수 조사" : "선택"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {item.method}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* [정보 3-1. 추천 프리셋] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>[추천 프리셋] 과거 사용 조사 구조</span>
                  </h3>
                  <span className="text-[10.5px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                    {recommendedPresets.length}건 추천
                  </span>
                </div>
                <div className="space-y-2">
                  {recommendedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-900 font-bold truncate">
                          {preset.name}
                        </strong>
                        <span className="text-[10px] text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded font-bold shrink-0">
                          {preset.subCategory || preset.category || "표준"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[10.5px] text-slate-500">
                  ※ [조사 시작] 후 STEP 1의 유형·프리셋 설정에서 동일한 프리셋을 적용할 수 있습니다.
                </p>
              </div>

              {/* [정보 4. 과거 유사사례] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-600" />
                    <span>[과거 유사사례] 유사 사례</span>
                  </h3>
                  <span className="text-[10.5px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                    유사도 매칭 완료
                  </span>
                </div>
                {assembledPackage.similarPastClaims && assembledPackage.similarPastClaims.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {assembledPackage.similarPastClaims.map((past, idx) => (
                      <div
                        key={past.item?.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 hover:border-amber-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-slate-900 font-bold truncate">
                            {past.item?.title || past.item?.productName || "과거 조사 사례"}
                          </strong>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-100 text-amber-800 shrink-0">
                            유사도 {past.similarityScore}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{past.item?.manufactureLine}</span>
                          <span>·</span>
                          <span>{past.item?.lotNumber}</span>
                          <span>·</span>
                          <span>{past.item?.claimType}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 bg-white p-1.5 rounded border border-slate-200/60">
                          과거 결론: {past.item?.conclusionSnippet || "보관품 정상, 원인 미확정 종결"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    일치하는 과거 사례가 없으므로 표준 조사 템플릿으로 안전하게 조사를 진행합니다.
                  </div>
                )}
                {/* 원인 자동 확정 방지 안내 배너 */}
                <div className="text-[10.5px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>시스템이 과거 원인을 자동 확정하지 않으며, 조사자의 현장 확인을 위한 참고 정보로 제공됩니다.</span>
                </div>
              </div>

              {/* [정보 5. 추천 상용구] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>[추천 상용구] 현재 상황에 맞는 상용구</span>
                  </h3>
                  <span className="text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    {assembledPackage.recommendedPhrases?.length || 0}건 추천
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assembledPackage.recommendedPhrases?.map((ph) => (
                    <div
                      key={ph.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold block truncate">
                          {ph.title}
                        </strong>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          {ph.fieldKey}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {ph.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* [정보 6. 추천 조사 공정] */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>[추천 조사 공정] 관련 공정</span>
                  </h3>
                  <span className="text-[10.5px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                    중점 점검 대상
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assembledPackage.recommendedProcesses?.map((proc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-950 font-bold block truncate">
                          {proc.stepName}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {proc.equipmentName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium">
                        점검: {proc.focusPoint}
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        확인방법: {proc.verificationMethod}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* [3. 조사 시작 버튼 영역] */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl border-2 border-blue-500 p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    [3. 조사 시작]
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  구성된 6대 조사 패키지 정보를 보고서에 적용하고, 세부 원인조사 화면(작성 폼)으로 이동합니다.
                </p>
              </div>

              <button
                type="button"
                id="btn-proceed-to-investigation"
                onClick={handleProceedToInvestigation}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>[조사 진행하기 →]</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

          </div>
        )}

        {/* 패키지 구성 전일 때 하단 유도 카드 */}
        {!assembledPackage && (
          <div className="bg-white/80 rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                기본정보를 입력한 후 [🔍 조사 패키지 자동 구성] 버튼을 눌러주세요
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                제품정보, 제조공정도, 조사 템플릿, 과거 유사사례, 추천 상용구, 추천 조사공정 6대 정보가 화면에 자동 구성됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAssemblePackage}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-amber-300 hover:bg-amber-400 transition-colors shadow-2xs"
            >
              지금 기본정보로 바로 구성하기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
