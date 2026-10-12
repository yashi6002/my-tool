import { GameStatus } from "@/types/database";
import { Gamepad2, KeyRound, PauseCircle, Archive, LucideIcon } from "lucide-react";

export interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  indicatorBg: string;
  icon: LucideIcon;
}

export const GAME_STATUS_CONFIG: Record<GameStatus, StatusConfig> = {
  main: {
    label: "メインプレイ中",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    badgeBorder: "border-emerald-300 dark:border-emerald-700/60",
    indicatorBg: "bg-emerald-500",
    icon: Gamepad2,
  },
  login_only: {
    label: "ログインのみ",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-300 dark:border-amber-700/60",
    indicatorBg: "bg-amber-500",
    icon: KeyRound,
  },
  paused: {
    label: "休止中",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-400",
    badgeBorder: "border-blue-300 dark:border-blue-700/60",
    indicatorBg: "bg-blue-500",
    icon: PauseCircle,
  },
  retired: {
    label: "引退",
    badgeBg: "bg-zinc-500/10 dark:bg-zinc-500/20",
    badgeText: "text-zinc-600 dark:text-zinc-400",
    badgeBorder: "border-zinc-300 dark:border-zinc-700/60",
    indicatorBg: "bg-zinc-400",
    icon: Archive,
  },
};

// 残り日数の計算ヘルパー (例: "あと3日", "今日まで!", "終了")
export function getDaysRemaining(dateString?: string): {
  days: number;
  label: string;
  isUrgent: boolean;
} | null {
  if (!dateString) return null;

  const target = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, label: "期限切れ", isUrgent: false };
  }
  if (diffDays === 0) {
    return { days: 0, label: "本日終了!", isUrgent: true };
  }
  if (diffDays === 1) {
    return { days: 1, label: "明日終了!", isUrgent: true };
  }
  return {
    days: diffDays,
    label: `あと${diffDays}日`,
    isUrgent: diffDays <= 3,
  };
}

