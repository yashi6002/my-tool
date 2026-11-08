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
  FinanceBackupData,
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
import { SearchDrawer } from "@/components/finance/SearchDrawer";
import { SimulationBar } from "@/components/finance/SimulationBar";
import { EmptyStateGuide } from "@/components/finance/EmptyStateGuide";
import { generateRealisticDemoData } from "@/lib/demoData";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EnvNoticeBanner } from "@/components/ui/EnvNoticeBanner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Wallet,
  Settings,
  BarChart2,
  Calendar as CalendarIcon,
  Zap,
  Bell,
  User as UserIcon,
  LogOut,
  LogIn,
  Search,
  FlaskConical,
  Sparkles,
} from "lucide-react";

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

  // ── 検索 ＆ フィルタリング用ステート ──
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [targetHighlightDate, setTargetHighlightDate] = useState<string | null>(null);

  // ── 資金シミュレーション用ステート ──
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simCycle, setSimCycle] = useState<PaydayCycle>({ salary: 250000, payday: 25 });
  const [simFixedCosts, setSimFixedCosts] = useState<FixedCost[]>([]);
  const [simSavingPlans, setSimSavingPlans] = useState<SavingPlan[]>([]);
  const [simExtraExpenses, setSimExtraExpenses] = useState<ExtraExpense[]>([]);

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

  // Ctrl+K / Cmd+K で検索を開くショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── シミュレーション操作ハンドラー ──
  const handleStartSimulation = () => {
    setSimCycle({ ...cycle });
    setSimFixedCosts(JSON.parse(JSON.stringify(fixedCosts)));
    setSimSavingPlans(JSON.parse(JSON.stringify(savingPlans)));
    setSimExtraExpenses(JSON.parse(JSON.stringify(extraExpenses)));
    setIsSimulating(true);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
  };

  const handleApplySimulation = () => {
    setCycle(simCycle);
    setFixedCosts(simFixedCosts);
    setSavingPlans(simSavingPlans);
    setExtraExpenses(simExtraExpenses);
    setIsSimulating(false);
  };

  const handleResetSimulation = () => {
    setSimCycle({ ...cycle });
    setSimFixedCosts(JSON.parse(JSON.stringify(fixedCosts)));
    setSimSavingPlans(JSON.parse(JSON.stringify(savingPlans)));
    setSimExtraExpenses(JSON.parse(JSON.stringify(extraExpenses)));
  };

  const handleToggleSimFixedCost = (id: string) => {
    setSimFixedCosts((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateSimFixedAmount = (id: string, amount: number) => {
    setSimFixedCosts((prev) => prev.map((f) => (f.id === id ? { ...f, amount } : f)));
  };

  const handleAddSimExtraExpense = (name: string, amount: number) => {
    setSimExtraExpenses((prev) => [
      ...prev,
      {
        id: uid(),
        name,
        amount,
        color: "#fb923c",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleDeleteSimExtraExpense = (id: string) => {
    setSimExtraExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // ── データ管理・バックアップ・デモ投入ハンドラー ──
  const handleInsertDemoData = () => {
    const demo = generateRealisticDemoData();
    setCycle(demo.cycle);
    setFixedCosts(demo.fixedCosts);
    setSavingPlans(demo.savingPlans);
    setExtraExpenses(demo.extraExpenses);
    setCalendarEvents(demo.calendarEvents);
    setCategoryColors(demo.categoryColors);
  };

  const handleRestoreData = (backup: FinanceBackupData) => {
    if (backup.cycle) setCycle(backup.cycle);
    if (Array.isArray(backup.fixedCosts)) setFixedCosts(backup.fixedCosts);
    if (Array.isArray(backup.savingPlans)) setSavingPlans(backup.savingPlans);
    if (Array.isArray(backup.extraExpenses)) setExtraExpenses(backup.extraExpenses);
    if (Array.isArray(backup.calendarEvents)) setCalendarEvents(backup.calendarEvents);
    if (backup.categoryColors) setCategoryColors(backup.categoryColors);
  };

  const handleResetData = () => {
    setCycle({ salary: 0, payday: 25 });
    setFixedCosts([]);
    setSavingPlans([]);
    setExtraExpenses([]);
    setCalendarEvents([]);
  };

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

  // カレンダーセルへのジャンプハンドラー（検索結果クリック時など）
  const handleSelectDateFromSearch = (dateStr: string) => {
    setTargetHighlightDate(dateStr);
    scrollToSection("section-calendar");
  };

  // シミュレーション適用中かどうかに応じたアクティブデータ
  const activeCycle = isSimulating ? simCycle : cycle;
  const activeFixedCosts = isSimulating ? simFixedCosts : fixedCosts;
  const activeSavingPlans = isSimulating ? simSavingPlans : savingPlans;
  const activeExtraExpenses = isSimulating ? simExtraExpenses : extraExpenses;

  // データが初期空状態かどうか（Empty State ガイドの表示判定）
  const isEmptyState =
    fixedCosts.length === 0 &&
    extraExpenses.length === 0 &&
    calendarEvents.length === 0 &&
    cycle.salary === 0;

  // 次の給料日まで残り何日
  const daysToPayday = useMemo(() => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), activeCycle.payday);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, activeCycle.payday);
    const target = today.getDate() >= activeCycle.payday ? nextMonth : thisMonth;
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  }, [activeCycle.payday]);

  if (!mounted) return null;

  return (
    <div
      className={`relative flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-slate-800 dark:text-slate-100 transition-all duration-300 ${
        isSimulating ? "ring-4 ring-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.25)]" : ""
      }`}
    >
      {/* ── 背景の美しいスポットライト・メッシュ装飾 ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/10 blur-[140px] pointer-events-none" />

      <EnvNoticeBanner />

      {/* ── シミュレーションバー（アクティブ時） ── */}
      <SimulationBar
        isActive={isSimulating}
        onClose={handleStopSimulation}
        baseCycle={cycle}
        baseFixedCosts={fixedCosts}
        baseSavingPlans={savingPlans}
        baseExtraExpenses={extraExpenses}
        simCycle={simCycle}
        simFixedCosts={simFixedCosts}
        simSavingPlans={simSavingPlans}
        simExtraExpenses={simExtraExpenses}
        onUpdateSimCycle={setSimCycle}
        onToggleSimFixedCost={handleToggleSimFixedCost}
        onUpdateSimFixedAmount={handleUpdateSimFixedAmount}
        onAddSimExtraExpense={handleAddSimExtraExpense}
        onDeleteSimExtraExpense={handleDeleteSimExtraExpense}
        onApplyToProduction={handleApplySimulation}
        onResetSimulation={handleResetSimulation}
      />

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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
              給料日サイクル型 自由額 ＆ 将来計画
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 検索ボタン (Ctrl+K) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 transition-all shadow-xs"
            title="収支をキーワードや日付で検索 (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">検索</span>
            <kbd className="hidden md:inline-block text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
              Ctrl+K
            </kbd>
          </button>

          {/* シミュレーション切り替えボタン */}
          <button
            onClick={() => {
              if (isSimulating) {
                handleStopSimulation();
              } else {
                handleStartSimulation();
              }
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all shadow-xs ${
              isSimulating
                ? "bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-500/30"
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
            }`}
            title="本番データを保護したまま給与や出費を変更して試算"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSimulating ? "試算中" : "シミュレーション"}
            </span>
          </button>

          {/* ユーザーアカウント / ログインボタン */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-1 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[90px] sm:max-w-[150px] truncate font-medium text-slate-700 dark:text-slate-200">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-0.5"
                title="ログアウト"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 sm:px-3 py-1.5 rounded-full transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ログイン</span>
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
          {activeCycle.payday > 0 && (
            <span className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full shadow-xs">
              💴 あと{daysToPayday}日
            </span>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* ── ページ内クイックジャンプナビ（Glassmorphism 両対応） ── */}
      <nav className="border-b border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0 z-10">
        <div className="flex items-center gap-2">
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
        </div>

        {/* クイックデモ投入ショートカット（初期データがない場合にも役立つ） */}
        <button
          onClick={handleInsertDemoData}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          title="1ヶ月分のリアルな収支サンプルを一括入力"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>デモデータ投入</span>
        </button>
      </nav>

      {/* ── メインコンテンツ（全セクションを1画面に統合） ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth z-10">
        {/* 初回ガイド ＆ デモデータ案内 (Empty State) */}
        {isEmptyState && (
          <EmptyStateGuide
            onInsertDemoData={handleInsertDemoData}
            onOpenSettings={() => scrollToSection("section-settings")}
          />
        )}

        {/* 1. 円グラフによる資金可視化 */}
        <section id="section-chart">
          <BudgetPieChart
            salary={activeCycle.salary}
            fixedCosts={activeFixedCosts}
            savingPlans={activeSavingPlans}
            extraExpenses={activeExtraExpenses}
            categoryColors={categoryColors}
          />
        </section>

        {/* 2. 給料日基準のインタラクティブ・カレンダービュー */}
        <section id="section-calendar">
          <PaydayCalendarView
            cycle={activeCycle}
            fixedCosts={activeFixedCosts}
            savingPlans={activeSavingPlans}
            extraExpenses={activeExtraExpenses}
            calendarEvents={calendarEvents}
            categoryColors={categoryColors}
            targetHighlightDate={targetHighlightDate}
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
              expenses={activeExtraExpenses}
              onAdd={handleAddExtra}
              onDelete={handleDeleteExtra}
              onUpdate={handleUpdateExtra}
            />
          </section>

          {/* 給与・固定費・貯金 ＆ カラー設定 ＆ バックアップパネル */}
          <section id="section-settings">
            <SettingsPanel
              cycle={cycle}
              fixedCosts={fixedCosts}
              savingPlans={savingPlans}
              extraExpenses={extraExpenses}
              calendarEvents={calendarEvents}
              categoryColors={categoryColors}
              onUpdateCycle={setCycle}
              onUpdateCategoryColors={setCategoryColors}
              onAddFixed={handleAddFixed}
              onDeleteFixed={handleDeleteFixed}
              onUpdateFixed={handleUpdateFixed}
              onAddSaving={handleAddSaving}
              onDeleteSaving={handleDeleteSaving}
              onUpdateSaving={handleUpdateSaving}
              onRestoreData={handleRestoreData}
              onResetData={handleResetData}
              onInsertDemoData={handleInsertDemoData}
            />
          </section>
        </div>
      </main>

      {/* ── 検索 ＆ 絞り込みドロワー ── */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        cycle={activeCycle}
        fixedCosts={activeFixedCosts}
        savingPlans={activeSavingPlans}
        extraExpenses={activeExtraExpenses}
        calendarEvents={calendarEvents}
        onSelectDate={handleSelectDateFromSearch}
      />

      {/* ── サイトアクセス時 直近支出リマインダー ── */}
      <RecentExpensesReminder
        fixedCosts={activeFixedCosts}
        extraExpenses={activeExtraExpenses}
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
