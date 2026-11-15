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
  PanelLeftClose,
  PanelLeftOpen,
  X,
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
  canPrevCycle?: boolean;
  canNextCycle?: boolean;
  // 開閉ステート
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
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
  canPrevCycle = true,
  canNextCycle = true,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: Props) {
  const navItems = [
    {
      id: "dashboard" as FinanceTab,
      label: "ダッシュボード / 分析",
      desc: "自由費・円グラフ・各種内訳",
      icon: LayoutDashboard,
    },
    {
      id: "calendar" as FinanceTab,
      label: "カレンダー / 収支管理",
      desc: "給料日カレンダー・日別収支",
      icon: CalendarIcon,
    },
    {
      id: "settings" as FinanceTab,
      label: "設定",
      desc: "カラー・バックアップ・復元",
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: FinanceTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* ── スマホ用バックドロップ（オーバーレイ） ── */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* ── サイドバー本体（独立スクロール ＆ オーバースクロール遮断） ── */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-30 h-full md:h-screen overflow-y-auto overscroll-contain bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/80 dark:border-white/10 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed ? "md:w-18" : "md:w-64"} w-64`}
      >
        {/* 上部：ブランドロゴ ＆ 開閉トグル ＆ ナビゲーション */}
        <div>
          {/* ブランドロゴ ＆ 開閉トグルボタン */}
          <div className="p-3.5 md:p-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10">
            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "md:hidden" : ""}`}>
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md ring-1 ring-black/5 dark:ring-white/20 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white truncate">
                    丸わかり金銭管理ツール
                  </h1>
                  <span className="text-[8.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded shrink-0">
                    v1.0
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 font-mono truncate">
                  給料日サイクル型 資金管理
                </p>
              </div>
            </div>

            {/* PC開閉トグルボタン */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto"
              title={isCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* スマホ用閉じるボタン */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 選択中の月（サイクル）セレクター（非折りたたみ時のみ表示） */}
          {cycleMonthLabel && !isCollapsed && (
            <div className="p-2.5 mx-3 my-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-500 dark:text-slate-400">表示対象:</span>
                {cycleOffset === 0 ? (
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                    今月分
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium">
                    {cycleOffset > 0 ? `${cycleOffset}ヶ月先` : `${Math.abs(cycleOffset)}ヶ月前`}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onPrevCycle}
                  disabled={!canPrevCycle}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="先月分へ"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 font-mono truncate px-1">
                  {cycleMonthLabel}
                </span>
                <button
                  type="button"
                  onClick={onNextCycle}
                  disabled={!canNextCycle}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="来月分へ"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 3画面ナビゲーションリスト */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group relative ${
                    isActive
                      ? "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium"
                  } ${isCollapsed ? "md:justify-center md:px-2" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"}`} />
                  <div className={`flex-1 min-w-0 ${isCollapsed ? "md:hidden" : ""}`}>
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
          <div className="px-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onOpenSearch();
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group ${
                isCollapsed ? "md:justify-center md:px-2" : ""
              }`}
              title="収支を検索 (Ctrl+K)"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                <span className={isCollapsed ? "md:hidden" : ""}>収支を検索</span>
              </span>
              <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 ${
                isCollapsed ? "md:hidden" : ""
              }`}>
                Ctrl+K
              </kbd>
            </button>
          </div>
        </div>

        {/* 下部：ユーザーアカウント ＆ テーマ切り替え */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
          <div className={`flex items-center justify-between ${isCollapsed ? "md:flex-col md:gap-2" : ""}`}>
            {user ? (
              <div className={`flex items-center gap-2 flex-1 min-w-0 mr-1 ${isCollapsed ? "md:mr-0 md:justify-center" : ""}`}>
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className={`flex-1 min-w-0 ${isCollapsed ? "md:hidden" : ""}`}>
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
                onClick={() => {
                  onOpenAuthModal();
                  onCloseMobile();
                }}
                className={`flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-1 rounded-lg ${
                  isCollapsed ? "md:justify-center" : ""
                }`}
                title="ログイン / 登録"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span className={isCollapsed ? "md:hidden" : ""}>ログイン</span>
              </button>
            )}

            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
