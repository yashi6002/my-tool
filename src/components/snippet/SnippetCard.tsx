"use client";

import { Snippet } from "@/types/database";
import { CopyButton } from "../ui/CopyButton";
import { Trash2, Clock } from "lucide-react";

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => Promise<void>;
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
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

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* カードヘッダー */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {snippet.title}
          </h3>
          <button
            type="button"
            onClick={handleDelete}
            className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            title="削除"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 本文エリア */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-lg p-3 border border-zinc-100 dark:border-zinc-800/80 mb-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed select-all">
            {snippet.content}
          </p>
        </div>
      </div>

      {/* カードフッター */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 mt-auto">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formattedDate}
        </span>
        <CopyButton textToCopy={snippet.content} />
      </div>
    </div>
  );
}
