"use client";

import { useState } from "react";
import { ExtraExpense } from "@/types/finance";
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
  const [form, setForm] = useState({ name: "", amount: "", date: "", memo: "" });
  // 編集フォーム state
  const [editForm, setEditForm] = useState<Partial<ExtraExpense>>({});

  const handleAdd = () => {
    if (!form.name.trim() || !form.amount) return;
    onAdd({
      name: form.name.trim(),
      amount: Number(form.amount),
      date: form.date || undefined,
      memo: form.memo || undefined,
    });
    setForm({ name: "", amount: "", date: "", memo: "" });
    setShowForm(false);
  };

  const startEdit = (e: ExtraExpense) => {
    setEditingId(e.id);
    setEditForm({ name: e.name, amount: e.amount, date: e.date, memo: e.memo });
  };

  const commitEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, editForm);
    setEditingId(null);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-400" />
          臨時出費・大きな出費の予定
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          + 追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="mb-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">項目名 *</label>
              <input
                className="w-full text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="例: 車検代"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">予定金額 (円) *</label>
              <input
                type="number"
                className="w-full text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="50000"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">予定日</label>
            <input
              type="date"
              className="text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">メモ</label>
            <textarea
              className="w-full text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100 resize-none"
              rows={2}
              placeholder="自由メモ（見積もり内容、欲しいもの等）"
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-500"
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
      {expenses.length === 0 ? (
        <p className="text-zinc-400 text-sm text-center py-6">
          臨時出費の予定はありません
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenses.map(expense => {
            const remaining = getDaysRemaining(expense.date);
            const isEditing = editingId === expense.id;

            return (
              <div
                key={expense.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-4 flex flex-col gap-2"
              >
                {isEditing ? (
                  // 編集モード
                  <div className="space-y-2">
                    <input
                      className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                      value={editForm.name ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                      value={editForm.amount ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    />
                    <input
                      type="date"
                      className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                      value={editForm.date ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    />
                    <textarea
                      className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-100 resize-none"
                      rows={2}
                      value={editForm.memo ?? ""}
                      onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))}
                    />
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditingId(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={commitEdit} className="p-1 text-emerald-500 hover:text-emerald-700">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">{expense.name}</p>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(expense)} className="p-1 text-zinc-400 hover:text-zinc-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(expense.id)} className="p-1 text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-lg font-bold text-orange-500">{fmt(expense.amount)}</p>

                    {expense.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{expense.date}</span>
                        {remaining && (
                          <span className={`text-xs font-semibold ml-1 ${
                            remaining.past    ? "text-zinc-400" :
                            remaining.urgent  ? "text-red-500"  :
                                               "text-zinc-500"
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
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{expense.memo}</p>
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

