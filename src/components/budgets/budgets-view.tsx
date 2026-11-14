"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  Pencil,
  Plus,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  categorySpend,
  monthlySpendFor,
} from "@/lib/analytics";
import { categoryColorValue, categoryLabel } from "@/lib/categories";
import {
  addMonths,
  endOfMonth,
  parseISODate,
  startOfMonth,
} from "@/lib/date";
import { percentOf } from "@/lib/money";
import type { Category, CategoryBudget } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useCurrentDate } from "@/providers/current-date-provider";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/providers/toast-provider";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RadialProgress } from "@/components/charts/donut-chart";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetSheet } from "./budget-sheet";

type BudgetRow = {
  budget: CategoryBudget;
  category: Category | null;
  spent: number;
  percent: number;
  status: "over" | "nearing" | "onTrack";
};

export function BudgetsView() {
  const {
    budgets,
    categories,
    transactions,
    profile,
    upsertCategoryBudget,
  } = useFinance();
  const { t, locale, formatMoney, formatMonthLabel } = useLocale();
  const { resolved } = useTheme();
  const { toast } = useToast();
  const { today } = useCurrentDate();

  const currentMonth = startOfMonth(today);
  const [anchor, setAnchor] = useState(today);
  const month = startOfMonth(anchor);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetOverall, setSheetOverall] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  const [copying, setCopying] = useState(false);

  const monthSpend = monthlySpendFor(transactions, month);
  const overallBudget = profile?.monthlyBudgetSatang ?? null;
  const overallProgress = overallBudget
    ? percentOf(monthSpend.spent, overallBudget)
    : 0;
  const overallRemaining = overallBudget
    ? overallBudget - monthSpend.spent
    : null;
  const isCurrentMonth = month === currentMonth;
  const canGoForward = month < currentMonth;

  const daysInMonth = parseISODate(endOfMonth(month)).getDate();
  const dayOfMonth = parseISODate(today).getDate();
  const daysLeft = isCurrentMonth
    ? Math.max(0, daysInMonth - dayOfMonth)
    : month > currentMonth
      ? daysInMonth
      : 0;
  const elapsed = isCurrentMonth
    ? dayOfMonth
    : month < currentMonth
      ? daysInMonth
      : 1;
  const projected = isCurrentMonth
    ? Math.round((monthSpend.spent / Math.max(1, elapsed)) * daysInMonth)
    : monthSpend.spent;

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const rows: BudgetRow[] = budgets
    .filter((budget) => budget.month === month)
    .map((budget) => {
      const spent = categorySpend(transactions, budget.categoryId, month);
      const percent = percentOf(spent, budget.amountSatang);
      return {
        budget,
        category: categoryById.get(budget.categoryId) ?? null,
        spent,
        percent,
        status: (percent >= 100
          ? "over"
          : percent >= 80
            ? "nearing"
            : "onTrack") as BudgetRow["status"],
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const totalCategoryLimits = rows.reduce(
    (sum, row) => sum + row.budget.amountSatang,
    0,
  );
  const categorySpentTotal = rows.reduce((sum, row) => sum + row.spent, 0);
  const uncategorized = transactions.reduce((total, transaction) => {
    if (
      transaction.kind === "expense" &&
      transaction.categoryId === null &&
      transaction.occurredOn >= month &&
      transaction.occurredOn <= endOfMonth(month)
    ) {
      return total + transaction.amountSatang;
    }
    return total;
  }, 0);
  const budgetedCategoryIds = rows.map((row) => row.budget.categoryId);

  const openOverall = () => {
    setEditingBudget(null);
    setSheetOverall(true);
    setSheetOpen(true);
  };

  const openCategory = (budget: CategoryBudget | null) => {
    setEditingBudget(budget);
    setSheetOverall(false);
    setSheetOpen(true);
  };

  const copyLastMonth = async () => {
    const previousMonth = startOfMonth(addMonths(month, -1));
    const previous = budgets.filter(
      (budget) => budget.month === previousMonth,
    );
    if (previous.length === 0) {
      toast({ title: t("budgets.nothingToCopy") });
      return;
    }
    const existing = new Set(budgetedCategoryIds);
    const toCopy = previous.filter(
      (budget) => !existing.has(budget.categoryId),
    );
    if (toCopy.length === 0) {
      toast({ title: t("budgets.nothingToCopy") });
      return;
    }
    setCopying(true);
    try {
      for (const budget of toCopy) {
        await upsertCategoryBudget(
          budget.categoryId,
          month,
          budget.amountSatang,
        );
      }
      toast({ title: t("budgets.copied") });
    } catch {
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setCopying(false);
    }
  };

  const monthNav = (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
      <button
        type="button"
        onClick={() => setAnchor(addMonths(month, -1))}
        aria-label={t("common.previous")}
        className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[9rem] px-1 text-center text-[11px] font-semibold text-ink">
        {formatMonthLabel(month)}
      </span>
      <button
        type="button"
        disabled={!canGoForward}
        onClick={() => setAnchor(addMonths(month, 1))}
        aria-label={t("common.next")}
        className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("nav.budgets")}
        title={t("budgets.title")}
        description={t("budgets.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isCurrentMonth ? (
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                {t("budgets.thisMonth")}
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>
                {t("budgets.thisMonth")}
              </Button>
            )}
            {monthNav}
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-[26px] border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary-soft/70 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex items-center gap-5">
            <RadialProgress
              value={overallProgress}
              size={168}
              stroke={12}
              tone={
                overallProgress >= 100
                  ? "expense"
                  : overallProgress >= 80
                    ? "warning"
                    : "primary"
              }
            >
              <div className="text-center">
                <p className="font-display text-[30px] font-semibold leading-none text-ink">
                  {overallBudget ? `${Math.round(overallProgress)}%` : "—"}
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  {locale === "th" ? "ใช้ไป" : "used"}
                </p>
              </div>
            </RadialProgress>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {t("budgets.overall")}
              </p>
              <p className="mt-1 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight tracking-[-0.03em] text-ink">
                {overallBudget ? (
                  formatMoney(overallBudget, { withDecimals: false })
                ) : (
                  t("budgets.noLimit")
                )}
              </p>
              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted">
                {t("budgets.overallDescription", {
                  month: formatMonthLabel(month),
                })}
              </p>
              <Button
                variant={overallBudget ? "secondary" : "primary"}
                size="sm"
                className="mt-3"
                onClick={openOverall}
              >
                {overallBudget ? (
                  <>
                    <Pencil className="size-3.5" />
                    {t("budgets.editAmount")}
                  </>
                ) : (
                  <>
                    <Target className="size-3.5" />
                    {t("budgets.setAmount")}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <BudgetStat
              label={t("home.totalExpense")}
              value={formatMoney(monthSpend.spent, { withDecimals: false })}
              tone="expense"
            />
            <BudgetStat
              label={
                overallRemaining !== null && overallRemaining < 0
                  ? t("budgets.over")
                  : t("budgets.remaining")
              }
              value={
                overallRemaining === null
                  ? "—"
                  : formatMoney(Math.abs(overallRemaining), {
                      withDecimals: false,
                    })
              }
              tone={
                overallRemaining !== null && overallRemaining < 0
                  ? "expense"
                  : "income"
              }
            />
            <BudgetStat
              label={t("summary.projected")}
              value={formatMoney(projected, { withDecimals: false })}
              tone="primary"
            />
            <BudgetStat
              label={t("budgets.daysLeft", { count: daysLeft })}
              value={`${Math.max(0, Math.round((elapsed / daysInMonth) * 100))}%`}
              tone="sky"
            />
          </div>
        </div>

        {overallRemaining !== null && overallRemaining < 0 ? (
          <div className="relative mt-4 flex items-start gap-2 rounded-xl border border-expense/20 bg-expense-soft/60 px-3 py-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-expense" />
            <p className="text-[11px] font-medium leading-relaxed text-expense">
              {t("home.budgetOver", {
                amount: formatMoney(Math.abs(overallRemaining), {
                  withDecimals: false,
                }),
              })}
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryChip
          icon={<Target className="size-4" />}
          label={t("budgets.categoryBudgets")}
          value={
            totalCategoryLimits > 0
              ? formatMoney(totalCategoryLimits, { withDecimals: false })
              : t("budgets.noLimit")
          }
        />
        <SummaryChip
          icon={<TrendingUp className="size-4" />}
          label={t("home.totalExpense")}
          value={formatMoney(categorySpentTotal, { withDecimals: false })}
        />
        <SummaryChip
          icon={<Wallet className="size-4" />}
          label={t("budgets.uncategorized")}
          value={formatMoney(uncategorized, { withDecimals: false })}
        />
      </div>

      <section className="rounded-[24px] border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
              {t("budgets.categoryBudgets")}
            </h2>
            <p className="mt-0.5 text-[11px] text-subtle">
              {t("budgets.categoryDescription")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              loading={copying}
              onClick={() => void copyLastMonth()}
              className="gap-1.5"
            >
              <Copy className="size-3.5" />
              {t("budgets.copyLastMonth")}
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => openCategory(null)}
              disabled={categories.filter((category) => category.kind === "expense").length <= rows.length}
            >
              <Plus className="size-3.5" />
              {t("budgets.addCategory")}
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Target className="size-6" />}
            title={t("budgets.noCategoryBudgets")}
            description={t("budgets.noCategoryBudgetsDescription")}
            action={
              <Button size="sm" onClick={() => openCategory(null)}>
                <Plus className="size-3.5" />
                {t("budgets.addCategory")}
              </Button>
            }
            compact
          />
        ) : (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {rows.map((row) => (
              <CategoryBudgetCard
                key={row.budget.id}
                row={row}
                themeMode={resolved}
                locale={locale}
                onEdit={() => openCategory(row.budget)}
                labels={{
                  spentOf: t("budgets.spentOf", {
                    spent: formatMoney(row.spent, { withDecimals: false }),
                    total: formatMoney(row.budget.amountSatang, {
                      withDecimals: false,
                    }),
                  }),
                  onTrack: t("budgets.onTrack"),
                  nearing: t("budgets.nearing"),
                  over: t("budgets.overBudget"),
                  remaining: t("budgets.remaining"),
                  overLabel: t("budgets.over"),
                }}
              />
            ))}
          </div>
        )}

        {uncategorized > 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface-2/50 p-3.5">
            <span className="grid size-9 place-items-center rounded-xl bg-surface text-base">
              ·
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink">
                {t("budgets.uncategorized")}
              </p>
              <p className="text-[10px] text-subtle">
                {t("common.uncategorized")}
              </p>
            </div>
            <Amount
              satang={uncategorized}
              withDecimals={false}
              className="text-[12px] font-semibold text-muted"
            />
          </div>
        ) : null}

        {rows.length > 0 && totalCategoryLimits > 0 ? (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-surface-2/50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] leading-relaxed text-subtle">
              {locale === "th"
                ? "ผลรวมงบหมวดหมู่ควรน้อยกว่าหรือเท่ากับงบประมาณรวม"
                : "Category limits work best when they add up to less than your overall budget."}
            </p>
            <span
              className={cn(
                "shrink-0 text-[10px] font-bold",
                overallBudget && totalCategoryLimits > overallBudget
                  ? "text-warning"
                  : "text-primary",
              )}
            >
              {formatMoney(totalCategoryLimits, { withDecimals: false })}
              {overallBudget
                ? ` / ${formatMoney(overallBudget, { withDecimals: false })}`
                : ""}
            </span>
          </div>
        ) : null}
      </section>

      <BudgetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        month={month}
        overall={sheetOverall}
        editingBudget={editingBudget}
        categories={categories}
        budgetedCategoryIds={budgetedCategoryIds}
      />
    </div>
  );
}

function BudgetStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "expense" | "income" | "primary" | "sky";
}) {
  const toneClass = {
    expense: "text-expense",
    income: "text-income",
    primary: "text-ink",
    sky: "text-sky",
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-3">
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-subtle">
        {label}
      </p>
      <p className={cn("tnum mt-1 truncate text-[13px] font-bold", toneClass)}>
        {value}
      </p>
    </div>
  );
}

function SummaryChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-subtle">
          {label}
        </p>
        <p className="tnum mt-0.5 truncate text-[12px] font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function CategoryBudgetCard({
  row,
  themeMode,
  locale,
  onEdit,
  labels,
}: {
  row: BudgetRow;
  themeMode: "light" | "dark";
  locale: "th" | "en";
  onEdit: () => void;
  labels: {
    spentOf: string;
    onTrack: string;
    nearing: string;
    over: string;
    remaining: string;
    overLabel: string;
  };
}) {
  const color = row.category
    ? categoryColorValue(row.category.color, themeMode)
    : "var(--muted)";
  const statusLabel =
    row.status === "over"
      ? labels.over
      : row.status === "nearing"
        ? labels.nearing
        : labels.onTrack;
  const statusClass =
    row.status === "over"
      ? "bg-expense-soft text-expense"
      : row.status === "nearing"
        ? "bg-warning-soft text-warning"
        : "bg-income-soft text-income";
  const remaining = row.budget.amountSatang - row.spent;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group rounded-2xl border border-line bg-surface-2/45 p-3.5 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl text-base"
          style={{ backgroundColor: `${color}16` }}
        >
          {row.category?.icon ?? "·"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-ink">
            {row.category ? categoryLabel(row.category, locale) : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-subtle">{labels.spentOf}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold", statusClass)}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <span
          className="block h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, row.percent)}%`,
            backgroundColor:
              row.status === "over"
                ? "var(--expense)"
                : row.status === "nearing"
                  ? "var(--warning)"
                  : color,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-subtle">
          {Math.round(row.percent)}%
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold",
            remaining < 0 ? "text-expense" : "text-muted",
          )}
        >
          {remaining < 0 ? labels.overLabel : labels.remaining}{" "}
          <Amount
            satang={Math.abs(remaining)}
            withDecimals={false}
            className="inline"
          />
        </span>
        <Pencil className="size-3 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  );
}
