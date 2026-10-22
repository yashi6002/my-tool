// =====================================================
// 給料日サイクル型 資金管理ダッシュボード — 型定義
// =====================================================

/** 固定費カテゴリ */
export type FixedCostCategory =
  | "rent"        // 家賃
  | "utilities"   // 光熱費
  | "subscription"// サブスク
  | "insurance"   // 保険
  | "loan"        // ローン
  | "other";      // その他

/** 固定費・引き落とし予定 */
export interface FixedCost {
  id: string;
  name: string;           // 項目名（例: 家賃）
  amount: number;         // 金額（円）
  category: FixedCostCategory;
  due_day?: number;       // 引き落とし日（1〜31）
  memo?: string;
  created_at: string;
}

/** 貯金・投資 */
export interface SavingPlan {
  id: string;
  name: string;           // 項目名（例: NISA、先取り貯金）
  amount: number;         // 金額（円）
  memo?: string;
  created_at: string;
}

/** 臨時出費カード */
export interface ExtraExpense {
  id: string;
  name: string;           // 項目名（例: 車検代）
  amount: number;         // 予定金額
  date?: string;          // 予定日 YYYY-MM-DD
  image_url?: string;     // 添付画像 URL
  memo?: string;
  created_at: string;
}

/** 給料日サイクル設定 */
export interface PaydayCycle {
  salary: number;         // 今月の給与支給額
  payday: number;         // 給料日（毎月何日）
}

/** カレンダー収支イベント（入金・出金） */
export type TransactionType = "income" | "expense";

export interface CalendarEventItem {
  id: string;
  name: string;           // 項目名（例: 給与、家賃、食費、ボーナス）
  amount: number;         // 金額（円）
  type: TransactionType;  // "income" (入金 +) または "expense" (出金 -)
  date: string;           // 日付 YYYY-MM-DD
  color: string;          // テーマカラー（HEX または プリセット名）
  is_recurring?: boolean; // 毎月繰り返し発生するかどうか
  recurring_day?: number; // 毎月繰り返しの場合の日（1〜31）
  memo?: string;          // メモ
  source?: "fixed" | "extra" | "custom"; // 出所（固定費連携/臨時出費連携/カスタム）
  source_id?: string;     // 紐づく固定費/臨時出費のID
  created_at: string;
}

// プリセットカラーリスト
export const PRESET_COLORS = [
  { id: "emerald", label: "エメラルド（入金など）", hex: "#10b981", bg: "bg-emerald-500/15 dark:bg-emerald-500/25", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
  { id: "rose",    label: "レッド/ローズ（出金など）", hex: "#f43f5e", bg: "bg-rose-500/15 dark:bg-rose-500/25", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
  { id: "blue",    label: "ブルー（固定費など）", hex: "#3b82f6", bg: "bg-blue-500/15 dark:bg-blue-500/25", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
  { id: "amber",   label: "オレンジ/アンバー（臨時出費など）", hex: "#f59e0b", bg: "bg-amber-500/15 dark:bg-amber-500/25", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  { id: "purple",  label: "パープル（貯金・投資など）", hex: "#a855f7", bg: "bg-purple-500/15 dark:bg-purple-500/25", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
  { id: "cyan",    label: "シアン（娯楽・自由費など）", hex: "#06b6d4", bg: "bg-cyan-500/15 dark:bg-cyan-500/25", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700" },
  { id: "zinc",    label: "グレー（その他）", hex: "#71717a", bg: "bg-zinc-500/15 dark:bg-zinc-500/25", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-300 dark:border-zinc-700" },
] as const;

// ローカルストレージキー
export const LS_KEY_CYCLE    = "ft_payday_cycle";
export const LS_KEY_FIXED    = "ft_fixed_costs";
export const LS_KEY_SAVINGS  = "ft_saving_plans";
export const LS_KEY_EXTRAS   = "ft_extra_expenses";
export const LS_KEY_EVENTS   = "ft_calendar_events";

