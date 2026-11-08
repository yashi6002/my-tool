"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FixedCost, SavingPlan, ExtraExpense, CategoryColors, DEFAULT_CATEGORY_COLORS } from "@/types/finance";
import { TrendingDown, PiggyBank, Zap, Wallet } from "lucide-react";

interface Props {
  salary: number;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
  categoryColors?: CategoryColors;
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
  name: string;
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomLabelProps) {
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

export function BudgetPieChart({ salary, fixedCosts, savingPlans, extraExpenses, categoryColors = DEFAULT_CATEGORY_COLORS }: Props) {
  const totalFixed  = useMemo(() => fixedCosts.reduce((s, c) => s + c.amount, 0), [fixedCosts]);
  const totalSaving = useMemo(() => savingPlans.reduce((s, p) => s + p.amount, 0), [savingPlans]);
  const totalExtra  = useMemo(() => extraExpenses.reduce((s, e) => s + e.amount, 0), [extraExpenses]);
  const totalExpenses = totalFixed + totalSaving + totalExtra;
  const freeAmount  = Math.max(0, salary - totalExpenses);

  const data = [
    { name: "固定費・引落", value: totalFixed,  color: categoryColors.fixed  },
    { name: "貯金・投資",   value: totalSaving, color: categoryColors.saving },
    { name: "臨時出費",     value: totalExtra,  color: categoryColors.extra  },
    { name: "自由に使える", value: freeAmount,  color: categoryColors.free   },
  ].filter(d => d.value > 0);

  const overBudget = salary > 0 && freeAmount === 0 && totalExpenses > salary;

  const summaryCards = [
    { label: "固定費・引落", amount: totalFixed,  icon: TrendingDown, hexColor: categoryColors.fixed },
    { label: "貯金・投資",   amount: totalSaving, icon: PiggyBank,    hexColor: categoryColors.saving },
    { label: "臨時出費",     amount: totalExtra,  icon: Zap,          hexColor: categoryColors.extra },
  ];

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
        {overBudget ? (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">
            {fmt(Math.abs(salary - totalExpenses))} 超過しています
          </p>
        ) : (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            今サイクルで他の出費や貯金を差し引いた、今後自由に使える予測残高です
          </p>
        )}
      </div>

      {salary === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">
          下部の「設定」から給与額を入力してください
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
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={3}
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
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                資金配分内訳
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                給与総額: <span className="font-bold text-slate-900 dark:text-white">{fmt(salary)}</span>
              </span>
            </div>

            {/* 内訳カード群 */}
            <div className="grid grid-cols-3 gap-2.5">
              {summaryCards.map(({ label, amount, icon: Icon, hexColor }) => (
                <div
                  key={label}
                  className="rounded-xl p-2.5 sm:p-3 text-center border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/40"
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: hexColor }} />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {fmt(amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* 全体出費比率バー */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>予定支出合計: <strong className="text-slate-800 dark:text-slate-200">{fmt(totalExpenses)}</strong></span>
                <span>支出割合: <strong className="text-slate-800 dark:text-slate-200">{salary > 0 ? `${Math.round((totalExpenses / salary) * 100)}%` : "0%"}</strong></span>
              </div>
              <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden flex border border-slate-200 dark:border-white/5">
                <div style={{ width: `${Math.min(100, salary > 0 ? (totalFixed / salary) * 100 : 0)}%`, backgroundColor: categoryColors.fixed }} />
                <div style={{ width: `${Math.min(100, salary > 0 ? (totalSaving / salary) * 100 : 0)}%`, backgroundColor: categoryColors.saving }} />
                <div style={{ width: `${Math.min(100, salary > 0 ? (totalExtra / salary) * 100 : 0)}%`, backgroundColor: categoryColors.extra }} />
                <div style={{ width: `${Math.min(100, salary > 0 ? (freeAmount / salary) * 100 : 0)}%`, backgroundColor: categoryColors.free }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
