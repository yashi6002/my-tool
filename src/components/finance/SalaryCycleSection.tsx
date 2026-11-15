"use client";

import { useState, useEffect } from "react";
import { PaydayCycle } from "@/types/finance";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

interface Props {
  cycle: PaydayCycle;
  onUpdateCycle: (c: PaydayCycle) => void;
  isHighlighted?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function SalaryCycleSection({
  cycle,
  onUpdateCycle,
  isHighlighted = false,
}: Props) {
  // プライバシー保護のため、初期状態は閉じた状態（または未設定時のみ開く）
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [localSalary, setLocalSalary] = useState(String(cycle?.salary || ""));
  const [localPayday, setLocalPayday] = useState(String(cycle?.payday || "25"));

  useEffect(() => {
    setLocalSalary(String(cycle?.salary || ""));
    setLocalPayday(String(cycle?.payday || "25"));
  }, [cycle?.salary, cycle?.payday]);

  // ハイライト時（「自分で設定する」クリック時など）にメインコンテナ内のみスムーズスクロール＆自動オープン
  useEffect(() => {
    if (isHighlighted) {
      setIsOpen(true);
      setIsEditing(true);
      setShowSalary(true);
      const timer = setTimeout(() => {
        const mainEl = document.querySelector("main");
        const targetEl = document.getElementById("salary-cycle-section");
        if (mainEl && targetEl) {
          const mainRect = mainEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          const offsetTop = mainEl.scrollTop + (targetRect.top - mainRect.top) - 16;
          mainEl.scrollTo({
            top: Math.max(0, offsetTop),
            behavior: "smooth",
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const handleSave = () => {
    const s = Math.max(0, parseInt(localSalary.replace(/,/g, ""), 10) || 0);
    const p = Math.max(1, Math.min(31, parseInt(localPayday, 10) || 25));
    onUpdateCycle({
      ...cycle,
      salary: s,
      payday: p,
    });
    setIsEditing(false);
  };

  const displaySalaryText =
    cycle?.salary === 0
      ? "未設定"
      : showSalary
      ? fmt(cycle.salary)
      : "¥••••••";

  return (
    <div
      id="salary-cycle-section"
      className={`w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border transition-all duration-300 shadow-sm dark:shadow-xl ${
        isHighlighted
          ? "border-emerald-500 ring-4 ring-emerald-500/30 dark:ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
          : "border-slate-200/80 dark:border-white/10"
      }`}
    >
      {/* アコーディオンヘッダー */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-nowrap">
                給与・給料日サイクル設定
              </h3>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono whitespace-nowrap">
                  手取り {displaySalaryText} (毎月{cycle?.payday || 25}日)
                </span>
                {cycle?.salary > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSalary((v) => !v);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 ml-0.5"
                    title={showSalary ? "金額を隠す（目隠し）" : "金額を表示する"}
                  >
                    {showSalary ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
              <Lock className="w-3 h-3 inline text-slate-400" />
              <span>プライベート設定：給与支給日を起点に残高・自由費を自動計算します</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title={isOpen ? "折りたたむ" : "展開する"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 展開コンテンツ */}
      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-200/60 dark:border-white/5 space-y-3 animate-in fade-in">
          {isEditing ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    今月の給与手取り額 (円) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="250000"
                    className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    value={localSalary}
                    onChange={(e) => setLocalSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    給料日 (毎月何日: 1〜31) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="25"
                    className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                    value={localPayday}
                    onChange={(e) => setLocalPayday(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl shadow-xs"
                >
                  設定を保存
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 block font-medium">基本給与（手取り支給額）</span>
                    {cycle?.salary > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSalary((v) => !v)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showSalary ? "金額を隠す" : "金額を表示する"}
                      >
                        {showSalary ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {displaySalaryText}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">毎月の給料日</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {cycle?.payday ? `毎月 ${cycle.payday} 日` : "毎月 25 日"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLocalSalary(String(cycle?.salary || ""));
                  setLocalPayday(String(cycle?.payday || "25"));
                  setIsEditing(true);
                }}
                className="self-end sm:self-auto text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 transition-all flex items-center gap-1 shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>給与・給料日を変更</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
