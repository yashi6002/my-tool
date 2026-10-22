"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FixedCost,
  SavingPlan,
  ExtraExpense,
  PaydayCycle,
  CalendarEventItem,
  CategoryColors,
  DEFAULT_CATEGORY_COLORS,
  LS_KEY_CYCLE,
  LS_KEY_FIXED,
  LS_KEY_SAVINGS,
  LS_KEY_EXTRAS,
  LS_KEY_EVENTS,
  LS_KEY_CATEGORY_COLORS,
} from "@/types/finance";
import { BudgetPieChart } from "@/components/finance/BudgetPieChart";
import { ExtraExpenseSection } from "@/components/finance/ExtraExpenseSection";
import { SettingsPanel } from "@/components/finance/SettingsPanel";
import { PaydayCalendarView } from "@/components/finance/PaydayCalendarView";
import { RecentExpensesReminder } from "@/components/finance/RecentExpensesReminder";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { Wallet, Settings, BarChart2, Calendar as CalendarIcon, Zap, Bell } from "lucide-react";

// ──────────────────────────────────────────
// ローカルストレージ ヘルパー
// ──────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// デフォルト固定費（デモ用）
const DEFAULT_FIXED: FixedCost[] = [
  { id: uid(), name: "家賃", amount: 70000, category: "rent", due_day: 27, color: "#f87171", created_at: new Date().toISOString() },
  { id: uid(), name: "電気・ガス・水道", amount: 12000, category: "utilities", due_day: 10, color: "#f87171", created_at: new Date().toISOString() },
  { id: uid(), name: "スマホ代", amount: 5000, category: "subscription", due_day: 15, color: "#f87171", created_at: new Date().toISOString() },
];
const DEFAULT_SAVINGS: SavingPlan[] = [
  { id: uid(), name: "先取り貯金", amount: 20000, color: "#60a5fa", created_at: new Date().toISOString() },
  { id: uid(), name: "NISA", amount: 33333, color: "#60a5fa", created_at: new Date().toISOString() },
];

