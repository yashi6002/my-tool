"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { X, Lock, Mail, User, LogIn, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; email: string }) => void;
}

function getJapaneseErrorMessage(err: unknown): string {
  if (!err) return "エラーが発生しました";
  const message = (err instanceof Error ? err.message : String(err)) || "";
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。入力内容をご確認ください。";
  }
  if (lower.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。ご案内メールをご確認いただくか、パスワードを確認してください。";
  }
  if (lower.includes("user already registered") || lower.includes("already exists")) {
    return "このメールアドレスは既に登録されています。「ログイン」タブよりログインしてください。";
  }
  if (lower.includes("over_email_send_rate_limit") || lower.includes("rate limit") || lower.includes("too many requests")) {
    return "一時的にアクセス制限がかかっています。少し時間をおいてから再度お試しください。";
  }
  if (lower.includes("password should be at least 6") || lower.includes("at least 6 characters")) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "通信エラーが発生しました。ネットワーク接続をご確認ください。";
  }
  return message || "認証に失敗しました。もう一度お試しください。";
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // モーダルオープン時に前回使用したメールアドレスを自動復元
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const lastEmail = localStorage.getItem("finance_last_email");
      if (lastEmail && !email) {
        setEmail(lastEmail);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
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
        let authUser: { id: string; email: string } | null = null;

        if (!isSignUp) {
          // ──────────────────────────────────────────
          // ログイン処理（ログインタブ）
          // ──────────────────────────────────────────
          // 1. まず標準の signInWithPassword を試行
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!signInRes.error && signInRes.data.user) {
            authUser = {
              id: signInRes.data.user.id,
              email: signInRes.data.user.email || cleanEmail,
            };
          } else {
            // 2. signInWithPassword が未確認アカウント等で弾かれた場合、
            //    signUp を自動照合（未確認ユーザーでも同一資格情報なら user.id を取得可能）
            const signUpRes = await supabase.auth.signUp({
              email: cleanEmail,
              password,
            });

            if (!signUpRes.error && signUpRes.data.user) {
              authUser = {
                id: signUpRes.data.user.id,
                email: signUpRes.data.user.email || cleanEmail,
              };
            } else {
              // 3. キャッシュされた UID があればレート制限時でも復旧
              const cachedUid = typeof window !== "undefined" ? localStorage.getItem(`finance_uid_${cleanEmail}`) : null;
              const isRateLimited =
                signInRes.error?.message?.toLowerCase().includes("rate limit") ||
                signUpRes.error?.message?.toLowerCase().includes("rate limit");

              if (cachedUid && isRateLimited) {
                authUser = { id: cachedUid, email: cleanEmail };
              } else {
                throw signInRes.error || signUpRes.error || new Error("ログインに失敗しました");
              }
            }
          }

          setSuccessMsg("ログインしました！");
        } else {
          // ──────────────────────────────────────────
          // 新規登録処理（新規登録タブ）
          // ──────────────────────────────────────────
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password,
          });

          if (!signUpRes.error && signUpRes.data.user) {
            // すでに登録済みのアカウント（identities が空など）の場合は signInWithPassword で自動ログイン
            if (signUpRes.data.user.identities && signUpRes.data.user.identities.length === 0) {
              const signInRes = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
              if (!signInRes.error && signInRes.data.user) {
                authUser = {
                  id: signInRes.data.user.id,
                  email: signInRes.data.user.email || cleanEmail,
                };
                setSuccessMsg("既存のアカウントとしてログインしました！");
              } else {
                throw new Error("このメールアドレスは既に登録されています。「ログイン」タブから正しいパスワードでログインしてください。");
              }
            } else {
              authUser = {
                id: signUpRes.data.user.id,
                email: signUpRes.data.user.email || cleanEmail,
              };
              setSuccessMsg("登録が完了しました！自動ログインします...");
            }
          } else {
            // すでに登録済みエラーの場合、signInWithPassword を自動試行
            const isAlreadyRegistered =
              signUpRes.error?.message?.toLowerCase().includes("already registered") ||
              signUpRes.error?.message?.toLowerCase().includes("already exists");

            if (isAlreadyRegistered) {
              const signInRes = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
              if (!signInRes.error && signInRes.data.user) {
                authUser = {
                  id: signInRes.data.user.id,
                  email: signInRes.data.user.email || cleanEmail,
                };
                setSuccessMsg("既存のアカウントとしてログインしました！");
              } else {
                throw new Error("このメールアドレスは既に登録されています。「ログイン」タブから正しいパスワードでログインしてください。");
              }
            } else {
              throw signUpRes.error || new Error("新規登録に失敗しました");
            }
          }
        }

        if (authUser) {
          if (typeof window !== "undefined") {
            localStorage.setItem("finance_last_email", cleanEmail);
            localStorage.setItem(`finance_uid_${cleanEmail}`, authUser.id);
          }
          setTimeout(() => {
            onAuthSuccess(authUser!);
            onClose();
          }, 500);
        }
      } else {
        // Supabase未設定環境（ローカルユーザーとしてログイン）
        const localUserId = `user_${btoa(cleanEmail).slice(0, 12).replace(/=/g, "")}`;
        if (typeof window !== "undefined") {
          localStorage.setItem("finance_last_email", cleanEmail);
          localStorage.setItem(`finance_uid_${cleanEmail}`, localUserId);
        }
        setSuccessMsg("ローカルユーザーとしてログインしました！");
        setTimeout(() => {
          onAuthSuccess({ id: localUserId, email: cleanEmail });
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      setErrorMsg(getJapaneseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // デモアカウントですぐ試す
  const handleQuickDemo = (demoEmail: string) => {
    const clean = demoEmail.trim().toLowerCase();
    const demoId = `demo_${clean.split("@")[0]}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("finance_last_email", clean);
    }
    onAuthSuccess({ id: demoId, email: clean });
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
          aria-label="閉じる"
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
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
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
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> パスワード（6文字以上）
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
