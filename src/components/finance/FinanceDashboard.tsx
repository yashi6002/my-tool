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
  LS_KEY_CARRYOVER,
} from "@/types/finance";
import {
  isFoodExpense,
  isDateInCycle,
  calculateCycleRange,
  calculateAutoCarryOver,
  getCycleOffsetBounds,
  sortByDateAsc,
} from "@/lib/financeUtils";
import { BudgetPieChart } from "@/components/finance/BudgetPieChart";
import { FoodExpenseTracker } from "@/components/finance/FoodExpenseTracker";
import { ExtraExpenseSection } from "@/components/finance/ExtraExpenseSection";
import { FixedCostSection } from "@/components/finance/FixedCostSection";
import { SavingPlanSection } from "@/components/finance/SavingPlanSection";
import { SettingsPanel } from "@/components/finance/SettingsPanel";
import { PaydayCalendarView } from "@/components/finance/PaydayCalendarView";
import { RecentExpensesReminder } from "@/components/finance/RecentExpensesReminder";
import { SearchDrawer } from "@/components/finance/SearchDrawer";
import { SidebarNavigation, FinanceTab } from "@/components/finance/SidebarNavigation";
import { SalaryCycleSection } from "@/components/finance/SalaryCycleSection";
import { EmptyStateGuide } from "@/components/finance/EmptyStateGuide";
import { generateRealisticDemoData } from "@/lib/demoData";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Menu,
  Wallet,
  Search,
  Bell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
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
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_FIXED: FixedCost[] = [];
const DEFAULT_SAVINGS: SavingPlan[] = [];

export interface AuthUser {
  id: string;
  email: string;
}

