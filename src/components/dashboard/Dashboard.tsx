"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, Snippet, ImageItem, FolderColor, FolderIconType } from "@/types/database";
import {
  getFolders,
  createFolder as apiCreateFolder,
  updateFolder as apiUpdateFolder,
  deleteFolder as apiDeleteFolder,
  getSnippetsByFolder,
  createSnippet as apiCreateSnippet,
  deleteSnippet as apiDeleteSnippet,
  toggleSnippetFavorite as apiToggleSnippetFavorite,
  getImagesByFolder,
  uploadImage as apiUploadImage,
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
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // フォルダ一覧を取得
  const fetchFolders = useCallback(async () => {
    try {
      setIsLoadingFolders(true);
      const data = await getFolders();
      setFolders(data);
      if (data.length > 0 && !selectedFolderId) {
        setSelectedFolderId(data[0].id);
      }
    } catch (err) {
      console.error("フォルダ取得失敗:", err);
    } finally {
      setIsLoadingFolders(false);
    }
  }, [selectedFolderId]);

  // 初期ロード
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // 選択中フォルダの定型文一覧を取得
  const fetchSnippets = useCallback(async (folderId: string) => {
    try {
      setIsLoadingSnippets(true);
      const data = await getSnippetsByFolder(folderId);
      setSnippets(data);
    } catch (err) {
      console.error("スニペット取得失敗:", err);
    } finally {
      setIsLoadingSnippets(false);
    }
  }, []);

  // 選択中フォルダの画像一覧を取得
  const fetchImages = useCallback(async (folderId: string) => {
    try {
      setIsLoadingImages(true);
      const data = await getImagesByFolder(folderId);
      setImages(data);
    } catch (err) {
      console.error("画像一覧取得失敗:", err);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  // フォルダ選択変更時のデータ再取得
  useEffect(() => {
    if (selectedFolderId) {
      fetchSnippets(selectedFolderId);
      fetchImages(selectedFolderId);
    } else {
      setSnippets([]);
      setImages([]);
    }
  }, [selectedFolderId, fetchSnippets, fetchImages]);

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
    setSnippets((prev) => [newSnippet, ...prev]);
  };

  // スニペット削除ハンドラー
  const handleDeleteSnippet = async (id: string) => {
    await apiDeleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  // スニペットお気に入りトグル
  const handleToggleSnippetFavorite = async (id: string, current: boolean) => {
    const nextStatus = await apiToggleSnippetFavorite(id, current);
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_favorite: nextStatus } : s))
    );
  };

  // 画像アップロードハンドラー（複数ファイル対応）
  const handleUploadImages = async (files: File[]) => {
    if (!selectedFolderId) return;
    for (const file of files) {
      const newImage = await apiUploadImage(selectedFolderId, file);
      setImages((prev) => [newImage, ...prev]);
    }
  };

  // 画像削除ハンドラー
  const handleDeleteImage = async (id: string, filePath: string) => {
    await apiDeleteImage(id, filePath);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // 画像お気に入りトグル
  const handleToggleImageFavorite = async (id: string, current: boolean) => {
    const nextStatus = await apiToggleImageFavorite(id, current);
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, is_favorite: nextStatus } : img))
    );
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) || null;

  const totalFavorites =
    snippets.filter((s) => s.is_favorite).length +
    images.filter((img) => img.is_favorite).length;

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

      {/* 2カラムレイアウト（左：フォルダツリー、右：定型文 ＆ 画像） */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
        <SnippetView
          folders={folders}
          selectedFolder={selectedFolder}
          snippets={snippets}
          images={images}
          isLoadingSnippets={isLoadingSnippets}
          isLoadingImages={isLoadingImages}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onCreateSnippet={handleCreateSnippet}
          onDeleteSnippet={handleDeleteSnippet}
          onToggleSnippetFavorite={handleToggleSnippetFavorite}
          onUploadImages={handleUploadImages}
          onDeleteImage={handleDeleteImage}
          onToggleImageFavorite={handleToggleImageFavorite}
        />
      </div>
    </div>
  );
}
