import { CalendarEventItem, ExtraExpense, FixedCost, SavingPlan } from "@/types/finance";

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
  name?: string;
  memo?: string;
}): boolean {
  if (item?.type !== "expense") return false;
  if (item?.category === "food") return true;

  const targetText = `${item?.name || ""} ${item?.memo || ""}`.toLowerCase();
  return FOOD_KEYWORDS.some((kw) => targetText.includes(kw.toLowerCase()));
}

/**
 * 指定の年・月における有効な日付を生成（末日を超える場合はその月の末日に安全クランプ）
 */
export function getSafeDateInMonth(year: number, month: number, desiredDay: number): Date {
  // その月の実際の日数
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.max(1, Math.min(desiredDay, lastDayOfMonth));
  return new Date(year, month, safeDay, 0, 0, 0);
}

/**
 * 指定したサイクル（開始日〜終了日）に該当する日付か判定
 */
export function isDateInCycle(dateStr: string | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    d.setHours(12, 0, 0, 0);

    const s = new Date(start);
    s.setHours(0, 0, 0, 0);

    const e = new Date(end);
    e.setHours(23, 59, 59, 999);

    return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
  } catch {
    return false;
  }
}

/**
 * サイクル基準の日付昇順ソート（日付未定のものは末尾へ）
 */
