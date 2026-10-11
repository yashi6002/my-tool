"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  Snippet,
  ImageItem,
  UpdateSnippetInput,
  UpdateImageInput,
} from "@/types/database";
import { COLOR_CONFIGS, ICON_MAP } from "@/lib/theme";
import { SnippetCard } from "./SnippetCard";
import { CreateSnippetModal } from "./CreateSnippetModal";
import { EditSnippetModal } from "./EditSnippetModal";
import { ImageGallery } from "@/components/image/ImageGallery";
import { EditImageModal } from "@/components/image/EditImageModal";
import {
  Plus,
  Search,
  FolderClosed,
  FileText,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";

interface SnippetViewProps {
  folders: Folder[];
  selectedFolder: Folder | null;
  snippets: Snippet[];
  images: ImageItem[];
  isLoadingSnippets: boolean;
  isLoadingImages: boolean;
  currentTab?: "snippets" | "images";
  onTabChange?: (tab: "snippets" | "images") => void;
  onSelectFolder: (id: string) => void;
  onCreateSnippet: (title: string, content: string) => Promise<void>;
  onUpdateSnippet: (id: string, data: UpdateSnippetInput) => Promise<void>;
  onDeleteSnippet: (id: string) => Promise<void>;
  onToggleSnippetFavorite: (id: string, current: boolean) => Promise<void>;
  onUploadImages: (files: File[]) => Promise<void>;
  onUpdateImage: (id: string, data: UpdateImageInput) => Promise<void>;
  onDeleteImage: (id: string, filePath: string) => Promise<void>;
  onToggleImageFavorite: (id: string, current: boolean) => Promise<void>;
}

function getFolderPath(folders: Folder[], currentFolder: Folder | null): Folder[] {
  if (!currentFolder) return [];
  const path: Folder[] = [currentFolder];
  let curr = currentFolder;
  while (curr.parent_id) {
    const parent = folders.find((f) => f.id === curr.parent_id);
    if (!parent || path.some((p) => p.id === parent.id)) break;
    path.unshift(parent);
    curr = parent;
  }
  return path;
}

export function SnippetView({
  folders,
  selectedFolder,
  snippets,
  images,
  isLoadingSnippets,
  isLoadingImages,
  currentTab = "snippets",
  onTabChange,
  onSelectFolder,
  onCreateSnippet,
  onUpdateSnippet,
  onDeleteSnippet,
  onToggleSnippetFavorite,
  onUploadImages,
  onUpdateImage,
  onDeleteImage,
  onToggleImageFavorite,
}: SnippetViewProps) {
  const [internalTab, setInternalTab] = useState<"snippets" | "images">(currentTab);
  const [isCreateSnippetOpen, setIsCreateSnippetOpen] = useState(false);
  const [snippetToEdit, setSnippetToEdit] = useState<Snippet | null>(null);
  const [imageToEdit, setImageToEdit] = useState<ImageItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setInternalTab(currentTab);
  }, [currentTab]);

  const handleTabSwitch = (tab: "snippets" | "images") => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

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

  const breadcrumbs = getFolderPath(folders, selectedFolder);
  const colorConfig = COLOR_CONFIGS[selectedFolder.color || "blue"] || COLOR_CONFIGS.blue;
  const FolderIconComponent = ICON_MAP[selectedFolder.icon || "folder"] || ICON_MAP.folder;

  // 定型文をお気に入り優先でソート
  const sortedSnippets = [...snippets].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredSnippets = sortedSnippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
      {/* ビューヘッダー */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 pt-4 pb-0 flex flex-col gap-4">
        {/* パンくずリスト */}
        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 -mb-2">
            {breadcrumbs.map((f, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={f.id} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />}
                  {isLast ? (
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {f.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectFolder(f.id)}
                      className="hover:text-zinc-800 dark:hover:text-zinc-100 hover:underline cursor-pointer"
                    >
                      {f.name}
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {/* フォルダ名 & アクション */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl text-white ${colorConfig.bgSolid} shadow-xs transition-colors`}
            >
              <FolderIconComponent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {selectedFolder.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {breadcrumbs.length > 1 ? `第${breadcrumbs.length}階層のフォルダ` : "最上位フォルダ"}
              </p>
            </div>
          </div>

          {internalTab === "snippets" && (
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
                onClick={() => setIsCreateSnippetOpen(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 ${colorConfig.bgSolid} hover:opacity-90 active:scale-95 text-white rounded-xl text-sm font-medium transition-all shadow-xs shrink-0 cursor-pointer`}
              >
                <Plus className="w-4 h-4" />
                <span>定型文を追加</span>
              </button>
            </div>
          )}
        </div>

        {/* タブ切り替えバー */}
        <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-1">
          <button
            type="button"
            onClick={() => handleTabSwitch("snippets")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              internalTab === "snippets"
                ? `border-current ${colorConfig.text}`
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>テキスト定型文</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
                internalTab === "snippets"
                  ? colorConfig.badge
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {snippets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("images")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              internalTab === "images"
                ? `border-current ${colorConfig.text}`
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>画像ギャラリー</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
                internalTab === "images"
                  ? colorConfig.badge
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {images.length}
            </span>
          </button>
        </div>
      </div>

      {/* タブコンテンツ */}
      {internalTab === "snippets" ? (
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
                    onClick={() => setIsCreateSnippetOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 ${colorConfig.bgSolid} text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer`}
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
                  themeColor={selectedFolder.color || "blue"}
                  onEdit={(s) => setSnippetToEdit(s)}
                  onDelete={onDeleteSnippet}
                  onToggleFavorite={onToggleSnippetFavorite}
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
          onEditImage={(img) => setImageToEdit(img)}
          onDeleteImage={onDeleteImage}
          onToggleFavorite={onToggleImageFavorite}
        />
      )}

      {/* 新規登録モーダル */}
      <CreateSnippetModal
        folderName={selectedFolder.name}
        folderId={selectedFolder.id}
        isOpen={isCreateSnippetOpen}
        onClose={() => setIsCreateSnippetOpen(false)}
        onSubmit={async (title, content) => {
          await onCreateSnippet(title, content);
        }}
      />

      {/* 定型文 編集・移動モーダル */}
      <EditSnippetModal
        isOpen={Boolean(snippetToEdit)}
        snippet={snippetToEdit}
        folders={folders}
        onClose={() => setSnippetToEdit(null)}
        onSubmit={async (id, data) => {
          await onUpdateSnippet(id, data);
        }}
      />

      {/* 画像 名称変更・移動モーダル */}
      <EditImageModal
        isOpen={Boolean(imageToEdit)}
        image={imageToEdit}
        folders={folders}
        onClose={() => setImageToEdit(null)}
        onSubmit={async (id, data) => {
          await onUpdateImage(id, data);
        }}
      />
    </div>
  );
}
