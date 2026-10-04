import { createClient } from "@supabase/supabase-js";

// 末尾のスラッシュや /rest/v1 などを安全に取り除く
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const cleanUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(
  cleanUrl && 
  supabaseAnonKey && 
  !cleanUrl.includes("your-project")
);

export const supabase = isSupabaseConfigured
  ? createClient(cleanUrl, supabaseAnonKey)
  : null;
