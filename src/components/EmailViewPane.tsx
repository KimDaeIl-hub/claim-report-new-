import React, { useState } from "react";
import {
  Copy,
  Check,
  FileText,
  Mail,
  ArrowLeft,
  Share2,
  Building2,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Eye,
  EyeOff,
  Columns,
  Sparkles,
  Info,
  ShieldAlert,
} from "lucide-react";
import { ReportData, EmailAudienceSettings } from "../types";
import {
  formatAudienceEmails,
  DEFAULT_EMAIL_AUDIENCE_SETTINGS,
} from "../utils/emailAudienceFormatter";
import { getUnexaminedInvestigationItems } from "../utils/investigationStatus";

interface EmailViewPaneProps {
  report: ReportData;
  onSwitchToReport: () => void;
  onSwitchToForm: () => void;
  onUpdateReport?: (updated: ReportData) => void;
}

export function EmailViewPane({
  report,
  onSwitchToReport,
  onSwitchToForm,
  onUpdateReport,
}: EmailViewPaneProps) {
  // View mode: 'internal' (내부 보고용) | 'consumer' (소비자 직접 안내용) | 'compare' (나란히 비교)
  const [viewMode, setViewMode] = useState<"internal" | "consumer" | "compare">("internal");

  // 항목별 포함 여부 설정 상태 (기본값 또는 report에 저장된 값)
  const [settings, setSettings] = useState<EmailAudienceSettings>({
    ...DEFAULT_EMAIL_AUDIENCE_SETTINGS,
    ...(report.emailAudienceSettings || {}),
  });

  // 설정 드로어 열림/닫힘
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<"internal_html" | "internal_text" | "consumer_html" | "consumer_text" | null>(null);

  // 설정 업데이트 핸들러
  const handleToggleSetting = (key: keyof EmailAudienceSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    if (onUpdateReport) {
      onUpdateReport({
        ...report,
        emailAudienceSettings: updated,
      });
    }
  };

  // 동일한 report 데이터에서 내부용 & 소비자용 결과 실시간 생성
  const emailResult = formatAudienceEmails(report, settings);
  const unexaminedItems = getUnexaminedInvestigationItems(report);

  // 복사 핸들러 (Rich HTML)
  const handleCopyRichHtml = async (target: "internal" | "consumer") => {
    const htmlText = target === "internal" ? emailResult.internal.htmlText : emailResult.consumer.htmlText;
    const plainText = target === "internal" ? emailResult.internal.plainText : emailResult.consumer.plainText;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([htmlText], { type: "text/html" });
        const blobText = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setCopiedType(`${target}_html`);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error("Rich HTML copy failed", e);
      await navigator.clipboard.writeText(plainText);
      setCopiedType(`${target}_text`);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  // 복사 핸들러 (Plain Text)
  const handleCopyPlainText = async (target: "internal" | "consumer") => {
    const plainText = target === "internal" ? emailResult.internal.plainText : emailResult.consumer.plainText;
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedType(`${target}_text`);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error("Text copy error", e);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Top action bar */}
      <div className="max-w-6xl w-full bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSwitchToForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>작성 폼으로</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5 text-slate-800">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold">이메일 & 소비자 안내문 생성</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              발신: 식품품질경영팀
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 설정 패널 토글 버튼 */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              isSettingsOpen
                ? "bg-blue-50 border-blue-300 text-blue-800 shadow-2xs"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>항목별 포함 설정</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
              {isSettingsOpen ? "닫기" : "열기"}
            </span>
          </button>

          <button
            type="button"
            onClick={onSwitchToReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            title="소비자용 정식 A4 공문서 보고서로 전환"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>공문서 A4 보고서 보기</span>
          </button>
        </div>
      </div>

      {/* [NEW] 항목별 '내부용에만 포함 vs 소비자용에도 포함' 설정 패널 */}
      {isSettingsOpen && (
        <div className="max-w-6xl w-full mb-5 bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  내부용 이메일 vs 소비자용 안내문 항목별 공개/포함 설정
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  동일 조사 데이터 기반 분기
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                내부용에는 기술적 근거와 공정 이력이 그대로 포함되며, 아래 체크박스로 각 항목을 소비자용 안내문에도 공개할지 개별 제어할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              닫기 ✕
            </button>
          </div>

          {/* 항목별 체크박스 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. 현품 육안 및 성상 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includeVisual}
                onChange={() => handleToggleSetting("includeVisual")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>현품 외관 성상 및 육안</span>
                  {settings.includeVisual ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">회수 현품 잔여량 및 이물 외형 관찰 내용</p>
              </div>
            </label>

            {/* 2. FT-IR / XRF 정밀 기기분석 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includeInstrumental}
                onChange={() => handleToggleSetting("includeInstrumental")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>정밀 기기분석 (FTIR / XRF)</span>
                  {settings.includeInstrumental ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">분광 스펙트럼 및 원소 비율 (체크 해제 시 내부용에만 기술)</p>
              </div>
            </label>

            {/* 3. 현미경 / 확대경 조사 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includeMicroscope}
                onChange={() => handleToggleSetting("includeMicroscope")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>현미경 / 확대경 미세 관찰</span>
                  {settings.includeMicroscope ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">배율별 파단면 및 조직 구조 상세 결과</p>
              </div>
            </label>

            {/* 4. 이화학 및 규격 검사 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includePhysicochemical}
                onChange={() => handleToggleSetting("includePhysicochemical")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>이화학 규격 & 살균 시험</span>
                  {settings.includePhysicochemical ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">소비자용에는 복잡한 수치 대신 '규격 적합' 쉬운 요약으로 제공</p>
              </div>
            </label>

            {/* 5. 제조공정 상세 (Mesh 규격, 세척) */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includeProcessDetails}
                onChange={() => handleToggleSetting("includeProcessDetails")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>공장 제조공정 & 여과망 세부</span>
                  {settings.includeProcessDetails ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부 보안용 (제외)</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">여과 Mesh, 압력 등 공장 기밀 파라미터는 기본 비공개</p>
              </div>
            </label>

            {/* 6. 동일 Lot 생산일지 및 보관품 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includeLotHistory}
                onChange={() => handleToggleSetting("includeLotHistory")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>동일 Lot 공장 보관 제품 확인</span>
                  {settings.includeLotHistory ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">당사 보관품 정상 관리 사실 안내로 고객 안심 제고</p>
              </div>
            </label>

            {/* 7. 종합 원인 판정 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includeRootCause}
                onChange={() => handleToggleSetting("includeRootCause")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>종합 원인 판정 소견</span>
                  {settings.includeRootCause ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">과학적 판정 결과를 고객 눈높이 용어로 순화하여 안내</p>
              </div>
            </label>

            {/* 8. 재발방지 및 개선대책 */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.includePreventive}
                onChange={() => handleToggleSetting("includePreventive")}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>품질 개선 및 재발방지 대책</span>
                  {settings.includePreventive ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">소비자 포함</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">내부용 전용</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">정비 주기 단축, 설비 개선 등 재발방지 의지 전달</p>
              </div>
            </label>

            {/* 9. 안전 가드레일 & 순화 스위치 */}
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={settings.useSimplifiedTerms}
                  onChange={() => handleToggleSetting("useSimplifiedTerms")}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  소비자용 쉬운 용어 변환
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={settings.strictSafetyGuard}
                  onChange={() => handleToggleSetting("strictSafetyGuard")}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span className="font-bold text-red-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                  근거 없는 안전/무해 단정 차단
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 미실시 항목 경고 배너 */}
      {unexaminedItems.length > 0 && (
        <div id="email-pane-unexamined-warning" className="max-w-6xl w-full mb-4 bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-black bg-amber-600 text-white">
                  [주의]
                </span>
                <span className="font-bold text-amber-950 text-sm">
                  미실시 / 미입력 조사 항목 {unexaminedItems.length}건 감지
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                조사하지 않은 항목이 임의로 “이상 없음”, “안전함”, “외적 요인” 등으로 왜곡되어 들어가지 않도록 시스템 가드레일이 적용되었습니다.
                해당 항목은 메일 본문에 <span className="font-semibold underline decoration-amber-500">[조사 미실시]</span>로 명확히 분리 표기됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 안전 표현 규정 준수 배너 (소비자용에서 차단된 경우) */}
      {emailResult.consumer.violationsBlocked.length > 0 && (
        <div className="max-w-6xl w-full mb-4 bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 shadow-2xs flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-900">
                [식품안전 규정 준수 완료]
              </span>{" "}
              근거 없는 단정 표현 ({emailResult.consumer.violationsBlocked.join(", ")}) {emailResult.consumer.violationsBlocked.length}건이 객관적인 규격 적합 사실 표현으로 자동 정제되었습니다.
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold shrink-0">
            소비자보호 가이드라인 준수
          </span>
        </div>
      )}

      {/* 뷰 모드 전환 탭 (내부용 vs 소비자용 vs 비교보기) */}
      <div className="max-w-6xl w-full mb-4 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">문서 대상:</span>
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("internal")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "internal"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${viewMode === "internal" ? "text-blue-400" : "text-slate-500"}`} />
              <span>내부용 이메일 (기술적/세부)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("consumer")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "consumer"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${viewMode === "consumer" ? "text-emerald-400" : "text-slate-500"}`} />
              <span>소비자용 안내문 (쉬운 표현/안전표현 정제)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("compare")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "compare"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>나란히 비교보기 (Side-by-Side)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode !== "compare" ? (
            <>
              <button
                type="button"
                onClick={() => handleCopyPlainText(viewMode as "internal" | "consumer")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copiedType === `${viewMode}_text` ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">텍스트 복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>일반 텍스트 복사</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopyRichHtml(viewMode as "internal" | "consumer")}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors active:scale-95"
              >
                {copiedType === `${viewMode}_html` ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>서식 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-white" />
                    <span>그룹웨어 메일 복사 (서식 포함)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              * 비교 모드에서는 각 문서 하단의 전용 복사 버튼을 이용하세요.
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "compare" ? (
        /* ========================================================================= */
        /* VIEW: 나란히 비교보기 (Side-by-Side Split View)                             */
        /* ========================================================================= */
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Left: 내부용 이메일 */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold">내부용 이메일 (커뮤니케이션팀 보고)</h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopyRichHtml("internal")}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>서식 복사</span>
              </button>
            </div>
            <div className="p-3 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-900">
              <strong>특징:</strong> 정밀 시험 수치, Mesh 규격, 공정 이력, 종합 원인 판정 및 재발방지대책 포함
            </div>
            <div
              className="p-5 text-xs leading-relaxed overflow-y-auto max-h-[700px] border-b border-slate-100"
              dangerouslySetInnerHTML={{ __html: emailResult.internal.htmlText }}
            />
          </div>

          {/* Right: 소비자용 안내문 */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold">소비자용 안내문 (직접 발송/안내)</h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopyRichHtml("consumer")}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>서식 복사</span>
              </button>
            </div>
            <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-[11px] text-emerald-900">
              <strong>특징:</strong> 비전문가 눈높이 쉬운 용어, 내부 보안 정보 제외, 근거 없는 무해/안전 단정 표현 금지 준수
            </div>
            <div
              className="p-5 text-xs leading-relaxed overflow-y-auto max-h-[700px] border-b border-slate-100"
              dangerouslySetInnerHTML={{ __html: emailResult.consumer.htmlText }}
            />
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW: 단일 뷰 (내부용 또는 소비자용)                                        */
        /* ========================================================================= */
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Header Card */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  {viewMode === "internal" ? "사내 보고 및 CS 응대용" : "소비자 공식 안내 및 사과문"}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {viewMode === "internal" ? emailResult.internal.subject : emailResult.consumer.subject}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {viewMode === "internal" ? "수신: 커뮤니케이션팀" : "수신: 고객님"}
                </span>
              </div>
            </div>

            {/* Omitted Items Badge (소비자용일 때 내부용에만 남겨둔 항목 안내) */}
            {viewMode === "consumer" && emailResult.consumer.omittedInternalItems.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">🔒 소비자용 제외 항목(내부용에만 포함됨):</span>
                {emailResult.consumer.omittedInternalItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* HTML Preview Body */}
          <div className="p-8">
            <div
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
              dangerouslySetInnerHTML={{
                __html: viewMode === "internal" ? emailResult.internal.htmlText : emailResult.consumer.htmlText,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
