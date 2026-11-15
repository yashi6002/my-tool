"use client";

import { useState } from "react";
import { SavingPlan, PRESET_COLORS } from "@/types/finance";
import { PiggyBank, Plus, Edit2, Trash2, X, Check } from "lucide-react";

interface Props {
  savingPlans: SavingPlan[];
  categoryColor?: string;
  onAddSaving: (data: Omit<SavingPlan, "id" | "created_at">) => void;
  onDeleteSaving: (id: string) => void;
  onUpdateSaving: (id: string, data: Partial<SavingPlan>) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function SavingPlanSection({
  savingPlans = [],
  categoryColor = "#60a5fa",
  onAddSaving,
  onDeleteSaving,
  onUpdateSaving,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    color: categoryColor,
    memo: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SavingPlan>>({});

  const totalAmount = (savingPlans || []).reduce((sum, sp) => sum + (sp?.amount || 0), 0);

  const handleAdd = () => {
    if (!form.name.trim() || !form.amount) return;
    onAddSaving({
      name: form.name.trim(),
      amount: Number(form.amount),
      color: form.color,
      memo: form.memo || undefined,
    });
    setForm({
      name: "",
      amount: "",
      color: categoryColor,
      memo: "",
    });
    setShowForm(false);
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-nowrap">
                貯金・投資計画
              </h3>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                計 {fmt(totalAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              NISA・定期積立・先取り貯金などの将来資産
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>貯金計画を追加</span>
        </button>
      </div>

      {/* 新規登録フォーム */}
      {showForm && (
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="項目名 (例: つみたてNISA、先取り貯金) *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              type="number"
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
              placeholder="毎月の積立額 (円) *"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">色:</span>
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: p.hex }))}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    form.color === p.hex ? "ring-2 ring-slate-400 scale-125" : "opacity-75"
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.name || !form.amount}
                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-xl shadow-xs"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 貯金一覧（1列ワイド表示） */}
      <div className="space-y-2">
        {(!savingPlans || savingPlans.length === 0) ? (
          <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            登録されている貯金・投資計画はありません
          </p>
        ) : (
          savingPlans.map((sp) => {
            const isEditing = editingId === sp.id;

            return (
              <div
                key={sp.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all text-xs sm:text-sm"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2 w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        value={editForm.name ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                      <input
                        type="number"
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                        value={editForm.amount ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          onUpdateSaving(sp.id, editForm);
                          setEditingId(null);
                        }}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-slate-500 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: sp.color || categoryColor }}
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap min-w-fit">
                          {sp.name}
                        </span>
                        {sp.memo && (
                          <p className="text-[10px] text-slate-400 truncate">{sp.memo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {fmt(sp.amount)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(sp.id);
                          setEditForm({ name: sp.name, amount: sp.amount, color: sp.color });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSaving(sp.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
