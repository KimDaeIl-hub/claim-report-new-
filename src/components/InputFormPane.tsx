import { useState, useEffect, useMemo, useRef } from "react";
import {
  User,
  Package,
  Microscope,
  Cpu,
  History,
  AlertOctagon,
  FileCheck,
  Paperclip,
  EyeOff,
  Eye,
  Plus,
  Trash2,
  HelpCircle,
  Wand2,
  Sparkles,
  Settings,
  FileUp,
  Upload,
  CheckCircle2,
  AlertCircle,
  Database,
  X,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  Building2,
  Factory,
  Workflow,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  Copy,
  Edit3,
  Zap,
} from "lucide-react";
import { ReportData, PhysicochemicalItem, AdditionalTestItem, ClaimPreset, InvestigationStatus, InvestigationItemSelection, InvestigationResultsData, ProductMaster, ProcessStepMaster } from "../types";
import { getAllPresets } from "../data/presets";
import { findProductById, findProductByName } from "../data/productMaster";
import { findManufacturerById, findLineById } from "../data/manufacturerMaster";
import { loadAllProcessSteps } from "../data/processStepMaster";
import { ProductMasterModal } from "./ProductMasterModal";
import { ProcessStepDetailModal } from "./ProcessStepDetailModal";
import { parseMhtFile, ParsedMhtClaimData } from "../utils/mhtParser";
import { mergePresetData, isUserPhoto } from "../utils/storage";
import { stripInternalPrefix } from "../utils/displayName";
import { AiPolishButton } from "./AiPolishButton";
import { PhraseDropdown } from "./PhraseDropdown";
import { SituationPhraseRecommendationCard } from "./SituationPhraseRecommendationCard";
import { InlinePhraseSuggest } from "./InlinePhraseSuggest";
import { UnifiedAttachmentManager, LinkedPhotoView, resolvePhotoLinks } from "./UnifiedAttachmentManager";
import { TestPrincipleBox } from "./TestPrincipleBox";
import { CompanyLogoUploader } from "./CompanyLogoUploader";
import { PresetSelectorBar } from "./PresetSelectorBar";
import { InvestigationStatusSelector } from "./InvestigationStatusSelector";
import { InvestigationButtonGroup } from "./InvestigationButtonGroup";
import { GeneratedSentenceCard } from "./GeneratedSentenceCard";
import { InvestigationDetailInputsCard } from "./InvestigationDetailInputsCard";
import { INVESTIGATION_CHOICES, getChoiceOptionCode, getChoiceOptionLabel, InvestigationChoiceKey } from "../data/investigationChoices";
import {
  getInvestigationSentenceTemplate,
  assembleInvestigationSentence,
  InvestigationItemKey,
} from "../data/investigationTemplates";
import { getInvestigationConditionKey } from "../data/investigationPackageBuilder";
import { InvestigationDetailInputs } from "../types";
import { getUnexaminedInvestigationItems } from "../utils/investigationStatus";
import { validateReport } from "../utils/reportValidator";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { MhtReviewModal } from "./MhtReviewModal";
import { FactoryProcessModal } from "./FactoryProcessModal";
import { PastClaimSearchModal } from "./PastClaimSearchModal";
import {
  FACTORY_PROCESS_PRESETS,
  FactoryProcessPreset,
  findFactoryPresetByName,
  loadAllFactoryPresets,
} from "../data/factoryProcessPresets";
import { ClaimTypeFilterBar } from "./ClaimTypeFilterBar";
import {
  ClaimTypeCategory,
  CLAIM_TYPES,
  getAnalysisItemVisibility,
  mapPresetSubCategoryToClaimType,
} from "../utils/claimTypeConfig";
import { InvestigationProgressTracker } from "./InvestigationProgressTracker";
import { ProgressItem, ChecklistStatus, calculateReportProgress } from "../utils/progressTracker";
import { getNextRequiredAction, WorkflowStepId } from "../utils/requiredFieldsManager";
import { SimilarClaimRecommendationCard } from "./SimilarClaimRecommendationCard";
import { MethodImportOptions } from "./ImportInvestigationMethodModal";
import { SimilarClaimRecommendation, CurrentClaimContext } from "../utils/similarClaimRecommender";
import { applyInvestigationStructureToReport } from "../utils/investigationStructureImporter";

interface InputFormPaneProps {
  report: ReportData;
  onChange: (updated: ReportData) => void;
  onOpenPhraseManager: (fieldKey?: string) => void;
  onOpenPresetManager?: () => void;
  onOpenProcessManager?: () => void;
  onOpenValidation?: () => void;
  onOpenPastClaims?: () => void;
  onCopyAsNewClaim?: (newReport: ReportData) => void;
  onUseAsInvestigationPackage?: (pastReport: ReportData) => void;
  onOpenProductMaster?: (selectionMode?: boolean) => void;
  onOpenPackageModal?: () => void;
  onOpenCompleteKnowledge?: () => void;
  onPreviewReport?: () => void;
  onComposeEmail?: () => void;
  onPrintReport?: () => void;
  activeSectionId?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function InputFormPane({
  report,
  onChange,
  onOpenPhraseManager,
  onOpenPresetManager,
  onOpenProcessManager,
  onOpenValidation,
  onOpenPastClaims,
  onCopyAsNewClaim,
  onUseAsInvestigationPackage: propOnUseAsInvestigationPackage,
  onOpenProductMaster,
  onOpenPackageModal,
  onOpenCompleteKnowledge,
  onPreviewReport,
  onComposeEmail,
  onPrintReport,
  activeSectionId,
  activeTab: propActiveTab,
  onTabChange,
}: InputFormPaneProps) {
  const [internalTab, setInternalTab] = useState<string>("claim");
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalTab;
  const setActiveTab = (tabId: string) => {
    if (onTabChange) onTabChange(tabId);
    setInternalTab(tabId);
  };

  const [isInternalPastClaimOpen, setIsInternalPastClaimOpen] = useState(false);
  const handleOpenPastClaims = () => {
    if (onOpenPastClaims) {
      onOpenPastClaims();
    } else {
      setIsInternalPastClaimOpen(true);
    }
  };

  // 제품 Master 모달 상태
  const [isInternalProductModalOpen, setIsInternalProductModalOpen] = useState(false);
  const [isInternalProductSelectionMode, setIsInternalProductSelectionMode] = useState(true);

  const handleOpenProductMaster = (selectionMode = true) => {
    if (onOpenProductMaster) {
      onOpenProductMaster(selectionMode);
    } else {
      setIsInternalProductSelectionMode(selectionMode);
      setIsInternalProductModalOpen(true);
    }
  };

  // 현재 입력된 제품과 일치하는 Product Master 탐색
  // (Master 선택 후 텍스트 직접 수정 시 연결 해제 상태로 취급 → 직접 입력 전환)
  const matchedProduct = useMemo(() => {
    const byId = report.productInfo.productId
      ? findProductById(report.productInfo.productId)
      : undefined;
    if (byId) {
      return byId.productName === report.productInfo.productName ? byId : null;
    }
    return findProductByName(report.productInfo.productName) || null;
  }, [report.productInfo.productId, report.productInfo.productName]);

  // Master 연결 상태 판정 (연결됨 / 직접 입력 / 미입력)
  const productLinkState: "linked" | "direct" | "empty" = report.productInfo.productId && matchedProduct
    ? "linked"
    : report.productInfo.productName?.trim()
    ? "direct"
    : "empty";
  const linkedManufacturer = report.productInfo.manufacturerId
    ? findManufacturerById(report.productInfo.manufacturerId)
    : undefined;
  const manufacturerLinkState: "linked" | "direct" | "empty" =
    linkedManufacturer && linkedManufacturer.name === report.productInfo.manufacturer
      ? "linked"
      : report.productInfo.manufacturer?.trim()
      ? "direct"
      : "empty";
  const linkedLine = report.productInfo.manufactureLineId
    ? findLineById(report.productInfo.manufactureLineId)
    : undefined;
  const lineLinkState: "linked" | "direct" | "empty" =
    linkedLine && linkedLine.lineName === report.productInfo.manufactureLine
      ? "linked"
      : report.productInfo.manufactureLine?.trim()
      ? "direct"
      : "empty";

  const renderLinkBadge = (state: "linked" | "direct" | "empty") => {
    if (state === "linked") {
      return (
        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          Master 연결됨
        </span>
      );
    }
    if (state === "direct") {
      return (
        <span
          className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
          title="Master ID 없이 직접 입력된 값입니다. 보고서에는 정상 표시되며, Master 기반 자동 연결은 제한됩니다."
        >
          직접 입력
        </span>
      );
    }
    return null;
  };

  // 제품 마스터 선택 시 리포트 적용
  const handleApplyProductFromMaster = (product: ProductMaster) => {
    onChange({
      ...report,
      productInfo: {
        ...report.productInfo,
        productId: product.id,
        productName: product.productName,
        packageType: product.packageType || report.productInfo.packageType,
        manufacturerId: product.manufacturerId || report.productInfo.manufacturerId,
        manufacturer: product.manufacturer || report.productInfo.manufacturer,
        manufactureLineId: product.manufactureLineId || report.productInfo.manufactureLineId,
        manufactureLine: product.manufactureLine || report.productInfo.manufactureLine,
        manufacturerType: product.manufacturer.includes("광동") ? "internal" : "oem",
        productCode: product.productCode,
        subProductType: product.subProductType,
        volume: product.volume,
        containerType: product.containerType,
        factoryId: product.relatedProcessPresetId || report.productInfo.factoryId,
      },
    });
    setIsInternalProductModalOpen(false);
  };

  const [usePreset, setUsePreset] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<ClaimTypeCategory[]>(["foreign"]);
  const [showAllAnalysisItems, setShowAllAnalysisItems] = useState<boolean>(false);

  // 상황 기반 상용구 자동 추천을 위한 클레임 유형 및 제품 유형
  const activeClaimTypeKorean = useMemo(() => {
    const cat = selectedClaimTypes[0] || "foreign";
    if (cat === "foreign") return "이물";
    if (cat === "spoilage") return "변질";
    if (cat === "leak") return "누액";
    if (cat === "label") return "표시오류";
    if (cat === "volume") return "내용량";
    return "이물";
  }, [selectedClaimTypes]);

  const activeProductType = report.productInfo?.subProductType || "혼합음료";

  // Process Step Detail Modal state in InputFormPane
  const [selectedFormStep, setSelectedFormStep] = useState<ProcessStepMaster | null>(null);
  const [isFormStepModalOpen, setIsFormStepModalOpen] = useState(false);

  const handleOpenFormStepDetail = (stepName: string, stepIdx: number) => {
    const allSteps = loadAllProcessSteps();
    const mfg = report.productInfo?.manufacturer || "";
    let match = allSteps.find(
      (s) =>
        (s.processName === stepName || stepName.includes(s.processName) || s.processName.includes(stepName)) &&
        (mfg ? s.manufacturer.includes(mfg) || mfg.includes(s.manufacturer) : true)
    );
    if (!match) {
      match = allSteps.find(
        (s) => s.processName === stepName || stepName.includes(s.processName) || s.processName.includes(stepName)
      );
    }
    if (!match) {
      match = {
        id: `step-form-${stepIdx + 1}`,
        stepNumber: stepIdx + 1,
        manufacturer: report.productInfo?.manufacturer || "광동제약",
        manufactureLine: report.productInfo?.manufactureLine || "표준 생산라인",
        processName: stepName,
        description: `${report.productInfo?.manufacturer || "광동제약"}의 ${stepIdx + 1}번째 제조공정인 '${stepName}' 단계입니다.`,
        keyEquipment: "표준 제조 설비",
        controlPoints: "표준 작업 기준서(SOP) 준수",
        isCCP: stepName.includes("살균") || stepName.includes("금속") || stepName.includes("UHT"),
        ccpNumber: stepName.includes("살균") || stepName.includes("UHT") ? "CCP-1B" : stepName.includes("금속") ? "CCP-2P" : undefined,
        qualityRisks: "공정 관리 기준 준수 및 외래 이물 혼입 차단",
        possibleDefects: ["품질 이상"],
        isActive: true,
      };
    }
    setSelectedFormStep(match);
    setIsFormStepModalOpen(true);
  };
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState<boolean>(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);
  const [isStep1TypePresetOpen, setIsStep1TypePresetOpen] = useState<boolean>(false);
  const [isStep2FilterOpen, setIsStep2FilterOpen] = useState<boolean>(false);
  const [isUnexaminedWarningExpanded, setIsUnexaminedWarningExpanded] = useState<boolean>(false);
  const [mhtStatus, setMhtStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMhtOpen, setIsMhtOpen] = useState(false);
  const [isDraggingMht, setIsDraggingMht] = useState(false);
  const [pendingMhtData, setPendingMhtData] = useState<{
    fileName: string;
    parsed: ParsedMhtClaimData;
  } | null>(null);
  const [isMhtReviewOpen, setIsMhtReviewOpen] = useState(false);
  // MHT 영역: 기본 접힘, 파일 상태 있으면 자동 펼침 (기능 유지)
  const isMhtExpanded = isMhtOpen || !!mhtStatus || !!pendingMhtData;
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
  const [factoryToast, setFactoryToast] = useState<string | null>(null);
  const [factoryPresets, setFactoryPresets] = useState<FactoryProcessPreset[]>(() => loadAllFactoryPresets());

  // 조사 조건(제품·제조번호·클레임유형) 변경 감지 → 패키지 재구성 안내
  // (마운트 시점을 기준선으로 삼고, 재구성 적용·취소 시 기준선 갱신. 자동 삭제 없음)
  const conditionBaselineRef = useRef<string | null>(null);
  const expectPackageApplyRef = useRef(false);
  const [conditionNoticeVisible, setConditionNoticeVisible] = useState(false);
  const conditionSig = getInvestigationConditionKey(
    report.productInfo.productName,
    report.productInfo.lotNumber,
    `${report.customerClaim.claimType || ""}|${selectedClaimTypes.join(",")}`
  );
  if (conditionBaselineRef.current === null) {
    conditionBaselineRef.current = conditionSig;
  }
  useEffect(() => {
    if (expectPackageApplyRef.current) {
      // 패키지 적용(또는 모달 확인) 후에는 새 조건을 기준선으로 채택
      conditionBaselineRef.current = conditionSig;
      expectPackageApplyRef.current = false;
      setConditionNoticeVisible(false);
      return;
    }
    setConditionNoticeVisible(conditionSig !== conditionBaselineRef.current);
  }, [conditionSig]);

  const handleReassemblePackage = () => {
    expectPackageApplyRef.current = true;
    if (onOpenPackageModal) onOpenPackageModal();
  };
  const handleDismissConditionNotice = () => {
    conditionBaselineRef.current = conditionSig;
    setConditionNoticeVisible(false);
  };
  // 과거 유사 클레임 11대 구조적 유사도 컨텍스트
  const currentClaimContext: CurrentClaimContext = useMemo(() => {
    return {
      productName: report.productInfo.productName,
      productType: report.productInfo.packageType?.includes("PET")
        ? "다류(액상차)"
        : report.productInfo.productName?.includes("차")
        ? "다류(액상차)"
        : "혼합음료",
      claimMajorCategory: report.customerClaim.claimType || selectedClaimTypes[0] || "이물",
      claimMidCategory: selectedClaimTypes.join(", ") || report.customerClaim.claimType || "검은색 이물",
      claimDetailType: report.customerClaim.claimDetails,
      manufactureLine: report.productInfo.manufactureLine || report.productInfo.manufacturer,
      manufacturer: report.productInfo.manufacturer,
      relatedProcess: report.manufacturingProcess.highlightedStep || report.manufacturingProcess.processSteps?.[0],
      foreignMatterFeatures: `${report.analysisResults.visualInspection.foreignObjectAppearance || ""} ${report.analysisResults.visualInspection.sampleCondition || ""}`,
      customerClaimDetails: report.customerClaim.claimDetails,
      lotNumber: report.productInfo.lotNumber,
    };
  }, [
    report.productInfo.productName,
    report.productInfo.packageType,
    report.productInfo.manufactureLine,
    report.productInfo.manufacturer,
    report.productInfo.lotNumber,
    report.customerClaim.claimType,
    report.customerClaim.claimDetails,
    selectedClaimTypes,
    report.manufacturingProcess.highlightedStep,
    report.manufacturingProcess.processSteps,
    report.analysisResults.visualInspection.foreignObjectAppearance,
    report.analysisResults.visualInspection.sampleCondition,
  ]);

  // 과거 유사 사례의 조사방법 안전 적용 핸들러 (원인/결론은 복사하지 않음)
  const handleApplySimilarClaimMethods = (
    options: MethodImportOptions,
    rec: SimilarClaimRecommendation
  ) => {
    const source = rec.pastClaim.report;

    // 1. 과학 분석 항목 활성화 (FT-IR, 광학 현미경 등)
    if (options.enableAnalysisMethods) {
      const updatedAnalysis = { ...report.analysisResults };
      if (!source.analysisResults.ftirAnalysis?.skipped) {
        updatedAnalysis.ftirAnalysis = {
          ...updatedAnalysis.ftirAnalysis,
          skipped: false,
          includePrinciple: true,
          principleText:
            options.applyTestPrinciples && source.analysisResults.ftirAnalysis?.principleText
              ? source.analysisResults.ftirAnalysis.principleText
              : updatedAnalysis.ftirAnalysis.principleText,
        };
      }
      if (!source.analysisResults.opticalMicroscope?.skipped) {
        updatedAnalysis.opticalMicroscope = {
          ...updatedAnalysis.opticalMicroscope,
          skipped: false,
          includePrinciple: true,
          magnification: source.analysisResults.opticalMicroscope?.magnification || "100x",
          principleText:
            options.applyTestPrinciples && source.analysisResults.opticalMicroscope?.principleText
              ? source.analysisResults.opticalMicroscope.principleText
              : updatedAnalysis.opticalMicroscope.principleText,
        };
      }
      if (!source.analysisResults.magnifierInspection?.skipped) {
        updatedAnalysis.magnifierInspection = {
          ...updatedAnalysis.magnifierInspection,
          skipped: false,
          includePrinciple: true,
          magnification: source.analysisResults.magnifierInspection?.magnification || "30x",
        };
      }
      updateAnalysisResults(updatedAnalysis);
    }

    // 2. 공정 중점 관리 기준 적용 (원인 판정은 복사하지 않음)
    if (options.applyProcessCheckpoints) {
      updateManufacturingProcess({
        criticalControlPoint:
          source.manufacturingProcess?.criticalControlPoint ||
          report.manufacturingProcess.criticalControlPoint,
        filtrationAnalysis:
          source.manufacturingProcess?.filtrationAnalysis ||
          report.manufacturingProcess.filtrationAnalysis,
        cleaningAnalysis:
          source.manufacturingProcess?.cleaningAnalysis ||
          report.manufacturingProcess.cleaningAnalysis,
      });
    }

    setFactoryToast(
      `과거 유사 사례(${rec.productName} - ${rec.claimSummary})의 조사방법 및 항목 구성이 적용되었습니다. (원인 및 결론은 복사되지 않음)`
    );
    setTimeout(() => setFactoryToast(null), 3500);
  };

  // 과거 사례에서 조사 구조(항목, 순서, 방법, 공정, 상용구) 가져오기 핸들러
  const handleUseAsInvestigationPackage = (pastReport: ReportData) => {
    if (propOnUseAsInvestigationPackage) {
      propOnUseAsInvestigationPackage(pastReport);
    } else {
      const updated = applyInvestigationStructureToReport(report, pastReport);
      onChange(updated);
      setFactoryToast(
        `'${pastReport.productInfo.productName || pastReport.title || "과거 사례"}'의 조사 구조(항목, 방법, 공정, 상용구)가 적용되었습니다. 실제 결과는 새로 입력해주세요.`
      );
      setTimeout(() => setFactoryToast(null), 4000);
    }
  };

  useEffect(() => {
    const handlePresetsChange = (e: Event) => {
      const customEvt = e as CustomEvent<FactoryProcessPreset[]>;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setFactoryPresets(customEvt.detail);
      } else {
        setFactoryPresets(loadAllFactoryPresets());
      }
    };
    window.addEventListener("factoryPresetsChanged", handlePresetsChange);
    return () => {
      window.removeEventListener("factoryPresetsChanged", handlePresetsChange);
    };
  }, []);

  const applyFactoryPreset = (preset: FactoryProcessPreset) => {
    const updatedProduct = {
      ...report.productInfo,
      manufacturer: preset.name,
      manufacturerType: preset.type,
      factoryId: preset.id,
    };
    const updatedProcess = {
      ...report.manufacturingProcess,
      processFlow: preset.processFlow,
      processSteps: preset.processSteps,
      filtrationAnalysis: preset.filtrationAnalysis,
      cleaningAnalysis: preset.cleaningAnalysis,
      criticalControlPoint: preset.criticalControlPoint,
      // highlightedStep is strictly preserved per user requirements!
    };
    onChange({
      ...report,
      productInfo: updatedProduct,
      manufacturingProcess: updatedProcess,
    });
    setFactoryPresets(loadAllFactoryPresets());
    setFactoryToast(`"${preset.name}" 제조공정도가 공정 검토 탭에 자동 연동되었습니다.`);
    setTimeout(() => setFactoryToast(null), 3500);
  };

  // Photo counts for tabs to provide visual assurance that photos exist
  const customerPhotoCount = (report.customerClaim?.customerPhotos || []).filter(isUserPhoto).length;
  const lotPhotoCount = (report.lotHistory?.retainedSamplePhotos || []).filter(isUserPhoto).length;
  const attPhotoCount = [
    ...(report.attachments?.attachment1Photos || []),
    ...(report.attachments?.attachment2Photos || []),
    ...(report.attachments?.attachment3Photos || []),
  ].filter(isUserPhoto).length;

  const getTabPhotoBadge = (tabId: string) => {
    if (tabId === "claim" && customerPhotoCount > 0) return customerPhotoCount;
    if (tabId === "lot" && lotPhotoCount > 0) return lotPhotoCount;
    if ((tabId === "attach" || tabId === "attachments") && attPhotoCount > 0) return attPhotoCount;
    return 0;
  };

