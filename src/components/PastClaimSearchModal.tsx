import { useState, useMemo } from "react";
import {
  X,
  Search,
  RotateCcw,
  Eye,
  FileText,
  Calendar,
  Package,
  Tag,
  Hash,
  Factory,
  User,
  ShieldCheck,
  AlertCircle,
  Lock,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Microscope,
  Cpu,
  History as HistoryIcon,
  Copy,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ShieldAlert,
  Info,
} from "lucide-react";
import { ReportData } from "../types";
import {
  PastClaimItem,
  PastClaimSearchFilters,
  loadAllHistoricalClaims,
  filterPastClaims,
  createCopiedClaimReport,
  ClaimCopyOptions,
  DEFAULT_CLAIM_COPY_OPTIONS,
} from "../utils/pastClaimManager";

interface PastClaimSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyAsNewClaim?: (newReport: ReportData) => void;
}

const INITIAL_FILTERS: PastClaimSearchFilters = {
  productName: "",
  claimType: "전체",
  lotNumber: "",
  manufactureLine: "",
  receivedDate: "",
  researcher: "",
  keyword: "",
};

const CLAIM_TYPE_OPTIONS = [
  "전체",
  "유리 파손 / 이물",
  "캡 불량 / 오일 탄화",
  "침전물 / 혼탁",
  "변질 / 곰팡이",
  "캔 파손 / 시밍 불량",
  "파우치 실링 / 누액",
  "탄산 압력 / 팽창",
  "맛 / 이취 이상",
  "생물 / 벌레 이물",
  "금속성 이물",
  "플라스틱 이물",
  "일반 품질 클레임",
];

