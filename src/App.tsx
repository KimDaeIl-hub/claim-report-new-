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
  Zap,
  CheckCircle2,
  Database,
} from "lucide-react";
import { ReportData, ClaimPreset, ProductMaster, InvestigationPackage } from "./types";
import { ClaimKnowledgeItem } from "./types/claimKnowledge";
import { saveClaimKnowledge, loadAllClaimKnowledge } from "./utils/claimKnowledgeStorage";
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
import { InvestigationPackageModal } from "./components/InvestigationPackageModal";
import { FactoryProcessModal } from "./components/FactoryProcessModal";
import { InvestigationPreparationView } from "./components/InvestigationPreparationView";
import { CompleteClaimKnowledgeModal } from "./components/CompleteClaimKnowledgeModal";
import { ClaimKnowledgeManagerModal } from "./components/ClaimKnowledgeManagerModal";
import { QualityKnowledgeCenterModal, KnowledgeCenterTab } from "./components/QualityKnowledgeCenterModal";
import { applyInvestigationPackageToReport } from "./data/investigationPackageBuilder";
import { applyInvestigationStructureToReport } from "./utils/investigationStructureImporter";
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
  clearDraftFromDb,
  isRecoverableDraft,
} from "./utils/storage";
import { collectSeedBundle, applySeedBundle, describeSeedApplyResult } from "./utils/seedImporter";
import { buildAutoReportTitle } from "./utils/reportTitle";
import { toLocalDateTimeString } from "./utils/localDate";
import { waitForReportImages } from "./utils/printReady";

type ViewMode = "preparation" | "form" | "report" | "email";

type SaveStatus = "saved" | "dirty" | "saving" | "error";

/**
 * 저장된 초안 문자열 정제 (레거시 명칭 치환 + 더미 사진 제거, 기존 동작 유지)
 */
