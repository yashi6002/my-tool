"use client";

import { useState } from "react";
import {
  Folder,
  FolderColor,
  FolderIconType,
  FolderTreeNode,
  Snippet,
  ImageItem,
} from "@/types/database";
import { COLOR_CONFIGS, ICON_MAP } from "@/lib/theme";
import { FolderModal } from "./FolderModal";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  Star,
  ListTree,
  FolderTree,
} from "lucide-react";

interface FolderSidebarProps {
  folders: Folder[];
  snippets: Snippet[];
  images: ImageItem[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onSelectItem?: (folderId: string, tab: "snippets" | "images") => void;
  onCreateFolder: (data: {
    name: string;
    parent_id: string | null;
    color: FolderColor;
    icon: FolderIconType;
  }) => Promise<void>;
  onUpdateFolder: (
    id: string,
    data: { name: string; color: FolderColor; icon: FolderIconType }
  ) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

// フォルダ一覧をツリー構造に整形する再帰関数
function buildFolderTree(
  folders: Folder[],
  parentId: string | null = null,
  depth = 0
): FolderTreeNode[] {
  return folders
    .filter((f) => (f.parent_id || null) === parentId)
    .map((f) => ({
      ...f,
      depth,
      children: buildFolderTree(folders, f.id, depth + 1),
    }));
}

export function FolderSidebar({
  folders,
  snippets,
  images,
  selectedFolderId,
  onSelectFolder,
  onSelectItem,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}: FolderSidebarProps) {
  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<string | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  // ツリーの折りたたみ状態（デフォルトはすべて展開）
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  // フォルダ内のファイル（定型文・画像）もツリーに一覧表示するかどうかのトグル
  const [showFilesTree, setShowFilesTree] = useState(true);

  const toggleCollapse = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedMap((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleOpenCreateModal = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFolderToEdit(null);
    setModalParentId(parentId);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToEdit(folder);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    const hasChildren = folders.some((f) => f.parent_id === folder.id);
    const msg = hasChildren
      ? `フォルダ「${folder.name}」とその中にある子フォルダ・定型文・画像をすべて削除しますか？`
      : `フォルダ「${folder.name}」を削除してもよろしいですか？`;

    if (confirm(msg)) {
      await onDeleteFolder(folder.id);
    }
  };

  const folderTree = buildFolderTree(folders);

  // ツリーノードを再帰描画するコンポーネント
  const renderTreeNode = (node: FolderTreeNode) => {
    const isSelected = node.id === selectedFolderId;
    const nodeChildren = node.children || [];
    const nodeSnippets = snippets.filter((s) => s.folder_id === node.id);
    const nodeImages = images.filter((img) => img.folder_id === node.id);

    const hasSubFolders = nodeChildren.length > 0;
    const hasItems = showFilesTree && (nodeSnippets.length > 0 || nodeImages.length > 0);
    const hasExpandableContent = hasSubFolders || hasItems;

    const isCollapsed = Boolean(collapsedMap[node.id]);

    const colorConfig = COLOR_CONFIGS[node.color || "blue"] || COLOR_CONFIGS.blue;
    const IconComponent = ICON_MAP[node.icon || "folder"] || ICON_MAP.folder;

    // インデント計算（depth に応じてインデント）
    const paddingLeftClass =
      node.depth === 1 ? "pl-5" : node.depth === 2 ? "pl-9" : node.depth && node.depth >= 3 ? "pl-14" : "pl-2";
    const itemPaddingClass =
      node.depth === 1 ? "pl-11" : node.depth === 2 ? "pl-15" : node.depth && node.depth >= 3 ? "pl-20" : "pl-8";

    return (
      <div key={node.id} className="space-y-0.5">
        <div
          onClick={() => onSelectFolder(node.id)}
          className={`group relative flex items-center justify-between pr-2 py-1.5 rounded-xl cursor-pointer transition-all duration-150 text-xs font-medium ${paddingLeftClass} ${
            isSelected
              ? `${colorConfig.bgLight} ${colorConfig.text} font-bold shadow-xs border ${colorConfig.border}`
              : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
          }`}
        >
          {/* 左側：展開アイコン + フォルダアイコン + 名前 */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasExpandableContent ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded shrink-0 cursor-pointer"
                title={isCollapsed ? "展開" : "折りたたむ"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-3.5 h-3.5 shrink-0" />
            )}

            {/* カラー付きアイコン */}
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                isSelected
                  ? `${colorConfig.bgSolid} text-white shadow-xs`
                  : `${colorConfig.bgLight} ${colorConfig.text}`
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
            </div>

            <span className="truncate flex-1 font-semibold">{node.name}</span>

            {/* フォルダ内のアイテム総数バッジ */}
            {(nodeSnippets.length > 0 || nodeImages.length > 0) && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono px-1">
                {nodeSnippets.length + nodeImages.length}
              </span>
            )}
          </div>

          {/* 右側：サブフォルダ追加・編集・削除アクション */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {/* サブフォルダ追加 */}
            {(!node.depth || node.depth < 2) && (
              <button
                type="button"
                onClick={(e) => handleOpenCreateModal(node.id, e)}
                className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="この中にサブフォルダを追加"
                aria-label="サブフォルダ追加"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* フォルダ編集 */}
            <button
              type="button"
              onClick={(e) => handleOpenEditModal(node, e)}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="編集"
              aria-label="フォルダ編集"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            {/* フォルダ削除 */}
            <button
              type="button"
              onClick={(e) => handleDelete(e, node)}
              className="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="削除"
              aria-label="フォルダ削除"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 展開されている場合：子フォルダ ＆ ファイル一覧を表示 */}
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* 1. 子フォルダ */}
            {hasSubFolders && (
              <div className="space-y-0.5">
                {nodeChildren.map((child) => renderTreeNode(child))}
              </div>
            )}

            {/* 2. 所属する定型文一覧 */}
            {showFilesTree &&
              nodeSnippets.map((s) => (
                <div
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectItem) {
                      onSelectItem(node.id, "snippets");
                    } else {
                      onSelectFolder(node.id);
                    }
                  }}
                  className={`flex items-center gap-2 py-1 pr-2 rounded-lg cursor-pointer transition-colors text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 ${itemPaddingClass}`}
                  title={s.title}
                >
                  <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate flex-1">{s.title}</span>
                  {s.is_favorite && (
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>
              ))}

            {/* 3. 所属する画像一覧 */}
            {showFilesTree &&
              nodeImages.map((img) => (
                <div
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectItem) {
                      onSelectItem(node.id, "images");
                    } else {
                      onSelectFolder(node.id);
                    }
                  }}
                  className={`flex items-center gap-2 py-1 pr-2 rounded-lg cursor-pointer transition-colors text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 ${itemPaddingClass}`}
                  title={img.file_name}
                >
                  <ImageIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate flex-1">{img.file_name}</span>
                  {img.is_favorite && (
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-zinc-50 dark:bg-zinc-950/80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
      {/* サイドバーヘッダー */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            エクスプローラー
          </h2>

          {/* ファイル表示/非表示切り替えトグル */}
          <button
            type="button"
            onClick={() => setShowFilesTree((prev) => !prev)}
            className={`p-1 rounded-lg text-xs transition-colors cursor-pointer border ${
              showFilesTree
                ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-700"
            }`}
            title={
              showFilesTree
                ? "中身のファイル一覧を隠す（フォルダのみ表示）"
                : "中身の定型文・画像もツリーに表示する"
            }
          >
            {showFilesTree ? (
              <ListTree className="w-3.5 h-3.5" />
            ) : (
              <FolderTree className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateModal(null)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer hover:shadow-md"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>新規フォルダ</span>
        </button>
      </div>

      {/* フォルダツリー一覧 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {folders.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-400 dark:text-zinc-500">
            フォルダがありません。<br />「新規フォルダ」から作成してください。
          </div>
        ) : (
          folderTree.map((node) => renderTreeNode(node))
        )}
      </div>

      {/* フォルダ作成・編集モーダル */}
      <FolderModal
        isOpen={isModalOpen}
        folders={folders}
        initialParentId={modalParentId}
        folderToEdit={folderToEdit}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          if (folderToEdit) {
            await onUpdateFolder(folderToEdit.id, data);
          } else {
            await onCreateFolder(data);
          }
        }}
      />
    </aside>
  );
}
