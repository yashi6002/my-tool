"use client";

import { useState } from "react";
import { Folder, Snippet, ImageItem } from "@/types/database";
import { SnippetCard } from "./SnippetCard";
import { CreateSnippetModal } from "./CreateSnippetModal";
import { ImageGallery } from "@/components/image/ImageGallery";
import { Plus, Search, FolderClosed, FileText, Image as ImageIcon } from "lucide-react";

interface SnippetViewProps {
  selectedFolder: Folder | null;
  snippets: Snippet[];
  images: ImageItem[];
  isLoadingSnippets: boolean;
  isLoadingImages: boolean;
  onCreateSnippet: (title: string, content: string) => Promise<void>;
  onDeleteSnippet: (id: string) => Promise<void>;
  onUploadImages: (files: File[]) => Promise<void>;
  onDeleteImage: (id: string, filePath: string) => Promise<void>;
}

export function SnippetView({
  selectedFolder,
  snippets,
  images,
  isLoadingSnippets,
  isLoadingImages,
  onCreateSnippet,
  onDeleteSnippet,
  onUploadImages,
  onDeleteImage,
}: SnippetViewProps) {
  const [activeTab, setActiveTab] = useState<"snippets" | "images">("snippets");
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
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 pt-4 pb-0 flex flex-col gap-4">
        {/* フォルダ名 & アクション */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                フォルダ
              </span>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {selectedFolder.name}
              </h1>
            </div>
          </div>

          {activeTab === "snippets" && (
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
          )}
        </div>

        {/* タブ切り替えバー */}
        <div className="flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-800 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("snippets")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "snippets"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>テキスト定型文</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === "snippets"
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {snippets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "images"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>画像ギャラリー</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === "images"
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {images.length}
            </span>
          </button>
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === "snippets" ? (
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingSnippets ? (
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
      ) : (
        <ImageGallery
          selectedFolder={selectedFolder}
          images={images}
          isLoading={isLoadingImages}
          onUploadImages={onUploadImages}
          onDeleteImage={onDeleteImage}
        />
      )}

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
