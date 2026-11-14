const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;

/**
 * Sign-up and cloud auth stay disabled until a real Supabase project is
 * configured. Empty values from .env.example deliberately fall through.
 */
export const isSupabaseConfigured =
  /^https?:\/\//.test(url) &&
  anonKey.length > 20 &&
  !url.includes("your-project") &&
  !anonKey.includes("your-anon-key");

export const DEMO_SESSION_KEY = "bahtwise.demo.session.v1";
