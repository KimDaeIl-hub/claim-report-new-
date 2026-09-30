import { useState, useEffect } from "react";
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
} from "lucide-react";
import { ReportData, PhysicochemicalItem, AdditionalTestItem, ClaimPreset, InvestigationStatus, InvestigationItemSelection, InvestigationResultsData } from "../types";
import { getAllPresets } from "../data/presets";
import { parseMhtFile, ParsedMhtClaimData } from "../utils/mhtParser";
import { mergePresetData, isUserPhoto } from "../utils/storage";
import { AiPolishButton } from "./AiPolishButton";
import { PhraseDropdown } from "./PhraseDropdown";
import { PhotoUploadField } from "./PhotoUploadField";
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
import { InvestigationDetailInputs } from "../types";
import { getUnexaminedInvestigationItems } from "../utils/investigationStatus";
import { validateReport } from "../utils/reportValidator";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { MhtReviewModal } from "./MhtReviewModal";
import { FactoryProcessModal } from "./FactoryProcessModal";
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

interface InputFormPaneProps {
  report: ReportData;
  onChange: (updated: ReportData) => void;
  onOpenPhraseManager: (fieldKey?: string) => void;
  onOpenPresetManager?: () => void;
  onOpenProcessManager?: () => void;
  onOpenValidation?: () => void;
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

