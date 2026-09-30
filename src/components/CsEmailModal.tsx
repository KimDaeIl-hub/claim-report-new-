import React, { useState } from "react";
import {
  Copy,
  Check,
  X,
  Mail,
  Building2,
  UserCheck,
  ShieldCheck,
  Share2,
  Sliders,
  Sparkles,
} from "lucide-react";
import { ReportData, EmailAudienceSettings } from "../types";
import {
  formatAudienceEmails,
  DEFAULT_EMAIL_AUDIENCE_SETTINGS,
} from "../utils/emailAudienceFormatter";

interface CsEmailModalProps {
  report: ReportData;
  isOpen: boolean;
  onClose: () => void;
  onUpdateReport?: (updated: ReportData) => void;
}

export function CsEmailModal({ report, isOpen, onClose, onUpdateReport }: CsEmailModalProps) {
  // Target: 'internal_comm' vs 'direct_consumer'
  const [emailTarget, setEmailTarget] = useState<"internal_comm" | "direct_consumer">("internal_comm");
  const [includeHtmlFormat, setIncludeHtmlFormat] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<EmailAudienceSettings>({
    ...DEFAULT_EMAIL_AUDIENCE_SETTINGS,
    ...(report.emailAudienceSettings || {}),
  });

  if (!isOpen) return null;

  const handleToggleSetting = (key: keyof EmailAudienceSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    if (onUpdateReport) {
      onUpdateReport({ ...report, emailAudienceSettings: updated });
    }
  };

  const emailResult = formatAudienceEmails(report, settings);

  const currentPlainText =
    emailTarget === "internal_comm"
      ? emailResult.internal.plainText
      : emailResult.consumer.plainText;

  const currentHtmlText =
    emailTarget === "internal_comm"
      ? emailResult.internal.htmlText
      : emailResult.consumer.htmlText;

  const handleCopy = async () => {
    try {
      if (includeHtmlFormat && navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([currentHtmlText], { type: "text/html" });
        const blobText = new Blob([currentPlainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(currentPlainText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
      await navigator.clipboard.writeText(currentPlainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  이메일 & 소비자 안내문 생성
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  발신: 식품품질경영팀
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                동일한 조사 데이터에서 내부용과 소비자용 문서를 분리하여 생성합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Selector Tabs & Options */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setEmailTarget("internal_comm")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                emailTarget === "internal_comm"
                  ? "bg-white text-blue-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>커뮤니케이션팀 회신 (내부용)</span>
            </button>

            <button
              type="button"
              onClick={() => setEmailTarget("direct_consumer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                emailTarget === "direct_consumer"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>소비자 직접 발송용 (쉬운 표현/안전표현 정제)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              isSettingsOpen
                ? "bg-blue-50 border-blue-300 text-blue-800"
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-3 h-3 text-blue-600" />
            <span>항목별 포함 설정</span>
          </button>
        </div>

        {/* Settings Accordion */}
        {isSettingsOpen && (
          <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 shrink-0 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>소비자용 안내문 포함 여부 설정 (체크 해제 시 내부용에만 포함됨):</span>
              <span className="text-[11px] text-blue-700">실시간 반영 중</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeVisual}
                  onChange={() => handleToggleSetting("includeVisual")}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                <span>현품 외관 성상</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeInstrumental}
                  onChange={() => handleToggleSetting("includeInstrumental")}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                <span>FTIR/XRF 기기분석</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeMicroscope}
                  onChange={() => handleToggleSetting("includeMicroscope")}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                <span>현미경/확대경</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeProcessDetails}
                  onChange={() => handleToggleSetting("includeProcessDetails")}
                  className="rounded text-blue-600 w-3.5 h-3.5"
                />
                <span>공장 제조공정 상세</span>
              </label>
            </div>
          </div>
        )}

        {/* Safety Guard Notice */}
        {emailTarget === "direct_consumer" && emailResult.consumer.violationsBlocked.length > 0 && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              근거 없는 안전/무해 단정 표현이 객관적 사실 표현으로 자동 정제되었습니다.
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">
              규정 준수
            </span>
          </div>
        )}

        {/* Email Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div
            className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 text-xs sm:text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentHtmlText }}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={includeHtmlFormat}
              onChange={(e) => setIncludeHtmlFormat(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Outlook / 웹메일 서식 유지 복사 (Rich HTML)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-xs ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>클립보드 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>이메일 본문 복사</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
