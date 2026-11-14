"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  CurrentDateProvider,
  useCurrentDate,
} from "@/providers/current-date-provider";
import { Logo } from "@/components/ui/logo";
import { LanguageToggle, ThemeToggle } from "@/components/ui/theme-toggles";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/ui/avatar";
import { useTransactionComposer } from "@/components/transactions/transaction-composer";
import { Sidebar, MobileNav } from "./navigation";
import { UserMenu } from "./user-menu";

function SessionSplash({ label }: { label: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--glow-a),transparent_65%)]" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-5"
      >
        <Logo size="lg" />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="size-1.5 rounded-full bg-primary"
              animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 1.1, repeat: Infinity, delay: index * 0.14 }
              }
            />
          ))}
        </div>
        <p className="text-xs text-subtle">{label}</p>
      </motion.div>
    </div>
  );
}

function TopBar() {
  const { t, locale } = useLocale();
  const { amountsHidden, toggleAmountsHidden } = useFinance();
  const { isDemo } = useAuth();
  const { now } = useCurrentDate();

  const dateLabel = new Intl.DateTimeFormat(
    locale === "th" ? "th-TH-u-ca-gregory" : "en-US",
    { weekday: "long", day: "numeric", month: "long" },
  ).format(now);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle />
          <UserMenu placement="down" />
        </div>
      </header>

      <header className="glass sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-line px-8 lg:flex">
        <div className="flex items-center gap-3">
          <p className="text-[12px] font-medium text-muted">{dateLabel}</p>
          {isDemo ? <DemoBadge /> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleAmountsHidden}
            aria-label={amountsHidden ? t("a11y.showAmounts") : t("a11y.hideAmounts")}
            title={amountsHidden ? t("home.showBalances") : t("home.hideBalances")}
            className="grid size-9 place-items-center rounded-[11px] border border-line bg-surface-2 text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {amountsHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
    </>
  );
}

function FloatingAdd() {
  const { t } = useLocale();
  const { openNew } = useTransactionComposer();
  return (
    <button
      type="button"
      onClick={() => openNew("expense")}
      aria-label={t("a11y.addTransaction")}
      className="fixed right-4 z-40 grid size-14 place-items-center rounded-2xl bg-primary text-primary-contrast shadow-float transition-all duration-200 hover:bg-primary-strong active:scale-95 lg:hidden"
      style={{ bottom: "calc(5.15rem + env(safe-area-inset-bottom))" }}
    >
      <Plus className="size-6" strokeWidth={2.4} />
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { t } = useLocale();
  const { ready, error, reload } = useFinance();
  const { openNew } = useTransactionComposer();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut") router.replace("/sign-in");
  }, [status, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openNew("expense");
      }
      if (event.key === "/") {
        const search = document.querySelector<HTMLInputElement>(
          "[data-search-input]",
        );
        if (search) {
          event.preventDefault();
          search.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openNew]);

  if (status === "loading" || status === "signedOut") {
    return <SessionSplash label={t("auth.checkingSession")} />;
  }

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="w-full max-w-sm text-center">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-ink">
            {t("common.somethingWentWrong")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("errors.network")}</p>
          <Button className="mt-5" onClick={() => void reload()}>
            <RefreshCw className="size-4" />
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <SessionSplash label={t("common.loading")} />;
  }

  return (
    <CurrentDateProvider fallback={<SessionSplash label={t("common.loading")} />}>
      <div className="min-h-dvh lg:flex">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-contrast"
        >
          {t("nav.skip")}
        </a>
        <Sidebar />
        <div className="min-w-0 flex-1">
          <TopBar />
          <main
            id="main"
            className="mx-auto w-full max-w-[1280px] px-4 pb-[calc(6.7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7"
          >
            {children}
          </main>
        </div>
        <MobileNav />
        <FloatingAdd />
      </div>
    </CurrentDateProvider>
  );
}
