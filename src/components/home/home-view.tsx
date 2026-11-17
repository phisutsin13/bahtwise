"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartPie,
  ChevronRight,
  CircleAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  buildSummary,
  categoryTotals,
  totalsForRange,
} from "@/lib/analytics";
import { categoryColorValue, categoryLabel } from "@/lib/categories";
import {
  addDays,
  eachDay,
  endOfMonth,
  parseISODate,
  startOfMonth,
} from "@/lib/date";
import {
  applyTransactionFilters,
  DEFAULT_FILTERS,
  activeFilterCount,
  groupTransactionsByDay,
  isFilterActive,
} from "@/lib/filters";
import { percentOf } from "@/lib/money";
import type { TransactionFilters } from "@/lib/types";
import type { TranslationKey } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrentDate } from "@/providers/current-date-provider";
import { useTheme } from "@/providers/theme-provider";
import { useTransactionComposer } from "@/components/transactions/transaction-composer";
import { PageHeader } from "@/components/layout/page-header";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { EmptyState, NoResults } from "@/components/ui/empty-state";
import { Sparkline } from "@/components/charts/sparkline";
import { RadialProgress } from "@/components/charts/donut-chart";
import { TransactionGroupList } from "./transaction-list";
import { FilterSheet } from "./filter-sheet";
import {
  Stagger,
  StaggerItem,
  pressable,
  staggerItem,
} from "@/components/ui/motion";

const GROUP_PAGE_SIZE = 7;

