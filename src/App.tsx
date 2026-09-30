import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Printer,
  Mail,
  ExternalLink,
  FolderOpen,
  BookOpen,
  RotateCcw,
  Check,
  ShieldCheck,
  ShieldAlert,
  Layout,
  Smartphone,
  Sparkles,
  Edit3,
  SlidersHorizontal,
  Plus,
  Layers,
  Save,
  History,
  Package,
  Factory,
} from "lucide-react";
import { ReportData, ClaimPreset, ProductMaster } from "./types";
import { INITIAL_REPORT_DATA } from "./data/presets";
import { InputFormPane } from "./components/InputFormPane";
import { ReportPreviewPane } from "./components/ReportPreviewPane";
import { EmailViewPane } from "./components/EmailViewPane";
import { PrintExportModal } from "./components/PrintExportModal";
import { CsEmailModal } from "./components/CsEmailModal";
import { PhraseManagerModal } from "./components/PhraseManagerModal";
import { PresetManagerModal } from "./components/PresetManagerModal";
import { UnifiedQualityManagerModal, ManagerTab } from "./components/UnifiedQualityManagerModal";
import { FactoryProcessPreset } from "./data/factoryProcessPresets";
import { ReportValidationModal } from "./components/ReportValidationModal";
import { PastClaimSearchModal } from "./components/PastClaimSearchModal";
import { ProductMasterModal } from "./components/ProductMasterModal";
import { ManufacturerMasterModal } from "./components/ManufacturerMasterModal";
import { validateReport } from "./utils/reportValidator";
import {
  ReportListDrawer,
  getSavedReports,
  saveReportToArchive,
} from "./components/ReportListDrawer";
import {
  saveReportToDb,
  loadReportFromDb,
  mergePresetData,
  DRAFT_STORAGE_KEY,
} from "./utils/storage";

type ViewMode = "form" | "report" | "email";

