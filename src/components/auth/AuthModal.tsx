"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { X, Lock, Mail, User, LogIn, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; email: string }) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("メールアドレスとパスワードを入力してください");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            setSuccessMsg("登録が完了しました！自動ログインします...");
            setTimeout(() => {
              onAuthSuccess({ id: data.user!.id, email: data.user!.email || email });
              onClose();
            }, 800);
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            setSuccessMsg("ログインしました！");
            setTimeout(() => {
              onAuthSuccess({ id: data.user!.id, email: data.user!.email || email });
              onClose();
            }, 500);
          }
        }
      } else {
        // Supabase未設定環境（ローカルストレージベースの擬似ログイン機能）
        const localUserId = `user_${btoa(email).slice(0, 12).replace(/=/g, "")}`;
        setSuccessMsg("ローカルユーザーとしてログインしました！");
        setTimeout(() => {
          onAuthSuccess({ id: localUserId, email });
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "認証に失敗しました";
      setErrorMsg(errMessage);
    } finally {
      setLoading(false);
    }
  };

  // デモアカウントですぐ試す
  const handleQuickDemo = (demoEmail: string) => {
    const demoId = `demo_${demoEmail.split("@")[0]}`;
    onAuthSuccess({ id: demoId, email: demoEmail });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景の微細なグロー装飾 */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* クローズボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* タイトル */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isSignUp ? "アカウント新規作成" : "ログイン"}
            </h2>
            <p className="text-xs text-slate-400">
              ユーザーごとに資金計画・カレンダーデータを安全に識別・管理します
            </p>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 mb-5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isSignUp
                ? "bg-slate-900 text-white shadow-sm border border-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> ログイン
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isSignUp
                ? "bg-slate-900 text-white shadow-sm border border-white/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> 新規登録
          </button>
        </div>

        {/* アラート */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> メールアドレス
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> パスワード（6文字以上）
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" /> アカウントを作成して始める
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> ログインしてデータを開く
              </>
            )}
          </button>
        </form>

        {/* クイックアカウント切り替え（テスト・デモ用） */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 mb-2">
            💡 複数ユーザーのデータ分離をすぐ試す:
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleQuickDemo("user1@example.com")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            >
              ユーザーA (user1)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("user2@example.com")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            >
              ユーザーB (user2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
