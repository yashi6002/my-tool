"use client";

import { useState, useMemo } from "react";
import {
  PaydayCycle,
  FixedCost,
  SavingPlan,
  ExtraExpense,
  CalendarEventItem,
  CategoryColors,
  DEFAULT_CATEGORY_COLORS,
} from "@/types/finance";
import { CalendarEventModal } from "./CalendarEventModal";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar as CalendarIcon,
  Sparkles,
} from "lucide-react";

interface Props {
  cycle: PaydayCycle;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
  calendarEvents: CalendarEventItem[];
  categoryColors?: CategoryColors;
  onAddEvent: (event: Omit<CalendarEventItem, "id" | "created_at">) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEventItem>) => void;
  onDeleteEvent: (id: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 日付文字列ヘルパー YYYY-MM-DD
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PaydayCalendarView({
  cycle,
  fixedCosts,
  savingPlans,
  extraExpenses,
  calendarEvents,
  categoryColors = DEFAULT_CATEGORY_COLORS,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: Props) {
  // サイクルオフセット (0 = 現在のサイクル, -1 = 1つ前, +1 = 1つ次)
  const [cycleOffset, setCycleOffset] = useState<number>(0);

  // モーダル管理
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // 今日の日付 (YYYY-MM-DD)
  const todayStr = useMemo(() => toDateStr(new Date()), []);

  // ──────────────────────────────────────────
  // 1. 給料日基準サイクルの開始日・終了日を計算
  // ──────────────────────────────────────────
  const { cycleStart, cycleEnd, cycleDates } = useMemo(() => {
    const today = new Date();
    const payday = Math.max(1, Math.min(31, cycle.payday || 25));

    // 現在のサイクル基準月
    let baseYear = today.getFullYear();
    let baseMonth = today.getMonth();

    // 今日が給料日より前なら、現在のサイクルは前月給料日からスタート
    if (today.getDate() < payday) {
      baseMonth -= 1;
    }

    // オフセットを加算
    baseMonth += cycleOffset;

    // サイクル開始日
    const start = new Date(baseYear, baseMonth, payday, 0, 0, 0);

    // サイクル終了日（翌月 payday の前日）
    const end = new Date(start.getFullYear(), start.getMonth() + 1, payday - 1, 23, 59, 59);

    // サイクルの全日付配列
    const dates: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return {
      cycleStart: start,
      cycleEnd: end,
      cycleDates: dates,
    };
  }, [cycle.payday, cycleOffset]);

  // ──────────────────────────────────────────
  // 2. 日付ごとのアイテム集計 ＆ 累積予測残高の計算
  // ──────────────────────────────────────────
  const { dayItemsMap, dailyBalances, cycleSummary } = useMemo(() => {
    const totalSavings = savingPlans.reduce((s, p) => s + p.amount, 0);
    const map = new Map<string, CalendarEventItem[]>();

    // サイクル内の各日付に対して初期化
    cycleDates.forEach((d) => {
      const dStr = toDateStr(d);
      const items: CalendarEventItem[] = [];

      // A. 給料日（サイクル開始日）の給料自動計上
      if (dStr === toDateStr(cycleStart) && cycle.salary > 0) {
        items.push({
          id: `auto-salary-${dStr}`,
          name: "給与支給",
          amount: cycle.salary,
          type: "income",
          date: dStr,
          color: categoryColors.free, // 自由額・収入カラー
          source: "custom",
          created_at: dStr,
        });

        // 先取り貯金があれば同時に差し引き計上
        if (totalSavings > 0) {
          items.push({
            id: `auto-savings-${dStr}`,
            name: "先取り貯金・投資",
            amount: totalSavings,
            type: "expense",
            date: dStr,
            color: categoryColors.saving, // 貯金カラー
            source: "custom",
            created_at: dStr,
          });
        }
      }

      // B. 固定費の自動反映 (due_day が合致するもの)
      fixedCosts.forEach((fc) => {
        if (fc.due_day === d.getDate()) {
          items.push({
            id: `auto-fixed-${fc.id}-${dStr}`,
            name: fc.name,
            amount: fc.amount,
            type: "expense",
            date: dStr,
            color: fc.color || categoryColors.fixed, // 固定費個別カラー または 固定費カテゴリカラー
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
      extraExpenses.forEach((ee) => {
        if (ee.date === dStr) {
          items.push({
            id: `auto-extra-${ee.id}`,
            name: ee.name,
            amount: ee.amount,
            type: "expense",
            date: dStr,
            color: ee.color || categoryColors.extra, // 臨時出費カラー または カテゴリカラー
            memo: ee.memo,
            source: "extra",
            source_id: ee.id,
            created_at: ee.created_at,
          });
        }
      });

      // D. カレンダー独自イベント（単発 or 毎月繰り返し）
      calendarEvents.forEach((ev) => {
        const isMatch =
          ev.date === dStr ||
          (ev.is_recurring && ev.recurring_day === d.getDate());

        if (isMatch) {
          // 重複チェック
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

    cycleDates.forEach((d) => {
      const dStr = toDateStr(d);
      const items = map.get(dStr) || [];

      items.forEach((item) => {
        if (item.type === "income") {
          runningBalance += item.amount;
          totalIncome += item.amount;
        } else {
          runningBalance -= item.amount;
          totalExpense += item.amount;
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
  }, [cycleDates, cycleStart, cycle.salary, savingPlans, fixedCosts, extraExpenses, calendarEvents]);

  // ──────────────────────────────────────────
  // 3. カレンダーグリッド配置用のスロット作成
  // ──────────────────────────────────────────
  const gridSlots = useMemo(() => {
    if (cycleDates.length === 0) return [];
    const firstDayOfWeek = cycleDates[0].getDay(); // 0 (日) 〜 6 (土)

    // 先頭のパディングセル
    const slots: Array<{ date: Date | null; dateStr: string }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      slots.push({ date: null, dateStr: `pad-start-${i}` });
    }

    // サイクルの実日付セル
    cycleDates.forEach((d) => {
      slots.push({ date: d, dateStr: toDateStr(d) });
    });

    // 末尾のパディングセル (7の倍数にする)
    const remaining = 7 - (slots.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        slots.push({ date: null, dateStr: `pad-end-${i}` });
      }
    }

    return slots;
  }, [cycleDates]);

  // サイクル表示タイトル
  const cycleTitle = useMemo(() => {
    const s = `${cycleStart.getFullYear()}/${cycleStart.getMonth() + 1}/${cycleStart.getDate()}`;
    const e = `${cycleEnd.getFullYear()}/${cycleEnd.getMonth() + 1}/${cycleEnd.getDate()}`;
    return `${s} 〜 ${e} サイクル`;
  }, [cycleStart, cycleEnd]);

  // 選択日イベント
  const modalEvents = selectedDateStr ? dayItemsMap.get(selectedDateStr) || [] : [];

  return (
    <div className="space-y-4">
      {/* ── サイクルヘッダー ＆ コントロール ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 左側：サイクル切り替え */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {cycleTitle}
                </h2>
                {cycleOffset === 0 ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-pulse" /> 今期サイクル
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                    {cycleOffset > 0 ? `${cycleOffset}期先` : `${Math.abs(cycleOffset)}期前`}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                給料日（毎月{cycle.payday}日）を起点とした自動残高シミュレーション
              </p>
            </div>
          </div>

          {/* 右側：前月/次月/今期ボタン ＆ 収支サマリー */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCycleOffset((v) => v - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-1 transition-colors"
              title="前のサイクルへ"
            >
              <ChevronLeft className="w-4 h-4" /> 前期
            </button>
            {cycleOffset !== 0 && (
              <button
                onClick={() => setCycleOffset(0)}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> 今期に戻る
              </button>
            )}
            <button
              onClick={() => setCycleOffset((v) => v + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-1 transition-colors"
              title="次のサイクルへ"
            >
              次期 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* サイクルサマリーバー */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-0.5">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              サイクル総入金
            </p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              +{fmt(cycleSummary.totalIncome)}
            </p>
          </div>
          <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-0.5">
              <ArrowDownRight className="w-3 h-3 text-rose-500" />
              サイクル総出費
            </p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
              -{fmt(cycleSummary.totalExpense)}
            </p>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${
            cycleSummary.finalBalance >= 0
              ? "bg-zinc-100/80 dark:bg-zinc-800"
              : "bg-red-50 dark:bg-red-950/40"
          }`}>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center gap-0.5">
              <Wallet className="w-3 h-3 text-zinc-400" />
              期末予測残高
            </p>
            <p className={`text-sm font-black ${
              cycleSummary.finalBalance >= 0
                ? "text-zinc-800 dark:text-zinc-100"
                : "text-red-500 font-bold"
            }`}>
              {fmt(cycleSummary.finalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* ── カレンダーグリッド ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map((w, idx) => (
            <div
              key={w}
              className={`text-center py-1 text-xs font-bold rounded-lg ${
                idx === 0
                  ? "text-red-500 bg-red-50/60 dark:bg-red-950/30"
                  : idx === 6
                  ? "text-blue-500 bg-blue-50/60 dark:bg-blue-950/30"
                  : "text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 日付セルグリッド */}
        <div className="grid grid-cols-7 gap-1.5">
          {gridSlots.map((slot, idx) => {
            // パディングセル（空マス）
            if (!slot.date) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[105px] rounded-xl border border-dashed border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/40 dark:bg-zinc-900/20"
                />
              );
            }

            const d = slot.date;
            const dStr = slot.dateStr;
            const items = dayItemsMap.get(dStr) || [];
            const balance = dailyBalances.get(dStr) ?? 0;

            const isToday = dStr === todayStr;
            const isPast = dStr < todayStr;
            const isFuture = dStr > todayStr;
            const isPayday = d.getDate() === cycle.payday;
            const dayOfWeek = d.getDay();

            // スタイリングの決定
            let cellClasses = "min-h-[115px] p-2 rounded-xl transition-all flex flex-col justify-between cursor-pointer group relative ";
            if (isToday) {
              cellClasses += "bg-emerald-50/90 dark:bg-emerald-950/50 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 ";
            } else if (isPast) {
              cellClasses += "bg-zinc-100/70 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 border border-zinc-200/60 dark:border-zinc-800/60 opacity-80 hover:opacity-100 hover:border-zinc-400 ";
            } else {
              // 未来
              cellClasses += "bg-white dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-400 hover:shadow-xs ";
            }

            return (
              <div
                key={dStr}
                onClick={() => setSelectedDateStr(dStr)}
                className={cellClasses}
              >
                {/* セル上部：日付番号 ＆ 給料日/今日バッジ */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-emerald-600 text-white shadow-xs font-black"
                          : isPayday
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold"
                          : dayOfWeek === 0
                          ? "text-red-500"
                          : dayOfWeek === 6
                          ? "text-blue-500"
                          : ""
                      }`}
                    >
                      {d.getDate()}
                    </span>

                    <div className="flex items-center gap-1">
                      {isToday && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                          今日
                        </span>
                      )}
                      {isPayday && !isToday && (
                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                          給料日
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(dStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-zinc-400 hover:text-emerald-500"
                        title="収支を追加"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 収支アイテムリスト（最大3件まで表示、溢れたら+○件） */}
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded flex items-center justify-between truncate"
                        style={{
                          backgroundColor: `${item.color || (item.type === "income" ? "#10b981" : "#f43f5e")}20`,
                          color: item.color || (item.type === "income" ? "#10b981" : "#f43f5e"),
                          borderLeft: `2.5px solid ${item.color || (item.type === "income" ? "#10b981" : "#f43f5e")}`,
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
                      <p className="text-[9px] text-zinc-400 text-right font-medium">
                        他 +{items.length - 3}件
                      </p>
                    )}
                  </div>
                </div>

                {/* セル下部：その日時点の予測残高 */}
                <div className="mt-1 pt-1 border-t border-zinc-100/60 dark:border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[9px] text-zinc-400">残高</span>
                  <span
                    className={`text-[10px] font-bold tracking-tight ${
                      balance < 0
                        ? "text-red-500 font-extrabold"
                        : isToday
                        ? "text-emerald-700 dark:text-emerald-300 font-extrabold"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {fmt(balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 日付詳細 ＆ イベント追加モーダル ── */}
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

