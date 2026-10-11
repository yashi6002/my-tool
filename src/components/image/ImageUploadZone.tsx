"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadZoneProps {
  folderName: string;
  onUpload: (files: File[]) => Promise<void>;
}

export function ImageUploadZone({ folderName, onUpload }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    // 画像ファイルのみを抽出
    const imageFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setErrorMessage("画像ファイル（PNG, JPEG, GIF, WebP等）を選択してください");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      await onUpload(imageFiles);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "画像のアップロードに失敗しました"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[1.01]"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-blue-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-900"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-full text-blue-600 animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-full text-blue-600 dark:text-blue-400">
              {isDragging ? (
                <UploadCloud className="w-6 h-6 animate-bounce" />
              ) : (
                <ImageIcon className="w-6 h-6" />
              )}
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {isUploading
                ? "画像をアップロード中..."
                : isDragging
                ? "ここに画像をドロップ！"
                : `「${folderName}」に画像を追加`}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              ドラッグ＆ドロップ、またはクリックしてファイルを選択（複数選択可）
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 px-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