export function HomeView() {
  const {
    categories,
    transactions,
    profile,
    isDemo,
    amountsHidden,
    toggleAmountsHidden,
  } = useFinance();
  const { t, locale, formatMoney, formatDate } = useLocale();
  const { resolved } = useTheme();
  const { openNew, openEdit } = useTransactionComposer();
  const router = useRouter();
  const { today } = useCurrentDate();

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupLimit, setGroupLimit] = useState(GROUP_PAGE_SIZE);
  const [greeting, setGreeting] = useState<TranslationKey>("home.greetingMorning");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "home.greetingMorning"
        : hour < 18
          ? "home.greetingAfternoon"
          : "home.greetingEvening",
    );
  }, []);

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysElapsed = parseISODate(today).getDate();
  const daysLeft = Math.max(
    0,
    parseISODate(monthEnd).getDate() - daysElapsed,
  );

  const monthSummary = useMemo(
    () => buildSummary(transactions, categories, "month", today, locale, today),
    [transactions, categories, today, locale],
  );

  const lifetimeNet = useMemo(
    () => totalsForRange(transactions, "0000-01-01", "9999-12-31").net,
    [transactions],
  );

  const balanceTrend = useMemo(() => {
    const trendStart = addDays(today, -29);
    const dailyNet = new Map<string, number>();
    for (const transaction of transactions) {
      if (transaction.occurredOn < trendStart) continue;
      const signed =
        transaction.kind === "income"
          ? transaction.amountSatang
          : -transaction.amountSatang;
      dailyNet.set(
        transaction.occurredOn,
        (dailyNet.get(transaction.occurredOn) ?? 0) + signed,
      );
    }
    let balance = totalsForRange(
      transactions,
      "0000-01-01",
      addDays(trendStart, -1),
    ).net;
    return eachDay(trendStart, today).map((day) => {
      balance += dailyNet.get(day) ?? 0;
      return balance;
    });
  }, [transactions, today]);

  const monthCategories = useMemo(
    () =>
      categoryTotals(
        transactions,
        categories,
        monthStart,
        monthEnd,
        "expense",
      ),
    [transactions, categories, monthStart, monthEnd],
  );

  const topCategory = monthCategories[0] ?? null;
  const budget = profile?.monthlyBudgetSatang ?? null;
  const budgetProgress = budget
    ? percentOf(monthSummary.totals.expense, budget)
    : 0;
  const budgetRemaining = budget
    ? budget - monthSummary.totals.expense
    : null;
  const avgDaily = Math.round(monthSummary.totals.expense / Math.max(1, daysElapsed));

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, categories, filters, locale),
    [transactions, categories, filters, locale],
  );
  const groups = useMemo(() => groupTransactionsByDay(filtered), [filtered]);
  const visibleGroups = groups.slice(0, groupLimit);
  const filteredActive = isFilterActive(filters);
  const filterCount = activeFilterCount(filters);
  const totalShown = visibleGroups.reduce(
    (sum, group) => sum + group.transactions.length,
    0,
  );

  const updateQuery = (query: string) => {
    setFilters((current) => ({ ...current, query }));
    setGroupLimit(GROUP_PAGE_SIZE);
  };

  const applyFilters = (next: TransactionFilters) => {
    setFilters(next);
    setGroupLimit(GROUP_PAGE_SIZE);
  };

  const activityRef = useRef<HTMLElement>(null);
  const showKind = (kind: "income" | "expense") => {
    setFilters((current) => ({ ...current, kind, categoryId: "all" }));
    setGroupLimit(GROUP_PAGE_SIZE);
    activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setGroupLimit(GROUP_PAGE_SIZE);
  };

  const firstName = profile?.displayName?.split(/\s+/)[0] ?? "";
  const title = firstName
    ? locale === "th"
      ? `${t(greeting)} ${firstName}`
      : `${t(greeting)}, ${firstName}`
    : t(greeting);

  return (
    <Stagger className="space-y-5 sm:space-y-6">
      <StaggerItem>
      <PageHeader
        eyebrow={formatDate(today, "long")}
        title={title}
        description={t("home.welcomeSubtitle")}
        actions={
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="secondary"
              onClick={() => openNew("income")}
              className="gap-1.5"
            >
              <ArrowDownLeft className="size-4 text-income" />
              {t("home.kindIncome")}
            </Button>
            <Button onClick={() => openNew("expense")} className="gap-1.5">
              <ArrowUpRight className="size-4" />
              {t("home.addTransaction")}
            </Button>
          </div>
        }
      />
      </StaggerItem>

      {isDemo ? (
        <motion.div variants={staggerItem} className="flex flex-col gap-2 rounded-2xl border border-sky/20 bg-sky-soft/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-sky/10 text-sky">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <p className="text-[14px] font-bold text-ink">
                {t("home.demoBanner")}
              </p>
              <p className="text-[13px] leading-relaxed text-muted">
                {t("home.demoBannerDescription")}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="shrink-0 self-start rounded-lg px-2 py-1 text-[13px] font-semibold text-sky hover:bg-sky/10 sm:self-auto"
          >
            {t("settings.title")}
          </Link>
        </motion.div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <motion.section variants={staggerItem} className="relative isolate overflow-hidden rounded-[26px] bg-hero p-5 text-hero-ink shadow-float sm:p-7 lg:col-span-8">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(215,233,107,0.28),transparent_68%)]" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)]" />
          <div className="hero-grain pointer-events-none absolute inset-0" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-hero-muted">
                  {t("home.balance")}
                </p>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-hero-muted">
                  {t("home.lifetime")}
                </span>
              </div>
              <Amount
                satang={lifetimeNet}
                animateOnMount
                className="mt-3 block font-display text-[clamp(2.4rem,6vw,3.6rem)] font-semibold leading-none tracking-[-0.045em] text-hero-ink"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[13px] font-semibold text-hero-ink backdrop-blur-sm">
                  {lifetimeNet >= 0 ? (
                    <TrendingUp className="size-3 text-accent" />
                  ) : (
                    <TrendingDown className="size-3 text-expense" />
                  )}
                  <span className="tnum">
                    {monthSummary.totals.net >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(monthSummary.totals.net), {
                      withDecimals: false,
                    })}
                  </span>
                  <span className="font-medium text-hero-muted">
                    {t("home.thisMonth")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={toggleAmountsHidden}
                  className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[12px] font-semibold text-hero-muted transition-colors hover:bg-white/10 hover:text-hero-ink"
                >
                  {amountsHidden ? t("home.showBalances") : t("home.hideBalances")}
                </button>
              </div>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-hero-muted">
                {t("home.trend30")}
              </span>
              <span className="tnum text-[13px] font-medium text-accent">
                {balanceTrend[balanceTrend.length - 1] >= balanceTrend[0]
                  ? "↗"
                  : "↘"}{" "}
                {t("home.yourMonth")}
              </span>
            </div>
          </div>

          <div className="relative mt-6 h-[74px] sm:mt-8">
            <Sparkline
              values={balanceTrend}
              stroke="var(--accent)"
              fill="var(--accent)"
              height={74}
              strokeWidth={2}
            />
          </div>
          <div className="relative mt-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-hero-muted/70">
            <span>{formatDate(addDays(today, -29), "short")}</span>
            <span>{t("home.today")}</span>
          </div>
        </motion.section>

        <motion.section variants={staggerItem} className="flex flex-col rounded-[26px] border border-line bg-surface p-5 shadow-card lg:col-span-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Target className="size-4" />
                </span>
                <p className="text-[15px] font-bold text-ink">{t("home.budget")}</p>
              </div>
              <p className="mt-2 text-[13px] text-subtle">{t("home.thisMonth")}</p>
            </div>
            <Link
              href="/budgets"
              className="rounded-lg p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-primary"
              aria-label={t("home.viewSummary")}
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {budget ? (
            <>
              <div className="mt-4 flex items-center justify-center">
                <RadialProgress
                  value={budgetProgress}
                  size={140}
                  stroke={11}
                  tone={
                    budgetProgress >= 100
                      ? "expense"
                      : budgetProgress >= 80
                        ? "warning"
                        : "primary"
                  }
                >
                  <div className="text-center">
                    <p className="font-display text-[26px] font-semibold leading-none text-ink">
                      {Math.round(budgetProgress)}%
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                      {t("home.budgetUsed")}
                    </p>
                  </div>
                </RadialProgress>
              </div>
              <div className="mt-4 space-y-1.5">
                <p className="text-center text-[14px] font-medium text-muted">
                  {t("home.budgetSpent", {
                    spent: formatMoney(monthSummary.totals.expense, {
                      withDecimals: false,
                    }),
                    total: formatMoney(budget, { withDecimals: false }),
                  })}
                </p>
                <p
                  className={cn(
                    "text-center text-[14px] font-bold",
                    budgetRemaining !== null && budgetRemaining < 0
                      ? "text-expense"
                      : "text-primary",
                  )}
                >
                  {budgetRemaining !== null && budgetRemaining >= 0
                    ? t("home.budgetRemaining", {
                        amount: formatMoney(budgetRemaining, {
                          withDecimals: false,
                        }),
                      })
                    : t("home.budgetOver", {
                        amount: formatMoney(Math.abs(budgetRemaining ?? 0), {
                          withDecimals: false,
                        }),
                      })}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[12px] text-subtle">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {t("budgets.daysLeft", { count: daysLeft })}
                </span>
                <Link
                  href="/budgets"
                  className="inline-flex items-center gap-1 font-semibold text-primary"
                >
                  {t("home.viewAll")}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Wallet className="size-5" />
              </span>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                {t("budgets.setOverallDescription")}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => router.push("/budgets")}
              >
                {t("home.setBudget")}
              </Button>
            </div>
          )}
        </motion.section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("home.totalIncome")}
          value={monthSummary.totals.income}
          tone="income"
          icon={<ArrowDownLeft className="size-4" />}
          hint={t("home.thisMonth")}
          onClick={() => showKind("income")}
          actionLabel={t("home.tapToFilter")}
        />
        <StatCard
          label={t("home.totalExpense")}
          value={monthSummary.totals.expense}
          tone="expense"
          icon={<ArrowUpRight className="size-4" />}
          hint={t("home.thisMonth")}
          onClick={() => showKind("expense")}
          actionLabel={t("home.tapToFilter")}
        />
        <StatCard
          label={t("home.savingsRate")}
          value={null}
          percent={monthSummary.savingsRate}
          tone="primary"
          icon={<ChartPie className="size-4" />}
          hint={t("home.ofIncome")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <motion.section
          ref={activityRef}
          variants={staggerItem}
          className="scroll-mt-20 rounded-[24px] border border-line bg-surface p-3 shadow-card sm:p-4 lg:col-span-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                {t("home.recentActivity")}
              </h2>
              <p className="mt-0.5 text-[13px] text-subtle">
                {filteredActive
                  ? t("home.showing", {
                      shown: totalShown,
                      total: filtered.length,
                    })
                  : t("home.allTransactions")}
              </p>
            </div>
            <Link
              href="/summary"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-primary hover:bg-primary-soft"
            >
              {t("home.viewSummary")}
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-2 px-1">
            <div className="relative min-w-0 flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input
                data-search-input
                type="search"
                value={filters.query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder={t("home.searchPlaceholder")}
                aria-label={t("common.search")}
                className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-8 text-[14px] text-ink placeholder:text-subtle focus:border-primary/50 focus:bg-elevated focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              {filters.query ? (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-subtle hover:bg-line/60 hover:text-ink"
                  aria-label={t("common.clear")}
                >
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label={t("home.filters")}
              className={cn(
                "relative grid size-11 shrink-0 place-items-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                filterCount > 0
                  ? "border-primary/30 bg-primary-soft text-primary"
                  : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M7 12h10M10 17h4" />
              </svg>
              {filterCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-contrast">
                  {filterCount}
                </span>
              ) : null}
            </button>
          </div>

          {filteredActive ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-subtle">
                {t("home.filteredBy")}
              </span>
              <AnimatePresence initial={false}>
              {filters.kind !== "all" ? (
                <FilterChip
                  key="kind"
                  label={
                    filters.kind === "income"
                      ? t("home.incomeLabel")
                      : t("home.expenseLabel")
                  }
                  onRemove={() =>
                    setFilters((current) => ({
                      ...current,
                      kind: "all",
                      categoryId: "all",
                    }))
                  }
                  removeLabel={t("common.clear")}
                />
              ) : null}
              {filters.categoryId !== "all" ? (
                <FilterChip
                  key="category"
                  label={
                    categoryLabel(
                      categories.find(
                        (category) => category.id === filters.categoryId,
                      ) ?? null,
                      locale,
                    )
                  }
                  onRemove={() =>
                    setFilters((current) => ({
                      ...current,
                      categoryId: "all",
                    }))
                  }
                  removeLabel={t("common.clear")}
                />
              ) : null}
              {filters.from || filters.to ? (
                <FilterChip
                  key="date"
                  label={`${filters.from ? formatDate(filters.from, "short") : "…"} – ${
                    filters.to ? formatDate(filters.to, "short") : "…"
                  }`}
                  onRemove={() =>
                    setFilters((current) => ({
                      ...current,
                      from: null,
                      to: null,
                    }))
                  }
                  removeLabel={t("common.clear")}
                />
              ) : null}
              {filters.query ? (
                <FilterChip
                  key="query"
                  label={`“${filters.query}”`}
                  onRemove={() => updateQuery("")}
                  removeLabel={t("common.clear")}
                />
              ) : null}
              </AnimatePresence>
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-muted hover:bg-surface-2 hover:text-ink"
              >
                {t("home.clearFilters")}
              </button>
            </div>
          ) : null}

          <div className="mt-2">
            {transactions.length === 0 ? (
              <EmptyState
                icon={<Wallet className="size-6" />}
                title={t("home.noTransactions")}
                description={t("home.noTransactionsDescription")}
                action={
                  <Button onClick={() => openNew("expense")}>
                    {t("onboarding.cta")}
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <NoResults
                title={t("home.noResults")}
                description={t("home.noResultsDescription")}
                action={
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    {t("home.clearFilters")}
                  </Button>
                }
              />
            ) : (
              <>
                <TransactionGroupList
                  groups={visibleGroups}
                  categories={categories}
                  onEdit={openEdit}
                />
                {groupLimit < groups.length ? (
                  <div className="mt-3 flex flex-col items-center gap-2 border-t border-line pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setGroupLimit((current) => current + GROUP_PAGE_SIZE)
                      }
                    >
                      {t("home.loadMore")}
                    </Button>
                    <p className="text-[12px] text-subtle">
                      {t("home.showing", {
                        shown: totalShown,
                        total: filtered.length,
                      })}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </motion.section>

        <motion.aside variants={staggerItem} className="space-y-4 lg:col-span-4">
          <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">
                {t("summary.insights")}
              </h2>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                {t("home.thisMonth")}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <motion.button
                {...pressable}
                type="button"
                onClick={() => {
                  if (topCategory?.categoryId) {
                    setFilters((current) => ({
                      ...current,
                      kind: "expense",
                      categoryId: topCategory.categoryId ?? "all",
                    }));
                    setGroupLimit(GROUP_PAGE_SIZE);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-base"
                  style={{
                    backgroundColor: topCategory?.category
                      ? `${categoryColorValue(topCategory.category.color, resolved)}16`
                      : "var(--primary-soft)",
                  }}
                >
                  {topCategory?.category?.icon ?? "·"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold uppercase tracking-wide text-subtle">
                    {t("home.topCategory")}
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] font-semibold text-ink">
                    {topCategory?.category
                      ? categoryLabel(topCategory.category, locale)
                      : t("common.never")}
                  </span>
                </span>
                {topCategory ? (
                  <span className="text-right">
                    <span className="tnum block text-[14px] font-bold text-ink">
                      {formatMoney(topCategory.amountSatang, {
                        withDecimals: false,
                      })}
                    </span>
                    <span className="block text-[11px] font-medium text-subtle">
                      {Math.round(topCategory.share * 100)}%
                    </span>
                  </span>
                ) : null}
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-surface-2/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                    {t("home.avgDaily")}
                  </p>
                  <Amount
                    satang={avgDaily}
                    withDecimals={false}
                    className="mt-1 block text-[15px] font-bold text-ink"
                  />
                </div>
                <div className="rounded-xl border border-line bg-surface-2/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                    {t("home.savingsRate")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[15px] font-bold",
                      (monthSummary.savingsRate ?? 0) >= 20
                        ? "text-income"
                        : (monthSummary.savingsRate ?? 0) >= 0
                          ? "text-ink"
                          : "text-expense",
                    )}
                  >
                    {monthSummary.savingsRate === null
                      ? "—"
                      : `${monthSummary.savingsRate}%`}
                  </p>
                </div>
              </div>

              {monthSummary.totals.largestExpense ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-expense-soft text-expense">
                    <CircleAlert className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                      {t("summary.largestExpense")}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">
                      {monthSummary.totals.largestExpense.note ||
                        t("home.kindExpense")}
                    </p>
                  </div>
                  <Amount
                    satang={monthSummary.totals.largestExpense.amountSatang}
                    withDecimals={false}
                    className="text-[14px] font-bold text-expense"
                  />
                </div>
              ) : null}
            </div>

            <Link
              href="/summary"
              className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 text-[13px] font-semibold text-ink transition-colors hover:border-line-strong hover:bg-elevated"
            >
              {t("home.viewSummary")}
              <ArrowRight className="size-3" />
            </Link>
          </section>

          <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-bold text-ink">
              {t("home.quickAdd")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <motion.button
                {...pressable}
                type="button"
                onClick={() => openNew("expense")}
                className="flex flex-col items-start gap-2 rounded-xl border border-expense/15 bg-expense-soft/45 p-3 text-left transition-colors hover:border-expense/30 hover:shadow-card"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-expense-soft text-expense">
                  <ArrowUpRight className="size-4" />
                </span>
                <span className="text-[13px] font-semibold text-ink">
                  {t("home.kindExpense")}
                </span>
              </motion.button>
              <motion.button
                {...pressable}
                type="button"
                onClick={() => openNew("income")}
                className="flex flex-col items-start gap-2 rounded-xl border border-income/15 bg-income-soft/45 p-3 text-left transition-colors hover:border-income/30 hover:shadow-card"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-income-soft text-income">
                  <ArrowDownLeft className="size-4" />
                </span>
                <span className="text-[13px] font-semibold text-ink">
                  {t("home.kindIncome")}
                </span>
              </motion.button>
            </div>
            <p className="mt-3 hidden text-[12px] leading-relaxed text-subtle lg:block">
              {t("home.shortcutHint")}
            </p>
          </section>
        </motion.aside>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        categories={categories}
        onApply={applyFilters}
      />
    </Stagger>
  );
}

function StatCard({
  label,
  value,
  percent,
  tone,
  icon,
  hint,
  onClick,
  actionLabel,
}: {
  label: string;
  value: number | null;
  percent?: number | null;
  tone: "income" | "expense" | "primary";
  icon: React.ReactNode;
  hint: string;
  onClick?: () => void;
  actionLabel?: string;
}) {
  const toneClass =
    tone === "income"
      ? "bg-income-soft text-income"
      : tone === "expense"
        ? "bg-expense-soft text-expense"
        : "bg-primary-soft text-primary";
  const valueClass =
    tone === "income"
      ? "text-income"
      : tone === "expense"
        ? "text-expense"
        : "text-ink";
  const barClass =
    tone === "income"
      ? "bg-income"
      : tone === "expense"
        ? "bg-expense"
        : "bg-primary";

  const body = (
    <>
      <span
        className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full opacity-70", barClass)}
        aria-hidden="true"
      />
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", toneClass)}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold uppercase tracking-wide text-subtle">
          {label}
        </span>
        {value !== null ? (
          <Amount
            satang={value}
            withDecimals={false}
            animateOnMount
            className={cn("mt-0.5 block font-display text-[22px] font-semibold leading-tight", valueClass)}
          />
        ) : (
          <span className={cn("mt-0.5 block font-display text-[22px] font-semibold leading-tight", valueClass)}>
            {percent === null || percent === undefined ? "—" : `${percent}%`}
          </span>
        )}
      </span>
      <span className="flex flex-col items-end gap-1 text-[11px] font-medium text-subtle">
        {hint}
        {onClick ? (
          <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        ) : null}
      </span>
    </>
  );

  const base =
    "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 pl-5 text-left shadow-card";

  if (onClick) {
    return (
      <motion.button
        type="button"
        variants={staggerItem}
        whileHover={pressable.whileHover}
        whileTap={pressable.whileTap}
        onClick={onClick}
        title={actionLabel}
        className={cn(base, "transition-shadow hover:border-line-strong hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40")}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.div variants={staggerItem} className={base}>
      {body}
    </motion.div>
  );
}

function FilterChip({
  label,
  onRemove,
  removeLabel,
}: {
  label: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-primary/20 bg-primary-soft py-1 pl-2.5 pr-1 text-[12px] font-semibold text-primary"
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="grid size-4 shrink-0 place-items-center rounded-full hover:bg-primary/15"
      >
        <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </motion.span>
  );
}
