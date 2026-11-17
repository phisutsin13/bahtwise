"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MailCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  sendMagicLinkAction,
  signInWithUsernameAction,
} from "@/app/actions/auth";
import { initialAuthState } from "@/lib/auth-state";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { authErrorKey } from "./auth-errors";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type Mode = "password" | "email";

export function SignInForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInDemo, supabaseConfigured } = useAuth();
  const [mode, setMode] = useState<Mode>("password");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithUsernameAction,
    initialAuthState,
  );
  const [emailState, emailAction, emailPending] = useActionState(
    sendMagicLinkAction,
    initialAuthState,
  );

  const callbackError = searchParams.get("error");
  const state = mode === "password" ? passwordState : emailState;
  const isSuccess =
    state.status === "success" &&
    (state.code === "signed_up" || state.code === "link_sent");

  useEffect(() => {
    if (passwordState.status === "success" && passwordState.code === "signed_up") {
      router.replace("/home");
    }
  }, [passwordState, router]);

  if (mode === "email" && isSuccess && emailState.code === "link_sent") {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          {t("auth.linkSent")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("auth.linkSentDescription", { email: emailState.email ?? "" })}
        </p>
        <Button
          variant="secondary"
          size="lg"
          className="mt-7 w-full"
          onClick={() => setMode("password")}
        >
          {t("auth.backToSignIn")}
        </Button>
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
        {t("auth.signInTitle")}
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        {t("auth.signInSubtitle")}
      </p>

      <div className="mt-6">
        <Segmented
          fullWidth
          ariaLabel={t("auth.signIn")}
          value={mode}
          onChange={(next) => setMode(next)}
          options={[
            {
              value: "password",
              label: t("auth.usePassword"),
              icon: <KeyRound className="size-3.5" />,
            },
            {
              value: "email",
              label: t("auth.emailLink"),
              icon: <AtSign className="size-3.5" />,
            },
          ]}
        />
      </div>

      {!supabaseConfigured ? (
        <div className="mt-4 flex gap-2.5 rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-3 text-[12px] leading-relaxed text-warning">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">{t("auth.configMissing")}. </span>
            {t("auth.configMissingDescription")}
          </p>
        </div>
      ) : callbackError ? (
        <div className="mt-4 rounded-xl border border-expense/25 bg-expense-soft px-3.5 py-3 text-[12px] font-medium text-expense">
          {callbackError === "config" ? t("auth.demoOnlySignIn") : t("errors.generic")}
        </div>
      ) : null}

      {mode === "password" ? (
        <form action={passwordAction} className="mt-5 space-y-3.5">
          <Field label={t("auth.username")} htmlFor="username">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <TextInput
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                placeholder={t("auth.usernamePlaceholder")}
                className="pl-10"
                data-autofocus
              />
            </div>
          </Field>

          <Field label={t("auth.password")} htmlFor="password">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <TextInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
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

          {passwordState.status === "error" ? (
            <ErrorNote message={t(authErrorKey(passwordState.code))} />
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="group mt-1 w-full"
            loading={passwordPending}
          >
            {passwordPending ? t("auth.signingIn") : t("auth.signIn")}
            {!passwordPending ? (
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            ) : null}
          </Button>
        </form>
      ) : (
        <form action={emailAction} className="mt-5 space-y-3.5">
          <Field
            label={t("auth.email")}
            htmlFor="email"
            hint={t("auth.emailLinkSubtitle")}
          >
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
                data-autofocus
              />
            </div>
          </Field>

          {emailState.status === "error" ? (
            <ErrorNote message={t(authErrorKey(emailState.code))} />
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="group mt-1 w-full"
            loading={emailPending}
          >
            {emailPending ? t("auth.sendingLink") : t("auth.sendLink")}
            {!emailPending ? (
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            ) : null}
          </Button>
        </form>
      )}

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
          {t("common.or")}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="group rounded-2xl border border-dashed border-primary/30 bg-primary-soft/45 p-4 transition-colors hover:border-primary/50 hover:bg-primary-soft/70">
        <div className="flex items-start justify-between gap-3">
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
        </div>
        <Button
          variant="secondary"
          size="md"
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
        {t("auth.noAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("auth.createAccount")}
        </Link>
      </p>

      <div className="mt-5 flex items-center justify-center gap-4 text-[10px] font-medium text-subtle">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="size-3 text-primary/70" /> RLS protected
        </span>
        <span className="size-0.5 rounded-full bg-line-strong" />
        <span>Integer satang</span>
        <span className="size-0.5 rounded-full bg-line-strong" />
        <span>THB</span>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-expense/20 bg-expense-soft px-3 py-2.5 text-[12px] font-medium leading-relaxed text-expense"
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
