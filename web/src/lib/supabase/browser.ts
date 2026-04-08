import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  const { key, url } = getSupabaseEnv();

  return createBrowserClient<Database>(url, key);
}
