import React, { useState, useEffect } from "react";
import {
  X,
  Workflow,
  Factory,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  Edit3,
  Check,
  Tag,
  Package,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { ProcessStepMaster } from "../types";
import { saveProcessStep, toggleProcessStepActive } from "../data/processStepMaster";

interface ProcessStepDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: ProcessStepMaster | null;
  onStepUpdated?: (updatedStep: ProcessStepMaster) => void;
}

export function ProcessStepDetailModal({
  isOpen,
  onClose,
  step,
  onStepUpdated,
}: ProcessStepDetailModalProps) {
  const [currentStep, setCurrentStep] = useState<ProcessStepMaster | null>(step);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ProcessStepMaster>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(step);
    if (step) {
      setEditFormData({ ...step });
    }
    setIsEditing(false);
  }, [step, isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!isOpen || !currentStep) return null;

  const handleToggleActive = () => {
    const updated = toggleProcessStepActive(currentStep.id);
    const target = updated.find((s) => s.id === currentStep.id);
    if (target) {
      setCurrentStep(target);
      if (onStepUpdated) onStepUpdated(target);
      showToast(
        `'${target.processName}' 공정이 ${target.isActive ? "가동(사용 중)" : "비가동(미사용)"} 상태로 변경되었습니다.`
      );
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.processName?.trim()) {
      alert("공정명을 입력해 주세요.");
      return;
    }

    const toSave: ProcessStepMaster = {
      ...currentStep,
      processName: editFormData.processName.trim(),
      manufacturer: editFormData.manufacturer?.trim() || currentStep.manufacturer,
      manufactureLine: editFormData.manufactureLine?.trim() || currentStep.manufactureLine,
      stepNumber: typeof editFormData.stepNumber === "number" ? editFormData.stepNumber : currentStep.stepNumber,
      description: editFormData.description?.trim() || "",
      keyEquipment: editFormData.keyEquipment?.trim() || "",
      controlPoints: editFormData.controlPoints?.trim() || "",
      rawMaterials: editFormData.rawMaterials?.trim() || "",
      isCCP: editFormData.isCCP ?? false,
      ccpNumber: editFormData.isCCP ? editFormData.ccpNumber?.trim() : undefined,
      qualityRisks: editFormData.qualityRisks?.trim() || "",
      possibleDefects: editFormData.possibleDefects || [],
      isActive: editFormData.isActive ?? true,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    saveProcessStep(toSave);
    setCurrentStep(toSave);
    setIsEditing(false);
    if (onStepUpdated) onStepUpdated(toSave);
    showToast(`'${toSave.processName}' 공정 정보가 성공적으로 저장되었습니다.`);
  };

  const handleAddDefectTag = (tag: string) => {
    const current = editFormData.possibleDefects || [];
    if (!current.includes(tag)) {
      setEditFormData({
        ...editFormData,
        possibleDefects: [...current, tag],
      });
    }
  };

  const handleRemoveDefectTag = (tag: string) => {
    const current = editFormData.possibleDefects || [];
    setEditFormData({
      ...editFormData,
      possibleDefects: current.filter((t) => t !== tag),
    });
  };

  const COMMON_DEFECTS = [
    "변질/산패",
    "유리 파손/이물",
    "캡 흠집/탄화",
    "침전물/혼탁",
    "시밍 불량/누액",
    "용기 변형",
    "내용량 부족",
    "금속 이물",
    "표시 오류(인자 불량)",
    "라벨 불량",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* 상단 모달 헤더 */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Step {currentStep.stepNumber}
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {currentStep.processName}
                </h3>
                {currentStep.isCCP && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                    {currentStep.ccpNumber || "CCP"}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    currentStep.isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-slate-700 text-slate-400 border border-slate-600"
                  }`}
                >
                  {currentStep.isActive ? "가동 중" : "비가동"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {currentStep.manufacturer} · {currentStep.manufactureLine} (공정 ID:{" "}
                <span className="font-mono text-slate-200">{currentStep.id}</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>정보 수정</span>
              </button>
            )}
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

        {/* 토스트 알림 */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-center gap-2 shadow-inner shrink-0">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isEditing ? (
            /* ======================================================== */
            /* [A] 공정 정보 수정 폼 */
            /* ======================================================== */
            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    공정 순서 (Step) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editFormData.stepNumber ?? currentStep.stepNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        stepNumber: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    제조처
                  </label>
                  <input
                    type="text"
                    value={editFormData.manufacturer ?? currentStep.manufacturer}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, manufacturer: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    제조라인
                  </label>
                  <input
                    type="text"
                    value={editFormData.manufactureLine ?? currentStep.manufactureLine}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, manufactureLine: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    공정명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.processName || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, processName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    CCP(중점관리점) 여부
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.isCCP === true}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            isCCP: e.target.checked,
                            ccpNumber: e.target.checked ? editFormData.ccpNumber || "CCP-1B" : "",
                          })
                        }
                        className="rounded text-rose-600"
                      />
                      <span className="font-bold text-rose-700">HACCP CCP 지정</span>
                    </label>
                    {editFormData.isCCP && (
                      <input
                        type="text"
                        value={editFormData.ccpNumber || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, ccpNumber: e.target.value })
                        }
                        placeholder="예: CCP-1B"
                        className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-rose-300 rounded-lg text-rose-700"
                      />
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    공정 상세 설명
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.description || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    주요 설비
                  </label>
                  <input
                    type="text"
                    value={editFormData.keyEquipment || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, keyEquipment: e.target.value })
                    }
                    placeholder="예: 초고온 UHT 살균기, 로터리 캡퍼"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    주요 관리항목 (SOP 기준)
                  </label>
                  <input
                    type="text"
                    value={editFormData.controlPoints || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, controlPoints: e.target.value })
                    }
                    placeholder="예: 살균온도 135±2℃, 유지시간 30초"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    관련 원부자재
                  </label>
                  <input
                    type="text"
                    value={editFormData.rawMaterials || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, rawMaterials: e.target.value })
                    }
                    placeholder="예: 비타민C, 구연산, 갈색 유리병 100ml, 알루미늄 캡"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    주요 품질 리스크
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.qualityRisks || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, qualityRisks: e.target.value })
                    }
                    placeholder="예: 살균온도 저하 시 미생물 증식 변질, 캡퍼 롤러 마모 시 탄화물 발생"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    발생 가능한 이상 유형 태그
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(editFormData.possibleDefects || []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveDefectTag(t)}
                          className="hover:text-rose-950 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="text-slate-400 self-center mr-1">추천 추가:</span>
                    {COMMON_DEFECTS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleAddDefectTag(d)}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      >
                        + {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-200 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>공정 저장</span>
                </button>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* [B] 공정 상세 보기 화면 */
            /* ======================================================== */
            <div className="space-y-4">
              {/* [공정 Master 식별 정보 카드] */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">
                  공정 Master 식별 정보
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">공정 ID</span>
                    <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200 block truncate" title={currentStep.id}>
                      {currentStep.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">공정 순서</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 block">
                      {currentStep.stepNumber}번째 공정
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">제조처</span>
                    <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 block truncate" title={currentStep.manufacturer}>
                      {currentStep.manufacturer || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">제조라인</span>
                    <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 block truncate" title={currentStep.manufactureLine}>
                      {currentStep.manufactureLine || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 공정 설명 카드 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  공정 작업 설명
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {currentStep.description || "등록된 공정 설명이 없습니다."}
                </p>
              </div>

              {/* 설비 및 관리 기준 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>설비 및 공정 관리 기준</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">주요 설비</span>
                    <strong className="text-slate-900">{currentStep.keyEquipment || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">주요 관리항목</span>
                    <strong className="text-slate-900">{currentStep.controlPoints || "-"}</strong>
                  </div>
                  {currentStep.rawMaterials && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-slate-400 block">관련 원부자재</span>
                      <span className="text-slate-800 font-medium">{currentStep.rawMaterials}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* HACCP & 품질 리스크 */}
              <div
                className={`border rounded-2xl p-4 space-y-3 ${
                  currentStep.isCCP
                    ? "bg-rose-50/70 border-rose-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck
                      className={`w-4 h-4 ${
                        currentStep.isCCP ? "text-rose-600" : "text-slate-600"
                      }`}
                    />
                    <span>HACCP 관리 및 품질 리스크</span>
                  </h4>
                  {currentStep.isCCP ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                      {currentStep.ccpNumber || "중점관리점 (CCP)"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                      일반 공정 (Non-CCP)
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5">
                  <span className="text-[11px] text-slate-500 block">주요 품질 리스크</span>
                  <p className="text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
                    {currentStep.qualityRisks || "특이 리스크 없음"}
                  </p>
                </div>

                {/* 발생 가능한 이상 유형 태그 */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1.5">
                    발생 가능한 클레임/이상 유형
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentStep.possibleDefects && currentStep.possibleDefects.length > 0 ? (
                      currentStep.possibleDefects.map((def) => (
                        <span
                          key={def}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
                        >
                          {def}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">지정된 이상 유형 없음</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 모달 하단 푸터 */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              currentStep.isActive
                ? "bg-white text-slate-700 hover:bg-slate-100 border-slate-300"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-bold"
            }`}
          >
            {currentStep.isActive ? "이 공정 비가동 처리" : "이 공정 가동 활성화"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
