import { FolderColor, FolderIconType } from "@/types/database";
import {
  Folder as FolderDefaultIcon,
  Briefcase,
  Mail,
  MessageSquare,
  BookOpen,
  Code,
  Lightbulb,
  Heart,
  Star,
  Calendar,
  LucideIcon,
} from "lucide-react";

export interface ColorDefinition {
  label: string;
  bgLight: string;
  bgSolid: string;
  text: string;
  border: string;
  ring: string;
  badge: string;
}

export const COLOR_CONFIGS: Record<FolderColor, ColorDefinition> = {
  blue: {
    label: "ブルー",
    bgLight: "bg-blue-50 dark:bg-blue-950/50",
    bgSolid: "bg-blue-600",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    ring: "focus:ring-blue-500",
    badge: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
  },
  emerald: {
    label: "グリーン",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/50",
    bgSolid: "bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "focus:ring-emerald-500",
    badge: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
  },
  purple: {
    label: "パープル",
    bgLight: "bg-purple-50 dark:bg-purple-950/50",
    bgSolid: "bg-purple-600",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    ring: "focus:ring-purple-500",
    badge: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
  },
  amber: {
    label: "アンバー",
    bgLight: "bg-amber-50 dark:bg-amber-950/50",
    bgSolid: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    ring: "focus:ring-amber-500",
    badge: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
  },
  rose: {
    label: "ローズ",
    bgLight: "bg-rose-50 dark:bg-rose-950/50",
    bgSolid: "bg-rose-600",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    ring: "focus:ring-rose-500",
    badge: "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
  },
  indigo: {
    label: "インディゴ",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/50",
    bgSolid: "bg-indigo-600",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    ring: "focus:ring-indigo-500",
    badge: "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300",
  },
  cyan: {
    label: "シアン",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/50",
    bgSolid: "bg-cyan-600",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    ring: "focus:ring-cyan-500",
    badge: "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300",
  },
  orange: {
    label: "オレンジ",
    bgLight: "bg-orange-50 dark:bg-orange-950/50",
    bgSolid: "bg-orange-600",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    ring: "focus:ring-orange-500",
    badge: "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300",
  },
};

export const ICON_MAP: Record<FolderIconType, LucideIcon> = {
  folder: FolderDefaultIcon,
  briefcase: Briefcase,
  mail: Mail,
  "message-square": MessageSquare,
  book: BookOpen,
  code: Code,
  lightbulb: Lightbulb,
  heart: Heart,
  star: Star,
  calendar: Calendar,
};

export const AVAILABLE_COLORS: FolderColor[] = [
  "blue",
  "emerald",
  "purple",
  "amber",
  "rose",
  "indigo",
  "cyan",
  "orange",
];

export const AVAILABLE_ICONS: FolderIconType[] = [
  "folder",
  "briefcase",
  "mail",
  "message-square",
  "book",
  "code",
  "lightbulb",
  "heart",
  "star",
  "calendar",
];

