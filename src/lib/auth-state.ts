/**
 * Shared auth action types and the idle initial state.
 *
 * This module intentionally has no "use server" directive: a "use server"
 * file may only export async functions, so the constant lives here and both
 * the actions and the client forms import it.
 */

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
