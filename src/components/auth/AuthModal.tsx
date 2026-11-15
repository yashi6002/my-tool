"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  X,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  ShieldAlert,
  Clock,
  HelpCircle,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; email: string }) => void;
}

type AuthMode = "login" | "signup" | "forgot_password";

const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5分間の制限

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
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 10回失敗ごとのログイン制限ステート
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  // モーダルオープン時の初期化 ＆ 制限タイマー復旧
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const lastEmail = localStorage.getItem("finance_last_email");
      if (lastEmail && !email) {
        setEmail(lastEmail);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setPassword("");

      // 既存の制限情報をチェック
      const savedAttempts = parseInt(localStorage.getItem("finance_failed_attempts") || "0", 10);
      setFailedAttempts(isNaN(savedAttempts) ? 0 : savedAttempts);

      const lockoutUntil = parseInt(localStorage.getItem("finance_lockout_until") || "0", 10);
      const remainingMs = lockoutUntil - Date.now();
      if (remainingMs > 0) {
        setLockoutRemainingSeconds(Math.ceil(remainingMs / 1000));
      } else {
        setLockoutRemainingSeconds(0);
        if (lockoutUntil > 0) {
          localStorage.removeItem("finance_lockout_until");
          localStorage.removeItem("finance_failed_attempts");
          setFailedAttempts(0);
        }
      }
    }
  }, [isOpen]);

  // 制限解除カウントダウンタイマー
  useEffect(() => {
    if (lockoutRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (typeof window !== "undefined") {
            localStorage.removeItem("finance_lockout_until");
            localStorage.removeItem("finance_failed_attempts");
          }
          setFailedAttempts(0);
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemainingSeconds]);

  if (!isOpen) return null;

  const isLockedOut = lockoutRemainingSeconds > 0;

  // 失敗回数インクリメント＆10回到達時のロック発動
  const recordFailedAttempt = (baseErrorMessage: string) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (typeof window !== "undefined") {
      localStorage.setItem("finance_failed_attempts", String(nextAttempts));
    }

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      if (typeof window !== "undefined") {
        localStorage.setItem("finance_lockout_until", String(lockUntil));
      }
      setLockoutRemainingSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      setErrorMsg(
        `連続で10回ログインに失敗したため、アカウント保護のため5分間ログインが制限されます。パスワードをお忘れの場合は「パスワードをお忘れの方」より再設定をお試しください。`
      );
    } else {
      setErrorMsg(`${baseErrorMessage}（失敗: ${nextAttempts}/${MAX_LOGIN_ATTEMPTS}回。10回で一時制限されます）`);
    }
  };

  // ログイン成功時のカウンター完全リセット
  const resetAttemptCounters = () => {
    setFailedAttempts(0);
    setLockoutRemainingSeconds(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("finance_failed_attempts");
      localStorage.removeItem("finance_lockout_until");
    }
  };

  // パスワード再設定メール送信処理
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("登録したメールアドレスを入力してください");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });

        if (error) {
          throw error;
        }

        setSuccessMsg(
          "パスワード再設定用の案内メールを送信しました。受信トレイ（または迷惑メールフォルダ）をご確認いただき、リンクから新しいパスワードを設定してください。"
        );
      } else {
        // ローカル環境
        setSuccessMsg(
          "ローカル環境ではパスワード再設定メールは送信されません。任意の新しいパスワードでそのままログインいただけます。"
        );
      }
    } catch (err: unknown) {
      setErrorMsg(getJapaneseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ログイン／新規登録送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === "login" && isLockedOut) {
      const minutes = Math.floor(lockoutRemainingSeconds / 60);
      const seconds = lockoutRemainingSeconds % 60;
      setErrorMsg(
        `連続10回失敗によりログインが制限されています。解除まで残り ${minutes}分${seconds}秒 お待ちいただくか、パスワードの再設定をご利用ください。`
      );
      return;
    }

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

        if (mode === "login") {
          // ──────────────────────────────────────────
          // ログイン処理（ログインタブ）
          // ──────────────────────────────────────────
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
            // 未確認アカウント向けに signUp 照合を試行
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
              // キャッシュ確認
              const cachedUid = typeof window !== "undefined" ? localStorage.getItem(`finance_uid_${cleanEmail}`) : null;
              const isRateLimited =
                signInRes.error?.message?.toLowerCase().includes("rate limit") ||
                signUpRes.error?.message?.toLowerCase().includes("rate limit");

              if (cachedUid && isRateLimited) {
                authUser = { id: cachedUid, email: cleanEmail };
              } else {
                const rawErr = signInRes.error || signUpRes.error || new Error("ログインに失敗しました");
                const errorStr = getJapaneseErrorMessage(rawErr);
                recordFailedAttempt(errorStr);
                return;
              }
            }
          }

          resetAttemptCounters();
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
                resetAttemptCounters();
                setSuccessMsg("既存のアカウントとしてログインしました！");
              } else {
                throw new Error("このメールアドレスは既に登録されています。「ログイン」タブから正しいパスワードでログインしてください。");
              }
            } else {
              authUser = {
                id: signUpRes.data.user.id,
                email: signUpRes.data.user.email || cleanEmail,
              };
              resetAttemptCounters();
              setSuccessMsg("登録が完了しました！自動ログインします...");
            }
          } else {
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
                resetAttemptCounters();
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
        resetAttemptCounters();
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

  // デモアカウント
  const handleQuickDemo = (demoEmail: string) => {
    resetAttemptCounters();
    const clean = demoEmail.trim().toLowerCase();
    const demoId = `demo_${clean.split("@")[0]}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("finance_last_email", clean);
    }
    onAuthSuccess({ id: demoId, email: clean });
    onClose();
  };

  // 制限時間のフォーマット表示（分:秒）
  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs < 10 ? "0" : ""}${secs}秒`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景装飾 */}
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

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md">
            {mode === "forgot_password" ? <KeyRound className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === "forgot_password"
                ? "パスワードの再設定"
                : mode === "signup"
                ? "アカウント新規作成"
                : "ログイン"}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === "forgot_password"
                ? "ご登録のメールアドレスに再設定用のご案内を送信します"
                : "ユーザーごとに資金計画・カレンダーデータを安全に管理します"}
            </p>
          </div>
        </div>

        {/* タブ切り替え（再設定画面以外で表示） */}
        {mode !== "forgot_password" ? (
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "login"
                  ? "bg-slate-900 text-white shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> ログイン
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === "signup"
                  ? "bg-slate-900 text-white shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> 新規登録
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMsg(null); setSuccessMsg(null); }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ログイン画面に戻る
            </button>
          </div>
        )}

        {/* 10回連続失敗によるロックアウト警告 */}
        {mode === "login" && isLockedOut && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">ログイン試行回数の制限中</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                連続で10回ログインに失敗したため、一時的に制限されています。
                <br />
                解除まで残り: <span className="font-mono font-bold text-white text-xs px-1 py-0.5 rounded bg-amber-500/20">{formatLockoutTime(lockoutRemainingSeconds)}</span>
              </p>
            </div>
          </div>
        )}

        {/* 失敗回数の事前アラート（5回以上失敗時に注意表示） */}
        {mode === "login" && !isLockedOut && failedAttempts >= 5 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" /> 連続失敗回数
            </span>
            <span className="font-mono font-bold text-amber-400">
              {failedAttempts} / {MAX_LOGIN_ATTEMPTS} 回
            </span>
          </div>
        )}

        {/* アラートメッセージ */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* フォーム切り替え */}
        {mode === "forgot_password" ? (
          // ── パスワード再設定フォーム ──
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> ご登録のメールアドレス
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> 再設定リンクを送信する
                </>
              )}
            </button>

            {/* パスワードを忘れたときのガイダンス・Tips */}
            <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" /> メールが届かない場合の対処法
              </p>
              <p>・迷惑メールフォルダやゴミ箱に振り分けられていないかご確認ください。</p>
              <p>・メール受信制限や誤入力がないかアドレスを再確認してください。</p>
              <p>・アカウントの新規登録から同一アドレスで再作成することも可能です。</p>
            </div>
          </form>
        ) : (
          // ── ログイン / 新規登録フォーム ──
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> パスワード（6文字以上）
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_password");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                  >
                    パスワードをお忘れですか？
                  </button>
                )}
              </div>
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
              disabled={loading || (mode === "login" && isLockedOut)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" && isLockedOut ? (
                <>
                  <Clock className="w-4 h-4" /> {formatLockoutTime(lockoutRemainingSeconds)} 後に再試行可能
                </>
              ) : mode === "signup" ? (
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
        )}

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
