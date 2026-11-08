"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Wallet, Settings, BarChart2, Calendar as CalendarIcon, Zap, Bell, User as UserIcon, LogOut, LogIn } from "lucide-react";

// ──────────────────────────────────────────
// ローカルストレージ ヘルパー（ユーザーID対応）
// ──────────────────────────────────────────
function getUserKey(baseKey: string, userId: string | null): string {
  return userId ? `${baseKey}_${userId}` : baseKey;
}

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

// デフォルト固定費（初期サンプル）
const DEFAULT_FIXED: FixedCost[] = [
  { id: uid(), name: "家賃", amount: 70000, category: "rent", due_day: 27, color: "#f87171", created_at: new Date().toISOString() },
  { id: uid(), name: "電気・ガス・水道", amount: 12000, category: "utilities", due_day: 10, color: "#f87171", created_at: new Date().toISOString() },
  { id: uid(), name: "スマホ代", amount: 5000, category: "subscription", due_day: 15, color: "#f87171", created_at: new Date().toISOString() },
];
const DEFAULT_SAVINGS: SavingPlan[] = [
  { id: uid(), name: "先取り貯金", amount: 20000, color: "#60a5fa", created_at: new Date().toISOString() },
  { id: uid(), name: "NISA", amount: 33333, color: "#60a5fa", created_at: new Date().toISOString() },
];

export interface AuthUser {
  id: string;
  email: string;
}

// ──────────────────────────────────────────
// メインコンポーネント (1画面オールインワン表示)
// ──────────────────────────────────────────
export function FinanceDashboard() {
  // ユーザー認証ステート
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [cycle, setCycle] = useState<PaydayCycle>({ salary: 250000, payday: 25 });
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(DEFAULT_CATEGORY_COLORS);
  const [showReminder, setShowReminder] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // 初期ロード：セッションの確認
  useEffect(() => {
    // ローカル保存されているユーザーセッション
    const savedUser = load<AuthUser | null>("finance_auth_user", null);
    if (savedUser) {
      setUser(savedUser);
    } else if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || "" };
          setUser(authUser);
          save("finance_auth_user", authUser);
        }
      });
    }
  }, []);

  // ユーザーが変更されたら、そのユーザー用のデータをロード
  useEffect(() => {
    const userId = user?.id || null;
    setCycle(load(getUserKey(LS_KEY_CYCLE, userId), { salary: 250000, payday: 25 }));
    setFixedCosts(load(getUserKey(LS_KEY_FIXED, userId), DEFAULT_FIXED));
    setSavingPlans(load(getUserKey(LS_KEY_SAVINGS, userId), DEFAULT_SAVINGS));
    setExtraExpenses(load(getUserKey(LS_KEY_EXTRAS, userId), []));
    setCalendarEvents(load(getUserKey(LS_KEY_EVENTS, userId), []));
    setCategoryColors(load(getUserKey(LS_KEY_CATEGORY_COLORS, userId), DEFAULT_CATEGORY_COLORS));
    setMounted(true);
  }, [user]);

  // 各 state 変化時に、現在アクティブなユーザーIDごとに保存
  const currentUserId = user?.id || null;
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_CYCLE, currentUserId), cycle); }, [cycle, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_FIXED, currentUserId), fixedCosts); }, [fixedCosts, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_SAVINGS, currentUserId), savingPlans); }, [savingPlans, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_EXTRAS, currentUserId), extraExpenses); }, [extraExpenses, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_EVENTS, currentUserId), calendarEvents); }, [calendarEvents, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_CATEGORY_COLORS, currentUserId), categoryColors); }, [categoryColors, mounted, currentUserId]);

  // 認証成功時ハンドラー
  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    save("finance_auth_user", authUser);
  };

  // ログアウトハンドラー
  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("finance_auth_user");
    }
  };

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
  const daysToPayday = useMemo(() => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), cycle.payday);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, cycle.payday);
    const target = today.getDate() >= cycle.payday ? nextMonth : thisMonth;
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  }, [cycle.payday]);

  if (!mounted) return null;

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* ── 背景の美しいスポットライト・メッシュ装飾 ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/10 blur-[140px] pointer-events-none" />

      <EnvNoticeBanner />

      {/* ── ヘッダー（Glassmorphism 両対応） ── */}
      <header className="h-14 border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md ring-1 ring-black/5 dark:ring-white/20">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>資金管理ダッシュボード</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">給料日サイクル型 自由額 ＆ 将来計画</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* ユーザーアカウント / ログインボタン */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-1 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[110px] sm:max-w-[160px] truncate font-medium text-slate-700 dark:text-slate-200">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-0.5"
                title="ログアウト"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ログイン / 登録</span>
            </button>
          )}

          {/* リマインダー手動再表示ボタン */}
          <button
            onClick={() => setShowReminder(true)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors relative"
            title="直近の支出リマインダーを表示"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
          </button>

          {/* 次の給料日バッジ */}
          {cycle.payday > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full shadow-xs">
              💴 あと{daysToPayday}日
            </span>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* ── ページ内クイックジャンプナビ（Glassmorphism 両対応） ── */}
      <nav className="border-b border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 z-10">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">ジャンプ:</span>
        {[
          { id: "section-chart",    label: "資金配分（円グラフ）", icon: BarChart2 },
          { id: "section-calendar", label: "給料日カレンダー",     icon: CalendarIcon },
          { id: "section-extras",   label: "臨時出費予定",         icon: Zap },
          { id: "section-settings", label: "固定費・給与・色設定", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent hover:border-slate-300 dark:hover:border-white/10 transition-all shrink-0"
          >
            <Icon className="w-3.5 h-3.5 text-slate-400" />
            {label}
          </button>
        ))}
      </nav>

      {/* ── メインコンテンツ（全セクションを1画面に統合） ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth z-10">
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

      {/* ── 認証モーダル ── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
