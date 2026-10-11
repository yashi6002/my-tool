"use client";

import { useState } from "react";
import { ImageItem } from "@/types/database";
import { downloadImage } from "@/lib/api";
import { ZoomIn, Download, Trash2, Check } from "lucide-react";

interface ImageCardProps {
  image: ImageItem;
  onPreview: (image: ImageItem) => void;
  onDelete: (id: string, filePath: string) => Promise<void>;
}

export function ImageCard({ image, onPreview, onDelete }: ImageCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedSize = image.file_size
    ? image.file_size > 1024 * 1024
      ? `${(image.file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(image.file_size / 1024)} KB`
    : null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      await downloadImage(image.public_url, image.file_name);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error("ダウンロード失敗:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`画像「${image.file_name}」を削除してもよろしいですか？`)) {
      try {
        setIsDeleting(true);
        await onDelete(image.id, image.file_path);
      } catch (err) {
        console.error("削除失敗:", err);
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      onClick={() => onPreview(image)}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* サムネイル画像領域 */}
      <div className="relative aspect-video sm:aspect-square w-full bg-zinc-100 dark:bg-zinc-950/60 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.public_url}
          alt={image.file_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* ホバー時オーバーレイ */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(image);
            }}
            className="p-2.5 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
            title="拡大表示"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
            title="ダウンロード"
          >
            {downloadSuccess ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ファイル情報 */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {image.file_name}
          </p>
          {formattedSize && (
            <p className="text-[10px] text-zinc-400 mt-0.5">{formattedSize}</p>
          )}
        </div>

        {/* モバイル用ダウンロードボタン */}
        <div className="sm:hidden flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-zinc-500 hover:text-blue-600"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
