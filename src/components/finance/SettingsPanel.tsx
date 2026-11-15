"use client";

import {
  PaydayCycle,
  CategoryColors,
  DEFAULT_CATEGORY_COLORS,
  PRESET_COLORS,
  FixedCost,
  SavingPlan,
  ExtraExpense,
  CalendarEventItem,
  FinanceBackupData,
} from "@/types/finance";
import { DataBackupSection } from "./DataBackupSection";
import {
  Palette,
  RotateCcw,
  Database,
} from "lucide-react";

interface Props {
  cycle: PaydayCycle;
  fixedCosts?: FixedCost[];
  savingPlans?: SavingPlan[];
  extraExpenses?: ExtraExpense[];
  calendarEvents?: CalendarEventItem[];
  categoryColors: CategoryColors;
  onUpdateCategoryColors: (colors: CategoryColors) => void;
  onRestoreData?: (backup: FinanceBackupData) => void;
  onResetData?: () => void;
  onInsertDemoData?: () => void;
}

export function SettingsPanel({
  cycle,
  fixedCosts = [],
  savingPlans = [],
  extraExpenses = [],
  calendarEvents = [],
  categoryColors,
  onUpdateCategoryColors,
  onRestoreData,
  onResetData,
  onInsertDemoData,
}: Props) {
  const handleCategoryColorChange = (key: keyof CategoryColors, hex: string) => {
    onUpdateCategoryColors({
      ...categoryColors,
      [key]: hex,
    });
  };

  const handleResetCategoryColors = () => {
    onUpdateCategoryColors(DEFAULT_CATEGORY_COLORS);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. カラー設定（5大カテゴリ） ── */}
      <section className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                カテゴリカラー設定
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                円グラフやカレンダーバッジの色をカスタマイズ
              </p>
            </div>
          </div>
          <button
            onClick={handleResetCategoryColors}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
            title="標準の色に戻す"
          >
            <RotateCcw className="w-3 h-3" /> リセット
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: "free" as const,   label: "自由に使えるお金（フリー額）", desc: "残高や給料の基調色" },
            { key: "fixed" as const,  label: "固定費・引き落とし予定",     desc: "家賃・光熱費・サブスク等" },
            { key: "saving" as const, label: "貯金・投資",                 desc: "NISA・先取り貯金等" },
            { key: "food" as const,   label: "食費トラック",               desc: "スーパー、外食、日々の食費" },
            { key: "extra" as const,  label: "予定されている臨時出費",     desc: "車検・旅行・買い物等" },
          ]).map(({ key, label, desc }) => {
            const currentColor = categoryColors[key] || (key === "food" ? "#f59e0b" : "#10b981");
            return (
              <div
                key={key}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-black/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: currentColor }}
                      />
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => handleCategoryColorChange(key, e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">{desc}</p>
                </div>

                {/* プリセット選択 */}
                <div className="flex items-center gap-1 pt-1.5 border-t border-slate-200/80 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 mr-1">選ぶ:</span>
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleCategoryColorChange(key, p.hex)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        currentColor.toLowerCase() === p.hex.toLowerCase()
                          ? "scale-125 ring-2 ring-offset-1 ring-slate-400"
                          : "opacity-75 hover:opacity-100 hover:scale-110"
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. データ管理 ＆ バックアップ ── */}
      {onRestoreData && onResetData && onInsertDemoData && (
        <section className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                データ管理 ＆ バックアップ
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                JSON/CSVでの保存・復元、デモデータの挿入、全データ初期化
              </p>
            </div>
          </div>

          <DataBackupSection
            cycle={cycle}
            fixedCosts={fixedCosts}
            savingPlans={savingPlans}
            extraExpenses={extraExpenses}
            calendarEvents={calendarEvents}
            categoryColors={categoryColors}
            onRestoreData={onRestoreData}
            onResetData={onResetData}
            onInsertDemoData={onInsertDemoData}
          />
        </section>
      )}
    </div>
  );
}
