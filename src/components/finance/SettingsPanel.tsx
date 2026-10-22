"use client";

import { useState } from "react";
import {
  FixedCost,
  SavingPlan,
  PaydayCycle,
  CategoryColors,
  DEFAULT_CATEGORY_COLORS,
  PRESET_COLORS,
} from "@/types/finance";
import {
  TrendingDown,
  PiggyBank,
  Palette,
  X,
  Check,
  Trash2,
  Edit2,
  Plus,
  RotateCcw,
} from "lucide-react";

interface Props {
  cycle: PaydayCycle;
  fixedCosts: FixedCost[];
  savingPlans: SavingPlan[];
  categoryColors: CategoryColors;
  onUpdateCycle: (c: PaydayCycle) => void;
  onUpdateCategoryColors: (colors: CategoryColors) => void;
  onAddFixed: (data: Omit<FixedCost, "id" | "created_at">) => void;
  onDeleteFixed: (id: string) => void;
  onUpdateFixed: (id: string, data: Partial<FixedCost>) => void;
  onAddSaving: (data: Omit<SavingPlan, "id" | "created_at">) => void;
  onDeleteSaving: (id: string) => void;
  onUpdateSaving: (id: string, data: Partial<SavingPlan>) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function SettingsPanel({
  cycle,
  fixedCosts,
  savingPlans,
  categoryColors,
  onUpdateCycle,
  onUpdateCategoryColors,
  onAddFixed,
  onDeleteFixed,
  onUpdateFixed,
  onAddSaving,
  onDeleteSaving,
  onUpdateSaving,
}: Props) {
  const [localCycle, setLocalCycle] = useState(cycle);
  const [cycleEditing, setCycleEditing] = useState(false);

  // 固定費フォーム
  const [showFixedForm, setShowFixedForm] = useState(false);
  const [fixedForm, setFixedForm] = useState({
    name: "",
    amount: "",
    due_day: "",
    color: categoryColors.fixed || "#f87171",
    memo: "",
  });
  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);
  const [editFixedForm, setEditFixedForm] = useState<Partial<FixedCost>>({});

  // 貯金フォーム
  const [showSavingForm, setShowSavingForm] = useState(false);
  const [savingForm, setSavingForm] = useState({
    name: "",
    amount: "",
    color: categoryColors.saving || "#60a5fa",
    memo: "",
  });
  const [editingSavingId, setEditingSavingId] = useState<string | null>(null);
  const [editSavingForm, setEditSavingForm] = useState<Partial<SavingPlan>>({});

  const handleSaveCycle = () => {
    onUpdateCycle(localCycle);
    setCycleEditing(false);
  };

  const handleAddFixed = () => {
    if (!fixedForm.name.trim() || !fixedForm.amount) return;
    onAddFixed({
      name: fixedForm.name.trim(),
      amount: Number(fixedForm.amount),
      category: "other",
      due_day: fixedForm.due_day ? Number(fixedForm.due_day) : undefined,
      color: fixedForm.color,
      memo: fixedForm.memo || undefined,
    });
    setFixedForm({
      name: "",
      amount: "",
      due_day: "",
      color: categoryColors.fixed || "#f87171",
      memo: "",
    });
    setShowFixedForm(false);
  };

  const handleAddSaving = () => {
    if (!savingForm.name.trim() || !savingForm.amount) return;
    onAddSaving({
      name: savingForm.name.trim(),
      amount: Number(savingForm.amount),
      color: savingForm.color,
      memo: savingForm.memo || undefined,
    });
    setSavingForm({
      name: "",
      amount: "",
      color: categoryColors.saving || "#60a5fa",
      memo: "",
    });
    setShowSavingForm(false);
  };

  const handleCategoryColorChange = (key: keyof CategoryColors, hex: string) => {
    onUpdateCategoryColors({
      ...categoryColors,
      [key]: hex,
    });
  };

  const handleResetCategoryColors = () => {
    onUpdateCategoryColors(DEFAULT_CATEGORY_COLORS);
  };

