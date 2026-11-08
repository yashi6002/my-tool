"use client";

import { useState } from "react";
import {
  PaydayCycle,
  FixedCost,
  SavingPlan,
  ExtraExpense,
} from "@/types/finance";
import {
  FlaskConical,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  AlertCircle,
  HelpCircle,
  Sliders,
} from "lucide-react";

interface Props {
  isActive: boolean;
  onClose: () => void;
  // 本番データ
  baseCycle: PaydayCycle;
  baseFixedCosts: FixedCost[];
  baseSavingPlans: SavingPlan[];
  baseExtraExpenses: ExtraExpense[];
  // シミュレーションデータ
  simCycle: PaydayCycle;
  simFixedCosts: FixedCost[];
  simSavingPlans: SavingPlan[];
  simExtraExpenses: ExtraExpense[];
  // 更新ハンドラー
  onUpdateSimCycle: (cycle: PaydayCycle) => void;
  onToggleSimFixedCost: (id: string) => void;
  onUpdateSimFixedAmount: (id: string, amount: number) => void;
  onAddSimExtraExpense: (name: string, amount: number) => void;
  onDeleteSimExtraExpense: (id: string) => void;
  onApplyToProduction: () => void;
  onResetSimulation: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function SimulationBar({
  isActive,
  onClose,
  baseCycle,
  baseFixedCosts,
  baseSavingPlans,
  baseExtraExpenses,
  simCycle,
  simFixedCosts,
  simSavingPlans,
  simExtraExpenses,
  onUpdateSimCycle,
  onToggleSimFixedCost,
  onUpdateSimFixedAmount,
  onAddSimExtraExpense,
  onDeleteSimExtraExpense,
  onApplyToProduction,
  onResetSimulation,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSimName, setNewSimName] = useState("");
  const [newSimAmount, setNewSimAmount] = useState("");

  if (!isActive) return null;

  // 本番フリー額の計算
  const baseTotalFixed = baseFixedCosts.reduce((s, f) => s + f.amount, 0);
  const baseTotalSaving = baseSavingPlans.reduce((s, sp) => s + sp.amount, 0);
  const baseTotalExtra = baseExtraExpenses.reduce((s, e) => s + e.amount, 0);
  const baseFree = baseCycle.salary - (baseTotalFixed + baseTotalSaving + baseTotalExtra);

  // 試算フリー額の計算
  const simTotalFixed = simFixedCosts.reduce((s, f) => s + f.amount, 0);
  const simTotalSaving = simSavingPlans.reduce((s, sp) => s + sp.amount, 0);
  const simTotalExtra = simExtraExpenses.reduce((s, e) => s + e.amount, 0);
  const simFree = simCycle.salary - (simTotalFixed + simTotalSaving + simTotalExtra);

  const diffFree = simFree - baseFree;

  const handleAddVirtualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(newSimAmount.replace(/,/g, ""), 10);
    if (!newSimName.trim() || isNaN(amt) || amt <= 0) return;
    onAddSimExtraExpense(newSimName.trim(), amt);
    setNewSimName("");
    setNewSimAmount("");
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-600/15 border-b-2 border-amber-500 backdrop-blur-lg shadow-lg transition-all animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        {/* メインステータスバー */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200 tracking-wide uppercase">
                    資金シミュレーション実行中
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    サンドボックスモード
                  </span>
                </div>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-300/70 hidden sm:block">
                  本番データは保護されています。給与や出費を変更して自由額への影響を試算できます。
                </p>
              </div>
            </div>
          </div>

          {/* 差額とアクションボタン群 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 試算フリー額と差額バッジ */}
            <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 border border-amber-500/40 rounded-xl px-3 py-1 shadow-xs">
              <div className="text-right">
                <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  試算フリー額
                </span>
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                  {fmt(simFree)}
                </span>
              </div>
              <div
                className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  diffFree > 0
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : diffFree < 0
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {diffFree > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : diffFree < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : null}
                <span>
                  {diffFree > 0 ? "+" : ""}
                  {fmt(diffFree)}
                </span>
              </div>
            </div>

            {/* パネル展開/折りたたみ */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-white/60 dark:bg-slate-800/60 text-amber-900 dark:text-amber-200 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isExpanded ? "閉じる" : "調整"}</span>
            </button>

            {/* 本番データへ反映 */}
            <button
              onClick={onApplyToProduction}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 px-3 py-1.5 rounded-lg shadow-md transition-all hover:scale-105"
              title="このシミュレーション結果を本番データとして保存します"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>本番へ反映</span>
            </button>

            {/* 破棄して終了 */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-amber-500/20 transition-colors"
              title="シミュレーションを破棄して終了"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 展開時：シミュレーション用パラメータ調整パネル */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-500/30 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-in fade-in">
            {/* 1. 給与の仮変更 */}
            <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-500/20 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  💴 手取り給与の仮調整
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(simCycle.salary)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                {[
                  { label: "+1万", val: 10000 },
                  { label: "+3万", val: 30000 },
                  { label: "+5万", val: 50000 },
                  { label: "-2万", val: -20000 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      onUpdateSimCycle({
                        ...simCycle,
                        salary: Math.max(0, simCycle.salary + item.val),
                      })
                    }
                    className="flex-1 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold text-[10px] border border-amber-500/20 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="5000"
                value={simCycle.salary}
                onChange={(e) =>
                  onUpdateSimCycle({
                    ...simCycle,
                    salary: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>

            {/* 2. 仮想の臨時出費を追加（シミュレーション用） */}
            <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-500/20 backdrop-blur-md">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                🛍️ 仮想出費を足してみる (旅行・買い物等)
              </span>
              <form onSubmit={handleAddVirtualExpense} className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="項目名 (例: 温泉旅行)"
                  value={newSimName}
                  onChange={(e) => setNewSimName(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="金額"
                  value={newSimAmount}
                  onChange={(e) => setNewSimAmount(e.target.value)}
                  className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="p-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                  title="仮想出費を追加"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* 追加された仮想出費タグ一覧 */}
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {simExtraExpenses.map((e) => (
                  <span
                    key={e.id}
                    className="inline-flex items-center gap-1 text-[10px] bg-orange-500/15 text-orange-800 dark:text-orange-200 border border-orange-500/30 px-2 py-0.5 rounded-md"
                  >
                    <span>{e.name}</span>
                    <span className="font-bold font-mono">-{fmt(e.amount)}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteSimExtraExpense(e.id)}
                      className="hover:text-rose-600 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {simExtraExpenses.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">
                    仮想出費はまだありません
                  </p>
                )}
              </div>
            </div>

            {/* 3. 固定費の削減シミュレーション */}
            <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-500/20 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ✂️ 固定費の削減・見直し
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    計 {fmt(simTotalFixed)}
                  </span>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                  {simFixedCosts.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-1 text-[10px] py-0.5 border-b border-slate-100 dark:border-white/5"
                    >
                      <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300">
                        {f.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          {fmt(f.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleSimFixedCost(f.id)}
                          className="text-[9.5px] px-1.5 py-0.2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                          title="試算から除外する"
                        >
                          除外
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* シミュレーションリセット */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onResetSimulation}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>試算初期状態に戻す</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
