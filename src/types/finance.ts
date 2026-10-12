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

// ローカルストレージキー
export const LS_KEY_CYCLE    = "ft_payday_cycle";
export const LS_KEY_FIXED    = "ft_fixed_costs";
export const LS_KEY_SAVINGS  = "ft_saving_plans";
export const LS_KEY_EXTRAS   = "ft_extra_expenses";