export default function App() {
  // Initialize report state from LocalStorage draft or default preset
  const [report, setReport] = useState<ReportData>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        // Sanitize legacy name from draft as well
        const sanitized = draft
          .replaceAll("대한푸드품질연구원", "광동제약")
          .replaceAll("대한푸드㈜", "광동제약㈜")
          .replaceAll("대한푸드", "광동제약");
        const parsed = JSON.parse(sanitized);
        const cachedLogo = localStorage.getItem("food_qc_custom_company_logo");
        if (cachedLogo && !parsed.companyLogoUrl) {
          parsed.companyLogoUrl = cachedLogo;
        }
        // Filter out legacy dummy unsplash photos so only user-uploaded photos are kept
        const filterUserPhotos = (list: any[]) =>
          (list || []).filter((p: any) => p?.url && typeof p.url === "string" && !p.url.includes("unsplash.com") && !p.url.includes("placeholder"));
        if (parsed.customerClaim) {
          parsed.customerClaim.customerPhotos = filterUserPhotos(parsed.customerClaim.customerPhotos);
        }
        if (parsed.lotHistory) {
          parsed.lotHistory.retainedSamplePhotos = filterUserPhotos(parsed.lotHistory.retainedSamplePhotos);
        }
        if (parsed.attachments) {
          parsed.attachments.attachment1Photos = filterUserPhotos(parsed.attachments.attachment1Photos);
          parsed.attachments.attachment2Photos = filterUserPhotos(parsed.attachments.attachment2Photos);
          parsed.attachments.attachment3Photos = filterUserPhotos(parsed.attachments.attachment3Photos);
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Autosaved draft recovery note:", e);
    }
    const init = JSON.parse(JSON.stringify(INITIAL_REPORT_DATA));
    try {
      const cachedLogo = localStorage.getItem("food_qc_custom_company_logo");
      if (cachedLogo) {
        init.companyLogoUrl = cachedLogo;
      }
    } catch {
      // ignore
    }
    return init;
  });

  const isPrintMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("print") === "true";

  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [savedCount, setSavedCount] = useState<number>(0);

  // View mode: 'form' (작성 폼) vs 'report' (A4 보고서) vs 'email' (이메일 회신)
  const [viewMode, setViewMode] = useState<ViewMode>(isPrintMode ? "report" : "form");
  const [formActiveTab, setFormActiveTab] = useState<string>("claim");

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCsEmailOpen, setIsCsEmailOpen] = useState(false);
  const [isPhraseManagerOpen, setIsPhraseManagerOpen] = useState(false);
  const [phraseManagerField, setPhraseManagerField] = useState<string | undefined>(undefined);
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);
  const [isMasterManagerOpen, setIsMasterManagerOpen] = useState(false);
  const [masterManagerTab, setMasterManagerTab] = useState<ManagerTab>("presets");
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isPastClaimModalOpen, setIsPastClaimModalOpen] = useState(false);
  const [isProductMasterOpen, setIsProductMasterOpen] = useState(false);
  const [isProductSelectionMode, setIsProductSelectionMode] = useState(false);
  const [isManufacturerMasterOpen, setIsManufacturerMasterOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const validationSummary = validateReport(report);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleNavigateToField = (tabId: string, fieldId?: string) => {
    setViewMode("form");
    setFormActiveTab(tabId);
    setIsValidationModalOpen(false);

    if (fieldId) {
      setTimeout(() => {
        const el = document.getElementById(fieldId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus?.();
          // Add a brief highlight ring animation
          el.classList.add("ring-4", "ring-blue-400", "ring-offset-2", "transition-all", "duration-300");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-blue-400", "ring-offset-2");
          }, 2500);
        }
      }, 150);
    }
  };

  // Auto-trigger print when opened with ?print=true outside iframe
  useEffect(() => {
    if (isPrintMode) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isPrintMode]);

  // Keep latest report ref for autosave interval
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  // Update saved count
  useEffect(() => {
    setSavedCount(getSavedReports().length);
  }, [isDrawerOpen]);

  // Hydrate from IndexedDB if available
  useEffect(() => {
    loadReportFromDb().then((loaded) => {
      if (loaded && loaded.id) {
        setReport((prev) => {
          // Keep existing user photos if prev has them and loaded doesn't
          return loaded;
        });
      }
    });
  }, []);

  // Autosave every 10 seconds to IndexedDB and LocalStorage safely
  useEffect(() => {
    const timer = setInterval(() => {
      if (reportRef.current) {
        saveReportToDb(reportRef.current);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        setLastSavedAt(timeStr);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const handlePrint = () => {
    setViewMode("report");
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn("Direct window.print() failed", e);
    }
    setIsPrintModalOpen(true);
  };

  const handleNewReport = () => {
    const cachedLogo = localStorage.getItem("food_qc_custom_company_logo") || "";
    const newEmptyReport: ReportData = {
      ...JSON.parse(JSON.stringify(INITIAL_REPORT_DATA)),
      id: `rep-${Date.now()}`,
      docNumber: `광동 QM 2026 -C${String(Math.floor(Math.random() * 90) + 10)}`,
      issueDate: new Date().toISOString().split("T")[0],
      companyLogoUrl: cachedLogo,
      title: "“신규 제품” 소비자 클레임 발생에 따른 조사 보고의 건.",
      customerClaim: {
        receivedAt: new Date().toISOString().slice(0, 16),
        channel: "고객상담센터 (유선 접수)",
        customerName: "",
        maskCustomerName: false,
        contact: "",
        claimDetails: "",
        customerPhotos: [],
      },
      productInfo: {
        productName: "",
        lotNumber: "",
        manufactureDate: "",
        expiryDate: "",
        packageType: "",
        manufacturer: "평택공장",
      },
      analysisResults: {
        ...JSON.parse(JSON.stringify(INITIAL_REPORT_DATA.analysisResults)),
        visualInspection: {
          skipped: false,
          sampleCondition: "",
          foreignObjectAppearance: "",
          includePrinciple: false,
          principleText: "",
        },
      },
    };
    setReport(newEmptyReport);
    setViewMode("form");
    showToast("새 보고서 작성이 시작되었습니다.");
  };

  const handleCopyAsNewClaim = (newReport: ReportData) => {
    setReport(newReport);
    saveReportToDb(newReport);
    setIsPastClaimModalOpen(false);
    setViewMode("form");
    setFormActiveTab("product");
    showToast(
      `'${newReport.copiedFromDocNumber || "과거 클레임"}'을(를) 기반으로 새로운 클레임이 생성되었습니다. (제조번호를 입력해 주세요)`
    );
  };

  const handleApplyPreset = (preset: ClaimPreset) => {
    const updated = mergePresetData(report, preset.data);
    setReport(updated);
    saveReportToDb(updated);
    setIsPresetManagerOpen(false);
    setIsMasterManagerOpen(false);
    setViewMode("form");
    showToast(`'${preset.name}' 프리셋이 작성 폼에 적용되었습니다. (첨부 사진 유지됨)`);
  };

  const handleApplyProcess = (preset: FactoryProcessPreset) => {
    setReport((prev) => {
      const next = {
        ...prev,
        productInfo: {
          ...prev.productInfo,
          manufacturer: preset.name,
          manufacturerType: preset.type,
          factoryId: preset.id,
        },
        manufacturingProcess: {
          ...prev.manufacturingProcess,
          processFlow: preset.processFlow,
          processSteps: preset.processSteps,
          filtrationAnalysis: preset.filtrationAnalysis,
          cleaningAnalysis: preset.cleaningAnalysis,
          criticalControlPoint: preset.criticalControlPoint,
        },
      };
      saveReportToDb(next);
      return next;
    });
    setIsMasterManagerOpen(false);
    setViewMode("form");
    showToast(`"${preset.name}" 제조공정도가 보고서에 적용되었습니다.`);
  };

  const handleApplyProduct = (product: ProductMaster) => {
    setReport((prev) => {
      const next: ReportData = {
        ...prev,
        productInfo: {
          ...prev.productInfo,
          productId: product.id,
          productName: product.productName,
          packageType: product.packageType || prev.productInfo.packageType,
          manufacturerId: product.manufacturerId || prev.productInfo.manufacturerId,
          manufacturer: product.manufacturer || prev.productInfo.manufacturer,
          manufactureLineId: product.manufactureLineId || prev.productInfo.manufactureLineId,
          manufactureLine: product.manufactureLine || prev.productInfo.manufactureLine,
          manufacturerType: product.manufacturer.includes("광동") ? "internal" : "oem",
          productCode: product.productCode,
          subProductType: product.subProductType,
          volume: product.volume,
          containerType: product.containerType,
          factoryId: product.relatedProcessPresetId || prev.productInfo.factoryId,
        },
      };
      saveReportToDb(next);
      return next;
    });
    setIsProductMasterOpen(false);
    setViewMode("form");
    setFormActiveTab("product");
    showToast(`'${product.productName}' 제품 마스터 정보가 보고서에 적용되었습니다.`);
  };

  const handleApplyPhrase = (fieldKey: string, content: string) => {
    setReport((prev) => {
      const next: ReportData = JSON.parse(JSON.stringify(prev));
      if (fieldKey === "rootCause") {
        next.rootCauseAndActions.rootCause = content;
      } else if (fieldKey === "preventiveAction") {
        next.rootCauseAndActions.preventiveMeasures = content;
      } else if (fieldKey === "apologyText") {
        next.conclusion.apologyText = content;
      } else if (fieldKey === "sampleCondition") {
        next.analysisResults.visualInspection.sampleCondition = content;
      } else if (fieldKey === "magnifierResult") {
        next.analysisResults.magnifierInspection.result = content;
      } else if (fieldKey === "microscopeResult") {
        next.analysisResults.opticalMicroscope.result = content;
      } else if (fieldKey === "ftirSummary") {
        next.analysisResults.ftirAnalysis.summary = content;
      } else if (fieldKey === "retainedSampleCheck") {
        next.lotHistory.retainedSampleCheck = content;
      } else if (fieldKey === "productionLogNote") {
        next.lotHistory.productionLogNote = content;
      } else if (fieldKey === "priorClaimsCount") {
        next.lotHistory.priorClaimsCount = content;
      } else if (fieldKey === "filtrationAnalysis") {
        next.manufacturingProcess.filtrationAnalysis = content;
      } else if (fieldKey === "cleaningAnalysis") {
        next.manufacturingProcess.cleaningAnalysis = content;
      } else if (fieldKey === "qualityTestRecord") {
        next.lotHistory.qualityTestRecord = content;
      } else if (fieldKey.startsWith("principle_")) {
        if (fieldKey === "principle_visual") {
          next.analysisResults.visualInspection.includePrinciple = true;
          next.analysisResults.visualInspection.principleText = content;
        } else if (fieldKey === "principle_magnifier") {
          next.analysisResults.magnifierInspection.includePrinciple = true;
          next.analysisResults.magnifierInspection.principleText = content;
        } else if (fieldKey === "principle_microscope") {
          next.analysisResults.opticalMicroscope.includePrinciple = true;
          next.analysisResults.opticalMicroscope.principleText = content;
        } else if (fieldKey === "principle_ftir") {
          next.analysisResults.ftirAnalysis.includePrinciple = true;
          next.analysisResults.ftirAnalysis.principleText = content;
        } else if (fieldKey === "principle_xrf") {
          next.analysisResults.xrfAnalysis.includePrinciple = true;
          next.analysisResults.xrfAnalysis.principleText = content;
        } else if (fieldKey === "principle_physicochemical") {
          next.analysisResults.physicochemicalAnalysis.includePrinciple = true;
          next.analysisResults.physicochemicalAnalysis.principleText = content;
        } else if (fieldKey === "principle_catalase") {
          next.analysisResults.catalaseTest.includePrinciple = true;
          next.analysisResults.catalaseTest.principleText = content;
        }
      }
      return next;
    });
    setIsPhraseManagerOpen(false);
    setViewMode("form");
    showToast("선택한 상용구가 보고서 작성 폼에 적용되었습니다.");
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* 1. Global Header Bar (No-Print) */}
      <header className="no-print shrink-0 bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800 shadow-md z-20 gap-2">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white shadow-xs font-bold text-xs">
            KD
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white">
              광동제약 클레임 원인조사 보고서 시스템
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-300 rounded border border-red-400/30">
              식품품질경영팀
            </span>
          </div>
        </div>

        {/* 1-Click View Mode Switcher (Form / Report / Email) */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("form")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "form"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>작성 폼</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("report")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="소비자용 공식 A4 원인조사 공문서 보고서"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A4 보고서 (소비자용)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("email")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "email"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="이메일 회신문 작성 및 확인"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>이메일 회신</span>
          </button>
        </div>

        {/* Status indicator & Utility Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Autosave badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full text-[11px] text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {lastSavedAt ? `자동 저장됨 (${lastSavedAt})` : "10초마다 자동 임시 저장"}
            </span>
          </div>

          {/* Direct Manual Save Button */}
          <button
            type="button"
            onClick={() => {
              saveReportToDb(report);
              const now = new Date();
              const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
                now.getMinutes()
              ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
              setLastSavedAt(timeStr);
              showToast("현재 클레임 데이터(조사결과 버튼 선택값 포함)가 저장되었습니다.");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-all active:scale-95 border border-emerald-500 cursor-pointer"
            title="현재 작성 중인 데이터 즉시 수동 저장 (새로고침 시에도 유지됨)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>저장</span>
          </button>

          {/* Drawer: Saved reports */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="저장된 보고서 보관함 및 복제"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">보관함</span>
            {savedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white text-[10px] rounded-full font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Unified Quality Master Manager Button */}
          <button
            type="button"
            onClick={() => {
              setMasterManagerTab("presets");
              setIsMasterManagerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-xs transition-all border border-blue-400/40"
            title="클레임 프리셋 · 상용구 · 제조공정도 3대 연계 통합 관리 센터"
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">통합 기준정보 관리</span>
            <span className="sm:hidden">통합관리</span>
          </button>

          {/* Product Master Button */}
          <button
            type="button"
            id="btn-nav-product-master"
            onClick={() => {
              setIsProductSelectionMode(false);
              setIsProductMasterOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="제품 Master (제품명, 코드, 포장, 제조라인) 표준 관리"
          >
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">제품 Master</span>
          </button>

          {/* Manufacturer & Line Master Button */}
          <button
            type="button"
            id="btn-nav-manufacturer-master"
            onClick={() => setIsManufacturerMasterOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="제조처 및 제조라인 Master (자사 공장, OEM, 라인 규격) 표준 관리"
          >
            <Factory className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">제조처/라인 Master</span>
          </button>

          {/* Preset Manager Button */}
          <button
            type="button"
            onClick={() => {
              setMasterManagerTab("presets");
              setIsMasterManagerOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="클레임 유형 프리셋 추가/수정/관리"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">프리셋</span>
          </button>

          {/* Phrase Manager */}
          <button
            type="button"
            onClick={() => {
              setMasterManagerTab("phrases");
              setIsMasterManagerOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="나만의 상용구 라이브러리 관리"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">상용구</span>
          </button>

          {/* Direct new-tab print link */}
          <a
            href={`/?print=true&t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-200 hover:text-white bg-red-950/60 hover:bg-red-900/80 rounded-lg border border-red-700/60 transition-colors shadow-xs"
            title="새 브라우저 탭에서 깨끗하게 A4 인쇄 / PDF 저장"
          >
            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
            <span>새 창 인쇄</span>
          </a>

          {/* Main Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 rounded-lg shadow-sm transition-all"
            title="A4 규격 인쇄 및 PDF 저장"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 / PDF</span>
          </button>
        </div>
      </header>

      {/* 2. Subheader Action Banner (Visible in Form Mode to give quick 1-click jumps) */}
      {viewMode === "form" && (
        <div className="no-print shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">조사 내용 작성 중:</span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              필요 시 상단 탭 또는 우측 버튼을 눌러 A4 보고서와 이메일 서식을 바로 확인할 수 있습니다.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* [이전 클레임 불러오기] 버튼 */}
            <button
              type="button"
              id="btn-subheader-load-past-claim"
              onClick={() => setIsPastClaimModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="과거 클레임 이력 검색 및 상세 내용 조회"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>이전 클레임 불러오기</span>
            </button>

            {/* Quick Validation Trigger in Subheader */}
            <button
              type="button"
              onClick={() => setIsValidationModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all shadow-2xs ${
                validationSummary.errorCount > 0
                  ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                  : validationSummary.warningCount > 0
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}
              title="보고서 발송 전 누락 항목 및 논리 모순 종합 검증"
            >
              {validationSummary.errorCount > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>사전 검증</span>
              {validationSummary.errorCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-red-600 text-white">
                  오류 {validationSummary.errorCount}
                </span>
              ) : validationSummary.warningCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-600 text-white">
                  경고 {validationSummary.warningCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-600 text-white">
                  통과
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("email")}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              title="이메일 회신문 보기"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>이메일 회신 보기</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("report")}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              title="소비자용 정식 A4 공문서 보고서 미리보기"
            >
              <FileText className="w-3.5 h-3.5 text-slate-700" />
              <span>소비자용 A4 보고서 미리보기</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* [Mode A] Input Form View (Kept mounted to preserve tab & scroll state) */}
        <div className={viewMode === "form" ? "h-full w-full flex flex-col bg-white" : "hidden"}>
          <InputFormPane
            report={report}
            onChange={(updated) => {
              setReport(updated);
              saveReportToDb(updated);
            }}
            activeTab={formActiveTab}
            onTabChange={setFormActiveTab}
            onOpenPhraseManager={(fieldKey) => {
              setPhraseManagerField(fieldKey);
              setMasterManagerTab("phrases");
              setIsMasterManagerOpen(true);
            }}
            onOpenPresetManager={() => {
              setMasterManagerTab("presets");
              setIsMasterManagerOpen(true);
            }}
            onOpenProcessManager={() => {
              setMasterManagerTab("processes");
              setIsMasterManagerOpen(true);
            }}
            onOpenValidation={() => setIsValidationModalOpen(true)}
            onOpenPastClaims={() => setIsPastClaimModalOpen(true)}
            onCopyAsNewClaim={handleCopyAsNewClaim}
            onOpenProductMaster={(selectionMode) => {
              setIsProductSelectionMode(!!selectionMode);
              setIsProductMasterOpen(true);
            }}
          />
        </div>

        {/* [Mode B] A4 Report Preview View */}
        {viewMode === "report" && (
          <div className="h-full w-full flex flex-col">
            <ReportPreviewPane
              report={report}
              onOpenCsEmail={() => setIsCsEmailOpen(true)}
              onPrint={handlePrint}
              onSwitchToForm={() => setViewMode("form")}
              onSwitchToEmail={() => setViewMode("email")}
              onUpdateReport={setReport}
            />
          </div>
        )}

        {/* [Mode C] Email View */}
        {viewMode === "email" && (
          <div className="h-full w-full overflow-y-auto">
            <EmailViewPane
              report={report}
              onSwitchToForm={() => setViewMode("form")}
              onSwitchToReport={() => setViewMode("report")}
              onUpdateReport={setReport}
            />
          </div>
        )}

        {/* Hidden Printable Container: Guarantees window.print() prints the pristine A4 report even if printed from form/email mode */}
        {viewMode !== "report" && (
          <div className="hidden print:block">
            <ReportPreviewPane
              report={report}
              onOpenCsEmail={() => {}}
              onPrint={() => {}}
            />
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <PrintExportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        report={report}
        onDirectPrint={() => {
          try {
            window.focus();
            window.print();
          } catch (e) {
            console.warn(e);
          }
        }}
      />

      <CsEmailModal
        report={report}
        isOpen={isCsEmailOpen}
        onClose={() => setIsCsEmailOpen(false)}
        onUpdateReport={setReport}
      />

      <UnifiedQualityManagerModal
        isOpen={isMasterManagerOpen}
        onClose={() => setIsMasterManagerOpen(false)}
        initialTab={masterManagerTab}
        currentReport={report}
        onApplyPreset={handleApplyPreset}
        onApplyPhrase={handleApplyPhrase}
        onApplyProcess={handleApplyProcess}
      />

      <PhraseManagerModal
        isOpen={isPhraseManagerOpen}
        onClose={() => setIsPhraseManagerOpen(false)}
        defaultField={phraseManagerField}
        onApplyPhrase={handleApplyPhrase}
        onOpenPresetManager={() => {
          setIsPhraseManagerOpen(false);
          setMasterManagerTab("presets");
          setIsMasterManagerOpen(true);
        }}
      />

      <PresetManagerModal
        isOpen={isPresetManagerOpen}
        onClose={() => setIsPresetManagerOpen(false)}
        currentReport={report}
        onApplyPreset={handleApplyPreset}
        onOpenPhraseManager={() => {
          setIsPresetManagerOpen(false);
          setIsPhraseManagerOpen(true);
        }}
      />

      <ReportValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        summary={validationSummary}
        report={report}
        onNavigateToField={handleNavigateToField}
      />

      <PastClaimSearchModal
        isOpen={isPastClaimModalOpen}
        onClose={() => setIsPastClaimModalOpen(false)}
        onCopyAsNewClaim={handleCopyAsNewClaim}
      />

      <ProductMasterModal
        isOpen={isProductMasterOpen}
        onClose={() => setIsProductMasterOpen(false)}
        onSelectProduct={handleApplyProduct}
        selectedProductId={report.productInfo.productId}
        isSelectionMode={isProductSelectionMode}
      />

      <ManufacturerMasterModal
        isOpen={isManufacturerMasterOpen}
        onClose={() => setIsManufacturerMasterOpen(false)}
        selectedManufacturerId={report.productInfo.manufacturerId}
        selectedLineId={report.productInfo.manufactureLineId}
      />

      <ReportListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentReport={report}
        onLoadReport={setReport}
        onNewReport={handleNewReport}
      />

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
