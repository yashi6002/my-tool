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
import { isFoodExpense, isDateInCycle, calculateCycleRange, sortByDateAsc } from "@/lib/financeUtils";
import { BudgetPieChart } from "@/components/finance/BudgetPieChart";
import { FoodExpenseTracker } from "@/components/finance/FoodExpenseTracker";
import { ExtraExpenseSection } from "@/components/finance/ExtraExpenseSection";
import { SettingsPanel } from "@/components/finance/SettingsPanel";
import { PaydayCalendarView } from "@/components/finance/PaydayCalendarView";
import { RecentExpensesReminder } from "@/components/finance/RecentExpensesReminder";
import { SearchDrawer } from "@/components/finance/SearchDrawer";
import { SidebarNavigation, FinanceTab } from "@/components/finance/SidebarNavigation";
import { EmptyStateGuide } from "@/components/finance/EmptyStateGuide";
import { generateRealisticDemoData } from "@/lib/demoData";
import { AuthModal } from "@/components/auth/AuthModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Wallet,
  Search,
  Bell,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
  LogIn,
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
// メインコンポーネント: PayCycle (3画面サイドバー切替)
// ──────────────────────────────────────────
export function FinanceDashboard() {
  // ユーザー認証ステート
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 画面タブナビゲーションステート (①dashboard, ②calendar, ③settings)
  const [activeTab, setActiveTab] = useState<FinanceTab>("dashboard");

  // 選択中の給料日サイクルオフセット (0 = 今月分, -1 = 先月分, +1 = 来月分)
  const [cycleOffset, setCycleOffset] = useState<number>(0);

  // 財務データステート
  const [cycle, setCycle] = useState<PaydayCycle>({ salary: 250000, payday: 25, carryOver: 0 });
  const [carryOver, setCarryOver] = useState<number>(0);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(DEFAULT_CATEGORY_COLORS);
  const [showReminder, setShowReminder] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

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

  // ユーザー変更時のデータロード
  useEffect(() => {
    const userId = user?.id || null;
    const loadedCycle = load(getUserKey(LS_KEY_CYCLE, userId), { salary: 250000, payday: 25, carryOver: 0 });
    setCycle(loadedCycle);
    setCarryOver(load(getUserKey(LS_KEY_CARRYOVER, userId), loadedCycle.carryOver || 0));
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
  useEffect(() => { if (mounted) save(getUserKey(LS_KEY_CARRYOVER, currentUserId), carryOver); }, [carryOver, mounted, currentUserId]);
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
  // 選択サイクルの開始日・終了日の厳密計算
  // ──────────────────────────────────────────
  const { cycleStart, cycleEnd, label: cycleLabelText, rangeText } = useMemo(() => {
    return calculateCycleRange(cycle.payday, cycleOffset);
  }, [cycle.payday, cycleOffset]);

  // ──────────────────────────────────────────
  // 選択月（サイクル）への完全連動フィルタリング ＆ 自動分類
  // ──────────────────────────────────────────
  // 1. カレンダーイベントの当月フィルタリング
  const cycleCalendarEvents = useMemo(() => {
    return calendarEvents.filter((ev) => {
      if (ev.is_recurring && ev.recurring_day !== undefined) {
        return true; // 毎月繰り返しは全サイクル対象
      }
      return isDateInCycle(ev.date, cycleStart, cycleEnd);
    });
  }, [calendarEvents, cycleStart, cycleEnd]);

  // 2. カレンダーから直接入力された「食費」の自動分類と集計
  const cycleFoodEvents = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => isFoodExpense(ev));
  }, [cycleCalendarEvents]);

  const totalFoodAmount = useMemo(() => {
    return cycleFoodEvents.reduce((s, e) => s + e.amount, 0);
  }, [cycleFoodEvents]);

  // 3. カレンダーから直接入力された「臨時出費（食費以外）」の集計
  const cycleExtraEventsFromCalendar = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => ev.type === "expense" && !isFoodExpense(ev));
  }, [cycleCalendarEvents]);

  // 4. カレンダーから直接入力された「臨時収入」の集計
  const cycleExtraIncomes = useMemo(() => {
    return cycleCalendarEvents.filter((ev) => ev.type === "income");
  }, [cycleCalendarEvents]);

  const totalExtraIncome = useMemo(() => {
    return cycleExtraIncomes.reduce((s, e) => s + e.amount, 0);
  }, [cycleExtraIncomes]);

  // 5. 臨時出費カードのうち、当サイクル内に該当するもの（他月の予定は厳密に除外）
  const cycleExtraExpenses = useMemo(() => {
    const list = extraExpenses.filter((ee) => {
      if (!ee.date) return true; // 日付未定の予定は当期計画として含める
      return isDateInCycle(ee.date, cycleStart, cycleEnd);
    });

    // カレンダー直接入力の臨時出費も合算してリスト表示可能にする
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
    // カレンダーイベント側にもあれば削除
    setCalendarEvents(prev => prev.filter(ev => ev.id !== id));
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

  // ── クイック食費追加ハンドラー ──
  const handleAddFoodExpense = useCallback((name: string, amount: number, dateStr: string) => {
    setCalendarEvents(prev => [
      ...prev,
      {
        id: uid(),
        name,
        amount,
        type: "expense",
        category: "food",
        date: dateStr,
        color: categoryColors.food || "#f59e0b",
        created_at: new Date().toISOString(),
      },
    ]);
  }, [categoryColors.food]);

  // ── データ管理・復元・リセット・デモデータ ──
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
    if (backup.carryOver !== undefined) setCarryOver(backup.carryOver);
    if (Array.isArray(backup.fixedCosts)) setFixedCosts(backup.fixedCosts);
    if (Array.isArray(backup.savingPlans)) setSavingPlans(backup.savingPlans);
    if (Array.isArray(backup.extraExpenses)) setExtraExpenses(backup.extraExpenses);
    if (Array.isArray(backup.calendarEvents)) setCalendarEvents(backup.calendarEvents);
    if (backup.categoryColors) setCategoryColors(backup.categoryColors);
  };

  const handleResetData = () => {
    setCycle({ salary: 0, payday: 25, carryOver: 0 });
    setCarryOver(0);
    setFixedCosts([]);
    setSavingPlans([]);
    setExtraExpenses([]);
    setCalendarEvents([]);
  };

  // 検索結果クリック時の日付ジャンプ
  const handleSelectDateFromSearch = (dateStr: string) => {
    setTargetHighlightDate(dateStr);
    setActiveTab("calendar");
  };

  // 空状態かどうか
  const isEmptyState =
    fixedCosts.length === 0 &&
    extraExpenses.length === 0 &&
    calendarEvents.length === 0 &&
    cycle.salary === 0;

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-zinc-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* ── 背景の美しいスポットライト・メッシュ装飾 ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/10 blur-[140px] pointer-events-none" />

      {/* ── 左サイドバーナビゲーション (3画面切替) ── */}
      <SidebarNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenSearch={() => setIsSearchOpen(true)}
        cycleMonthLabel={`${cycleLabelText} (${rangeText})`}
        cycleOffset={cycleOffset}
        onPrevCycle={() => setCycleOffset((v) => v - 1)}
        onNextCycle={() => setCycleOffset((v) => v + 1)}
      />

      {/* ── メインコンテンツエリア ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 z-10">
        {/*
          最優先要件1:
          カレンダー表示時は最上部の全体ヘッダー（アカウント/検索枠等）を非表示にしてカレンダー表示領域を広く確保する
        */}
        {activeTab !== "calendar" && (
          <header className="h-14 border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shrink-0">
            {/* 左側：現在の表示月情報 */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{cycleLabelText}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal font-mono">
                  ({rangeText})
                </span>
              </span>
              {cycleOffset === 0 ? (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 今月分
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full font-medium">
                  {cycleOffset > 0 ? `${cycleOffset}ヶ月先` : `${Math.abs(cycleOffset)}ヶ月前`}
                </span>
              )}
            </div>

            {/* 右側：クイックコントロール */}
            <div className="flex items-center gap-2">
              {/* 先月/来月切り替え */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setCycleOffset((v) => v - 1)}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-700 font-medium transition-all"
                  title="先月分へ"
                >
                  ◀ 先月分
                </button>
                <button
                  type="button"
                  onClick={() => setCycleOffset((v) => v + 1)}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-slate-700 font-medium transition-all"
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
        )}

        {/* ── メインビュー切り替え（①ダッシュボード/分析, ②カレンダー/収支管理, ③データ管理/設定） ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth z-10">
          {/* 初回空状態ガイド */}
          {isEmptyState && (
            <EmptyStateGuide
              onInsertDemoData={handleInsertDemoData}
              onOpenSettings={() => setActiveTab("settings")}
            />
          )}

          {/* ═════════════════════════════════════════
              画面 ①：ダッシュボード / 分析
             ═════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* 1. 資金配分（円グラフ ＆ 繰越金入力つき自由費ヒーロー） */}
              <section>
                <BudgetPieChart
                  salary={cycle.salary}
                  carryOver={carryOver}
                  fixedCosts={fixedCosts}
                  savingPlans={savingPlans}
                  extraExpenses={cycleExtraExpenses}
                  foodAmount={totalFoodAmount}
                  extraIncome={totalExtraIncome}
                  categoryColors={categoryColors}
                  onUpdateCarryOver={setCarryOver}
                />
              </section>

              {/* 2. 食費トラック ＆ 臨時出費・予定リスト（予定日昇順ソート） */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 独立した食費トラック欄 */}
                <section>
                  <FoodExpenseTracker
                    cycleStart={cycleStart}
                    cycleEnd={cycleEnd}
                    calendarEvents={cycleFoodEvents}
                    onAddFoodExpense={handleAddFoodExpense}
                  />
                </section>

                {/* 当サイクルに連動した臨時出費カード一覧（予定日順ソート） */}
                <section>
                  <ExtraExpenseSection
                    expenses={cycleExtraExpenses}
                    onAdd={handleAddExtra}
                    onDelete={handleDeleteExtra}
                    onUpdate={handleUpdateExtra}
                  />
                </section>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════
              画面 ②：カレンダー / 収支管理（ヘッダー非表示で広大に表示）
             ═════════════════════════════════════════ */}
          {activeTab === "calendar" && (
            <div className="max-w-7xl mx-auto">
              <PaydayCalendarView
                cycle={cycle}
                fixedCosts={fixedCosts}
                savingPlans={savingPlans}
                extraExpenses={extraExpenses}
                calendarEvents={calendarEvents}
                categoryColors={categoryColors}
                targetHighlightDate={targetHighlightDate}
                cycleOffset={cycleOffset}
                onCycleOffsetChange={setCycleOffset}
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
