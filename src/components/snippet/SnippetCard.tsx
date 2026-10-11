"use client";

import { Snippet, FolderColor } from "@/types/database";
import { CopyButton } from "../ui/CopyButton";
import { Trash2, Clock, Star } from "lucide-react";

interface SnippetCardProps {
  snippet: Snippet;
  themeColor?: FolderColor;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite?: (id: string, current: boolean) => Promise<void>;
}

export function SnippetCard({
  snippet,
  themeColor = "blue",
  onDelete,
  onToggleFavorite,
}: SnippetCardProps) {
  const formattedDate = new Date(snippet.created_at).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`定型文「${snippet.title}」を削除してもよろしいですか？`)) {
      await onDelete(snippet.id);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      await onToggleFavorite(snippet.id, Boolean(snippet.is_favorite));
    }
  };

  const isFavorite = Boolean(snippet.is_favorite);

  return (
    <div
      className={`group relative rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg border ${
        isFavorite
          ? "bg-gradient-to-br from-amber-500/5 via-white to-white dark:from-amber-500/10 dark:via-zinc-900 dark:to-zinc-900 border-amber-300 dark:border-amber-700/70 shadow-amber-500/5 ring-1 ring-amber-400/20"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div>
        {/* カードヘッダー */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* お気に入りスターボタン */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`p-1 rounded-lg transition-transform active:scale-125 cursor-pointer ${
                isFavorite
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-zinc-300 dark:text-zinc-600 hover:text-amber-400 opacity-60 group-hover:opacity-100"
              }`}
              title={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? "fill-amber-400 stroke-amber-400" : ""
                }`}
              />
            </button>

            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {snippet.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
            title="削除"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 本文エリア */}
        <div className="bg-zinc-50/80 dark:bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-100 dark:border-zinc-800/80 mb-4 transition-colors group-hover:bg-zinc-50 dark:group-hover:bg-zinc-950">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed select-all">
            {snippet.content}
          </p>
        </div>
      </div>

      {/* カードフッター */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 mt-auto">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3" />
          {formattedDate}
        </span>
        <CopyButton
          textToCopy={snippet.content}
          themeColor={themeColor}
        />
      </div>
    </div>
  );
}
