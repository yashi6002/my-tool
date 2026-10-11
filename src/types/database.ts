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
