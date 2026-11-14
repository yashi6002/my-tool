"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FixedCost, SavingPlan, ExtraExpense, CategoryColors, DEFAULT_CATEGORY_COLORS } from "@/types/finance";
import { TrendingDown, PiggyBank, Zap, Wallet, Utensils, ArrowUpRight, PlusCircle, Check } from "lucide-react";

interface Props {
  salary: number;
  carryOver?: number;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
  foodAmount?: number;
  extraIncome?: number;
  categoryColors?: CategoryColors;
  onUpdateCarryOver?: (amount: number) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

export function BudgetPieChart({
  salary,
  carryOver = 0,
  fixedCosts,
  savingPlans,
  extraExpenses,
  foodAmount = 0,
  extraIncome = 0,
  categoryColors = DEFAULT_CATEGORY_COLORS,
  onUpdateCarryOver,
}: Props) {
  const [isEditingCarryOver, setIsEditingCarryOver] = useState(false);
  const [carryOverInput, setCarryOverInput] = useState(String(carryOver));

  const totalFixed  = useMemo(() => fixedCosts.reduce((s, c) => s + c.amount, 0), [fixedCosts]);
  const totalSaving = useMemo(() => savingPlans.reduce((s, p) => s + p.amount, 0), [savingPlans]);
  const totalExtra  = useMemo(() => extraExpenses.reduce((s, e) => s + e.amount, 0), [extraExpenses]);
  const totalFood   = foodAmount;

  // 総支出（固定費 + 貯金 + 臨時出費 + 食費）
  const totalExpenses = totalFixed + totalSaving + totalExtra + totalFood;

  // 資金総枠（給与 + 繰越金 + 臨時収入）
  const totalInflow = salary + carryOver + extraIncome;

  // 自由に使えるお金（フリー額）
  const freeAmount = Math.max(0, totalInflow - totalExpenses);
  const overBudget = totalInflow > 0 && freeAmount === 0 && totalExpenses > totalInflow;

  const data = [
    { name: "固定費・引落", value: totalFixed,  color: categoryColors.fixed  },
    { name: "貯金・投資",   value: totalSaving, color: categoryColors.saving },
    { name: "食費実績",     value: totalFood,   color: categoryColors.food || "#f59e0b" },
    { name: "臨時出費",     value: totalExtra,  color: categoryColors.extra  },
    { name: "自由に使える", value: freeAmount,  color: categoryColors.free   },
  ].filter(d => d.value > 0);

  const summaryCards = [
    { label: "固定費・引落", amount: totalFixed,  icon: TrendingDown, hexColor: categoryColors.fixed },
    { label: "貯金・投資",   amount: totalSaving, icon: PiggyBank,    hexColor: categoryColors.saving },
    { label: "食費",         amount: totalFood,   icon: Utensils,     hexColor: categoryColors.food || "#f59e0b" },
    { label: "臨時出費",     amount: totalExtra,  icon: Zap,          hexColor: categoryColors.extra },
  ];

  const handleSaveCarryOver = () => {
    const val = parseInt(carryOverInput.replace(/,/g, ""), 10);
    if (!isNaN(val) && onUpdateCarryOver) {
      onUpdateCarryOver(Math.max(0, val));
    }
    setIsEditingCarryOver(false);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 shadow-sm dark:shadow-xl space-y-5">
      {/* ── 最上部：最重要情報「自由に使っていいお金（フリー額）」のヒーロー強調表示 ── */}
      <div className={`relative overflow-hidden rounded-2xl p-5 md:p-6 text-center border-2 transition-all ${
        overBudget
          ? "border-red-500/70 bg-gradient-to-b from-red-500/10 dark:from-red-500/15 via-red-500/5 to-transparent shadow-red-500/10 shadow-lg"
          : "border-emerald-500/70 bg-gradient-to-b from-emerald-500/10 dark:from-emerald-500/15 via-emerald-500/5 to-transparent shadow-emerald-500/10 shadow-lg"
      }`}>
        <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300 mb-1">
          <Wallet className={`w-4 h-4 ${overBudget ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`} />
          <span>現在 自由に使っていいお金（フリー額）</span>
        </div>

        <p className={`text-3xl md:text-5xl font-black tracking-tight ${
          overBudget ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
        }`}>
          {overBudget ? "予算オーバー!" : fmt(freeAmount)}
        </p>

        {/* 繰越金・臨時収入・残高の補足情報 ＆ 繰越金入力欄 */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 text-xs">
          {/* 先月からの繰越金入力 */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
            <span className="text-slate-500 dark:text-slate-400 font-medium">先月からの繰越金:</span>
            {isEditingCarryOver ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={carryOverInput}
                  onChange={(e) => setCarryOverInput(e.target.value)}
                  className="w-20 px-1 py-0.5 text-xs bg-white dark:bg-slate-900 border border-emerald-500 rounded font-bold font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCarryOver}
                  className="p-1 text-emerald-600 hover:text-emerald-500 font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCarryOverInput(String(carryOver));
                  setIsEditingCarryOver(true);
                }}
                className="font-bold font-mono text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline flex items-center gap-0.5"
                title="クリックして繰越金を変更"
              >
                <span>+{fmt(carryOver)}</span>
                <span className="text-[10px] text-slate-400 ml-0.5">✎</span>
              </button>
            )}
          </div>

          {/* 臨時収入がある場合の表示 */}
          {extraIncome > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 font-semibold font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>臨時収入 +{fmt(extraIncome)}</span>
            </div>
          )}

