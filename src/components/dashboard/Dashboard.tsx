"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, Snippet, ImageItem } from "@/types/database";
import {
  getFolders,
  createFolder as apiCreateFolder,
  deleteFolder as apiDeleteFolder,
  getSnippetsByFolder,
  createSnippet as apiCreateSnippet,
  deleteSnippet as apiDeleteSnippet,
  getImagesByFolder,
  uploadImage as apiUploadImage,
  deleteImage as apiDeleteImage,
} from "@/lib/api";
import { FolderSidebar } from "@/components/folder/FolderSidebar";
import { SnippetView } from "@/components/snippet/SnippetView";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { Sparkles } from "lucide-react";

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

  // フォルダ作成ハンドラー
  const handleCreateFolder = async (name: string) => {
    const newFolder = await apiCreateFolder({ name });
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
  };

  // フォルダ削除ハンドラー
  const handleDeleteFolder = async (id: string) => {
    await apiDeleteFolder(id);
    const remaining = folders.filter((f) => f.id !== id);
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

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* データベース接続通知バー */}
      <EnvNoticeBanner />

      {/* トップアプリバー */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">
              Snippet Flow
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">
              定型文 ＆ 画像アセット管理
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
            第3週（定型文 ＆ 画像管理）
          </span>
        </div>
      </header>

      {/* 2カラムレイアウト（左：フォルダ、右：定型文 ＆ 画像） */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
        <SnippetView
          selectedFolder={selectedFolder}
          snippets={snippets}
          images={images}
          isLoadingSnippets={isLoadingSnippets}
          isLoadingImages={isLoadingImages}
          onCreateSnippet={handleCreateSnippet}
          onDeleteSnippet={handleDeleteSnippet}
          onUploadImages={handleUploadImages}
          onDeleteImage={handleDeleteImage}
        />
      </div>
    </div>
  );
}
