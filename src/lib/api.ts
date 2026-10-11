import { supabase, isSupabaseConfigured } from "./supabase";
import {
  Folder,
  Snippet,
  CreateFolderInput,
  CreateSnippetInput,
  ImageItem,
} from "@/types/database";

const LOCAL_FOLDERS_KEY = "my_tool_folders";
const LOCAL_SNIPPETS_KEY = "my_tool_snippets";
const LOCAL_IMAGES_KEY = "my_tool_images";

const STORAGE_BUCKET = "images";

// ローカルストレージ初期シード（階層化＆カラー対応）
const defaultFolders: Folder[] = [
  {
    id: "demo-folder-1",
    name: "業務連絡・チャット",
    parent_id: null,
    color: "blue",
    icon: "briefcase",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-folder-1-1",
    name: "チャット用（Slack/Teams）",
    parent_id: "demo-folder-1",
    color: "indigo",
    icon: "message-square",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-folder-1-1-1",
    name: "定例ミーティング",
    parent_id: "demo-folder-1-1",
    color: "purple",
    icon: "calendar",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-folder-2",
    name: "メール定型文",
    parent_id: null,
    color: "emerald",
    icon: "mail",
    created_at: new Date().toISOString(),
  },
];

const defaultSnippets: Snippet[] = [
  {
    id: "demo-snippet-1",
    folder_id: "demo-folder-1",
    title: "朝の挨拶",
    content: "おはようございます！本日もよろしくお願いいたします。",
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-snippet-2",
    folder_id: "demo-folder-1",
    title: "確認依頼",
    content: "お疲れ様です。お時間のある際にご確認のほどよろしくお願いいたします。",
    is_favorite: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-snippet-3",
    folder_id: "demo-folder-1-1",
    title: "離席連絡",
    content: "少し離席します。10分程度で戻ります。",
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-snippet-4",
    folder_id: "demo-folder-2",
    title: "お礼メール",
    content: "いつも大変お世話になっております。\n迅速にご対応いただき誠にありがとうございました。\n引き続きよろしくお願い申し上げます。",
    is_favorite: false,
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
  const color = input.color || "blue";
  const icon = input.icon || "folder";
  const parent_id = input.parent_id || null;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name: input.name.trim(),
          parent_id,
          color,
          icon,
        },
      ])
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
    parent_id,
    color,
    icon,
    created_at: new Date().toISOString(),
  };
  const folders = getLocalData<Folder[]>(LOCAL_FOLDERS_KEY, defaultFolders);
  const updated = [...folders, newFolder];
  setLocalData(LOCAL_FOLDERS_KEY, updated);
  return newFolder;
}

export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, "name" | "color" | "icon">>
): Promise<Folder> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("folders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating folder:", error.message);
      throw error;
    }
    return data;
  }

  // ローカルフォールバック
  const folders = getLocalData<Folder[]>(LOCAL_FOLDERS_KEY, defaultFolders);
  const updated = folders.map((f) => (f.id === id ? { ...f, ...updates } : f));
  setLocalData(LOCAL_FOLDERS_KEY, updated);
  return updated.find((f) => f.id === id)!;
}

// フォルダとその子孫フォルダIDをすべて再帰的に取得
export function getDescendantFolderIds(folders: Folder[], rootId: string): string[] {
  const result: string[] = [rootId];
  const children = folders.filter((f) => f.parent_id === rootId);
  for (const child of children) {
    result.push(...getDescendantFolderIds(folders, child.id));
  }
  return result;
}

export async function deleteFolder(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    // ON DELETE CASCADEにより子フォルダ・スニペット・画像はDB側で自動削除
    const { error } = await supabase.from("folders").delete().eq("id", id);
    if (error) {
      console.error("Error deleting folder:", error.message);
      throw error;
    }
    return;
  }

  // ローカルフォールバック
  const folders = getLocalData<Folder[]>(LOCAL_FOLDERS_KEY, defaultFolders);
  const deleteIds = new Set(getDescendantFolderIds(folders, id));

  const updatedFolders = folders.filter((f) => !deleteIds.has(f.id));
  setLocalData(LOCAL_FOLDERS_KEY, updatedFolders);

  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  const updatedSnippets = snippets.filter((s) => !deleteIds.has(s.folder_id));
  setLocalData(LOCAL_SNIPPETS_KEY, updatedSnippets);

  const images = getLocalData<ImageItem[]>(LOCAL_IMAGES_KEY, []);
  const updatedImages = images.filter((img) => !deleteIds.has(img.folder_id));
  setLocalData(LOCAL_IMAGES_KEY, updatedImages);
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
          is_favorite: false,
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
    is_favorite: false,
    created_at: new Date().toISOString(),
  };
  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  const updated = [newSnippet, ...snippets];
  setLocalData(LOCAL_SNIPPETS_KEY, updated);
  return newSnippet;
}

