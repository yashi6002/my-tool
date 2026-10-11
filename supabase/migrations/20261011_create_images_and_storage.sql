-- ========================================================
-- 1. images テーブル（画像メタデータ管理用）
-- ========================================================
CREATE TABLE IF NOT EXISTS public.images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,      -- Storage 内の保存パス
    file_name TEXT NOT NULL,      -- 表示用の元ファイル名
    file_size BIGINT,             -- ファイル容量 (バイト)
    content_type TEXT,            -- MIMEタイプ (image/png, image/jpeg など)
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- フォルダごとの検索を高速化するインデックス
CREATE INDEX IF NOT EXISTS images_folder_id_idx ON public.images(folder_id);

-- images テーブルの RLS（全員アクセス許可）
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for all users on images" ON public.images;
CREATE POLICY "Allow all operations for all users on images" 
ON public.images FOR ALL 
USING (true) 
WITH CHECK (true);

-- ========================================================
-- 2. Supabase Storage バケット作成 & ポリシー
-- ========================================================
-- 'images' という名前の公開（public）ストレージバケットを作成
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ストレージオブジェクトの操作ポリシー（閲覧・アップロード・削除を許可）
DROP POLICY IF EXISTS "Public Access on images bucket" ON storage.objects;
CREATE POLICY "Public Access on images bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Upload on images bucket" ON storage.objects;
CREATE POLICY "Public Upload on images bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Delete on images bucket" ON storage.objects;
CREATE POLICY "Public Delete on images bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'images');

