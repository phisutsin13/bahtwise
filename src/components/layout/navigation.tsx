"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesColumnIncreasing,
  House,
  Plus,
  Settings2,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/providers/locale-provider";
import { useFinance } from "@/providers/finance-provider";
import { useCurrentDate } from "@/providers/current-date-provider";
import { useTransactionComposer } from "@/components/transactions/transaction-composer";
import { Logo } from "@/components/ui/logo";
import { Amount } from "@/components/ui/amount";
import { percentOf } from "@/lib/money";
import { monthlySpendFor } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "/home", labelKey: "nav.home", icon: House },
  { href: "/summary", labelKey: "nav.summary", icon: ChartNoAxesColumnIncreasing },
  { href: "/budgets", labelKey: "nav.budgets", icon: Target },
  { href: "/settings", labelKey: "nav.settings", icon: Settings2 },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { transactions, profile, amountsHidden } = useFinance();
  const { openNew } = useTransactionComposer();
  const { today } = useCurrentDate();
  const reduce = useReducedMotion();
  const month = monthlySpendFor(transactions, today);
  const budget = profile?.monthlyBudgetSatang ?? null;
  const progress = budget ? percentOf(month.spent, budget) : 0;

  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface/60 p-4 lg:flex">
      <Link
        href="/home"
        className="rounded-xl px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="My Money"
      >
        <Logo size="md" />
      </Link>

      <button
        type="button"
        onClick={() => openNew("expense")}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-contrast shadow-card transition-all hover:bg-primary-strong active:scale-[0.985]"
      >
        <Plus className="size-4" strokeWidth={2.6} />
        {t("nav.addTransaction")}
        <kbd className="ml-1 hidden rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/70 xl:inline">
          N
        </kbd>
      </button>

      <nav aria-label={t("nav.main")} className="mt-6 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 480, damping: 40 }
                  }
                  className="absolute inset-0 rounded-xl border border-primary/12 bg-primary-soft"
                />
              ) : null}
              <item.icon
                className={cn("relative size-[18px]", active ? "stroke-[2.2]" : "stroke-[1.8]")}
              />
              <span className="relative">{t(item.labelKey)}</span>
              {active ? (
                <span className="relative ml-auto size-1.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <Link
          href="/budgets"
          className="block rounded-2xl border border-line bg-surface p-3.5 shadow-card transition-colors hover:border-line-strong"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">
              {t("home.budget")}
            </p>
            <span className="text-[10px] font-semibold text-primary">
              {budget ? `${Math.round(progress)}%` : "—"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <Amount
              satang={month.spent}
              withDecimals={false}
              className="font-display text-lg font-semibold text-ink"
            />
            {budget ? (
              <span className="text-[10px] text-subtle">
                / <Amount satang={budget} withDecimals={false} hidden={amountsHidden} />
              </span>
            ) : (
              <span className="text-[10px] text-primary">{t("home.setBudget")}</span>
            )}
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700",
                progress >= 100 ? "bg-expense" : progress >= 80 ? "bg-warning" : "bg-primary",
              )}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </Link>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-2 py-1.5">
          <UserMenu placement="up" />
          <span className="pr-1 text-[10px] font-medium text-subtle">
            {t("app.name")}
          </span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label={t("nav.main")}
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-subtle",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-nav-active"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 480, damping: 38 }
                  }
                  className="absolute top-1.5 h-8 w-14 rounded-full bg-primary-soft"
                />
              ) : null}
              <item.icon
                className={cn("relative size-[19px]", active ? "stroke-[2.2]" : "stroke-[1.8]")}
              />
              <span className="relative">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
