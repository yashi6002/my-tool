"use client";

import { useState, useMemo } from "react";
import { ExtraExpense, PRESET_COLORS } from "@/types/finance";
import { sortByDateAsc } from "@/lib/financeUtils";
import { Zap, Calendar, ImageIcon, Trash2, Edit2, X, Check } from "lucide-react";

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
  if (diff < 0)  return { label: "期限切れ", urgent: false, past: true };
  if (diff === 0) return { label: "今日!", urgent: true, past: false };
  if (diff === 1) return { label: "明日!", urgent: true, past: false };
  return { label: `あと${diff}日`, urgent: diff <= 7, past: false };
};

export function ExtraExpenseSection({ expenses, onAdd, onDelete, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 新規フォーム state
  const [form, setForm] = useState({ name: "", amount: "", date: "", color: "#fb923c", memo: "" });
  // 編集フォーム state
  const [editForm, setEditForm] = useState<Partial<ExtraExpense>>({});

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

  const startEdit = (e: ExtraExpense) => {
    setEditingId(e.id);
    setEditForm({ name: e.name, amount: e.amount, date: e.date, color: e.color || "#fb923c", memo: e.memo });
  };

  const commitEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, editForm);
    setEditingId(null);
  };

  // 予定日順（昇順）にソート
  const sortedExpenses = useMemo(() => sortByDateAsc(expenses), [expenses]);

  return (
    <section className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 shadow-sm dark:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" />
            臨時出費・予定カード
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            車検、旅行、冠婚葬祭など近日の特別出費を計画・把握
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + 予定を追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="mb-4 p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">項目名 *</label>
              <input
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="例: 車検代、旅行費"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">予定金額 (円) *</label>
              <input
                type="number"
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="50000"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">予定日</label>
              <input
                type="date"
                className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">表示カラー</label>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: p.hex }))}
                    className={`w-4 h-4 rounded-full ${form.color === p.hex ? "ring-2 ring-slate-400 scale-125" : "opacity-75"}`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">メモ</label>
            <textarea
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none"
              rows={2}
              placeholder="自由メモ（見積もり内容、欲しいもの等）"
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              キャンセル
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.amount}
              className="text-xs bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              追加する
            </button>
          </div>
        </div>
      )}

      {/* カード一覧 */}
      {sortedExpenses.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
          予定されている臨時出費はありません
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {sortedExpenses.map(expense => {
            const remaining = getDaysRemaining(expense.date);
            const isEditing = editingId === expense.id;

            // 予定日順（昇順）にソート
  const sortedExpenses = useMemo(() => sortByDateAsc(expenses), [expenses]);

  return (
              <div
                key={expense.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 flex flex-col gap-2 transition-all hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-slate-800/60 shadow-2xs"
              >
                {isEditing ? (
                  // 編集モード
                  <div className="space-y-2">
                    <input
                      className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      value={editForm.name ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      value={editForm.amount ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    />
                    <input
                      type="date"
                      className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      value={editForm.date ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    />
                    <textarea
                      className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none"
                      rows={2}
                      value={editForm.memo ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))}
                    />
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={commitEdit} className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: expense.color || "#fb923c" }}
                        />
                        <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">{expense.name}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(expense)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(expense.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-base font-bold" style={{ color: expense.color || "#f97316" }}>
                      {fmt(expense.amount)}
                    </p>

                    {expense.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{expense.date}</span>
                        {remaining && (
                          <span className={`text-[10px] font-semibold ml-1 px-1.5 py-0.2 rounded ${
                            remaining.past    ? "bg-slate-200 dark:bg-slate-800 text-slate-500" :
                            remaining.urgent  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 animate-pulse"  :
                                               "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/5"
                          }`}>
                            {remaining.label}
                          </span>
                        )}
                      </div>
                    )}

                    {expense.image_url && (
                      <img
                        src={expense.image_url}
                        alt="添付"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    )}

                    {expense.memo && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{expense.memo}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