  const handleMhtFileUpload = async (file: File) => {
    try {
      const parsed = await parseMhtFile(file);
      // Open the Review Modal before applying to the report
      setPendingMhtData({
        fileName: file.name,
        parsed,
      });
      setIsMhtReviewOpen(true);
    } catch (err: any) {
      console.error(err);
      setMhtStatus({
        type: "error",
        message: "파일 파싱 중 오류가 발생했습니다. 올바른 .mht 파일인지 확인해 주세요.",
      });
    }
  };

  const handleApplyApprovedMhtData = (
    approvedItems: Record<string, string>,
    rawParsed: ParsedMhtClaimData
  ) => {
    const updatedReport: ReportData = { ...report };

    // Update customerClaim with only user-approved items
    const newClaim = { ...updatedReport.customerClaim };
    if (approvedItems.customerName !== undefined) newClaim.customerName = approvedItems.customerName;
    if (approvedItems.receivedAt !== undefined) newClaim.receivedAt = approvedItems.receivedAt;
    if (approvedItems.channel !== undefined) newClaim.channel = approvedItems.channel;
    if (approvedItems.claimDetails !== undefined) newClaim.claimDetails = approvedItems.claimDetails;
    updatedReport.customerClaim = newClaim;

    // Update productInfo with only user-approved items
    const newProduct = { ...updatedReport.productInfo };
    if (approvedItems.productName !== undefined) newProduct.productName = approvedItems.productName;
    if (approvedItems.expiryDate !== undefined) newProduct.expiryDate = approvedItems.expiryDate;
    if (approvedItems.lotNumber !== undefined) newProduct.lotNumber = approvedItems.lotNumber;
    if (approvedItems.manufacturer !== undefined) newProduct.manufacturer = approvedItems.manufacturer;
    updatedReport.productInfo = newProduct;

    // Metadata (조사는 언제나 식품품질경영팀에서 수행)
    updatedReport.department = "식품품질경영팀";

    // Handle document number if incomingDocNumber is approved or default
    if (approvedItems.incomingDocNumber) {
      const numMatch = approvedItems.incomingDocNumber.match(/\d{4}[-_][A-Za-z0-9]+/);
      if (numMatch) {
        updatedReport.docNumber = `광동 QM ${numMatch[0]}`;
      } else if (!updatedReport.docNumber || updatedReport.docNumber.includes("커뮤니케이션팀")) {
        updatedReport.docNumber = "광동 QM 2026-C04";
      }
    } else if (!updatedReport.docNumber || updatedReport.docNumber.includes("커뮤니케이션팀")) {
      updatedReport.docNumber = "광동 QM 2026-C04";
    }

    // 조사 담당 연구원 및 팀장 보존
    if (!updatedReport.researcherName || updatedReport.researcherName.includes("박병철")) {
      updatedReport.researcherName = "담당 연구원 김진영 대리";
    }
    if (!updatedReport.teamLeader || updatedReport.teamLeader.includes("이정우")) {
      updatedReport.teamLeader = "신준호";
    }

    onChange(updatedReport);

    const approvedCount = Object.keys(approvedItems).length;
    setMhtStatus({
      type: "success",
      message: `사용자 검토 및 승인을 거쳐 MHT 데이터 ${approvedCount}개 항목이 보고서에 안전하게 반영되었습니다.`,
    });
  };

  const updateCustomerClaim = (patch: Partial<ReportData["customerClaim"]>) => {
    onChange({
      ...report,
      customerClaim: { ...report.customerClaim, ...patch },
    });
  };

  const updateProductInfo = (patch: Partial<ReportData["productInfo"]>) => {
    onChange({
      ...report,
      productInfo: { ...report.productInfo, ...patch },
    });
  };

  const updateAnalysisResults = (patch: Partial<ReportData["analysisResults"]>) => {
    onChange({
      ...report,
      analysisResults: { ...report.analysisResults, ...patch },
    });
  };

  const updateManufacturingProcess = (patch: Partial<ReportData["manufacturingProcess"]>) => {
    onChange({
      ...report,
      manufacturingProcess: { ...report.manufacturingProcess, ...patch },
    });
  };

  const updateLotHistory = (patch: Partial<ReportData["lotHistory"]>) => {
    const newLotHistory = { ...report.lotHistory, ...patch };
    const newAttachments =
      patch.retainedSamplePhotos !== undefined
        ? { ...report.attachments, attachment2Photos: patch.retainedSamplePhotos }
        : report.attachments;
    onChange({
      ...report,
      lotHistory: newLotHistory,
      attachments: newAttachments,
    });
  };

  // 5대 조사결과 항목의 현재 고유값(코드)을 안전하게 조회하는 헬퍼
  const getInvestigationValue = (
    key: "manufacturingRecord" | "retainedSample" | "qualityInspection" | "manufacturingProcess" | "rawMaterial"
  ): string => {
    if (key === "manufacturingRecord") {
      const val =
        report.investigationResults?.manufacturingRecordResult ||
        report.manufacturingRecordResult ||
        report.lotHistory?.manufacturingRecordResult ||
        (report.investigationSelections?.manufacturingRecord as string) ||
        "";
      return getChoiceOptionCode("manufacturingRecord", val);
    }
    if (key === "retainedSample") {
      const val =
        report.investigationResults?.storageSampleResult ||
        report.storageSampleResult ||
        report.lotHistory?.storageSampleResult ||
        (report.investigationSelections?.retainedSample as string) ||
        "";
      return getChoiceOptionCode("retainedSample", val);
    }
    if (key === "qualityInspection") {
      const val =
        report.investigationResults?.qualityInspectionResult ||
        report.qualityInspectionResult ||
        report.lotHistory?.qualityInspectionResult ||
        (report.investigationSelections?.qualityInspection as string) ||
        "";
      return getChoiceOptionCode("qualityInspection", val);
    }
    if (key === "manufacturingProcess") {
      const val =
        report.investigationResults?.processInvestigationResult ||
        report.processInvestigationResult ||
        report.manufacturingProcess?.processInvestigationResult ||
        (report.investigationSelections?.manufacturingProcess as string) ||
        "";
      return getChoiceOptionCode("manufacturingProcess", val);
    }
    if (key === "rawMaterial") {
      const val =
        report.investigationResults?.materialInvestigationResult ||
        report.materialInvestigationResult ||
        report.lotHistory?.materialInvestigationResult ||
        (report.investigationSelections?.rawMaterial as string) ||
        "";
      return getChoiceOptionCode("rawMaterial", val);
    }
    return "";
  };

  // 5대 조사결과 버튼 선택 시 고유 코드로 안전하게 저장하는 헬퍼
  const updateInvestigationSelection = (
    key: "manufacturingRecord" | "retainedSample" | "qualityInspection" | "manufacturingProcess" | "rawMaterial",
    codeOrVal: string | string[]
  ) => {
    const rawVal = Array.isArray(codeOrVal) ? codeOrVal[0] || "" : codeOrVal || "";
    const code = getChoiceOptionCode(key, rawVal);

    const fieldMapping: Record<string, keyof InvestigationResultsData> = {
      manufacturingRecord: "manufacturingRecordResult",
      retainedSample: "storageSampleResult",
      qualityInspection: "qualityInspectionResult",
      manufacturingProcess: "processInvestigationResult",
      rawMaterial: "materialInvestigationResult",
    };

    const targetResultField = fieldMapping[key];

    const nextResults: InvestigationResultsData = {
      ...(report.investigationResults || {}),
      ...(targetResultField ? { [targetResultField]: code } : {}),
    };

    const nextSelections: InvestigationItemSelection = {
      ...(report.investigationSelections || {}),
      [key]: code,
    };

    // 현재 저장된 해당 항목의 추가 입력값과 함께 문장 조립
    const itemDetails = (report.investigationDetails?.[key] as Record<string, string | undefined>) || {};
    const assembleResult = code
      ? assembleInvestigationSentence(key, code, itemDetails)
      : { sentence: "", isComplete: false, isExtraInputRequired: false, missingFields: [] };

    // 추가 입력이 필요한데 아직 입력이 비어있는 경우엔 기존 텍스트를 지우지 않음
    const shouldUpdateSentence = assembleResult.isComplete && Boolean(assembleResult.sentence);
    const templateSentence = assembleResult.sentence;

    const nextLotHistory = {
      ...report.lotHistory,
      ...(key === "manufacturingRecord"
        ? {
            manufacturingRecordResult: code,
            ...(shouldUpdateSentence ? { productionLogNote: templateSentence } : {}),
          }
        : {}),
      ...(key === "retainedSample"
        ? {
            storageSampleResult: code,
            ...(shouldUpdateSentence ? { retainedSampleCheck: templateSentence } : {}),
          }
        : {}),
      ...(key === "qualityInspection"
        ? {
            qualityInspectionResult: code,
            ...(shouldUpdateSentence ? { qualityTestRecord: templateSentence } : {}),
          }
        : {}),
      ...(key === "rawMaterial"
        ? {
            materialInvestigationResult: code,
            ...(shouldUpdateSentence ? { rawMaterialCheck: templateSentence } : {}),
          }
        : {}),
    };

    const nextManufacturingProcess = {
      ...report.manufacturingProcess,
      ...(key === "manufacturingProcess"
        ? {
            processInvestigationResult: code,
            ...(shouldUpdateSentence ? { processInvestigationNote: templateSentence } : {}),
          }
        : {}),
    };

    const updated: ReportData = {
      ...report,
      investigationResults: nextResults,
      investigationSelections: nextSelections,
      lotHistory: nextLotHistory,
      manufacturingProcess: nextManufacturingProcess,
      ...(key === "manufacturingRecord" ? { manufacturingRecordResult: code } : {}),
      ...(key === "retainedSample" ? { storageSampleResult: code } : {}),
      ...(key === "qualityInspection" ? { qualityInspectionResult: code } : {}),
      ...(key === "manufacturingProcess" ? { processInvestigationResult: code } : {}),
      ...(key === "rawMaterial" ? { materialInvestigationResult: code } : {}),
    };

    onChange(updated);
  };

  // 5대 조사결과 추가 입력 필드 변경 핸들러
  const updateInvestigationDetailField = (
    key: InvestigationItemKey,
    fieldKey: string,
    fieldValue: string
  ) => {
    const currentItemDetails = (report.investigationDetails?.[key] as Record<string, string | undefined>) || {};
    const updatedItemDetails = {
      ...currentItemDetails,
      [fieldKey]: fieldValue,
    };

    const nextDetails: InvestigationDetailInputs = {
      ...(report.investigationDetails || {}),
      [key]: updatedItemDetails,
    };

    const currentCode = getInvestigationValue(key);
    const assembleResult = assembleInvestigationSentence(key, currentCode, updatedItemDetails);

    let nextLotHistory = { ...report.lotHistory };
    let nextManufacturingProcess = { ...report.manufacturingProcess };

    // 조립이 성공적으로 완성된 경우 해당 섹션의 작성 내용도 실시간 반영
    if (assembleResult.isComplete && assembleResult.sentence) {
      if (key === "manufacturingRecord") {
        nextLotHistory.productionLogNote = assembleResult.sentence;
      } else if (key === "retainedSample") {
        nextLotHistory.retainedSampleCheck = assembleResult.sentence;
      } else if (key === "qualityInspection") {
        nextLotHistory.qualityTestRecord = assembleResult.sentence;
      } else if (key === "rawMaterial") {
        nextLotHistory.rawMaterialCheck = assembleResult.sentence;
      } else if (key === "manufacturingProcess") {
        nextManufacturingProcess.processInvestigationNote = assembleResult.sentence;
        if (
          !nextManufacturingProcess.criticalControlPoint ||
          nextManufacturingProcess.criticalControlPoint.trim() === ""
        ) {
          nextManufacturingProcess.criticalControlPoint = assembleResult.sentence;
        }
      }
    }

    onChange({
      ...report,
      investigationDetails: nextDetails,
      lotHistory: nextLotHistory,
      manufacturingProcess: nextManufacturingProcess,
    });
  };

  // 현재 선택값 및 추가 입력 내용을 종합하여 조사문장 조립 결과를 반환하는 헬퍼
  const getAssembledSentenceResult = (key: InvestigationItemKey) => {
    const currentCode = getInvestigationValue(key);
    const details = report.investigationDetails?.[key] as Record<string, string | undefined> | undefined;
    return assembleInvestigationSentence(key, currentCode, details);
  };

  const updateRootCause = (patch: Partial<ReportData["rootCauseAndActions"]>) => {
    onChange({
      ...report,
      rootCauseAndActions: { ...report.rootCauseAndActions, ...patch },
    });
  };

  const updateConclusion = (patch: Partial<ReportData["conclusion"]>) => {
    onChange({
      ...report,
      conclusion: { ...report.conclusion, ...patch },
    });
  };

  // 탭 연결 사진 조회 (단일 첨부 데이터 참조, 복사본 없음, 레거시 버킷 기본값 적용)
  const getLinkedPhotos = (target: "intake" | "quality") => {
    const buckets = [
      { key: "customerPhotos", list: report.customerClaim?.customerPhotos || [] },
      { key: "retainedSamplePhotos", list: report.lotHistory?.retainedSamplePhotos || [] },
      { key: "attachment1Photos", list: report.attachments?.attachment1Photos || [] },
      { key: "attachment2Photos", list: report.attachments?.attachment2Photos || [] },
      { key: "attachment3Photos", list: report.attachments?.attachment3Photos || [] },
    ] as const;
    const seen = new Set<string>();
    const result: typeof buckets[number]["list"] = [];
    buckets.forEach(({ key, list }) => {
      list.forEach((p) => {
        if (!p || seen.has(p.id)) return;
        if (resolvePhotoLinks(p, key).includes(target)) {
          seen.add(p.id);
          result.push(p);
        }
      });
    });
    return result;
  };

