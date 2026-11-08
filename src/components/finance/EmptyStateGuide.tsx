"use client";

import { Sparkles, Calendar, DollarSign, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface Props {
  onInsertDemoData: () => void;
  onOpenSettings: () => void;
}

export function EmptyStateGuide({ onInsertDemoData, onOpenSettings }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 backdrop-blur-md p-6 sm:p-8 text-center my-4 transition-all">
      {/* 背景装飾 */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto space-y-4">
        {/* アイコン */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg ring-4 ring-emerald-500/20">
          <Sparkles className="w-7 h-7" />
        </div>

        {/* 見出し */}
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            ダッシュボードへようこそ！
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            まずは給料日と毎月の固定費を登録して、自由に使えるお金（フリー額）を自動算出しましょう。
            使い勝手をすぐに確認したい場合は、ワンクリックでリアルなデモデータを投入できます。
          </p>
        </div>

        {/* 3ステップ簡単ガイド */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
              STEP 1
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              給与＆給料日
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              手取り額と給料日を設定し、サイクルを決定します。
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
              STEP 2
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              固定費・貯金
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              家賃や光熱費、NISA積立など先取り額を登録。
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
              STEP 3
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              フリー額を確認
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              日々の残高予測と自由額がリアルタイムに可視化！
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onInsertDemoData}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>1ヶ月分のデモデータを投入して試す</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all"
          >
            <span>自分で設定する</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
