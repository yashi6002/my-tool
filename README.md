# Snippet Flow (定型文・スニペットマネージャー)

Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL) を利用した定型文管理アプリケーションです。

## 主な機能（第2週）
- **フォルダ（カテゴリ）作成・管理機能**: 業務連絡、メール定型文などのカテゴリ分類
- **定型文（スニペット）の登録・一覧表示**: 選択中フォルダに紐づく定型文の管理、タイトル・本文の登録
- **ワンタップコピー機能**: クリック一つでクリップボードにコピー & 「コピーしました!」の視覚的フィードバック
- **検索機能**: タイトルや本文のリアルタイムキーワード検索
- **ローカルフォールバックモード**: Supabase未接続時でもブラウザローカルストレージで即座に動作確認可能

---

## セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Supabase のセットアップ
1. [Supabase](https://supabase.com/) でプロジェクトを作成します。
2. 左メニューの **SQL Editor** を開きます。
3. `supabase/migrations/20261004_create_folders_and_snippets.sql` の内容を貼り付けて **Run** を実行します。
4. Supabase の **Project Settings** > **API** から以下を取得します:
   - `Project URL`
   - `anon public key`

### 3. 環境変数の設定
`.env.local` ファイルに取得した接続情報を記入します:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

※ 未設定の場合でも自動的にローカル保存モードで動作し、UIの挙動をテストできます。

### 4. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてご利用ください。
