"use client";

import { useState, useRef } from "react";
import {
  PaydayCycle,
  FixedCost,
  SavingPlan,
  ExtraExpense,
  CalendarEventItem,
  CategoryColors,
  FinanceBackupData,
} from "@/types/finance";
import {
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Trash2,
  Sparkles,
} from "lucide-react";

interface Props {
  cycle: PaydayCycle;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
  calendarEvents: CalendarEventItem[];
  categoryColors: CategoryColors;
  onRestoreData: (backup: FinanceBackupData) => void;
  onResetData: () => void;
  onInsertDemoData: () => void;
}

export function DataBackupSection({
  cycle,
  fixedCosts,
  savingPlans,
  extraExpenses,
  calendarEvents,
  categoryColors,
  onRestoreData,
  onResetData,
  onInsertDemoData,
}: Props) {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMsg = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. JSON バックアップエクスポート
  const handleExportJSON = () => {
    try {
      const backup: FinanceBackupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        cycle,
        fixedCosts,
        savingPlans,
        extraExpenses,
        calendarEvents,
        categoryColors,
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `finance-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg("JSONバックアップファイルをダウンロードしました", "success");
    } catch (err) {
      showMsg("エクスポート中にエラーが発生しました", "error");
    }
  };

  // 2. CSV エクスポート（日々の収支・固定費・臨時出費）
  const handleExportCSV = () => {
    try {
      // BOM付きUTF-8でExcel文字化けを防ぐ
      const bom = "\uFEFF";
      const rows: string[] = [];

      rows.push("種類,項目名,金額(円),日付/引落日,カテゴリ/区分,メモ");

      // 給与
      rows.push(`給与,今月給与支給,${cycle.salary},毎月${cycle.payday}日,収入,-`);

      // 固定費
      fixedCosts.forEach((f) => {
        rows.push(`固定費,"${f.name.replace(/"/g, '""')}",${f.amount},${f.due_day ? `毎月${f.due_day}日` : "-"},${f.category},"${(f.memo || "").replace(/"/g, '""')}"`);
      });

      // 貯金
      savingPlans.forEach((s) => {
        rows.push(`貯金・投資,"${s.name.replace(/"/g, '""')}",${s.amount},-,貯金,"${(s.memo || "").replace(/"/g, '""')}"`);
      });

      // 臨時出費
      extraExpenses.forEach((e) => {
        rows.push(`臨時出費,"${e.name.replace(/"/g, '""')}",${e.amount},${e.date || "-"},臨時出費,"${(e.memo || "").replace(/"/g, '""')}"`);
      });

      // カレンダーイベント
      calendarEvents.forEach((ev) => {
        rows.push(`カレンダー,"${ev.name.replace(/"/g, '""')}",${ev.type === "income" ? ev.amount : -ev.amount},${ev.date},${ev.type === "income" ? "入金" : "出金"},"${(ev.memo || "").replace(/"/g, '""')}"`);
      });

      const csvContent = bom + rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `finance-data-${dateStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg("CSV明細ファイルをダウンロードしました", "success");
    } catch (err) {
      showMsg("CSVエクスポート中にエラーが発生しました", "error");
    }
  };

  // 3. JSON インポート（復元）
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as FinanceBackupData;

        // 簡易バリデーション
        if (!data.cycle || !Array.isArray(data.fixedCosts) || !Array.isArray(data.savingPlans)) {
          showMsg("無効なバックアップファイル形式です", "error");
          return;
        }

        onRestoreData(data);
        showMsg("バックアップからデータを正常に復元しました！", "success");
      } catch (err) {
        showMsg("JSONファイルの解析に失敗しました", "error");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* 通知トースト */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* アクションボタングリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* JSON エクスポート */}
        <button
          type="button"
          onClick={handleExportJSON}
          className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                JSONバックアップ保存
              </span>
              <span className="text-[10px] text-slate-400">
                全設定と収支を完全保存
              </span>
            </div>
          </div>
          <FileText className="w-4 h-4 text-slate-300 dark:text-slate-600" />
        </button>

        {/* CSV エクスポート */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                CSV明細エクスポート
              </span>
              <span className="text-[10px] text-slate-400">
                Excelやスプレッドシート用
              </span>
            </div>
          </div>
          <Download className="w-4 h-4 text-slate-300 dark:text-slate-600" />
        </button>

        {/* JSON インポート */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  バックアップから復元
                </span>
                <span className="text-[10px] text-slate-400">
                  JSONファイルを読み込み
                </span>
              </div>
            </div>
            <Upload className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </button>
        </div>

        {/* デモデータ挿入 */}
        <button
          type="button"
          onClick={onInsertDemoData}
          className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                デモデータを投入
              </span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                1ヶ月分のリアルなサンプル
              </span>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* データ初期化ボタン ＆ 確認ダイアログ */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          全データをクリアして初期状態に戻します
        </p>

        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-rose-500">本当に初期化しますか？</span>
            <button
              type="button"
              onClick={() => {
                onResetData();
                setShowResetConfirm(false);
                showMsg("データを初期化しました", "success");
              }}
              className="text-xs font-bold px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              初期化を実行
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>全データ初期化</span>
          </button>
        )}
      </div>
    </div>
  );
}
