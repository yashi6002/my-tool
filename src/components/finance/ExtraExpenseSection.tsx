"use client";

import { useState, useMemo } from "react";
import { ExtraExpense, PRESET_COLORS } from "@/types/finance";
import { sortByDateAsc } from "@/lib/financeUtils";
import { Zap, Calendar, Trash2, Edit2, X, Check, Plus } from "lucide-react";

interface Props {
  expenses: ExtraExpense[];
  onAdd: (e: Omit<ExtraExpense, "id" | "created_at">) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<ExtraExpense>) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

const getDaysRemaining = (dateStr?: string) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: "過去", urgent: false, past: true };
  if (diff === 0) return { label: "今日!", urgent: true, past: false };
  if (diff === 1) return { label: "明日!", urgent: true, past: false };
  return { label: `あと${diff}日`, urgent: diff <= 7, past: false };
};

export function ExtraExpenseSection({ expenses = [], onAdd, onDelete, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 新規フォーム state
  const [form, setForm] = useState({ name: "", amount: "", date: "", color: "#fb923c", memo: "" });
  // 編集フォーム state
  const [editForm, setEditForm] = useState<Partial<ExtraExpense>>({});

  // 予定日順（昇順）にソート
  const sortedExpenses = useMemo(() => sortByDateAsc(expenses || []), [expenses]);

  const totalAmount = (expenses || []).reduce((sum, e) => sum + (e?.amount || 0), 0);

  const handleAdd = () => {
    if (!form.name.trim() || !form.amount) return;
    onAdd({
      name: form.name.trim(),
      amount: Number(form.amount),
      date: form.date || undefined,
      color: form.color,
      memo: form.memo || undefined,
    });
    setForm({ name: "", amount: "", date: "", color: "#fb923c", memo: "" });
    setShowForm(false);
  };

  const commitEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, editForm);
    setEditingId(null);
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-nowrap">
                臨時出費・予定カード
              </h3>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 font-mono bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-500/30">
                計 {fmt(totalAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              車検、旅行、冠婚葬祭など近日の特別出費を計画・把握
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>臨時出費を追加</span>
        </button>
      </div>

      {/* 新規登録フォーム */}
      {showForm && (
        <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="出費項目名 (例: 友人の結婚式、旅行代) *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
            <input
              type="number"
              placeholder="金額 (円) *"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">予定日:</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

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
                disabled={!form.name.trim() || !form.amount}
                className="text-xs bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-xl shadow-xs"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 臨時出費一覧（1列ワイド・見やすい行表示） */}
      <div className="space-y-2">
        {sortedExpenses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            当サイクルに予定されている臨時出費はありません
          </p>
        ) : (
          sortedExpenses.map((expense) => {
            const remaining = getDaysRemaining(expense.date);
            const isEditing = editingId === expense.id;

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all text-xs sm:text-sm"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2 w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1"
                        value={editForm.name ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                      <input
                        type="number"
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 font-mono"
                        value={editForm.amount ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="date"
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 font-mono"
                        value={editForm.date ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={commitEdit}
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
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: expense.color || "#fb923c" }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap min-w-fit">
                            {expense.name}
                          </span>
                          {expense.date && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-500/20 shrink-0 whitespace-nowrap">
                              {expense.date}
                            </span>
                          )}
                          {remaining && (
                            <span
                              className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold shrink-0 whitespace-nowrap ${
                                remaining.urgent
                                  ? "bg-rose-500 text-white"
                                  : remaining.past
                                  ? "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              }`}
                            >
                              {remaining.label}
                            </span>
                          )}
                        </div>
                        {expense.memo && (
                          <p className="text-[10px] text-slate-400 truncate">{expense.memo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="font-bold font-mono text-orange-600 dark:text-orange-400 whitespace-nowrap">
                        {fmt(expense.amount)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(expense.id);
                          setEditForm({ name: expense.name, amount: expense.amount, date: expense.date, color: expense.color, memo: expense.memo });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
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
