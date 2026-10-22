"use client";

import { useState, useEffect } from "react";
import { CalendarEventItem, PRESET_COLORS, TransactionType } from "@/types/finance";
import { X, Plus, Trash2, Edit2, Check, RotateCw, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // YYYY-MM-DD
  events: CalendarEventItem[];
  onAddEvent: (event: Omit<CalendarEventItem, "id" | "created_at">) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEventItem>) => void;
  onDeleteEvent: (id: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function CalendarEventModal({
  isOpen,
  onClose,
  dateStr,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [color, setColor] = useState<string>(PRESET_COLORS[1].hex); // デフォルト: ローズ（出金）
  const [memo, setMemo] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editType, setEditType] = useState<TransactionType>("expense");
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editMemo, setEditMemo] = useState("");

  // 日付のパース
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const dateLabel = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()];

  useEffect(() => {
    // タイプの切り替え時にデフォルトカラーを自動調整
    if (type === "income") {
      setColor(PRESET_COLORS[0].hex); // エメラルド
    } else {
      setColor(PRESET_COLORS[1].hex); // ローズ
    }
  }, [type]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || Number(amount) <= 0) return;

    onAddEvent({
      name: name.trim(),
      amount: Number(amount),
      type,
      date: dateStr,
      color,
      is_recurring: isRecurring,
      recurring_day: isRecurring ? dateObj.getDate() : undefined,
      memo: memo.trim() || undefined,
      source: "custom",
    });

    setName("");
    setAmount("");
    setMemo("");
    setIsRecurring(false);
  };

  const startEdit = (ev: CalendarEventItem) => {
    setEditingId(ev.id);
    setEditName(ev.name);
    setEditAmount(String(ev.amount));
    setEditColor(ev.color || (ev.type === "income" ? PRESET_COLORS[0].hex : PRESET_COLORS[1].hex));
    setEditType(ev.type);
    setEditIsRecurring(!!ev.is_recurring);
    setEditMemo(ev.memo || "");
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim() || !editAmount || Number(editAmount) <= 0) return;
    onUpdateEvent(id, {
      name: editName.trim(),
      amount: Number(editAmount),
      color: editColor,
      type: editType,
      is_recurring: editIsRecurring,
      recurring_day: editIsRecurring ? dateObj.getDate() : undefined,
      memo: editMemo.trim() || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{dateLabel}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                dayOfWeek === "日" ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400" :
                dayOfWeek === "土" ? "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400" :
                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}>
                {dayOfWeek}曜日
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              この日の入金・出金アイテムの管理 ＆ カラー設定
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* 登録済みアイテム一覧 */}
          <div>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
              登録されている収支 ({events.length}件)
            </h4>
            {events.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/60">
                この日の収支予定はありません
              </p>
            ) : (
              <ul className="space-y-2">
                {events.map((ev) => {
                  const isEditing = editingId === ev.id;
                  return (
                    <li
                      key={ev.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 flex flex-col gap-2 transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditType("expense")}
                              className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                editType === "expense"
                                  ? "bg-rose-50 border-rose-400 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                              }`}
                            >
                              出金 (ー)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditType("income")}
                              className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                editType === "income"
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                              }`}
                            >
                              入金 (＋)
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className="text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                              placeholder="項目名"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                            <input
                              type="number"
                              className="text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                              placeholder="金額"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                            />
                          </div>

                          {/* 編集時カラー選択 */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-500">色:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {PRESET_COLORS.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setEditColor(p.hex)}
                                  className={`w-5 h-5 rounded-full transition-transform ${
                                    editColor === p.hex ? "scale-125 ring-2 ring-offset-1 ring-zinc-500" : "opacity-80 hover:opacity-100"
                                  }`}
                                  style={{ backgroundColor: p.hex }}
                                  title={p.label}
                                />
                              ))}
                              <input
                                type="color"
                                value={editColor}
                                onChange={(e) => setEditColor(e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                                title="カスタムカラー"
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsRecurring}
                              onChange={(e) => setEditIsRecurring(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>毎月{dateObj.getDate()}日に繰り返し発生</span>
                          </label>

                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-500"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate(ev.id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-medium flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> 保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: ev.color || (ev.type === "income" ? "#10b981" : "#f43f5e") }}
                            />
                            <div>
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <span>{ev.name}</span>
                                {ev.is_recurring && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.2 rounded-full font-normal text-zinc-600 dark:text-zinc-300">
                                    <RotateCw className="w-2.5 h-2.5" /> 毎月
                                  </span>
                                )}
                              </p>
                              {ev.memo && (
                                <p className="text-[10px] text-zinc-400 line-clamp-1">{ev.memo}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className={`text-xs font-bold ${
                              ev.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}>
                              {ev.type === "income" ? "+" : "-"}
                              {fmt(ev.amount)}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => startEdit(ev)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
                                title="編集"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEvent(ev.id)}
                                className="p-1 text-zinc-400 hover:text-red-500 rounded"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 新規アイテム登録フォーム */}
          <form onSubmit={handleAdd} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 space-y-3">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              新しい収支予定を追加
            </h4>

            {/* 種別トグル */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`py-1.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  type === "expense"
                    ? "bg-rose-50 border-rose-400 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                出金 (ー)
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`py-1.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  type === "income"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                入金 (＋)
              </button>
            </div>

            {/* 項目名 & 金額 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-zinc-500 block mb-1">項目名 *</label>
                <input
                  type="text"
                  required
                  placeholder={type === "income" ? "例: 臨時ボーナス、副業" : "例: 食費まとめ買い、美容院"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-500 block mb-1">金額 (円) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* カラー選択パレット */}
            <div>
              <label className="text-[11px] font-medium text-zinc-500 block mb-1.5">
                表示カラー（カレンダー上のバッジ色）
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setColor(p.hex)}
                    className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                      color.toLowerCase() === p.hex.toLowerCase()
                        ? "scale-110 ring-2 ring-offset-2 ring-zinc-500"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.label}
                  >
                    {color.toLowerCase() === p.hex.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                ))}
                {/* 自由カラーピッカー */}
                <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                    title="自由な色を選択"
                  />
                  <span className="text-[10px] font-mono text-zinc-500">{color}</span>
                </div>
              </div>
            </div>

            {/* 繰り返し設定 */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">毎月この日（{dateObj.getDate()}日）に繰り返し発生させる</span>
              </label>
              <p className="text-[10px] text-zinc-400 ml-5 mt-0.5">
                家賃やサブスクのように毎月決まって発生する項目にチェックしてください
              </p>
            </div>

            {/* メモ */}
            <div>
              <label className="text-[11px] font-medium text-zinc-500 block mb-1">メモ（任意）</label>
              <input
                type="text"
                placeholder="備考やメモ"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !amount}
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-2 rounded-xl font-bold transition-colors shadow-xs"
            >
              この日付に追加する
            </button>
          </form>
        </div>

        {/* モーダルフッター */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
