import React, { useRef, useState } from "react";
import { Upload, X, Eye, EyeOff } from "lucide-react";
import { ReportData, PhotoAttachment } from "../types";
import { compressImageFile } from "./PhotoUploadField";

export type LinkTarget = "intake" | "quality";

type BucketKey =
  | "customerPhotos"
  | "retainedSamplePhotos"
  | "attachment1Photos"
  | "attachment2Photos"
  | "attachment3Photos";

/**
 * 탭 연결 판정 (레거시 호환)
 * - linkedSections 명시(빈 배열 포함) 시 그대로 사용
 * - 미지정(레거시) 시 버킷 기본값: 고객 사진→접수/현품, 보관품 사진→품질 조사
 */
export function resolvePhotoLinks(
  p: PhotoAttachment,
  bucket: BucketKey
): LinkTarget[] {
  if (p.linkedSections !== undefined) return p.linkedSections;
  if (bucket === "customerPhotos") return ["intake"];
  if (bucket === "retainedSamplePhotos") return ["quality"];
  return [];
}

const BUCKET_META: Array<{ key: BucketKey; label: string; legacy?: boolean }> = [
  { key: "customerPhotos", label: "고객 제공 사진" },
  { key: "retainedSamplePhotos", label: "보관품 사진" },
  { key: "attachment1Photos", label: "일반 첨부" },
  { key: "attachment2Photos", label: "기존 첨부 2", legacy: true },
  { key: "attachment3Photos", label: "기존 첨부 3", legacy: true },
];

function getBucket(report: ReportData, key: BucketKey): PhotoAttachment[] {
  if (key === "customerPhotos") return report.customerClaim?.customerPhotos || [];
  if (key === "retainedSamplePhotos") return report.lotHistory?.retainedSamplePhotos || [];
  return report.attachments?.[key] || [];
}

interface UnifiedAttachmentManagerProps {
  report: ReportData;
  onChange: (updated: ReportData) => void;
}

/**
 * 보고서/회신 단일 첨부 관리 (유일한 등록·관리 위치)
 * - 5개 버킷을 한 화면에서 관리, 각 사진은 ID 기준 단일 데이터 (복사본 없음)
 * - 신규 등록은 고객 제공/보관품/일반 첨부 중 선택 (기존 첨부 2·3은 레거시 관리만)
 * - attachment2 쓰기는 기존 미러 규칙 유지 (lotHistory.retainedSamplePhotos 동기화)
 */
