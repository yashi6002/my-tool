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
}

export type CreateFolderInput = {
  name: string;
};

export type CreateSnippetInput = {
  folder_id: string;
  title: string;
  content: string;
};
