import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
  return { url, key, secretKey, configured: Boolean(url && key) };
}

/** Server-side Supabase client bound to Next.js request/response cookies. */
export async function createSupabaseServerClient() {
  const { url, key, configured } = getSupabaseEnv();
  if (!configured) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/** Admin client (service_role) solo lato server, se SUPABASE_SECRET_KEY è configurata. */
export function createSupabaseAdminClient() {
  const { url, secretKey } = getSupabaseEnv();
  if (!url || !secretKey) return null;
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
