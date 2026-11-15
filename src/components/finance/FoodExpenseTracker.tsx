"use client";

import { useMemo, useState } from "react";
import { CalendarEventItem } from "@/types/finance";
import { isFoodExpense, sortByDateAsc } from "@/lib/financeUtils";
import { Utensils, TrendingUp, Calendar, Plus, ChevronRight, Check } from "lucide-react";

interface Props {
  cycleStart: Date;
  cycleEnd: Date;
  calendarEvents: CalendarEventItem[];
  onAddFoodExpense: (name: string, amount: number, dateStr: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function FoodExpenseTracker({
  cycleStart,
  cycleEnd,
  calendarEvents = [],
  onAddFoodExpense,
}: Props) {
  const [quickAmount, setQuickAmount] = useState("");
  const [quickName, setQuickName] = useState("食費");

  // 当サイクルの食費アイテムを抽出＆日付順ソート
  const foodItems = useMemo(() => {
    const list = (calendarEvents || []).filter((ev) => isFoodExpense(ev));
    return sortByDateAsc(list);
  }, [calendarEvents]);

  // 食費合計
  const totalFoodAmount = useMemo(() => {
    return foodItems.reduce((sum, item) => sum + (item?.amount || 0), 0);
  }, [foodItems]);

  // サイクル日数と1日あたり平均
  const { totalDays, elapsedDays, dailyAverage } = useMemo(() => {
    try {
      const s = cycleStart ? new Date(cycleStart).getTime() : Date.now();
      const e = cycleEnd ? new Date(cycleEnd).getTime() : Date.now();
      const diffMs = Math.max(86400000, e - s);
      const days = Math.max(1, Math.ceil(diffMs / 86400000));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const elapsedMs = Math.max(0, today.getTime() - s);
      const elapsed = Math.min(days, Math.max(1, Math.ceil(elapsedMs / 86400000)));

      const avg = elapsed > 0 ? Math.round(totalFoodAmount / elapsed) : 0;

      return { totalDays: days, elapsedDays: elapsed, dailyAverage: avg };
    } catch {
      return { totalDays: 30, elapsedDays: 1, dailyAverage: totalFoodAmount };
    }
  }, [cycleStart, cycleEnd, totalFoodAmount]);

  // 今日の日付文字列
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(quickAmount.replace(/,/g, ""), 10);
    if (isNaN(amt) || amt <= 0) return;
    onAddFoodExpense(quickName.trim() || "食費", amt, todayStr);
    setQuickAmount("");
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-nowrap">
                食費トラック
              </h3>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
                計 {fmt(totalFoodAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              カレンダー入力と連動した日々の食費集計 ＆ 平均ペース分析
            </p>
          </div>
        </div>

        {/* 指標バッジ群 */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-right">
            <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block whitespace-nowrap">
              1日平均（経過 {elapsedDays}日）
            </span>
            <span className="font-bold font-mono text-amber-700 dark:text-amber-300 whitespace-nowrap">
              {fmt(dailyAverage)} /日
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-right">
            <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block whitespace-nowrap">
              記録件数
            </span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
              {foodItems.length} 件
            </span>
          </div>
        </div>
      </div>

      {/* クイック食費入力バー（全幅で押しやすく） */}
      <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="品名 (例: スーパー買い出し、ランチ外食)"
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          className="flex-1 text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="金額 (円)"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
            className="w-32 text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>今日に記録</span>
          </button>
        </div>
      </form>

      {/* 食費履歴リスト（全幅ワイド・折り返し防止） */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
          当サイクルの食費履歴 (日付順)
        </span>
        {foodItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            当サイクルの食費記録はまだありません。上の入力欄やカレンダーから追加できます。
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {foodItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5 text-xs hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 shrink-0 whitespace-nowrap">
                    {item.date ? item.date.slice(5) : "未定"}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap min-w-fit">
                    {item.name}
                  </span>
                  {item.memo && (
                    <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                      ({item.memo})
                    </span>
                  )}
                </div>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400 shrink-0 ml-2 whitespace-nowrap">
                  -{fmt(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