  // Physicochemical test item helpers
  const handleAddPhysicochemicalItem = () => {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ".");
    const newItem: PhysicochemicalItem = {
      id: `pc-${Date.now()}`,
      testDate: today,
      name: "신규 시험 항목",
      unit: "-",
      standard: "기준치 입력",
      controlValue: "-",
      sampleValue: "-",
      judgment: "적합",
      remarks: "출하 시점",
    };
    updateAnalysisResults({
      physicochemicalAnalysis: {
        ...report.analysisResults.physicochemicalAnalysis,
        items: [...report.analysisResults.physicochemicalAnalysis.items, newItem],
      },
    });
  };

  const handleUpdatePhysicochemicalItem = (
    id: string,
    field: keyof PhysicochemicalItem,
    val: any
  ) => {
    const updated = report.analysisResults.physicochemicalAnalysis.items.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    updateAnalysisResults({
      physicochemicalAnalysis: {
        ...report.analysisResults.physicochemicalAnalysis,
        items: updated,
      },
    });
  };

  const handleDeletePhysicochemicalItem = (id: string) => {
    const updated = report.analysisResults.physicochemicalAnalysis.items.filter(
      (item) => item.id !== id
    );
    updateAnalysisResults({
      physicochemicalAnalysis: {
        ...report.analysisResults.physicochemicalAnalysis,
        items: updated,
      },
    });
  };

  // Additional test helpers
  const handleAddCustomAdditionalTest = (newTest: AdditionalTestItem) => {
    updateAnalysisResults({
      additionalTests: [...(report.analysisResults.additionalTests || []), newTest],
    });
  };

  const handleAddAdditionalTest = () => {
    const newTest = {
      id: `add-test-${Date.now()}`,
      title: "추가 정밀 시험 (예: 미생물 배양)",
      result: "해당 검사 결과 상세 내용을 기재하세요.",
      includePrinciple: false,
      principleText: "",
      skipped: false,
    };
    updateAnalysisResults({
      additionalTests: [...(report.analysisResults.additionalTests || []), newTest],
    });
  };

  // Summary points helpers
  const handleAddSummaryPoint = () => {
    updateConclusion({
      summaryPoints: [...(report.conclusion.summaryPoints || []), "조사 결과 요약 항목을 입력하세요."],
    });
  };

  const handleUpdateSummaryPoint = (index: number, val: string) => {
    const updated = [...(report.conclusion.summaryPoints || [])];
    updated[index] = val;
    updateConclusion({ summaryPoints: updated });
  };

  const handleDeleteSummaryPoint = (index: number) => {
    const updated = (report.conclusion.summaryPoints || []).filter((_, i) => i !== index);
    updateConclusion({ summaryPoints: updated });
  };

  // 진행률 체크리스트에서 특정 필드로 포커스 및 스크롤 이동
  const handleNavigateToField = (tabId: string, elementId: string) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-blue-400", "ring-offset-2", "transition-all", "duration-500");
        setTimeout(() => {
          el.classList.remove("ring-4", "ring-blue-400", "ring-offset-2");
        }, 2500);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.focus();
        }
      }
    }, 120);
  };

  // 진행률 체크리스트에서 사용자가 상태 직접 변경 시(해당없음/완료/추가확인 등)
  const handleUpdateItemStatus = (item: ProgressItem, newStatus: ChecklistStatus) => {
    if (newStatus === "해당없음") {
      switch (item.id) {
        case "visual-inspection":
          updateAnalysisResults({ visualInspection: { ...report.analysisResults.visualInspection, skipped: true, status: "해당 없음" } });
          break;
        case "magnifier-inspection":
          updateAnalysisResults({ magnifierInspection: { ...report.analysisResults.magnifierInspection, skipped: true, status: "해당 없음" } });
          break;
        case "microscope-inspection":
          updateAnalysisResults({ opticalMicroscope: { ...report.analysisResults.opticalMicroscope, skipped: true, status: "해당 없음" } });
          break;
        case "ftir-analysis":
          updateAnalysisResults({ ftirAnalysis: { ...report.analysisResults.ftirAnalysis, skipped: true, status: "해당 없음" } });
          break;
        case "xrf-analysis":
          updateAnalysisResults({ xrfAnalysis: { ...report.analysisResults.xrfAnalysis, skipped: true, status: "해당 없음" } });
          break;
        case "physicochemical-analysis":
          updateAnalysisResults({ physicochemicalAnalysis: { ...report.analysisResults.physicochemicalAnalysis, skipped: true, status: "해당 없음" } });
          break;
        case "catalase-test":
          updateAnalysisResults({ catalaseTest: { ...report.analysisResults.catalaseTest, skipped: true, status: "해당 없음" } });
          break;
        case "process-filtration":
          updateManufacturingProcess({ filtrationStatus: "해당 없음" });
          break;
        case "process-cleaning":
          updateManufacturingProcess({ cleaningStatus: "해당 없음" });
          break;
        case "process-ccp":
          updateManufacturingProcess({ ccpStatus: "해당 없음" });
          break;
        case "lot-production-log":
          updateLotHistory({ productionLogStatus: "해당 없음" });
          break;
        case "lot-quality-test":
          updateLotHistory({ qualityTestStatus: "해당 없음" });
          break;
        case "lot-retained-sample":
          updateLotHistory({ retainedSampleStatus: "해당 없음" });
          break;
        case "cause-root":
          updateRootCause({ status: "해당 없음" });
          break;
        case "cause-actions":
          updateRootCause({ preventiveMeasuresSkipped: true });
          break;
      }
      return;
    }

    const targetInvStatus: InvestigationStatus =
      newStatus === "완료"
        ? "확인 완료"
        : newStatus === "추가확인필요"
        ? "추가 조사 필요"
        : "미실시";

    switch (item.id) {
      case "visual-inspection":
        updateAnalysisResults({ visualInspection: { ...report.analysisResults.visualInspection, skipped: false, status: targetInvStatus } });
        break;
      case "magnifier-inspection":
        updateAnalysisResults({ magnifierInspection: { ...report.analysisResults.magnifierInspection, skipped: false, status: targetInvStatus } });
        break;
      case "microscope-inspection":
        updateAnalysisResults({ opticalMicroscope: { ...report.analysisResults.opticalMicroscope, skipped: false, status: targetInvStatus } });
        break;
      case "ftir-analysis":
        updateAnalysisResults({ ftirAnalysis: { ...report.analysisResults.ftirAnalysis, skipped: false, status: targetInvStatus } });
        break;
      case "xrf-analysis":
        updateAnalysisResults({ xrfAnalysis: { ...report.analysisResults.xrfAnalysis, skipped: false, status: targetInvStatus } });
        break;
      case "physicochemical-analysis":
        updateAnalysisResults({ physicochemicalAnalysis: { ...report.analysisResults.physicochemicalAnalysis, skipped: false, status: targetInvStatus } });
        break;
      case "catalase-test":
        updateAnalysisResults({ catalaseTest: { ...report.analysisResults.catalaseTest, skipped: false, status: targetInvStatus } });
        break;
      case "process-filtration":
        updateManufacturingProcess({ skipped: false, filtrationStatus: targetInvStatus });
        break;
      case "process-cleaning":
        updateManufacturingProcess({ skipped: false, cleaningStatus: targetInvStatus });
        break;
      case "process-ccp":
        updateManufacturingProcess({ skipped: false, ccpStatus: targetInvStatus });
        break;
      case "lot-production-log":
        updateLotHistory({ skipped: false, productionLogStatus: targetInvStatus });
        break;
      case "lot-quality-test":
        updateLotHistory({ skipped: false, qualityTestStatus: targetInvStatus });
        break;
      case "lot-retained-sample":
        updateLotHistory({ skipped: false, retainedSampleStatus: targetInvStatus });
        break;
      case "cause-root":
        updateRootCause({ skipped: false, status: targetInvStatus });
        break;
      case "cause-actions":
        updateRootCause({ preventiveMeasuresSkipped: false });
        break;
    }
  };

  // 3단계 업무 흐름 스텝 정의 (접수/현품 → 품질 조사 → 보고서/회신)
  const WORKFLOW_STEPS = [
    {
      id: "intake",
      label: "STEP 1. 접수 / 기본정보 / 현품",
      shortLabel: "1. 접수/현품",
      desc: "접수·제품·현품 확보",
      icon: User,
    },
    {
      id: "investigate",
      label: "STEP 2. 품질 조사",
      shortLabel: "2. 품질 조사",
      desc: "분석·공정·Lot·원인 검토",
      icon: Microscope,
    },
    {
      id: "review",
      label: "STEP 3. 보고서 검토 / 회신",
      shortLabel: "3. 보고서/회신",
      desc: "결론·첨부·검토·회신",
      icon: FileCheck,
    },
  ];

  // 활성 탭 정규화 (레거시 탭 ID 유지: 기존 저장·검증·네비게이션 호환)
  const getNormalizedStep = (tabId: string): string => {
    if (tabId === "claim" || tabId === "product" || tabId === "basic" || tabId === "intake") return "intake";
    if (
      tabId === "analysis" ||
      tabId === "process" ||
      tabId === "lot" ||
      tabId === "investigation" ||
      tabId === "cause" ||
      tabId === "investigate"
    )
      return "investigate";
    if (tabId === "conclusion" || tabId === "attachments" || tabId === "review") return "review";
    return "intake";
  };

  const currentStep = getNormalizedStep(activeTab);
  const reportProgress = calculateReportProgress(report);

  // 스텝별 필수 미완료 통계 산출 (progressTracker sectionKey는 그대로 사용)
  const stepStats = {
    intake: {
      unwritten: reportProgress.sections
        .filter((s) => s.sectionKey === "basic")
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
    investigate: {
      unwritten: reportProgress.sections
        .filter(
          (s) =>
            s.sectionKey === "analysis" ||
            s.sectionKey === "process" ||
            s.sectionKey === "lot" ||
            s.sectionKey === "cause"
        )
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
    review: {
      unwritten: reportProgress.sections
        .filter((s) => s.sectionKey === "conclusion")
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
  };

  // 검증 이슈의 레거시 탭 ID → 3단계 매핑 (Progress Indicator 상태 표시용)
  const getStepOfValidationTab = (tabId: string): "intake" | "investigate" | "review" => {
    if (tabId === "claim" || tabId === "product") return "intake";
    if (tabId === "analysis" || tabId === "process" || tabId === "lot" || tabId === "cause")
      return "investigate";
    return "review";
  };

  const getStepValidationIssues = (stepId: "intake" | "investigate" | "review") => {
    const stepIssues = validationSummary.issues.filter((i) => getStepOfValidationTab(i.tabId) === stepId);
    const hasError = stepIssues.some((i) => i.severity === "error");
    const hasWarning = stepIssues.some((i) => i.severity === "warning");
    return { count: stepIssues.length, hasError, hasWarning };
  };

  const getStepPhotoBadge = (stepId: string) => {
    if (stepId === "intake") {
      return (report.customerClaim.customerPhotos || []).filter(isUserPhoto).length;
    }
    if (stepId === "investigate") {
      return (report.lotHistory.retainedSamplePhotos || []).filter(isUserPhoto).length;
    }
    if (stepId === "review") {
      return (
        (report.attachments.attachment1Photos || []).filter(isUserPhoto).length +
        (report.attachments.attachment2Photos || []).filter(isUserPhoto).length +
        (report.attachments.attachment3Photos || []).filter(isUserPhoto).length
      );
    }
    return 0;
  };

  const allPresets = getAllPresets();

  const handleSelectPreset = (preset: ClaimPreset) => {
    setSelectedPresetId(preset.id);
    // Auto-detect and sync claim type from preset
    const mappedType = mapPresetSubCategoryToClaimType(preset.subCategory);
    if (mappedType) {
      setSelectedClaimTypes([mappedType]);
    }
    onChange(mergePresetData(report, preset.data));
  };

  const unexaminedItems = getUnexaminedInvestigationItems(report);
  const validationSummary = validateReport(report);

  // Analysis items visibility based on selected claim types and user-entered content
  const analysisVisibility = getAnalysisItemVisibility(
    selectedClaimTypes,
    report.analysisResults,
    showAllAnalysisItems
  );

  const getTabValidationIssues = (tabId: string) => {
    const tabIssues = validationSummary.issues.filter((i) => i.tabId === tabId);
    const hasError = tabIssues.some((i) => i.severity === "error");
    const hasWarning = tabIssues.some((i) => i.severity === "warning");
    return { count: tabIssues.length, hasError, hasWarning };
  };

  const currentPresetTitle = allPresets.find((p) => p.id === selectedPresetId)?.name;

  // 필수 필드 미작성 시 은은한 붉은 테두리 강조 헬퍼
  const getRequiredFieldClass = (val: string | undefined | null) => {
    const isEmpty = !val || !val.trim();
    return isEmpty
      ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
      : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100";
  };

  // 해당없음(skipped) 처리된 조사 섹션 컨테이너 스타일 헬퍼 (회색 처리로 시선 분산 방지)
  const getSectionContainerClass = (skipped: boolean) => {
    if (skipped) {
      return "p-3 bg-slate-100/60 border border-dashed border-slate-300 rounded-xl opacity-50 transition-all select-none";
    }
    return "p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition-all";
  };

  // [다음 필수 입력 →] 스마트 네비게이션 액션 산출
  const nextRequiredAction = getNextRequiredAction(report, currentStep as WorkflowStepId, activeTab);

  const handleNextRequiredNavigation = () => {
    // 1. 현재 입력값 자동 저장 (중요 조건 준수: 다음 단계로 이동 전 현재 입력값 저장)
    onChange({ ...report });

    // 2. 모든 필수 항목이 완료된 경우 -> [최종 검토 →] (STEP 3 보고서 검토)
    if (nextRequiredAction.isAllCompleted || nextRequiredAction.type === "final_review") {
      if (onOpenValidation) {
        onOpenValidation();
      } else {
        setActiveTab("review");
      }
      return;
    }

    // 3. 대상 스텝이 현재 스텝과 다르면 탭 전환
    if (nextRequiredAction.targetStep !== currentStep) {
      setActiveTab(nextRequiredAction.targetStep);
    }

    // 4. 대상 입력 위치로 자동 이동 & 포커스 & 시각적 하이라이트
    if (nextRequiredAction.targetElementId) {
      setTimeout(() => {
        const el = document.getElementById(nextRequiredAction.targetElementId!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });

          // 입력창인 경우 포커스
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.focus({ preventScroll: true });
          } else {
            const inputChild = el.querySelector("input, textarea, button");
            if (inputChild instanceof HTMLElement) {
              inputChild.focus({ preventScroll: true });
            }
          }

          // 파란색 펄스 링 강조 효과로 시선 집중 (1.8초 후 복구)
          el.classList.add("ring-4", "ring-blue-500/60", "ring-offset-2", "transition-all");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-blue-500/60", "ring-offset-2", "transition-all");
          }, 1800);
        }
      }, 100);
    }
  };

  // 이전 단계 이동 핸들러 (입력값 유지: onChange로 현재값 저장 후 이동, 차단 없음)
  const handlePreviousStep = () => {
    onChange({ ...report });
    const stepOrder: WorkflowStepId[] = ["intake", "investigate", "review"];
    const currentIdx = stepOrder.indexOf(currentStep as WorkflowStepId);
    if (currentIdx > 0) {
      setActiveTab(stepOrder[currentIdx - 1]);
    }
  };

  // 다음 단계 이동 핸들러 (입력값 유지: 저장 후 이동, 미작성 있어도 차단하지 않고 안내만)
  const handleNextStep = () => {
    onChange({ ...report });
    const stepOrder: WorkflowStepId[] = ["intake", "investigate", "review"];
    const currentIdx = stepOrder.indexOf(currentStep as WorkflowStepId);
    if (currentIdx >= 0 && currentIdx < stepOrder.length - 1) {
      setActiveTab(stepOrder[currentIdx + 1]);
    }
  };

  // STEP 이동 시 입력값 보존 안내 (차단 없이 부족 항목만 토스트 안내)
  const handleStepButtonClick = (stepId: string) => {
    onChange({ ...report });
    setActiveTab(stepId);
  };

  // 다른 STEP의 특정 필드로 점프 (입력값 저장 후 이동·스크롤·강조, 차단 없음)
  const handleJumpToStepField = (stepId: string, fieldId?: string) => {
    onChange({ ...report });
    setActiveTab(stepId);
    if (fieldId) {
      setTimeout(() => {
        const el = document.getElementById(fieldId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-blue-400", "ring-offset-2", "transition-all", "duration-300");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-blue-400", "ring-offset-2");
          }, 2500);
        }
      }, 150);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* ======================================================== */}
      {/* [1열] 상단 3단계 Progress Indicator & 진행률 & 사전 검증 (항상 노출) */}
      {/* ① 접수/현품 → ② 품질 조사 → ③ 보고서/회신 (미작성 있어도 이동 차단 없음) */}
      {/* ======================================================== */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs">
        {/* 데스크톱/태블릿: 3단계 스텝 바 (균등 3분할 + 진행 화살표) */}
        <div className="hidden sm:flex items-stretch gap-1 flex-1 max-w-3xl">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const unwritten = stepStats[step.id as keyof typeof stepStats]?.unwritten ?? 0;
            const photoCount = getStepPhotoBadge(step.id);
            const stepIssues = getStepValidationIssues(step.id as "intake" | "investigate" | "review");
            const isCompleted = unwritten === 0 && !stepIssues.hasError;
            const isLast = idx === WORKFLOW_STEPS.length - 1;

            return (
              <div key={step.id} className="flex items-stretch gap-1 flex-1">
                <button
                  type="button"
                  id={`step-btn-${step.id}`}
                  onClick={() => handleStepButtonClick(step.id)}
                  className={`relative flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/20"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title={`${step.label}${unwritten > 0 ? ` (미작성 ${unwritten}건)` : ""}${
                    stepIssues.hasError ? ` (오류 ${stepIssues.count}건)` : ""
                  } — 클릭 시 입력값 유지하고 이동합니다`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : stepIssues.hasError
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold truncate">
                          {step.shortLabel}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] block truncate ${
                          isActive ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {step.desc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    {stepIssues.hasError ? (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white"
                        title={`검증 오류 ${stepIssues.count}건 — 클릭해도 이동 가능, STEP 3 검토 허브에서 확인`}
                      >
                        !{stepIssues.count}
                      </span>
                    ) : isCompleted ? (
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isActive ? "bg-white text-blue-700" : "bg-emerald-500 text-white"
                        }`}
                        title="필수 항목 작성 완료"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                        title={`미작성 필수 항목 ${unwritten}건 — 클릭해도 이동 가능`}
                      >
                        {unwritten}
                      </span>
                    )}
                    {photoCount > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isActive ? "bg-blue-800 text-blue-100" : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        📷{photoCount}
                      </span>
                    )}
                  </div>
                </button>
                {!isLast && (
                  <div className="flex items-center shrink-0 px-0.5" aria-hidden="true">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 모바일: 드롭다운 셀렉터 형태 */}
        <div className="sm:hidden flex items-center gap-2">
          <select
            value={currentStep}
            onChange={(e) => setActiveTab(e.target.value)}
            className="flex-1 text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-900"
          >
            {WORKFLOW_STEPS.map((s, i) => (
              <option key={s.id} value={s.id}>
                Step {i + 1}. {s.shortLabel} ({stepStats[s.id as keyof typeof stepStats]?.unwritten === 0 ? "✓ 완료" : `미작성 ${stepStats[s.id as keyof typeof stepStats]?.unwritten}건`})
              </option>
            ))}
          </select>
        </div>

        {/* 우측: 진행률 미니 표시 & 체크리스트 보기 & 보고서 사전 검증 */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsChecklistModalOpen(true)}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-xs text-slate-800 shadow-2xs group"
            title="상세 체크리스트 및 필드 바로가기 팝업"
          >
            <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
              {reportProgress.overallPercentage}%
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-[11px] font-bold text-slate-800">
                진행률 {reportProgress.overallPercentage}%
              </span>
            </div>
            <span className="text-blue-600 font-bold text-[11px] flex items-center gap-0.5">
              <span>체크리스트</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
            </span>
          </button>

          {/* Audit Validation Button */}
          {onOpenValidation && (
            <button
              type="button"
              id="btn-open-report-validation"
              onClick={onOpenValidation}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                validationSummary.errorCount > 0
                  ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 animate-pulse"
                  : validationSummary.warningCount > 0
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
              title="보고서 발송 전 누락 항목 및 논리 모순 자동 검증"
            >
              {validationSummary.errorCount > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden xl:inline">사전 검증</span>
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
          )}

          {/* 상단 [다음 필수 입력 →] 빠른 이동 버튼 */}
          <button
            type="button"
            id="btn-top-next-required"
            onClick={handleNextRequiredNavigation}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 ${
              nextRequiredAction.isAllCompleted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300/60"
                : "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300/60"
            }`}
            title={
              nextRequiredAction.isAllCompleted
                ? "모든 필수 항목이 완료되었습니다. 최종 보고서 사전 검증으로 이동합니다."
                : `다음에 작성해야 할 필수 항목('${nextRequiredAction.actionLabel}')으로 자동 이동합니다.`
            }
          >
            {nextRequiredAction.isAllCompleted ? (
              <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-blue-100" />
            )}
            <span>{nextRequiredAction.buttonText}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* [2열] 클레임 유형 및 프리셋 스마트 아코디언 바 (평상시 1줄 슬림) */}
      {/* ======================================================== */}
      <div className="shrink-0 bg-slate-50/90 border-b border-slate-200 text-xs transition-all">
        {/* 평상시: 1줄 컴팩트 요약 뱃지 */}
        <div className="px-3.5 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>설정 상태:</span>
            </span>

            {/* 클레임 유형 뱃지 */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/70 border border-blue-200 text-blue-900 font-semibold text-[10px]">
              <span className="text-blue-600">유형:</span>
              <span className="font-bold">
                {selectedClaimTypes.length > 0
                  ? selectedClaimTypes.join(", ")
                  : "선택 안 됨 (전체)"}
              </span>
              {selectedClaimTypes.length > 1 && (
                <span className="text-[9px] bg-blue-200 text-blue-800 rounded px-1 font-bold">
                  +{selectedClaimTypes.length}
                </span>
              )}
            </div>

            {/* 프리셋 뱃지 */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-[10px]">
              <span className="text-emerald-600">프리셋:</span>
              <span className="font-bold truncate max-w-[180px] sm:max-w-xs">
                {currentPresetTitle || (usePreset ? "프리셋 미선택" : "직접 작성 모드")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 ${
              isConfigDrawerOpen
                ? "bg-slate-800 text-white"
                : "bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-300 shadow-2xs"
            }`}
          >
            <span>{isConfigDrawerOpen ? "설정 접기 ▴" : "유형·프리셋 변경 ▾"}</span>
          </button>
        </div>

        {/* 펼침 상태: 아코디언 드로어 */}
        {isConfigDrawerOpen && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-4 shadow-inner animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  클레임 유형 및 표준 프리셋 템플릿 설정
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigDrawerOpen(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
              >
                설정 완료 (접기) ▴
              </button>
            </div>

            {/* 1. 클레임 유형 선택 바 */}
            <ClaimTypeFilterBar
              selectedTypes={selectedClaimTypes}
              onChangeSelectedTypes={setSelectedClaimTypes}
              showAllItems={showAllAnalysisItems}
              onToggleShowAll={setShowAllAnalysisItems}
              report={report}
              onAddAdditionalTest={handleAddCustomAdditionalTest}
            />

            {/* 2. 프리셋 선택 바 */}
            <PresetSelectorBar
              presets={allPresets}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onClearPreset={() => setSelectedPresetId(null)}
              onOpenPresetManager={onOpenPresetManager}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* [3열] 미실시 항목 경고 배너 (1줄 알림 띠 형태) */}
      {/* ======================================================== */}
      {unexaminedItems.length > 0 && (
        <div
          id="form-unexamined-warning-banner"
          className="shrink-0 bg-amber-50/90 border-b border-amber-300 px-4 py-2 text-xs text-amber-950 transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-600 text-white shrink-0">
                주의
              </span>
              <span className="truncate">
                조사 미실시 / 미입력 항목 {unexaminedItems.length}건 감지 (자동 생성 억제 보호 중)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsUnexaminedWarningExpanded(!isUnexaminedWarningExpanded)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 shrink-0"
            >
              <span>{isUnexaminedWarningExpanded ? "접기 ▴" : "항목 보기 ▾"}</span>
            </button>
          </div>

          {/* 펼침 시 세부 항목 태그 목록 */}
          {isUnexaminedWarningExpanded && (
            <div className="mt-2.5 pt-2 border-t border-amber-200/80 space-y-2 animate-in fade-in duration-100">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                조사하지 않은 항목이 이메일·보고서·소비자 안내에 임의로 “이상 없음”, “안전함”, “외적 요인” 등으로 자동 기재되지 않도록 보호하고 있습니다. 아래 항목을 클릭하여 상태를 선택하거나 조사 결과를 입력해 주세요.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {unexaminedItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (item.section === "정밀 과학 분석") setActiveTab("investigation");
                      else if (item.section === "동일 Lot 이력") setActiveTab("investigation");
                      else if (item.section === "원인 판정 및 재발방지") setActiveTab("cause");
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[11px] text-amber-900 transition-colors shadow-2xs"
                    title={`${item.section}으로 이동`}
                  >
                    <span className="text-slate-500 font-semibold">{item.section}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-800">{item.itemName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                      {item.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* 조사 진행률 및 항목 체크리스트 전용 모달 */}
        <InvestigationProgressTracker
          report={report}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigateToField={handleNavigateToField}
          onUpdateStatus={handleUpdateItemStatus}
          isModalOpen={isChecklistModalOpen}
          onCloseModal={() => setIsChecklistModalOpen(false)}
        />

        {/* 조사 패키지 자동 구성 Quick-Start Banner */}
        {onOpenPackageModal && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-300 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    신규 클레임 조사 패키지 자동 구성
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                    핵심 기능
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  제품 + 제조번호 + 클레임 유형을 입력하면 Master 기준정보와 8대 조사 항목을 실시간 자동 구성합니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-form-open-package-modal"
              onClick={onOpenPackageModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 border border-amber-400 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>조사 패키지 자동 구성 시작 ➜</span>
            </button>
          </div>
        )}

        {/* 조사 조건 변경 시 패키지 재구성 안내 (직접 입력 결과·사진은 건드리지 않음) */}
        {conditionNoticeVisible && onOpenPackageModal && (
          <div className="p-3 bg-blue-50 border border-blue-300 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block">
                  조사 조건(제품·제조번호·클레임 유형)이 변경되었습니다. 조사 패키지를 다시 구성하시겠습니까?
                </span>
                <span className="text-[11px] text-slate-500 block">
                  직접 입력한 조사 결과·측정값·원인·사진·첨부자료는 유지됩니다.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDismissConditionNotice}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                id="btn-form-reassemble-package"
                onClick={handleReassemblePackage}
                className="px-3 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 border border-amber-400 rounded-xl transition-all cursor-pointer"
              >
                다시 구성
              </button>
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* [Step 1] 기본정보 (1. 클레임 접수 + 2. 대상 제품 정보 통합) */}
        {/* ======================================================== */}
        {(currentStep === "intake" || activeTab === "claim" || activeTab === "product" || activeTab === "basic") && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* [복사 이력 추적 안내 배너 - 소비자용 보고서에는 미표시, 내부 관리용] */}
            {report.copiedFromClaimId && (
              <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-slate-50 border border-indigo-200/90 rounded-2xl shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        이 클레임은 <span className="text-indigo-800 font-mono font-black underline decoration-indigo-300">{report.copiedFromDocNumber || report.copiedFromClaimId}</span>를 기반으로 생성됨
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        내부 이력 연계
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      기존 클레임의 제품 정보·조사 템플릿·공정 설명이 자동 적용되었으며, 제조번호 및 실제 분석 결과는 신규 작성 상태입니다. (소비자용 정식 보고서에는 인쇄되지 않습니다)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 섹션 1. 클레임 접수 및 고객 정보 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">클레임 접수 및 고객 정보</h3>
                </div>
                {/* 과거클레임 진입 통합: 섹션 헤더 중복 버튼 제거 → 하단 자동추천카드 + 품질 지식센터로 일원화 (hidden) */}
                <div className="hidden">
                  <button
                    type="button"
                    id="btn-load-past-claims"
                    onClick={handleOpenPastClaims}
                    title="과거에 접수된 유사 클레임 이력을 검색하고 상세 내용을 확인합니다."
                  >
                    <span>이전 클레임 불러오기</span>
                  </button>
                  <span className="text-xs text-slate-400 hidden sm:inline">불만 인입 경위 및 고객 정보 기재</span>
                </div>
              </div>

            {/* 클레임 유형 맞춤 설정 및 표준 프리셋 (기본 접힘: [유형·프리셋 설정 ▾] 클릭 시 펼침) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80 transition-all">
              <div className="px-3.5 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 shrink-0">
                    클레임 맞춤 유형 및 표준 프리셋
                  </span>
                  <span className="text-[11px] text-slate-500 truncate hidden md:inline">
                    (선택 유형: <strong className="text-slate-700">{selectedClaimTypes.join(", ")}</strong> / 프리셋: <strong className="text-slate-700">{currentPresetTitle || (usePreset ? "미선택" : "직접 작성")}</strong>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStep1TypePresetOpen(!isStep1TypePresetOpen)}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                    isStep1TypePresetOpen
                      ? "bg-slate-800 text-white"
                      : "bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                  }`}
                >
                  <span>{isStep1TypePresetOpen ? "설정 닫기 ▴" : "유형·프리셋 설정 ▾"}</span>
                </button>
              </div>

              {isStep1TypePresetOpen && (
                <div className="p-3.5 bg-white border-t border-slate-200 space-y-3.5 animate-in fade-in duration-150">
                  {/* 클레임 유형 선택 바 (복수 선택 가능 & 조사 항목 연동) */}
                  <ClaimTypeFilterBar
                    selectedTypes={selectedClaimTypes}
                    onChangeSelectedTypes={setSelectedClaimTypes}
                    showAllItems={showAllAnalysisItems}
                    onToggleShowAll={setShowAllAnalysisItems}
                    report={report}
                    onAddAdditionalTest={handleAddCustomAdditionalTest}
                  />

                  {/* 클레임 유형 프리셋 설정 여부 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>클레임 유형 표준 프리셋</span>
                      </div>

                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setUsePreset(false);
                            setSelectedPresetId(null);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                            !usePreset
                              ? "bg-slate-700 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          직접 작성
                        </button>
                        <button
                          type="button"
                          onClick={() => setUsePreset(true)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                            usePreset
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          프리셋 선택
                        </button>
                      </div>
                    </div>

                    {/* Yes일 경우 관련 프리셋 선택 및 관리 UI */}
                    {usePreset && (
                      <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                        <PresetSelectorBar
                          presets={allPresets}
                          selectedPresetId={selectedPresetId}
                          onSelectPreset={handleSelectPreset}
                          onClearPreset={() => setSelectedPresetId(null)}
                          onOpenPresetManager={onOpenPresetManager}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* [과거 클레임 안내] 진입 통합: 중복 버튼 제거 → 하단 자동추천카드에서 확인 (상세검색은 품질 지식센터 과거사례 탭) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500 leading-tight">
                과거 유사 사례는 아래 <strong className="text-slate-700">자동 추천 카드</strong>에서 확인하세요. 상세 검색은 상단 <strong className="text-slate-700">품질 지식센터 → 과거사례</strong> 탭을 이용하세요.
              </p>
              <button
                type="button"
                id="btn-quick-past-claims"
                onClick={handleOpenPastClaims}
                className="hidden"
              >
                <span>이전 클레임 불러오기</span>
              </button>
            </div>

            {/* [그룹웨어 .mht 파일 자동 입력] 접기식 (기능 유지, 기본 접힘) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingMht(true);
              }}
              onDragLeave={() => setIsDraggingMht(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingMht(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleMhtFileUpload(file);
              }}
              className={`rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                isDraggingMht
                  ? "border-blue-500 bg-blue-50/70"
                  : "border-blue-300 bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/40 hover:border-blue-400"
              }`}
            >
              <button
                type="button"
                onClick={() => setIsMhtOpen(!isMhtOpen)}
                className="w-full p-3 flex items-center justify-between gap-3 text-left cursor-pointer"
                title={isMhtExpanded ? "MHT 자동 입력 접기" : "MHT 자동 입력 펼치기"}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 shadow-xs">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        그룹웨어 클레임 보고서(.mht) 파일 자동 입력
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        원클릭 파싱
                      </span>
                      {mhtStatus && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            mhtStatus.type === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {mhtStatus.type === "success" ? "✓ 파싱 완료" : "파싱 확인 필요"}
                        </span>
                      )}
                      {pendingMhtData && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                          {pendingMhtData.fileName}
                        </span>
                      )}
                    </div>
                    {!isMhtExpanded && (
                      <p className="text-[11px] text-slate-500 truncate">
                        필요할 때 펼쳐서 사용 (접수 사진·제품 정보 자동 입력)
                      </p>
                    )}
                  </div>
                </div>
                {isMhtExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isMhtExpanded && (
              <div className="px-3.5 pb-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      그룹웨어 전자결재에서 전달받은 <strong className="font-semibold text-slate-800">.mht 보고서</strong>를 올리면 소비자명, 제품명, 사용기한, 접수일자, 불만내용 등이 자동으로 채워집니다.
                    </p>
                  </div>
                </div>

                <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>.mht 파일 선택</span>
                  <input
                    type="file"
                    accept=".mht,.mhtml,.html,.htm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMhtFileUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {mhtStatus && (
                <div
                  className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                    mhtStatus.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                      : "bg-red-50 border border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {mhtStatus.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="leading-snug truncate">{mhtStatus.message}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pendingMhtData && (
                      <button
                        type="button"
                        onClick={() => setIsMhtReviewOpen(true)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
                      >
                        추출 결과 다시 검토
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMhtStatus(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              </div>
              )}
            </div>

            {/* 입력 폼 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. 클레임 접수일자 (일시/시간 제외, 날짜만 기입) */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <span>클레임 접수일자</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                  <span className="text-slate-400 font-normal ml-auto">(날짜)</span>
                </label>
                <input
                  id="field-claim-received-at"
                  type="date"
                  value={report.customerClaim.receivedAt ? report.customerClaim.receivedAt.split("T")[0] : ""}
                  onChange={(e) => updateCustomerClaim({ receivedAt: e.target.value })}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none transition-colors ${getRequiredFieldClass(
                    report.customerClaim.receivedAt
                  )}`}
                />
              </div>

              {/* 2. 현품 접수 일자 */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <span>현품 접수 일자</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                  <span className="text-slate-400 font-normal ml-auto">(시료 입고일)</span>
                </label>
                <input
                  id="field-sample-received-date"
                  type="date"
                  value={report.customerClaim.sampleReceivedDate || ""}
                  onChange={(e) => updateCustomerClaim({ sampleReceivedDate: e.target.value })}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none transition-colors ${getRequiredFieldClass(
                    report.customerClaim.sampleReceivedDate
                  )}`}
                />
              </div>

              {/* 3. 제품명 (작성 시 제품 정보 탭에 자동 반영) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <span>제품명 (규격/용량 포함)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      필수
                    </span>
                  </label>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                    제품 정보 연동
                  </span>
                </div>
                <input
                  id="field-claim-product-name"
                  type="text"
                  value={report.productInfo.productName}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    const linked = report.productInfo.productId
                      ? findProductById(report.productInfo.productId)
                      : undefined;
                    updateProductInfo({
                      productName: nextName,
                      // Master 선택 후 텍스트 직접 수정 → 직접 입력 상태로 전환 (ID 해제, 텍스트 유지)
                      ...(linked && linked.productName !== nextName ? { productId: "" } : {}),
                    });
                  }}
                  placeholder="예: 썬키스트 감귤주스 1.5L"
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none font-medium transition-colors ${getRequiredFieldClass(
                    report.productInfo.productName
                  )}`}
                />
              </div>

              {/* 4. 사용기한 / 소비기한 (작성 시 제품 정보 탭에 자동 반영) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <span>사용(소비)기한</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      필수
                    </span>
                  </label>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                    제품 정보 연동
                  </span>
                </div>
                <input
                  id="field-claim-expiry-date"
                  type="text"
                  value={report.productInfo.expiryDate}
                  onChange={(e) => updateProductInfo({ expiryDate: e.target.value })}
                  placeholder="예: 2026.12.31 또는 2026-12-31"
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none font-medium transition-colors ${getRequiredFieldClass(
                    report.productInfo.expiryDate
                  )}`}
                />
              </div>

              {/* 5. 소비자 성명 / 거래처 상호 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <span>소비자 성명 / 거래처 상호</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      필수
                    </span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.customerClaim.maskCustomerName}
                      onChange={(e) =>
                        updateCustomerClaim({ maskCustomerName: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>성명 마스킹 (예: 김*수)</span>
                  </label>
                </div>
                <input
                  id="field-customer-name"
                  type="text"
                  value={report.customerClaim.customerName}
                  onChange={(e) => updateCustomerClaim({ customerName: e.target.value })}
                  placeholder="예: GS25서면경암점 또는 김철수"
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none transition-colors ${getRequiredFieldClass(
                    report.customerClaim.customerName
                  )}`}
                />
              </div>

              {/* 6. 인입 채널 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">인입 채널 / 접수자</label>
                <input
                  id="field-channel"
                  type="text"
                  value={report.customerClaim.channel}
                  onChange={(e) => updateCustomerClaim({ channel: e.target.value })}
                  placeholder="예: 그룹웨어 커뮤니케이션팀 접수, 고객상담센터"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <span>클레임 접수 세부 내용 (인입 경위 및 증상)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <AiPolishButton
                    text={report.customerClaim.claimDetails}
                    fieldName="클레임 접수 내용"
                    onApply={(polished) => updateCustomerClaim({ claimDetails: polished })}
                  />
                </div>
              </div>
              <textarea
                id="field-claim-details"
                rows={4}
                value={report.customerClaim.claimDetails}
                onChange={(e) => updateCustomerClaim({ claimDetails: e.target.value })}
                placeholder="고객이 제품을 구매·개봉하여 문제를 인지하게 된 구체적 경위, 음용/섭취 여부, 위해 증상 유무 등을 상세히 기재하세요."
                className={`w-full text-xs p-3 border rounded-md focus:outline-none leading-relaxed transition-colors ${getRequiredFieldClass(
                  report.customerClaim.claimDetails
                )}`}
              />
            </div>

            <div id="field-customer-photos">
              <p className="block text-xs font-semibold text-slate-700 mb-1.5">
                고객 접수 사진 (보고서/회신에서 연결된 사진 미리보기)
              </p>
              <LinkedPhotoView
                photos={getLinkedPhotos("intake")}
                emptyText="연결된 사진이 없습니다. 3. 보고서/회신 영역에서 사진을 등록하고 이 탭에 연결하세요."
              />
            </div>
            </div>

            {/* 섹션 2. 접수 대상 제품 정보 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">접수 대상 제품 정보</h3>
                </div>
                {/* 제품 선택 단일 진입점: [제품 Master에서 선택] 1곳 유지, 나머지 중복 진입 hidden */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-select-product-master"
                    onClick={() => handleOpenProductMaster(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="제품 마스터에서 등록된 제품을 선택하여 제품명, 포장 형태, 제조라인을 한 번에 입력합니다."
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>제품 Master에서 선택</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenProductMaster(false)}
                    className="hidden"
                    title="제품 Master 관리창 열기 (제품 추가/수정/비활성화)"
                  >
                    <span className="hidden sm:inline">Master 관리</span>
                  </button>
                  <span className="text-xs text-slate-400 hidden lg:inline">제품 라벨 및 생산 이력 식별 번호</span>
                </div>
              </div>

              {/* [제품 마스터 연동 배너] */}
              {matchedProduct ? (
                <div className="p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 truncate">
                          마스터 연동: <strong className="font-mono text-blue-800">[{matchedProduct.productCode}]</strong> {stripInternalPrefix(matchedProduct.productName)}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {matchedProduct.productType}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {matchedProduct.packageType} · {matchedProduct.volume} · {stripInternalPrefix(matchedProduct.manufacturer)} {matchedProduct.manufactureLine ? `· ${stripInternalPrefix(matchedProduct.manufactureLine)}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 기존 클레임에서 이름만 매칭된 경우 1클릭 ID 연결 */}
                    {report.productInfo.productId !== matchedProduct.id && (
                      <button
                        type="button"
                        onClick={() => handleApplyProductFromMaster(matchedProduct)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-all cursor-pointer"
                        title="기존 클레임의 제품명에 해당하는 정식 Product ID를 연결합니다"
                      >
                        마스터 ID 연결
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenProductMaster(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-all cursor-pointer"
                    >
                      제품 변경
                    </button>
                  </div>
                </div>
              ) : report.productInfo.productName ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px]">
                    입력된 제품명: <strong>{stripInternalPrefix(report.productInfo.productName)}</strong> (마스터 미등록 또는 미연결 상태)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenProductMaster(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    제품 Master에서 찾기 또는 신규 등록 →
                  </button>
                </div>
              ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <span>제품명 (규격/용량 포함)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      필수
                    </span>
                    {renderLinkBadge(productLinkState)}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenProductMaster(true)}
                    className="hidden"
                  >
                    <span>Master 검색</span>
                  </button>
                </div>
                <input
                  id="field-product-name"
                  type="text"
                  value={report.productInfo.productName}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    const linked = report.productInfo.productId
                      ? findProductById(report.productInfo.productId)
                      : undefined;
                    updateProductInfo({
                      productName: nextName,
                      // Master 선택 후 텍스트 직접 수정 → 직접 입력 상태로 전환 (ID 해제, 텍스트 유지)
                      ...(linked && linked.productName !== nextName ? { productId: "" } : {}),
                    });
                  }}
                  placeholder="예: 비타500 100ml 또는 제품 Master에서 선택"
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none font-medium transition-colors ${getRequiredFieldClass(
                    report.productInfo.productName
                  )}`}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <span>제조번호 (Lot No.)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                </label>
                <input
                  id="field-lot-number"
                  type="text"
                  value={report.productInfo.lotNumber || ""}
                  onChange={(e) => updateProductInfo({ lotNumber: e.target.value })}
                  placeholder="예: LOT-26A18-F1"
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none font-mono font-semibold text-blue-900 transition-colors ${getRequiredFieldClass(
                    report.productInfo.lotNumber
                  )}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  용기 및 포장 형태
                </label>
                <input
                  id="field-package-type"
                  type="text"
                  value={report.productInfo.packageType}
                  onChange={(e) => updateProductInfo({ packageType: e.target.value })}
                  placeholder="예: 내열 투명 PET (28mm 알루미늄 캡)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <span>제조일자</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                </label>
                <input
                  id="field-manufacture-date"
                  type="date"
                  value={report.productInfo.manufactureDate}
                  onChange={(e) => updateProductInfo({ manufactureDate: e.target.value })}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none transition-colors ${getRequiredFieldClass(
                    report.productInfo.manufactureDate
                  )}`}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <span>소비기한</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                </label>
                <input
                  id="field-expiry-date"
                  type="date"
                  value={report.productInfo.expiryDate}
                  onChange={(e) => updateProductInfo({ expiryDate: e.target.value })}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none transition-colors ${getRequiredFieldClass(
                    report.productInfo.expiryDate
                  )}`}
                />
              </div>

              {/* 제조처 구분 (자사 / 외주) 및 공정도 자동 연동 */}
              <div className="sm:col-span-2 space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800">
                    제조처 구분 및 생산처 선택 (제조공정도 자동 연동)
                  </label>
                  {/* 제조공정 관리 → 품질 지식센터(공정 탭)로 일원화: 조사 화면에서는 선택/조회만 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenProcessManager) {
                        onOpenProcessManager();
                      } else {
                        setIsFactoryModalOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors shadow-2xs"
                    title="제조공정도 관리(추가/수정)는 품질 지식센터 → 제조공정 탭에서 수행합니다"
                  >
                    <Workflow className="w-3.5 h-3.5" />
                    <span>제조공정도 관리 (지식센터)</span>
                  </button>
                </div>

                {factoryToast && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{factoryToast}</span>
                  </div>
                )}

                {/* 자사 vs 외주 구분 라디오 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstInternal = factoryPresets.find((p) => p.type === "internal");
                      if (firstInternal) applyFactoryPreset(firstInternal);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      report.productInfo.manufacturerType === "internal" ||
                      report.productInfo.manufacturer?.includes("식품팀") ||
                      report.productInfo.manufacturer?.includes("건기식팀")
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>자사 생산팀 ({factoryPresets.filter((p) => p.type === "internal").length}개소)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstOem = factoryPresets.find((p) => p.type === "oem");
                      if (firstOem) applyFactoryPreset(firstOem);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      report.productInfo.manufacturerType === "oem" ||
                      (!report.productInfo.manufacturer?.includes("식품팀") &&
                        !report.productInfo.manufacturer?.includes("건기식팀") &&
                        Boolean(report.productInfo.manufacturer))
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Factory className="w-3.5 h-3.5" />
                    <span>외주 OEM 제조처 ({factoryPresets.filter((p) => p.type === "oem").length}개소)</span>
                  </button>
                </div>

                {/* Sub-selector: 자사인 경우 (식품팀 / 건기식팀 등) */}
                {(report.productInfo.manufacturerType === "internal" ||
                  report.productInfo.manufacturer?.includes("식품팀") ||
                  report.productInfo.manufacturer?.includes("건기식팀")) && (
                  <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-900 block">
                      자사 생산팀 선택:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {factoryPresets
                        .filter((p) => p.type === "internal")
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyFactoryPreset(p)}
                            className={`px-3 py-1.5 text-xs rounded-md font-bold transition-all border ${
                              report.productInfo.manufacturer === p.name
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-blue-900 border-blue-200 hover:bg-blue-100/60"
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}

                      <button
                        type="button"
                        onClick={() => {
                          updateProductInfo({
                            manufacturer: "",
                            manufacturerType: "internal",
                            factoryId: "custom-internal",
                          });
                        }}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md"
                      >
                        직접 입력
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-selector: 외주인 경우 (OEM 제조처 목록) */}
                {!(
                  report.productInfo.manufacturerType === "internal" ||
                  report.productInfo.manufacturer?.includes("식품팀") ||
                  report.productInfo.manufacturer?.includes("건기식팀")
                ) && (
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-950">
                        외주 OEM 제조처 선택 (클릭 시 제조공정도 자동 기입):
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {factoryPresets.filter((p) => p.type === "oem").length}개소 공정도 지원
                      </span>
                    </div>

                    {/* Dropdown Selector */}
                    <div className="flex items-center gap-2">
                      <select
                        value={
                          factoryPresets.some((f) => f.name === report.productInfo.manufacturer)
                            ? report.productInfo.manufacturer
                            : "custom"
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            updateProductInfo({
                              manufacturer: "",
                              manufacturerType: "oem",
                              factoryId: "custom-oem",
                            });
                          } else {
                            const p = factoryPresets.find((f) => f.name === val);
                            if (p) applyFactoryPreset(p);
                          }
                        }}
                        className="flex-1 text-xs px-3 py-1.5 bg-white border border-emerald-300 rounded-md text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="" disabled>외주 제조처를 선택하세요</option>
                        {factoryPresets.filter((p) => p.type === "oem").map((f) => (
                          <option key={f.id} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                        <option value="custom">-- 직접 입력 (목록 외 제조처) --</option>
                      </select>
                    </div>

                    {/* OEM Factory Selector Grid (설명 문구 없이 제조처명만 깔끔하게 표시) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-emerald-800 font-semibold block">
                        외주 제조처 목록 (원클릭 시 제조공정도 자동 기입):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                        {factoryPresets.filter((p) => p.type === "oem").map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => applyFactoryPreset(f)}
                            className={`text-xs px-2.5 py-2 rounded-lg border text-center transition-all flex items-center justify-center ${
                              report.productInfo.manufacturer === f.name
                                ? "bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs ring-2 ring-emerald-500/40"
                                : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100/70"
                            }`}
                            title={f.name}
                          >
                            <span className="font-semibold truncate">{f.name}</span>
                          </button>
                        ))}

                        {/* Direct input button */}
                        <button
                          type="button"
                          onClick={() => {
                            updateProductInfo({
                              manufacturer: "",
                              manufacturerType: "oem",
                              factoryId: "custom-oem",
                            });
                          }}
                          className={`text-xs px-2.5 py-2 rounded-lg border text-center transition-all flex items-center justify-center ${
                            !report.productInfo.manufacturer ||
                            !factoryPresets.some((f) => f.name === report.productInfo.manufacturer)
                              ? "bg-slate-800 text-white border-slate-800 font-bold shadow-xs"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <span className="font-semibold">직접 입력</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Manufacturer Text Input */}
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-0.5">
                    <span>최종 표기 제조처명 (공문서 및 보고서 출력용, 직접 수정 가능):</span>
                    {renderLinkBadge(manufacturerLinkState)}
                  </label>
                  <input
                    id="field-manufacturer"
                    type="text"
                    value={report.productInfo.manufacturer}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      const linked = report.productInfo.manufacturerId
                        ? findManufacturerById(report.productInfo.manufacturerId)
                        : undefined;
                      updateProductInfo({
                        manufacturer: nextName,
                        // Master 선택 후 텍스트 직접 수정 → 직접 입력 상태로 전환 (ID 해제, 텍스트 유지)
                        ...(linked && linked.name !== nextName ? { manufacturerId: "" } : {}),
                      });
                    }}
                    placeholder="예: 삼양패키징 광혜원공장 / 광동제약 식품팀 등"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * 위 제조처를 선택하면 조사결과 탭의 <strong>'제조공정 분석(흐름도, 여과망 규격, 세척·살균, 관리점)'</strong> 텍스트가 자동으로 채워집니다. (클레임별 강조 지점은 보존)
                  </p>
                </div>

                {/* 최종 제조라인명 직접 입력 (Master 미등록 라인도 입력 가능, 자동 등록 없음) */}
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-0.5">
                    <span>최종 제조라인명 (직접 수정 가능):</span>
                    {renderLinkBadge(lineLinkState)}
                  </label>
                  <input
                    id="field-manufacture-line"
                    type="text"
                    value={report.productInfo.manufactureLine}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      const linked = report.productInfo.manufactureLineId
                        ? findLineById(report.productInfo.manufactureLineId)
                        : undefined;
                      updateProductInfo({
                        manufactureLine: nextName,
                        // Master 선택 후 텍스트 직접 수정 → 직접 입력 상태로 전환 (ID 해제, 텍스트 유지)
                        ...(linked && linked.lineName !== nextName ? { manufactureLineId: "" } : {}),
                      });
                    }}
                    placeholder="예: A라인 / 환제 라인 / 스틱 파우치 라인 등"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
            </div>

            {/* 과거 유사 클레임 11대 항목 구조적 유사도 자동 추천 카드 */}
            <div id="section-similar-claim-recommendations">
              <SimilarClaimRecommendationCard
                context={currentClaimContext}
                currentReport={report}
                onApplyMethods={handleApplySimilarClaimMethods}
                onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
                onOpenManualSearch={handleOpenPastClaims}
                defaultExpanded={false}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* [Step 2] 조사결과 (정밀 과학 분석 + 제조공정 + 동일 Lot 이력 통합) */}
        {/* ======================================================== */}
        {(currentStep === "investigate" ||
          activeTab === "analysis" ||
          activeTab === "process" ||
          activeTab === "lot" ||
          activeTab === "investigation") && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* 서브 섹션 A. 회수 현품 정밀 과학 분석 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    A
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">회수 현품 과학 정밀 분석</h3>
                    <p className="text-xs text-slate-400">
                      불필요한 항목은 '조사 Skip' 활성화 시 보고서에서 제외되며 번호가 자동 재정렬됩니다.
                    </p>
                  </div>
                </div>
              </div>

            {/* 맞춤 조사 항목 필터: 상단 공용 설정(유형·프리셋 변경)으로 일원화 — Step 내 중복 편집 UI 제거, 상태만 표시 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80 transition-all">
              <div className="px-3.5 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 shrink-0">
                    맞춤 조사 항목 필터 설정
                  </span>
                  <span className="text-[11px] text-slate-500 truncate hidden md:inline">
                    (현재 적용 유형: <strong className="text-slate-700">{selectedClaimTypes.join(", ")}</strong> / {showAllAnalysisItems ? "전체 항목 표시 중" : "유형 맞춤 항목만 표시"} — 변경은 상단 [유형·프리셋 변경]에서)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStep2FilterOpen(!isStep2FilterOpen)}
                  className="hidden"
                >
                  <span>{isStep2FilterOpen ? "필터 접기 ▴" : "항목 필터 설정 ▾"}</span>
                </button>
              </div>

              {false && (
                <div className="p-3.5 bg-white border-t border-slate-200 animate-in fade-in duration-150">
                  <ClaimTypeFilterBar
                    selectedTypes={selectedClaimTypes}
                    onChangeSelectedTypes={setSelectedClaimTypes}
                    showAllItems={showAllAnalysisItems}
                    onToggleShowAll={setShowAllAnalysisItems}
                    report={report}
                    onAddAdditionalTest={handleAddCustomAdditionalTest}
                  />
                </div>
              )}
            </div>

            {/* 1. 현품 확인 결과 */}
            {analysisVisibility.visualInspection?.isVisible && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  report.analysisResults.visualInspection.skipped
                    ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        report.analysisResults.visualInspection.skipped
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      1
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        report.analysisResults.visualInspection.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      현품 육안 확인 결과
                    </h4>
                    {!analysisVisibility.visualInspection.isRequiredByType &&
                      analysisVisibility.visualInspection.hasContent &&
                      !report.analysisResults.visualInspection.skipped && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          기존 작성 내용 보존됨
                        </span>
                      )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.analysisResults.visualInspection.skipped}
                      onChange={(e) =>
                        updateAnalysisResults({
                          visualInspection: {
                            ...report.analysisResults.visualInspection,
                            skipped: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                    />
                    <span
                      className={
                        report.analysisResults.visualInspection.skipped
                          ? "text-slate-400 text-[11px] font-medium"
                          : "text-slate-600"
                      }
                    >
                      조사 Skip (해당 없음)
                    </span>
                  </label>
                </div>

                {!report.analysisResults.visualInspection.skipped ? (
                  <div className="space-y-3">
                    <InvestigationStatusSelector
                      status={report.analysisResults.visualInspection.status}
                      onChange={(st) =>
                        updateAnalysisResults({
                          visualInspection: {
                            ...report.analysisResults.visualInspection,
                            status: st,
                          },
                        })
                      }
                      itemLabel="현품 육안 확인"
                    />

                    {/* 현품 육안확인 상황 기반 자동 추천 상용구 카드 */}
                    <SituationPhraseRecommendationCard
                      context={{
                        claimType: report.customerClaim?.claimType || "이물",
                        investigationItem: "현품",
                        resultType:
                          report.analysisResults.visualInspection.status === "이상 확인"
                            ? "이상 확인"
                            : "이상 없음",
                        usageLocation: "분석 내용",
                        relatedProductType: report.productInfo?.productType || "혼합음료",
                      }}
                      currentValue={report.analysisResults.visualInspection.sampleCondition}
                      onApplySentence={(sentence) =>
                        updateAnalysisResults({
                          visualInspection: {
                            ...report.analysisResults.visualInspection,
                            sampleCondition: sentence,
                          },
                        })
                      }
                      onOpenPhraseManager={onOpenPhraseManager}
                      fieldKey="sampleCondition"
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          외관 성상 및 잔여량 특이사항
                        </label>
                        <PhraseDropdown
                          fieldKey="sampleCondition"
                          currentValue={report.analysisResults.visualInspection.sampleCondition}
                          pastContext={currentClaimContext}
                          activePresetId={selectedPresetId || undefined}
                          situationContext={{
                            claimType: report.customerClaim?.claimType || "이물",
                            investigationItem: "현품",
                            resultType:
                              report.analysisResults.visualInspection.status === "이상 확인"
                                ? "이상 확인"
                                : "이상 없음",
                            usageLocation: "분석 내용",
                            relatedProductType: report.productInfo?.productType || "혼합음료",
                          }}
                          onSelectPhrase={(content) =>
                            updateAnalysisResults({
                              visualInspection: {
                                ...report.analysisResults.visualInspection,
                                sampleCondition: content,
                              },
                            })
                          }
                          onOpenManager={onOpenPhraseManager}
                        />
                      </div>
                      <textarea
                        id="field-visual-sample-condition"
                        rows={2}
                        value={report.analysisResults.visualInspection.sampleCondition}
                        onChange={(e) =>
                          updateAnalysisResults({
                            visualInspection: {
                              ...report.analysisResults.visualInspection,
                              sampleCondition: e.target.value,
                            },
                          })
                        }
                        placeholder="예: 회수된 현품 잔여량 약 120ml 확인됨. 액상 내 직경 약 1.8mm의 흑색 고형물 침전 관찰됨."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <InlinePhraseSuggest
                        fieldKey="sampleCondition"
                        currentText={report.analysisResults.visualInspection.sampleCondition}
                        activePresetId={selectedPresetId || undefined}
                        onInsert={(finalText) =>
                          updateAnalysisResults({
                            visualInspection: {
                              ...report.analysisResults.visualInspection,
                              sampleCondition: finalText,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        이물 외형 관찰 결과 (형상, 색상, 탄성 등)
                      </label>
                      <textarea
                        id="field-visual-foreign-object"
                        rows={2}
                        value={report.analysisResults.visualInspection.foreignObjectAppearance}
                        onChange={(e) =>
                          updateAnalysisResults({
                            visualInspection: {
                              ...report.analysisResults.visualInspection,
                              foreignObjectAppearance: e.target.value,
                            },
                          })
                        }
                        placeholder="예: 흑색 사각형 조각 형태로 유연한 고무 탄성이 느껴지며 기계적 마모 스크래치 흔적 육안 관찰됨."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <TestPrincipleBox
                      methodName="현품 육안 확인"
                      fieldKey="principle_visual"
                      includePrinciple={report.analysisResults.visualInspection.includePrinciple}
                      principleText={report.analysisResults.visualInspection.principleText}
                      activePresetId={selectedPresetId || undefined}
                      onChange={(include, text) =>
                        updateAnalysisResults({
                          visualInspection: {
                            ...report.analysisResults.visualInspection,
                            includePrinciple: include,
                            principleText: text,
                          },
                        })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    [조사 Skip 설정됨] 우측 보고서 및 최종 인쇄물에서 본 항목이 완전히 숨겨집니다.
                  </p>
                )}
              </div>
            )}

            {/* 2. 확대경 조사 결과 (Skip 가능) */}
            {analysisVisibility.magnifierInspection?.isVisible && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  report.analysisResults.magnifierInspection.skipped
                    ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        report.analysisResults.magnifierInspection.skipped
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      2
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        report.analysisResults.magnifierInspection.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      확대경 조사 결과
                    </h4>
                    {!analysisVisibility.magnifierInspection.isRequiredByType &&
                      analysisVisibility.magnifierInspection.hasContent &&
                      !report.analysisResults.magnifierInspection.skipped && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          기존 작성 내용 보존됨
                        </span>
                      )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.analysisResults.magnifierInspection.skipped}
                      onChange={(e) =>
                        updateAnalysisResults({
                          magnifierInspection: {
                            ...report.analysisResults.magnifierInspection,
                            skipped: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                    />
                    <span
                      className={
                        report.analysisResults.magnifierInspection.skipped
                          ? "text-slate-400 text-[11px] font-medium"
                          : "text-slate-600"
                      }
                    >
                      조사 Skip (해당 없음)
                    </span>
                  </label>
                </div>

                {!report.analysisResults.magnifierInspection.skipped ? (
                  <div className="space-y-3">
                    <InvestigationStatusSelector
                      status={report.analysisResults.magnifierInspection.status}
                      onChange={(st) =>
                        updateAnalysisResults({
                          magnifierInspection: {
                            ...report.analysisResults.magnifierInspection,
                            status: st,
                          },
                        })
                      }
                      itemLabel="확대경 조사"
                    />
                    <div className="flex gap-3">
                      <div className="w-36">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          관찰 배율
                        </label>
                        <input
                          type="text"
                          value={report.analysisResults.magnifierInspection.magnification}
                          onChange={(e) =>
                            updateAnalysisResults({
                              magnifierInspection: {
                                ...report.analysisResults.magnifierInspection,
                                magnification: e.target.value,
                              },
                            })
                          }
                          placeholder="예: 20x~40x"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          조사 결과 요약
                        </label>
                        <input
                          id="field-magnifier-result"
                          type="text"
                          value={report.analysisResults.magnifierInspection.result}
                          onChange={(e) =>
                            updateAnalysisResults({
                              magnifierInspection: {
                                ...report.analysisResults.magnifierInspection,
                                result: e.target.value,
                              },
                            })
                          }
                          placeholder="예: 시료 절단면이 물리적 압력에 의해 박리된 전형적인 마모 파단면을 보임."
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <TestPrincipleBox
                      methodName="확대경 조사"
                      fieldKey="principle_magnifier"
                      includePrinciple={report.analysisResults.magnifierInspection.includePrinciple}
                      principleText={report.analysisResults.magnifierInspection.principleText}
                      activePresetId={selectedPresetId || undefined}
                      onChange={(include, text) =>
                        updateAnalysisResults({
                          magnifierInspection: {
                            ...report.analysisResults.magnifierInspection,
                            includePrinciple: include,
                            principleText: text,
                          },
                        })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    [조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
                  </p>
                )}
              </div>
            )}

            {/* 3. 광학 현미경 조사 결과 (Skip 가능) */}
            {analysisVisibility.opticalMicroscope?.isVisible && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  report.analysisResults.opticalMicroscope.skipped
                    ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        report.analysisResults.opticalMicroscope.skipped
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      3
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        report.analysisResults.opticalMicroscope.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      광학 현미경 조사 결과
                    </h4>
                    {!analysisVisibility.opticalMicroscope.isRequiredByType &&
                      analysisVisibility.opticalMicroscope.hasContent &&
                      !report.analysisResults.opticalMicroscope.skipped && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          기존 작성 내용 보존됨
                        </span>
                      )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.analysisResults.opticalMicroscope.skipped}
                      onChange={(e) =>
                        updateAnalysisResults({
                          opticalMicroscope: {
                            ...report.analysisResults.opticalMicroscope,
                            skipped: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                    />
                    <span
                      className={
                        report.analysisResults.opticalMicroscope.skipped
                          ? "text-slate-400 text-[11px] font-medium"
                          : "text-slate-600"
                      }
                    >
                      조사 Skip (해당 없음)
                    </span>
                  </label>
                </div>

                {!report.analysisResults.opticalMicroscope.skipped ? (
                  <div className="space-y-3">
                    <InvestigationStatusSelector
                      status={report.analysisResults.opticalMicroscope.status}
                      onChange={(st) =>
                        updateAnalysisResults({
                          opticalMicroscope: {
                            ...report.analysisResults.opticalMicroscope,
                            status: st,
                          },
                        })
                      }
                      itemLabel="광학 현미경 조사"
                    />
                    <div className="flex gap-3">
                      <div className="w-36">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          관찰 배율
                        </label>
                        <input
                          type="text"
                          value={report.analysisResults.opticalMicroscope.magnification}
                          onChange={(e) =>
                            updateAnalysisResults({
                              opticalMicroscope: {
                                ...report.analysisResults.opticalMicroscope,
                                magnification: e.target.value,
                              },
                            })
                          }
                          placeholder="예: 100x~400x"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          조사 결과 요약
                        </label>
                        <input
                          id="field-microscope-result"
                          type="text"
                          value={report.analysisResults.opticalMicroscope.result}
                          onChange={(e) =>
                            updateAnalysisResults({
                              opticalMicroscope: {
                                ...report.analysisResults.opticalMicroscope,
                                result: e.target.value,
                              },
                            })
                          }
                          placeholder="예: 다공성 고무 조직 구조가 관찰되며, 생물 세포벽이나 균사는 관찰되지 않음."
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <TestPrincipleBox
                      methodName="광학 현미경 분석"
                      fieldKey="principle_microscope"
                      includePrinciple={report.analysisResults.opticalMicroscope.includePrinciple}
                      principleText={report.analysisResults.opticalMicroscope.principleText}
                      activePresetId={selectedPresetId || undefined}
                      onChange={(include, text) =>
                        updateAnalysisResults({
                          opticalMicroscope: {
                            ...report.analysisResults.opticalMicroscope,
                            includePrinciple: include,
                            principleText: text,
                          },
                        })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    [조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
                  </p>
                )}
              </div>
            )}

            {/* 4. FT-IR 분석 결과 (Skip 가능) */}
            {analysisVisibility.ftirAnalysis?.isVisible && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  report.analysisResults.ftirAnalysis.skipped
                    ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        report.analysisResults.ftirAnalysis.skipped
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      4
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        report.analysisResults.ftirAnalysis.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      FT-IR 적외선 분광 분석 결과 (고분자/유기물 성분 규명)
                    </h4>
                    {!analysisVisibility.ftirAnalysis.isRequiredByType &&
                      analysisVisibility.ftirAnalysis.hasContent &&
                      !report.analysisResults.ftirAnalysis.skipped && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          기존 작성 내용 보존됨
                        </span>
                      )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.analysisResults.ftirAnalysis.skipped}
                      onChange={(e) =>
                        updateAnalysisResults({
                          ftirAnalysis: {
                            ...report.analysisResults.ftirAnalysis,
                            skipped: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                    />
                    <span
                      className={
                        report.analysisResults.ftirAnalysis.skipped
                          ? "text-slate-400 text-[11px] font-medium"
                          : "text-slate-600"
                      }
                    >
                      조사 Skip (해당 없음)
                    </span>
                  </label>
                </div>

                {!report.analysisResults.ftirAnalysis.skipped ? (
                  <div className="space-y-3">
                    <InvestigationStatusSelector
                      status={report.analysisResults.ftirAnalysis.status}
                      onChange={(st) =>
                        updateAnalysisResults({
                          ftirAnalysis: {
                            ...report.analysisResults.ftirAnalysis,
                            status: st,
                          },
                        })
                      }
                      itemLabel="FT-IR 적외선 분광분석"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          스펙트럼 매칭 물질명
                        </label>
                        <input
                          type="text"
                          value={report.analysisResults.ftirAnalysis.matchedMaterial}
                          onChange={(e) =>
                            updateAnalysisResults({
                              ftirAnalysis: {
                                ...report.analysisResults.ftirAnalysis,
                                matchedMaterial: e.target.value,
                              },
                            })
                          }
                          placeholder="예: EPDM 합성 고무 (충전기 노즐 패킹)"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          스펙트럼 일치율 (Similarity)
                        </label>
                        <input
                          type="text"
                          value={report.analysisResults.ftirAnalysis.similarity}
                          onChange={(e) =>
                            updateAnalysisResults({
                              ftirAnalysis: {
                                ...report.analysisResults.ftirAnalysis,
                                similarity: e.target.value,
                              },
                            })
                          }
                          placeholder="예: 98.6%"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-blue-900"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          FT-IR 분석 결과 요약
                        </label>
                        <AiPolishButton
                          text={report.analysisResults.ftirAnalysis.summary}
                          fieldName="FT-IR 분석 결과"
                          status={report.analysisResults.ftirAnalysis.status}
                          onApply={(p) =>
                            updateAnalysisResults({
                              ftirAnalysis: {
                                ...report.analysisResults.ftirAnalysis,
                                summary: p,
                              },
                            })
                          }
                        />
                      </div>
                      <textarea
                        id="field-ftir-summary"
                        rows={2}
                        value={report.analysisResults.ftirAnalysis.summary}
                        onChange={(e) =>
                          updateAnalysisResults({
                            ftirAnalysis: {
                              ...report.analysisResults.ftirAnalysis,
                              summary: e.target.value,
                            },
                          })
                        }
                        placeholder="예: 충전기 충진 밸브 내 고무 패킹 표준 스펙트럼과 높은 일치도(98.6%)를 보임."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <TestPrincipleBox
                      methodName="FT-IR 적외선 분광분석"
                      fieldKey="principle_ftir"
                      includePrinciple={report.analysisResults.ftirAnalysis.includePrinciple}
                      principleText={report.analysisResults.ftirAnalysis.principleText}
                      activePresetId={selectedPresetId || undefined}
                      onChange={(include, text) =>
                        updateAnalysisResults({
                          ftirAnalysis: {
                            ...report.analysisResults.ftirAnalysis,
                            includePrinciple: include,
                            principleText: text,
                          },
                        })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    [조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
                  </p>
                )}
              </div>
            )}

            {/* 5. XRF 분석 결과 (Skip 가능) */}
            {analysisVisibility.xrfAnalysis?.isVisible && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  report.analysisResults.xrfAnalysis.skipped
                    ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        report.analysisResults.xrfAnalysis.skipped
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      5
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        report.analysisResults.xrfAnalysis.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      XRF X선 형광 분석 결과 (무기물 및 금속 원소 조성)
                    </h4>
                    {!analysisVisibility.xrfAnalysis.isRequiredByType &&
                      analysisVisibility.xrfAnalysis.hasContent &&
                      !report.analysisResults.xrfAnalysis.skipped && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          기존 작성 내용 보존됨
                        </span>
                      )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.analysisResults.xrfAnalysis.skipped}
                      onChange={(e) =>
                        updateAnalysisResults({
                          xrfAnalysis: {
                            ...report.analysisResults.xrfAnalysis,
                            skipped: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                    />
                    <span
                      className={
                        report.analysisResults.xrfAnalysis.skipped
                          ? "text-slate-400 text-[11px] font-medium"
                          : "text-slate-600"
                      }
                    >
                      조사 Skip (해당 없음)
                    </span>
                  </label>
                </div>

                {!report.analysisResults.xrfAnalysis.skipped ? (
                  <div className="space-y-3">
                    <InvestigationStatusSelector
                      status={report.analysisResults.xrfAnalysis.status}
                      onChange={(st) =>
                        updateAnalysisResults({
                          xrfAnalysis: {
                            ...report.analysisResults.xrfAnalysis,
                            status: st,
                          },
                        })
                      }
                      itemLabel="XRF 형광분석"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        분석 원소 비율 (wt%)
                      </label>
                      <input
                        type="text"
                        value={report.analysisResults.xrfAnalysis.elementsRatio}
                        onChange={(e) =>
                          updateAnalysisResults({
                            xrfAnalysis: {
                              ...report.analysisResults.xrfAnalysis,
                              elementsRatio: e.target.value,
                            },
                          })
                        }
                        placeholder="예: Al 88.5%, Fe 8.2%, Si 2.1%, 기타 미량 원소"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        XRF 분석 결과 요약
                      </label>
                      <textarea
                        id="field-xrf-summary"
                        rows={2}
                        value={report.analysisResults.xrfAnalysis.summary}
                        onChange={(e) =>
                          updateAnalysisResults({
                            xrfAnalysis: {
                              ...report.analysisResults.xrfAnalysis,
                              summary: e.target.value,
                            },
                          })
                        }
                        placeholder="예: 주성분 Al 알루미늄 합금 조성을 보이며 캔 뚜껑 가공 탭 재질과 일치함."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <TestPrincipleBox
                      methodName="XRF 형광분석"
                      fieldKey="principle_xrf"
                      includePrinciple={report.analysisResults.xrfAnalysis.includePrinciple}
                      principleText={report.analysisResults.xrfAnalysis.principleText}
                      activePresetId={selectedPresetId || undefined}
                      onChange={(include, text) =>
                        updateAnalysisResults({
                          xrfAnalysis: {
                            ...report.analysisResults.xrfAnalysis,
                            includePrinciple: include,
                            principleText: text,
                          },
                        })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    [조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
                  </p>
                )}
              </div>
            )}

            {/* 6. 이화학 분석 결과 (테이블, Skip 가능) */}
            {analysisVisibility.physicochemicalAnalysis?.isVisible && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  report.analysisResults.physicochemicalAnalysis.skipped
                    ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                    : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        report.analysisResults.physicochemicalAnalysis.skipped
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      6
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        report.analysisResults.physicochemicalAnalysis.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      이화학 분석 결과 (현품 vs 정상 보관품 비교 테이블)
                    </h4>
                    {!analysisVisibility.physicochemicalAnalysis.isRequiredByType &&
                      analysisVisibility.physicochemicalAnalysis.hasContent &&
                      !report.analysisResults.physicochemicalAnalysis.skipped && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          기존 작성 내용 보존됨
                        </span>
                      )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={report.analysisResults.physicochemicalAnalysis.skipped}
                      onChange={(e) =>
                        updateAnalysisResults({
                          physicochemicalAnalysis: {
                            ...report.analysisResults.physicochemicalAnalysis,
                            skipped: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                    />
                    <span
                      className={
                        report.analysisResults.physicochemicalAnalysis.skipped
                          ? "text-slate-400 text-[11px] font-medium"
                          : "text-slate-600"
                      }
                    >
                      조사 Skip (해당 없음)
                    </span>
                  </label>
                </div>

              {!report.analysisResults.physicochemicalAnalysis.skipped ? (
                <div className="space-y-3">
                  <InvestigationStatusSelector
                    status={report.analysisResults.physicochemicalAnalysis.status}
                    onChange={(st) =>
                      updateAnalysisResults({
                        physicochemicalAnalysis: {
                          ...report.analysisResults.physicochemicalAnalysis,
                          status: st,
                        },
                      })
                    }
                    itemLabel="이화학적 특성 비교분석"
                  />
                  {/* Table of items */}
                  <div id="field-physicochemical-table" className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-slate-800">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-left w-28">시험일자</th>
                          <th className="p-2 text-left">시험 항목 (성상/pH/Brix 등)</th>
                          <th className="p-2 text-left w-16">단위</th>
                          <th className="p-2 text-left">품질 기준 규격</th>
                          <th className="p-2 text-left">정상 보관품 수치</th>
                          <th className="p-2 text-left">회수 현품 측정치</th>
                          <th className="p-2 text-center w-24">판정</th>
                          <th className="p-2 text-left w-28">비고</th>
                          <th className="p-2 text-center w-10">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(report.analysisResults.physicochemicalAnalysis.items || []).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-1.5">
                              <input
                                type="text"
                                placeholder="YYYY.MM.DD"
                                value={item.testDate || ""}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(
                                    item.id,
                                    "testDate",
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(item.id, "name", e.target.value)
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded font-medium"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(item.id, "unit", e.target.value)
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.standard}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(
                                    item.id,
                                    "standard",
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.controlValue}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(
                                    item.id,
                                    "controlValue",
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={item.sampleValue}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(
                                    item.id,
                                    "sampleValue",
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded font-bold"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <select
                                value={item.judgment}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(
                                    item.id,
                                    "judgment",
                                    e.target.value as any
                                  )
                                }
                                className={`text-xs px-2 py-1 rounded font-bold border ${
                                  item.judgment === "적합"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : item.judgment === "부적합"
                                    ? "bg-red-50 text-red-800 border-red-300"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                <option value="적합">적합</option>
                                <option value="부적합">부적합</option>
                                <option value="해당없음">해당없음</option>
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                placeholder="예: 출하 시점, 현시점 등"
                                value={item.remarks || ""}
                                onChange={(e) =>
                                  handleUpdatePhysicochemicalItem(
                                    item.id,
                                    "remarks",
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs px-1.5 py-1 border border-slate-200 rounded"
                              />
                            </td>
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePhysicochemicalItem(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleAddPhysicochemicalItem}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 py-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>시험 항목 추가</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      이화학 종합 판정 요약
                    </label>
                    <textarea
                      rows={2}
                      value={report.analysisResults.physicochemicalAnalysis.summary}
                      onChange={(e) =>
                        updateAnalysisResults({
                          physicochemicalAnalysis: {
                            ...report.analysisResults.physicochemicalAnalysis,
                            summary: e.target.value,
                          },
                        })
                      }
                      placeholder="예: 회수 현품과 정상 보관품 간 이화학적 특성 차이가 없어 액상 자체의 부패나 변질은 전혀 발생하지 않았음."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <TestPrincipleBox
                    methodName="이화학적 특성 비교분석"
                    fieldKey="principle_physicochemical"
                    includePrinciple={report.analysisResults.physicochemicalAnalysis.includePrinciple}
                    principleText={report.analysisResults.physicochemicalAnalysis.principleText}
                    activePresetId={selectedPresetId || undefined}
                    onChange={(include, text) =>
                      updateAnalysisResults({
                        physicochemicalAnalysis: {
                          ...report.analysisResults.physicochemicalAnalysis,
                          includePrinciple: include,
                          principleText: text,
                        },
                      })
                    }
                    onOpenManager={onOpenPhraseManager}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  [조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
                </p>
              )}
            </div>
          )}

          {/* 7. 카탈라아제(Catalase) 시험 결과 (Skip 가능) */}
          {analysisVisibility.catalaseTest?.isVisible && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                report.analysisResults.catalaseTest.skipped
                  ? "bg-slate-100/40 border-dashed border-slate-300 opacity-40 select-none"
                  : "bg-white border-slate-200 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      report.analysisResults.catalaseTest.skipped
                        ? "bg-slate-200 text-slate-500"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    7
                  </span>
                  <h4
                    className={`text-xs font-bold ${
                      report.analysisResults.catalaseTest.skipped
                        ? "text-slate-400 line-through decoration-slate-300"
                        : "text-slate-900"
                    }`}
                  >
                    카탈라아제(Catalase) 시험 결과 (생물체/유기물/열처리 이력 규명)
                  </h4>
                  {!analysisVisibility.catalaseTest.isRequiredByType &&
                    analysisVisibility.catalaseTest.hasContent &&
                    !report.analysisResults.catalaseTest.skipped && (
                      <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        기존 작성 내용 보존됨
                      </span>
                    )}
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={report.analysisResults.catalaseTest.skipped}
                    onChange={(e) =>
                      updateAnalysisResults({
                        catalaseTest: {
                          ...report.analysisResults.catalaseTest,
                          skipped: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                  />
                  <span
                    className={
                      report.analysisResults.catalaseTest.skipped
                        ? "text-slate-400 text-[11px] font-medium"
                        : "text-slate-600"
                    }
                  >
                    조사 Skip (해당 없음)
                  </span>
                </label>
              </div>

              {!report.analysisResults.catalaseTest.skipped ? (
                <div className="space-y-3">
                  <InvestigationStatusSelector
                    status={report.analysisResults.catalaseTest.status}
                    onChange={(st) =>
                      updateAnalysisResults({
                        catalaseTest: {
                          ...report.analysisResults.catalaseTest,
                          status: st,
                        },
                      })
                    }
                    itemLabel="카탈라아제 효소활성 시험"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      최종 판정 (유기물/생물체/가열 여부)
                    </label>
                    <input
                      id="field-catalase-judgement"
                      type="text"
                      value={report.analysisResults.catalaseTest.resultJudgement}
                      onChange={(e) =>
                        updateAnalysisResults({
                          catalaseTest: {
                            ...report.analysisResults.catalaseTest,
                            resultJudgement: e.target.value,
                          },
                        })
                      }
                      placeholder="예: 비생물성 합성 고분자 (음성, Negative) / 가열 살균 완료"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      과산화수소 반응 상세 관찰
                    </label>
                    <textarea
                      rows={2}
                      value={report.analysisResults.catalaseTest.reactionDetail}
                      onChange={(e) =>
                        updateAnalysisResults({
                          catalaseTest: {
                            ...report.analysisResults.catalaseTest,
                            reactionDetail: e.target.value,
                          },
                        })
                      }
                      placeholder="예: H2O2 3% 적하 시 기포 미발생 → 살아있는 생체 조직이나 곰팡이/벌레 등 생물 유래 이물이 아님을 확증."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <TestPrincipleBox
                    methodName="카탈라아제 효소활성 시험"
                    fieldKey="principle_catalase"
                    includePrinciple={report.analysisResults.catalaseTest.includePrinciple}
                    principleText={report.analysisResults.catalaseTest.principleText}
                    activePresetId={selectedPresetId || undefined}
                    onChange={(include, text) =>
                      updateAnalysisResults({
                        catalaseTest: {
                          ...report.analysisResults.catalaseTest,
                          includePrinciple: include,
                          principleText: text,
                        },
                      })
                    }
                    onOpenManager={onOpenPhraseManager}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  [조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
                </p>
              )}
            </div>
          )}

          {/* 숨겨진 항목 알림 & 펼치기 버튼 */}
          {Object.values(analysisVisibility).some((v) => !v.isVisible) && !showAllAnalysisItems && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  현재 선택된 클레임 유형에 해당하지 않는 기본 조사 항목{" "}
                  <strong className="text-blue-900 font-bold">
                    {Object.values(analysisVisibility).filter((v) => !v.isVisible).length}개
                  </strong>
                  가 간소화를 위해 숨겨져 있습니다. (입력한 데이터는 절대 지워지지 않습니다)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllAnalysisItems(true)}
                className="px-3 py-1 bg-white hover:bg-blue-100/50 text-blue-700 font-bold border border-blue-300 rounded-lg text-xs transition-colors shadow-2xs"
              >
                숨겨진 항목 모두 표시하기
              </button>
            </div>
          )}

            {/* 8. 기타 추가 시험 항목 (동적 추가) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  기타 추가 시험 항목 ({(report.analysisResults.additionalTests || []).length}개)
                </h4>
                <button
                  type="button"
                  onClick={handleAddAdditionalTest}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 시험 항목 추가</span>
                </button>
              </div>

              {(report.analysisResults.additionalTests || []).map((test, index) => (
                <div
                  key={test.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={test.title}
                      onChange={(e) => {
                        const updated = [...(report.analysisResults.additionalTests || [])];
                        updated[index].title = e.target.value;
                        updateAnalysisResults({ additionalTests: updated });
                      }}
                      className="text-xs font-bold px-2 py-1 border border-slate-200 rounded text-slate-800 w-2/3"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (report.analysisResults.additionalTests || []).filter(
                          (t) => t.id !== test.id
                        );
                        updateAnalysisResults({ additionalTests: updated });
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={test.result}
                    onChange={(e) => {
                      const updated = [...(report.analysisResults.additionalTests || [])];
                      updated[index].result = e.target.value;
                      updateAnalysisResults({ additionalTests: updated });
                    }}
                    placeholder="시험 결과 내용..."
                    className="w-full text-xs p-2 border border-slate-200 rounded"
                  />
                  <TestPrincipleBox
                    methodName={test.title || "추가 시험"}
                    fieldKey={`principle_add_${test.id}`}
                    includePrinciple={test.includePrinciple}
                    principleText={test.principleText}
                    activePresetId={selectedPresetId || undefined}
                    onChange={(include, text) => {
                      const updated = (report.analysisResults.additionalTests || []).map((t) =>
                        t.id === test.id
                          ? { ...t, includePrinciple: include, principleText: text }
                          : t
                      );
                      updateAnalysisResults({ additionalTests: updated });
                    }}
                    onOpenManager={onOpenPhraseManager}
                  />
                </div>
              ))}
            </div>
            </div>

            {/* 5대 핵심 조사결과 버튼 선택 현황 요약 바 */}
            <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 border border-blue-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-blue-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    5
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>5대 핵심 조사결과 선택 현황</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        단일 선택 UI
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      제조기록 · 보관품 · 품질검사 · 제조공정 · 원부자재 조사 항목의 결과를 버튼으로 간편하게 선택합니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                    선택 완료:{" "}
                    <strong className="text-blue-700 font-extrabold">
                      {[
                        getInvestigationValue("manufacturingRecord"),
                        getInvestigationValue("retainedSample"),
                        getInvestigationValue("qualityInspection"),
                        getInvestigationValue("manufacturingProcess"),
                        getInvestigationValue("rawMaterial"),
                      ].filter(Boolean).length}
                    </strong>{" "}
                    / 5개 항목
                  </span>
                </div>
              </div>

              {/* 5대 항목 바로가기 및 선택 요약 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  {
                    num: 1,
                    key: "manufacturingRecord" as const,
                    title: "1. 제조기록",
                    targetId: "field-choice-manufacturing-record",
                  },
                  {
                    num: 2,
                    key: "retainedSample" as const,
                    title: "2. 보관품",
                    targetId: "field-choice-retained-sample",
                  },
                  {
                    num: 3,
                    key: "qualityInspection" as const,
                    title: "3. 품질검사",
                    targetId: "field-choice-quality-inspection",
                  },
                  {
                    num: 4,
                    key: "manufacturingProcess" as const,
                    title: "4. 제조공정",
                    targetId: "field-choice-manufacturing-process",
                  },
                  {
                    num: 5,
                    key: "rawMaterial" as const,
                    title: "5. 원부자재",
                    targetId: "field-choice-raw-material",
                  },
                ].map((item) => {
                  const codeVal = getInvestigationValue(item.key);
                  const isDone = Boolean(codeVal);
                  const displayLabel = getChoiceOptionLabel(item.key, codeVal);
                  return (
                    <button
                      key={item.num}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(item.targetId);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.classList.add("ring-2", "ring-blue-400", "ring-offset-2", "transition-all");
                          setTimeout(() => el.classList.remove("ring-2", "ring-blue-400", "ring-offset-2"), 1500);
                        }
                      }}
                      className={`text-left p-2 rounded-xl border transition-all hover:scale-[1.01] active:scale-95 cursor-pointer ${
                        isDone
                          ? "bg-white border-blue-300 shadow-2xs"
                          : "bg-white/60 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                        <span>{item.title}</span>
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ${
                            isDone
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isDone ? "선택됨" : "미선택"}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold truncate text-slate-600">
                        {isDone ? (
                          <span className="text-blue-700 font-bold" title={displayLabel}>
                            {displayLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">결과 선택 이동 →</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 서브 섹션 B. 제조공정 분석 및 관리 포인트 */}
            <div
              className={`rounded-2xl transition-all ${
                report.manufacturingProcess.skipped
                  ? "bg-slate-100/40 border border-dashed border-slate-300 opacity-40 select-none p-4"
                  : "bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center ${
                      report.manufacturingProcess.skipped
                        ? "bg-slate-200 text-slate-500"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    B
                  </span>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        report.manufacturingProcess.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      제조공정 분석 및 관리 포인트
                    </h3>
                    <p className="text-xs text-slate-400">
                      전체 생산 공정 흐름 및 여과망/세척/핵심 관리 포인트 연계 분석
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={report.manufacturingProcess.skipped}
                    onChange={(e) => updateManufacturingProcess({ skipped: e.target.checked })}
                    className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                  />
                  <span
                    className={
                      report.manufacturingProcess.skipped
                        ? "text-slate-400 text-[11px] font-medium"
                        : "text-slate-600"
                    }
                  >
                    제조공정 분석 Skip (해당 없음)
                  </span>
                </label>
              </div>

            {!report.manufacturingProcess.skipped ? (
              <div className="space-y-4">
                {/* 제조처 연동 툴바 */}
                <div className="p-3 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/40 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                      <Factory className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-800">
                        연동 제조처:{" "}
                        <span className="text-blue-900 font-extrabold underline">
                          {report.productInfo.manufacturer || "미선택 (직접 입력)"}
                        </span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        * 클레임 발생 유력 지점(강조 표시)은 클레임별 고유 내용이므로 보호되며, 공정도 적용 시 변경되지 않습니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {findFactoryPresetByName(report.productInfo.manufacturer) && (
                      <button
                        type="button"
                        onClick={() => {
                          const match = findFactoryPresetByName(report.productInfo.manufacturer);
                          if (match) applyFactoryPreset(match);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1"
                        title="현재 제조처의 표준 공정도를 폼에 다시 기입합니다"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-700" />
                        <span>공정도 재적용</span>
                      </button>
                    )}

                    {/* 조사 화면에서는 공정 선택/조회만: 표준 공정도를 현재 클레임에 적용 */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFactoryModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      title="표준 제조공정도에서 현재 클레임에 적용할 공정을 선택합니다 (관리·편집은 품질 지식센터)"
                    >
                      <Workflow className="w-3.5 h-3.5" />
                      <span>제조공정도 선택 / 조회</span>
                    </button>
                  </div>
                </div>

                {/* 4. 제조공정 조사 버튼 선택 UI */}
                <div id="field-choice-manufacturing-process">
                  <InvestigationButtonGroup
                    itemNumber={4}
                    label="4. 제조공정 조사"
                    description={INVESTIGATION_CHOICES.manufacturingProcess.subtitle}
                    options={INVESTIGATION_CHOICES.manufacturingProcess.options}
                    value={getInvestigationValue("manufacturingProcess")}
                    onChange={(val) => updateInvestigationSelection("manufacturingProcess", val)}
                  />

                  {/* 추가 설명이 필요한 선택지 선택 시 동적 입력창 표시 */}
                  <InvestigationDetailInputsCard
                    itemKey="manufacturingProcess"
                    optionCodeOrLabel={getInvestigationValue("manufacturingProcess")}
                    values={report.investigationDetails?.manufacturingProcess}
                    onChange={(fieldKey, val) =>
                      updateInvestigationDetailField("manufacturingProcess", fieldKey, val)
                    }
                  />

                  {/* 자동 생성 문장 카드 */}
                  {(() => {
                    const result = getAssembledSentenceResult("manufacturingProcess");
                    return (
                      <GeneratedSentenceCard
                        sentence={result.sentence}
                        currentValue={
                          report.manufacturingProcess.processInvestigationNote ??
                          report.manufacturingProcess.criticalControlPoint ??
                          ""
                        }
                        isExtraInputRequired={result.isExtraInputRequired}
                        isMissingInput={!result.isComplete}
                        missingFields={result.missingFields}
                        onResetToDefault={(sentence) =>
                          updateManufacturingProcess({
                            processInvestigationNote: sentence,
                          })
                        }
                      />
                    );
                  })()}

                  <div className="mt-2 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        제조공정 조사 내용 (자유 수정 가능)
                      </label>
                      <PhraseDropdown
                        fieldKey="processInvestigationNote"
                        activePresetId={selectedPresetId || undefined}
                        currentValue={report.manufacturingProcess.processInvestigationNote ?? ""}
                        pastContext={currentClaimContext}
                        situationContext={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "제조공정",
                          resultType: "전체",
                          usageLocation: "분석 내용",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        onSelectPhrase={(content) =>
                          updateManufacturingProcess({ processInvestigationNote: content })
                        }
                        onOpenManager={onOpenPhraseManager}
                      />
                    </div>
                    <textarea
                      id="field-process-investigation-note"
                      rows={2}
                      value={
                        report.manufacturingProcess.processInvestigationNote ??
                        getInvestigationSentenceTemplate(
                          "manufacturingProcess",
                          getInvestigationValue("manufacturingProcess")
                        )
                      }
                      onChange={(e) =>
                        updateManufacturingProcess({
                          processInvestigationNote: e.target.value,
                        })
                      }
                      placeholder="제조공정 및 관련 기록을 확인한 결과, 제조과정에서 특이사항은 확인되지 않았습니다."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-medium"
                    />
                    <InlinePhraseSuggest
                      fieldKey="processInvestigationNote"
                      currentText={report.manufacturingProcess.processInvestigationNote ?? ""}
                      activePresetId={selectedPresetId || undefined}
                      onInsert={(finalText) =>
                        updateManufacturingProcess({ processInvestigationNote: finalText })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    제품 전체 제조공정 텍스트 (화살표 연결 형식)
                  </label>
                  <input
                    type="text"
                    value={report.manufacturingProcess.processFlow}
                    onChange={(e) => {
                      const val = e.target.value;
                      const steps = val
                        .split(/→|->/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      updateManufacturingProcess({
                        processFlow: val,
                        processSteps: steps,
                      });
                    }}
                    placeholder="예: 원료 배합 → 150mesh 여과 → 순간 살균 → 병 세척 → 충진/밀봉 → 검사 → 포장"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  {/* Interactive Process Step Pills in InputFormPane */}
                  {(report.manufacturingProcess.processSteps || []).length > 0 && (
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          공정 단계 시각화 ({(report.manufacturingProcess.processSteps || []).length}단계):
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          공정 클릭 시 설비·관리항목·CCP 상세 확인
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(report.manufacturingProcess.processSteps || []).map((step, idx) => {
                          const isHighlighted =
                            report.manufacturingProcess.highlightedStep &&
                            step.includes(report.manufacturingProcess.highlightedStep);
                          return (
                            <div key={idx} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenFormStepDetail(step, idx)}
                                className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                                  isHighlighted
                                    ? "bg-amber-100 text-amber-900 border-amber-400 font-bold ring-1 ring-amber-300"
                                    : "bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                                }`}
                                title={`${step} (클릭 시 설비/관리항목/CCP 상세정보 확인)`}
                              >
                                <span className="text-[10px] font-mono text-blue-600 mr-1">{idx + 1}.</span>
                                <span>{step}</span>
                              </button>
                              {idx < (report.manufacturingProcess.processSteps || []).length - 1 && (
                                <span className="text-slate-300 text-xs">→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    클레임 발생 유력 지점 강조 표시 (Highlight Step)
                  </label>
                  <input
                    type="text"
                    value={report.manufacturingProcess.highlightedStep}
                    onChange={(e) =>
                      updateManufacturingProcess({ highlightedStep: e.target.value })
                    }
                    placeholder="예: 충진/밀봉 (충진 노즐 밸브부)"
                    className="w-full text-xs px-3 py-2 border border-amber-300 bg-amber-50/40 rounded-md text-amber-950 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      여과망(Mesh 규격)을 통한 이물 제어 설명
                    </label>
                    <div className="flex items-center gap-2">
                      <PhraseDropdown
                        fieldKey="filtrationAnalysis"
                        currentValue={report.manufacturingProcess.filtrationAnalysis}
                        pastContext={currentClaimContext}
                        activePresetId={selectedPresetId || undefined}
                        situationContext={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "제조공정",
                          resultType: report.manufacturingProcess.filtrationStatus === "이상 확인" ? "이상 확인" : "이상 없음",
                          usageLocation: "여과망 관리",
                          relatedProcess: "여과",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        onSelectPhrase={(content) =>
                          updateManufacturingProcess({ filtrationAnalysis: content })
                        }
                        onOpenManager={onOpenPhraseManager}
                      />
                      <AiPolishButton
                        text={report.manufacturingProcess.filtrationAnalysis}
                        fieldName="여과망 관리 분석"
                        status={report.manufacturingProcess.filtrationStatus}
                        onApply={(p) => updateManufacturingProcess({ filtrationAnalysis: p })}
                      />
                    </div>
                  </div>
                  <textarea
                    id="field-process-filtration"
                    rows={2}
                    value={report.manufacturingProcess.filtrationAnalysis}
                    onChange={(e) =>
                      updateManufacturingProcess({ filtrationAnalysis: e.target.value })
                    }
                    placeholder="원료 투입 및 충진 전 150 Mesh(105㎛) 여과 필터를 통과하여 0.1mm 이상의 물리적 이물은 통과가 불가능한 구조임."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      용기 및 캡 세척 공정 설명
                    </label>
                    <div className="flex items-center gap-2">
                      <PhraseDropdown
                        fieldKey="cleaningAnalysis"
                        currentValue={report.manufacturingProcess.cleaningAnalysis}
                        pastContext={currentClaimContext}
                        activePresetId={selectedPresetId || undefined}
                        situationContext={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "제조공정",
                          resultType: report.manufacturingProcess.cleaningStatus === "이상 확인" ? "이상 확인" : "이상 없음",
                          usageLocation: "세척 공정",
                          relatedProcess: "세척",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        onSelectPhrase={(content) =>
                          updateManufacturingProcess({ cleaningAnalysis: content })
                        }
                        onOpenManager={onOpenPhraseManager}
                      />
                      <AiPolishButton
                        text={report.manufacturingProcess.cleaningAnalysis}
                        fieldName="용기 세척 공정 분석"
                        status={report.manufacturingProcess.cleaningStatus}
                        onApply={(p) => updateManufacturingProcess({ cleaningAnalysis: p })}
                      />
                    </div>
                  </div>
                  <textarea
                    id="field-process-cleaning"
                    rows={2}
                    value={report.manufacturingProcess.cleaningAnalysis}
                    onChange={(e) =>
                      updateManufacturingProcess({ cleaningAnalysis: e.target.value })
                    }
                    placeholder="공병 투입 후 85℃ 고온 온수 린싱 및 3.5 bar 청정 에어 블로우로 내부 잔류물을 완벽히 제거함."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      클레임 발생 유력 지점 분석 및 공정 연계 설명
                    </label>
                    <AiPolishButton
                      text={report.manufacturingProcess.criticalControlPoint}
                      fieldName="클레임 발생 유력 지점 분석"
                      onApply={(p) => updateManufacturingProcess({ criticalControlPoint: p })}
                    />
                  </div>
                  <textarea
                    id="field-process-ccp"
                    rows={3}
                    value={report.manufacturingProcess.criticalControlPoint}
                    onChange={(e) =>
                      updateManufacturingProcess({ criticalControlPoint: e.target.value })
                    }
                    placeholder="여과망 후단인 충진 밸브 노즐 내부 패킹의 반복 피스톤 왕복 마찰에 의해 노후된 가스켓 표면 미세 조각이 탈락되어 용기 내 혼입된 것으로 최종 확인됨."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-medium"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-100 rounded-lg">
                [제조공정 분석 Skip 설정됨] 우측 보고서 및 최종 출력물에서 본 항목이 완전히 제외됩니다.
              </p>
            )}
            </div>

            {/* 서브 섹션 C. 동일 Lot 제조 및 품질검사 이력 */}
            <div
              className={`rounded-2xl transition-all ${
                report.lotHistory.skipped
                  ? "bg-slate-100/40 border border-dashed border-slate-300 opacity-40 select-none p-4"
                  : "bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center ${
                      report.lotHistory.skipped
                        ? "bg-slate-200 text-slate-500"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    C
                  </span>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        report.lotHistory.skipped
                          ? "text-slate-400 line-through decoration-slate-300"
                          : "text-slate-900"
                      }`}
                    >
                      동일 Lot 제조공정 및 품질검사 이력 조사
                    </h3>
                    <p className="text-xs text-slate-400">
                      제조 당일 설비 가동일지, 완제품 성적서, 동일 Lot 보관품 전수 조사
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={report.lotHistory.skipped}
                    onChange={(e) => updateLotHistory({ skipped: e.target.checked })}
                    className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                  />
                  <span
                    className={
                      report.lotHistory.skipped
                        ? "text-slate-400 text-[11px] font-medium"
                        : "text-slate-600"
                    }
                  >
                    Lot 이력 조사 Skip (해당 없음)
                  </span>
                </label>
              </div>

            {!report.lotHistory.skipped ? (
              <div className="space-y-4">
                {/* 1. 제조기록 조사 */}
                <div id="field-choice-manufacturing-record">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      1. 제조기록 조사 (생산일지 특이사항 유무)
                    </label>
                    <div className="flex items-center gap-2">
                      <PhraseDropdown
                        fieldKey="productionLogNote"
                        currentValue={report.lotHistory.productionLogNote}
                        pastContext={currentClaimContext}
                        activePresetId={selectedPresetId || undefined}
                        situationContext={{
                          claimType: activeClaimTypeKorean,
                          investigationItem: "제조기록",
                          resultType:
                            getInvestigationValue("manufacturingRecord") === "normal" || getInvestigationValue("manufacturingRecord") === "no_issue"
                              ? "이상 없음"
                              : getInvestigationValue("manufacturingRecord")
                              ? getChoiceOptionLabel("manufacturingRecord", getInvestigationValue("manufacturingRecord"))
                              : report.lotHistory.productionLogStatus || "이상 없음",
                          usageLocation: "제조기록 점검",
                          relatedProductType: activeProductType,
                        }}
                        onSelectPhrase={(content) =>
                          updateLotHistory({ productionLogNote: content })
                        }
                        onOpenManager={onOpenPhraseManager}
                      />
                      <AiPolishButton
                        text={report.lotHistory.productionLogNote}
                        fieldName="생산일지 조사"
                        status={report.lotHistory.productionLogStatus}
                        onApply={(p) => updateLotHistory({ productionLogNote: p })}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <InvestigationStatusSelector
                      status={report.lotHistory.productionLogStatus}
                      onChange={(st) => updateLotHistory({ productionLogStatus: st })}
                      itemLabel="제조 당시 생산일지 점검"
                    />
                  </div>
                  <InvestigationButtonGroup
                    itemNumber={1}
                    label="1. 제조기록 조사"
                    description={INVESTIGATION_CHOICES.manufacturingRecord.subtitle}
                    options={INVESTIGATION_CHOICES.manufacturingRecord.options}
                    value={getInvestigationValue("manufacturingRecord")}
                    onChange={(val) => updateInvestigationSelection("manufacturingRecord", val)}
                    className="mb-2"
                  />

                  {/* 추가 설명이 필요한 선택지 선택 시 동적 입력창 표시 */}
                  <InvestigationDetailInputsCard
                    itemKey="manufacturingRecord"
                    optionCodeOrLabel={getInvestigationValue("manufacturingRecord")}
                    values={report.investigationDetails?.manufacturingRecord}
                    onChange={(fieldKey, val) =>
                      updateInvestigationDetailField("manufacturingRecord", fieldKey, val)
                    }
                  />

                  {/* 자동 생성 문장 카드 */}
                  {(() => {
                    const result = getAssembledSentenceResult("manufacturingRecord");
                    return (
                      <GeneratedSentenceCard
                        sentence={result.sentence}
                        currentValue={report.lotHistory.productionLogNote}
                        isExtraInputRequired={result.isExtraInputRequired}
                        isMissingInput={!result.isComplete}
                        missingFields={result.missingFields}
                        onResetToDefault={(sentence) =>
                          updateLotHistory({ productionLogNote: sentence })
                        }
                      />
                    );
                  })()}

                  {/* 상황 기반 자동 추천 상용구 카드 */}
                  <SituationPhraseRecommendationCard
                    context={{
                      claimType: report.customerClaim?.claimType || "이물",
                      investigationItem: "제조기록",
                      resultType:
                        getInvestigationValue("manufacturingRecord") === "normal" || getInvestigationValue("manufacturingRecord") === "no_issue"
                          ? "이상 없음"
                          : getInvestigationValue("manufacturingRecord")
                          ? getChoiceOptionLabel("manufacturingRecord", getInvestigationValue("manufacturingRecord"))
                          : report.lotHistory.productionLogStatus || "이상 없음",
                      usageLocation: "제조기록 점검",
                      relatedProductType: report.productInfo?.productType || "혼합음료",
                    }}
                    currentValue={report.lotHistory.productionLogNote}
                    onApplySentence={(sentence) =>
                      updateLotHistory({ productionLogNote: sentence })
                    }
                    onOpenPhraseManager={onOpenPhraseManager}
                    fieldKey="productionLogNote"
                  />

                  <div className="mt-2 mb-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      제조기록 조사 내용 (자유 수정 가능)
                    </label>
                    <textarea
                      id="field-lot-production-log"
                      rows={2}
                      value={report.lotHistory.productionLogNote}
                      onChange={(e) => updateLotHistory({ productionLogNote: e.target.value })}
                      placeholder="해당 제조번호의 제조기록 및 작업기록을 확인한 결과, 제조 및 품질관리 과정에서 특이사항은 확인되지 않았습니다."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-medium"
                    />
                    <InlinePhraseSuggest
                      fieldKey="productionLogNote"
                      currentText={report.lotHistory.productionLogNote}
                      activePresetId={selectedPresetId || undefined}
                      onInsert={(finalText) => updateLotHistory({ productionLogNote: finalText })}
                    />
                  </div>
                </div>

                {/* 3. 품질검사 결과 */}
                <div id="field-choice-quality-inspection">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      3. 품질검사 결과 (완제품 품질검사 성적서 확인)
                    </label>
                    <PhraseDropdown
                      fieldKey="qualityTestRecord"
                      currentValue={report.lotHistory.qualityTestRecord}
                      pastContext={currentClaimContext}
                      activePresetId={selectedPresetId || undefined}
                      situationContext={{
                        claimType: report.customerClaim?.claimType || "이물",
                        investigationItem: "품질검사",
                        resultType:
                          getInvestigationValue("qualityInspection") === "pass" || getInvestigationValue("qualityInspection") === "normal"
                            ? "적합"
                            : getInvestigationValue("qualityInspection")
                            ? getChoiceOptionLabel("qualityInspection", getInvestigationValue("qualityInspection"))
                            : report.lotHistory.qualityTestStatus || "적합",
                        usageLocation: "품질검사",
                        relatedProductType: report.productInfo?.productType || "혼합음료",
                      }}
                      onSelectPhrase={(content) =>
                        updateLotHistory({ qualityTestRecord: content })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                  <div className="mb-2">
                    <InvestigationStatusSelector
                      status={report.lotHistory.qualityTestStatus}
                      onChange={(st) => updateLotHistory({ qualityTestStatus: st })}
                      itemLabel="출하 전 완제품 품질검사(COA)"
                    />
                  </div>
                  <InvestigationButtonGroup
                    itemNumber={3}
                    label="3. 품질검사 결과"
                    description={INVESTIGATION_CHOICES.qualityInspection.subtitle}
                    options={INVESTIGATION_CHOICES.qualityInspection.options}
                    value={getInvestigationValue("qualityInspection")}
                    onChange={(val) => updateInvestigationSelection("qualityInspection", val)}
                    className="mb-2"
                  />

                  {/* 추가 설명이 필요한 선택지 선택 시 동적 입력창 표시 */}
                  <InvestigationDetailInputsCard
                    itemKey="qualityInspection"
                    optionCodeOrLabel={getInvestigationValue("qualityInspection")}
                    values={report.investigationDetails?.qualityInspection}
                    onChange={(fieldKey, val) =>
                      updateInvestigationDetailField("qualityInspection", fieldKey, val)
                    }
                  />

                  {/* 자동 생성 문장 카드 */}
                  {(() => {
                    const result = getAssembledSentenceResult("qualityInspection");
                    return (
                      <GeneratedSentenceCard
                        sentence={result.sentence}
                        currentValue={report.lotHistory.qualityTestRecord}
                        isExtraInputRequired={result.isExtraInputRequired}
                        isMissingInput={!result.isComplete}
                        missingFields={result.missingFields}
                        onResetToDefault={(sentence) =>
                          updateLotHistory({ qualityTestRecord: sentence })
                        }
                      />
                    );
                  })()}

                  {/* 상황 기반 자동 추천 상용구 카드 */}
                  <SituationPhraseRecommendationCard
                    context={{
                      claimType: report.customerClaim?.claimType || "이물",
                      investigationItem: "품질검사",
                      resultType:
                        getInvestigationValue("qualityInspection") === "pass" || getInvestigationValue("qualityInspection") === "normal"
                          ? "적합"
                          : getInvestigationValue("qualityInspection")
                          ? getChoiceOptionLabel("qualityInspection", getInvestigationValue("qualityInspection"))
                          : report.lotHistory.qualityTestStatus || "적합",
                      usageLocation: "품질검사",
                      relatedProductType: report.productInfo?.productType || "혼합음료",
                    }}
                    currentValue={report.lotHistory.qualityTestRecord}
                    onApplySentence={(sentence) =>
                      updateLotHistory({ qualityTestRecord: sentence })
                    }
                    onOpenPhraseManager={onOpenPhraseManager}
                    fieldKey="qualityTestRecord"
                  />

                  <div className="mt-2 mb-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      품질검사 결과 내용 (자유 수정 가능)
                    </label>
                    <textarea
                      id="field-lot-quality-test"
                      rows={2}
                      value={report.lotHistory.qualityTestRecord}
                      onChange={(e) => updateLotHistory({ qualityTestRecord: e.target.value })}
                      placeholder="해당 제조번호의 품질검사 결과를 확인한 결과, 관련 검사 항목은 기준에 적합한 것으로 확인되었습니다."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      동일 Lot 이전 클레임 접수 이력
                    </label>
                    <PhraseDropdown
                      fieldKey="priorClaimsCount"
                      currentValue={report.lotHistory.priorClaimsCount || ""}
                      pastContext={currentClaimContext}
                      activePresetId={selectedPresetId || undefined}
                      onSelectPhrase={(content) =>
                        updateLotHistory({ priorClaimsCount: content })
                      }
                      onOpenManager={onOpenPhraseManager}
                    />
                  </div>
                  <input
                    id="field-lot-prior-claims"
                    type="text"
                    value={report.lotHistory.priorClaimsCount}
                    onChange={(e) => updateLotHistory({ priorClaimsCount: e.target.value })}
                    placeholder="예: 0건 (동일/유사 유형 고객 클레임 접수 이력 없음)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 2. 보관품 조사 */}
                <div id="field-choice-retained-sample">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      2. 보관품 조사 (동일 Lot 당사 보관 검체 확인 결과)
                    </label>
                    <div className="flex items-center gap-2">
                      <PhraseDropdown
                        fieldKey="retainedSampleCheck"
                        currentValue={report.lotHistory.retainedSampleCheck}
                        pastContext={currentClaimContext}
                        activePresetId={selectedPresetId || undefined}
                        situationContext={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "보관품",
                          resultType:
                            getInvestigationValue("retainedSample") === "normal"
                              ? "이상 없음"
                              : getInvestigationValue("retainedSample")
                              ? getChoiceOptionLabel("retainedSample", getInvestigationValue("retainedSample"))
                              : report.lotHistory.retainedSampleStatus || "이상 없음",
                          usageLocation: "분석 내용",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        onSelectPhrase={(content) =>
                          updateLotHistory({ retainedSampleCheck: content })
                        }
                        onOpenManager={onOpenPhraseManager}
                      />
                      <AiPolishButton
                        text={report.lotHistory.retainedSampleCheck}
                        fieldName="보관 검체 확인 결과"
                        status={report.lotHistory.retainedSampleStatus}
                        onApply={(p) => updateLotHistory({ retainedSampleCheck: p })}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <InvestigationStatusSelector
                      status={report.lotHistory.retainedSampleStatus}
                      onChange={(st) => updateLotHistory({ retainedSampleStatus: st })}
                      itemLabel="동일 Lot 자사 공장 보관품(검체) 조사"
                    />
                  </div>
                  <InvestigationButtonGroup
                    itemNumber={2}
                    label="2. 보관품 조사"
                    description={INVESTIGATION_CHOICES.retainedSample.subtitle}
                    options={INVESTIGATION_CHOICES.retainedSample.options}
                    value={getInvestigationValue("retainedSample")}
                    onChange={(val) => updateInvestigationSelection("retainedSample", val)}
                    className="mb-2"
                  />

                  {/* 추가 설명이 필요한 선택지 선택 시 동적 입력창 표시 */}
                  <InvestigationDetailInputsCard
                    itemKey="retainedSample"
                    optionCodeOrLabel={getInvestigationValue("retainedSample")}
                    values={report.investigationDetails?.retainedSample}
                    onChange={(fieldKey, val) =>
                      updateInvestigationDetailField("retainedSample", fieldKey, val)
                    }
                  />

                  {/* 자동 생성 문장 카드 */}
                  {(() => {
                    const result = getAssembledSentenceResult("retainedSample");
                    return (
                      <GeneratedSentenceCard
                        sentence={result.sentence}
                        currentValue={report.lotHistory.retainedSampleCheck}
                        isExtraInputRequired={result.isExtraInputRequired}
                        isMissingInput={!result.isComplete}
                        missingFields={result.missingFields}
                        onResetToDefault={(sentence) =>
                          updateLotHistory({ retainedSampleCheck: sentence })
                        }
                      />
                    );
                  })()}

                  {/* 상황 기반 자동 추천 상용구 카드 */}
                  <SituationPhraseRecommendationCard
                    context={{
                      claimType: report.customerClaim?.claimType || "이물",
                      investigationItem: "보관품",
                      resultType:
                        getInvestigationValue("retainedSample") === "normal"
                          ? "이상 없음"
                          : getInvestigationValue("retainedSample")
                          ? getChoiceOptionLabel("retainedSample", getInvestigationValue("retainedSample"))
                          : report.lotHistory.retainedSampleStatus || "이상 없음",
                      usageLocation: "분석 내용",
                      relatedProductType: report.productInfo?.productType || "혼합음료",
                    }}
                    currentValue={report.lotHistory.retainedSampleCheck}
                    onApplySentence={(sentence) =>
                      updateLotHistory({ retainedSampleCheck: sentence })
                    }
                    onOpenPhraseManager={onOpenPhraseManager}
                    fieldKey="retainedSampleCheck"
                  />

                  <div className="mt-2 mb-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      보관품 조사 내용 (자유 수정 가능)
                    </label>
                    <textarea
                      id="field-lot-retained-sample"
                      rows={3}
                      value={report.lotHistory.retainedSampleCheck}
                      onChange={(e) =>
                        updateLotHistory({ retainedSampleCheck: e.target.value })
                      }
                      placeholder="동일 제조번호의 보관품을 확인한 결과, 외관 및 내용물에서 특이사항은 확인되지 않았습니다."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-medium"
                    />
                    <InlinePhraseSuggest
                      fieldKey="retainedSampleCheck"
                      currentText={report.lotHistory.retainedSampleCheck}
                      activePresetId={selectedPresetId || undefined}
                      onInsert={(finalText) => updateLotHistory({ retainedSampleCheck: finalText })}
                    />
                  </div>
                </div>

                <div id="field-lot-retained-photos">
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">
                    동일 Lot 공장 보관품 사진 (보고서/회신에서 연결된 사진 미리보기)
                  </p>
                  <LinkedPhotoView
                    photos={getLinkedPhotos("quality")}
                    emptyText="연결된 사진이 없습니다. 3. 보고서/회신 영역에서 사진을 등록하고 이 탭에 연결하세요."
                  />
                </div>

                {/* 5. 원부자재 조사 */}
                <div id="field-choice-raw-material" className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      5. 원부자재 조사 (원료 및 부자재 점검 및 LOT 추적)
                    </label>
                    <div className="flex items-center gap-2">
                      <PhraseDropdown
                        fieldKey="rawMaterialCheck"
                        currentValue={report.lotHistory.rawMaterialCheck || ""}
                        pastContext={currentClaimContext}
                        activePresetId={selectedPresetId || undefined}
                        situationContext={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "원부자재",
                          resultType:
                            getInvestigationValue("rawMaterial") === "normal" || getInvestigationValue("rawMaterial") === "no_issue"
                              ? "이상 없음"
                              : getInvestigationValue("rawMaterial")
                              ? getChoiceOptionLabel("rawMaterial", getInvestigationValue("rawMaterial"))
                              : report.lotHistory.rawMaterialStatus || "이상 없음",
                          usageLocation: "분석 내용",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        onSelectPhrase={(content) =>
                          updateLotHistory({ rawMaterialCheck: content })
                        }
                        onOpenManager={onOpenPhraseManager}
                      />
                      <AiPolishButton
                        text={report.lotHistory.rawMaterialCheck || ""}
                        fieldName="원부자재 점검 결과"
                        status={report.lotHistory.rawMaterialStatus}
                        onApply={(p) => updateLotHistory({ rawMaterialCheck: p })}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <InvestigationStatusSelector
                      status={report.lotHistory.rawMaterialStatus || "확인 완료"}
                      onChange={(st) => updateLotHistory({ rawMaterialStatus: st })}
                      itemLabel="원부자재 및 LOT 추적 점검"
                    />
                  </div>
                  <InvestigationButtonGroup
                    itemNumber={5}
                    label="5. 원부자재 조사"
                    description={INVESTIGATION_CHOICES.rawMaterial.subtitle}
                    options={INVESTIGATION_CHOICES.rawMaterial.options}
                    value={getInvestigationValue("rawMaterial")}
                    onChange={(val) => updateInvestigationSelection("rawMaterial", val)}
                    className="mb-2"
                  />

                  {/* 추가 설명이 필요한 선택지 선택 시 동적 입력창 표시 */}
                  <InvestigationDetailInputsCard
                    itemKey="rawMaterial"
                    optionCodeOrLabel={getInvestigationValue("rawMaterial")}
                    values={report.investigationDetails?.rawMaterial}
                    onChange={(fieldKey, val) =>
                      updateInvestigationDetailField("rawMaterial", fieldKey, val)
                    }
                  />

                  {/* 자동 생성 문장 카드 */}
                  {(() => {
                    const result = getAssembledSentenceResult("rawMaterial");
                    return (
                      <GeneratedSentenceCard
                        sentence={result.sentence}
                        currentValue={report.lotHistory.rawMaterialCheck || ""}
                        isExtraInputRequired={result.isExtraInputRequired}
                        isMissingInput={!result.isComplete}
                        missingFields={result.missingFields}
                        onResetToDefault={(sentence) =>
                          updateLotHistory({ rawMaterialCheck: sentence })
                        }
                      />
                    );
                  })()}

                  {/* 상황 기반 자동 추천 상용구 카드 */}
                  <SituationPhraseRecommendationCard
                    context={{
                      claimType: report.customerClaim?.claimType || "이물",
                      investigationItem: "원부자재",
                      resultType:
                        getInvestigationValue("rawMaterial") === "normal" || getInvestigationValue("rawMaterial") === "no_issue"
                          ? "이상 없음"
                          : getInvestigationValue("rawMaterial")
                          ? getChoiceOptionLabel("rawMaterial", getInvestigationValue("rawMaterial"))
                          : report.lotHistory.rawMaterialStatus || "이상 없음",
                      usageLocation: "분석 내용",
                      relatedProductType: report.productInfo?.productType || "혼합음료",
                    }}
                    currentValue={report.lotHistory.rawMaterialCheck || ""}
                    onApplySentence={(sentence) =>
                      updateLotHistory({ rawMaterialCheck: sentence })
                    }
                    onOpenPhraseManager={onOpenPhraseManager}
                    fieldKey="rawMaterialCheck"
                  />

                  <div className="mt-2 mb-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      원부자재 조사 내용 (자유 수정 가능)
                    </label>
                    <textarea
                      id="field-lot-raw-material"
                      rows={2}
                      value={report.lotHistory.rawMaterialCheck || ""}
                      onChange={(e) => updateLotHistory({ rawMaterialCheck: e.target.value })}
                      placeholder="관련 원부자재의 제조 및 입고 기록을 확인한 결과, 특이사항은 확인되지 않았습니다."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-100 rounded-lg">
                [Lot 이력 조사 Skip 설정됨] 본 항목은 출력물에서 제외됩니다.
              </p>
            )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* [STEP 2] 원인 검토 (종합 원인 판정 및 재발방지대책) */}
        {/* ======================================================== */}
        {(currentStep === "investigate" || activeTab === "cause") && (
          <div className="space-y-6 animate-in fade-in duration-100">
            <div
              className={`rounded-2xl transition-all ${
                report.rootCauseAndActions.skipped
                  ? "bg-slate-100/40 border border-dashed border-slate-300 opacity-40 select-none p-4"
                  : "bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3
                    className={`text-sm font-bold ${
                      report.rootCauseAndActions.skipped
                        ? "text-slate-400 line-through decoration-slate-300"
                        : "text-slate-900"
                    }`}
                  >
                    종합 원인 판정 및 재발방지대책
                  </h3>
                  <p className="text-xs text-slate-400">과학적 분석에 기반한 최종 원인 및 설비/공정 개선 대책</p>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={report.rootCauseAndActions.skipped}
                    onChange={(e) => updateRootCause({ skipped: e.target.checked })}
                    className="rounded text-slate-500 focus:ring-slate-400 w-4 h-4"
                  />
                  <span
                    className={
                      report.rootCauseAndActions.skipped
                        ? "text-slate-400 text-[11px] font-medium"
                        : "text-slate-600"
                    }
                  >
                    원인/대책 전체 Skip (해당 없음)
                  </span>
                </label>
              </div>

            {!report.rootCauseAndActions.skipped ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      종합 원인 판정 (Root Cause)
                    </label>
                    <div className="flex items-center gap-2">
                      <PhraseDropdown
                        fieldKey="rootCause"
                        currentValue={report.rootCauseAndActions.rootCause}
                        pastContext={currentClaimContext}
                        activePresetId={selectedPresetId || undefined}
                        situationContext={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "원인판정",
                          resultType: report.rootCauseAndActions.status || "이상 확인",
                          usageLocation: "원인 분석",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        onSelectPhrase={(content) => updateRootCause({ rootCause: content })}
                        onOpenManager={onOpenPhraseManager}
                      />
                      <AiPolishButton
                        text={report.rootCauseAndActions.rootCause}
                        fieldName="종합 원인 판정"
                        status={report.rootCauseAndActions.status}
                        onApply={(p) => updateRootCause({ rootCause: p })}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <InvestigationStatusSelector
                      status={report.rootCauseAndActions.status}
                      onChange={(st) => updateRootCause({ status: st })}
                      itemLabel="종합 원인 판정"
                    />
                  </div>

                  {/* 상황 기반 자동 추천 상용구 카드 */}
                  <SituationPhraseRecommendationCard
                    context={{
                      claimType: report.customerClaim?.claimType || "이물",
                      investigationItem: "원인판정",
                      resultType: report.rootCauseAndActions.status || "이상 확인",
                      usageLocation: "원인 분석",
                      relatedProductType: report.productInfo?.productType || "혼합음료",
                    }}
                    currentValue={report.rootCauseAndActions.rootCause}
                    onApplySentence={(sentence) =>
                      updateRootCause({ rootCause: sentence })
                    }
                    onOpenPhraseManager={onOpenPhraseManager}
                    fieldKey="rootCause"
                  />

                  <textarea
                    id="field-root-cause"
                    rows={3}
                    value={report.rootCauseAndActions.rootCause}
                    onChange={(e) => updateRootCause({ rootCause: e.target.value })}
                    placeholder="예: 충진기 밸브 노즐 내 EPDM 고무 패킹의 누적 마찰 마모로 인하여 미세 조각 1점이 충진 시 박리 탈락되어 혼입된 것으로 최종 판정됨."
                    className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-semibold text-slate-900"
                  />
                  <InlinePhraseSuggest
                    fieldKey="rootCause"
                    currentText={report.rootCauseAndActions.rootCause}
                    activePresetId={selectedPresetId || undefined}
                    onInsert={(finalText) => updateRootCause({ rootCause: finalText })}
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      재발방지대책 (설비 개선, 점검 주기 단축 등)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={report.rootCauseAndActions.preventiveMeasuresSkipped}
                        onChange={(e) =>
                          updateRootCause({ preventiveMeasuresSkipped: e.target.checked })
                        }
                        className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                      <span
                        className={
                          report.rootCauseAndActions.preventiveMeasuresSkipped
                            ? "text-red-700 font-bold"
                            : "text-slate-500"
                        }
                      >
                        재발방지대책 Skip
                      </span>
                    </label>
                  </div>

                  {!report.rootCauseAndActions.preventiveMeasuresSkipped ? (
                    <div>
                      <div className="flex justify-end items-center gap-2 mb-1">
                        <PhraseDropdown
                          fieldKey="preventiveAction"
                          currentValue={report.rootCauseAndActions.preventiveMeasures}
                          pastContext={currentClaimContext}
                          activePresetId={selectedPresetId || undefined}
                          situationContext={{
                            claimType: report.customerClaim?.claimType || "이물",
                            investigationItem: "재발방지",
                            resultType: "해당 없음",
                            usageLocation: "재발방지",
                            relatedProductType: report.productInfo?.productType || "혼합음료",
                          }}
                          onSelectPhrase={(content) =>
                            updateRootCause({ preventiveMeasures: content })
                          }
                          onOpenManager={onOpenPhraseManager}
                        />
                        <AiPolishButton
                          text={report.rootCauseAndActions.preventiveMeasures}
                          fieldName="재발방지대책"
                          onApply={(p) => updateRootCause({ preventiveMeasures: p })}
                        />
                      </div>

                      {/* 상황 기반 자동 추천 상용구 카드 */}
                      <SituationPhraseRecommendationCard
                        context={{
                          claimType: report.customerClaim?.claimType || "이물",
                          investigationItem: "재발방지",
                          resultType: "해당 없음",
                          usageLocation: "재발방지",
                          relatedProductType: report.productInfo?.productType || "혼합음료",
                        }}
                        currentValue={report.rootCauseAndActions.preventiveMeasures}
                        onApplySentence={(sentence) =>
                          updateRootCause({ preventiveMeasures: sentence })
                        }
                        onOpenPhraseManager={onOpenPhraseManager}
                        fieldKey="preventiveAction"
                      />

                      <textarea
                        id="field-preventive-measures"
                        rows={4}
                        value={report.rootCauseAndActions.preventiveMeasures}
                        onChange={(e) =>
                          updateRootCause({ preventiveMeasures: e.target.value })
                        }
                        placeholder="1. [설비 개선] 노즐 패킹 재질을 내마모성 테프론 규격으로 전면 교체 완료.&#10;2. [점검 주기 단축] 정비 주기를 50% 단축하고 매 교대 시 마모도 점검 의무화.&#10;3. [검사 프로세스 강화] 비전 검사기 감도 상향 조정."
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      [재발방지대책 Skip 설정됨]
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-100 rounded-lg">
                [원인 및 재발방지대책 Skip 설정됨]
              </p>
            )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* [STEP 3] 결론·첨부·보고서 검토 (요약, 사과문, 직인 설정, 증빙 사진 통합) */}
        {/* ======================================================== */}
        {(currentStep === "review" ||
          activeTab === "conclusion" ||
          activeTab === "attachments") && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* STEP 3 보고서 검토 허브 (검증·미리보기·회신·인쇄·완료 바로가기) */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 text-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">STEP 3. 보고서 검토 / 회신</h3>
                    <p className="text-[11px] text-slate-300">
                      조사 결과·원인·결론 확인 → 보고서 미리보기 → 상담팀 회신 → 인쇄 → 완료·지식화
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  {validationSummary.errorCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-400/40">
                      오류 {validationSummary.errorCount}건 보완 필요
                    </span>
                  ) : validationSummary.warningCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40">
                      경고 {validationSummary.warningCount}건 확인 권장
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                      검증 통과
                    </span>
                  )}
                </div>
              </div>

              {/* 원인·재발방지 요약 (읽기 전용 recap, 수정은 STEP 2에서) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">원인 판정 요약</span>
                    <button
                      type="button"
                      onClick={() => handleJumpToStepField("investigate", "field-root-cause")}
                      className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer"
                    >
                      STEP 2에서 수정 →
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {(report.rootCauseAndActions.rootCause || "미작성").slice(0, 140)}
                    {(report.rootCauseAndActions.rootCause || "").length > 140 ? "…" : ""}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">재발방지/조치 요약</span>
                    <button
                      type="button"
                      onClick={() => handleJumpToStepField("investigate", "field-preventive-measures")}
                      className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer"
                    >
                      STEP 2에서 수정 →
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {(report.rootCauseAndActions.preventiveMeasures || "미작성").slice(0, 140)}
                    {(report.rootCauseAndActions.preventiveMeasures || "").length > 140 ? "…" : ""}
                  </p>
                </div>
              </div>

              {/* 검토·회신 바로가기 (기존 기능 재호출, 신규 로직 없음) */}
              <div className="flex flex-wrap items-center gap-2">
                {onOpenValidation && (
                  <button
                    type="button"
                    onClick={onOpenValidation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>사전 검증</span>
                  </button>
                )}
                {onPreviewReport && (
                  <button
                    type="button"
                    onClick={onPreviewReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>A4 보고서 미리보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onComposeEmail && (
                  <button
                    type="button"
                    onClick={onComposeEmail}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>상담팀 이메일 회신</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onPrintReport && (
                  <button
                    type="button"
                    onClick={onPrintReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>PDF / 인쇄</span>
                  </button>
                )}
                {onOpenCompleteKnowledge && (
                  <button
                    type="button"
                    onClick={onOpenCompleteKnowledge}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>조사 완료 & 지식화</span>
                  </button>
                )}
              </div>
            </div>
            {/* 서브 섹션 A. 결론 요약 및 고객 안내 사과문 & 서명 설정 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    A
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">결론 및 고객 안내 (사과문)</h3>
                    <p className="text-xs text-slate-400">
                      핵심 요약(가, 나, 다) 정리 및 고객 안심/사과 표준 문구
                    </p>
                  </div>
                </div>
              </div>

            {/* Summary bullet points */}
            <div id="field-conclusion-summary" className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  조사 결과 핵심 요약 (가, 나, 다 항목별 정리)
                </label>
                <button
                  type="button"
                  onClick={handleAddSummaryPoint}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>요약 항목 추가</span>
                </button>
              </div>

              {report.conclusion.summaryPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-blue-800 shrink-0 mt-2">
                    {String.fromCharCode(44032 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleUpdateSummaryPoint(idx, e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteSummaryPoint(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded"
                    title="항목 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Apology Text */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  고객 안심 및 사과 문구 (식품품질 표준 문구 템플릿)
                </label>
                <PhraseDropdown
                  fieldKey="apologyText"
                  currentValue={report.conclusion.apologyText}
                  pastContext={currentClaimContext}
                  activePresetId={selectedPresetId || undefined}
                  situationContext={{
                    claimType: report.customerClaim?.claimType || "이물",
                    investigationItem: "결론/사과",
                    resultType: "해당 없음",
                    usageLocation: "사과문",
                    relatedProductType: report.productInfo?.productType || "혼합음료",
                  }}
                  onSelectPhrase={(content) => updateConclusion({ apologyText: content })}
                  onOpenManager={onOpenPhraseManager}
                />
              </div>

              {/* 상황 기반 자동 추천 상용구 카드 */}
              <SituationPhraseRecommendationCard
                context={{
                  claimType: report.customerClaim?.claimType || "이물",
                  investigationItem: "결론/사과",
                  resultType: "해당 없음",
                  usageLocation: "사과문",
                  relatedProductType: report.productInfo?.productType || "혼합음료",
                }}
                currentValue={report.conclusion.apologyText}
                onApplySentence={(sentence) =>
                  updateConclusion({ apologyText: sentence })
                }
                onOpenPhraseManager={onOpenPhraseManager}
                fieldKey="apologyText"
              />

              <textarea
                id="field-conclusion-apology"
                rows={4}
                value={report.conclusion.apologyText}
                onChange={(e) => updateConclusion({ apologyText: e.target.value })}
                placeholder="다시 한번 당사 제품을 애용해 주시는 고객님께 불편을 드린 점에 대하여 진심으로 사과를 드립니다..."
                className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
              <InlinePhraseSuggest
                fieldKey="apologyText"
                currentText={report.conclusion.apologyText}
                activePresetId={selectedPresetId || undefined}
                onInsert={(finalText) => updateConclusion({ apologyText: finalText })}
              />

              {/* [요청 08] 내부용 이메일 vs 소비자용 안내문 명확 분리 안내 가이드 */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5 text-blue-950">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>내부용 이메일 vs 소비자용 안내문 작성 및 안전 표현 준수 규칙</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-800 leading-relaxed">
                  <li><strong>내부용 (CS/보고):</strong> 정밀 시험 수치, 여과망 Mesh 규격, 공정 이력 및 종합 원인 판정이 그대로 포함됩니다.</li>
                  <li><strong>소비자용 (직접 안내):</strong> 비전문가용 쉬운 용어로 순화되며, “인체에 무해하다/절대 안전하다”와 같은 근거 없는 단정 표현은 자동으로 차단·정제됩니다.</li>
                  <li>상단 <span className="font-bold underline text-blue-900">[이메일 회신]</span> 탭에서 각 항목별로 “소비자용에도 포함” 여부를 직접 켜고 끌 수 있습니다.</li>
                </ul>
              </div>
            </div>

            {/* Seal & Department Signature Controls */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">공문서 발신 및 직인/서명 설정</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={report.companyName}
                    onChange={(e) => onChange({ ...report, companyName: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    조사 및 발신 부서명
                  </label>
                  <input
                    type="text"
                    value={report.department || "식품품질경영팀"}
                    onChange={(e) => onChange({ ...report, department: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    * 조사는 언제나 식품품질경영팀에서 수행하며 보고서 및 메일 발신 주체로 표기됩니다.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    보고서 문서번호 (QM)
                  </label>
                  <input
                    type="text"
                    value={report.docNumber || "광동 QM 2026-C04"}
                    onChange={(e) => onChange({ ...report, docNumber: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    조사 담당 연구원 (식품품질경영팀)
                  </label>
                  <input
                    type="text"
                    value={report.researcherName ?? "담당 연구원 김진영 대리"}
                    onChange={(e) => onChange({ ...report, researcherName: e.target.value })}
                    placeholder="예: 담당 연구원 김진영 대리"
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    * 보고서 상단 조사자 및 커뮤니케이션팀 회신 메일 발신자로 표기됩니다.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    식품품질경영팀장 성명 (승인 서명본)
                  </label>
                  <input
                    type="text"
                    value={report.teamLeader || "신준호"}
                    onChange={(e) => onChange({ ...report, teamLeader: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    * 보고서 하단 공식 서명부: (주)광동제약 식품품질경영팀 팀장 {report.teamLeader ? report.teamLeader.replace(/팀장/g, "").trim() : "신준호"}
                  </span>
                  <label className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg cursor-pointer">
                    <input
                      id="field-hide-team-leader-sign"
                      type="checkbox"
                      checked={report.hideTeamLeaderSign === true}
                      onChange={(e) => onChange({ ...report, hideTeamLeaderSign: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      <span className="block text-xs font-bold text-slate-800">
                        경미한 클레임으로 팀장 서명란 생략
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        경미한 클레임 등 필요한 경우에만 선택하세요. 선택 시 A4 보고서에서 식품품질경영팀장 서명란이 제외됩니다.
                      </span>
                    </span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    직인 형태
                  </label>
                  <select
                    value={report.sealType}
                    onChange={(e) => onChange({ ...report, sealType: e.target.value as any })}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded"
                  >
                    <option value="seal">회사 공식 품질 도장(인감 직인)</option>
                    <option value="signature">팀장 영문/필기 서명 (Signature)</option>
                    <option value="none">도장 없음 (텍스트 성명만 표시)</option>
                  </select>
                </div>
              </div>
            </div>
            </div>

            {/* 조사 완료 및 향후 유사사례 지식화 (Knowledge Base 등록) 배너 */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                    클레임 조사 완료 및 향후 유사사례 지식화 (Knowledge Base)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-200 text-emerald-900">
                    재사용 지식 등록
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  이 클레임의 조사 항목·방법·공정·설비 및 승인된 원인 정보를 구조화된 <strong>Knowledge 데이터</strong>로 저장하여
                  향후 신규 클레임 조사 시 유사 사례로 자동 추천되고 조사 패키지로 재사용할 수 있습니다.
                  (기존 보고서 원본은 보관함에 온전히 보존됩니다)
                </p>
              </div>

              {onOpenCompleteKnowledge && (
                <button
                  type="button"
                  id="btn-conclusion-complete-knowledge"
                  onClick={onOpenCompleteKnowledge}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 border border-emerald-400 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>이 클레임 완료 및 지식화 등록</span>
                </button>
              )}
            </div>

            {/* 서브 섹션 B. 첨부 사진 및 회사 CI 로고 관리 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    B
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">증빙 사진 첨부 및 CI 로고 관리</h3>
                    <p className="text-xs text-slate-400">
                      보고서 상단 CI 로고 및 공문서 후단에 첨부될 정밀 분석 사진 등록
                    </p>
                  </div>
                </div>
              </div>

            {/* Company CI Logo Upload */}
            <CompanyLogoUploader
              currentLogoUrl={report.companyLogoUrl}
              onLogoChange={(url) => onChange({ ...report, companyLogoUrl: url })}
            />

            {/* 통합 첨부파일 관리 (유일한 등록 위치: 고객 제공·보관품·일반 첨부 신규 등록, 기존 첨부 2·3 보관분 관리) */}
            <UnifiedAttachmentManager report={report} onChange={onChange} />
          </div>
        </div>
      )}
    </div>

      {/* ======================================================== */}
      {/* [하단 고정 액션 바] [다음 필수 입력 →] 스마트 네비게이션 & 저장 */}
      {/* ======================================================== */}
      <div className="shrink-0 bg-white border-t border-slate-200/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-20">
        {/* 좌측: 이전/다음 단계 버튼 & 현재 단계 안내 (입력값 유지, 차단 없음) */}
        <div className="flex items-center gap-2">
          {currentStep !== "intake" && (
            <button
              type="button"
              id="btn-prev-workflow-step"
              onClick={handlePreviousStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              title="이전 단계로 이동 (입력값 유지)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>이전 단계</span>
            </button>
          )}
          {currentStep !== "review" && (
            <button
              type="button"
              id="btn-next-workflow-step"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              title="다음 단계로 이동 (입력값 유지, 미작성 있어도 이동 가능)"
            >
              <span>다음 단계</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-1 flex-wrap">
            <span className="text-xs font-bold text-slate-800">
              {currentStep === "intake" && "STEP 1. 접수/현품"}
              {currentStep === "investigate" && "STEP 2. 품질 조사"}
              {currentStep === "review" && "STEP 3. 보고서/회신"}
            </span>
            {nextRequiredAction.stepRemainingCount > 0 ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                현재 단계 미작성 {nextRequiredAction.stepRemainingCount}건
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                <span className="hidden sm:inline">현재 단계 필수 완료</span>
              </span>
            )}
            {/* 다음 필수 입력 안내 (기존 getNextRequiredAction 재사용, 이동은 기존 네비게이션 재사용) */}
            {!nextRequiredAction.isAllCompleted ? (
              <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <span>
                  다음 입력: <strong className="text-blue-700">{nextRequiredAction.actionLabel}</strong>
                </span>
                <button
                  type="button"
                  id="btn-goto-next-required"
                  onClick={handleNextRequiredNavigation}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-300 hover:border-blue-600 rounded-lg transition-all cursor-pointer"
                  title={`'${nextRequiredAction.actionLabel}' 입력 위치로 이동 (입력값 유지)`}
                >
                  <span>입력 위치로 이동</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>✓ 필수 입력 완료</span>
              </span>
            )}
          </div>
        </div>

        {/* 우측: 스마트 [다음 필수 입력 →] 메인 액션 버튼 */}
        <div className="flex items-center gap-2.5 ml-auto">
          {!nextRequiredAction.isAllCompleted && (
            <span className="hidden md:inline-flex text-[11px] text-slate-500 items-center gap-1">
              <span>남은 필수 항목:</span>
              <strong className="text-blue-700 font-bold">{nextRequiredAction.remainingCount}건</strong>
            </span>
          )}

          {onOpenCompleteKnowledge && (
            <button
              type="button"
              id="btn-bottom-complete-knowledge"
              onClick={onOpenCompleteKnowledge}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-xs transition-all active:scale-95 border border-emerald-400/50 cursor-pointer"
              title="조사 완료 처리 및 향후 유사사례 검색에 활용할 수 있도록 Knowledge 데이터로 연결"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>클레임 완료 & 지식화</span>
            </button>
          )}

          <button
            type="button"
            id="btn-next-required-action"
            onClick={handleNextRequiredNavigation}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 ${
              nextRequiredAction.isAllCompleted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300/60 shadow-emerald-200"
                : "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300/60 shadow-blue-200"
            }`}
            title={
              nextRequiredAction.isAllCompleted
                ? "모든 필수 항목이 완료되었습니다. 최종 보고서 사전 검증으로 이동합니다."
                : `다음에 작성해야 할 필수 항목('${nextRequiredAction.actionLabel}')으로 자동 이동합니다.`
            }
          >
            {nextRequiredAction.isAllCompleted ? (
              <Sparkles className="w-4 h-4 text-emerald-100" />
            ) : (
              <ArrowRight className="w-4 h-4 text-blue-100" />
            )}
            <span className="text-xs font-black tracking-tight">{nextRequiredAction.buttonText}</span>
          </button>
        </div>
      </div>

      {pendingMhtData && (
        <MhtReviewModal
          isOpen={isMhtReviewOpen}
          onClose={() => setIsMhtReviewOpen(false)}
          fileName={pendingMhtData.fileName}
          parsedData={pendingMhtData.parsed}
          currentReport={report}
          onApply={handleApplyApprovedMhtData}
        />
      )}

      {/* 제조공정도 템플릿 관리 모달 */}
      <FactoryProcessModal
        isOpen={isFactoryModalOpen}
        onClose={() => setIsFactoryModalOpen(false)}
        currentManufacturer={report.productInfo.manufacturer || ""}
        onApplyProcess={applyFactoryPreset}
      />

      {/* 과거 클레임 검색 모달 (내부 fallback) */}
      <PastClaimSearchModal
        isOpen={isInternalPastClaimOpen}
        onClose={() => setIsInternalPastClaimOpen(false)}
        currentReport={report}
        onCopyAsNewClaim={onCopyAsNewClaim}
        onUseAsInvestigationPackage={handleUseAsInvestigationPackage}
      />

      {/* 제품 Master 모달 (내부 fallback) */}
      <ProductMasterModal
        isOpen={isInternalProductModalOpen}
        onClose={() => setIsInternalProductModalOpen(false)}
        onSelectProduct={handleApplyProductFromMaster}
        selectedProductId={report.productInfo.productId}
        isSelectionMode={isInternalProductSelectionMode}
      />

      {/* 구조화 공정 Master 상세 조회 모달 */}
      <ProcessStepDetailModal
        isOpen={isFormStepModalOpen}
        onClose={() => setIsFormStepModalOpen(false)}
        step={selectedFormStep}
      />
    </div>
  );
}
