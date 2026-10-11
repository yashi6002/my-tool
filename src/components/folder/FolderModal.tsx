"use client";

import { useState, useEffect } from "react";
import { Folder, FolderColor, FolderIconType } from "@/types/database";
import {
  AVAILABLE_COLORS,
  AVAILABLE_ICONS,
  COLOR_CONFIGS,
  ICON_MAP,
} from "@/lib/theme";
import { X, Folder as FolderIcon, Check } from "lucide-react";

interface FolderModalProps {
  isOpen: boolean;
  folders: Folder[];
  initialParentId?: string | null;
  folderToEdit?: Folder | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    parent_id: string | null;
    color: FolderColor;
    icon: FolderIconType;
  }) => Promise<void>;
}

export function FolderModal({
  isOpen,
  folders,
  initialParentId = null,
  folderToEdit = null,
  onClose,
  onSubmit,
}: FolderModalProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(initialParentId);
  const [color, setColor] = useState<FolderColor>("blue");
  const [icon, setIcon] = useState<FolderIconType>("folder");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setParentId(folderToEdit.parent_id || null);
      setColor(folderToEdit.color || "blue");
      setIcon(folderToEdit.icon || "folder");
    } else {
      setName("");
      setParentId(initialParentId || null);
      setColor("blue");
      setIcon("folder");
    }
  }, [folderToEdit, initialParentId, isOpen]);

  if (!isOpen) return null;

  // 編集時は自分自身とその子孫は親フォルダに選べないように除外
  const selectableParents = folders.filter((f) => {
    if (!folderToEdit) return true;
    return f.id !== folderToEdit.id && f.parent_id !== folderToEdit.id;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("フォルダ名を入力してください");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        parent_id: parentId,
        color,
        icon,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIconComponent = ICON_MAP[icon] || FolderIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl text-white ${
                COLOR_CONFIGS[color]?.bgSolid || "bg-blue-600"
              } transition-colors shadow-xs`}
            >
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {folderToEdit ? "フォルダの編集" : "新しいフォルダの作成"}
              </h2>
              <p className="text-xs text-zinc-400">
                階層やテーマカラーをカスタマイズ
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

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-lg text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* フォルダ名 */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              フォルダ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例: 大学課題、業務連絡、デザイン素材..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* 親フォルダ（階層化）選択 */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              階層の配置（親フォルダ）
            </label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">📂 最上位（ルート階層に置く）</option>
              {selectableParents.map((f) => (
                <option key={f.id} value={f.id}>
                  └ 📁 {f.name} の中（サブフォルダ）
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-400 mt-1">
              ※ 親フォルダを選ぶことで、フォルダの中にサブフォルダを格納できます
            </p>
          </div>

          {/* カラーパレット選択 */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              テーマカラー
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => {
                const conf = COLOR_CONFIGS[c];
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full ${conf.bgSolid} flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? "ring-3 ring-offset-2 ring-zinc-400 dark:ring-zinc-600 scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    title={conf.label}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* アイコン選択 */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              アイコン
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ICONS.map((ic) => {
                const IconComponent = ICON_MAP[ic];
                const isSelected = icon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs scale-105"
                        : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
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
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "保存中..." : folderToEdit ? "更新する" : "作成する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