function sanitizeDraftReport(raw: string): ReportData | null {
  try {
    const sanitized = raw
      .replaceAll("대한푸드품질연구원", "광동제약")
      .replaceAll("대한푸드㈜", "광동제약㈜")
      .replaceAll("대한푸드", "광동제약");
    const parsed = JSON.parse(sanitized);
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    try {
      const cachedLogo = localStorage.getItem("food_qc_custom_company_logo");
      if (cachedLogo && !parsed.companyLogoUrl) {
        parsed.companyLogoUrl = cachedLogo;
      }
    } catch {
      // ignore
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
  } catch (e) {
    console.warn("Autosaved draft recovery note:", e);
    return null;
  }
}

export default function App() {
  // 초기 보고서는 빈 양식으로 시작. 저장된 초안은 마운트 후 복구 배너로 선택 복원
  // (자동 덮어쓰기로 사용자 입력을 잃지 않도록 auto-restore하지 않음)
  const [report, setReport] = useState<ReportData>(() => {
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

  // 저장 상태 머신: saved(저장됨) / dirty(저장 대기) / saving(저장 중) / error(저장 실패)
  // "저장됨"은 IndexedDB transaction 완료 후에만 표시됨
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveErrorMsg, setSaveErrorMsg] = useState<string>("");
  const saveRevision = useRef(0);
  const saveTimer = useRef<number | null>(null);
  const lastSavedSnapshot = useRef<string>("");

  // 초안 복구: 저장된 초안이 있으면 사용자가 선택할 때까지 자동저장 보류
  const [recoveryCandidate, setRecoveryCandidate] = useState<ReportData | null>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);

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
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCompleteKnowledgeModalOpen, setIsCompleteKnowledgeModalOpen] = useState(false);
  const [isKnowledgeManagerOpen, setIsKnowledgeManagerOpen] = useState(false);
  const [isKnowledgeCenterOpen, setIsKnowledgeCenterOpen] = useState(false);
  const [isFactoryProcessOpen, setIsFactoryProcessOpen] = useState(false);
  const [knowledgeCenterTab, setKnowledgeCenterTab] = useState<KnowledgeCenterTab>("products");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openKnowledgeCenter = (tab: KnowledgeCenterTab = "products") => {
    setKnowledgeCenterTab(tab);
    setIsKnowledgeCenterOpen(true);
  };

  const validationSummary = validateReport(report);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveKnowledge = (knowledgeItem: ClaimKnowledgeItem, updatedReport: ReportData) => {
    // 1. 기존 보고서 보존 (보관함 및 로컬 DB 영구 보관)
    saveReportToArchive(updatedReport);
    saveReportToDb(updatedReport);
    setReport(updatedReport);
    setSavedCount(getSavedReports().length);

    // 2. 구조화된 5대 지식 데이터 Knowledge Base 등록
    saveClaimKnowledge(knowledgeItem);

    // 3. 안내 알림
    showToast(
      `클레임 조사가 완료되었으며, 구조화된 Knowledge Base(${knowledgeItem.conclusionInfo.causeStatusLabel})로 연결되었습니다. 향후 유사 클레임에 재사용됩니다.`
    );
  };

  const handleCompleteWithoutKnowledge = (updatedReport: ReportData) => {
    saveReportToArchive(updatedReport);
    saveReportToDb(updatedReport);
    setReport(updatedReport);
    setSavedCount(getSavedReports().length);
    showToast("보고서가 완료 처리되어 보관함에 보존되었습니다. (지식화 제외)");
  };

  const handleStartInvestigationPackage = (assembledPackage: InvestigationPackage) => {
    setReport((prev) => {
      const next = applyInvestigationPackageToReport(prev, assembledPackage);
      saveReportToDb(next);
      return next;
    });
    setViewMode("form");
    setFormActiveTab("claim");
    showToast(`'${assembledPackage.productMaster.productName}' 조사 패키지가 적용되었습니다. 조사를 시작합니다.`);
  };

  const handleUseAsInvestigationPackage = (pastReport: ReportData) => {
    setReport((prev) => {
      const next = applyInvestigationStructureToReport(prev, pastReport);
      saveReportToDb(next);
      return next;
    });
    setViewMode("form");
    setFormActiveTab("analysis"); // Move immediately to analysis results tab
    showToast(
      `'${pastReport.productInfo.productName || pastReport.title || "과거 사례"}'의 조사 구조(항목, 방법, 공정, 상용구)가 적용되었습니다. 실제 결과는 새로 입력해주세요.`
    );
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
  // (이미지 로딩 대기 후 인쇄하여 빈 이미지 출력 방지, 실패해도 인쇄 진행)
  useEffect(() => {
    if (isPrintMode) {
      let cancelled = false;
      const timer = setTimeout(() => {
        waitForReportImages().finally(() => {
          if (!cancelled) window.print();
        });
      }, 700);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [isPrintMode]);

  // 개발용 Seed 1회 적용 (?seed=demo): ID 기준 병합, 기존 데이터 덮어쓰기 없음
  const seedAppliedRef = useRef(false);
  useEffect(() => {
    if (seedAppliedRef.current) return;
    if (new URLSearchParams(window.location.search).get("seed") !== "demo") return;
    seedAppliedRef.current = true;
    try {
      const result = applySeedBundle(collectSeedBundle());
      // 반환값 근거로 안내 (신규 0건이면 이미 등록 상태로 구분, URL 존재만으로 성공 판단 금지)
      showToast(describeSeedApplyResult(result));
      console.info("[seed] 적용 결과:", result);
    } catch (e: any) {
      // 실패 시 성공 메시지 금지, 원인 전달 (기존 데이터 변경 없음)
      showToast(`Seed 적용 실패: ${e?.message || "알 수 없는 오류"} (기존 데이터 변경 없음)`);
      console.warn("[seed] 적용 실패:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 초안 복구 확인: 저장된 초안에 사용자 입력이 있으면 배너로 선택 요청
  // (자동 복원으로 현재 입력을 덮어쓰지 않음)
  useEffect(() => {
    let cancelled = false;
    loadReportFromDb().then((loaded) => {
      if (cancelled) return;
      if (loaded && loaded.id && isRecoverableDraft(loaded, JSON.stringify(INITIAL_REPORT_DATA))) {
        const cleaned = sanitizeDraftReport(JSON.stringify(loaded)) || loaded;
        setRecoveryCandidate(cleaned);
      } else {
        setRecoveryChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveRecovery = (restore: boolean) => {
    if (restore && recoveryCandidate) {
      setReport(recoveryCandidate);
      try {
        lastSavedSnapshot.current = JSON.stringify(recoveryCandidate);
      } catch {
        // ignore
      }
      setSaveStatus("saved");
      showToast("저장된 초안을 복구했습니다.");
    } else {
      // 사용자가 명시 선택한 경우에만 초안 삭제 (보관함·마스터에는 손대지 않음)
      clearDraftFromDb();
      showToast("새 보고서 작성을 시작합니다.");
    }
    setRecoveryCandidate(null);
    setRecoveryChecked(true);
    // 선택 직후 현재 내용이 저장본과 다르면 즉시 저장 예약
    saveRevision.current += 1;
    scheduleFlush(saveRevision.current);
  };

  // 최신 report 미러 (타이머·visibility 핸들러에서 클로저 stale 방지, 부작용 없는 읽기용)
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  const flushSaveRevision = async (snapshot: ReportData, rev: number) => {
    setSaveStatus("saving");
    const result = await saveReportToDb(snapshot);
    // 더 최신 변경이 예약되어 있으면 이번 완료를 "저장됨"으로 표시하지 않음
    if (rev !== saveRevision.current) {
      setSaveStatus("dirty");
      return;
    }
    if (result.ok) {
      try {
        lastSavedSnapshot.current = JSON.stringify(snapshot);
      } catch {
        // ignore
      }
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setLastSavedAt(timeStr);
      setSaveErrorMsg("");
      setSaveStatus("saved");
      if (!result.lsWritten) {
        // IndexedDB에는 저장됐으나 localStorage 용량 제한: 사진은 안전, 안내만 제공
        showToast("초안은 저장됐습니다. 브라우저 저장 공간이 부족하여 일부 환경에서 즉시 복구가 제한될 수 있습니다.");
      }
    } else {
      // 사진을 삭제하지 않고 실패 상태로만 표시 (메모리는 그대로 유지)
      setSaveErrorMsg(result.error || "자동 저장에 실패했습니다.");
      setSaveStatus("error");
    }
  };

  const scheduleFlush = (rev: number) => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      flushSaveRevision(reportRef.current, rev);
    }, 1200);
  };

  // 변경 기반 자동 저장: report 변경 → 저장 대기 → 1.2초 debounce → 큐 저장
  useEffect(() => {
    if (!recoveryChecked) return;
    setSaveStatus("dirty");
    const rev = (saveRevision.current += 1);
    scheduleFlush(rev);
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, recoveryChecked]);

  // 탭 전환·숨김 시 대기 중인 저장 즉시 flush (모바일 백그라운드 대비)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && recoveryChecked) {
        if (saveTimer.current !== null) {
          window.clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
        const rev = (saveRevision.current += 1);
        flushSaveRevision(reportRef.current, rev);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [recoveryChecked]);

  // 수동 저장: 대기 중인 debounce를 취소하고 즉시 저장 (기존 수동 저장 기능 유지)
  const handleManualSave = async () => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const rev = (saveRevision.current += 1);
    await flushSaveRevision(reportRef.current, rev);
    if (saveRevision.current === rev) {
      showToast("현재 클레임 데이터(조사결과 버튼 선택값 포함)가 저장되었습니다.");
    }
  };

  const handlePrint = () => {
    setViewMode("report");
    waitForReportImages().finally(() => {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn("Direct window.print() failed", e);
      }
    });
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
      title: buildAutoReportTitle("비타민 음료 A", "foreign"),
      customerClaim: {
        // 신규 접수일은 로컬 기준 오늘, 현품 접수일은 미접수 상태(빈 값)로 시작
        receivedAt: toLocalDateTimeString(),
        sampleReceivedDate: "",
        channel: "고객상담센터 (유선 접수)",
        customerName: "",
        maskCustomerName: false,
        contact: "",
        claimDetails: "",
        customerPhotos: [],
      },
      productInfo: {
        productName: "비타민 음료 A",
        lotNumber: "",
        manufactureDate: "",
        expiryDate: "",
        packageType: "유리병",
        manufacturer: "광동제약 평택공장",
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
    setViewMode("preparation");
    showToast("신규 클레임 조사 준비 화면으로 이동했습니다. 기본정보를 입력하고 조사 패키지를 구성하세요.");
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

        {/* 1-Click View Mode Switcher (Preparation / Form / Report / Email) */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
          <button
            type="button"
            id="btn-nav-mode-preparation"
            onClick={() => setViewMode("preparation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "preparation"
                ? "bg-amber-400 text-slate-950 shadow-xs font-black ring-1 ring-amber-300"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="신규 클레임 조사 준비: 기본정보 입력 및 6대 조사 패키지 자동 구성"
          >
            <Zap className={`w-3.5 h-3.5 ${viewMode === "preparation" ? "fill-slate-950 text-slate-950" : "text-amber-400"}`} />
            <span>조사 준비</span>
          </button>

          <button
            type="button"
            id="btn-nav-mode-form"
            onClick={() => setViewMode("form")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "form"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="원인조사 세부 내용 작성 폼"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>작성 폼</span>
          </button>

          <button
            type="button"
            id="btn-nav-mode-report"
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
            id="btn-nav-mode-email"
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
          {/* Key Feature: 신규 클레임 (조사 준비 시작) Button */}
          <button
            type="button"
            id="btn-nav-new-claim"
            onClick={handleNewReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-all active:scale-95 border border-blue-400 cursor-pointer"
            title="신규 클레임 조사 준비 시작 (기본정보 입력 후 6대 조사 패키지 자동 구성)"
          >
            <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>신규 클레임</span>
          </button>

          {/* Key Feature: 조사 패키지 자동 구성 Button → 조사 준비 화면 단일 진입 */}
          <button
            type="button"
            id="btn-nav-investigation-package"
            onClick={() => setViewMode("preparation")}
            className="hidden"
            title="제품 + 제조번호 + 클레임 유형을 입력하여 조사 자료와 조사 항목을 실시간 자동 구성"
          >
            <span>조사 패키지 자동 구성</span>
          </button>

          {/* Autosave badge → 하단 작은 상태 표시로 통합 (중복 제거, hidden) */}
          <div className="hidden">
            <span>
              {lastSavedAt ? `자동 저장됨 (${lastSavedAt})` : "10초마다 자동 임시 저장"}
            </span>
          </div>

          {/* Key Feature: 조사 완료 & 지식화 Button → form 서브헤더/보고서 화면 진입으로 통합 (헤더 중복 제거, hidden) */}
          <button
            type="button"
            id="btn-complete-claim-knowledge"
            onClick={() => setIsCompleteKnowledgeModalOpen(true)}
            className="hidden"
            title="조사 완료 처리 및 향후 유사사례 검색에 활용할 수 있도록 Knowledge 데이터로 연결"
          >
            <span>클레임 완료 & 지식화</span>
          </button>

          {/* Direct Manual Save Button → 작은 상태 표시 + 더보기로 이동, 기능 유지 (hidden) */}
          <button
            type="button"
            onClick={handleManualSave}
            className="hidden"
            title="현재 작성 중인 데이터 즉시 수동 저장 (새로고침 시에도 유지됨)"
          >
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

          {/* Knowledge Base Modal Trigger → 품질 지식센터 지식 탭으로 통합 (hidden: 직접 진입 제거) */}
          <button
            type="button"
            id="btn-nav-knowledge-base"
            onClick={() => openKnowledgeCenter("knowledge")}
            className="hidden"
            title="완료 클레임 지식 베이스(Knowledge Base) 목록 및 재사용"
          >
            <span className="hidden sm:inline">지식 베이스</span>
          </button>

          {/* Key Evolution: 품질 지식센터 (Quality Knowledge Center) Button */}
          <button
            type="button"
            id="btn-nav-quality-knowledge-center"
            onClick={() => openKnowledgeCenter("products")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm transition-all border border-blue-400/50 cursor-pointer active:scale-95"
            title="품질 지식센터: 제품 · 제조처/라인 · 제조공정 · 클레임유형 · 템플릿 · 상용구 · 과거사례 · 품질지식 8대 정보 상호 연계 센터"
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">품질 지식센터</span>
            <span className="sm:hidden">지식센터</span>
          </button>

          {/* Product Master Button → 품질 지식센터 제품 탭으로 통합 (hidden) */}
          <button
            type="button"
            id="btn-nav-product-master"
            onClick={() => openKnowledgeCenter("products")}
            className="hidden"
            title="제품 Master (제품명, 코드, 포장, 제조라인) 표준 관리 및 상호 연계"
          >
            <span className="hidden sm:inline">제품 Master</span>
          </button>

          {/* Manufacturer & Line Master Button → 품질 지식센터 제조처 탭으로 통합 (hidden) */}
          <button
            type="button"
            id="btn-nav-manufacturer-master"
            onClick={() => openKnowledgeCenter("manufacturers")}
            className="hidden"
            title="제조처 및 제조라인 Master (자사 공장, OEM, 라인 규격) 표준 관리 및 상호 연계"
          >
            <span className="hidden sm:inline">제조처/라인 Master</span>
          </button>

          {/* Preset Manager Button → 품질 지식센터 템플릿 탭으로 통합 (hidden) */}
          <button
            type="button"
            onClick={() => openKnowledgeCenter("templates")}
            className="hidden"
            title="조사 템플릿/프리셋 관리 및 상호 연계"
          >
            <span className="hidden sm:inline">프리셋</span>
          </button>

          {/* Phrase Manager → 품질 지식센터 상용구 탭으로 통합 (hidden) */}
          <button
            type="button"
            onClick={() => openKnowledgeCenter("phrases")}
            className="hidden"
            title="나만의 상용구 라이브러리 관리 및 상호 연계"
          >
            <span className="hidden sm:inline">상용구</span>
          </button>

          {/* Direct new-tab print link → PrintExportModal로 통합 (헤더 중복 제거, hidden) */}
          <a
            href={`/?print=true&t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden"
            title="새 브라우저 탭에서 깨끗하게 A4 인쇄 / PDF 저장"
          >
            <span>새 창 인쇄</span>
          </a>

          {/* Main Print / Save PDF Button → 보고서 단계에서 사용, 헤더에는 더보기로 유지 */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 rounded-lg shadow-sm transition-all"
            title="A4 규격 인쇄 및 PDF 저장"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 / PDF</span>
          </button>

          {/* 더보기: 부가 기능 (저장/완료/지식/새창인쇄) — 기존 기능 재호출, 신규 로직 없음 */}
          <details className="relative">
            <summary className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer list-none">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">더보기</span>
            </summary>
            <div className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl z-30">
              <button
                type="button"
                onClick={handleManualSave}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>지금 저장</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCompleteKnowledgeModalOpen(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>클레임 완료 & 지식화</span>
              </button>
              <button
                type="button"
                onClick={() => openKnowledgeCenter("knowledge")}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                <Database className="w-3.5 h-3.5 text-amber-300" />
                <span>지식 베이스</span>
              </button>
              <a
                href={`/?print=true&t=${Date.now()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 rounded-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>새 창 인쇄</span>
              </a>
            </div>
          </details>

          {/* 저장 상태 표시 (4상태: 저장 대기 / 저장 중 / 저장됨 / 저장 실패) */}
          {saveStatus === "error" ? (
            <button
              type="button"
              onClick={handleManualSave}
              className="hidden md:flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-red-300 hover:text-white"
              title={saveErrorMsg || "저장 실패 — 클릭하면 다시 저장합니다. 사진 등 입력값은 메모리에서 유지됩니다."}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>● 저장 실패 (다시 시도)</span>
            </button>
          ) : (
            <div
              className="hidden md:flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-400"
              title={
                saveStatus === "saving"
                  ? "IndexedDB에 기록 중입니다. 완료 후 저장됨으로 표시됩니다."
                  : saveStatus === "dirty"
                  ? "변경 내용이 있어 잠시 후 자동 저장됩니다."
                  : "IndexedDB 기록이 완료된 상태입니다."
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === "saved"
                    ? "bg-emerald-400"
                    : saveStatus === "saving"
                    ? "bg-blue-400 animate-pulse"
                    : "bg-amber-400 animate-pulse"
                }`}
              />
              <span>
                {saveStatus === "saved" && `● 저장됨 ${lastSavedAt || "--:--:--"}`}
                {saveStatus === "saving" && "● 저장 중…"}
                {saveStatus === "dirty" && "● 저장 대기"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 초안 복구 배너: 저장된 초안이 있으면 사용자가 선택할 때까지 유지 */}
      {recoveryCandidate && (
        <div className="no-print shrink-0 bg-amber-50 border-b border-amber-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <History className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>이전에 작성하던 초안이 있습니다.</strong>
              <span className="text-amber-700"> 복구하면 고객명·제품·조사내용·사진이 그대로 이어집니다.</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => resolveRecovery(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              버리고 새로 시작
            </button>
            <button
              type="button"
              onClick={() => resolveRecovery(true)}
              className="px-3 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              초안 복구하기
            </button>
          </div>
        </div>
      )}

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
            {/* [클레임 완료 & 지식화] 버튼 in subheader */}
            <button
              type="button"
              id="btn-subheader-complete-claim"
              onClick={() => setIsCompleteKnowledgeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="조사 완료 처리 및 향후 유사사례 검색에 활용할 수 있도록 Knowledge 데이터로 연결"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>클레임 완료 & 지식화</span>
            </button>

            {/* [⚡ 조사 패키지 자동 구성] → Preparation 화면 단일 진입 (모달 중복 호출 제거, 모달 자체는 유지) */}
            <button
              type="button"
              id="btn-subheader-investigation-package"
              onClick={() => setViewMode("preparation")}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border border-amber-400 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="제품 + 제조번호 + 클레임 유형으로 조사 패키지 자동 구성 (준비 화면에서 시작)"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>조사 패키지 자동 구성</span>
            </button>

            {/* [이전 클레임 불러오기] → 품질 지식센터 과거사례 탭으로 통합 (서브헤더 중복 제거, hidden) */}
            <button
              type="button"
              id="btn-subheader-load-past-claim"
              onClick={() => setIsPastClaimModalOpen(true)}
              className="hidden"
              title="과거 클레임 이력 검색 및 상세 내용 조회"
            >
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

            {/* 이메일/보고서 이동 → 상단 단계 내비게이션으로 통합 (서브헤더 중복 제거, hidden) */}
            <button
              type="button"
              onClick={() => setViewMode("email")}
              className="hidden"
              title="이메일 회신문 보기"
            >
              <span>이메일 회신 보기</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("report")}
              className="hidden"
              title="소비자용 정식 A4 공문서 보고서 미리보기"
            >
              <span>소비자용 A4 보고서 미리보기</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* [Mode S] New Claim Investigation Preparation View (조사 준비 화면) */}
        {viewMode === "preparation" && (
          <div className="h-full w-full overflow-y-auto">
            <InvestigationPreparationView
              currentReport={report}
              onStartInvestigation={handleStartInvestigationPackage}
              onDirectToFormMode={() => setViewMode("form")}
            />
          </div>
        )}

        {/* [Mode A] Input Form View (Kept mounted to preserve tab & scroll state) */}
        <div className={viewMode === "form" ? "h-full w-full flex flex-col bg-white" : "hidden"}>
          <InputFormPane
            report={report}
            onChange={(updated) => {
              // 변경분은 dirty → debounce → 큐 저장 엔진이 처리 (입력마다 즉시 저장하지 않음)
              setReport(updated);
            }}
            activeTab={formActiveTab}
            onTabChange={setFormActiveTab}
            onOpenPhraseManager={(fieldKey) => {
              // 작성 화면 상용구 진입 → 품질 지식센터 상용구 탭 (deep-link)
              // 적용 시맨틱 동일: phrase.fieldKey 기준 handleApplyPhrase
              setPhraseManagerField(fieldKey);
              openKnowledgeCenter("phrases");
            }}
            onOpenPresetManager={() => {
              // 작성 화면 프리셋 진입 → 품질 지식센터 프리셋 탭 (deep-link)
              openKnowledgeCenter("templates");
            }}
            onOpenProcessManager={() => {
              openKnowledgeCenter("processes");
            }}
            onOpenValidation={() => setIsValidationModalOpen(true)}
            onOpenPastClaims={() => openKnowledgeCenter("pastClaims")}
            onCopyAsNewClaim={handleCopyAsNewClaim}
            onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
            onOpenProductMaster={(selectionMode) => {
              // 작성 화면 제품 선택 → 품질 지식센터 제품 탭 (deep-link)
              setIsProductSelectionMode(!!selectionMode);
              openKnowledgeCenter("products");
            }}
            onOpenPackageModal={() => setIsPackageModalOpen(true)}
            onOpenCompleteKnowledge={() => setIsCompleteKnowledgeModalOpen(true)}
            onPreviewReport={() => setViewMode("report")}
            onComposeEmail={() => setViewMode("email")}
            onPrintReport={handlePrint}
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
              onOpenCompleteKnowledge={() => setIsCompleteKnowledgeModalOpen(true)}
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
          waitForReportImages().finally(() => {
            try {
              window.focus();
              window.print();
            } catch (e) {
              console.warn(e);
            }
          });
        }}
      />

      <CsEmailModal
        report={report}
        isOpen={isCsEmailOpen}
        onClose={() => setIsCsEmailOpen(false)}
        onUpdateReport={setReport}
      />

      {/* 품질 지식센터: 단일 관리 허브 (7탭 + 클레임 유형). 전용 관리 모달보다 먼저 렌더 → 브릿지로 열리는 모달이 위에 표시됨 */}
      <QualityKnowledgeCenterModal
        isOpen={isKnowledgeCenterOpen}
        onClose={() => setIsKnowledgeCenterOpen(false)}
        initialTab={knowledgeCenterTab}
        currentReport={report}
        onApplyProduct={handleApplyProduct}
        onApplyProcess={handleApplyProcess}
        onApplyPreset={handleApplyPreset}
        onApplyPhrase={handleApplyPhrase}
        onCopyAsNewClaim={handleCopyAsNewClaim}
        onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
        onOpenProductManager={() => setIsProductMasterOpen(true)}
        onOpenManufacturerManager={() => setIsManufacturerMasterOpen(true)}
        onOpenProcessManager={() => setIsFactoryProcessOpen(true)}
        onOpenPresetManager={() => setIsPresetManagerOpen(true)}
        onOpenPhraseManager={() => setIsPhraseManagerOpen(true)}
        onOpenPastClaimSearch={() => setIsPastClaimModalOpen(true)}
        onOpenKnowledgeManager={() => setIsKnowledgeManagerOpen(true)}
      />

      {/* 제조공정도 편집기 (지식센터 제조공정 탭 → 공정 관리 브릿지, 기존 모달·데이터 재사용) */}
      <FactoryProcessModal
        isOpen={isFactoryProcessOpen}
        onClose={() => setIsFactoryProcessOpen(false)}
        currentManufacturer={report.productInfo.manufacturer}
        onApplyProcess={handleApplyProcess}
      />

      <UnifiedQualityManagerModal
        isOpen={isMasterManagerOpen}
        onClose={() => setIsMasterManagerOpen(false)}
        initialTab={masterManagerTab}
        currentReport={report}
        onApplyPreset={handleApplyPreset}
        onApplyPhrase={handleApplyPhrase}
        onApplyProcess={handleApplyProcess}
        onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
        onOpenQualityKnowledgeCenter={(tab) => {
          setIsMasterManagerOpen(false);
          openKnowledgeCenter((tab as KnowledgeCenterTab) || "products");
        }}
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
        currentReport={report}
        onCopyAsNewClaim={handleCopyAsNewClaim}
        onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
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

      {/* Investigation Package Auto-Assembly Modal */}
      <InvestigationPackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        onStartInvestigation={handleStartInvestigationPackage}
        onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
        initialProduct={report.productInfo.productName}
        initialLotNumber={report.productInfo.lotNumber}
      />

      <ReportListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentReport={report}
        onLoadReport={(loaded) =>
          setReport({
            ...loaded,
            productInfo: {
              ...loaded.productInfo,
              // 구형 보관 데이터에 제조번호 필드가 없으면 빈 값으로 정규화 (제어 컴포넌트 경고 방지)
              lotNumber: loaded.productInfo?.lotNumber || "",
            },
          })
        }
        onNewReport={handleNewReport}
      />

      {/* 완료 클레임 지식화 승인 및 연결 모달 */}
      <CompleteClaimKnowledgeModal
        isOpen={isCompleteKnowledgeModalOpen}
        onClose={() => setIsCompleteKnowledgeModalOpen(false)}
        report={report}
        onApproveKnowledge={handleApproveKnowledge}
        onCompleteWithoutKnowledge={handleCompleteWithoutKnowledge}
      />

      {/* 완료 클레임 지식 베이스(Knowledge Base) 조회 및 재사용 모달 */}
      <ClaimKnowledgeManagerModal
        isOpen={isKnowledgeManagerOpen}
        onClose={() => setIsKnowledgeManagerOpen(false)}
        onApplyAsInvestigationPackage={handleUseAsInvestigationPackage}
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
