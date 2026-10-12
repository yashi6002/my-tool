-- ========================================================
-- マイグレーション: games テーブル（ソシャゲ進捗＆アカウント管理ポータル）
-- ========================================================

CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,                          -- ゲームタイトル名
    icon_url TEXT,                                -- アプリアイコン画像URL
    screenshot_url TEXT,                          -- 最新スクショURL
    status TEXT DEFAULT 'main' NOT NULL,          -- ステータス: 'main'(メインプレイ中), 'login_only'(ログインのみ), 'paused'(休止中), 'retired'(引退)
    currency_amount TEXT,                         -- 所持資材・ガチャ石 (例: "無償32,000石 (160連分)")
    player_level TEXT,                            -- プレイヤーLv/ランク (例: "Rank 152 / 指揮官Lv.80")
    progress_memo TEXT,                           -- 進行度メモ (例: "メインストーリー7章クリア、イベント攻略中")
    login_id TEXT,                                -- ログインID / ユーザー名 / メールアドレス
    password_code TEXT,                           -- パスワード / 引継ぎコード
    linked_account TEXT,                          -- 連携アカウント (例: "Apple ID連携済", "Googleアカウント")
    official_url TEXT,                            -- 公式サイト URL
    twitter_url TEXT,                             -- 公式X(Twitter) URL
    store_url TEXT,                               -- アプリストア/DL URL (App Store / Google Play / Steam等)
    event_title TEXT,                             -- 現在開催中のイベント/注目ガチャ名
    event_end_date DATE,                          -- イベント終了日 / 期限
    gacha_update_date DATE,                       -- 次回ガチャ更新日
    is_favorite BOOLEAN DEFAULT false NOT NULL,   -- お気に入りスター
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS（全員アクセス許可）
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for all users on games" ON public.games;
CREATE POLICY "Allow all operations for all users on games" 
ON public.games FOR ALL 
USING (true) 
WITH CHECK (true);

-- インデックス
CREATE INDEX IF NOT EXISTS games_status_idx ON public.games(status);
CREATE INDEX IF NOT EXISTS games_event_end_date_idx ON public.games(event_end_date);

-- 初期サンプルデータの投入（ポータルの雰囲気が一目でわかる充実データ）
INSERT INTO public.games (
    title, icon_url, status, currency_amount, player_level, 
    progress_memo, login_id, password_code, linked_account, 
    official_url, twitter_url, store_url, 
    event_title, event_end_date, gacha_update_date, is_favorite
) VALUES 
(
    'ブルーアーカイブ (Blue Archive)',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
    'main',
    '青輝石 36,000個 (天井分確保済)',
    '先生Lv. 90 (カンスト)',
    '最終編第4章読了。総力戦プラチナトロフィー目標で育成中',
    'sensei_univ2026@gmail.com',
    'BA-Pass-9942a!',
    'Yostar ID連携 / Apple ID',
    'https://bluearchive.jp/',
    'https://twitter.com/Blue_Archive_JP',
    'https://apps.apple.com/jp/app/id1510447050',
    '3.5周年記念フェス募集＆総力戦',
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '7 days',
    true
),
(
    '原神 (Genshin Impact)',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&h=150&fit=crop',
    'login_only',
    '原石 14,200個 / 紡がれた運命 12個',
    '冒険ランク 58 / 世界ランク 8',
    'ナタ編第2幕まで進行。デイリーと樹脂消費のみ日課中',
    'genshin_player_77@mihoyo.com',
    'Hoyoverse#8841',
    'HoYoverse通行証 / Google',
    'https://genshin.hoyoverse.com/ja',
    'https://twitter.com/Genshin_Impact_JP',
    'https://apps.apple.com/jp/app/id1517783697',
    'テーマイベント「彩る祭典」',
    CURRENT_DATE + INTERVAL '12 days',
    CURRENT_DATE + INTERVAL '15 days',
    false
),
(
    'Fate/Grand Order',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&h=150&fit=crop',
    'paused',
    '聖晶石 450個 / 呼符 35枚',
    'マスターLv. 142',
    '第2部第7章「ナウイ・ミクトラン」中盤で停止中。周年で復帰予定',
    '引き継ぎID: ABCD-1234-EFGH',
    'FgoPasswd2026',
    '引き継ぎコード発行済 (メモ保存必須)',
    'https://www.fate-go.jp/',
    'https://twitter.com/fgoproject',
    'https://apps.apple.com/jp/app/id1015521926',
    '復刻ピックアップ召喚',
    CURRENT_DATE + INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '3 days',
    true
)
ON CONFLICT (id) DO NOTHING;

