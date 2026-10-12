"use client";

import { useState, useEffect } from "react";
import { Folder, ImageItem, UpdateImageInput } from "@/types/database";
import { X, Edit3, FolderInput } from "lucide-react";

interface EditImageModalProps {
  isOpen: boolean;
  image: ImageItem | null;
  folders: Folder[];
  onClose: () => void;
  onSubmit: (id: string, data: UpdateImageInput) => Promise<void>;
}

export function EditImageModal({
  isOpen,
  image,
  folders,
  onClose,
  onSubmit,
}: EditImageModalProps) {
  const [fileName, setFileName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      setFileName(image.file_name);
      setFolderId(image.folder_id);
    }
  }, [image, isOpen]);

  if (!isOpen || !image) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setError("画像名を入力してください");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(image.id, {
        file_name: fileName.trim(),
        folder_id: folderId,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "画像の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                画像の名称変更・フォルダ移動
              </h2>
              <p className="text-xs text-zinc-400">
                表示名や所属先フォルダを変更できます
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* プレビュー ＆ フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-lg text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* 画像ミニプレビュー */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.public_url}
              alt={image.file_name}
              className="w-14 h-14 object-cover rounded-lg shrink-0 border border-zinc-200 dark:border-zinc-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {image.file_name}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {image.content_type || "画像ファイル"}
              </p>
            </div>
          </div>

          {/* 所属フォルダの移動 */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FolderInput className="w-3.5 h-3.5 text-blue-600" />
              <span>所属フォルダ（移動先）</span>
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 画像ファイル名（名称） */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              画像ファイル名（名称） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* フッター */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fileName.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "保存中..." : "変更を保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

