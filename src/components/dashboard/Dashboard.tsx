"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, Snippet } from "@/types/database";
import {
  getFolders,
  createFolder as apiCreateFolder,
  deleteFolder as apiDeleteFolder,
  getSnippetsByFolder,
  createSnippet as apiCreateSnippet,
  deleteSnippet as apiDeleteSnippet,
} from "@/lib/api";
import { FolderSidebar } from "@/components/folder/FolderSidebar";
import { SnippetView } from "@/components/snippet/SnippetView";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { Sparkles } from "lucide-react";

export function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);

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

  // 選択中フォルダのスニペット一覧を取得
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

  useEffect(() => {
    if (selectedFolderId) {
      fetchSnippets(selectedFolderId);
    } else {
      setSnippets([]);
    }
  }, [selectedFolderId, fetchSnippets]);

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
              定型文＆テンプレート管理
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
            第2週機能実装済み
          </span>
        </div>
      </header>

      {/* 2カラムレイアウト（左：フォルダ、右：定型文） */}
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
          isLoading={isLoadingSnippets}
          onCreateSnippet={handleCreateSnippet}
          onDeleteSnippet={handleDeleteSnippet}
        />
      </div>
    </div>
  );
}
