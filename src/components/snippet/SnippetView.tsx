"use client";

import { useState } from "react";
import { Folder, Snippet } from "@/types/database";
import { SnippetCard } from "./SnippetCard";
import { CreateSnippetModal } from "./CreateSnippetModal";
import { Plus, Search, FolderClosed, FileText } from "lucide-react";

interface SnippetViewProps {
  selectedFolder: Folder | null;
  snippets: Snippet[];
  isLoading: boolean;
  onCreateSnippet: (title: string, content: string) => Promise<void>;
  onDeleteSnippet: (id: string) => Promise<void>;
}

export function SnippetView({
  selectedFolder,
  snippets,
  isLoading,
  onCreateSnippet,
  onDeleteSnippet,
}: SnippetViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!selectedFolder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4">
          <FolderClosed className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          フォルダが選択されていません
        </h3>
        <p className="text-xs text-zinc-500 max-w-xs">
          左側のサイドバーからフォルダを選択するか、新しいフォルダを作成してください。
        </p>
      </div>
    );
  }

  const filteredSnippets = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
      {/* ビューヘッダー */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              フォルダ
            </span>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {selectedFolder.name}
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {snippets.length} 件の定型文が登録されています
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 検索入力 */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="定型文を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-48 transition-all"
            />
          </div>

          {/* 新規定型文追加ボタン */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-medium transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>定型文を追加</span>
          </button>
        </div>
      </div>

      {/* スニペット一覧コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            {searchQuery ? (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  一致する定型文が見つかりませんでした
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  検索ワードを変えてお試しください
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  定型文がまだありません
                </p>
                <p className="text-xs text-zinc-400 mt-1 mb-4">
                  右上の「定型文を追加」ボタンからよく使う文章を登録しましょう
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  初めての定型文を登録
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onDelete={onDeleteSnippet}
              />
            ))}
          </div>
        )}
      </div>

      {/* 新規追加モーダル */}
      <CreateSnippetModal
        folderName={selectedFolder.name}
        folderId={selectedFolder.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (title, content) => {
          await onCreateSnippet(title, content);
        }}
      />
    </div>
  );
}
