"use client";

import { useEffect } from "react";
import { ImageItem } from "@/types/database";
import { downloadImage } from "@/lib/api";
import { X, Download, Calendar, HardDrive } from "lucide-react";

interface ImagePreviewModalProps {
  image: ImageItem | null;
  onClose: () => void;
}

export function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const formattedDate = new Date(image.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedSize = image.file_size
    ? image.file_size > 1024 * 1024
      ? `${(image.file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(image.file_size / 1024)} KB`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {image.file_name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              {formattedSize && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {formattedSize}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadImage(image.public_url, image.file_name)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ダウンロード</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 拡大画像表示エリア */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-950/5 dark:bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.public_url}
            alt={image.file_name}
            className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
