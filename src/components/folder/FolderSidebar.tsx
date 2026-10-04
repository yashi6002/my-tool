"use client";

import { useState } from "react";
import { Folder } from "@/types/database";
import { Folder as FolderIcon, Plus, Trash2, FolderOpen } from "lucide-react";

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

export function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: FolderSidebarProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      await onCreateFolder(newFolderName.trim());
      setNewFolderName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "フォルダ作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    if (confirm(`フォルダ「${folder.name}」と中の定型文をすべて削除してもよろしいですか？`)) {
      await onDeleteFolder(folder.id);
    }
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-zinc-50 dark:bg-zinc-950/80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
      {/* サイドバーヘッダー */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          フォルダ一覧
        </h2>

        {/* 新規フォルダ作成インラインフォーム */}
        <form onSubmit={handleCreate} className="space-y-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="新しいフォルダ名..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isCreating || !newFolderName.trim()}
              className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              title="フォルダを追加"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </form>
      </div>

      {/* フォルダリスト */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {folders.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500">
            フォルダがありません。<br />上のフォームから追加してください。
          </div>
        ) : (
          folders.map((folder) => {
            const isSelected = folder.id === selectedFolderId;
            return (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-sm font-medium ${
                  isSelected
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSelected ? (
                    <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <FolderIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate">{folder.name}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, folder)}
                  className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="フォルダを削除"
                  aria-label="フォルダを削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
