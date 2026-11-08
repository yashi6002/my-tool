import {
  PaydayCycle,
  FixedCost,
  SavingPlan,
  ExtraExpense,
  CalendarEventItem,
  CategoryColors,
  DEFAULT_CATEGORY_COLORS,
} from "@/types/finance";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function generateRealisticDemoData(): {
  cycle: PaydayCycle;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
  calendarEvents: CalendarEventItem[];
  categoryColors: CategoryColors;
} {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based

  // 1. 給与と給料日設定 (毎月25日、手取り285,000円)
  const cycle: PaydayCycle = {
    salary: 285000,
    payday: 25,
  };

  // 2. 毎月の固定費
  const fixedCosts: FixedCost[] = [
    {
      id: uid(),
      name: "家賃（共益費込）",
      amount: 78000,
      category: "rent",
      due_day: 27,
      color: "#f87171",
      memo: "口座振替",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "電気・ガス・水道",
      amount: 14500,
      category: "utilities",
      due_day: 12,
      color: "#f87171",
      memo: "季節により変動あり",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "スマホ＆光回線",
      amount: 8200,
      category: "subscription",
      due_day: 15,
      color: "#f87171",
      memo: "クレカ引き落とし",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "フィットネスジム",
      amount: 8800,
      category: "subscription",
      due_day: 20,
      color: "#f87171",
      memo: "月会費",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "動画＆音楽サブスク",
      amount: 2480,
      category: "subscription",
      due_day: 5,
      color: "#f87171",
      memo: "Netflix + Spotify",
      created_at: new Date().toISOString(),
    },
  ];

  // 3. 貯金・投資計画
  const savingPlans: SavingPlan[] = [
    {
      id: uid(),
      name: "つみたて投資枠 (NISA)",
      amount: 50000,
      color: "#60a5fa",
      memo: "毎月自動積立",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "旅行・非常用貯金",
      amount: 20000,
      color: "#60a5fa",
      memo: "別口座へ先取り",
      created_at: new Date().toISOString(),
    },
  ];

  // 4. 今サイクルの臨時出費予定
  const extraExpenses: ExtraExpense[] = [
    {
      id: uid(),
      name: "友人結婚式のご祝儀＆二次会",
      amount: 35000,
      date: fmtDate(new Date(year, month, 18)),
      color: "#fb923c",
      memo: "お祝い金3万円 + 2次会会費",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "冬物アウター新調",
      amount: 18000,
      date: fmtDate(new Date(year, month, 28)),
      color: "#fb923c",
      memo: "セール期間中に購入",
      created_at: new Date().toISOString(),
    },
  ];

  // 5. カレンダーの日々イベント（日常出費や副収入など）
  const calendarEvents: CalendarEventItem[] = [
    {
      id: uid(),
      name: "週末まとめ買い（スーパー）",
      amount: 6800,
      type: "expense",
      date: fmtDate(new Date(year, month, today.getDate() > 3 ? today.getDate() - 3 : 2)),
      color: "#06b6d4",
      memo: "1週間分の食材",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "同僚との飲み会",
      amount: 5000,
      type: "expense",
      date: fmtDate(new Date(year, month, today.getDate() > 1 ? today.getDate() - 1 : 4)),
      color: "#f43f5e",
      memo: "打ち上げ",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "不用品フリマ売上",
      amount: 8500,
      type: "income",
      date: fmtDate(new Date(year, month, today.getDate() + 2 <= 28 ? today.getDate() + 2 : 10)),
      color: "#10b981",
      memo: "本・服の売上金入金",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "日用品・消耗品まとめ買い",
      amount: 4200,
      type: "expense",
      date: fmtDate(new Date(year, month, today.getDate() + 5 <= 28 ? today.getDate() + 5 : 14)),
      color: "#06b6d4",
      memo: "洗剤、トイレットペーパーなど",
      created_at: new Date().toISOString(),
    },
  ];

  return {
    cycle,
    fixedCosts,
    savingPlans,
    extraExpenses,
    calendarEvents,
    categoryColors: DEFAULT_CATEGORY_COLORS,
  };
}