export function PastClaimSearchModal({
  isOpen,
  onClose,
  onCopyAsNewClaim,
}: PastClaimSearchModalProps) {
  const [filters, setFilters] = useState<PastClaimSearchFilters>(INITIAL_FILTERS);
  const [selectedClaim, setSelectedClaim] = useState<PastClaimItem | null>(null);
  const [isCopyConfirmOpen, setIsCopyConfirmOpen] = useState(false);
  const [copyOptions, setCopyOptions] = useState<ClaimCopyOptions>(DEFAULT_CLAIM_COPY_OPTIONS);

  // 과거 클레임 전체 데이터셋 (보관함 + 표준 이력 데이터 융합)
  const allHistoricalClaims = useMemo(() => {
    if (!isOpen) return [];
    return loadAllHistoricalClaims();
  }, [isOpen]);

  // 다중 필터 적용
  const filteredClaims = useMemo(() => {
    return filterPastClaims(allHistoricalClaims, filters);
  }, [allHistoricalClaims, filters]);

  // 복사 선택 항목 수 카운트
  const countSelected = useMemo(() => {
    let count = 0;
    // 1. 기본정보 (4)
    if (copyOptions.basicInfo.productName) count++;
    if (copyOptions.basicInfo.packageType) count++;
    if (copyOptions.basicInfo.claimType) count++;
    if (copyOptions.basicInfo.manufactureLine) count++;
    // 2. 조사 Template (4)
    if (copyOptions.investigationTemplate.investigationItems) count++;
    if (copyOptions.investigationTemplate.investigationMethods) count++;
    if (copyOptions.investigationTemplate.standardPhrases) count++;
    if (copyOptions.investigationTemplate.processBasicDescription) count++;
    // 3. 과거 조사결과 (8)
    if (copyOptions.investigationResults.visualAndInstrumentAnalysis) count++;
    if (copyOptions.investigationResults.retainedSampleResult) count++;
    if (copyOptions.investigationResults.manufacturingRecordResult) count++;
    if (copyOptions.investigationResults.qualityInspectionResult) count++;
    if (copyOptions.investigationResults.processInvestigationResult) count++;
    if (copyOptions.investigationResults.materialInvestigationResult) count++;
    if (copyOptions.investigationResults.rootCause) count++;
    if (copyOptions.investigationResults.conclusion) count++;
    // 4. 첨부자료 (2)
    if (copyOptions.attachments.photos) count++;
    if (copyOptions.attachments.files) count++;
    return count;
  }, [copyOptions]);

  if (!isOpen) return null;

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleOpenCopyOptions = () => {
    setCopyOptions(DEFAULT_CLAIM_COPY_OPTIONS);
    setIsCopyConfirmOpen(true);
  };

  const handleCloseModal = () => {
    setIsCopyConfirmOpen(false);
    setSelectedClaim(null);
    onClose();
  };

  const handleConfirmCopyAsNewClaim = () => {
    if (!selectedClaim) return;
    const newReport = createCopiedClaimReport(selectedClaim.report, copyOptions);
    if (onCopyAsNewClaim) {
      onCopyAsNewClaim(newReport);
    }
    setIsCopyConfirmOpen(false);
    setSelectedClaim(null);
    onClose();
  };

  const handleApplyRecommendedOptions = () => {
    setCopyOptions(DEFAULT_CLAIM_COPY_OPTIONS);
  };

  const handleSelectAllOptions = () => {
    setCopyOptions({
      basicInfo: { productName: true, packageType: true, claimType: true, manufactureLine: true },
      investigationTemplate: {
        investigationItems: true,
        investigationMethods: true,
        standardPhrases: true,
        processBasicDescription: true,
      },
      investigationResults: {
        visualAndInstrumentAnalysis: true,
        retainedSampleResult: true,
        manufacturingRecordResult: true,
        qualityInspectionResult: true,
        processInvestigationResult: true,
        materialInvestigationResult: true,
        rootCause: true,
        conclusion: true,
      },
      attachments: { photos: true, files: true },
    });
  };

  const handleDeselectAllOptions = () => {
    setCopyOptions({
      basicInfo: { productName: false, packageType: false, claimType: false, manufactureLine: false },
      investigationTemplate: {
        investigationItems: false,
        investigationMethods: false,
        standardPhrases: false,
        processBasicDescription: false,
      },
      investigationResults: {
        visualAndInstrumentAnalysis: false,
        retainedSampleResult: false,
        manufacturingRecordResult: false,
        qualityInspectionResult: false,
        processInvestigationResult: false,
        materialInvestigationResult: false,
        rootCause: false,
        conclusion: false,
      },
      attachments: { photos: false, files: false },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* ======================================================== */}
        {/* 모달 상단 헤더 */}
        {/* ======================================================== */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <HistoryIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">
                  이전 클레임 불러오기 (과거 이력 검색)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  조회 전용
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                과거에 접수·조사된 클레임 기록을 다각도로 검색하고, 상세 원인 조사 내용을 안전하게 조회합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* [분기 1] 상세 내용 확인 화면 (읽기 전용) */}
        {/* ======================================================== */}
        {selectedClaim ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            {/* 상세 뷰 서브 헤더 */}
            <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>검색 목록으로</span>
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <span className="text-xs font-bold text-slate-900 truncate">
                  {selectedClaim.report.docNumber || "문서번호 미지정"} · {selectedClaim.productName}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* 읽기 전용 보안 경고 배지 */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>읽기 전용</span>
                </div>

                {/* [이 클레임을 새 클레임으로 복사] 상단 버튼 */}
                <button
                  type="button"
                  id="btn-copy-as-new-claim-top"
                  onClick={handleOpenCopyOptions}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                  title="이 클레임의 조사 구조와 기본정보를 이용하여 새로운 클레임을 생성합니다"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-100" />
                  <span>이 클레임을 새 클레임으로 복사</span>
                </button>
              </div>
            </div>

            {/* 상세 내용 스크롤 본문 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* 과거 클레임 읽기 전용 안내 안내문 */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>과거 클레임 조사 기록 열람 모드입니다.</strong>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    기존 클레임 데이터의 원본 무결성을 보호하기 위해 모든 내용은 수정할 수 없는 읽기 전용으로 표시됩니다.
                  </p>
                </div>
              </div>

              {/* 1. 기본 정보 카드 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">1. 클레임 접수 및 대상 제품 정보</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5">제품명</span>
                    <strong className="text-slate-900">{selectedClaim.productName}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5">제조번호 (LOT)</span>
                    <strong className="text-blue-900 font-mono">{selectedClaim.lotNumber}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5">클레임 유형</span>
                    <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-red-100 text-red-800 border border-red-200">
                      {selectedClaim.claimType}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5">접수 일자</span>
                    <span className="text-slate-900 font-semibold">{selectedClaim.receivedAt}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5">제조공장 / 생산라인</span>
                    <span className="text-slate-900 font-semibold">{selectedClaim.manufactureLine}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-0.5">조사 담당자</span>
                    <span className="text-slate-900 font-semibold">{selectedClaim.researcherName}</span>
                  </div>
                </div>

                {/* 고객 진술 내용 */}
                <div className="mt-2 p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-900 block mb-1">
                    불만 접수 상세 내용 (고객 진술):
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedClaim.report.customerClaim.claimDetails || "기록된 진술 내용이 없습니다."}
                  </p>
                </div>
              </div>

              {/* 2. 현품 분석 결과 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Microscope className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">2. 현품 정밀 분석 결과</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      현품 외관 및 성상 확인:
                    </span>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {selectedClaim.report.analysisResults.visualInspection.sampleCondition ||
                        selectedClaim.report.analysisResults.visualInspection.foreignObjectAppearance ||
                        "특이사항 없음"}
                    </div>
                  </div>

                  {selectedClaim.report.analysisResults.magnifierInspection.result && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-0.5">
                        정밀 확대경 / 광학 현미경 관찰:
                      </span>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedClaim.report.analysisResults.magnifierInspection.result}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 제조이력 조사 (5대 조사) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900">3. 제조기록 및 보관품 이력 조사</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">제조기록 (생산일지)</span>
                    <p className="text-slate-800 leading-relaxed">
                      {selectedClaim.report.lotHistory.productionLogNote || "특이사항 없음"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">공장 보관품(동일 Lot) 대조</span>
                    <p className="text-slate-800 leading-relaxed">
                      {selectedClaim.report.lotHistory.retainedSampleCheck || "특이사항 없음"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">출하 전 품질검사 성적</span>
                    <p className="text-slate-800 leading-relaxed">
                      {selectedClaim.report.lotHistory.qualityTestRecord || "전 항목 기준 적합"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">제조공정 및 CCP 관리</span>
                    <p className="text-slate-800 leading-relaxed">
                      {selectedClaim.report.manufacturingProcess.criticalControlPoint ||
                        selectedClaim.report.manufacturingProcess.processInvestigationNote ||
                        "정상 가동 및 기준치 준수 확인"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. 원인 판정 소견 및 재발방지대책 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900">4. 원인 분석 및 재발방지대책</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-purple-900 block mb-0.5">
                      종합 원인 판정 소견:
                    </span>
                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedClaim.report.rootCauseAndActions.rootCause || "원인 판정 기록 없음"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      재발 방지 개선 대책:
                    </span>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {selectedClaim.report.rootCauseAndActions.preventiveMeasures || "개선 대책 기록 없음"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. 종합 결론 핵심 요약 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">5. 최종 결론 핵심 요약</h3>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-800">
                  {(selectedClaim.report.conclusion.summaryPoints || []).map((point, idx) => (
                    <li key={idx} className="p-2 bg-slate-50 rounded-md border border-slate-200 leading-relaxed">
                      {point}
                    </li>
                  ))}
                </ul>

                {selectedClaim.report.conclusion.apologyText && (
                  <div className="mt-2 p-2.5 bg-slate-100 rounded-lg text-xs text-slate-700 leading-relaxed">
                    <span className="text-[11px] font-bold text-slate-600 block mb-0.5">고객 안내문:</span>
                    {selectedClaim.report.conclusion.apologyText}
                  </div>
                )}
              </div>
            </div>

            {/* 상세 뷰 하단 닫기 바 */}
            <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>검색 목록으로 돌아가기</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-copy-as-new-claim-bottom"
                  onClick={handleOpenCopyOptions}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                  title="이 클레임의 조사 구조와 기본정보를 이용하여 새로운 클레임을 생성합니다"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-100" />
                  <span>이 클레임을 새 클레임으로 복사</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* [분기 2] 검색 필터 및 결과 목록 화면 */
          /* ======================================================== */
          <div className="flex-1 flex flex-col min-h-0">
            {/* 검색 조건 패널 */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">다중 검색 조건 입력</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (모든 조건을 입력할 필요는 없으며, 입력한 조건만 필터링됩니다)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  title="검색 조건 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>필터 초기화</span>
                </button>
              </div>

              {/* 7개 검색 필터 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. 제품명 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span>제품명</span>
                  </label>
                  <input
                    type="text"
                    value={filters.productName}
                    onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
                    placeholder="예: 병 제품 (100ml)"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* 2. 클레임 유형 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>클레임 유형</span>
                  </label>
                  <select
                    value={filters.claimType}
                    onChange={(e) => setFilters({ ...filters, claimType: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900"
                  >
                    {CLAIM_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. 제조번호 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span>제조번호 (LOT)</span>
                  </label>
                  <input
                    type="text"
                    value={filters.lotNumber}
                    onChange={(e) => setFilters({ ...filters, lotNumber: e.target.value })}
                    placeholder="예: LOT-26F20-V1"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* 4. 제조라인 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Factory className="w-3 h-3 text-slate-400" />
                    <span>제조라인</span>
                  </label>
                  <input
                    type="text"
                    value={filters.manufactureLine}
                    onChange={(e) => setFilters({ ...filters, manufactureLine: e.target.value })}
                    placeholder="예: 음료 1호 라인"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* 5. 접수일 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>접수일</span>
                  </label>
                  <input
                    type="text"
                    value={filters.receivedDate}
                    onChange={(e) => setFilters({ ...filters, receivedDate: e.target.value })}
                    placeholder="예: 2026-06 또는 2026-06-20"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* 6. 조사자 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>조사자</span>
                  </label>
                  <input
                    type="text"
                    value={filters.researcher}
                    onChange={(e) => setFilters({ ...filters, researcher: e.target.value })}
                    placeholder="예: 김진영, 신준호"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* 7. 키워드 (2칸 병합) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Search className="w-3 h-3 text-slate-400" />
                    <span>키워드 (내용, 원인, 고객진술 포괄)</span>
                  </label>
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                    placeholder="예: 유리 조각, 침전, 곰팡이, 핀홀, 이물, 물결무늬 등"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* 검색 결과 헤더 배너 */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-slate-800">
                검색 결과: <strong className="text-blue-700">{filteredClaims.length}건</strong>
                <span className="text-slate-500 font-normal ml-1">
                  (전체 과거 이력 {allHistoricalClaims.length}건 중)
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                각 클레임의 [내용 확인] 버튼을 누르면 상세 내용을 읽기 전용으로 열람할 수 있습니다.
              </span>
            </div>

            {/* 검색 결과 목록 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredClaims.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">일치하는 과거 클레임이 없습니다.</p>
                  <p className="text-[11px] text-slate-500">
                    검색 조건을 변경하거나 [필터 초기화] 버튼을 눌러 전체 목록을 확인해 보세요.
                  </p>
                </div>
              ) : (
                filteredClaims.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* 태그 및 접수일 행 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                          {item.claimType}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.lotNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>접수일: {item.receivedAt}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {item.investigationStatus}
                        </span>
                      </div>

                      {/* 제품명 및 생산라인 */}
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.productName}
                        </h4>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-600 truncate">{item.manufactureLine}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-500 truncate">조사자: {item.researcherName}</span>
                      </div>

                      {/* 클레임 내용 일부 */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {item.claimDetailsSnippet || "상세 인입 내용 없음"}
                      </p>
                    </div>

                    {/* 액션 버튼: [내용 확인] */}
                    <div className="shrink-0 sm:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedClaim(item)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="과거 클레임 조사 상세 내용 읽기 전용 확인"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>내용 확인</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 모달 하단 푸터 */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 text-[11px]">
                * 과거 클레임 데이터는 품질 기준 열람 목적으로 제공되며, 현재 작성 중인 양식에는 영향을 주지 않습니다.
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 복사 선택 화면 (Customizable Claim Copy Options Modal) */}
      {/* ======================================================== */}
      {isCopyConfirmOpen && selectedClaim && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* 1. 상단 헤더 */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Copy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">클레임 복사 항목 맞춤 선택</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      신규 생성
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    기준 클레임: <span className="font-mono text-blue-300 font-bold">{selectedClaim.report.docNumber || selectedClaim.id}</span> · {selectedClaim.productName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCopyConfirmOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. 빠른 설정 토글 바 & 복사 상태 요약 */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  선택 현황: <strong className="text-blue-700">{countSelected}개 복사</strong>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-500 font-medium">{18 - countSelected}개 신규 입력</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleApplyRecommendedOptions}
                  className="px-2.5 py-1 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                  title="기본정보 및 조사 템플릿만 복사하고 실제 결과는 신규 작성하도록 설정"
                >
                  권장 설정 (기본+템플릿 ON)
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllOptions}
                  className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllOptions}
                  className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  전체 해제
                </button>
              </div>
            </div>

            {/* 3. 본문 스크롤 영역 (4개 카테고리) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 안전 경고 안내문 */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>과거 조사결과 및 첨부자료 오염 방지 안전 안내:</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    과거의 실제 조사결과(현품 분석, 보관품, 품질성적, 결론 등)는 새로운 클레임에 잘못 적용될 위험이 있으므로 기본적으로 복사하지 않습니다(OFF).
                    기존 클레임은 절대 수정되지 않으며, 새 클레임의 실제 조사결과는 별도로 입력해야 합니다.
                  </p>
                </div>
              </div>

              {/* [카테고리 1] 기본정보 (기본값: 모두 ON) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">1. 기본정보 (4개)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    기본 권장 ON
                  </span>
                </div>

                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* 제품명 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.basicInfo.productName ? "bg-blue-50/40 border-blue-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.basicInfo.productName}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          basicInfo: { ...copyOptions.basicInfo, productName: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">제품명</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.basicInfo.productName ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.basicInfo.productName ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>

                  {/* 제품 유형 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.basicInfo.packageType ? "bg-blue-50/40 border-blue-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.basicInfo.packageType}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          basicInfo: { ...copyOptions.basicInfo, packageType: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">제품 유형</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.basicInfo.packageType ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.basicInfo.packageType ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>

                  {/* 클레임 유형 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.basicInfo.claimType ? "bg-blue-50/40 border-blue-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.basicInfo.claimType}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          basicInfo: { ...copyOptions.basicInfo, claimType: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">클레임 유형</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.basicInfo.claimType ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.basicInfo.claimType ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>

                  {/* 제조라인 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.basicInfo.manufactureLine ? "bg-blue-50/40 border-blue-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.basicInfo.manufactureLine}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          basicInfo: { ...copyOptions.basicInfo, manufactureLine: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">제조라인</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.basicInfo.manufactureLine ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.basicInfo.manufactureLine ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>
                </div>
              </div>

              {/* [카테고리 2] 조사 Template (기본값: 모두 ON) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="px-4 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">2. 조사 Template (4개)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    구조 복사 ON
                  </span>
                </div>

                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* 조사 항목 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationTemplate.investigationItems ? "bg-indigo-50/40 border-indigo-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationTemplate.investigationItems}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationTemplate: { ...copyOptions.investigationTemplate, investigationItems: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">조사 항목</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationTemplate.investigationItems ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationTemplate.investigationItems ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>

                  {/* 조사 방법 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationTemplate.investigationMethods ? "bg-indigo-50/40 border-indigo-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationTemplate.investigationMethods}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationTemplate: { ...copyOptions.investigationTemplate, investigationMethods: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">조사 방법</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationTemplate.investigationMethods ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationTemplate.investigationMethods ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>

                  {/* 표준 조사문장 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationTemplate.standardPhrases ? "bg-indigo-50/40 border-indigo-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationTemplate.standardPhrases}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationTemplate: { ...copyOptions.investigationTemplate, standardPhrases: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">표준 조사문장</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationTemplate.standardPhrases ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationTemplate.standardPhrases ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>

                  {/* 제조공정 기본 설명 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationTemplate.processBasicDescription ? "bg-indigo-50/40 border-indigo-300" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationTemplate.processBasicDescription}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationTemplate: { ...copyOptions.investigationTemplate, processBasicDescription: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">제조공정 기본 설명</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationTemplate.processBasicDescription ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationTemplate.processBasicDescription ? "복사 ON" : "신규 작성"}
                    </span>
                  </label>
                </div>
              </div>

              {/* [카테고리 3] 과거 조사결과 (기본값: 모두 OFF - 안전 권장) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">3. 과거 조사결과 (8개)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    기본값 모두 OFF (오염 방지)
                  </span>
                </div>

                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* 현품 분석 결과 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.visualAndInstrumentAnalysis ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.visualAndInstrumentAnalysis}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, visualAndInstrumentAnalysis: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">현품 분석 결과</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.visualAndInstrumentAnalysis ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.visualAndInstrumentAnalysis ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 보관품 조사 결과 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.retainedSampleResult ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.retainedSampleResult}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, retainedSampleResult: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">보관품 조사 결과</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.retainedSampleResult ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.retainedSampleResult ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 제조기록 조사 결과 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.manufacturingRecordResult ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.manufacturingRecordResult}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, manufacturingRecordResult: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">제조기록 조사 결과</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.manufacturingRecordResult ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.manufacturingRecordResult ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 품질검사 결과 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.qualityInspectionResult ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.qualityInspectionResult}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, qualityInspectionResult: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">품질검사 결과</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.qualityInspectionResult ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.qualityInspectionResult ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 제조공정 조사 결과 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.processInvestigationResult ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.processInvestigationResult}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, processInvestigationResult: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">제조공정 조사 결과</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.processInvestigationResult ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.processInvestigationResult ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 원부자재 조사 결과 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.materialInvestigationResult ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.materialInvestigationResult}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, materialInvestigationResult: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">원부자재 조사 결과</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.materialInvestigationResult ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.materialInvestigationResult ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 원인판정 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.rootCause ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.rootCause}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, rootCause: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">원인판정</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.rootCause ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.rootCause ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 최종결론 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.investigationResults.conclusion ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.investigationResults.conclusion}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          investigationResults: { ...copyOptions.investigationResults, conclusion: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">최종결론</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.investigationResults.conclusion ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.investigationResults.conclusion ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>
                </div>
              </div>

              {/* [카테고리 4] 첨부자료 (기본값: 모두 OFF) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">4. 첨부자료 (2개)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    기본값 OFF
                  </span>
                </div>

                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* 사진 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.attachments.photos ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.attachments.photos}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          attachments: { ...copyOptions.attachments, photos: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">사진 (고객/보관품/공정)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.attachments.photos ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.attachments.photos ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>

                  {/* 첨부파일 */}
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    copyOptions.attachments.files ? "bg-amber-50/50 border-amber-300" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={copyOptions.attachments.files}
                        onChange={(e) => setCopyOptions({
                          ...copyOptions,
                          attachments: { ...copyOptions.attachments, files: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800">첨부파일 (문서/파일명)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      copyOptions.attachments.files ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {copyOptions.attachments.files ? "복사 ON" : "신규 작성 (OFF)"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. 모달 하단 액션 바 */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <span className="text-[11px] text-slate-500">
                * 새 클레임 생성 후 <strong>[다음 필수 입력 →]</strong> 스마트 액션으로 자동 연동됩니다.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-cancel-copy-claim"
                  onClick={() => setIsCopyConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  취소
                </button>
                <button
                  type="button"
                  id="btn-confirm-copy-claim"
                  onClick={handleConfirmCopyAsNewClaim}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-100" />
                  <span>선택한 {countSelected}개 항목으로 새 클레임 생성</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
