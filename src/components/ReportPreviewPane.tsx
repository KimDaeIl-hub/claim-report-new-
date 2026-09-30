import React, { useState } from "react";
import {
  Printer,
  Mail,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ShieldCheck,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowLeft,
  FlaskConical,
  Sparkles,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { ReportData, PhotoAttachment, ProcessStepMaster } from "../types";
import { maskCustomerName } from "../utils/masking";
import { getLevel1Number, getLevel2Char } from "../utils/numbering";
import { KwangdongLogo } from "./KwangdongLogo";
import {
  getSafeInvestigationText,
  resolveItemStatus,
  getInvestigationStatusBadgeStyle,
  getUnexaminedInvestigationItems,
} from "../utils/investigationStatus";
import { loadAllProcessSteps } from "../data/processStepMaster";
import { ProcessStepDetailModal } from "./ProcessStepDetailModal";

interface ReportPreviewPaneProps {
  report: ReportData;
  onOpenPreflight?: () => void;
  onOpenCsEmail: () => void;
  onPrint: () => void;
  onSwitchToForm?: () => void;
  onSwitchToEmail?: () => void;
  onUpdateReport?: (updated: ReportData) => void;
}

export function ReportPreviewPane({
  report,
  onOpenCsEmail,
  onPrint,
  onSwitchToForm,
  onSwitchToEmail,
  onUpdateReport,
}: ReportPreviewPaneProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState("");

  // Process Step Detail Modal state
  const [selectedStepForDetail, setSelectedStepForDetail] = useState<ProcessStepMaster | null>(null);
  const [isStepDetailOpen, setIsStepDetailOpen] = useState(false);

  const handleStepClick = (stepName: string, stepIdx: number) => {
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
        id: `step-report-${stepIdx + 1}`,
        stepNumber: stepIdx + 1,
        manufacturer: report.productInfo?.manufacturer || "광동제약",
        manufactureLine: report.productInfo?.manufactureLine || "표준 생산라인",
        processName: stepName,
        description: `${report.productInfo?.manufacturer || "광동제약"}의 ${stepIdx + 1}번째 제조공정인 '${stepName}' 단계입니다.`,
        keyEquipment: "표준 제조 자동화 설비",
        controlPoints: "표준 공정 작업 기준서(SOP) 준수",
        isCCP: stepName.includes("살균") || stepName.includes("금속") || stepName.includes("UHT"),
        ccpNumber: stepName.includes("살균") || stepName.includes("UHT") ? "CCP-1B" : stepName.includes("금속") ? "CCP-2P" : undefined,
        qualityRisks: "공정 관리 기준 준수 및 외래 이물 혼입 차단",
        possibleDefects: ["품질 이상"],
        isActive: true,
      };
    }
    setSelectedStepForDetail(match);
    setIsStepDetailOpen(true);
  };

  const handleSavePhotoCaption = (photoId: string, newCaption: string) => {
    if (!onUpdateReport) return;
    const trimmed = newCaption.trim();

    const updateList = (list: PhotoAttachment[] = []) =>
      list.map((p) => (p.id === photoId ? { ...p, caption: trimmed } : p));

    const updatedCustomerPhotos = updateList(report.customerClaim.customerPhotos);
    const updatedRetained = updateList(report.lotHistory.retainedSamplePhotos);
    const updatedAtt1 = updateList(report.attachments?.attachment1Photos || []);
    const updatedAtt2 = updateList(report.attachments?.attachment2Photos || []);
    const updatedAtt3 = updateList(report.attachments?.attachment3Photos || []);

    const isRetainedMatch = (report.lotHistory.retainedSamplePhotos || []).some((p) => p.id === photoId);
    const isAtt2Match = (report.attachments?.attachment2Photos || []).some((p) => p.id === photoId);

    const finalRetained = isAtt2Match ? updatedAtt2 : updatedRetained;
    const finalAtt2 = isRetainedMatch ? updatedRetained : updatedAtt2;

    onUpdateReport({
      ...report,
      customerClaim: {
        ...report.customerClaim,
        customerPhotos: updatedCustomerPhotos,
      },
      lotHistory: {
        ...report.lotHistory,
        retainedSamplePhotos: finalRetained,
      },
      attachments: {
        ...(report.attachments || { attachment1Photos: [], attachment2Photos: [], attachment3Photos: [] }),
        attachment1Photos: updatedAtt1,
        attachment2Photos: finalAtt2,
        attachment3Photos: updatedAtt3,
      },
    });
    setEditingPhotoId(null);
  };

  const renderEditableCaption = (p: PhotoAttachment, fallback: string, stepPrefix?: string) => {
    if (editingPhotoId === p.id) {
      return (
        <div className="flex items-center gap-1 mt-1 px-1">
          <input
            type="text"
            value={editingCaptionText}
            onChange={(e) => setEditingCaptionText(e.target.value)}
            placeholder="첨부파일명 입력"
            className="w-full text-[11px] px-1.5 py-0.5 border border-blue-400 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSavePhotoCaption(p.id, editingCaptionText);
              if (e.key === "Escape") setEditingPhotoId(null);
            }}
          />
          <button
            type="button"
            onClick={() => handleSavePhotoCaption(p.id, editingCaptionText)}
            className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shrink-0"
          >
            저장
          </button>
        </div>
      );
    }
    return (
      <p
        onClick={() => {
          if (onUpdateReport) {
            setEditingPhotoId(p.id);
            setEditingCaptionText(p.caption || fallback);
          }
        }}
        title={onUpdateReport ? "클릭하여 첨부파일명/캡션 수정" : undefined}
        className={`text-[11px] text-slate-700 font-medium mt-1 truncate flex items-center justify-center gap-1 ${
          onUpdateReport ? "cursor-pointer hover:text-blue-600 group/caption" : ""
        }`}
      >
        <span>
          {stepPrefix ? `[${stepPrefix}] ` : ""}
          {p.caption || fallback}
        </span>
        {onUpdateReport && (
          <Edit3 className="w-2.5 h-2.5 text-blue-500 opacity-0 group-hover/caption:opacity-100 shrink-0 transition-opacity" />
        )}
      </p>
    );
  };

  const unexaminedItems = getUnexaminedInvestigationItems(report);

  // 안전성 및 보관품 안전 데이터 계산
  const retainedInfo = getSafeInvestigationText(
    report.lotHistory.retainedSampleStatus,
    report.lotHistory.retainedSampleCheck,
    { skipped: report.lotHistory.skipped, investigatedFallback: "동일 Lot 보관품 이상 없음" }
  );

  const isMicrobialTested =
    !report.analysisResults.physicochemicalAnalysis.skipped &&
    report.analysisResults.physicochemicalAnalysis.items.some((i) =>
      i.name.includes("대장균") || i.name.includes("미생물") || i.name.includes("세균") || i.name.includes("독소")
    );
  const hasSafetyEvidence =
    retainedInfo.isNormal ||
    (!report.analysisResults.physicochemicalAnalysis.skipped &&
      report.analysisResults.physicochemicalAnalysis.status === "이상 없음" &&
      isMicrobialTested);

  const effectiveLogoUrl =
    report.companyLogoUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("food_qc_custom_company_logo") || ""
      : "");

  const hasAnalysisItems =
    !report.analysisResults.visualInspection.skipped ||
    !report.analysisResults.magnifierInspection.skipped ||
    !report.analysisResults.opticalMicroscope.skipped ||
    !report.analysisResults.ftirAnalysis.skipped ||
    !report.analysisResults.xrfAnalysis.skipped ||
    !report.analysisResults.physicochemicalAnalysis.skipped ||
    !report.analysisResults.catalaseTest.skipped ||
    (report.analysisResults.additionalTests || []).some((t) => !t.skipped);

  // Collect active top-level sections in order
  const activeSections: Array<{ key: string; title: string }> = [
    { key: "claim_overview", title: "클레임 접수 개요 및 현황" },
    { key: "product_info", title: "접수 대상 제품 정보" },
  ];

  if (hasAnalysisItems) {
    activeSections.push({ key: "scientific_analysis", title: "정밀 과학 분석 결과" });
  }

  if (!report.manufacturingProcess.skipped) {
    activeSections.push({ key: "manufacturing_process", title: "제조공정 점검 및 관리 포인트" });
  }

  if (!report.lotHistory.skipped) {
    activeSections.push({ key: "lot_history", title: "동일 제조번호(Lot) 품질검사 이력" });
  }

  if (!report.rootCauseAndActions.skipped) {
    activeSections.push({ key: "root_cause", title: "종합 원인 판정 및 재발방지대책" });
  }

  activeSections.push({ key: "conclusion", title: "조사 결론 및 고객 안내" });

  // Only photos actually attached by the user (exclude placeholder/unsplash URLs or empty strings)
  const isUserPhoto = (p: any) =>
    Boolean(
      p &&
      typeof p.url === "string" &&
      p.url.trim() !== "" &&
      !p.url.includes("unsplash.com") &&
      !p.url.includes("placeholder")
    );

  const customerPhotos = (report.customerClaim?.customerPhotos || []).filter(isUserPhoto);
  const att1Photos = (report.attachments?.attachment1Photos || []).filter(isUserPhoto);
  const att2Photos = (
    (report.lotHistory?.retainedSamplePhotos && report.lotHistory.retainedSamplePhotos.length > 0)
      ? report.lotHistory.retainedSamplePhotos
      : (report.attachments?.attachment2Photos || [])
  ).filter(isUserPhoto);
  const att3Photos = (report.attachments?.attachment3Photos || []).filter(isUserPhoto);
  const hasAttachments = customerPhotos.length > 0 || att1Photos.length > 0 || att2Photos.length > 0 || att3Photos.length > 0;

  if (hasAttachments) {
    activeSections.push({ key: "attachments", title: "첨부 문서 (현품, 스펙트럼 및 공정 사진)" });
  }

  const getSectionNumber = (key: string) => {
    const idx = activeSections.findIndex((s) => s.key === key);
    return idx >= 0 ? getLevel1Number(idx) : "";
  };

  // Sub-items for Scientific Analysis: Re-indexing
  const activeAnalysisSubs: Array<{
    type: string;
    label: string;
  }> = [];

  const ar = report.analysisResults;
  if (!ar.visualInspection.skipped) {
    activeAnalysisSubs.push({ type: "visual", label: "현품 외관 및 이물 육안 확인 결과" });
  }
  if (!ar.magnifierInspection.skipped) {
    activeAnalysisSubs.push({ type: "magnifier", label: "확대경 정밀 관찰 소견" });
  }
  if (!ar.opticalMicroscope.skipped) {
    activeAnalysisSubs.push({ type: "microscope", label: "광학 현미경 미세조직 분석" });
  }
  if (!ar.ftirAnalysis.skipped) {
    activeAnalysisSubs.push({ type: "ftir", label: "FT-IR(적외선 분광분석) 정성 분석" });
  }
  if (!ar.xrfAnalysis.skipped) {
    activeAnalysisSubs.push({ type: "xrf", label: "XRF(X선 형광분석) 무기원소 분석" });
  }
  if (!ar.physicochemicalAnalysis.skipped) {
    activeAnalysisSubs.push({ type: "physicochemical", label: "이화학적 특성 비교 분석 (pH, 산도 등)" });
  }
  if (!ar.catalaseTest.skipped) {
    activeAnalysisSubs.push({ type: "catalase", label: "카탈라아제(Catalase) 효소 활성 시험" });
  }
  (ar.additionalTests || []).forEach((t) => {
    if (!t.skipped) {
      activeAnalysisSubs.push({ type: `add_${t.id}`, label: t.title });
    }
  });

  const getAnalysisSubChar = (type: string) => {
    const idx = activeAnalysisSubs.findIndex((s) => s.type === type);
    return idx >= 0 ? getLevel2Char(idx) : "";
  };

  const displayName = maskCustomerName(
    report.customerClaim.customerName,
    report.customerClaim.maskCustomerName
  );

  const formatKoreanDate = (dateStr: string) => {
    if (!dateStr) return "2026 년 6 월 22 일";
    if (dateStr.includes("년")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[0]} 년 ${parseInt(parts[1], 10)} 월 ${parseInt(parts[2], 10)} 일`;
    }
    return dateStr;
  };

  const companyTitle = report.companyName || "광동제약주식회사";

  return (
    <div className="flex flex-col h-full bg-slate-200/80">
      {/* Top Action Ribbon (No-print) */}
      <div className="no-print shrink-0 bg-white border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs z-10">
        <div className="flex items-center gap-2">
          {onSwitchToForm && (
            <button
              type="button"
              onClick={onSwitchToForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>작성 폼으로</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
            <FileText className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-slate-800">A4 정식 보고서 (소비자 통보용)</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-semibold text-slate-700 min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 130))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
              title="100% 원본 크기"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-email-reply"
            onClick={onSwitchToEmail || onOpenCsEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors"
            title="이메일 회신문 보기 및 복사"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>이메일 회신</span>
          </button>

          {/* Direct new-tab print link */}
          <a
            href={`/?print=true&t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-2xs transition-colors"
            title="새 브라우저 탭에서 고해상도 A4 인쇄 / PDF 저장"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새 창에서 인쇄</span>
          </a>

          <button
            type="button"
            id="btn-print-pdf"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-lg shadow-sm transition-all"
            title="A4 인쇄 및 PDF 다운로드 옵션 열기"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* Warning banner for unexamined items (Screen only) */}
      {unexaminedItems.length > 0 && (
        <div
          id="report-pane-unexamined-warning"
          className="max-w-4xl w-full mx-auto mt-4 px-4 py-3 bg-amber-50 border-2 border-amber-400 rounded-xl shadow-xs print:hidden"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-black bg-amber-600 text-white">
                  [주의]
                </span>
                <span className="font-bold text-amber-950 text-sm">
                  조사 미실시 / 미입력 항목 {unexaminedItems.length}건 감지
                </span>
              </div>
              <p className="text-amber-800">
                조사되지 않은 항목은 보고서 및 요약란에 임의로 “이상 없음”, “안전함”, “외적 요인” 등으로 허위 생성되지 않습니다.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {unexaminedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 font-medium"
                  >
                    <span>{item.section}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold">{item.itemName}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800">
                      {item.status}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A4 Document Stage Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-[210mm] transition-all"
        >
          {/* A4 Document Sheet */}
          <div
            id="printable-report"
            className="relative bg-white text-slate-900 shadow-xl border border-slate-300/80 p-8 sm:p-12 min-h-[297mm] flex flex-col justify-between"
          >
            {/* CONFIDENTIAL Watermark */}
            <div className="confidential-watermark">
              <div className="confidential-watermark-text">CONFIDENTIAL</div>
            </div>

            {/* Document Content */}
            <div className="relative z-10 space-y-6">
              {/* Official Header matching Kwangdong CI standard */}
              <div className="pb-1">
                {/* CI Logo & Company Header */}
                <div className="flex flex-col items-center justify-center pt-1 pb-2">
                  <KwangdongLogo size="md" className="h-9 sm:h-11" logoUrl={effectiveLogoUrl} />
                </div>

                {/* Company Address and Contact */}
                <div className="text-center text-[10.5px] text-slate-600 font-medium tracking-tight mb-2">
                  {report.companyAddress || "우 17784 경기도 평택시 경기대로 1081 광동제약㈜"} /{" "}
                  {report.companyTel || "전화(031)8093-1813"} / {report.companyFax || "FAX (031)668-8365"}
                  {report.researcherName && !report.researcherName.includes("박병철") ? (
                    <span className="font-semibold text-slate-700">
                      {" "}
                      /{" "}
                      {report.researcherName.startsWith("담당")
                        ? report.researcherName
                        : `담당 연구원 ${report.researcherName}`}
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-700"> / 담당 연구원 김진영 대리</span>
                  )}
                </div>

                {/* Double Border Rule */}
                <div className="border-b-[3px] border-double border-slate-900 my-2" />

                {/* Metadata Table */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-900 font-medium my-3 pl-1 bg-slate-50/70 p-2.5 rounded border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="w-20 font-bold text-slate-800">문서번호 :</span>
                      <span className="font-mono font-semibold">
                        {report.docNumber?.startsWith("커뮤니케이션팀:")
                          ? report.docNumber.replace(/^커뮤니케이션팀:/, "광동 QM ")
                          : report.docNumber || "광동 QM 2026-C04"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-20 font-bold text-slate-800">발행일자 :</span>
                      <span>{formatKoreanDate(report.issueDate)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="w-20 font-bold text-slate-800">수 &nbsp; &nbsp; 신 :</span>
                      <span className="font-bold text-slate-950">{displayName} 고객님</span>
                    </div>
                    <div className="flex">
                      <span className="w-20 font-bold text-slate-800">조사부서 :</span>
                      <span className="font-bold text-slate-900">식품품질경영팀</span>
                    </div>
                  </div>
                </div>

                {/* Document Title Banner */}
                <div className="py-2.5 px-3 bg-slate-900 text-white rounded flex items-baseline gap-2 mb-4 shadow-2xs">
                  <span className="text-xs font-bold tracking-wider text-slate-300 shrink-0">
                    제 &nbsp; 목 :
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {report.title ? (report.title.startsWith("“") || report.title.startsWith('"') ? report.title : `“${report.title}”`) : `“${report.productInfo.productName || "아이스웨일 플레인"}” 소비자 클레임 발생에 따른 조사 보고의 건.`}
                  </span>
                </div>

                {/* Formal Polite Greeting Opening */}
                <div className="text-xs text-slate-800 leading-relaxed space-y-1 pl-1">
                  <p className="font-semibold text-slate-900">
                    항상 저희 광동제약 제품을 애용해 주셔서 진심으로 감사드립니다.
                  </p>
                  <p>
                    당사 제품과 관련하여 고객께서 문의해 주신 사항에 대하여, 당사 식품품질경영팀에서 해당 제품의 동일 제조번호 제조 이력 점검 및 공인 시험 장비를 통한 정밀 과학 분석을 실시하였습니다. 이에 대한 조사 결과와 안전성 검증 내용을 아래와 같이 정중히 안내해 드립니다.
                  </p>
                </div>

                {/* Centered "- 아 래 -" */}
                <div className="text-center font-bold text-xs tracking-[0.6em] text-slate-900 mt-5 mb-2">
                  - 아 &nbsp; 래 -
                </div>
              </div>

              {/* [1] 클레임 접수 개요 */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                  <span>{getSectionNumber("claim_overview")} 클레임 접수 개요 및 현황</span>
                  <span className="text-[10px] font-normal text-slate-500">[관리 구분: 대외 고객 불만 접수]</span>
                </h2>
                <div className="overflow-hidden border border-slate-300 rounded text-xs">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <th className="w-28 bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          클레임 접수일자
                        </th>
                        <td className="p-2 text-slate-900 font-mono">
                          {report.customerClaim.receivedAt ? report.customerClaim.receivedAt.split("T")[0] : "-"}
                        </td>
                        <th className="w-28 bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          현품 접수일자
                        </th>
                        <td className="p-2 text-slate-900 font-mono">
                          {report.customerClaim.sampleReceivedDate || "-"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          고객 성명 / 상호
                        </th>
                        <td className="p-2 text-slate-900 font-bold">{displayName}</td>
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          접수 채널
                        </th>
                        <td className="p-2 text-slate-900">{report.customerClaim.channel}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200 align-top">
                          고객 접수 내용
                        </th>
                        <td colSpan={3} className="p-2 text-slate-900 leading-relaxed font-normal">
                          {report.customerClaim.claimDetails}
                        </td>
                      </tr>
                      {customerPhotos.length > 0 && (
                        <tr className="border-t border-slate-200">
                          <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200 align-top">
                            고객 인입 사진
                            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                              (접수 시 전달받은 사진)
                            </span>
                          </th>
                          <td colSpan={3} className="p-2 text-slate-900">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {customerPhotos.map((p, idx) => (
                                <div
                                  key={p.id || idx}
                                  className="border border-slate-300 rounded p-1.5 bg-white text-center shadow-2xs"
                                >
                                  <img
                                    src={p.url}
                                    alt={p.caption || `고객 접수 사진 ${idx + 1}`}
                                    className="w-full h-28 sm:h-32 object-contain bg-slate-50 rounded"
                                  />
                                  <p className="text-[11px] text-slate-700 font-medium mt-1 truncate">
                                    {p.caption || `고객 접수 사진 #${idx + 1}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* [2] 제품 정보 */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1">
                  {getSectionNumber("product_info")} 접수 대상 제품 및 제조 정보
                </h2>
                <div className="overflow-hidden border border-slate-300 rounded text-xs">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <th className="w-28 bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          제 품 명
                        </th>
                        <td className="p-2 font-bold text-slate-950">
                          {report.productInfo.productName}
                        </td>
                        <th className="w-24 bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          제조번호(Lot)
                        </th>
                        <td className="p-2 font-mono font-bold text-red-700">
                          {report.productInfo.lotNumber}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          제조일자
                        </th>
                        <td className="p-2 font-mono text-slate-900">{report.productInfo.manufactureDate}</td>
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          소비기한
                        </th>
                        <td className="p-2 font-mono text-slate-900">{report.productInfo.expiryDate}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          제조 공장
                        </th>
                        <td className="p-2 text-slate-900">{report.productInfo.manufacturer}</td>
                        <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                          포장 형태
                        </th>
                        <td className="p-2 text-slate-900">{report.productInfo.packageType}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* [3] 정밀 과학 분석 결과 - High Readability & Consumer Friendly Card System */}
              {hasAnalysisItems && (
                <section className="space-y-2.5 print-avoid-break">
                  <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1 flex items-center justify-between">
                    <span>{getSectionNumber("scientific_analysis")} 정밀 과학 분석 결과</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      [공인 시험 장비 및 과학적 규명]
                    </span>
                  </h2>

                  <div className="space-y-2.5 text-xs">
                    {/* Visual Inspection Card */}
                    {!ar.visualInspection.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                              {getAnalysisSubChar("visual")}
                            </span>
                            <span>현품 외관 및 이물 육안 확인 결과</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.visualInspection.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.visualInspection.status
                                )}`}
                              >
                                {ar.visualInspection.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                              공인 표준광원 D65 관능 검사
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-slate-800 leading-relaxed pl-1">
                          <p>
                            <strong className="text-slate-900">· 회수 현품 잔여량 및 성상:</strong>{" "}
                            {
                              getSafeInvestigationText(
                                ar.visualInspection.status,
                                ar.visualInspection.sampleCondition,
                                { skipped: ar.visualInspection.skipped, investigatedFallback: "특이사항 없음" }
                              ).displayText
                            }
                          </p>
                          {ar.visualInspection.foreignObjectAppearance && (
                            <p>
                              <strong className="text-slate-900">· 이물 외형 관찰 소견:</strong>{" "}
                              {ar.visualInspection.foreignObjectAppearance}
                            </p>
                          )}
                        </div>

                        {ar.visualInspection.includePrinciple && ar.visualInspection.principleText && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.visualInspection.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Magnifier Inspection Card */}
                    {!ar.magnifierInspection.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                              {getAnalysisSubChar("magnifier")}
                            </span>
                            <span>확대경 정밀 조사 결과 ({ar.magnifierInspection.magnification || "정밀 관찰"})</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.magnifierInspection.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.magnifierInspection.status
                                )}`}
                              >
                                {ar.magnifierInspection.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                              정밀 광학 렌즈계 표면 분석
                            </span>
                          </div>
                        </div>
                        <div className="text-slate-800 leading-relaxed pl-1">
                          <p>
                            <strong className="text-slate-900">· 관찰 소견:</strong>{" "}
                            {
                              getSafeInvestigationText(
                                ar.magnifierInspection.status,
                                ar.magnifierInspection.result,
                                { skipped: ar.magnifierInspection.skipped, investigatedFallback: "특이사항 없음" }
                              ).displayText
                            }
                          </p>
                        </div>

                        {ar.magnifierInspection.includePrinciple && ar.magnifierInspection.principleText && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.magnifierInspection.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optical Microscope Card */}
                    {!ar.opticalMicroscope.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                              {getAnalysisSubChar("microscope")}
                            </span>
                            <span>광학 현미경 미세조직 분석 ({ar.opticalMicroscope.magnification || "고배율 관찰"})</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.opticalMicroscope.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.opticalMicroscope.status
                                )}`}
                              >
                                {ar.opticalMicroscope.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                              Optical Microscopy (200x)
                            </span>
                          </div>
                        </div>
                        <div className="text-slate-800 leading-relaxed pl-1">
                          <p>
                            <strong className="text-slate-900">· 미세조직 소견:</strong>{" "}
                            {
                              getSafeInvestigationText(
                                ar.opticalMicroscope.status,
                                ar.opticalMicroscope.result,
                                { skipped: ar.opticalMicroscope.skipped, investigatedFallback: "특이사항 없음" }
                              ).displayText
                            }
                          </p>
                        </div>

                        {ar.opticalMicroscope.includePrinciple && ar.opticalMicroscope.principleText && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.opticalMicroscope.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FT-IR Analysis Card */}
                    {!ar.ftirAnalysis.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                              {getAnalysisSubChar("ftir")}
                            </span>
                            <span>FT-IR(적외선 분광분석) 정성 분석 결과</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.ftirAnalysis.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.ftirAnalysis.status
                                )}`}
                              >
                                {ar.ftirAnalysis.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200 font-bold">
                              FT-IR ATR 분광 동정법
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 pl-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-600">성분 분석 판정:</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                              {
                                getSafeInvestigationText(
                                  ar.ftirAnalysis.status,
                                  ar.ftirAnalysis.matchedMaterial,
                                  { skipped: ar.ftirAnalysis.skipped, investigatedFallback: "성분 판정 완료" }
                                ).displayText
                              }
                            </span>
                            {ar.ftirAnalysis.similarity && (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-mono">
                                스펙트럼 유사도: {ar.ftirAnalysis.similarity} (일치)
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 leading-relaxed font-normal">
                            {
                              getSafeInvestigationText(
                                ar.ftirAnalysis.status,
                                ar.ftirAnalysis.summary,
                                { skipped: ar.ftirAnalysis.skipped, investigatedFallback: "분석 완료" }
                              ).displayText
                            }
                          </p>
                        </div>

                        {ar.ftirAnalysis.includePrinciple && ar.ftirAnalysis.principleText && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.ftirAnalysis.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* XRF Analysis Card */}
                    {!ar.xrfAnalysis.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                              {getAnalysisSubChar("xrf")}
                            </span>
                            <span>XRF(X선 형광분석) 무기 및 금속 원소 분석</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.xrfAnalysis.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.xrfAnalysis.status
                                )}`}
                              >
                                {ar.xrfAnalysis.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                              X-Ray Fluorescence
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-slate-800 leading-relaxed pl-1">
                          {ar.xrfAnalysis.elementsRatio && (
                            <p className="font-mono font-semibold text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200">
                              · 검출 원소 성분비: {ar.xrfAnalysis.elementsRatio}
                            </p>
                          )}
                          <p>
                            {
                              getSafeInvestigationText(
                                ar.xrfAnalysis.status,
                                ar.xrfAnalysis.summary,
                                { skipped: ar.xrfAnalysis.skipped, investigatedFallback: "원소 분석 완료" }
                              ).displayText
                            }
                          </p>
                        </div>

                        {ar.xrfAnalysis.includePrinciple && ar.xrfAnalysis.principleText && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.xrfAnalysis.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Physicochemical Analysis Table Card */}
                    {!ar.physicochemicalAnalysis.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                              {getAnalysisSubChar("physicochemical")}
                            </span>
                            <span>이화학적 특성 비교 분석</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.physicochemicalAnalysis.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.physicochemicalAnalysis.status
                                )}`}
                              >
                                {ar.physicochemicalAnalysis.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                              식품공전 일반시험법
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-300 rounded mb-2">
                          <table className="w-full text-center border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                                <th className="p-1.5 border-r border-slate-300 w-24">시험일</th>
                                <th className="p-1.5 border-r border-slate-300">시험 항목</th>
                                <th className="p-1.5 border-r border-slate-300 w-12">단위</th>
                                <th className="p-1.5 border-r border-slate-300">품질 기준 규격</th>
                                <th className="p-1.5 border-r border-slate-300">정상 보관품 수치</th>
                                <th className="p-1.5 border-r border-slate-300">회수 현품 측정치</th>
                                <th className="p-1.5 border-r border-slate-300 w-16">판정</th>
                                <th className="p-1.5 w-24">비고</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(ar.physicochemicalAnalysis.items || []).map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="p-1.5 text-slate-700 border-r border-slate-200 whitespace-nowrap">
                                    {item.testDate || "-"}
                                  </td>
                                  <td className="p-1.5 font-medium text-slate-800 border-r border-slate-200 text-left">
                                    {item.name}
                                  </td>
                                  <td className="p-1.5 text-slate-500 border-r border-slate-200">
                                    {item.unit || "-"}
                                  </td>
                                  <td className="p-1.5 text-slate-700 border-r border-slate-200 text-left">
                                    {item.standard}
                                  </td>
                                  <td className="p-1.5 text-slate-700 border-r border-slate-200">
                                    {item.controlValue}
                                  </td>
                                  <td className="p-1.5 font-bold text-slate-900 border-r border-slate-200">
                                    {item.sampleValue}
                                  </td>
                                  <td className="p-1.5 font-bold border-r border-slate-200">
                                    {item.judgment === "적합" ? (
                                      <span className="text-emerald-700">적합</span>
                                    ) : item.judgment === "부적합" ? (
                                      <span className="text-red-600">부적합</span>
                                    ) : (
                                      <span className="text-slate-500">해당없음</span>
                                    )}
                                  </td>
                                  <td className="p-1.5 text-slate-700 text-[10.5px]">
                                    {item.remarks || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {ar.physicochemicalAnalysis.summary && (
                          <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                            {
                              getSafeInvestigationText(
                                ar.physicochemicalAnalysis.status,
                                ar.physicochemicalAnalysis.summary,
                                { skipped: ar.physicochemicalAnalysis.skipped, investigatedFallback: "시험 완료" }
                              ).displayText
                            }
                          </p>
                        )}

                        {ar.physicochemicalAnalysis.includePrinciple && ar.physicochemicalAnalysis.principleText && (
                          <div className="mt-2 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.physicochemicalAnalysis.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Catalase Test Card */}
                    {!ar.catalaseTest.skipped && (
                      <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                              {getAnalysisSubChar("catalase")}
                            </span>
                            <span>카탈라아제(Catalase) 효소 활성 및 생물/열처리 반응 시험</span>
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {ar.catalaseTest.status && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                  ar.catalaseTest.status
                                )}`}
                              >
                                {ar.catalaseTest.status}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium">
                              3% H2O2 효소 분해 반응법
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-slate-800 leading-relaxed pl-1">
                          <p>
                            <strong className="text-slate-900">· 최종 판정:</strong>{" "}
                            <span className="font-bold text-blue-900">{ar.catalaseTest.resultJudgement}</span>
                          </p>
                          <p>
                            {
                              getSafeInvestigationText(
                                ar.catalaseTest.status,
                                ar.catalaseTest.reactionDetail,
                                { skipped: ar.catalaseTest.skipped, investigatedFallback: "반응 시험 완료" }
                              ).displayText
                            }
                          </p>
                        </div>

                        {ar.catalaseTest.includePrinciple && ar.catalaseTest.principleText && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                              {ar.catalaseTest.principleText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Tests Cards */}
                    {(ar.additionalTests || []).map((test) => {
                      if (test.skipped) return null;
                      return (
                        <div key={test.id} className="border border-slate-300 rounded-lg p-3 bg-white shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                            <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                                {getAnalysisSubChar(`add_${test.id}`)}
                              </span>
                              <span>{test.title}</span>
                            </h3>
                          </div>
                          <div className="text-slate-800 leading-relaxed pl-1">
                            <p>{test.result}</p>
                          </div>
                          {test.includePrinciple && test.principleText && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/70 bg-slate-50/80 p-2 rounded text-[10.5px] text-slate-600 flex items-start gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-700 mr-1">[시험 원리 및 방법]</strong>
                                {test.principleText}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* [4] 제조공정 점검 및 관리 포인트 */}
              {!report.manufacturingProcess.skipped && (
                <section className="space-y-2 print-avoid-break">
                  <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1">
                    {getSectionNumber("manufacturing_process")} 제조공정 점검 및 관리 포인트
                  </h2>

                  {/* Flow Steps Diagram */}
                  {(report.manufacturingProcess.processSteps || []).length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700">
                          [전체 제조공정 흐름도 및 관리 기준점]
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold hidden print:hidden sm:inline">
                          (공정 클릭 시 설비·CCP·품질리스크 상세 조회)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {(report.manufacturingProcess.processSteps || []).map((step, idx) => {
                          const isHighlighted =
                            report.manufacturingProcess.highlightedStep &&
                            step.includes(report.manufacturingProcess.highlightedStep);
                          return (
                            <div key={idx} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStepClick(step, idx)}
                                className={`px-2.5 py-1 rounded font-medium transition-all text-left cursor-pointer print:border print:shadow-none ${
                                  isHighlighted
                                    ? "bg-amber-100 text-amber-900 border border-amber-400 font-bold ring-2 ring-amber-300/60"
                                    : "bg-white text-slate-800 border border-slate-300 hover:border-blue-400 hover:bg-blue-50/60"
                                }`}
                                title={`${step} (클릭 시 설비/CCP/품질리스크 상세정보 확인)`}
                              >
                                {step}
                              </button>
                              {idx < report.manufacturingProcess.processSteps.length - 1 && (
                                <span className="text-slate-400 font-bold">→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-white border border-slate-300 rounded-lg text-xs space-y-2 text-slate-800 leading-relaxed">
                    {report.manufacturingProcess.filtrationAnalysis && (
                      <p>
                        <strong className="text-slate-950">가. 여과 공정(이물 제어):</strong>{" "}
                        {report.manufacturingProcess.filtrationAnalysis}
                      </p>
                    )}
                    {report.manufacturingProcess.cleaningAnalysis && (
                      <p>
                        <strong className="text-slate-950">나. 세척 및 린싱 공정:</strong>{" "}
                        {report.manufacturingProcess.cleaningAnalysis}
                      </p>
                    )}
                    {report.manufacturingProcess.criticalControlPoint && (
                      <div className="p-2.5 bg-amber-50/70 border-l-4 border-amber-500 rounded-r text-amber-950">
                        <strong className="block font-bold mb-0.5">다. 클레임 연계 주요 관리점 점검 결과:</strong>
                        <span>{report.manufacturingProcess.criticalControlPoint}</span>
                      </div>
                    )}
                    {report.manufacturingProcess.processInvestigationNote && (
                      <div className="p-2.5 bg-blue-50/70 border-l-4 border-blue-500 rounded-r text-blue-950 font-medium">
                        <strong className="block font-bold mb-0.5">라. 제조공정 조사 결과:</strong>
                        <span>{report.manufacturingProcess.processInvestigationNote}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* [5] 동일 Lot 제조 및 품질검사 이력 */}
              {!report.lotHistory.skipped && (
                <section className="space-y-2 print-avoid-break">
                  <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1">
                    {getSectionNumber("lot_history")} 동일 제조번호(Lot: {report.productInfo.lotNumber}) 품질검사 이력
                  </h2>
                  <div className="border border-slate-300 rounded-lg text-xs overflow-hidden">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <th className="w-40 bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                            제조 당시 생산일지 점검
                          </th>
                          <td className="p-2 text-slate-900">
                            <div className="flex items-center gap-2">
                              {report.lotHistory.productionLogStatus && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                    report.lotHistory.productionLogStatus
                                  )}`}
                                >
                                  {report.lotHistory.productionLogStatus}
                                </span>
                              )}
                              <span>
                                {
                                  getSafeInvestigationText(
                                    report.lotHistory.productionLogStatus,
                                    report.lotHistory.productionLogNote,
                                    { skipped: report.lotHistory.skipped, investigatedFallback: "특이사항 없음 (정상 가동 확인)" }
                                  ).displayText
                                }
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                            출하 전 품질검사 성적서(COA)
                          </th>
                          <td className="p-2 text-slate-900">
                            <div className="flex items-center gap-2">
                              {report.lotHistory.qualityTestStatus && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getInvestigationStatusBadgeStyle(
                                    report.lotHistory.qualityTestStatus
                                  )}`}
                                >
                                  {report.lotHistory.qualityTestStatus}
                                </span>
                              )}
                              <span className="font-bold text-slate-900">
                                {
                                  getSafeInvestigationText(
                                    report.lotHistory.qualityTestStatus,
                                    report.lotHistory.qualityTestRecord,
                                    { skipped: report.lotHistory.skipped, investigatedFallback: "전 항목 기준 규격 적합 (정상 판정)" }
                                  ).displayText
                                }
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200">
                            동일 Lot 이전 클레임 이력
                          </th>
                          <td className="p-2 text-slate-900 font-bold">
                            {report.lotHistory.priorClaimsCount || "동일 유형 접수 이력 0건"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200 align-top">
                            동일 Lot 자사 공장 보관품 조사
                          </th>
                          <td className="p-2 text-slate-900 leading-relaxed font-medium">
                            <div className="mb-1">
                              {report.lotHistory.retainedSampleStatus && (
                                <span
                                  className={`inline-block text-[10px] px-2 py-0.5 rounded border font-bold mr-2 ${getInvestigationStatusBadgeStyle(
                                    report.lotHistory.retainedSampleStatus
                                  )}`}
                                >
                                  {report.lotHistory.retainedSampleStatus}
                                </span>
                              )}
                            </div>
                            <p>
                              {
                                getSafeInvestigationText(
                                  report.lotHistory.retainedSampleStatus,
                                  report.lotHistory.retainedSampleCheck,
                                  {
                                    skipped: report.lotHistory.skipped,
                                    investigatedFallback:
                                      "동일 제조번호 자사 공장 보관품(검체) 확인 결과, 성상 및 맛/향에 이상이 없으며 이물 혼입 등의 특이사항이 전혀 확인되지 않았습니다.",
                                  }
                                ).displayText
                              }
                            </p>
                            {att2Photos.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200">
                                <span className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                                  [자사 공장 보관 검체(동일 Lot) 외관 및 성상 확인 사진]
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {att2Photos.map((p, idx) => (
                                    <div
                                      key={p.id || idx}
                                      className="border border-slate-300 rounded p-1.5 bg-white text-center shadow-2xs"
                                    >
                                      <img
                                        src={p.url}
                                        alt={p.caption || `동일 Lot 보관품 사진 ${idx + 1}`}
                                        className="w-full h-28 object-contain bg-slate-50 rounded"
                                      />
                                      {renderEditableCaption(p, `보관품 사진 #${idx + 1}`)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                        {(report.lotHistory.rawMaterialCheck ||
                          report.lotHistory.materialInvestigationResult) && (
                          <tr>
                            <th className="bg-slate-100 p-2 text-left font-semibold text-slate-700 border-r border-slate-200 align-top">
                              원부자재 및 LOT 추적 조사
                            </th>
                            <td className="p-2 text-slate-900 leading-relaxed font-medium">
                              {report.lotHistory.rawMaterialStatus && (
                                <span
                                  className={`inline-block text-[10px] px-2 py-0.5 rounded border font-bold mr-2 mb-1 ${getInvestigationStatusBadgeStyle(
                                    report.lotHistory.rawMaterialStatus
                                  )}`}
                                >
                                  {report.lotHistory.rawMaterialStatus}
                                </span>
                              )}
                              <span>
                                {report.lotHistory.rawMaterialCheck ||
                                  "관련 원부자재의 제조 및 입고 기록을 확인한 결과, 특이사항은 확인되지 않았습니다."}
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* [6] 종합 원인 판정 및 재발방지대책 */}
              {!report.rootCauseAndActions.skipped && (
                <section className="space-y-2 print-avoid-break">
                  <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1">
                    {getSectionNumber("root_cause")} 종합 원인 판정 및 재발방지대책
                  </h2>
                  <div className="space-y-2 text-xs">
                    {/* Root Cause Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 block text-xs">
                          가. 종합 원인 분석 판정:
                        </span>
                        {report.rootCauseAndActions.status && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                              getInvestigationStatusBadgeStyle(report.rootCauseAndActions.status).bg
                            } ${getInvestigationStatusBadgeStyle(report.rootCauseAndActions.status).border}`}
                          >
                            {report.rootCauseAndActions.status}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-900 leading-relaxed font-medium">
                        {
                          getSafeInvestigationText(
                            report.rootCauseAndActions.status,
                            report.rootCauseAndActions.rootCause,
                            { skipped: report.rootCauseAndActions.skipped, investigatedFallback: "원인 분석 중" }
                          ).displayText
                        }
                      </p>
                    </div>

                    {/* Preventive Measures Card */}
                    {!report.rootCauseAndActions.preventiveMeasuresSkipped &&
                      report.rootCauseAndActions.preventiveMeasures && (
                        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1">
                          <span className="font-bold text-emerald-950 block text-xs">
                            나. 재발방지대책 및 조치 현황:
                          </span>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {report.rootCauseAndActions.preventiveMeasures}
                          </p>
                        </div>
                      )}
                  </div>
                </section>
              )}

              {/* [7] 조사 결론 및 고객 안내 */}
              <section className="space-y-2 print-avoid-break">
                <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1">
                  {getSectionNumber("conclusion")} 조사 결론 및 고객 안내
                </h2>
                <div className="p-4 bg-slate-50/80 border border-slate-300 rounded-lg space-y-3 text-xs">
                  {/* Summary bullet points (가, 나, 다) */}
                  <div className="space-y-2">
                    {(report.conclusion?.summaryPoints || []).map((point, idx) => (
                      <p key={idx} className="text-slate-900 leading-relaxed font-medium pl-1">
                        {point}
                      </p>
                    ))}
                  </div>

                  {/* Apology & customer reassurance */}
                  {report.conclusion.apologyText && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-slate-800 leading-relaxed text-xs bg-red-50/40 p-3.5 rounded border-l-4 border-red-600">
                      {report.conclusion.apologyText}
                    </div>
                  )}
                </div>
              </section>

              {/* [8] 첨부 사진 및 데이터 그리드 (If any) */}
              {hasAttachments && (
                <section className="space-y-3 print-page-break">
                  <h2 className="text-xs font-bold text-slate-950 border-b-2 border-slate-800 pb-1">
                    {getSectionNumber("attachments")} 첨부 문서 (현품, 스펙트럼 및 공정 사진)
                  </h2>

                  {/* Customer Claim Intake Photos */}
                  {customerPhotos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800">
                        [첨부: 고객 인입 사진] 클레임 접수 시 소비자가 제공한 현품/문제 부위 사진
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {customerPhotos.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="border border-slate-300 rounded-lg p-1.5 bg-white text-center"
                          >
                            <img
                              src={p.url}
                              alt={p.caption || `고객 인입 사진 ${idx + 1}`}
                              className="w-full h-36 object-contain bg-slate-50 rounded"
                            />
                            {renderEditableCaption(p, `고객 인입 사진 #${idx + 1}`)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment 1 Photos: Sample / Foreign object / FTIR */}
                  {att1Photos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800">
                        {report.attachments.attachment1Title || "[첨부 1] 현품 외관, 이물 확대 및 정밀 스펙트럼 분석 데이터"}
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {att1Photos.map((p) => (
                          <div
                            key={p.id}
                            className="border border-slate-300 rounded-lg p-1.5 bg-white text-center"
                          >
                            <img
                              src={p.url}
                              alt={p.caption}
                              className="w-full h-36 object-contain bg-slate-50 rounded"
                            />
                            {renderEditableCaption(p, `현품/이물 분석 사진`)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment 2 Photos: Retained sample */}
                  {att2Photos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800">
                        {report.attachments.attachment2Title || "[첨부 2] 동일 Lot 공장 정상 보관 검체 확인 사진"}
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {att2Photos.map((p) => (
                          <div
                            key={p.id}
                            className="border border-slate-300 rounded-lg p-1.5 bg-white text-center"
                          >
                            <img
                              src={p.url}
                              alt={p.caption}
                              className="w-full h-36 object-contain bg-slate-50 rounded"
                            />
                            {renderEditableCaption(p, `동일 Lot 보관품 사진`)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment 3 Photos: Manufacturing process */}
                  {att3Photos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800">
                        {report.attachments.attachment3Title || "[첨부 3] 주요 제조공정 관리 및 점검 사진 그리드"}
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {att3Photos.map((p) => (
                          <div
                            key={p.id}
                            className="border border-slate-300 rounded-lg p-1.5 bg-white text-center"
                          >
                            <img
                              src={p.url}
                              alt={p.caption}
                              className="w-full h-36 object-contain bg-slate-50 rounded"
                            />
                            {renderEditableCaption(p, `제조공정 점검 사진`, p.stepName)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Official Sign-off & Kwangdong Seal Block */}
              <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 print-avoid-break border-t border-slate-200 mt-6">
                <div className="text-center sm:text-left">
                  <span className="text-base sm:text-lg font-bold text-slate-950 tracking-[0.15em] sm:tracking-[0.25em] doc-serif select-none">
                    {companyTitle} &nbsp; 식품품질경영팀 &nbsp; 팀장 &nbsp;{" "}
                    {(() => {
                      const raw = (report.teamLeader || "신준호").trim();
                      if (raw.includes("이정우")) return "신준호";
                      const clean = raw.replace(/팀장/g, "").trim();
                      return clean || "신준호";
                    })()}
                  </span>
                </div>

                {/* Kwangdong Pharmaceutical Seal Stamp & Signature */}
                <div className="flex items-center gap-2">
                  <div className="w-20 h-10 flex items-center justify-center shrink-0 select-none">
                    <svg
                      viewBox="0 0 140 60"
                      className="w-20 h-10 text-slate-900 stroke-current fill-none stroke-[2.2] -rotate-3"
                      aria-label="서명"
                    >
                      <path
                        d="M12 40 C20 18, 28 8, 38 18 C46 26, 44 48, 52 46 C60 44, 68 15, 78 22 C88 28, 92 48, 104 38 C114 28, 126 18, 134 25 M32 30 C55 24, 85 24, 125 32 M70 12 L72 50"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Kwangdong Circular Red Seal */}
                  <div className="w-12 h-12 rounded-full border-2 border-red-600 text-red-600 flex flex-col items-center justify-center font-bold text-[9px] leading-tight select-none rotate-6 shadow-2xs">
                    <span>광동제약</span>
                    <span>품질보증</span>
                    <span className="text-[8px]">[인]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Legal Footer Disclaimer */}
            <footer className="mt-8 pt-3 border-t border-slate-300 text-[8.2pt] text-slate-500 leading-relaxed select-none print-footer-fixed">
              <p className="text-justify leading-normal">
                본 자료는 귀하의 문의사항에 대한 설명을 목적으로 작성되었습니다. 내용 중 당사 영업기밀이 포함되어 있을 수 있으므로, 당사와 사전 협의 없는
                전파, 배포, 복사는 물론 다른 목적을 위한 열람은 금지됨을 알려드립니다.
                <br />
                (영업 비밀을 취득·사용하거나 제 3자에게 누설하는 행위를 한 자는 부정경쟁방지 및 영업비밀보호에 관한 법률에 의하여 처벌될 수 있습니다.)
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* Structured Process Step Detail Modal */}
      <ProcessStepDetailModal
        isOpen={isStepDetailOpen}
        onClose={() => setIsStepDetailOpen(false)}
        step={selectedStepForDetail}
      />
    </div>
  );
}
