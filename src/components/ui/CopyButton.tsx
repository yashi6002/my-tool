"use client";

import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { FolderColor } from "@/types/database";
import { COLOR_CONFIGS } from "@/lib/theme";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  showText?: boolean;
  themeColor?: FolderColor;
}

export function CopyButton({
  textToCopy,
  className = "",
  showText = true,
  themeColor = "blue",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err);
    }
  };

  const colorConfig = COLOR_CONFIGS[themeColor] || COLOR_CONFIGS.blue;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer shadow-xs active:scale-90 ${
        copied
          ? "bg-emerald-600 text-white shadow-emerald-500/25 ring-4 ring-emerald-400/30 scale-105"
          : `${colorConfig.bgSolid} text-white hover:opacity-90 hover:shadow-md hover:-translate-y-0.5`
      } ${className}`}
      title="クリックして本文をコピー"
      aria-label="本文をコピー"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 animate-bounce" />
          {showText && <span>コピーしました!</span>}
          <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse ml-0.5" />
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 transition-transform group-hover:rotate-6" />
          {showText && <span>コピー</span>}
        </>
      )}
    </button>
  );
}