// ──────────────────────────────────────────
// メインコンポーネント (1画面オールインワン表示)
// ──────────────────────────────────────────
export function FinanceDashboard() {
  const [cycle, setCycle] = useState<PaydayCycle>({ salary: 250000, payday: 25 });
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(DEFAULT_CATEGORY_COLORS);
  const [showReminder, setShowReminder] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // クライアント側でのみローカルストレージからロード
  useEffect(() => {
    setCycle(load(LS_KEY_CYCLE, { salary: 250000, payday: 25 }));
    setFixedCosts(load(LS_KEY_FIXED, DEFAULT_FIXED));
    setSavingPlans(load(LS_KEY_SAVINGS, DEFAULT_SAVINGS));
    setExtraExpenses(load(LS_KEY_EXTRAS, []));
    setCalendarEvents(load(LS_KEY_EVENTS, []));
    setCategoryColors(load(LS_KEY_CATEGORY_COLORS, DEFAULT_CATEGORY_COLORS));
    setMounted(true);
  }, []);

  // 各 state 変化時に保存
  useEffect(() => { if (mounted) save(LS_KEY_CYCLE, cycle); }, [cycle, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_FIXED, fixedCosts); }, [fixedCosts, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_SAVINGS, savingPlans); }, [savingPlans, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_EXTRAS, extraExpenses); }, [extraExpenses, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_EVENTS, calendarEvents); }, [calendarEvents, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_CATEGORY_COLORS, categoryColors); }, [categoryColors, mounted]);

  // ── 固定費 CRUD ──
  const handleAddFixed = useCallback((data: Omit<FixedCost, "id" | "created_at">) => {
    setFixedCosts(prev => [...prev, { ...data, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleDeleteFixed = useCallback((id: string) => {
    setFixedCosts(prev => prev.filter(f => f.id !== id));
  }, []);
  const handleUpdateFixed = useCallback((id: string, data: Partial<FixedCost>) => {
    setFixedCosts(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  }, []);

  // ── 貯金 CRUD ──
  const handleAddSaving = useCallback((data: Omit<SavingPlan, "id" | "created_at">) => {
    setSavingPlans(prev => [...prev, { ...data, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleDeleteSaving = useCallback((id: string) => {
    setSavingPlans(prev => prev.filter(s => s.id !== id));
  }, []);
  const handleUpdateSaving = useCallback((id: string, data: Partial<SavingPlan>) => {
    setSavingPlans(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  // ── 臨時出費 CRUD ──
  const handleAddExtra = useCallback((data: Omit<ExtraExpense, "id" | "created_at">) => {
    setExtraExpenses(prev => [...prev, { ...data, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleDeleteExtra = useCallback((id: string) => {
    setExtraExpenses(prev => prev.filter(e => e.id !== id));
  }, []);
  const handleUpdateExtra = useCallback((id: string, data: Partial<ExtraExpense>) => {
    setExtraExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  // ── カレンダーイベント CRUD ──
  const handleAddCalendarEvent = useCallback((event: Omit<CalendarEventItem, "id" | "created_at">) => {
    setCalendarEvents(prev => [...prev, { ...event, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleUpdateCalendarEvent = useCallback((id: string, updates: Partial<CalendarEventItem>) => {
    setCalendarEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
  }, []);
  const handleDeleteCalendarEvent = useCallback((id: string) => {
    setCalendarEvents(prev => prev.filter(ev => ev.id !== id));
  }, []);

  // スムーズスクロール用ハンドラー
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 次の給料日まで残り何日
  const daysToPayday = (() => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), cycle.payday);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, cycle.payday);
    const target = today.getDate() >= cycle.payday ? nextMonth : thisMonth;
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  })();

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <EnvNoticeBanner />

      {/* ── ヘッダー ── */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">資金管理ダッシュボード</h1>
            <p className="text-[10px] text-zinc-400 font-mono">給料日サイクル型 自由額 ＆ 将来計画</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* リマインダー手動再表示ボタン */}
          <button
            onClick={() => setShowReminder(true)}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
            title="直近の支出リマインダーを表示"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
          </button>

          {/* 次の給料日バッジ */}
          {cycle.payday > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full shadow-2xs">
              💴 次の給料日まで あと{daysToPayday}日
            </span>
          )}
          <div className="h-4 w-px bg-zinc-200 dark:border-zinc-800 hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* ── ページ内クイックジャンプナビ ── */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 z-10">
        <span className="text-[11px] font-semibold text-zinc-400 mr-1 hidden sm:inline">ジャンプ:</span>
        {[
          { id: "section-chart",    label: "資金配分（円グラフ）", icon: BarChart2 },
          { id: "section-calendar", label: "給料日カレンダー",     icon: CalendarIcon },
          { id: "section-extras",   label: "臨時出費予定",         icon: Zap },
          { id: "section-settings", label: "給与・固定費・色設定", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <Icon className="w-3.5 h-3.5 text-zinc-400" />
            {label}
          </button>
        ))}
      </nav>

      {/* ── メインコンテンツ（全セクションを1画面に統合） ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {/* 1. 円グラフによる資金可視化 */}
        <section id="section-chart">
          <BudgetPieChart
            salary={cycle.salary}
            fixedCosts={fixedCosts}
            savingPlans={savingPlans}
            extraExpenses={extraExpenses}
            categoryColors={categoryColors}
          />
        </section>

        {/* 2. 給料日基準のインタラクティブ・カレンダービュー */}
        <section id="section-calendar">
          <PaydayCalendarView
            cycle={cycle}
            fixedCosts={fixedCosts}
            savingPlans={savingPlans}
            extraExpenses={extraExpenses}
            calendarEvents={calendarEvents}
            categoryColors={categoryColors}
            onAddEvent={handleAddCalendarEvent}
            onUpdateEvent={handleUpdateCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
          />
        </section>

        {/* 3. 臨時出費 ＆ 設定パネル（横並びまたは縦スクロール） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 臨時出費・大きな買い物の予定カード */}
          <section id="section-extras">
            <ExtraExpenseSection
              expenses={extraExpenses}
              onAdd={handleAddExtra}
              onDelete={handleDeleteExtra}
              onUpdate={handleUpdateExtra}
            />
          </section>

          {/* 給与・固定費・貯金 ＆ カラー設定パネル */}
          <section id="section-settings">
            <SettingsPanel
              cycle={cycle}
              fixedCosts={fixedCosts}
              savingPlans={savingPlans}
              categoryColors={categoryColors}
              onUpdateCycle={setCycle}
              onUpdateCategoryColors={setCategoryColors}
              onAddFixed={handleAddFixed}
              onDeleteFixed={handleDeleteFixed}
              onUpdateFixed={handleUpdateFixed}
              onAddSaving={handleAddSaving}
              onDeleteSaving={handleDeleteSaving}
              onUpdateSaving={handleUpdateSaving}
            />
          </section>
        </div>
      </main>

      {/* ── サイトアクセス時 直近支出リマインダー ── */}
      <RecentExpensesReminder
        fixedCosts={fixedCosts}
        extraExpenses={extraExpenses}
        calendarEvents={calendarEvents}
        autoCloseDuration={8}
        isOpenExternal={showReminder}
        onToggleExternal={setShowReminder}
      />
    </div>
  );
}
