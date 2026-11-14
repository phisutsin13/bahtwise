"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarRange,
  ChevronLeft,
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
  monthlySpendFor,
  periodLabelKey,
  shiftPeriod,
  type Period,
} from "@/lib/analytics";
import { categoryColorValue, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/cn";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrentDate } from "@/providers/current-date-provider";
import { useTheme } from "@/providers/theme-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { NoPeriodData } from "@/components/ui/empty-state";
import { BarPairChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";

const PERIODS: Period[] = ["day", "week", "month", "year"];

const TREND_TITLE: Record<Period, TranslationKey> = {
  day: "summary.trendDay",
  week: "summary.trendWeek",
  month: "summary.trendMonth",
  year: "summary.trendYear",
};

export function SummaryView() {
  const { transactions, categories, profile } = useFinance();
  const { t, locale, formatMoney, formatPercent } = useLocale();
  const { resolved } = useTheme();
  const { today } = useCurrentDate();
  const [period, setPeriod] = useState<Period>("month");
  const [anchor, setAnchor] = useState(today);
  const [donutKind, setDonutKind] = useState<"expense" | "income">("expense");

  const summary = useMemo(
    () => buildSummary(transactions, categories, period, anchor, locale, today),
    [transactions, categories, period, anchor, locale, today],
  );

  const canGoForward = shiftPeriod(period, anchor, 1) <= today;
  const atCurrentPeriod = anchor === today;
  const periodWord =
    locale === "th"
      ? t(periodLabelKey(period))
      : t(periodLabelKey(period)).toLowerCase();
  const hasData = summary.totals.count > 0;
  const donutData =
    donutKind === "expense" ? summary.categories : summary.incomeCategories;
  const currentMonth = monthlySpendFor(transactions, today);
  const netChange =
    summary.previousTotals.net !== 0
      ? Math.round(
          ((summary.totals.net - summary.previousTotals.net) /
            Math.abs(summary.previousTotals.net)) *
            100,
        )
      : null;

  const periodButtons = (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
      <button
        type="button"
        onClick={() => setAnchor((current) => shiftPeriod(period, current, -1))}
        aria-label={t("common.previous")}
        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[8.5rem] px-1 text-center text-[11px] font-semibold text-ink">
        {summary.range.label}
      </span>
      <button
        type="button"
        onClick={() => setAnchor((current) => shiftPeriod(period, current, 1))}
        disabled={!canGoForward}
        aria-label={t("common.next")}
        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("nav.summary")}
        title={t("summary.title")}
        description={t("summary.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!atCurrentPeriod ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnchor(today)}
                className="gap-1.5"
              >
                <CalendarCheck className="size-3.5" />
                {t("summary.goToday", { period: periodWord })}
              </Button>
            ) : null}
            {periodButtons}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          ariaLabel={t("summary.periodSelector")}
          value={period}
          onChange={(next) => {
            setPeriod(next);
            setAnchor(today);
          }}
          options={PERIODS.map((value) => ({
            value,
            label: t(periodLabelKey(value)),
          }))}
        />
        {!hasData ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-subtle">
            <CalendarRange className="size-3" />
            {t("summary.noData")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-subtle">
            <CalendarRange className="size-3" />
            {t("summary.periodDays", { count: summary.range.days })} ·{" "}
            {t("summary.activeDays", { count: summary.totals.activeDays })}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("summary.totalIncome")}
          satang={summary.totals.income}
          tone="income"
          icon={<ArrowDownLeft className="size-4" />}
          change={summary.incomeChangePct}
          comparison={t("summary.compared", { period: periodWord })}
        />
        <KpiCard
          label={t("summary.totalExpense")}
          satang={summary.totals.expense}
          tone="expense"
          icon={<ArrowUpRight className="size-4" />}
          change={summary.expenseChangePct}
          comparison={t("summary.compared", { period: periodWord })}
          invertChange
        />
        <KpiCard
          label={t("summary.net")}
          satang={summary.totals.net}
          tone="primary"
          icon={<Wallet className="size-4" />}
          change={netChange}
          comparison={t("summary.compared", { period: periodWord })}
        />
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
              <Target className="size-4" />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
              {t("summary.savingsRate")}
            </p>
          </div>
          <p
            className={cn(
              "mt-2 font-display text-[26px] font-semibold tracking-tight",
              summary.savingsRate === null
                ? "text-subtle"
                : summary.savingsRate >= 20
                  ? "text-income"
                  : summary.savingsRate >= 0
                    ? "text-ink"
                    : "text-expense",
            )}
          >
            {summary.savingsRate === null
              ? "—"
              : formatPercent(summary.savingsRate)}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-subtle">
            {summary.savingsRate === null
              ? t("summary.noData")
              : summary.savingsRate >= 20
                ? t("summary.savingsGreat", {
                    rate: formatPercent(summary.savingsRate),
                  })
                : summary.savingsRate >= 0
                  ? t("summary.savingsOkay", {
                      rate: formatPercent(summary.savingsRate),
                    })
                  : t("summary.savingsNone")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-[24px] border border-line bg-surface p-4 shadow-card sm:p-5 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                {t("summary.trend")}
              </h2>
              <p className="mt-0.5 text-[11px] text-subtle">
                {t(TREND_TITLE[period])}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-subtle">
                {t("summary.netCash")}
              </p>
              <Amount
                satang={summary.totals.net}
                showSign
                withDecimals={false}
                className={cn(
                  "mt-0.5 block text-[15px] font-bold",
                  summary.totals.net >= 0 ? "text-income" : "text-expense",
                )}
              />
            </div>
          </div>
          <div className="mt-4">
            {hasData ? (
              <BarPairChart buckets={summary.buckets} height={238} showNet />
            ) : (
              <NoPeriodData
                title={t("summary.noData")}
                description={t("summary.noDataDescription")}
              />
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-4 shadow-card sm:p-5 lg:col-span-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                {t("summary.byCategory")}
              </h2>
              <p className="mt-0.5 text-[11px] text-subtle">
                {donutKind === "expense"
                  ? t("summary.breakdown")
                  : t("summary.incomeBreakdown")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Segmented
              size="sm"
              fullWidth
              ariaLabel={t("summary.breakdown")}
              value={donutKind}
              onChange={setDonutKind}
              options={[
                { value: "expense", label: t("summary.expenseTab") },
                { value: "income", label: t("summary.incomeTab") },
              ]}
            />
          </div>
          <div className="mt-4">
            {donutData.length > 0 ? (
              <DonutChart data={donutData} kind={donutKind} />
            ) : (
              <NoPeriodData
                title={t("summary.noBreakdown")}
                description={t("summary.noBreakdownDescription")}
                icon={<Sparkles className="size-6" />}
              />
            )}
          </div>
          {donutData.length > 0 ? (
            <div className="mt-4 space-y-1 border-t border-line pt-3">
              {donutData.slice(0, 5).map((entry) => (
                <div
                  key={entry.categoryId ?? "uncategorized"}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[11px]"
                >
                  <span
                    className="size-2 shrink-0 rounded-[3px]"
                    style={{
                      backgroundColor: entry.category
                        ? categoryColorValue(entry.category.color, resolved)
                        : "var(--muted)",
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">
                    {entry.category
                      ? categoryLabel(entry.category, locale)
                      : t("common.uncategorized")}
                  </span>
                  <Amount
                    satang={entry.amountSatang}
                    withDecimals={false}
                    className="font-semibold text-muted"
                  />
                  <span className="w-8 text-right text-[10px] text-subtle">
                    {formatPercent(entry.share * 100)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          icon={<TrendingDown className="size-4" />}
          tone="primary"
          label={t("summary.avgPerDay")}
          value={formatMoney(summary.avgPerDay, { withDecimals: false })}
          hint={`${t("summary.periodDays", { count: summary.range.days })}`}
        />
        <InsightCard
          icon={<CircleAlert className="size-4" />}
          tone="expense"
          label={t("summary.largestExpense")}
          value={
            summary.totals.largestExpense
              ? formatMoney(summary.totals.largestExpense.amountSatang, {
                  withDecimals: false,
                })
              : "—"
          }
          hint={summary.totals.largestExpense?.note || t("common.never")}
        />
        <InsightCard
          icon={<TrendingUp className="size-4" />}
          tone="income"
          label={t("summary.projected")}
          value={formatMoney(summary.projectedExpense, { withDecimals: false })}
          hint={t("summary.projectedDescription")}
        />
        <InsightCard
          icon={<CalendarRange className="size-4" />}
          tone="sky"
          label={t("summary.totalExpense")}
          value={formatMoney(summary.totals.expense, { withDecimals: false })}
          hint={t("summary.activeDays", { count: summary.totals.activeDays })}
        />
      </div>

      <section className="rounded-[24px] border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
              {t("summary.topCategories")}
            </h2>
            <p className="mt-0.5 text-[11px] text-subtle">
              {t("summary.thisPeriod", { period: periodWord })}
            </p>
          </div>
          {summary.expenseChangePct !== null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                summary.expenseChangePct > 0
                  ? "bg-expense-soft text-expense"
                  : "bg-income-soft text-income",
              )}
            >
              {summary.expenseChangePct > 0 ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownLeft className="size-3" />
              )}
              {Math.abs(summary.expenseChangePct)}%{" "}
              {summary.expenseChangePct > 0
                ? t("summary.moreThanPrevious", { period: periodWord })
                : t("summary.lessThanPrevious", { period: periodWord })}
            </span>
          ) : null}
        </div>

        {summary.categories.length === 0 ? (
          <NoPeriodData
            title={t("summary.noBreakdown")}
            description={t("summary.noBreakdownDescription")}
            icon={<Wallet className="size-6" />}
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">
                  <th className="pb-2 pl-1 font-bold">{t("summary.category")}</th>
                  <th className="pb-2 text-right font-bold">
                    {t("summary.amount")}
                  </th>
                  <th className="w-32 pb-2 text-right font-bold">
                    {t("summary.share")}
                  </th>
                  <th className="w-14 pb-2 pr-1 text-right font-bold">#</th>
                </tr>
              </thead>
              <tbody>
                {summary.categories.map((entry) => {
                  const color = entry.category
                    ? categoryColorValue(entry.category.color, resolved)
                    : "var(--muted)";
                  return (
                    <tr
                      key={entry.categoryId ?? "uncategorized"}
                      className="border-b border-line/70 last:border-0"
                    >
                      <td className="py-2.5 pl-1">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-[3px]"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[12px] font-semibold text-ink">
                            {entry.category
                              ? `${entry.category.icon} ${categoryLabel(entry.category, locale)}`
                              : t("common.uncategorized")}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Amount
                          satang={entry.amountSatang}
                          withDecimals={false}
                          className="text-[12px] font-semibold text-ink"
                        />
                      </td>
                      <td className="py-2.5">
                        <span className="flex items-center justify-end gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${Math.max(3, entry.share * 100)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </span>
                          <span className="w-9 text-right text-[10px] font-medium text-subtle">
                            {formatPercent(entry.share * 100)}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-1 text-right text-[10px] text-subtle">
                        {entry.count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {profile?.monthlyBudgetSatang ? (
        <section className="flex flex-col gap-3 rounded-[24px] border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Target className="size-5" />
            </span>
            <div>
              <p className="text-[12px] font-bold text-ink">
                {t("home.budget")}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {t("home.budgetSpent", {
                  spent: formatMoney(currentMonth.spent, { withDecimals: false }),
                  total: formatMoney(profile.monthlyBudgetSatang, {
                    withDecimals: false,
                  }),
                })}
              </p>
            </div>
          </div>
          <Link
            href="/budgets"
            className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl border border-line bg-surface-2 px-3 text-[11px] font-semibold text-ink transition-colors hover:border-line-strong hover:bg-elevated sm:self-auto"
          >
            {t("nav.budgets")}
            <ArrowRight className="size-3" />
          </Link>
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAnchor((current) => shiftPeriod(period, current, -1))}
          className="gap-1"
        >
          <ArrowLeft className="size-3.5" />
          {t("common.previous")}
        </Button>
        <span className="text-[10px] text-subtle">{summary.range.label}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoForward}
          onClick={() => setAnchor((current) => shiftPeriod(period, current, 1))}
          className="gap-1"
        >
          {t("common.next")}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  satang,
  tone,
  icon,
  change,
  comparison,
  invertChange = false,
}: {
  label: string;
  satang: number;
  tone: "income" | "expense" | "primary";
  icon: React.ReactNode;
  change: number | null;
  comparison: string;
  invertChange?: boolean;
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
        : satang >= 0
          ? "text-ink"
          : "text-expense";
  const good = change !== null && (invertChange ? change <= 0 : change >= 0);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-xl", toneClass)}>
            {icon}
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
            {label}
          </p>
        </div>
        {change !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              good ? "bg-income-soft text-income" : "bg-expense-soft text-expense",
            )}
          >
            {change > 0 ? (
              <ArrowUpRight className="size-2.5" />
            ) : change < 0 ? (
              <ArrowDownLeft className="size-2.5" />
            ) : null}
            {Math.abs(change)}%
          </span>
        ) : null}
      </div>
      <Amount
        satang={satang}
        withDecimals={false}
        showSign={tone === "primary"}
        className={cn(
          "mt-2.5 block font-display text-[24px] font-semibold tracking-[-0.03em]",
          valueClass,
        )}
      />
      <p className="mt-1 text-[10px] text-subtle">{comparison}</p>
    </div>
  );
}

function InsightCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: "primary" | "expense" | "income" | "sky";
  label: string;
  value: string;
  hint: string;
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    expense: "bg-expense-soft text-expense",
    income: "bg-income-soft text-income",
    sky: "bg-sky-soft text-sky",
  }[tone];

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", toneClass)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-subtle">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[15px] font-bold text-ink">{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-subtle">{hint}</p>
      </div>
    </div>
  );
}