  return (
    <div className="space-y-6">
      {/* ── 🎨 お金の種類ごとのカラー変更セクション ── */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-500" />
            お金の種類のカラー設定（円グラフ ＆ カレンダー）
          </h3>
          <button
            onClick={handleResetCategoryColors}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            title="標準の色に戻す"
          >
            <RotateCcw className="w-3 h-3" /> リセット
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          円グラフの内訳やダッシュボード、カレンダーの主要バッジの色を自由にカスタマイズできます。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { key: "free" as const,   label: "自由に使えるお金（フリー額）", desc: "残高や給料の基調色" },
            { key: "fixed" as const,  label: "固定費・引き落とし予定",     desc: "家賃・光熱費・サブスク等" },
            { key: "saving" as const, label: "貯金・投資",                 desc: "NISA・先取り貯金等" },
            { key: "extra" as const,  label: "予定されている臨時出費",     desc: "車検・旅行・買い物等" },
          ]).map(({ key, label, desc }) => {
            const currentColor = categoryColors[key];
            return (
              <div
                key={key}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{label}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-xs"
                        style={{ backgroundColor: currentColor }}
                      />
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => handleCategoryColorChange(key, e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title="カスタムカラーピッカー"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">{desc}</p>
                </div>

                {/* プリセット色のクイック選択 */}
                <div className="flex items-center gap-1 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 mr-1">選ぶ:</span>
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleCategoryColorChange(key, p.hex)}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        currentColor.toLowerCase() === p.hex.toLowerCase()
                          ? "scale-125 ring-2 ring-offset-1 ring-zinc-500"
                          : "opacity-75 hover:opacity-100 hover:scale-110"
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 💴 給与設定 ── */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">💴 給与設定</h3>
          {!cycleEditing && (
            <button
              onClick={() => { setLocalCycle(cycle); setCycleEditing(true); }}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> 編集
            </button>
          )}
        </div>
        {cycleEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">今月の給与額 (円)</label>
              <input
                type="number"
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="300000"
                value={localCycle.salary || ""}
                onChange={e => setLocalCycle(c => ({ ...c, salary: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">給料日（毎月何日）</label>
              <input
                type="number"
                min={1} max={31}
                className="w-32 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="25"
                value={localCycle.payday || ""}
                onChange={e => setLocalCycle(c => ({ ...c, payday: Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCycleEditing(false)} className="text-xs px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500">
                キャンセル
              </button>
              <button onClick={handleSaveCycle} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium">
                保存
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <p>給与額: <span className="font-bold text-zinc-800 dark:text-zinc-200">{cycle.salary ? fmt(cycle.salary) : "未設定"}</span></p>
            <p>給料日: <span className="font-bold text-zinc-800 dark:text-zinc-200">{cycle.payday ? `毎月${cycle.payday}日` : "未設定"}</span></p>
          </div>
        )}
      </section>

      {/* ── 固定費リスト ── */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" /> 固定費・引き落とし
          </h3>
          <button onClick={() => setShowFixedForm(v => !v)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
            <Plus className="w-3 h-3" /> 追加
          </button>
        </div>

        {showFixedForm && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="項目名 *"
                value={fixedForm.name}
                onChange={e => setFixedForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="金額 *"
                value={fixedForm.amount}
                onChange={e => setFixedForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-500">毎月</span>
                <input
                  type="number" min={1} max={31}
                  className="w-16 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="日"
                  value={fixedForm.due_day}
                  onChange={e => setFixedForm(f => ({ ...f, due_day: e.target.value }))}
                />
                <span className="text-xs text-zinc-500">日</span>
              </div>

              {/* 固定費固有カラー設定 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">色:</span>
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFixedForm(f => ({ ...f, color: p.hex }))}
                    className={`w-4 h-4 rounded-full ${fixedForm.color === p.hex ? "ring-2 ring-zinc-500 scale-125" : "opacity-75"}`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={fixedForm.color}
                  onChange={(e) => setFixedForm(f => ({ ...f, color: e.target.value }))}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowFixedForm(false)} className="text-xs px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-400">
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={handleAddFixed}
                disabled={!fixedForm.name || !fixedForm.amount}
                className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white px-3 py-1 rounded-lg font-medium"
              >
                <Check className="w-3 h-3" /> 追加
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {fixedCosts.length === 0 && <li className="text-xs text-zinc-400 text-center py-2">固定費がありません</li>}
          {fixedCosts.map(fc => (
            <li key={fc.id} className="flex items-center justify-between text-sm border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
              {editingFixedId === fc.id ? (
                <div className="flex flex-col gap-1.5 flex-1 mr-1 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex gap-1">
                    <input
                      className="flex-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                      value={editFixedForm.name ?? ""}
                      onChange={e => setEditFixedForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="w-24 text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                      value={editFixedForm.amount ?? ""}
                      onChange={e => setEditFixedForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400">毎月</span>
                      <input
                        type="number" min={1} max={31}
                        className="w-12 text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1 py-0.5 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                        value={editFixedForm.due_day ?? ""}
                        onChange={e => setEditFixedForm(f => ({ ...f, due_day: Number(e.target.value) }))}
                      />
                      <span className="text-[10px] text-zinc-400">日</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={editFixedForm.color || categoryColors.fixed}
                        onChange={(e) => setEditFixedForm(f => ({ ...f, color: e.target.value }))}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <button onClick={() => { onUpdateFixed(fc.id, editFixedForm); setEditingFixedId(null); }} className="text-emerald-500 hover:text-emerald-700 p-1">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingFixedId(null)} className="text-zinc-400 hover:text-zinc-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: fc.color || categoryColors.fixed }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {fc.name}
                      {fc.due_day ? <span className="text-xs text-zinc-400 ml-1">({fc.due_day}日)</span> : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-500">{fmt(fc.amount)}</span>
                    <button
                      onClick={() => {
                        setEditingFixedId(fc.id);
                        setEditFixedForm({ name: fc.name, amount: fc.amount, due_day: fc.due_day, color: fc.color });
                      }}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteFixed(fc.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-right text-zinc-400 mt-2">
          合計: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{fmt(fixedCosts.reduce((s, c) => s + c.amount, 0))}</span>
        </p>
      </section>

      {/* ── 貯金・投資リスト ── */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-blue-400" /> 貯金・投資
          </h3>
          <button onClick={() => setShowSavingForm(v => !v)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 font-medium">
            <Plus className="w-3 h-3" /> 追加
          </button>
        </div>

        {showSavingForm && (
          <div className="mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="項目名 *"
                value={savingForm.name}
                onChange={e => setSavingForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="金額 *"
                value={savingForm.amount}
                onChange={e => setSavingForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">色:</span>
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSavingForm(f => ({ ...f, color: p.hex }))}
                    className={`w-4 h-4 rounded-full ${savingForm.color === p.hex ? "ring-2 ring-zinc-500 scale-125" : "opacity-75"}`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={savingForm.color}
                  onChange={(e) => setSavingForm(f => ({ ...f, color: e.target.value }))}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowSavingForm(false)} className="text-xs px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-400">
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={handleAddSaving}
                  disabled={!savingForm.name || !savingForm.amount}
                  className="text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white px-3 py-1 rounded-lg font-medium"
                >
                  <Check className="w-3 h-3" /> 追加
                </button>
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {savingPlans.length === 0 && <li className="text-xs text-zinc-400 text-center py-2">貯金・投資がありません</li>}
          {savingPlans.map(sp => (
            <li key={sp.id} className="flex items-center justify-between text-sm border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
              {editingSavingId === sp.id ? (
                <div className="flex gap-1 flex-1 mr-1 items-center">
                  <input
                    className="flex-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-1 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                    value={editSavingForm.name ?? ""}
                    onChange={e => setEditSavingForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="w-24 text-xs border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-1 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                    value={editSavingForm.amount ?? ""}
                    onChange={e => setEditSavingForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  />
                  <input
                    type="color"
                    value={editSavingForm.color || categoryColors.saving}
                    onChange={(e) => setEditSavingForm(f => ({ ...f, color: e.target.value }))}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <button onClick={() => { onUpdateSaving(sp.id, editSavingForm); setEditingSavingId(null); }} className="text-emerald-500 p-1">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingSavingId(null)} className="text-zinc-400 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sp.color || categoryColors.saving }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{sp.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-500">{fmt(sp.amount)}</span>
                    <button
                      onClick={() => {
                        setEditingSavingId(sp.id);
                        setEditSavingForm({ name: sp.name, amount: sp.amount, color: sp.color });
                      }}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteSaving(sp.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-right text-zinc-400 mt-2">
          合計: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{fmt(savingPlans.reduce((s, p) => s + p.amount, 0))}</span>
        </p>
      </section>
    </div>
  );
}
