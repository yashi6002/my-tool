"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FixedCost,
  SavingPlan,
  ExtraExpense,
  PaydayCycle,
  LS_KEY_CYCLE,
  LS_KEY_FIXED,
  LS_KEY_SAVINGS,
  LS_KEY_EXTRAS,
} from "@/types/finance";
import { BudgetPieChart } from "@/components/finance/BudgetPieChart";
import { ExtraExpenseSection } from "@/components/finance/ExtraExpenseSection";
import { SettingsPanel } from "@/components/finance/SettingsPanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { Wallet, Settings, BarChart2 } from "lucide-react";

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
  { id: uid(), name: "家賃", amount: 70000, category: "rent", due_day: 27, created_at: new Date().toISOString() },
  { id: uid(), name: "電気・ガス・水道", amount: 12000, category: "utilities", due_day: 10, created_at: new Date().toISOString() },
  { id: uid(), name: "スマホ代", amount: 5000, category: "subscription", due_day: 15, created_at: new Date().toISOString() },
];
const DEFAULT_SAVINGS: SavingPlan[] = [
  { id: uid(), name: "先取り貯金", amount: 20000, created_at: new Date().toISOString() },
  { id: uid(), name: "NISA", amount: 33333, created_at: new Date().toISOString() },
];

// ──────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────
export function FinanceDashboard() {
  const [tab, setTab] = useState<"dashboard" | "settings">("dashboard");

  const [cycle, setCycle] = useState<PaydayCycle>({ salary: 250000, payday: 25 });
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [mounted, setMounted] = useState(false);

  // クライアント側でのみローカルストレージからロード
  useEffect(() => {
    setCycle(load(LS_KEY_CYCLE, { salary: 250000, payday: 25 }));
    setFixedCosts(load(LS_KEY_FIXED, DEFAULT_FIXED));
    setSavingPlans(load(LS_KEY_SAVINGS, DEFAULT_SAVINGS));
    setExtraExpenses(load(LS_KEY_EXTRAS, []));
    setMounted(true);
  }, []);

  // 各 state 変化時に保存
  useEffect(() => { if (mounted) save(LS_KEY_CYCLE, cycle); }, [cycle, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_FIXED, fixedCosts); }, [fixedCosts, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_SAVINGS, savingPlans); }, [savingPlans, mounted]);
  useEffect(() => { if (mounted) save(LS_KEY_EXTRAS, extraExpenses); }, [extraExpenses, mounted]);

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

      {/* ヘッダー */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">資金管理ダッシュボード</h1>
            <p className="text-[10px] text-zinc-400 font-mono">給料日サイクル型 自由額ビュー</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 次の給料日バッジ */}
          {cycle.payday > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
              💴 次の給料日まで あと{daysToPayday}日
            </span>
          )}
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* タブナビ */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex gap-1 shrink-0">
        {([
          { key: "dashboard", label: "ダッシュボード", icon: BarChart2 },
          { key: "settings",  label: "設定",           icon: Settings  },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {tab === "dashboard" ? (
          <>
            {/* 円グラフ */}
            <BudgetPieChart
              salary={cycle.salary}
              fixedCosts={fixedCosts}
              savingPlans={savingPlans}
              extraExpenses={extraExpenses}
            />

            {/* 臨時出費カード */}
            <ExtraExpenseSection
              expenses={extraExpenses}
              onAdd={handleAddExtra}
              onDelete={handleDeleteExtra}
              onUpdate={handleUpdateExtra}
            />
          </>
        ) : (
          <SettingsPanel
            cycle={cycle}
            fixedCosts={fixedCosts}
            savingPlans={savingPlans}
            onUpdateCycle={setCycle}
            onAddFixed={handleAddFixed}
            onDeleteFixed={handleDeleteFixed}
            onUpdateFixed={handleUpdateFixed}
            onAddSaving={handleAddSaving}
            onDeleteSaving={handleDeleteSaving}
            onUpdateSaving={handleUpdateSaving}
          />
        )}
      </main>
    </div>
  );
}

