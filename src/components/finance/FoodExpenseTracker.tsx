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
  calendarEvents,
  onAddFoodExpense,
}: Props) {
  const [quickAmount, setQuickAmount] = useState("");
  const [quickName, setQuickName] = useState("食費");

  // 当サイクルの食費アイテムを抽出＆日付順ソート
  const foodItems = useMemo(() => {
    const list = calendarEvents.filter((ev) => isFoodExpense(ev));
    return sortByDateAsc(list);
  }, [calendarEvents]);

  // 食費合計
  const totalFoodAmount = useMemo(() => {
    return foodItems.reduce((sum, item) => sum + item.amount, 0);
  }, [foodItems]);

  // サイクル日数と1日あたり平均
  const { totalDays, elapsedDays, dailyAverage } = useMemo(() => {
    const diffMs = cycleEnd.getTime() - cycleStart.getTime();
    const days = Math.max(1, Math.ceil(diffMs / 86400000));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(cycleStart);
    start.setHours(0, 0, 0, 0);

    const elapsedMs = Math.max(0, today.getTime() - start.getTime());
    const elapsed = Math.min(days, Math.max(1, Math.ceil(elapsedMs / 86400000)));

    const avg = elapsed > 0 ? Math.round(totalFoodAmount / elapsed) : 0;

    return { totalDays: days, elapsedDays: elapsed, dailyAverage: avg };
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
    <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm dark:shadow-xl space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              食費トラック
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              カレンダー入力と連動した日々の食費集計
            </p>
          </div>
        </div>

        {/* 食費合計バッジ */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">当サイクル合計</span>
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
            {fmt(totalFoodAmount)}
          </span>
        </div>
      </div>

      {/* サマリー指標 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 text-center">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            1日平均（経過 {elapsedDays}日）
          </span>
          <span className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-300 font-mono">
            {fmt(dailyAverage)} /日
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 text-center">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
            記録件数
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 font-mono">
            {foodItems.length} 件
          </span>
        </div>
      </div>

      {/* クイック食費入力バー */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="品名 (例: スーパー)"
          value={quickName}
          onChange={(e) => setQuickName(e.target.value)}
          className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
        />
        <input
          type="number"
          placeholder="金額"
          value={quickAmount}
          onChange={(e) => setQuickAmount(e.target.value)}
          className="w-24 text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>今日に記録</span>
        </button>
      </form>

      {/* 直近の食費リスト (最大5件) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          当サイクルの食費履歴 (日付順)
        </span>
        {foodItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            食費の記録はまだありません
          </p>
        ) : (
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {foodItems.slice(-6).reverse().map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {item.date ? item.date.slice(5) : "未定"}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400 shrink-0">
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
