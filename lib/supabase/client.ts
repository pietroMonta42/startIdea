import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";

// Per evitare che createBrowserClient() tiri in fase di build/prerender
// quando le env non sono ancora presenti, usiamo placeholder sicuri.
export const isSupabaseConfigured = Boolean(url && key);

export const supabase = createBrowserClient(
  isSupabaseConfigured ? url : "https://placeholder.supabase.co",
  isSupabaseConfigured ? key : "placeholder-publishable-key"
);