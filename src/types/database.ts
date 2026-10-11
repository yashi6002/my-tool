export interface Folder {
  id: string;
  name: string;
  created_at: string;
}

export interface Snippet {
  id: string;
  folder_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface FolderWithCount extends Folder {
  snippet_count?: number;
  image_count?: number;
}

export type CreateFolderInput = {
  name: string;
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
  created_at: string;
}

export type CreateImageInput = {
  folder_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  content_type?: string;
};
