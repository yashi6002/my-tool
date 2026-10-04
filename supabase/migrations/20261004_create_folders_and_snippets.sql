-- ========================================================
-- マイグレーション: folders および snippets テーブルの作成
-- ========================================================

-- 1. folders テーブル（フォルダ / カテゴリ管理）
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. snippets テーブル（定型文管理）
CREATE TABLE IF NOT EXISTS public.snippets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- フォルダごとの一覧取得を高速化するためのインデックス
CREATE INDEX IF NOT EXISTS snippets_folder_id_idx ON public.snippets(folder_id);

-- 3. Row Level Security (RLS) の設定
-- 認証未導入の初期プロトタイプ段階のため、全アクセスを許可します。
-- （将来 Supabase Auth 導入時に auth.uid() = user_id のポリシーへ移行可能）
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for all users on folders" ON public.folders;
CREATE POLICY "Allow all operations for all users on folders" 
ON public.folders FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for all users on snippets" ON public.snippets;
CREATE POLICY "Allow all operations for all users on snippets" 
ON public.snippets FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. 初期サンプルデータ（任意で実行可能）
INSERT INTO public.folders (id, name) VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '業務連絡・チャット'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'メール定型文')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.snippets (folder_id, title, content) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '朝の挨拶', 'おはようございます！本日もよろしくお願いいたします。'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '確認依頼', 'お疲れ様です。お時間のある際にご確認のほどよろしくお願いいたします。'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'お礼メール', 'いつも大変お世話になっております。迅速にご対応いただき誠にありがとうございました。引き続きよろしくお願い申し上げます。')
ON CONFLICT (id) DO NOTHING;
