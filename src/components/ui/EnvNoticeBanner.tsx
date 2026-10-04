"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import { Database, Info } from "lucide-react";

export function EnvNoticeBanner() {
  if (isSupabaseConfigured) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Supabase (PostgreSQL)</strong> に接続中
          </span>
        </div>
        <span className="text-[11px] opacity-75">クラウドDB同期有効</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          現在 <strong>ローカル保存モード</strong> で動作中です（.env.local に Supabase のキーを設定すると自動で PostgreSQL 連携に切り替わります）。
        </span>
      </div>
      <span className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded text-[11px] font-mono">
        ローカル動作中
      </span>
    </div>
  );
}