export async function toggleSnippetFavorite(id: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("snippets")
      .update({ is_favorite: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error toggling favorite:", error.message);
      throw error;
    }
    return newStatus;
  }

  // ローカルフォールバック
  const snippets = getLocalData<Snippet[]>(LOCAL_SNIPPETS_KEY, defaultSnippets);
  const updated = snippets.map((s) => (s.id === id ? { ...s, is_favorite: newStatus } : s));
  setLocalData(LOCAL_SNIPPETS_KEY, updated);
  return newStatus;
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

// ----------------------------------------------------
// 画像（Images & Supabase Storage）操作 API
// ----------------------------------------------------
export async function getImagesByFolder(folderId: string): Promise<ImageItem[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error.message);
      throw error;
    }

    if (!data) return [];

    return data.map((item) => {
      const { data: urlData } = supabase!.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(item.file_path);
      return {
        ...item,
        public_url: urlData.publicUrl,
      };
    });
  }

  // ローカルフォールバック
  const images = getLocalData<ImageItem[]>(LOCAL_IMAGES_KEY, []);
  return images
    .filter((img) => img.folder_id === folderId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function uploadImage(folderId: string, file: File): Promise<ImageItem> {
  if (isSupabaseConfigured && supabase) {
    const fileExt = file.name.split(".").pop() || "jpg";
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 30);
    const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${folderId}/${uniqueKey}_${sanitizedBase}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      throw new Error(`ストレージへのアップロードに失敗しました: ${uploadError.message}`);
    }

    const { data: inserted, error: dbError } = await supabase
      .from("images")
      .insert([
        {
          folder_id: folderId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type || "image/jpeg",
          is_favorite: false,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError.message);
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw new Error(`データベースへの登録に失敗しました: ${dbError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      ...inserted,
      public_url: urlData.publicUrl,
    };
  }

  // ローカルフォールバック
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newImage: ImageItem = {
        id: `local-image-${Date.now()}`,
        folder_id: folderId,
        file_path: `local/${file.name}`,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type,
        public_url: dataUrl,
        is_favorite: false,
        created_at: new Date().toISOString(),
      };
      const images = getLocalData<ImageItem[]>(LOCAL_IMAGES_KEY, []);
      setLocalData(LOCAL_IMAGES_KEY, [newImage, ...images]);
      resolve(newImage);
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

export async function toggleImageFavorite(id: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("images")
      .update({ is_favorite: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error toggling image favorite:", error.message);
      throw error;
    }
    return newStatus;
  }

  // ローカルフォールバック
  const images = getLocalData<ImageItem[]>(LOCAL_IMAGES_KEY, []);
  const updated = images.map((img) => (img.id === id ? { ...img, is_favorite: newStatus } : img));
  setLocalData(LOCAL_IMAGES_KEY, updated);
  return newStatus;
}

export async function deleteImage(id: string, filePath: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error: dbError } = await supabase
      .from("images")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Database delete error:", dbError.message);
      throw dbError;
    }

    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (storageError) {
        console.warn("Storage delete warning:", storageError.message);
      }
    }
    return;
  }

  // ローカルフォールバック
  const images = getLocalData<ImageItem[]>(LOCAL_IMAGES_KEY, []);
  setLocalData(
    LOCAL_IMAGES_KEY,
    images.filter((img) => img.id !== id)
  );
}

export async function downloadImage(publicUrl: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(publicUrl);
    if (!response.ok) throw new Error("ダウンロードに失敗しました");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
    const link = document.createElement("a");
    link.href = publicUrl;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }
}
