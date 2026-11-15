"use client";

import { useState } from "react";
import { FixedCost, CategoryColors, PRESET_COLORS } from "@/types/finance";
import { TrendingDown, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  fixedCosts: FixedCost[];
  categoryColor?: string;
  onAddFixed: (data: Omit<FixedCost, "id" | "created_at">) => void;
  onDeleteFixed: (id: string) => void;
  onUpdateFixed: (id: string, data: Partial<FixedCost>) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function FixedCostSection({
  fixedCosts = [],
  categoryColor = "#f87171",
  onAddFixed,
  onDeleteFixed,
  onUpdateFixed,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    due_day: "",
    color: categoryColor,
    memo: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FixedCost>>({});

  const totalAmount = (fixedCosts || []).reduce((sum, fc) => sum + (fc?.amount || 0), 0);

  const handleAdd = () => {
    if (!form.name.trim() || !form.amount) return;
    onAddFixed({
      name: form.name.trim(),
      amount: Number(form.amount),
      category: "other",
      due_day: form.due_day ? Number(form.due_day) : undefined,
      color: form.color,
      memo: form.memo || undefined,
    });
    setForm({
      name: "",
      amount: "",
      due_day: "",
      color: categoryColor,
      memo: "",
    });
    setShowForm(false);
  };

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 shadow-sm dark:shadow-xl space-y-4">
      {/* ヘッダー（クリックで開閉） */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
        >
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-nowrap">
                固定費・引き落とし予定
              </h3>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30 whitespace-nowrap">
                計 {fmt(totalAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              家賃・光熱費・サブスク等の毎月の定期引き落とし
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setIsOpen(true);
              setShowForm((v) => !v);
            }}
            className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>固定費を追加</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isOpen ? "折りたたむ" : "展開する"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <>

      {/* 新規登録フォーム */}
      {showForm && (
        <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="項目名 (例: 家賃、電気代、スマホ代) *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              type="number"
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
              placeholder="金額 (円) *"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-600 dark:text-slate-400">毎月</span>
              <input
                type="number"
                min={1}
                max={31}
                className="w-16 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-center font-mono"
                placeholder="27"
                value={form.due_day}
                onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
              />
              <span className="text-slate-600 dark:text-slate-400">日引き落とし</span>
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
                disabled={!form.name || !form.amount}
                className="text-xs bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-xl shadow-xs"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 固定費一覧（1列ワイド・ゆとりのある行表示） */}
      <div className="space-y-2">
        {(!fixedCosts || fixedCosts.length === 0) ? (
          <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            登録されている固定費はありません
          </p>
        ) : (
          fixedCosts.map((fc) => {
            const isEditing = editingId === fc.id;

            return (
              <div
                key={fc.id}
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span>毎月</span>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          className="w-12 text-xs border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-center font-mono"
                          value={editForm.due_day ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, due_day: Number(e.target.value) }))}
                        />
                        <span>日</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            onUpdateFixed(fc.id, editForm);
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
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: fc.color || categoryColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap min-w-fit">
                            {fc.name}
                          </span>
                          {fc.due_day && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.2 rounded shrink-0 whitespace-nowrap">
                              毎月{fc.due_day}日
                            </span>
                          )}
                        </div>
                        {fc.memo && (
                          <p className="text-[10px] text-slate-400 truncate">{fc.memo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {fmt(fc.amount)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(fc.id);
                          setEditForm({ name: fc.name, amount: fc.amount, due_day: fc.due_day, color: fc.color });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFixed(fc.id)}
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
        </>
      )}
    </div>
  );
}
