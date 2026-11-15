"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PaydayCycle,
  FixedCost,
  SavingPlan,
  ExtraExpense,
  CalendarEventItem,
  CategoryColors,
  DEFAULT_CATEGORY_COLORS,
} from "@/types/finance";
import { calculateCycleRange, isFoodExpense, isDateInCycle } from "@/lib/financeUtils";
import { CalendarEventModal } from "./CalendarEventModal";
import { BudgetPieChart } from "./BudgetPieChart";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  Sparkles,
} from "lucide-react";

interface Props {
  cycle: PaydayCycle;
  carryOver?: number;
  fixedCosts?: FixedCost[];
  savingPlans?: SavingPlan[];
  extraExpenses?: ExtraExpense[];
  calendarEvents?: CalendarEventItem[];
  categoryColors?: CategoryColors;
  targetHighlightDate?: string | null;
  cycleOffset?: number;
  onCycleOffsetChange?: (offset: number) => void;
  onUpdateCarryOver?: (amount: number) => void;
  onAddEvent: (event: Omit<CalendarEventItem, "id" | "created_at">) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEventItem>) => void;
  onDeleteEvent: (id: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 日付文字列ヘルパー YYYY-MM-DD
function toDateStr(date: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PaydayCalendarView({
  cycle,
  carryOver = 0,
  fixedCosts = [],
  savingPlans = [],
  extraExpenses = [],
  calendarEvents = [],
  categoryColors = DEFAULT_CATEGORY_COLORS,
  targetHighlightDate,
  cycleOffset: controlledOffset,
  onCycleOffsetChange,
  onUpdateCarryOver,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: Props) {
  // サイクルオフセット (親管理または内部管理)
  const [internalOffset, setInternalOffset] = useState<number>(0);
  const cycleOffset = controlledOffset !== undefined ? controlledOffset : internalOffset;
  const setCycleOffset = (newOffset: number | ((prev: number) => number)) => {
    const val = typeof newOffset === "function" ? newOffset(cycleOffset) : newOffset;
    if (onCycleOffsetChange) {
      onCycleOffsetChange(val);
    } else {
      setInternalOffset(val);
    }
  };

  // 一時的なハイライト日付セル
  const [activeHighlightDate, setActiveHighlightDate] = useState<string | null>(null);

  // モーダル管理
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // 今日の日付 (YYYY-MM-DD)
  const todayStr = useMemo(() => toDateStr(new Date()), []);

  // 外部からの targetHighlightDate に反応してハイライト＆スクロール
  useEffect(() => {
    if (!targetHighlightDate) return;
    setActiveHighlightDate(targetHighlightDate);

    setTimeout(() => {
      const el = document.getElementById(`cal-cell-${targetHighlightDate}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    const timer = setTimeout(() => {
      setActiveHighlightDate(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [targetHighlightDate]);

  // ──────────────────────────────────────────
  // 1. 給料日基準サイクルの安全な計算 (financeUtils を使用)
  // ──────────────────────────────────────────
  const { cycleStart, cycleEnd, cycleDates, label: cycleLabelText, rangeText } = useMemo(() => {
    return calculateCycleRange(cycle?.payday || 25, cycleOffset);
  }, [cycle?.payday, cycleOffset]);

  // 当サイクル専用のデータフィルタリング（上部円グラフ用）
  const cycleCalendarEvents = useMemo(() => {
    return (calendarEvents || []).filter((ev) => {
      if (ev?.is_recurring && ev?.recurring_day !== undefined) return true;
      return isDateInCycle(ev?.date, cycleStart, cycleEnd);
    });
  }, [calendarEvents, cycleStart, cycleEnd]);

  const cycleFoodEvents = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => isFoodExpense(ev));
  }, [cycleCalendarEvents]);

  const totalFoodAmount = useMemo(() => {
    return cycleFoodEvents.reduce((s, e) => s + (e?.amount || 0), 0);
  }, [cycleFoodEvents]);

  const cycleExtraEventsFromCalendar = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => ev?.type === "expense" && !isFoodExpense(ev));
  }, [cycleCalendarEvents]);

  const cycleExtraIncomes = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => ev?.type === "income");
  }, [cycleCalendarEvents]);

  const totalExtraIncome = useMemo(() => {
    return cycleExtraIncomes.reduce((s, e) => s + (e?.amount || 0), 0);
  }, [cycleExtraIncomes]);

  const cycleExtraExpenses = useMemo(() => {
    const list = (extraExpenses || []).filter((ee) => {
      if (!ee?.date) return true;
      return isDateInCycle(ee?.date, cycleStart, cycleEnd);
    });
    const calendarExtrasAsItems: ExtraExpense[] = cycleExtraEventsFromCalendar.map((cev) => ({
      id: cev.id,
      name: cev.name,
      amount: cev.amount,
      date: cev.date,
      color: cev.color,
      memo: cev.memo,
      created_at: cev.created_at,
    }));
    return [...list, ...calendarExtrasAsItems];
  }, [extraExpenses, cycleExtraEventsFromCalendar, cycleStart, cycleEnd]);

  // ──────────────────────────────────────────
  // 2. 日付ごとのアイテム集計 ＆ 累積予測残高の計算
  // ──────────────────────────────────────────
  const { dayItemsMap, dailyBalances, cycleSummary } = useMemo(() => {
    const totalSavings = (savingPlans || []).reduce((s, p) => s + (p?.amount || 0), 0);
    const map = new Map<string, CalendarEventItem[]>();

    // サイクル内の各日付に対して初期化
    (cycleDates || []).forEach((d) => {
      const dStr = toDateStr(d);
      if (!dStr) return;
      const items: CalendarEventItem[] = [];

      // A. 給料日（サイクル開始日）の給料自動計上 ＆ 繰越金加算
      if (dStr === toDateStr(cycleStart)) {
        if ((cycle?.salary || 0) > 0) {
          items.push({
            id: `auto-salary-${dStr}`,
            name: "給与支給",
            amount: cycle.salary,
            type: "income",
            date: dStr,
            color: categoryColors?.free || "#34d399",
            source: "custom",
            created_at: dStr,
          });
        }

        // 繰越金があれば表示
        if ((carryOver || 0) > 0) {
          items.push({
            id: `auto-carryover-${dStr}`,
            name: "先月繰越金",
            amount: carryOver,
            type: "income",
            date: dStr,
            color: "#10b981",
            source: "custom",
            created_at: dStr,
          });
        }

        // 先取り貯金があれば同時に差し引き計上
        if (totalSavings > 0) {
          items.push({
            id: `auto-savings-${dStr}`,
            name: "先取り貯金・投資",
            amount: totalSavings,
            type: "expense",
            date: dStr,
            color: categoryColors?.saving || "#60a5fa",
            source: "custom",
            created_at: dStr,
          });
        }
      }

      // B. 固定費の自動反映 (due_day が合致するもの)
      (fixedCosts || []).forEach((fc) => {
        if (fc?.due_day === d.getDate()) {
          items.push({
            id: `auto-fixed-${fc.id}-${dStr}`,
            name: fc.name,
            amount: fc.amount,
            type: "expense",
            date: dStr,
            color: fc.color || categoryColors?.fixed || "#f87171",
            is_recurring: true,
            recurring_day: fc.due_day,
            memo: fc.memo,
            source: "fixed",
            source_id: fc.id,
            created_at: fc.created_at,
          });
        }
      });

      // C. 臨時出費の自動反映 (date が合致するもの)
      (extraExpenses || []).forEach((ee) => {
        if (ee?.date === dStr) {
          items.push({
            id: `auto-extra-${ee.id}`,
            name: ee.name,
            amount: ee.amount,
            type: "expense",
            date: dStr,
            color: ee.color || categoryColors?.extra || "#fb923c",
            memo: ee.memo,
            source: "extra",
            source_id: ee.id,
            created_at: ee.created_at,
          });
        }
      });

      // D. カレンダー独自イベント（単発 or 毎月繰り返し）
      (calendarEvents || []).forEach((ev) => {
        const isMatch =
          ev?.date === dStr ||
          (ev?.is_recurring && ev?.recurring_day === d.getDate());

        if (isMatch) {
          if (!items.some((it) => it.id === ev.id)) {
            items.push(ev);
          }
        }
      });

      map.set(dStr, items);
    });

    // 累積残高のシミュレーション
    const balances = new Map<string, number>();
    let runningBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    (cycleDates || []).forEach((d) => {
      const dStr = toDateStr(d);
      if (!dStr) return;
      const items = map.get(dStr) || [];

      items.forEach((item) => {
        if (item.type === "income") {
          runningBalance += (item?.amount || 0);
          totalIncome += (item?.amount || 0);
        } else {
          runningBalance -= (item?.amount || 0);
          totalExpense += (item?.amount || 0);
        }
      });

      balances.set(dStr, runningBalance);
    });

    return {
      dayItemsMap: map,
      dailyBalances: balances,
      cycleSummary: {
        totalIncome,
        totalExpense,
        finalBalance: runningBalance,
      },
    };
  }, [cycleDates, cycleStart, cycle?.salary, carryOver, savingPlans, fixedCosts, extraExpenses, calendarEvents, categoryColors]);

  // ──────────────────────────────────────────
  // 3. カレンダーグリッド配置用のスロット作成
  // ──────────────────────────────────────────
  const gridSlots = useMemo(() => {
    if (!cycleDates || cycleDates.length === 0) return [];
    const firstDayOfWeek = cycleDates[0].getDay();

    const slots: Array<{ date: Date | null; dateStr: string }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      slots.push({ date: null, dateStr: `pad-start-${i}` });
    }

    cycleDates.forEach((d) => {
      slots.push({ date: d, dateStr: toDateStr(d) });
    });

    const remaining = 7 - (slots.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        slots.push({ date: null, dateStr: `pad-end-${i}` });
      }
    }

    return slots;
  }, [cycleDates]);

  // 選択日イベント
  const modalEvents = selectedDateStr ? dayItemsMap.get(selectedDateStr) || [] : [];

  return (
    <div className="space-y-6">
      {/* ── 【要件6】カレンダー画面最上部への資金配分円グラフ表示 ── */}
      <section>
        <BudgetPieChart
          salary={cycle?.salary || 0}
          carryOver={carryOver}
          fixedCosts={fixedCosts}
          savingPlans={savingPlans}
          extraExpenses={cycleExtraExpenses}
          foodAmount={totalFoodAmount}
          extraIncome={totalExtraIncome}
          categoryColors={categoryColors}
          onUpdateCarryOver={onUpdateCarryOver}
        />
      </section>

      {/* ── サイクルヘッダー ＆ コントロール ── */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* 左側：サイクル切り替え */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {cycleLabelText} ({rangeText})
                </h2>
                {cycleOffset === 0 ? (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 今月分
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full font-medium">
                    {cycleOffset > 0 ? `${cycleOffset}ヶ月先` : `${Math.abs(cycleOffset)}ヶ月前`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                給料日（毎月{cycle?.payday || 25}日）を起点とした自動残高シミュレーション
              </p>
            </div>
          </div>

          {/* 右側：先月分 / 来月分 切り替え */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setCycleOffset((v) => v - 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
              title="先月のサイクルへ"
            >
              <ChevronLeft className="w-4 h-4" /> 先月分
            </button>

            <button
              onClick={() => setCycleOffset((v) => v + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
              title="来月のサイクルへ"
            >
              来月分 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* サイクルサマリーバー */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-2.5 text-center border border-emerald-200 dark:border-emerald-500/20">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-0.5">
              <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              サイクル総入金
            </p>
            <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              +{fmt(cycleSummary.totalIncome)}
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2.5 text-center border border-rose-200 dark:border-rose-500/20">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-0.5">
              <ArrowDownRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              サイクル総出金
            </p>
            <p className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 font-mono">
              -{fmt(cycleSummary.totalExpense)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-200 dark:border-white/10">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              サイクル予測最終残高
            </p>
            <p
              className={`text-xs sm:text-sm font-bold font-mono ${
                cycleSummary.finalBalance >= 0
                  ? "text-slate-800 dark:text-slate-100"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {fmt(cycleSummary.finalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* ── カレンダー本体（スマホでの横スクロール保証 ＆ セルサイズ最適化） ── */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-3 sm:p-4 shadow-sm dark:shadow-xl overflow-x-auto">
        <div className="min-w-[580px] sm:min-w-0">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2 text-center text-xs font-bold">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={`py-1.5 rounded-lg ${
                  i === 0
                    ? "text-rose-500 dark:text-red-400 bg-rose-50/50 dark:bg-rose-950/20"
                    : i === 6
                    ? "text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                    : "text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50"
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 日付セルグリッド */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {gridSlots.map((slot) => {
              const d = slot.date;
              if (!d) {
                return (
                  <div
                    key={slot.dateStr}
                    className="min-h-[90px] sm:min-h-[105px] p-1.5 rounded-xl border border-slate-100/60 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/10 opacity-30 pointer-events-none"
                  />
                );
              }

              const dStr = slot.dateStr;
              const items = dayItemsMap.get(dStr) || [];
              const balance = dailyBalances.get(dStr) ?? 0;

              const isToday = dStr === todayStr;
              const isPast = dStr < todayStr;
              const isPayday = d.getDate() === (cycle?.payday || 25);
              const dayOfWeek = d.getDay();
              const isHighlighted = activeHighlightDate === dStr;

              let cellClasses = "min-h-[90px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl transition-all duration-200 flex flex-col justify-between cursor-pointer group relative ";
              if (isHighlighted) {
                cellClasses += "bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-500 shadow-xl ring-4 ring-amber-400 scale-[1.02] z-10 animate-bounce ";
              } else if (isToday) {
                cellClasses += "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 ";
              } else if (isPast) {
                cellClasses += "bg-slate-100/60 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-white/5 opacity-60 hover:opacity-100 hover:border-slate-400 transition-opacity ";
              } else {
                cellClasses += "bg-white/90 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md ";
              }

              return (
                <div
                  key={dStr}
                  id={`cal-cell-${dStr}`}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={cellClasses}
                >
                  {/* セル上部：日付番号 ＆ 給料日/今日バッジ */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-emerald-600 text-white shadow-md font-black ring-1 ring-emerald-300"
                            : isPayday
                            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-extrabold"
                            : isPast
                            ? "text-slate-400 dark:text-slate-500 font-normal"
                            : dayOfWeek === 0
                            ? "text-rose-500 dark:text-red-400 font-bold"
                            : dayOfWeek === 6
                            ? "text-blue-500 dark:text-blue-400 font-bold"
                            : "text-slate-700 dark:text-slate-300 font-medium"
                        }`}
                      >
                        {d.getDate()}
                      </span>

                      <div className="flex items-center gap-1">
                        {isToday && (
                          <span className="text-[8px] bg-emerald-600 text-white px-1 py-0.2 rounded-full font-bold shadow-xs">
                            今日
                          </span>
                        )}
                        {isPayday && !isToday && (
                          <span className="text-[8px] bg-amber-500 text-white dark:text-slate-950 px-1 py-0.2 rounded-full font-bold">
                            給料日
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-emerald-500"
                          title="収支を追加"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 収支アイテムリスト（コンパクト化） */}
                    <div className="space-y-0.5 sm:space-y-1">
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="text-[9px] leading-tight px-1.5 py-0.5 rounded flex items-center justify-between truncate"
                          style={{
                            backgroundColor: `${item.color || (item.type === "income" ? "#10b981" : "#f43f5e")}20`,
                            color: item.color || (item.type === "income" ? "#10b981" : "#f43f5e"),
                            borderLeft: `2px solid ${item.color || (item.type === "income" ? "#10b981" : "#f43f5e")}`,
                          }}
                          title={`${item.name} (${item.type === "income" ? "+" : "-"}${fmt(item.amount)})`}
                        >
                          <span className="truncate mr-1 font-medium">{item.name}</span>
                          <span className="font-bold shrink-0">
                            {item.type === "income" ? "+" : "-"}
                            {item.amount >= 10000
                              ? `${(item.amount / 10000).toFixed(item.amount % 10000 === 0 ? 0 : 1)}万`
                              : fmt(item.amount)}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[8px] text-slate-400 text-right font-medium">
                          +{items.length - 3}件
                        </p>
                      )}
                    </div>
                  </div>

                  {/* セル下部：この日時点の予測累積残高 */}
                  <div className="pt-1 mt-1 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[8px] text-slate-400">残高</span>
                    <span
                      className={`text-[9.5px] font-mono font-bold truncate ${
                        balance >= 0
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {balance >= 100000
                        ? `${(balance / 10000).toFixed(1)}万`
                        : fmt(balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 日付詳細 ＆ 収支追加モーダル ── */}
      {selectedDateStr && (
        <CalendarEventModal
          isOpen={true}
          onClose={() => setSelectedDateStr(null)}
          dateStr={selectedDateStr}
          events={modalEvents}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}
    </div>
  );
}
