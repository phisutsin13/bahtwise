"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  MailCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  checkUsernameAction,
  initialAuthState,
  signUpAction,
} from "@/app/actions/auth";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { authErrorKey } from "./auth-errors";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Logo } from "@/components/ui/logo";

const USERNAME_RE = /^[\p{L}\p{N}._-]{3,24}$/u;

export function SignUpForm() {
  const { t } = useLocale();
  const router = useRouter();
  const { supabaseConfigured, signInDemo } = useAuth();
  const [state, action, pending] = useActionState(signUpAction, initialAuthState);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken">(
    "idle",
  );
  const checkSequence = useRef(0);

  useEffect(() => {
    if (state.status === "success" && state.code === "signed_up") {
      router.replace("/home");
    }
  }, [state, router]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    if (!USERNAME_RE.test(username)) {
      setAvailability("idle");
      return;
    }
    const sequence = ++checkSequence.current;
    setAvailability("checking");
    const timer = window.setTimeout(async () => {
      const available = await checkUsernameAction(username);
      if (sequence !== checkSequence.current) return;
      if (available === null) setAvailability("idle");
      else setAvailability(available ? "free" : "taken");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [username, supabaseConfigured]);

  if (!supabaseConfigured) {
    return (
      <div>
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Logo size="sm" withWordmark={false} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            MY MONEY
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-warning">
          <LockKeyhole className="size-3" />
          {t("auth.signupDisabled")}
        </span>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,5vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          {t("auth.signupTitle")}
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          {t("auth.signupDisabledDescription")}
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface-2/70 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
            {t("auth.configMissing")}
          </p>
          <pre className="mt-2.5 overflow-x-auto rounded-lg border border-line bg-elevated px-3 py-2.5 text-[11px] leading-relaxed text-muted">
            <code>{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...`}</code>
          </pre>
          <p className="mt-2.5 text-[11px] leading-relaxed text-subtle">
            See <span className="font-semibold text-muted">README.md</span> for
            migrations and setup.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary-soft/45 p-4">
          <div className="flex gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{t("auth.demoTitle")}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                {t("auth.demoDescription")}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-3.5 w-full border-primary/20 bg-elevated"
            onClick={() => {
              signInDemo();
              router.replace("/home");
            }}
          >
            {t("auth.demoButton")}
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <p className="mt-6 text-center text-[13px] text-muted">
          {t("auth.haveAccount")}{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    );
  }

  if (state.status === "success" && state.code === "signup_confirm") {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          {t("auth.confirmEmail")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("auth.confirmEmailDescription", { email: state.email ?? "" })}
        </p>
        <Link href="/sign-in" className="mt-7 block">
          <Button variant="secondary" size="lg" className="w-full">
            <ArrowLeft className="size-4" />
            {t("auth.backToSignIn")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <Logo size="sm" withWordmark={false} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          MY MONEY
        </span>
      </div>
      <h1 className="font-display text-[clamp(2.1rem,5vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
        {t("auth.signupTitle")}
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        {t("auth.signupSubtitle")}
      </p>

      <form action={action} className="mt-7 space-y-3.5">
        <Field
          label={t("auth.username")}
          htmlFor="username"
          hint={
            availability === "taken" ? (
              <span className="text-expense">{t("auth.usernameTaken")}</span>
            ) : availability === "free" ? (
              <span className="text-primary">{t("auth.usernameAvailable")}</span>
            ) : (
              t("auth.usernameHint")
            )
          }
        >
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <TextInput
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t("auth.usernamePlaceholder")}
              className="pl-10 pr-10"
              data-autofocus
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {availability === "checking" ? (
                <LoaderCircle className="size-4 animate-spin text-subtle" />
              ) : availability === "free" ? (
                <Check className="size-4 text-primary" />
              ) : null}
            </span>
          </div>
        </Field>

        <Field label={t("auth.email")} htmlFor="email">
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              className="pl-10"
            />
          </div>
        </Field>

        <Field label={t("auth.password")} htmlFor="password" hint={t("auth.passwordHint")}>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <TextInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder={t("auth.passwordPlaceholder")}
              className="pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-ink"
              aria-label={showPassword ? t("common.hide") : t("common.show")}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {state.status === "error" ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-expense/20 bg-expense-soft px-3 py-2.5 text-[12px] font-medium leading-relaxed text-expense"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{t(authErrorKey(state.code))}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="group mt-1 w-full"
          loading={pending}
          disabled={availability === "taken" || availability === "checking"}
        >
          {pending ? t("auth.signingUp") : t("auth.signupButton")}
          {!pending ? (
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          ) : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        {t("auth.haveAccount")}{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