export function UnifiedAttachmentManager({ report, onChange }: UnifiedAttachmentManagerProps) {
  const [addBucket, setAddBucket] = useState<BucketKey>("attachment1Photos");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyBucket = (next: ReportData, key: BucketKey, photos: PhotoAttachment[]): ReportData => {
    if (key === "customerPhotos") {
      return { ...next, customerClaim: { ...next.customerClaim, customerPhotos: photos } };
    }
    if (key === "retainedSamplePhotos") {
      return { ...next, lotHistory: { ...next.lotHistory, retainedSamplePhotos: photos } };
    }
    // attachment2 미러 규칙 (기존 updateAttachments와 동일 동작)
    if (key === "attachment2Photos") {
      return {
        ...next,
        attachments: { ...next.attachments, attachment2Photos: photos },
        lotHistory: { ...next.lotHistory, retainedSamplePhotos: photos },
      };
    }
    return {
      ...next,
      attachments: { ...next.attachments, [key]: photos },
    };
  };

  const editPhotoEverywhere = (id: string, patch: Partial<PhotoAttachment>) => {
    let next: ReportData = JSON.parse(JSON.stringify(report));
    let touchedAtt2 = false;
    (Object.keys({
      customerPhotos: 1,
      retainedSamplePhotos: 1,
      attachment1Photos: 1,
      attachment2Photos: 1,
      attachment3Photos: 1,
    }) as BucketKey[]).forEach((key) => {
      const list = getBucket(next, key);
      if (list.some((p) => p.id === id)) {
        if (key === "attachment2Photos") touchedAtt2 = true;
        next = applyBucket(next, key, list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      }
    });
    // att2 미러는 applyBucket 내부에서 처리됨 (별도 조치 불필요)
    void touchedAtt2;
    onChange(next);
  };

  const deletePhotoEverywhere = (id: string) => {
    let next: ReportData = JSON.parse(JSON.stringify(report));
    ([
      "customerPhotos",
      "retainedSamplePhotos",
      "attachment1Photos",
      "attachment2Photos",
      "attachment3Photos",
    ] as BucketKey[]).forEach((key) => {
      const list = getBucket(next, key);
      if (list.some((p) => p.id === id)) {
        next = applyBucket(
          next,
          key,
          list.filter((p) => p.id !== id)
        );
      }
    });
    onChange(next);
  };

  const movePhoto = (bucket: BucketKey, id: string, direction: -1 | 1) => {
    const list = getBucket(report, bucket);
    const idx = list.findIndex((p) => p.id === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= list.length) return;
    const reordered = [...list];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(target, 0, moved);
    onChange(applyBucket(JSON.parse(JSON.stringify(report)), bucket, reordered));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setWarningMessage(null);
    const validFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6);
    if (validFiles.length === 0) {
      setWarningMessage("이미지 파일(JPG, PNG, WebP 등)만 첨부할 수 있습니다.");
      return;
    }
    setIsProcessing(true);
    try {
      const newItems: PhotoAttachment[] = [];
      for (const file of validFiles) {
        const compressedUrl = await compressImageFile(file);
        if (compressedUrl) {
          newItems.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            url: compressedUrl,
            caption: file.name.replace(/\.[^/.]+$/, ""),
          });
        }
      }
      if (newItems.length > 0) {
        const next = applyBucket(JSON.parse(JSON.stringify(report)), addBucket, [
          ...getBucket(report, addBucket),
          ...newItems,
        ]);
        onChange(next);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleLink = (id: string, target: LinkTarget) => {
    // 현재 유효 연결을 구해 토글 후 명시 저장 (빈 배열도 저장 → 연결 없음 유지)
    const all: Array<{ p: PhotoAttachment; bucket: BucketKey }> = [];
    (BUCKET_META.map((m) => m.key) as BucketKey[]).forEach((key) => {
      getBucket(report, key).forEach((p) => {
        if (p.id === id) all.push({ p, bucket: key });
      });
    });
    if (all.length === 0) return;
    const current = resolvePhotoLinks(all[0].p, all[0].bucket);
    const nextLinks = current.includes(target)
      ? current.filter((t) => t !== target)
      : [...current, target];
    editPhotoEverywhere(id, { linkedSections: nextLinks });
  };

  const updateTitle = (field: "attachment1Title" | "attachment2Title" | "attachment3Title", value: string) => {
    onChange({
      ...report,
      attachments: { ...report.attachments, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      {/* 신규 등록 (유일한 업로드 위치) */}
      <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700">등록 위치:</span>
          {(
            [
              { key: "customerPhotos", label: "고객 제공 사진" },
              { key: "retainedSamplePhotos", label: "보관품 사진" },
              { key: "attachment1Photos", label: "일반 첨부" },
            ] as Array<{ key: BucketKey; label: string }>
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setAddBucket(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                addBucket === opt.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
            <div className="p-2 rounded-full bg-white shadow-sm border border-slate-200">
              <Upload className={`w-4 h-4 text-blue-600 ${isProcessing ? "animate-pulse" : ""}`} />
            </div>
            <p className="text-xs font-medium text-slate-700">
              {isProcessing ? "사진 최적화 처리 중..." : "클릭하여 사진 선택 또는 드래그 앤 드롭"}
            </p>
            <p className="text-[11px] text-slate-400">JPG, PNG, GIF, WebP (A4 출력 최적화)</p>
          </div>
        </div>
        {warningMessage && (
          <p className="text-[11px] text-red-600 font-medium">{warningMessage}</p>
        )}
      </div>

      {/* 첨부 그룹 명칭 (출력용, 기존 값 유지) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {(
          [
            { field: "attachment1Title", label: "[첨부 1] 명칭", ph: "예: [첨부 1] 현품 외관, 이물 확대 사진" },
            { field: "attachment2Title", label: "[첨부 2] 명칭", ph: "예: [첨부 2] 동일 Lot 공장 보관품 사진" },
            { field: "attachment3Title", label: "[첨부 3] 명칭", ph: "예: [첨부 3] 주요 제조공정 사진 그리드" },
          ] as const
        ).map((t) => (
          <div key={t.field}>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.label}</label>
            <input
              type="text"
              value={(report.attachments as any)?.[t.field] || ""}
              onChange={(e) => updateTitle(t.field, e.target.value)}
              placeholder={t.ph}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {/* 통합 목록 (버킷별 그룹, 단일 데이터 참조) */}
      {BUCKET_META.map((meta) => {
        const list = getBucket(report, meta.key);
        if (list.length === 0) return null;
        return (
          <div key={meta.key} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{meta.label}</span>
              {meta.legacy && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold">
                  기존 보관분 (신규 등록 없음)
                </span>
              )}
              <span className="text-[11px] text-slate-500">{list.length}장</span>
            </div>
            <div className="divide-y divide-slate-100">
              {list.map((p, index) => {
                const links = resolvePhotoLinks(p, meta.key);
                return (
                  <div key={p.id} className="p-3 flex flex-col sm:flex-row gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" title="원본 크기로 보기">
                        <img
                          src={p.url}
                          alt={p.caption || "첨부 사진"}
                          className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0 hover:ring-2 hover:ring-blue-400"
                        />
                      </a>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <input
                          type="text"
                          value={p.caption || ""}
                          onChange={(e) => editPhotoEverywhere(p.id, { caption: e.target.value })}
                          placeholder="사진 설명 / 캡션 입력"
                          className="w-full text-xs font-medium px-2 py-1 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={p.category || ""}
                            onChange={(e) => editPhotoEverywhere(p.id, { category: e.target.value })}
                            placeholder="분류명 (예: 소비자 제공 현품)"
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={p.stepName || ""}
                            onChange={(e) => editPhotoEverywhere(p.id, { stepName: e.target.value })}
                            placeholder="공정 단계명 (선택)"
                            className="w-full text-xs px-2 py-1 border border-blue-200 rounded text-blue-900 bg-blue-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            value={p.displaySize || "M"}
                            onChange={(e) =>
                              editPhotoEverywhere(p.id, {
                                displaySize: e.target.value as PhotoAttachment["displaySize"],
                              })
                            }
                            className="text-xs px-1.5 py-1 border border-slate-300 rounded bg-white"
                          >
                            <option value="S">작게 (S)</option>
                            <option value="M">보통 (M)</option>
                            <option value="L">크게 (L)</option>
                            <option value="XL">전체 폭 (XL)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              editPhotoEverywhere(p.id, {
                                showInReport: (p.showInReport ?? true) ? false : true,
                              })
                            }
                            className={`px-2 py-1 text-[11px] font-bold rounded border ${
                              (p.showInReport ?? true)
                                ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                                : "text-slate-500 bg-slate-100 border-slate-300"
                            }`}
                          >
                            {(p.showInReport ?? true) ? "출력 포함" : "출력 제외"}
                          </button>
                          <button
                            type="button"
                            onClick={() => movePhoto(meta.key, p.id, -1)}
                            disabled={index === 0}
                            className="px-1.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-300 rounded disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => movePhoto(meta.key, p.id, 1)}
                            disabled={index === list.length - 1}
                            className="px-1.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-300 rounded disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePhotoEverywhere(p.id)}
                            className="px-2 py-1 text-[11px] font-bold text-red-600 bg-white hover:bg-red-50 border border-slate-300 rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-1.5 sm:w-32 shrink-0 sm:border-l sm:border-slate-100 sm:pl-3">
                      <span className="text-[10px] font-bold text-slate-500">탭 연결:</span>
                      {(
                        [
                          { target: "intake", label: "접수/현품" },
                          { target: "quality", label: "품질 조사" },
                        ] as Array<{ target: "intake" | "quality"; label: string }>
                      ).map((opt) => (
                        <label
                          key={opt.target}
                          className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={links.includes(opt.target)}
                            onChange={() => toggleLink(p.id, opt.target)}
                            className="w-3.5 h-3.5 rounded text-blue-600"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 앞선 탭용 연결 사진 읽기 전용 보기 (업로드·삭제 없음, 동일 데이터 참조)
 */
export function LinkedPhotoView({
  photos,
  emptyText = "연결된 사진이 없습니다.",
}: {
  photos: PhotoAttachment[];
  emptyText?: string;
}) {
  if (!photos || photos.length === 0) {
    return <p className="text-xs text-slate-400 py-2">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {photos.map((p) => (
        <div
          key={p.id}
          className="border border-slate-200 rounded-lg p-1.5 bg-white text-center"
        >
          <a href={p.url} target="_blank" rel="noopener noreferrer" title="원본 크기로 보기">
            <img
              src={p.url}
              alt={p.caption || "연결 사진"}
              className="w-full h-28 object-contain bg-slate-50 rounded hover:ring-2 hover:ring-blue-300"
            />
          </a>
          <p className="text-[10px] font-bold text-blue-800 mt-1 truncate">
            {(p.category || "").trim() || "미분류"}
          </p>
          <p className="text-[11px] text-slate-600 truncate">{p.caption || "사진"}</p>
        </div>
      ))}
    </div>
  );
}
