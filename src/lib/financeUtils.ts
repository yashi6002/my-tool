import { CalendarEventItem, ExtraExpense, PaydayCycle } from "@/types/finance";

// 食費を自動判定するためのキーワードリスト
const FOOD_KEYWORDS = [
  "食費",
  "スーパー",
  "コンビニ",
  "ランチ",
  "ディナー",
  "朝食",
  "昼食",
  "夕食",
  "食材",
  "弁当",
  "外食",
  "カフェ",
  "飲み会",
  "食料品",
  "ご飯",
  "ファストフード",
  "ベーカリー",
  "パン",
  "スーパーマーケット",
  "イオン",
  "業務スーパー",
  "ライフ",
  "まいばすけっと",
  "セブン",
  "ローソン",
  "ファミマ",
];

/**
 * カレンダーイベントが出金かつ食費であるかを自動判定
 */
export function isFoodExpense(item: {
  type?: string;
  category?: string;
  name: string;
  memo?: string;
}): boolean {
  if (item.type !== "expense") return false;
  if (item.category === "food") return true;

  const targetText = `${item.name} ${item.memo || ""}`.toLowerCase();
  return FOOD_KEYWORDS.some((kw) => targetText.includes(kw.toLowerCase()));
}

/**
 * 指定したサイクル（開始日〜終了日）に該当する日付か判定
 */
export function isDateInCycle(dateStr: string | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(12, 0, 0, 0);

  const s = new Date(start);
  s.setHours(0, 0, 0, 0);

  const e = new Date(end);
  e.setHours(23, 59, 59, 999);

  return d >= s && d <= e;
}

/**
 * サイクル基準の日付昇順ソート
 * 日付未定のものは末尾へ
 */
export function sortByDateAsc<T extends { date?: string; created_at?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.date && !b.date) {
      return (a.created_at || "") > (b.created_at || "") ? 1 : -1;
    }
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

/**
 * 給料日サイクルの開始日・終了日・タイトルを計算
 */
export function calculateCycleRange(payday: number, offset: number = 0) {
  const today = new Date();
  const safePayday = Math.max(1, Math.min(31, payday || 25));

  let baseYear = today.getFullYear();
  let baseMonth = today.getMonth();

  if (today.getDate() < safePayday) {
    baseMonth -= 1;
  }

  baseMonth += offset;

  // 開始日: 当月(または前月)の給料日
  const start = new Date(baseYear, baseMonth, safePayday, 0, 0, 0);

  // 終了日: 翌月の給料日の前日 23:59:59
  const end = new Date(start.getFullYear(), start.getMonth() + 1, safePayday - 1, 23, 59, 59);

  // 表示タイトル (例: 2026年11月分 (10/25 〜 11/24))
  // サイクルの代表月は終了日の月（給料日直後〜翌月給料日前日）
  const cycleYear = end.getFullYear();
  const cycleMonth = end.getMonth() + 1;
  const label = `${cycleYear}年${cycleMonth}月分`;
  const rangeText = `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;

  return {
    cycleStart: start,
    cycleEnd: end,
    cycleYear,
    cycleMonth,
    label,
    rangeText,
  };
}
