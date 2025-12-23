import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing (for build time)
export const supabase: SupabaseClient =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : createClient("https://placeholder.supabase.co", "placeholder-key");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export interface Score {
  id?: number;
  game: string;
  player: string;
  score: number;
  created_at?: string;
}

export const FAMILY_MEMBERS = [
  "Dad",
  "Mom",
  "Jonas",
  "Bo",
  "Oliver",
  "Torvald",
] as const;

export type FamilyMember = (typeof FAMILY_MEMBERS)[number];
