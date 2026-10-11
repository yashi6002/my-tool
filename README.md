# Snippet Flow (定型文 ＆ 画像アセットマネージャー)

Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL & Storage) を利用した定型文＆画像アセット管理アプリケーションです。

## 主な機能
- **フォルダ（カテゴリ）作成・管理機能**: 業務連絡、メール定型文などのカテゴリ分類
- **定型文（スニペット）の登録・一覧表示**: 選択中フォルダに紐づく定型文の管理、タイトル・本文の登録
- **ワンタップコピー機能**: クリック一つでクリップボードにコピー & 「コピーしました!」の視覚的フィードバック
- **画像アップロード機能（第3週）**: ドラッグ＆ドロップまたはファイル選択による Supabase Storage への画像アップロード
- **画像一覧表示（ギャラリー）（第3週）**: フォルダごとのサムネイル一覧、キーワード検索、拡大プレビューモーダル
- **画像ダウンロード機能（第3週）**: 元のファイル名でワンクリックローカルダウンロード保存
- **画像削除機能（第3週）**: 不要画像のクラウドストレージ＆DBからのクリーン削除
- **タブ切り替えUI**: 「テキスト定型文」と「画像ギャラリー」のスムーズな切り替え

---

## セットアップ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Supabase のセットアップ
1. [Supabase](https://supabase.com/) のプロジェクトを開きます。
2. 左メニューの **SQL Editor** を開きます。
3. 以下のSQLマイグレーションファイルを順に（またはまとめて）貼り付けて **Run** を実行します：
   - 第2週: `supabase/migrations/20261004_create_folders_and_snippets.sql`
   - 第3週: `supabase/migrations/20261011_create_images_and_storage.sql` (Storageバケット作成 & 画像テーブル)
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
