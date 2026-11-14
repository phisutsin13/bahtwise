"use server";

import { headers } from "next/headers";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { debugError, debugLog } from "@/lib/logger";

export type AuthActionCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "username_taken"
  | "email_taken"
  | "weak_password"
  | "invalid_email"
  | "username_format"
  | "config"
  | "link_sent"
  | "signup_confirm"
  | "signed_up"
  | "generic";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  code?: AuthActionCode;
  email?: string;
};

export const initialAuthState: AuthActionState = { status: "idle" };

const USERNAME_RE = /^[\p{L}\p{N}._-]{3,24}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function siteOrigin(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function mapAuthError(message: string): AuthActionCode {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) return "email_not_confirmed";
  if (normalized.includes("invalid login")) return "invalid_credentials";
  if (normalized.includes("already registered")) return "email_taken";
  if (normalized.includes("password should be") || normalized.includes("weak password")) {
    return "weak_password";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "rate_limited";
  }
  if (normalized.includes("invalid email")) return "invalid_email";
  return "generic";
}

export async function signInWithUsernameAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { status: "error", code: "config" };
  const username = field(formData, "username").toLowerCase();
  const password = field(formData, "password");

  if (!USERNAME_RE.test(username)) {
    return { status: "error", code: "invalid_credentials" };
  }
  if (!password) return { status: "error", code: "invalid_credentials" };

  const admin = createSupabaseAdminClient();
  if (!admin) {
    debugError("auth.username_lookup_unavailable", new Error("missing service role"));
    return { status: "error", code: "config" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { status: "error", code: "invalid_credentials" };

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(
    profile.id,
  );
  if (userError || !userData.user?.email) {
    debugError("auth.user_lookup_failed", userError);
    return { status: "error", code: "invalid_credentials" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "config" };

  const { error } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password,
  });

  if (error) {
    debugError("auth.password_signin_failed", error);
    return { status: "error", code: mapAuthError(error.message) };
  }

  debugLog("auth.password_signin_succeeded");
  return { status: "success", code: "signed_up" };
}

export async function signUpAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { status: "error", code: "config" };
  const username = field(formData, "username").toLowerCase();
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");

  if (!USERNAME_RE.test(username)) return { status: "error", code: "username_format" };
  if (!EMAIL_RE.test(email)) return { status: "error", code: "invalid_email" };
  if (password.length < 8) return { status: "error", code: "weak_password" };

  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "error", code: "config" };

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { status: "error", code: "username_taken" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "config" };
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
      emailRedirectTo: `${origin}/auth/callback?next=/home`,
    },
  });

  if (error) {
    debugError("auth.signup_failed", error);
    return { status: "error", code: mapAuthError(error.message) };
  }

  debugLog("auth.signup_succeeded", { needsConfirmation: !data.session });
  if (!data.session) {
    return { status: "success", code: "signup_confirm", email };
  }
  return { status: "success", code: "signed_up" };
}

export async function sendMagicLinkAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured) return { status: "error", code: "config" };
  const email = field(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { status: "error", code: "invalid_email" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "config" };
  const origin = await siteOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/home`,
    },
  });

  if (error) {
    debugError("auth.magic_link_failed", error);
    if (mapAuthError(error.message) === "rate_limited") {
      return { status: "error", code: "rate_limited" };
    }
  }

  debugLog("auth.magic_link_requested");
  return { status: "success", code: "link_sent", email };
}

export async function checkUsernameAction(usernameRaw: string): Promise<boolean | null> {
  if (!isSupabaseConfigured) return null;
  const username = usernameRaw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) return null;
  return !data;
}
