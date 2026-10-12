export type FolderColor = 
  | "blue" 
  | "emerald" 
  | "purple" 
  | "amber" 
  | "rose" 
  | "indigo" 
  | "cyan" 
  | "orange";

export type FolderIconType = 
  | "folder" 
  | "briefcase" 
  | "mail" 
  | "message-square" 
  | "book" 
  | "code" 
  | "lightbulb" 
  | "heart" 
  | "star" 
  | "calendar";

export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
  color?: FolderColor;
  icon?: FolderIconType;
  created_at: string;
}

export interface FolderTreeNode extends Folder {
  children?: FolderTreeNode[];
  depth?: number;
}

export interface Snippet {
  id: string;
  folder_id: string;
  title: string;
  content: string;
  is_favorite?: boolean;
  created_at: string;
}

export interface FolderWithCount extends Folder {
  snippet_count?: number;
  image_count?: number;
}

export type CreateFolderInput = {
  name: string;
  parent_id?: string | null;
  color?: FolderColor;
  icon?: FolderIconType;
};

export type CreateSnippetInput = {
  folder_id: string;
  title: string;
  content: string;
};

export type UpdateSnippetInput = {
  title?: string;
  content?: string;
  folder_id?: string;
};

export interface ImageItem {
  id: string;
  folder_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  content_type?: string;
  public_url: string;
  is_favorite?: boolean;
  created_at: string;
}

export type CreateImageInput = {
  folder_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  content_type?: string;
};

export type UpdateImageInput = {
  file_name?: string;
  folder_id?: string;
};

// ========================================================
// ソシャゲ進捗＆アカウント管理ポータル用 型定義
// ========================================================
export type GameStatus = "main" | "login_only" | "paused" | "retired";

export interface GameItem {
  id: string;
  title: string;
  icon_url?: string;
  screenshot_url?: string;
  status: GameStatus;
  currency_amount?: string;
  player_level?: string;
  progress_memo?: string;
  login_id?: string;
  password_code?: string;
  linked_account?: string;
  official_url?: string;
  twitter_url?: string;
  store_url?: string;
  event_title?: string;
  event_end_date?: string; // YYYY-MM-DD
  gacha_update_date?: string; // YYYY-MM-DD
  is_favorite?: boolean;
  created_at: string;
  updated_at?: string;
}

export type CreateGameInput = Omit<GameItem, "id" | "created_at" | "updated_at">;
export type UpdateGameInput = Partial<CreateGameInput>;
