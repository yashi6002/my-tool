"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { FixedCost, ExtraExpense, CalendarEventItem } from "@/types/finance";
import { Bell, X, Calendar, ChevronRight, AlertCircle, Sparkles, Clock } from "lucide-react";

export interface UpcomingExpenseItem {
  id: string;
  name: string;
  amount: number;
  dateStr: string; // YYYY-MM-DD
  diffDays: number; // 今日からの日数 (0=今日, 1=明日, ...)
  color: string;
  source: "fixed" | "extra" | "custom";
  memo?: string;
}

interface Props {
  fixedCosts: FixedCost[];
  extraExpenses: ExtraExpense[];
  calendarEvents: CalendarEventItem[];
  autoCloseDuration?: number; // 自動消去までの秒数 (デフォルト: 8秒)
  isOpenExternal?: boolean;
  onToggleExternal?: (open: boolean) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

// 日付ヘルパー YYYY-MM-DD
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function RecentExpensesReminder({
  fixedCosts,
  extraExpenses,
  calendarEvents,
  autoCloseDuration = 8,
  isOpenExternal,
  onToggleExternal,
}: Props) {
  // 表示中フラグ
  const [isVisible, setIsVisible] = useState(true);
  // 詳細モーダル表示中のアイテム
  const [selectedItem, setSelectedItem] = useState<UpcomingExpenseItem | null>(null);
  // マウスホバー中か
  const [isHovered, setIsHovered] = useState(false);
  // プログレスバーのパーセント (100 -> 0)
  const [progress, setProgress] = useState(100);

  // 外部からの開閉制御と同期
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsVisible(isOpenExternal);
      if (isOpenExternal) {
        setProgress(100);
      }
    }
  }, [isOpenExternal]);

  // ──────────────────────────────────────────
  // 直近3つの支出を抽出
  // ──────────────────────────────────────────
  const upcomingExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const candidates: UpcomingExpenseItem[] = [];

    // 1. 固定費（due_dayから次回引き落とし日を算出）
    fixedCosts.forEach((fc) => {
      if (!fc.due_day) return;
      let targetDate = new Date(currentYear, currentMonth, fc.due_day);
      if (targetDate.getDate() < currentDate) {
        // 今月の引き落とし日を過ぎていれば翌月
        targetDate = new Date(currentYear, currentMonth + 1, fc.due_day);
      }
      targetDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((targetDate.getTime() - todayTime) / 86400000);

      candidates.push({
        id: `fixed-${fc.id}`,
        name: fc.name,
        amount: fc.amount,
        dateStr: toDateStr(targetDate),
        diffDays,
        color: fc.color || "#f87171",
        source: "fixed",
        memo: fc.memo || "毎月の固定費・引き落とし",
      });
    });

    // 2. 臨時出費（dateから算出）
    extraExpenses.forEach((ee) => {
      if (!ee.date) return;
      const targetDate = new Date(ee.date);
      targetDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((targetDate.getTime() - todayTime) / 86400000);

      // 今日以降の予定を対象
      if (diffDays >= 0) {
        candidates.push({
          id: `extra-${ee.id}`,
          name: ee.name,
          amount: ee.amount,
          dateStr: ee.date,
          diffDays,
          color: ee.color || "#fb923c",
          source: "extra",
          memo: ee.memo || "予定された臨時出費",
        });
      }
    });

    // 3. カレンダーイベント（支出のみ）
    calendarEvents.forEach((ev) => {
      if (ev.type !== "expense") return;

      if (ev.is_recurring && ev.recurring_day) {
        let targetDate = new Date(currentYear, currentMonth, ev.recurring_day);
        if (targetDate.getDate() < currentDate) {
          targetDate = new Date(currentYear, currentMonth + 1, ev.recurring_day);
        }
        targetDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((targetDate.getTime() - todayTime) / 86400000);

        candidates.push({
          id: `cal-rec-${ev.id}`,
          name: ev.name,
          amount: ev.amount,
          dateStr: toDateStr(targetDate),
          diffDays,
          color: ev.color || "#f43f5e",
          source: "custom",
          memo: ev.memo || "毎月繰り返しの支出",
        });
      } else if (ev.date) {
        const targetDate = new Date(ev.date);
        targetDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((targetDate.getTime() - todayTime) / 86400000);

        if (diffDays >= 0) {
          candidates.push({
            id: `cal-single-${ev.id}`,
            name: ev.name,
            amount: ev.amount,
            dateStr: ev.date,
            diffDays,
            color: ev.color || "#f43f5e",
            source: "custom",
            memo: ev.memo,
          });
        }
      }
    });

    // 重複を名前・日付でまとめるか、近い順にソートして上位3件
    candidates.sort((a, b) => a.diffDays - b.diffDays || a.dateStr.localeCompare(b.dateStr));
    return candidates.slice(0, 3);
  }, [fixedCosts, extraExpenses, calendarEvents]);

  // ──────────────────────────────────────────
  // 自動消去タイマー ＆ プログレスバー
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!isVisible || isHovered || selectedItem !== null) return;

    const intervalTime = 50; // 50msごとに更新
    const step = (intervalTime / (autoCloseDuration * 1000)) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsVisible(false);
          if (onToggleExternal) onToggleExternal(false);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isVisible, isHovered, selectedItem, autoCloseDuration, onToggleExternal]);

  const handleClose = () => {
    setIsVisible(false);
    if (onToggleExternal) onToggleExternal(false);
  };

  // 出費予定が1件もない場合は非表示
  if (upcomingExpenses.length === 0) return null;

  return (
    <>
      {/* ── リマインダー通知ポップアップ（画面右下固定） ── */}
      {isVisible && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed bottom-6 right-6 z-40 w-[90vw] max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {/* 自動消去プログレスバー */}
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    直近の支出リマインダー
                    <span className="text-[10px] bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 px-1.5 py-0.2 rounded-full font-bold">
                      {upcomingExpenses.length}件
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    タップで詳細を確認できます
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors"
                title="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3つの支出アイテム */}
            <div className="space-y-2">
              {upcomingExpenses.map((item) => {
                const isUrgent = item.diffDays <= 2;
                const badgeLabel =
                  item.diffDays === 0
                    ? "本日!"
                    : item.diffDays === 1
                    ? "明日!"
                    : `あと${item.diffDays}日`;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.dateStr}</span>
                          <span
                            className={`font-semibold ml-0.5 px-1 rounded text-[9px] ${
                              isUrgent
                                ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 animate-pulse"
                                : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {badgeLabel}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs font-black text-rose-500 dark:text-rose-400">
                        -{fmt(item.amount)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 詳細表示モーダル ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedItem.color }}
                />
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {selectedItem.name}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {selectedItem.source === "fixed" ? "固定費・引き落とし" :
                     selectedItem.source === "extra" ? "予定された臨時出費" : "登録された収支予定"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 金額ハイライト */}
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-4 text-center">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-0.5">
                予定出金額
              </p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
                -{fmt(selectedItem.amount)}
              </p>
            </div>

            {/* 詳細情報リスト */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 予定日
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedItem.dateStr}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 残り日数
                </span>
                <span className={`font-bold ${
                  selectedItem.diffDays <= 2 ? "text-red-500 font-black" : "text-zinc-700 dark:text-zinc-300"
                }`}>
                  {selectedItem.diffDays === 0 ? "本日引き落とし・予定日！" :
                   selectedItem.diffDays === 1 ? "明日引き落とし・予定日！" :
                   `あと ${selectedItem.diffDays} 日`}
                </span>
              </div>

              {selectedItem.memo && (
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                  <span className="text-zinc-400 block text-[11px]">メモ・補足</span>
                  <p className="text-zinc-700 dark:text-zinc-200 font-medium">
                    {selectedItem.memo}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
