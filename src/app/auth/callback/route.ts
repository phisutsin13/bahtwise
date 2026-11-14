import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { debugError, debugLog } from "@/lib/logger";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/home";
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const errorDescription =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (errorDescription) {
    const target = new URL("/sign-in", request.url);
    target.searchParams.set("error", "callback");
    return NextResponse.redirect(target);
  }

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/sign-in?error=config", request.url));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/sign-in?error=config", request.url));
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      debugError("auth.code_exchange_failed", error);
      return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      debugError("auth.otp_verify_failed", error);
      return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
    }
  } else {
    return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  }

  debugLog("auth.callback_succeeded");
  return NextResponse.redirect(new URL(next, request.url));
}
