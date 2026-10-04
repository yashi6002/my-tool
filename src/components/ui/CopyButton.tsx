"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  showText?: boolean;
}

export function CopyButton({
  textToCopy,
  className = "",
  showText = true,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // レガシーブラウザ向けフォールバック
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

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
        copied
          ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-400/50"
          : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
      } ${className}`}
      title="クリックして本文をコピー"
      aria-label="本文をコピー"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 animate-scale-in" />
          {showText && <span>コピーしました!</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {showText && <span>コピー</span>}
        </>
      )}
    </button>
  );
}
