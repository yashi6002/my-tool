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
      {/* ── 1. 固定費・引き落としリスト（日常の最重要支出） ── */}
      <section className="bg-white/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" /> 固定費・引き落とし
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              家賃・光熱費・サブスク等の毎月の定期引き落とし
            </p>
          </div>
          <button onClick={() => setShowFixedForm(v => !v)} className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
            <Plus className="w-3.5 h-3.5" /> 追加
          </button>
        </div>

        {showFixedForm && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 dark:text-slate-100"
                placeholder="項目名 *"
                value={fixedForm.name}
                onChange={e => setFixedForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 dark:text-slate-100"
                placeholder="金額 *"
                value={fixedForm.amount}
                onChange={e => setFixedForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">毎月</span>
                <input
                  type="number" min={1} max={31}
                  className="w-14 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 dark:text-slate-100 text-center"
                  placeholder="日"
                  value={fixedForm.due_day}
                  onChange={e => setFixedForm(f => ({ ...f, due_day: e.target.value }))}
                />
                <span className="text-xs text-slate-500">日</span>
              </div>

              {/* 固定費固有カラー設定 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">色:</span>
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFixedForm(f => ({ ...f, color: p.hex }))}
                    className={`w-4 h-4 rounded-full ${fixedForm.color === p.hex ? "ring-2 ring-slate-400 scale-125" : "opacity-75"}`}
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
              <button onClick={() => setShowFixedForm(false)} className="text-xs px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-400">
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={handleAddFixed}
                disabled={!fixedForm.name || !fixedForm.amount}
                className="text-xs bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white px-3 py-1 rounded-lg font-medium"
              >
                <Check className="w-3 h-3" /> 追加
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-1.5">
          {fixedCosts.length === 0 && <li className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">固定費の登録がありません</li>}
          {fixedCosts.map(fc => (
            <li key={fc.id} className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800/80 py-1.5">
              {editingFixedId === fc.id ? (
                <div className="flex flex-col gap-1.5 flex-1 mr-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1">
                    <input
                      className="flex-1 text-xs border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 bg-white dark:bg-slate-900 dark:text-slate-100"
                      value={editFixedForm.name ?? ""}
                      onChange={e => setEditFixedForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="w-24 text-xs border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 bg-white dark:bg-slate-900 dark:text-slate-100"
                      value={editFixedForm.amount ?? ""}
                      onChange={e => setEditFixedForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">毎月</span>
                      <input
                        type="number" min={1} max={31}
                        className="w-12 text-xs border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 bg-white dark:bg-slate-900 dark:text-slate-100"
                        value={editFixedForm.due_day ?? ""}
                        onChange={e => setEditFixedForm(f => ({ ...f, due_day: Number(e.target.value) }))}
                      />
                      <span className="text-[10px] text-slate-400">日</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={editFixedForm.color || categoryColors.fixed}
                        onChange={(e) => setEditFixedForm(f => ({ ...f, color: e.target.value }))}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <button onClick={() => { onUpdateFixed(fc.id, editFixedForm); setEditingFixedId(null); }} className="text-emerald-500 hover:text-emerald-700 p-1">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingFixedId(null)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-3.5 h-3.5" />
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
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {fc.name}
                      {fc.due_day ? <span className="text-[11px] text-slate-400 ml-1">({fc.due_day}日)</span> : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-500">{fmt(fc.amount)}</span>
                    <button
                      onClick={() => {
                        setEditingFixedId(fc.id);
                        setEditFixedForm({ name: fc.name, amount: fc.amount, due_day: fc.due_day, color: fc.color });
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteFixed(fc.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-right text-slate-400 mt-2">
          固定費合計: <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(fixedCosts.reduce((s, c) => s + c.amount, 0))}</span>
        </p>
      </section>

      {/* ── 2. 貯金・投資リスト ── */}
      <section className="bg-white/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-blue-400" /> 貯金・投資
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              毎月の先取り貯金やNISAなど
            </p>
          </div>
          <button onClick={() => setShowSavingForm(v => !v)} className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
            <Plus className="w-3.5 h-3.5" /> 追加
          </button>
        </div>

        {showSavingForm && (
          <div className="mb-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 dark:text-slate-100"
                placeholder="項目名 *"
                value={savingForm.name}
                onChange={e => setSavingForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 dark:text-slate-100"
                placeholder="金額 *"
                value={savingForm.amount}
                onChange={e => setSavingForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">色:</span>
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSavingForm(f => ({ ...f, color: p.hex }))}
                    className={`w-4 h-4 rounded-full ${savingForm.color === p.hex ? "ring-2 ring-slate-400 scale-125" : "opacity-75"}`}
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
                <button onClick={() => setShowSavingForm(false)} className="text-xs px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-400">
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

        <ul className="space-y-1.5">
          {savingPlans.length === 0 && <li className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">貯金・投資の登録がありません</li>}
          {savingPlans.map(sp => (
            <li key={sp.id} className="flex items-center justify-between text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800/80 py-1.5">
              {editingSavingId === sp.id ? (
                <div className="flex gap-1 flex-1 mr-1 items-center">
                  <input
                    className="flex-1 text-xs border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 bg-white dark:bg-slate-900 dark:text-slate-100"
                    value={editSavingForm.name ?? ""}
                    onChange={e => setEditSavingForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="w-24 text-xs border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 bg-white dark:bg-slate-900 dark:text-slate-100"
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
                  <button onClick={() => setEditingSavingId(null)} className="text-slate-400 p-1">
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
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{sp.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-500">{fmt(sp.amount)}</span>
                    <button
                      onClick={() => {
                        setEditingSavingId(sp.id);
                        setEditSavingForm({ name: sp.name, amount: sp.amount, color: sp.color });
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteSaving(sp.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-right text-slate-400 mt-2">
          貯金合計: <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(savingPlans.reduce((s, p) => s + p.amount, 0))}</span>
        </p>
      </section>

      {/* ── 3. 💴 給与設定（基本情報） ── */}
      <section className="bg-white/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>💴</span> 給与 ＆ 給料日サイクル設定
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              毎月の支給額とサイクルの基準日
            </p>
          </div>
          {!cycleEditing && (
            <button
              onClick={() => { setLocalCycle(cycle); setCycleEditing(true); }}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20"
            >
              <Edit2 className="w-3 h-3" /> 変更
            </button>
          )}
        </div>
        {cycleEditing ? (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-slate-500 block mb-1">今月の給与額 (円)</label>
              <input
                type="number"
                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
                placeholder="300000"
                value={localCycle.salary || ""}
                onChange={e => setLocalCycle(c => ({ ...c, salary: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">給料日（毎月何日）</label>
              <input
                type="number"
                min={1} max={31}
                className="w-32 text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-slate-100"
                placeholder="25"
                value={localCycle.payday || ""}
                onChange={e => setLocalCycle(c => ({ ...c, payday: Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCycleEditing(false)} className="text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500">
                キャンセル
              </button>
              <button onClick={handleSaveCycle} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium">
                保存
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50/70 dark:bg-slate-850 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <p>給与額: <span className="font-bold text-slate-800 dark:text-slate-200">{cycle.salary ? fmt(cycle.salary) : "未設定"}</span></p>
            <p>給料日: <span className="font-bold text-slate-800 dark:text-slate-200">{cycle.payday ? `毎月${cycle.payday}日` : "未設定"}</span></p>
          </div>
        )}
      </section>

      {/* ── 4. 🎨 お金の種類ごとのカラー設定（装飾設定） ── */}
      <section className="bg-white/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
            <Palette className="w-4 h-4 text-emerald-500" />
            お金の種類のカラー設定（円グラフ ＆ カレンダー）
          </h3>
          <button
            onClick={handleResetCategoryColors}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            title="標準の色に戻す"
          >
            <RotateCcw className="w-3 h-3" /> リセット
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          円グラフの内訳やダッシュボード、カレンダーの主要バッジの色を自由にカスタマイズできます。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-xs"
                        style={{ backgroundColor: currentColor }}
                      />
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => handleCategoryColorChange(key, e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title="カスタムカラーピッカー"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">{desc}</p>
                </div>

                {/* プリセット色のクイック選択 */}
                <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 mr-1">選ぶ:</span>
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleCategoryColorChange(key, p.hex)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        currentColor.toLowerCase() === p.hex.toLowerCase()
                          ? "scale-125 ring-2 ring-offset-1 ring-slate-400"
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
    </div>
  );
}