  const [usePreset, setUsePreset] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<ClaimTypeCategory[]>(["foreign"]);
  const [showAllAnalysisItems, setShowAllAnalysisItems] = useState<boolean>(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState<boolean>(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);
  const [isStep1TypePresetOpen, setIsStep1TypePresetOpen] = useState<boolean>(false);
  const [isStep2FilterOpen, setIsStep2FilterOpen] = useState<boolean>(false);
  const [isUnexaminedWarningExpanded, setIsUnexaminedWarningExpanded] = useState<boolean>(false);
  const [mhtStatus, setMhtStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isDraggingMht, setIsDraggingMht] = useState(false);
  const [pendingMhtData, setPendingMhtData] = useState<{
    fileName: string;
    parsed: ParsedMhtClaimData;
  } | null>(null);
  const [isMhtReviewOpen, setIsMhtReviewOpen] = useState(false);
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
  const [factoryToast, setFactoryToast] = useState<string | null>(null);
  const [factoryPresets, setFactoryPresets] = useState<FactoryProcessPreset[]>(() => loadAllFactoryPresets());

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

  const updateAttachments = (patch: Partial<ReportData["attachments"]>) => {
    const newAttachments = { ...report.attachments, ...patch };
    const newLotHistory =
      patch.attachment2Photos !== undefined
        ? { ...report.lotHistory, retainedSamplePhotos: patch.attachment2Photos }
        : report.lotHistory;
    onChange({
      ...report,
      attachments: newAttachments,
      lotHistory: newLotHistory,
    });
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

  // 4단계 스마트 워크플로우 스텝 정의
  const WORKFLOW_STEPS = [
    {
      id: "basic",
      label: "Step 1. 기본정보",
      shortLabel: "1. 기본정보",
      desc: "접수 & 제품정보",
      icon: User,
    },
    {
      id: "investigation",
      label: "Step 2. 조사결과",
      shortLabel: "2. 조사결과",
      desc: "현품·공정·Lot이력",
      icon: Microscope,
    },
    {
      id: "cause",
      label: "Step 3. 원인 및 대책",
      shortLabel: "3. 원인/대책",
      desc: "원인판정·재발방지",
      icon: AlertOctagon,
    },
    {
      id: "conclusion",
      label: "Step 4. 결론 및 사진",
      shortLabel: "4. 결론/사진",
      desc: "요약·사과문·증빙사진",
      icon: FileCheck,
    },
  ];

  // 활성 탭 정규화
  const getNormalizedStep = (tabId: string): string => {
    if (tabId === "claim" || tabId === "product" || tabId === "basic") return "basic";
    if (tabId === "analysis" || tabId === "process" || tabId === "lot" || tabId === "investigation")
      return "investigation";
    if (tabId === "cause") return "cause";
    if (tabId === "conclusion" || tabId === "attachments") return "conclusion";
    return "basic";
  };

  const currentStep = getNormalizedStep(activeTab);
  const reportProgress = calculateReportProgress(report);

  // 스텝별 필수 미완료 통계 산출
  const stepStats = {
    basic: {
      unwritten: reportProgress.sections
        .filter((s) => s.sectionKey === "basic")
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
    investigation: {
      unwritten: reportProgress.sections
        .filter((s) => s.sectionKey === "analysis" || s.sectionKey === "process" || s.sectionKey === "lot")
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
    cause: {
      unwritten: reportProgress.sections
        .filter((s) => s.sectionKey === "cause")
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
    conclusion: {
      unwritten: reportProgress.sections
        .filter((s) => s.sectionKey === "conclusion")
        .flatMap((s) => s.items)
        .filter((i) => i.isRequired && (i.status === "미작성" || i.status === "작성중")).length,
    },
  };

  const getStepPhotoBadge = (stepId: string) => {
    if (stepId === "basic") {
      return (report.customerClaim.customerPhotos || []).filter(isUserPhoto).length;
    }
    if (stepId === "investigation") {
      return (report.lotHistory.retainedSamplePhotos || []).filter(isUserPhoto).length;
    }
    if (stepId === "conclusion") {
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

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* ======================================================== */}
      {/* [1열] 상단 4단계 스텝 네비게이션 & 진행률 & 사전 검증 (항상 노출) */}
      {/* ======================================================== */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs">
        {/* 데스크톱/태블릿: 4단계 스텝 바 (균등 4분할) */}
        <div className="hidden sm:grid grid-cols-4 gap-1.5 flex-1 max-w-3xl">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const unwritten = stepStats[step.id as keyof typeof stepStats]?.unwritten ?? 0;
            const photoCount = getStepPhotoBadge(step.id);
            const isCompleted = unwritten === 0;

            return (
              <button
                key={step.id}
                type="button"
                id={`step-btn-${step.id}`}
                onClick={() => setActiveTab(step.id)}
                className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/20"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isCompleted
                        ? "bg-emerald-100 text-emerald-800"
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
                  {isCompleted ? (
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
                      title={`미작성 필수 항목 ${unwritten}건`}
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
        {/* ======================================================== */}
        {/* [Step 1] 기본정보 (1. 클레임 접수 + 2. 대상 제품 정보 통합) */}
        {/* ======================================================== */}
        {(currentStep === "basic" || activeTab === "claim" || activeTab === "product") && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* 섹션 1. 클레임 접수 및 고객 정보 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">클레임 접수 및 고객 정보</h3>
                </div>
                <span className="text-xs text-slate-400">불만 인입 경위 및 고객 정보 기재</span>
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

            {/* [그룹웨어 .mht 파일 자동 입력 드롭존] */}
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
              className={`p-3.5 rounded-xl border-2 border-dashed transition-all ${
                isDraggingMht
                  ? "border-blue-500 bg-blue-50/70"
                  : "border-blue-300 bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/40 hover:border-blue-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        그룹웨어 클레임 보고서(.mht) 파일 자동 입력
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        원클릭 파싱
                      </span>
                    </div>
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
                  onChange={(e) => updateProductInfo({ productName: e.target.value })}
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
              <PhotoUploadField
                label="고객 접수 사진 (인입 시 전달받은 사진)"
                photos={report.customerClaim.customerPhotos || []}
                onChange={(photos) => updateCustomerClaim({ customerPhotos: photos })}
                maxPhotos={3}
              />
            </div>
            </div>

            {/* 섹션 2. 접수 대상 제품 정보 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">접수 대상 제품 정보</h3>
                </div>
                <span className="text-xs text-slate-400">제품 라벨 및 생산 이력 식별 번호</span>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <span>제품명 (규격/용량 포함)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                    필수
                  </span>
                </label>
                <input
                  id="field-product-name"
                  type="text"
                  value={report.productInfo.productName}
                  onChange={(e) => updateProductInfo({ productName: e.target.value })}
                  placeholder="예: 유기농 프리미엄 콤부차 오리지널 350ml"
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
                  value={report.productInfo.lotNumber}
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
                  >
                    <Workflow className="w-3.5 h-3.5" />
                    <span>제조공정도 관리 / 템플릿</span>
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
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    최종 표기 제조처명 (공문서 및 보고서 출력용, 직접 수정 가능):
                  </label>
                  <input
                    id="field-manufacturer"
                    type="text"
                    value={report.productInfo.manufacturer}
                    onChange={(e) => updateProductInfo({ manufacturer: e.target.value })}
                    placeholder="예: 삼양패키징 광혜원공장 / 광동제약 식품팀 등"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * 위 제조처를 선택하면 조사결과 탭의 <strong>'제조공정 분석(흐름도, 여과망 규격, 세척·살균, 관리점)'</strong> 텍스트가 자동으로 채워집니다. (클레임별 강조 지점은 보존)
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* [Step 2] 조사결과 (정밀 과학 분석 + 제조공정 + 동일 Lot 이력 통합) */}
        {/* ======================================================== */}
        {(currentStep === "investigation" ||
          activeTab === "analysis" ||
          activeTab === "process" ||
          activeTab === "lot") && (
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

            {/* 클레임 유형별 맞춤 조사 항목 필터 바 (기본 접힘: 필요 시에만 펼쳐서 세부 조정) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80 transition-all">
              <div className="px-3.5 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 shrink-0">
                    맞춤 조사 항목 필터 설정
                  </span>
                  <span className="text-[11px] text-slate-500 truncate hidden md:inline">
                    (현재 적용 유형: <strong className="text-slate-700">{selectedClaimTypes.join(", ")}</strong> / {showAllAnalysisItems ? "전체 항목 표시 중" : "유형 맞춤 항목만 표시"})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStep2FilterOpen(!isStep2FilterOpen)}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                    isStep2FilterOpen
                      ? "bg-slate-800 text-white"
                      : "bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                  }`}
                >
                  <span>{isStep2FilterOpen ? "필터 접기 ▴" : "항목 필터 설정 ▾"}</span>
                </button>
              </div>

              {isStep2FilterOpen && (
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        외관 성상 및 잔여량 특이사항
                      </label>
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

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenProcessManager) {
                          onOpenProcessManager();
                        } else {
                          setIsFactoryModalOpen(true);
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Workflow className="w-3.5 h-3.5" />
                      <span>제조공정도 템플릿 관리 / 선택</span>
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
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      제조공정 조사 내용 (자유 수정 가능)
                    </label>
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
                        activePresetId={selectedPresetId || undefined}
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
                        activePresetId={selectedPresetId || undefined}
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
                        activePresetId={selectedPresetId || undefined}
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
                      activePresetId={selectedPresetId || undefined}
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
                        activePresetId={selectedPresetId || undefined}
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
                  </div>
                </div>

                <div id="field-lot-retained-photos">
                  <PhotoUploadField
                    label="동일 Lot 공장 보관품 사진 첨부 (보고서 5번 항목 및 첨부문서에 자동 반영)"
                    photos={report.lotHistory.retainedSamplePhotos}
                    onChange={(photos) => updateLotHistory({ retainedSamplePhotos: photos })}
                    maxPhotos={4}
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
                        activePresetId={selectedPresetId || undefined}
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
        {/* [Step 3] 원인 및 대책 (종합 원인 판정 및 재발방지대책) */}
        {/* ======================================================== */}
        {(currentStep === "cause" || activeTab === "cause") && (
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
                        activePresetId={selectedPresetId || undefined}
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
                  <textarea
                    id="field-root-cause"
                    rows={3}
                    value={report.rootCauseAndActions.rootCause}
                    onChange={(e) => updateRootCause({ rootCause: e.target.value })}
                    placeholder="예: 충진기 밸브 노즐 내 EPDM 고무 패킹의 누적 마찰 마모로 인하여 미세 조각 1점이 충진 시 박리 탈락되어 혼입된 것으로 최종 판정됨."
                    className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-semibold text-slate-900"
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
                          fieldKey="preventiveMeasures"
                          activePresetId={selectedPresetId || undefined}
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
        {/* [Step 4] 결론 및 사진 (요약, 사과문, 직인 설정, 증빙 사진 통합) */}
        {/* ======================================================== */}
        {(currentStep === "conclusion" ||
          activeTab === "conclusion" ||
          activeTab === "attachments") && (
          <div className="space-y-6 animate-in fade-in duration-100">
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
                  activePresetId={selectedPresetId || undefined}
                  onSelectPhrase={(content) => updateConclusion({ apologyText: content })}
                  onOpenManager={onOpenPhraseManager}
                />
              </div>
              <textarea
                id="field-conclusion-apology"
                rows={4}
                value={report.conclusion.apologyText}
                onChange={(e) => updateConclusion({ apologyText: e.target.value })}
                placeholder="다시 한번 당사 제품을 애용해 주시는 고객님께 불편을 드린 점에 대하여 진심으로 사과를 드립니다..."
                className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
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

            <div id="field-attachment-1" className="space-y-1.5 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  [첨부 1] 첨부문서 명칭 (수정 가능):
                </label>
                <input
                  type="text"
                  value={report.attachments.attachment1Title || "[첨부 1] 현품 외관, 이물 확대 및 FT-IR 스펙트럼 그래프 사진"}
                  onChange={(e) => updateAttachments({ attachment1Title: e.target.value })}
                  placeholder="예: [첨부 1] 현품 외관, 이물 확대 및 FT-IR 스펙트럼 그래프 사진"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
              </div>
              <PhotoUploadField
                label="증빙 사진 등록 (개별 사진 파일명/캡션 수정 가능)"
                photos={report.attachments.attachment1Photos}
                onChange={(photos) => updateAttachments({ attachment1Photos: photos })}
                maxPhotos={4}
              />
            </div>

            {/* Attachment 2: Lot History Photo (Directly manageable in Step 4) */}
            <div id="field-attachment-2" className="space-y-1.5 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  [첨부 2] 첨부문서 명칭 (수정 가능):
                </label>
                <input
                  type="text"
                  value={report.attachments.attachment2Title || "[첨부 2] 동일 Lot 공장 보관품 사진"}
                  onChange={(e) => updateAttachments({ attachment2Title: e.target.value })}
                  placeholder="예: [첨부 2] 동일 Lot 공장 보관품 사진"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
              </div>
              <PhotoUploadField
                label="보관품 사진 등록 (개별 사진 파일명/캡션 수정 가능)"
                photos={
                  (report.attachments.attachment2Photos && report.attachments.attachment2Photos.length > 0)
                    ? report.attachments.attachment2Photos
                    : (report.lotHistory.retainedSamplePhotos || [])
                }
                onChange={(photos) => {
                  updateAttachments({ attachment2Photos: photos });
                }}
                maxPhotos={4}
              />
              <p className="text-[11px] text-slate-500 pl-1">
                * 등록된 사진 및 수정한 파일명/캡션은 본문 <strong>'5. 동일 Lot 이력'</strong> 및 후단 <strong>'첨부 2'</strong>에 자동 연동됩니다.
              </p>
            </div>

            <div id="field-attachment-3" className="space-y-1.5 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  [첨부 3] 첨부문서 명칭 (수정 가능):
                </label>
                <input
                  type="text"
                  value={report.attachments.attachment3Title || "[첨부 3] 주요 제조공정 사진 그리드 (단계별 공정명과 캡션 입력)"}
                  onChange={(e) => updateAttachments({ attachment3Title: e.target.value })}
                  placeholder="예: [첨부 3] 주요 제조공정 사진 그리드"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
              </div>
              <PhotoUploadField
                label="공정 사진 등록 (단계별 공정명과 캡션/파일명 입력)"
                photos={report.attachments.attachment3Photos}
                onChange={(photos) => updateAttachments({ attachment3Photos: photos })}
                maxPhotos={4}
                withStepName={true}
              />
            </div>
          </div>
        </div>
      )}
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
    </div>
  );
}
