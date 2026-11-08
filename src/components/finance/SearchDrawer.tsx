"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  PaydayCycle,
  FixedCost,
  SavingPlan,
  ExtraExpense,
  CalendarEventItem,
} from "@/types/finance";
import {
  Search,
  X,
  Filter,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  DollarSign,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface SearchResultItem {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  categoryLabel: string;
  categoryType: "salary" | "fixed" | "saving" | "extra" | "event";
  dateStr?: string; // YYYY-MM-DD
  color?: string;
  memo?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cycle: PaydayCycle;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
  calendarEvents: CalendarEventItem[];
  onSelectDate: (dateStr: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function SearchDrawer({
  isOpen,
  onClose,
  cycle,
  fixedCosts,
  savingPlans,
  extraExpenses,
  calendarEvents,
  onSelectDate,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ドロワーオープン時に入力欄へフォーカス
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 全アイテムを統合した検索用データセットの生成
  const allItems: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // 1. 給与
    if (cycle.salary > 0) {
      const paydayDay = Math.min(31, Math.max(1, cycle.payday || 25));
      const paydayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(paydayDay).padStart(2, "0")}`;
      list.push({
        id: "search-salary",
        name: "給与支給",
        amount: cycle.salary,
        type: "income",
        categoryLabel: "給与・収入",
        categoryType: "salary",
        dateStr: paydayStr,
        color: "#10b981",
        memo: `毎月${cycle.payday}日支給`,
      });
    }

    // 2. 固定費
    fixedCosts.forEach((f) => {
      let dateStr: string | undefined = undefined;
      if (f.due_day) {
        dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(f.due_day).padStart(2, "0")}`;
      }
      list.push({
        id: `fixed-${f.id}`,
        name: f.name,
        amount: f.amount,
        type: "expense",
        categoryLabel: "固定費・引き落とし",
        categoryType: "fixed",
        dateStr,
        color: f.color || "#f87171",
        memo: f.memo || (f.due_day ? `毎月${f.due_day}日引落` : undefined),
      });
    });

    // 3. 貯金・投資
    savingPlans.forEach((s) => {
      list.push({
        id: `saving-${s.id}`,
        name: s.name,
        amount: s.amount,
        type: "expense",
        categoryLabel: "貯金・投資",
        categoryType: "saving",
        color: s.color || "#60a5fa",
        memo: s.memo,
      });
    });

    // 4. 臨時出費
    extraExpenses.forEach((e) => {
      list.push({
        id: `extra-${e.id}`,
        name: e.name,
        amount: e.amount,
        type: "expense",
        categoryLabel: "臨時出費",
        categoryType: "extra",
        dateStr: e.date,
        color: e.color || "#fb923c",
        memo: e.memo,
      });
    });

    // 5. カレンダー個別イベント
    calendarEvents.forEach((ev) => {
      list.push({
        id: `event-${ev.id}`,
        name: ev.name,
        amount: ev.amount,
        type: ev.type,
        categoryLabel: ev.type === "income" ? "入金・臨時収入" : "日常出費",
        categoryType: "event",
        dateStr: ev.date,
        color: ev.color,
        memo: ev.memo,
      });
    });

    return list;
  }, [cycle, fixedCosts, savingPlans, extraExpenses, calendarEvents]);

  // フィルタリング処理
  const filteredResults = useMemo(() => {
    return allItems.filter((item) => {
      // 1. キーワード検索（名前・メモ・カテゴリ）
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchMemo = item.memo ? item.memo.toLowerCase().includes(q) : false;
        const matchCat = item.categoryLabel.toLowerCase().includes(q);
        if (!matchName && !matchMemo && !matchCat) return false;
      }

      // 2. カテゴリフィルター
      if (selectedCategory !== "all") {
        if (selectedCategory !== item.categoryType) return false;
      }

      // 3. 収支タイプ
      if (selectedType !== "all") {
        if (selectedType !== item.type) return false;
      }

      // 4. 日付範囲フィルター
      if (dateFrom && item.dateStr && item.dateStr < dateFrom) {
        return false;
      }
      if (dateTo && item.dateStr && item.dateStr > dateTo) {
        return false;
      }

      return true;
    });
  }, [allItems, keyword, selectedCategory, selectedType, dateFrom, dateTo]);

  // 合計額の集計
  const totalIncome = filteredResults
    .filter((i) => i.type === "income")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = filteredResults
    .filter((i) => i.type === "expense")
    .reduce((sum, i) => sum + i.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* バックドロップ */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* スライドオーバードロワー本体 */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 animate-in slide-in-from-right">
        {/* ドロワーヘッダー */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                収支検索 ＆ 絞り込み
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                項目をクリックするとカレンダーの該当セルへジャンプ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 検索・絞り込み入力コントロール */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 space-y-3 bg-white dark:bg-slate-900">
          {/* キーワード入力 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="項目名、メモで検索 (例: 家賃、スーパー、ボーナス)..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* カテゴリクイックフィルター (チッ) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: "all", label: "すべて" },
              { id: "fixed", label: "固定費" },
              { id: "extra", label: "臨時出費" },
              { id: "saving", label: "貯金" },
              { id: "event", label: "カレンダー" },
              { id: "salary", label: "給与" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-emerald-500 text-white shadow-xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 収支タイプ & 日付範囲 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 収支切り替え */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-white/5">
              {[
                { id: "all", label: "全収支" },
                { id: "income", label: "入金(+)" },
                { id: "expense", label: "出金(-)" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    selectedType === t.id
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 日付絞り込みクリア/表示 */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>{filteredResults.length} 件がヒット</span>
              {(keyword || selectedCategory !== "all" || selectedType !== "all" || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setKeyword("");
                    setSelectedCategory("all");
                    setSelectedType("all");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-rose-500 hover:underline text-[10px] font-medium"
                >
                  リセット
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 検索結果サマリー */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-[11px]">検索結果 合計</span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            {totalIncome > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                +{fmt(totalIncome)}
              </span>
            )}
            <span className="text-rose-500 dark:text-rose-400 font-bold">
              -{fmt(totalExpense)}
            </span>
          </div>
        </div>

        {/* 検索結果リスト */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-60" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                該当する収支項目が見つかりませんでした
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                別のキーワードやフィルター条件をお試しください
              </p>
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.dateStr) {
                    onSelectDate(item.dateStr);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/60 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md transition-all ${
                  item.dateStr ? "cursor-pointer group" : "cursor-default"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || "#10b981" }}
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-medium bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                        {item.categoryLabel}
                      </span>
                    </div>

                    {item.memo && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mb-1">
                        {item.memo}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {item.dateStr ? (
                        <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
                          <CalendarIcon className="w-3 h-3" />
                          {item.dateStr}（カレンダーで見る）
                        </span>
                      ) : (
                        <span className="text-slate-400">毎月定額（サイクル管理）</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-bold font-mono ${
                        item.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {item.type === "income" ? "+" : "-"}
                      {fmt(item.amount)}
                    </p>
                    {item.dateStr && (
                      <span className="inline-flex items-center text-[10px] text-slate-400 group-hover:text-emerald-500 transition-colors mt-0.5">
                        ジャンプ <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ドロワーフッター */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-center">
          <p className="text-[10px] text-slate-400">
            Escキーまたは背景をクリックで閉じます
          </p>
        </div>
      </div>
    </div>
  );
}