export function sortByDateAsc<T extends { date?: string; created_at?: string }>(items: T[] = []): T[] {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    if (!a?.date && !b?.date) {
      return (a?.created_at || "") > (b?.created_at || "") ? 1 : -1;
    }
    if (!a?.date) return 1;
    if (!b?.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

/**
 * 給料日サイクルの開始日・終了日・日付一覧・表示タイトルを計算（うるう年・小の月・年またぎ完全対応）
 */
export function calculateCycleRange(payday: number = 25, offset: number = 0) {
  const today = new Date();
  const safePayday = Math.max(1, Math.min(31, payday || 25));

  let baseYear = today.getFullYear();
  let baseMonth = today.getMonth();

  if (today.getDate() < safePayday) {
    baseMonth -= 1;
  }

  baseMonth += offset;

  // サイクル開始日（当月の給料日）
  const start = getSafeDateInMonth(baseYear, baseMonth, safePayday);

  // サイクル終了日（翌月の給料日の前日 23:59:59）
  const nextPayday = getSafeDateInMonth(start.getFullYear(), start.getMonth() + 1, safePayday);
  const end = new Date(nextPayday);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  // サイクルの全日付配列（安全リミット付き）
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= end && dates.length < 35) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // 表示タイトル (例: 2026年11月分 (10/25 〜 11/24))
  const cycleYear = end.getFullYear();
  const cycleMonth = end.getMonth() + 1;
  const label = `${cycleYear}年${cycleMonth}月分`;
  const rangeText = `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;

  return {
    cycleStart: start,
    cycleEnd: end,
    cycleDates: dates,
    cycleYear,
    cycleMonth,
    label,
    rangeText,
  };
}

/**
 * 日付からサイクルオフセットを計算
 */
export function getOffsetForDate(date: Date, payday: number = 25): number {
  const safePayday = Math.max(1, Math.min(31, payday || 25));
  const today = new Date();

  let baseYear = today.getFullYear();
  let baseMonth = today.getMonth();
  if (today.getDate() < safePayday) {
    baseMonth -= 1;
  }

  let targetYear = date.getFullYear();
  let targetMonth = date.getMonth();
  if (date.getDate() < safePayday) {
    targetMonth -= 1;
  }

  return (targetYear - baseYear) * 12 + (targetMonth - baseMonth);
}

/**
 * 登録データの中で最も古い日付を探し、そのデータが属するサイクルの offset を算出する
 * （データが存在しない過去月からの繰越累積バグを防ぐための起点月）
 */
export function getOldestDataOffset(
  payday: number = 25,
  calendarEvents: CalendarEventItem[] = [],
  extraExpenses: ExtraExpense[] = [],
  fixedCosts: FixedCost[] = []
): number {
  let oldestDate: Date | null = null;

  const checkDate = (dStr?: string) => {
    if (!dStr) return;
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      if (!oldestDate || d.getTime() < oldestDate.getTime()) {
        oldestDate = d;
      }
    }
  };

  (calendarEvents || []).forEach((ev) => checkDate(ev?.date));
  (extraExpenses || []).forEach((ee) => checkDate(ee?.date));
  (fixedCosts || []).forEach((fc) => checkDate(fc?.created_at));

  // データが1件もなければ、今月(0)を起点とする
  if (!oldestDate) {
    return 0;
  }

  return getOffsetForDate(oldestDate, payday);
}

/**
 * 選択可能なサイクルオフセットの最小値・最大値を算出
 * - 最大上限: 現在月(0) + 24ヶ月 = 24
 * - 最小下限: 利用開始月(oldestOffset) - 24ヶ月
 */
export function getCycleOffsetBounds(
  payday: number = 25,
  calendarEvents: CalendarEventItem[] = [],
  extraExpenses: ExtraExpense[] = [],
  fixedCosts: FixedCost[] = []
): { minOffset: number; maxOffset: number; oldestOffset: number } {
  const oldestOffset = getOldestDataOffset(payday, calendarEvents, extraExpenses, fixedCosts);
  const minOffset = oldestOffset - 24;
  const maxOffset = 24;
  return { minOffset, maxOffset, oldestOffset };
}

/**
 * 前月の自由費余剰額（繰越金）を安全に自動計算
 * - 起点月（最古データ月）より前の過去月は 0円
 * - 前月の自由費残高がプラスならその額を繰越
 */
export function calculateAutoCarryOver(
  targetOffset: number,
  payday: number,
  salary: number,
  fixedCosts: FixedCost[] = [],
  savingPlans: SavingPlan[] = [],
  extraExpenses: ExtraExpense[] = [],
  calendarEvents: CalendarEventItem[] = []
): number {
  const prevOffset = targetOffset - 1;
  const oldestOffset = getOldestDataOffset(payday, calendarEvents, extraExpenses, fixedCosts);

  // 前月が起点月より前（データが存在しない過去）なら繰越金は 0 円
  if (prevOffset < oldestOffset) {
    return 0;
  }

  // 前月のサイクル範囲を計算
  const prevCycle = calculateCycleRange(payday, prevOffset);
  const pStart = prevCycle.cycleStart;
  const pEnd = prevCycle.cycleEnd;

  // 前月の固定費合計
  const totalFixed = (fixedCosts || []).reduce((s, f) => s + (f?.amount || 0), 0);
  // 前月の貯金合計
  const totalSaving = (savingPlans || []).reduce((s, p) => s + (p?.amount || 0), 0);

  // 前月の臨時出費合計
  const pExtraFromList = (extraExpenses || [])
    .filter((e) => isDateInCycle(e?.date, pStart, pEnd))
    .reduce((s, e) => s + (e?.amount || 0), 0);

  // 前月のカレンダーイベント
  const pCalEvents = (calendarEvents || []).filter((ev) =>
    isDateInCycle(ev?.date, pStart, pEnd) || (ev?.is_recurring && ev?.recurring_day !== undefined)
  );

  // 前月の食費
  const pFoodAmount = pCalEvents
    .filter((ev) => isFoodExpense(ev))
    .reduce((s, e) => s + (e?.amount || 0), 0);

  // 前月のカレンダー臨時出費
  const pExtraFromCal = pCalEvents
    .filter((ev) => ev?.type === "expense" && !isFoodExpense(ev))
    .reduce((s, e) => s + (e?.amount || 0), 0);

  // 前月の臨時収入
  const pExtraIncome = pCalEvents
    .filter((ev) => ev?.type === "income")
    .reduce((s, e) => s + (e?.amount || 0), 0);

  const prevInflow = (salary || 0) + pExtraIncome;
  const prevExpenses = totalFixed + totalSaving + pExtraFromList + pExtraFromCal + pFoodAmount;

  const surplus = prevInflow - prevExpenses;
  // 余剰金がプラスの場合のみ繰り越し（マイナスは0に留める、またはそのまま繰り越し）
  return Math.max(0, surplus);
}
