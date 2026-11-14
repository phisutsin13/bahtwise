import type { TranslationKey } from "@/i18n/dictionaries";
import type { AuthActionCode } from "@/app/actions/auth";

export function authErrorKey(code: AuthActionCode | undefined): TranslationKey {
  switch (code) {
    case "invalid_credentials":
      return "errors.invalidCredentials";
    case "email_not_confirmed":
      return "errors.emailNotConfirmed";
    case "rate_limited":
      return "errors.rateLimited";
    case "username_taken":
      return "errors.usernameTaken";
    case "email_taken":
      return "errors.emailTaken";
    case "weak_password":
      return "errors.weakPassword";
    case "invalid_email":
      return "errors.invalidEmail";
    case "username_format":
      return "errors.usernameFormat";
    case "config":
      return "auth.demoOnlySignIn";
    case "link_sent":
      return "auth.linkSent";
    default:
      return "errors.generic";
  }
}
