import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Edit3 } from "lucide-react";
import { PhotoAttachment } from "../types";

interface PhotoUploadFieldProps {
  label: string;
  photos?: PhotoAttachment[];
  onChange: (photos: PhotoAttachment[]) => void;
  maxPhotos?: number;
  withStepName?: boolean;
}

// 클라이언트 측 압축 (A4 인쇄 품질 유지 + 저장 용량 관리, 통합 첨부 관리에서 재사용)
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      if (!rawUrl) {
        resolve("");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 960;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        } else {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export function PhotoUploadField({
  label,
  photos = [],
  onChange,
  maxPhotos = 6,
  withStepName = false,
}: PhotoUploadFieldProps) {
  const currentPhotos = photos || [];
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setWarningMessage(null);

    const remainingSlots = maxPhotos - currentPhotos.length;
    if (remainingSlots <= 0) {
      setWarningMessage(`최대 ${maxPhotos}장까지만 등록 가능합니다.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToProcess.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length < filesToProcess.length) {
      setWarningMessage("이미지 파일(JPG, PNG, WebP 등)만 첨부할 수 있습니다.");
    }
    if (validFiles.length === 0) return;

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
            stepName: withStepName ? "주요 관리 공정" : undefined,
          });
        }
      }
      if (newItems.length > 0) {
        onChange([...currentPhotos, ...newItems]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (id: string) => {
    onChange(currentPhotos.filter((p) => p.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(currentPhotos.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  const handleStepNameChange = (id: string, stepName: string) => {
    onChange(currentPhotos.map((p) => (p.id === id ? { ...p, stepName } : p)));
  };

  const handleCategoryChange = (id: string, category: string) => {
    onChange(currentPhotos.map((p) => (p.id === id ? { ...p, category } : p)));
  };

  const handleSizeChange = (id: string, displaySize: PhotoAttachment["displaySize"]) => {
    onChange(currentPhotos.map((p) => (p.id === id ? { ...p, displaySize } : p)));
  };

  const handleVisibilityToggle = (id: string) => {
    onChange(
      currentPhotos.map((p) =>
        p.id === id ? { ...p, showInReport: (p.showInReport ?? true) ? false : true } : p
      )
    );
  };

  const handleMove = (id: string, direction: -1 | 1) => {
    const idx = currentPhotos.findIndex((p) => p.id === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= currentPhotos.length) return;
    const reordered = [...currentPhotos];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(target, 0, moved);
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label} ({currentPhotos.length}/{maxPhotos})
        </label>
        {warningMessage && (
          <span className="text-[11px] text-red-600 font-medium">{warningMessage}</span>
        )}
      </div>

      {/* Drop zone */}
      {currentPhotos.length < maxPhotos && (
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
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
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
      )}

      {/* Photos Grid */}
      {currentPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative group bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(photo.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-90 group-hover:opacity-100"
                  title="사진 삭제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded font-mono">
                  #{index + 1}
                </div>
              </div>

              <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between bg-white">
                {(photo.showInReport ?? true) === false && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300 w-fit">
                    출력 제외 (관리 목록에만 보관)
                  </span>
                )}
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-slate-600">
                    분류명 (자유 입력):
                  </label>
                  <input
                    type="text"
                    value={photo.category || ""}
                    onChange={(e) => handleCategoryChange(photo.id, e.target.value)}
                    placeholder="예: 소비자 제공 현품 (미입력 시 미분류)"
                    className="w-full text-xs font-medium px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-600">
                      표시 크기:
                    </label>
                    <select
                      value={photo.displaySize || "M"}
                      onChange={(e) =>
                        handleSizeChange(photo.id, e.target.value as PhotoAttachment["displaySize"])
                      }
                      className="w-full text-xs font-medium px-1.5 py-1 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="S">작게 (S)</option>
                      <option value="M">보통 (M)</option>
                      <option value="L">크게 (L)</option>
                      <option value="XL">전체 폭 (XL)</option>
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-600 block">
                      순서·출력:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(photo.id, -1)}
                        disabled={index === 0}
                        className="px-1.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded disabled:opacity-40"
                        title="앞으로 이동"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(photo.id, 1)}
                        disabled={index === currentPhotos.length - 1}
                        className="px-1.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded disabled:opacity-40"
                        title="뒤로 이동"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVisibilityToggle(photo.id)}
                        className={`flex-1 px-1.5 py-1 text-[10px] font-bold rounded border transition-colors ${
                          (photo.showInReport ?? true)
                            ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                            : "text-slate-500 bg-slate-100 hover:bg-slate-200 border-slate-300"
                        }`}
                        title={(photo.showInReport ?? true) ? "보고서 출력에서 제외" : "보고서 출력에 포함"}
                      >
                        {(photo.showInReport ?? true) ? "출력" : "제외"}
                      </button>
                    </div>
                  </div>
                </div>
                {withStepName && (
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
                      공정 단계명:
                    </label>
                    <input
                      type="text"
                      value={photo.stepName || ""}
                      onChange={(e) => handleStepNameChange(photo.id, e.target.value)}
                      placeholder="공정 단계명 (예: 여과 공정)"
                      className="w-full text-xs font-medium px-2 py-1 border border-blue-200 rounded text-blue-900 bg-blue-50/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-blue-600" />
                      첨부파일명 / 캡션 (수정 가능):
                    </span>
                  </label>
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="첨부파일명 / 사진 캡션 입력"
                    className="w-full text-xs font-medium px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