export function FinanceDashboard() {
  // ユーザー認証ステート
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 画面タブナビゲーションステート (①dashboard, ②calendar, ③settings)
  const [activeTab, setActiveTab] = useState<FinanceTab>("dashboard");

  // サイドバーの開閉ステート（PC用折りたたみ ＆ スマホ用ドロワー）
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 選択中の給料日サイクルオフセット (0 = 今月分, -1 = 先月分, +1 = 来月分)
  const [cycleOffset, setCycleOffset] = useState<number>(0);

  // 財務データステート
  const [cycle, setCycle] = useState<PaydayCycle>({ salary: 0, payday: 25, carryOver: 0 });
  const [manualCarryOverMap, setManualCarryOverMap] = useState<Record<number, number>>({});
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(DEFAULT_CATEGORY_COLORS);
  const [showReminder, setShowReminder] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // 給与セクションハイライト
  const [isSalaryHighlighted, setIsSalaryHighlighted] = useState(false);

  // 検索ドロワー用ステート
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [targetHighlightDate, setTargetHighlightDate] = useState<string | null>(null);

  // 初期ロード：セッション確認
  useEffect(() => {
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

  // ユーザー変更時のデータロード ＆ ゲストデータ自動引き継ぎ
  useEffect(() => {
    const userId = user?.id || null;
    if (userId && typeof window !== "undefined") {
      const userFixed = localStorage.getItem(getUserKey(LS_KEY_FIXED, userId));
      const guestFixed = localStorage.getItem(LS_KEY_FIXED);
      // ユーザー固有データが未登録で、ゲストデータが存在する場合は自動引き継ぎ
      if (!userFixed && guestFixed) {
        const keys = [
          LS_KEY_CYCLE,
          LS_KEY_CARRYOVER,
          LS_KEY_FIXED,
          LS_KEY_SAVINGS,
          LS_KEY_EXTRAS,
          LS_KEY_EVENTS,
          LS_KEY_CATEGORY_COLORS,
        ];
        keys.forEach((k) => {
          const val = localStorage.getItem(k);
          if (val !== null) {
            localStorage.setItem(getUserKey(k, userId), val);
            localStorage.removeItem(k);
          }
        });
      }
    }
    const loadedCycle = load(getUserKey(LS_KEY_CYCLE, userId), { salary: 0, payday: 25, carryOver: 0 });
    setCycle(loadedCycle);
    setManualCarryOverMap(load(getUserKey(LS_KEY_CARRYOVER, userId), {}));
    setFixedCosts(load(getUserKey(LS_KEY_FIXED, userId), DEFAULT_FIXED));
    setSavingPlans(load(getUserKey(LS_KEY_SAVINGS, userId), DEFAULT_SAVINGS));
    setExtraExpenses(load(getUserKey(LS_KEY_EXTRAS, userId), []));
    setCalendarEvents(load(getUserKey(LS_KEY_EVENTS, userId), []));
    setCategoryColors(load(getUserKey(LS_KEY_CATEGORY_COLORS, userId), DEFAULT_CATEGORY_COLORS));
    setMounted(true);
  }, [user]);

  // 各 state 変化時の永続化保存
  const currentUserId = user?.id || null;
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_CYCLE, currentUserId), cycle); }, [cycle, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_CARRYOVER, currentUserId), manualCarryOverMap); }, [manualCarryOverMap, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_FIXED, currentUserId), fixedCosts); }, [fixedCosts, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_SAVINGS, currentUserId), savingPlans); }, [savingPlans, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_EXTRAS, currentUserId), extraExpenses); }, [extraExpenses, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_EVENTS, currentUserId), calendarEvents); }, [calendarEvents, mounted, currentUserId]);
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_CATEGORY_COLORS, currentUserId), categoryColors); }, [categoryColors, mounted, currentUserId]);

  // Ctrl+K / Cmd+K ショートカット
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

  // ──────────────────────────────────────────
  // 選択サイクルの開始日・終了日の堅牢計算
  // ──────────────────────────────────────────
  const { cycleStart, cycleEnd, label: cycleLabelText, rangeText } = useMemo(() => {
    return calculateCycleRange(cycle?.payday || 25, cycleOffset);
  }, [cycle?.payday, cycleOffset]);

  // ──────────────────────────────────────────
  // 選択可能月（サイクル）の制限範囲 [oldestOffset - 24, 24]
  // ──────────────────────────────────────────
  const { minOffset, maxOffset } = useMemo(() => {
    return getCycleOffsetBounds(cycle?.payday || 25, calendarEvents, extraExpenses, fixedCosts);
  }, [cycle?.payday, calendarEvents, extraExpenses, fixedCosts]);

  const canPrevCycle = cycleOffset > minOffset;
  const canNextCycle = cycleOffset < maxOffset;

  const handlePrevCycle = useCallback(() => {
    setCycleOffset((v) => Math.max(minOffset, v - 1));
  }, [minOffset]);

  const handleNextCycle = useCallback(() => {
    setCycleOffset((v) => Math.min(maxOffset, v + 1));
  }, [maxOffset]);

  const handleSetCycleOffset = useCallback((offset: number) => {
    setCycleOffset(Math.max(minOffset, Math.min(maxOffset, offset)));
  }, [minOffset, maxOffset]);

  // ──────────────────────────────────────────
  // 【要件2】先月の繰越金の自動反映と「計算開始月（起点）」の制御
  // ──────────────────────────────────────────
  const currentCarryOver = useMemo(() => {
    // ユーザーが手動入力した値があれば優先
    if (manualCarryOverMap[cycleOffset] !== undefined) {
      return manualCarryOverMap[cycleOffset];
    }
    // 未設定の場合は、起点月を考慮して前月余剰金を自動計算
    return calculateAutoCarryOver(
      cycleOffset,
      cycle?.payday || 25,
      cycle?.salary || 0,
      fixedCosts,
      savingPlans,
      extraExpenses,
      calendarEvents
    );
  }, [cycleOffset, manualCarryOverMap, cycle?.payday, cycle?.salary, fixedCosts, savingPlans, extraExpenses, calendarEvents]);

  // 繰越金の手動更新ハンドラー
  const handleUpdateCarryOver = useCallback((amount: number) => {
    setManualCarryOverMap((prev) => ({
      ...prev,
      [cycleOffset]: amount,
    }));
  }, [cycleOffset]);

  // ──────────────────────────────────────────
  // 選択月（サイクル）への完全連動フィルタリング ＆ 自動分類
  // ──────────────────────────────────────────
  const cycleCalendarEvents = useMemo(() => {
    return (calendarEvents || []).filter((ev) => {
      if (ev?.is_recurring && ev?.recurring_day !== undefined) return true;
      return isDateInCycle(ev?.date, cycleStart, cycleEnd);
    });
  }, [calendarEvents, cycleStart, cycleEnd]);

  // 食費の自動分類
  const cycleFoodEvents = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => isFoodExpense(ev));
  }, [cycleCalendarEvents]);

  const totalFoodAmount = useMemo(() => {
    return cycleFoodEvents.reduce((s, e) => s + (e?.amount || 0), 0);
  }, [cycleFoodEvents]);

  // カレンダー直接入力の臨時出費（食費以外）
  const cycleExtraEventsFromCalendar = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => ev?.type === "expense" && !isFoodExpense(ev));
  }, [cycleCalendarEvents]);

  // カレンダー直接入力の臨時収入
  const cycleExtraIncomes = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => ev?.type === "income");
  }, [cycleCalendarEvents]);

  const totalExtraIncome = useMemo(() => {
    return cycleExtraIncomes.reduce((s, e) => s + (e?.amount || 0), 0);
  }, [cycleExtraIncomes]);

  // 当サイクル内の臨時出費カード
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

    return sortByDateAsc([...list, ...calendarExtrasAsItems]);
  }, [extraExpenses, cycleExtraEventsFromCalendar, cycleStart, cycleEnd]);

  // ── 認証ハンドラー ──
  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    save("finance_auth_user", authUser);
  };

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
    setFixedCosts(prev => [...(prev || []), { ...data, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleDeleteFixed = useCallback((id: string) => {
    setFixedCosts(prev => (prev || []).filter(f => f.id !== id));
  }, []);
  const handleUpdateFixed = useCallback((id: string, data: Partial<FixedCost>) => {
    setFixedCosts(prev => (prev || []).map(f => f.id === id ? { ...f, ...data } : f));
  }, []);

  // ── 貯金 CRUD ──
  const handleAddSaving = useCallback((data: Omit<SavingPlan, "id" | "created_at">) => {
    setSavingPlans(prev => [...(prev || []), { ...data, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleDeleteSaving = useCallback((id: string) => {
    setSavingPlans(prev => (prev || []).filter(s => s.id !== id));
  }, []);
  const handleUpdateSaving = useCallback((id: string, data: Partial<SavingPlan>) => {
    setSavingPlans(prev => (prev || []).map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  // ── 臨時出費 CRUD ──
  const handleAddExtra = useCallback((data: Omit<ExtraExpense, "id" | "created_at">) => {
    setExtraExpenses(prev => [...(prev || []), { ...data, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleDeleteExtra = useCallback((id: string) => {
    setExtraExpenses(prev => (prev || []).filter(e => e.id !== id));
    setCalendarEvents(prev => (prev || []).filter(ev => ev.id !== id));
  }, []);
  const handleUpdateExtra = useCallback((id: string, data: Partial<ExtraExpense>) => {
    setExtraExpenses(prev => (prev || []).map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  // ── カレンダーイベント CRUD ──
  const handleAddCalendarEvent = useCallback((event: Omit<CalendarEventItem, "id" | "created_at">) => {
    setCalendarEvents(prev => [...(prev || []), { ...event, id: uid(), created_at: new Date().toISOString() }]);
  }, []);
  const handleUpdateCalendarEvent = useCallback((id: string, updates: Partial<CalendarEventItem>) => {
    setCalendarEvents(prev => (prev || []).map(ev => ev.id === id ? { ...ev, ...updates } : ev));
  }, []);
  const handleDeleteCalendarEvent = useCallback((id: string) => {
    setCalendarEvents(prev => (prev || []).filter(ev => ev.id !== id));
  }, []);

  // ── クイック食費追加 ──
  const handleAddFoodExpense = useCallback((name: string, amount: number, dateStr: string) => {
    setCalendarEvents(prev => [
      ...(prev || []),
      {
        id: uid(),
        name,
        amount,
        type: "expense",
        category: "food",
        date: dateStr,
        color: categoryColors?.food || "#f59e0b",
        created_at: new Date().toISOString(),
      },
    ]);
  }, [categoryColors?.food]);

  // ── データ管理・復元・リセット・デモデータ ──
  const handleInsertDemoData = () => {
    const demo = generateRealisticDemoData();
    setCycle(demo.cycle);
    setFixedCosts(demo.fixedCosts);
    setSavingPlans(demo.savingPlans);
    setExtraExpenses(demo.extraExpenses);
    setCalendarEvents(demo.calendarEvents);
    setCategoryColors(demo.categoryColors);
    setActiveTab("calendar");
  };

  const handleRestoreData = (backup: FinanceBackupData) => {
    if (backup?.cycle) setCycle(backup.cycle);
    if (Array.isArray(backup?.fixedCosts)) setFixedCosts(backup.fixedCosts);
    if (Array.isArray(backup?.savingPlans)) setSavingPlans(backup.savingPlans);
    if (Array.isArray(backup?.extraExpenses)) setExtraExpenses(backup.extraExpenses);
    if (Array.isArray(backup?.calendarEvents)) setCalendarEvents(backup.calendarEvents);
    if (backup?.categoryColors) setCategoryColors(backup.categoryColors);
  };

  const handleResetData = () => {
    setCycle({ salary: 0, payday: 25, carryOver: 0 });
    setManualCarryOverMap({});
    setFixedCosts([]);
    setSavingPlans([]);
    setExtraExpenses([]);
    setCalendarEvents([]);
  };

  // 検索結果からのジャンプ
  const handleSelectDateFromSearch = (dateStr: string) => {
    setTargetHighlightDate(dateStr);
    setActiveTab("calendar");
  };

  // 空状態かどうか
  const isEmptyState =
    (!fixedCosts || fixedCosts.length === 0) &&
    (!extraExpenses || extraExpenses.length === 0) &&
    (!calendarEvents || calendarEvents.length === 0) &&
    (cycle?.salary || 0) === 0;

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* ── 背景装飾 ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/10 blur-[140px] pointer-events-none" />

      {/* ── 【要件3】開閉式サイドバーナビゲーション (PCスリム表示 ＆ スマホドロワー) ── */}
      <SidebarNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenSearch={() => setIsSearchOpen(true)}
        cycleMonthLabel={`${cycleLabelText} (${rangeText})`}
        cycleOffset={cycleOffset}
        onPrevCycle={handlePrevCycle}
        onNextCycle={handleNextCycle}
        canPrevCycle={canPrevCycle}
        canNextCycle={canNextCycle}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ── メインコンテンツエリア ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 z-10">
        {/*
          ── 【要件5】上部ヘッダー（スクロール時にも透けない固定ヘッダー） ──
          PC・スマホ両方で常設。スマホ時はメニュー開閉ボタンを配置。
        */}
        <header className="sticky top-0 h-14 border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 z-20 shadow-2xs">
          {/* 左側：スマホ用ハンバーガーボタン ＆ 表示月情報 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="メニューを開く"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{cycleLabelText}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal font-mono hidden sm:inline">
                ({rangeText})
              </span>
            </span>

            {cycleOffset === 0 ? (
              <span className="text-[9.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 今月
              </span>
            ) : (
              <span className="text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full font-medium">
                {cycleOffset > 0 ? `${cycleOffset}ヶ月先` : `${Math.abs(cycleOffset)}ヶ月前`}
              </span>
            )}
          </div>

          {/* 右側：先月分 / 来月分切り替え ＆ リマインダー ＆ 検索 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-white/5">
              <button
                type="button"
                onClick={handlePrevCycle}
                disabled={!canPrevCycle}
                className="px-2 py-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-700 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="先月分へ"
              >
                ◀ 先月分
              </button>
              <button
                type="button"
                onClick={handleNextCycle}
                disabled={!canNextCycle}
                className="px-2 py-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-700 font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="来月分へ"
              >
                来月分 ▶
              </button>
            </div>

            {/* リマインダー手動再表示ボタン */}
            <button
              onClick={() => setShowReminder(true)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors relative"
              title="直近の支出リマインダーを表示"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
            </button>
          </div>
        </header>

        {/* ── メインビュー切り替え ── */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 scroll-smooth z-10">
          {/* 初回空状態ガイド */}
          {isEmptyState && (
            <div className="max-w-5xl mx-auto mb-6">
              <EmptyStateGuide
                onInsertDemoData={handleInsertDemoData}
                onStartSetup={() => {
                  setIsSalaryHighlighted(true);
                  setTimeout(() => setIsSalaryHighlighted(false), 2500);
                }}
              />
            </div>
          )}

          {/* ═════════════════════════════════════════
              画面 ①：ダッシュボード / 分析（【要件8】すべて1列ワイド表示）
             ═════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col space-y-6 w-full max-w-5xl mx-auto">
              {/* 0. 給与・給料日サイクル設定（ダッシュボード最上部・アコーディオン） */}
              <section className="w-full">
                <SalaryCycleSection
                  cycle={cycle}
                  onUpdateCycle={setCycle}
                  isHighlighted={isSalaryHighlighted}
                />
              </section>

              {/* 1. 資金配分（円グラフ ＆ 繰越金自動反映つき自由費ヒーロー） */}
              <section className="w-full">
                <BudgetPieChart
                  salary={cycle?.salary || 0}
                  carryOver={currentCarryOver}
                  fixedCosts={fixedCosts}
                  savingPlans={savingPlans}
                  extraExpenses={cycleExtraExpenses}
                  foodAmount={totalFoodAmount}
                  extraIncome={totalExtraIncome}
                  categoryColors={categoryColors}
                  onUpdateCarryOver={handleUpdateCarryOver}
                />
              </section>

              {/* 2. 食費トラック（1列ワイド） */}
              <section className="w-full">
                <FoodExpenseTracker
                  cycleStart={cycleStart}
                  cycleEnd={cycleEnd}
                  calendarEvents={cycleFoodEvents}
                  onAddFoodExpense={handleAddFoodExpense}
                />
              </section>

              {/* 3. 当サイクルの臨時出費（1列ワイド） */}
              <section className="w-full">
                <ExtraExpenseSection
                  expenses={cycleExtraExpenses}
                  onAdd={handleAddExtra}
                  onDelete={handleDeleteExtra}
                  onUpdate={handleUpdateExtra}
                />
              </section>

              {/* 4. 【要件7】固定費・引き落とし予定（ダッシュボード画面へ移設・1列ワイド） */}
              <section className="w-full">
                <FixedCostSection
                  fixedCosts={fixedCosts}
                  categoryColor={categoryColors?.fixed}
                  onAddFixed={handleAddFixed}
                  onDeleteFixed={handleDeleteFixed}
                  onUpdateFixed={handleUpdateFixed}
                />
              </section>

              {/* 5. 【要件7】貯金・投資計画（ダッシュボード画面へ移設・1列ワイド） */}
              <section className="w-full">
                <SavingPlanSection
                  savingPlans={savingPlans}
                  categoryColor={categoryColors?.saving}
                  onAddSaving={handleAddSaving}
                  onDeleteSaving={handleDeleteSaving}
                  onUpdateSaving={handleUpdateSaving}
                />
              </section>
            </div>
          )}

          {/* ═════════════════════════════════════════
              画面 ②：カレンダー / 収支管理（【要件6】上部に円グラフ表示付き）
             ═════════════════════════════════════════ */}
          {activeTab === "calendar" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <PaydayCalendarView
                cycle={cycle}
                carryOver={currentCarryOver}
                fixedCosts={fixedCosts}
                savingPlans={savingPlans}
                extraExpenses={extraExpenses}
                calendarEvents={calendarEvents}
                categoryColors={categoryColors}
                targetHighlightDate={targetHighlightDate}
                cycleOffset={cycleOffset}
                onCycleOffsetChange={handleSetCycleOffset}
                onUpdateCarryOver={handleUpdateCarryOver}
                canPrevCycle={canPrevCycle}
                canNextCycle={canNextCycle}
                onAddEvent={handleAddCalendarEvent}
                onUpdateEvent={handleUpdateCalendarEvent}
                onDeleteEvent={handleDeleteCalendarEvent}
              />
            </div>
          )}

          {/* ═════════════════════════════════════════
              画面 ③：データ管理 / 設定
             ═════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto">
              <SettingsPanel
                cycle={cycle}
                fixedCosts={fixedCosts}
                savingPlans={savingPlans}
                extraExpenses={extraExpenses}
                calendarEvents={calendarEvents}
                categoryColors={categoryColors}
                onUpdateCycle={setCycle}
                onUpdateCategoryColors={setCategoryColors}
                onRestoreData={handleRestoreData}
                onResetData={handleResetData}
                onInsertDemoData={handleInsertDemoData}
              />
            </div>
          )}
        </main>
      </div>

      {/* ── 検索 ＆ 絞り込みドロワー ── */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        cycle={cycle}
        fixedCosts={fixedCosts}
        savingPlans={savingPlans}
        extraExpenses={extraExpenses}
        calendarEvents={calendarEvents}
        onSelectDate={handleSelectDateFromSearch}
      />

      {/* ── 直近支出リマインダー ── */}
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
