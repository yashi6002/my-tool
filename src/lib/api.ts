import { supabase, isSupabaseConfigured } from "./supabase";
import { Folder, Snippet, CreateFolderInput, CreateSnippetInput } from "@/types/database";

const LOCAL_FOLDERS_KEY = "my_tool_folders";
const LOCAL_SNIPPETS_KEY = "my_tool_snippets";

// ローカルストレージ初期シード
const defaultFolders: Folder[] = [
  { id: "demo-folder-1", name: "業務連絡・チャット", created_at: new Date().toISOString() },
  { id: "demo-folder-2", name: "メール定型文", created_at: new Date().toISOString() },
];

const defaultSnippets: Snippet[] = [
  {
    id: "demo-snippet-1",
    folder_id: "demo-folder-1",
    title: "朝の挨拶",
    content: "おはようございます！本日もよろしくお願いいたします。",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-snippet-2",
    folder_id: "demo-folder-1",
    title: "確認依頼",
    content: "お疲れ様です。お時間のある際にご確認のほどよろしくお願いいたします。",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-snippet-3",
    folder_id: "demo-folder-2",
    title: "お礼メール",
    content: "いつも大変お世話になっております。\n迅速にご対応いただき誠にありがとうございました。\n引き続きよろしくお願い申し上げます。",
    created_at: new Date().toISOString(),
  },
];

function getLocalData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

// ----------------------------------------------------
// フォルダ操作 API
// ----------------------------------------------------
export async function getFolders(): Promise<Folder[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching folders:", error.message);
      throw error;
    }
    return data || [];
  }

  // ローカルフォールバック
  let folders = getLocalData<Folder[]>(LOCAL_FOLDERS_KEY, defaultFolders);
  if (!localStorage.getItem(LOCAL_FOLDERS_KEY)) {
    setLocalData(LOCAL_FOLDERS_KEY, defaultFolders);
  }
  return folders;
}

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .insert([{ name: input.name.trim() }])
      .select()
      .single();

    if (error) {
      console.error("Error creating folder:", error.message);
      throw error;
    }
    return data;
  }

  // ローカルフォールバック
  const newFolder: Folder = {
    id: `local-folder-${Date.now()}`,
    name: input.name.trim(),
    created_at: new Date().toISOString(),
  };
  const folders = getLocalData<Folder[]>(LOCAL_FOLDERS_KEY, defaultFolders);
  const updated = [...folders, newFolder];
  setLocalData(LOCAL_FOLDERS_KEY, updated);
  return newFolder;
}

export async function deleteFolder(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("folders").delete().eq("id", id);
    if (error) {
      console.error("Error deleting folder:", error.message);
      throw error;
    }
    return;
  }

  // ローカルフォールバック
  const folders = getLocalData<Folder[]>(LOCAL_FOLDERS_KEY, defaultFolders);
  const updatedFolders = folders.filter((f) => f.id !== id);
  setLocalData(LOCAL_FOLDERS_KEY, updatedFolders);

  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  const updatedSnippets = snippets.filter((s) => s.folder_id !== id);
  setLocalData(LOCAL_SNIPPETS_KEY, updatedSnippets);
}

// ----------------------------------------------------
// 定型文（スニペット）操作 API
// ----------------------------------------------------
export async function getSnippetsByFolder(folderId: string): Promise<Snippet[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching snippets:", error.message);
      throw error;
    }
    return data || [];
  }

  // ローカルフォールバック
  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  if (!localStorage.getItem(LOCAL_SNIPPETS_KEY)) {
    setLocalData(LOCAL_SNIPPETS_KEY, defaultSnippets);
  }
  return snippets
    .filter((s) => s.folder_id === folderId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("snippets")
      .insert([
        {
          folder_id: input.folder_id,
          title: input.title.trim(),
          content: input.content,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating snippet:", error.message);
      throw error;
    }
    return data;
  }

  // ローカルフォールバック
  const newSnippet: Snippet = {
    id: `local-snippet-${Date.now()}`,
    folder_id: input.folder_id,
    title: input.title.trim(),
    content: input.content,
    created_at: new Date().toISOString(),
  };
  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  const updated = [newSnippet, ...snippets];
  setLocalData(LOCAL_SNIPPETS_KEY, updated);
  return newSnippet;
}

export async function deleteSnippet(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("snippets").delete().eq("id", id);
    if (error) {
      console.error("Error deleting snippet:", error.message);
      throw error;
    }
    return;
  }

  // ローカルフォールバック
  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  const updated = snippets.filter((s) => s.id !== id);
  setLocalData(LOCAL_SNIPPETS_KEY, updated);
}
