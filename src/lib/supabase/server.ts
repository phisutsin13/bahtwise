import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "./config";

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — the proxy refreshes the session.
        }
      },
    },
  });
}

/**
 * Service-role client used only on the server to resolve a username to an
 * email for password sign-in. It never ships to the browser.
 */
export function createSupabaseAdminClient() {
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!isSupabaseConfigured || serviceRole.length < 20) return null;
  return createClient(SUPABASE_URL, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