          {overBudget && (
            <span className="text-xs text-red-500 dark:text-red-400 font-bold">
              {fmt(Math.abs(totalInflow - totalExpenses))} 超過しています
            </span>
          )}
        </div>
      </div>

      {salary === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">
          設定から給与額を入力してください
        </p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6 pt-1">
          {/* 円グラフ（コンパクト配置） */}
          <div className="relative w-48 h-48 sm:w-52 sm:h-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={86}
                  paddingAngle={2.5}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel as unknown as boolean}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt(typeof v === "number" ? v : 0)}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#f8fafc",
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 右側：今サイクル概要＆内訳サマリー */}
          <div className="flex-1 flex flex-col gap-3.5 w-full">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                当サイクルの資金配分内訳
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                給与: <strong className="text-slate-900 dark:text-white font-mono">{fmt(salary)}</strong>
                {carryOver > 0 && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono ml-1"> (+繰越 {fmt(carryOver)})</span>}
              </span>
            </div>

            {/* 内訳カード群 (4グリッド) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {summaryCards.map(({ label, amount, icon: Icon, hexColor }) => (
                <div
                  key={label}
                  className="rounded-xl p-2.5 text-center border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/40"
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: hexColor }} />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">
                    {fmt(amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* 全体出費比率バー */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>当サイクル予定支出計: <strong className="text-slate-800 dark:text-slate-200 font-mono">{fmt(totalExpenses)}</strong></span>
                <span>支出割合: <strong className="text-slate-800 dark:text-slate-200">{totalInflow > 0 ? `${Math.round((totalExpenses / totalInflow) * 100)}%` : "0%"}</strong></span>
              </div>
              <div className="h-2.5 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden flex border border-slate-200 dark:border-white/5">
                <div style={{ width: `${Math.min(100, totalInflow > 0 ? (totalFixed / totalInflow) * 100 : 0)}%`, backgroundColor: categoryColors.fixed }} />
                <div style={{ width: `${Math.min(100, totalInflow > 0 ? (totalSaving / totalInflow) * 100 : 0)}%`, backgroundColor: categoryColors.saving }} />
                <div style={{ width: `${Math.min(100, totalInflow > 0 ? (totalFood / totalInflow) * 100 : 0)}%`, backgroundColor: categoryColors.food || "#f59e0b" }} />
                <div style={{ width: `${Math.min(100, totalInflow > 0 ? (totalExtra / totalInflow) * 100 : 0)}%`, backgroundColor: categoryColors.extra }} />
                <div style={{ width: `${Math.min(100, totalInflow > 0 ? (freeAmount / totalInflow) * 100 : 0)}%`, backgroundColor: categoryColors.free }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
