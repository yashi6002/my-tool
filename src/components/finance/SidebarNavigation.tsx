"use client";

import { AuthUser } from "./FinanceDashboard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Wallet,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Settings,
  Search,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type FinanceTab = "dashboard" | "calendar" | "settings";

interface Props {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  user: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenSearch: () => void;
  cycleMonthLabel?: string;
  onPrevCycle?: () => void;
  onNextCycle?: () => void;
  cycleOffset?: number;
}

export function SidebarNavigation({
  activeTab,
  onTabChange,
  user,
  onOpenAuthModal,
  onSignOut,
  onOpenSearch,
  cycleMonthLabel,
  onPrevCycle,
  onNextCycle,
  cycleOffset = 0,
}: Props) {
  const navItems = [
    {
      id: "dashboard" as FinanceTab,
      label: "ダッシュボード / 分析",
      desc: "自由費・円グラフ・食費トラック",
      icon: LayoutDashboard,
    },
    {
      id: "calendar" as FinanceTab,
      label: "カレンダー / 収支管理",
      desc: "給料日基準カレンダー・日別収支",
      icon: CalendarIcon,
    },
    {
      id: "settings" as FinanceTab,
      label: "データ管理 / 設定",
      desc: "給与・固定費・バックアップ",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/10 flex flex-col justify-between shrink-0 z-30 transition-colors">
      {/* 上部：アプリロゴ ＆ サイクルセレクター ＆ ナビゲーション */}
      <div>
        {/* ブランドロゴ */}
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md ring-1 ring-black/5 dark:ring-white/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base tracking-tight text-slate-900 dark:text-white">
                  PayCycle
                </h1>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                給料日サイクル型 資金管理
              </p>
            </div>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        {/* 選択中の月（サイクル）セレクター（サイドバー内に常駐） */}
        {cycleMonthLabel && (
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400">表示対象月:</span>
              {cycleOffset === 0 ? (
                <span className="text-[9.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                  今月分
                </span>
              ) : (
                <span className="text-[9.5px] text-slate-400 font-medium">
                  {cycleOffset > 0 ? `${cycleOffset}ヶ月先` : `${Math.abs(cycleOffset)}ヶ月前`}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onPrevCycle}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                title="先月分へ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono truncate px-1">
                {cycleMonthLabel}
              </span>
              <button
                type="button"
                onClick={onNextCycle}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                title="来月分へ"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3画面ナビゲーションリスト */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{item.label}</p>
                  <p
                    className={`text-[9.5px] truncate ${
                      isActive ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* 収支検索ボタン */}
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span>収支を検索</span>
            </span>
            <kbd className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* 下部：ユーザーアカウント ＆ テーマ切り替え */}
      <div className="p-3 md:p-4 border-t border-slate-200/80 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          {user ? (
            <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user.email}
                </p>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-0.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-1 rounded-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>ログイン / 登録</span>
            </button>
          )}

          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
