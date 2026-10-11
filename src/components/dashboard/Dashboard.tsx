"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  Snippet,
  ImageItem,
  FolderColor,
  FolderIconType,
  UpdateSnippetInput,
  UpdateImageInput,
} from "@/types/database";
import {
  getFolders,
  createFolder as apiCreateFolder,
  updateFolder as apiUpdateFolder,
  deleteFolder as apiDeleteFolder,
  getAllSnippets,
  createSnippet as apiCreateSnippet,
  updateSnippet as apiUpdateSnippet,
  deleteSnippet as apiDeleteSnippet,
  toggleSnippetFavorite as apiToggleSnippetFavorite,
  getAllImages,
  uploadImage as apiUploadImage,
  updateImage as apiUpdateImage,
  deleteImage as apiDeleteImage,
  toggleImageFavorite as apiToggleImageFavorite,
} from "@/lib/api";
import { FolderSidebar } from "@/components/folder/FolderSidebar";
import { SnippetView } from "@/components/snippet/SnippetView";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sparkles, Star } from "lucide-react";

export function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"snippets" | "images">("snippets");

  const [allSnippets, setAllSnippets] = useState<Snippet[]>([]);
  const [allImages, setAllImages] = useState<ImageItem[]>([]);

  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // 初期データロード
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoadingFolders(true);
      setIsLoadingContent(true);

      const [foldersData, snippetsData, imagesData] = await Promise.all([
        getFolders(),
        getAllSnippets(),
        getAllImages(),
      ]);

      setFolders(foldersData);
      setAllSnippets(snippetsData);
      setAllImages(imagesData);

      if (foldersData.length > 0 && !selectedFolderId) {
        setSelectedFolderId(foldersData[0].id);
      }
    } catch (err) {
      console.error("データ取得失敗:", err);
    } finally {
      setIsLoadingFolders(false);
      setIsLoadingContent(false);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // フォルダ作成ハンドラー（階層・カラー・アイコン対応）
  const handleCreateFolder = async (data: {
    name: string;
    parent_id: string | null;
    color: FolderColor;
    icon: FolderIconType;
  }) => {
    const newFolder = await apiCreateFolder(data);
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
  };

  // フォルダ更新ハンドラー
  const handleUpdateFolder = async (
    id: string,
    data: { name: string; color: FolderColor; icon: FolderIconType }
  ) => {
    const updated = await apiUpdateFolder(id, data);
    setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  // フォルダ削除ハンドラー
  const handleDeleteFolder = async (id: string) => {
    await apiDeleteFolder(id);
    const remaining = folders.filter((f) => f.id !== id && f.parent_id !== id);
    setFolders(remaining);

    // 削除されたフォルダ配下のアイテムを state から除外
    setAllSnippets((prev) => prev.filter((s) => s.folder_id !== id));
    setAllImages((prev) => prev.filter((img) => img.folder_id !== id));

    if (selectedFolderId === id) {
      setSelectedFolderId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // スニペット作成ハンドラー
  const handleCreateSnippet = async (title: string, content: string) => {
    if (!selectedFolderId) return;
    const newSnippet = await apiCreateSnippet({
      folder_id: selectedFolderId,
      title,
      content,
    });
    setAllSnippets((prev) => [newSnippet, ...prev]);
  };

  // スニペット更新（名称変更・フォルダ移動）ハンドラー
  const handleUpdateSnippet = async (id: string, data: UpdateSnippetInput) => {
    const updated = await apiUpdateSnippet(id, data);
    setAllSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
    // もし移動先が別のフォルダなら、移動先フォルダを選択
    if (data.folder_id && data.folder_id !== selectedFolderId) {
      setSelectedFolderId(data.folder_id);
    }
  };

  // スニペット削除ハンドラー
  const handleDeleteSnippet = async (id: string) => {
    await apiDeleteSnippet(id);
    setAllSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  // スニペットお気に入りトグル
  const handleToggleSnippetFavorite = async (id: string, current: boolean) => {
    const nextStatus = await apiToggleSnippetFavorite(id, current);
    setAllSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_favorite: nextStatus } : s))
    );
  };

  // 画像アップロードハンドラー（複数ファイル対応）
  const handleUploadImages = async (files: File[]) => {
    if (!selectedFolderId) return;
    for (const file of files) {
      const newImage = await apiUploadImage(selectedFolderId, file);
      setAllImages((prev) => [newImage, ...prev]);
    }
  };

  // 画像更新（名称変更・フォルダ移動）ハンドラー
  const handleUpdateImage = async (id: string, data: UpdateImageInput) => {
    const updated = await apiUpdateImage(id, data);
    setAllImages((prev) => prev.map((img) => (img.id === id ? updated : img)));
    if (data.folder_id && data.folder_id !== selectedFolderId) {
      setSelectedFolderId(data.folder_id);
    }
  };

  // 画像削除ハンドラー
  const handleDeleteImage = async (id: string, filePath: string) => {
    await apiDeleteImage(id, filePath);
    setAllImages((prev) => prev.filter((img) => img.id !== id));
  };

  // 画像お気に入りトグル
  const handleToggleImageFavorite = async (id: string, current: boolean) => {
    const nextStatus = await apiToggleImageFavorite(id, current);
    setAllImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, is_favorite: nextStatus } : img))
    );
  };

  // サイドバーでアイテムがクリックされた時の遷移
  const handleSidebarSelectItem = (folderId: string, tab: "snippets" | "images") => {
    setSelectedFolderId(folderId);
    setCurrentTab(tab);
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) || null;

  // 選択中フォルダの定型文と画像
  const selectedSnippets = selectedFolderId
    ? allSnippets.filter((s) => s.folder_id === selectedFolderId)
    : [];
  const selectedImages = selectedFolderId
    ? allImages.filter((img) => img.folder_id === selectedFolderId)
    : [];

  const totalFavorites =
    allSnippets.filter((s) => s.is_favorite).length +
    allImages.filter((img) => img.is_favorite).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* データベース接続通知バー */}
      <EnvNoticeBanner />

      {/* トップアプリバー */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">
              Snippet Flow
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">
              定型文 ＆ 画像アセットマネージャー
            </p>
          </div>
        </div>

        {/* 右側アクション：統計・テーマ切り替え */}
        <div className="flex items-center gap-3">
          {totalFavorites > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span>★ {totalFavorites} 件お気に入り</span>
            </div>
          )}

          <div className="h-4 w-px bg-zinc-200 dark:border-zinc-800 hidden sm:block" />

          {/* ダーク/ライトモード切り替え */}
          <ThemeToggle />
        </div>
      </header>

      {/* 2カラムレイアウト（左：フォルダツリー＆アイテム一覧、右：定型文 ＆ 画像ビュー） */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <FolderSidebar
          folders={folders}
          snippets={allSnippets}
          images={allImages}
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onSelectItem={handleSidebarSelectItem}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
        <SnippetView
          folders={folders}
          selectedFolder={selectedFolder}
          snippets={selectedSnippets}
          images={selectedImages}
          isLoadingSnippets={isLoadingContent}
          isLoadingImages={isLoadingContent}
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onCreateSnippet={handleCreateSnippet}
          onUpdateSnippet={handleUpdateSnippet}
          onDeleteSnippet={handleDeleteSnippet}
          onToggleSnippetFavorite={handleToggleSnippetFavorite}
          onUploadImages={handleUploadImages}
          onUpdateImage={handleUpdateImage}
          onDeleteImage={handleDeleteImage}
          onToggleImageFavorite={handleToggleImageFavorite}
        />
      </div>
    </div>
  );
}
