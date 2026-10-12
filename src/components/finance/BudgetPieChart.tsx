"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FixedCost, SavingPlan, ExtraExpense } from "@/types/finance";
import { TrendingDown, PiggyBank, Zap, Wallet } from "lucide-react";

interface Props {
  salary: number;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  extraExpenses: ExtraExpense[];
}

const CHART_COLORS = {
  fixed:  "#f87171", // red-400
  saving: "#60a5fa", // blue-400
  extra:  "#fb923c", // orange-400
  free:   "#34d399", // emerald-400
};

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

export function BudgetPieChart({ salary, fixedCosts, savingPlans, extraExpenses }: Props) {
  const totalFixed  = useMemo(() => fixedCosts.reduce((s, c) => s + c.amount, 0), [fixedCosts]);
  const totalSaving = useMemo(() => savingPlans.reduce((s, p) => s + p.amount, 0), [savingPlans]);
  const totalExtra  = useMemo(() => extraExpenses.reduce((s, e) => s + e.amount, 0), [extraExpenses]);
  const freeAmount  = Math.max(0, salary - totalFixed - totalSaving - totalExtra);

  const data = [
    { name: "固定費・引落", value: totalFixed,  color: CHART_COLORS.fixed  },
    { name: "貯金・投資",   value: totalSaving, color: CHART_COLORS.saving },
    { name: "臨時出費",     value: totalExtra,  color: CHART_COLORS.extra  },
    { name: "自由に使える", value: freeAmount,  color: CHART_COLORS.free   },
  ].filter(d => d.value > 0);

  const overBudget = salary > 0 && freeAmount === 0 && (totalFixed + totalSaving + totalExtra) > salary;

  const summaryCards = [
    { label: "固定費・引落", amount: totalFixed,  icon: TrendingDown, color: "text-red-400",     bg: "bg-red-50 dark:bg-red-950/40" },
    { label: "貯金・投資",   amount: totalSaving, icon: PiggyBank,    color: "text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40" },
    { label: "臨時出費",     amount: totalExtra,  icon: Zap,          color: "text-orange-400",  bg: "bg-orange-50 dark:bg-orange-950/40" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <h2 className="font-bold text-lg mb-4 text-zinc-800 dark:text-zinc-100">今月の資金配分</h2>

      {salary === 0 ? (
        <p className="text-zinc-400 text-sm text-center py-8">
          右上の「設定」から給与額を入力してください
        </p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* 円グラフ */}
          <div className="relative w-52 h-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
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
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 右側：自由残高 & 内訳 */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            {/* 自由に使える額（大きく強調表示） */}
            <div className={`rounded-xl p-4 text-center border-2 ${
              overBudget
                ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                : "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
            }`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center justify-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                現在 自由に使っていい残高
              </p>
              <p className={`text-3xl font-black tracking-tight ${
                overBudget ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {overBudget ? "予算オーバー!" : fmt(freeAmount)}
              </p>
              {overBudget && (
                <p className="text-xs text-red-400 mt-1">
                  {fmt(Math.abs(freeAmount))} 超過しています
                </p>
              )}
            </div>

            {/* 内訳サマリー */}
            <div className="grid grid-cols-3 gap-2">
              {summaryCards.map(({ label, amount, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    {fmt(amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* 給与総額 */}
            <p className="text-xs text-zinc-400 text-right">
              給与総額: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{fmt(salary)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
