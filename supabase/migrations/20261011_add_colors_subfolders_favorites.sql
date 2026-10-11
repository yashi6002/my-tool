-- ========================================================
-- マイグレーション: フォルダ階層化 (parent_id)、カラー/アイコン、お気に入り機能
-- ========================================================

-- 1. folders テーブルに親フォルダ参照 (parent_id)、カラー、アイコンを追加
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';

-- 親フォルダ検索インデックス
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON public.folders(parent_id);

-- 2. snippets テーブルにお気に入りフラグ (is_favorite) を追加
ALTER TABLE public.snippets 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false NOT NULL;

-- 3. images テーブルにお気に入りフラグ (is_favorite) を追加
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false NOT NULL;

-- 4. サンプル階層データの投入（既存データとの共存対応）
-- 子フォルダ・孫フォルダのサンプル
DO $$
DECLARE
  v_parent_id UUID;
  v_child_id UUID;
BEGIN
  -- 既存の「業務連絡・チャット」を取得
  SELECT id INTO v_parent_id FROM public.folders WHERE name = '業務連絡・チャット' LIMIT 1;
  
  IF v_parent_id IS NOT NULL THEN
    -- カラーとアイコンを更新
    UPDATE public.folders SET color = 'blue', icon = 'briefcase' WHERE id = v_parent_id;

    -- 子フォルダ作成: 「チャット用（Slack・Teams）」
    INSERT INTO public.folders (name, parent_id, color, icon)
    VALUES ('チャット用（Slack/Teams）', v_parent_id, 'indigo', 'message-square')
    RETURNING id INTO v_child_id;

    -- 孫フォルダ作成: 「定例ミーティング」
    IF v_child_id IS NOT NULL THEN
      INSERT INTO public.folders (name, parent_id, color, icon)
      VALUES ('定例ミーティング', v_child_id, 'purple', 'calendar');
    END IF;
  END IF;

  -- 既存の「メール定型文」にカラー・アイコンを設定
  UPDATE public.folders SET color = 'emerald', icon = 'mail' WHERE name = 'メール定型文';
END $$;
