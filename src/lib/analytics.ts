import {
  addDays,
  addMonths,
  eachDay,
  endOfMonth,
  formatDay,
  formatWeekRange,
  monthKey,
  parseISODate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toISODate,
  todayISO,
} from "./date";
import type { Category, Locale, Transaction } from "./types";
import type { TranslationKey } from "@/i18n/dictionaries";

export type Period = "day" | "week" | "month" | "year";

export type PeriodRange = {
  start: string;
  end: string;
  anchor: string;
  days: number;
  label: string;
};

export type Bucket = {
  key: string;
  label: string;
  shortLabel: string;
  income: number;
  expense: number;
  count: number;
};

export type CategoryTotal = {
  category: Category | null;
  categoryId: string | null;
  amountSatang: number;
  count: number;
  share: number;
};

export type PeriodTotals = {
  income: number;
  expense: number;
  net: number;
  count: number;
  activeDays: number;
  largestExpense: Transaction | null;
};

export type SummaryData = {
  period: Period;
  range: PeriodRange;
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
  previousRange: PeriodRange;
  buckets: Bucket[];
  categories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  avgPerDay: number;
  savingsRate: number | null;
  expenseChangePct: number | null;
  incomeChangePct: number | null;
  daysInRange: number;
  elapsedDays: number;
  projectedExpense: number;
};

export function periodRange(
  period: Period,
  anchorISO: string,
  locale: Locale,
): PeriodRange {
  if (period === "day") {
    return {
      start: anchorISO,
      end: anchorISO,
      anchor: anchorISO,
      days: 1,
      label: formatDay(anchorISO, locale, "long"),
    };
  }
  if (period === "week") {
    const start = startOfWeek(anchorISO);
    const end = addDays(start, 6);
    return { start, end, anchor: anchorISO, days: 7, label: formatWeekRange(start, locale) };
  }
  if (period === "month") {
    const start = startOfMonth(anchorISO);
    const end = endOfMonth(anchorISO);
    return { start, end, anchor: anchorISO, days: daysInclusive(start, end), label: formatDay(start, locale, "monthShort") };
  }
  const start = startOfYear(anchorISO);
  const end = `${anchorISO.slice(0, 4)}-12-31`;
  return {
    start,
    end,
    anchor: anchorISO,
    days: daysInclusive(start, end),
    label: new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-US", {
      year: "numeric",
    }).format(parseISODate(start)),
  };
}

export function shiftPeriod(period: Period, anchorISO: string, direction: -1 | 1): string {
  if (period === "day") return addDays(anchorISO, direction);
  if (period === "week") return addDays(anchorISO, direction * 7);
  if (period === "month") return addMonths(anchorISO, direction);
  const date = parseISODate(anchorISO);
  date.setFullYear(date.getFullYear() + direction);
  return toISODate(date);
}

function daysInclusive(startISO: string, endISO: string): number {
  return eachDay(startISO, endISO).length;
}

function inRange(transaction: Transaction, start: string, end: string): boolean {
  return transaction.occurredOn >= start && transaction.occurredOn <= end;
}

export function totalsForRange(
  transactions: Transaction[],
  start: string,
  end: string,
): PeriodTotals {
  let income = 0;
  let expense = 0;
  let count = 0;
  let largestExpense: Transaction | null = null;
  const days = new Set<string>();

  for (const transaction of transactions) {
    if (!inRange(transaction, start, end)) continue;
    count += 1;
    days.add(transaction.occurredOn);
    if (transaction.kind === "income") {
      income += transaction.amountSatang;
    } else {
      expense += transaction.amountSatang;
      if (!largestExpense || transaction.amountSatang > largestExpense.amountSatang) {
        largestExpense = transaction;
      }
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    count,
    activeDays: days.size,
    largestExpense,
  };
}

export function categoryTotals(
  transactions: Transaction[],
  categories: Category[],
  start: string,
  end: string,
  kind: "expense" | "income",
): CategoryTotal[] {
  const byCategory = new Map<string | null, { amount: number; count: number }>();
  let total = 0;
  for (const transaction of transactions) {
    if (transaction.kind !== kind || !inRange(transaction, start, end)) continue;
    const key = transaction.categoryId;
    const current = byCategory.get(key) ?? { amount: 0, count: 0 };
    current.amount += transaction.amountSatang;
    current.count += 1;
    byCategory.set(key, current);
    total += transaction.amountSatang;
  }

  return [...byCategory.entries()]
    .map(([categoryId, value]) => {
      const category = categories.find((entry) => entry.id === categoryId) ?? null;
      return {
        category,
        categoryId,
        amountSatang: value.amount,
        count: value.count,
        share: total > 0 ? value.amount / total : 0,
      };
    })
    .sort((a, b) => b.amountSatang - a.amountSatang);
}

export function buildBuckets(
  transactions: Transaction[],
  period: Period,
  anchorISO: string,
  locale: Locale,
): { buckets: Bucket[]; start: string; end: string } {
  if (period === "day") {
    const start = addDays(anchorISO, -13);
    const end = anchorISO;
    const buckets = eachDay(start, end).map((day) => ({
      key: day,
      label: formatDay(day, locale, "short"),
      shortLabel: formatDay(day, locale, "weekday"),
      ...bucketValues(transactions, day, day),
    }));
    return { buckets, start, end };
  }

  if (period === "week") {
    const start = startOfWeek(anchorISO);
    const end = addDays(start, 6);
    const buckets = eachDay(start, end).map((day) => ({
      key: day,
      label: formatDay(day, locale, "weekday"),
      shortLabel: formatDay(day, locale, "weekday").slice(0, 1),
      ...bucketValues(transactions, day, day),
    }));
    return { buckets, start, end };
  }

  if (period === "month") {
    const start = startOfMonth(anchorISO);
    const end = endOfMonth(anchorISO);
    const buckets = eachDay(start, end).map((day) => ({
      key: day,
      label: `${Number(day.slice(8, 10))}`,
      shortLabel: `${Number(day.slice(8, 10))}`,
      ...bucketValues(transactions, day, day),
    }));
    return { buckets, start, end };
  }

  const year = Number(anchorISO.slice(0, 4));
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${`${index + 1}`.padStart(2, "0")}-01`;
    const bucketStart = month;
    const bucketEnd = endOfMonth(month);
    const label = new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-gregory" : "en-US", {
      month: "short",
    }).format(parseISODate(month));
    return {
      key: month,
      label,
      shortLabel: label.slice(0, 1),
      ...bucketValues(transactions, bucketStart, bucketEnd),
    };
  });
  return { buckets, start, end };
}

function bucketValues(transactions: Transaction[], start: string, end: string) {
  const totals = totalsForRange(transactions, start, end);
  return { income: totals.income, expense: totals.expense, count: totals.count };
}

function changePercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function buildSummary(
  transactions: Transaction[],
  categories: Category[],
  period: Period,
  anchorISO: string,
  locale: Locale,
  today = todayISO(),
): SummaryData {
  const range = periodRange(period, anchorISO, locale);
  const previousAnchor = shiftPeriod(period, range.anchor, -1);
  const previousRange = periodRange(period, previousAnchor, locale);
  const totals = totalsForRange(transactions, range.start, range.end);
  const previousTotals = totalsForRange(
    transactions,
    previousRange.start,
    previousRange.end,
  );
  const { buckets } = buildBuckets(transactions, period, range.anchor, locale);
  const categoriesForPeriod = categoryTotals(
    transactions,
    categories,
    range.start,
    range.end,
    "expense",
  );
  const incomeCategories = categoryTotals(
    transactions,
    categories,
    range.start,
    range.end,
    "income",
  );

  const elapsedDays = Math.max(
    1,
    today >= range.start && today <= range.end
      ? daysInclusive(range.start, today)
      : today > range.end
        ? range.days
        : 1,
  );
  const projectedExpense =
    period === "month" && today >= range.start && today <= range.end
      ? Math.round((totals.expense / Math.max(1, elapsedDays)) * range.days)
      : totals.expense;

  return {
    period,
    range,
    totals,
    previousTotals,
    previousRange,
    buckets,
    categories: categoriesForPeriod,
    incomeCategories,
    avgPerDay: Math.round(totals.expense / Math.max(1, period === "day" ? 1 : range.days)),
    savingsRate:
      totals.income > 0
        ? Math.round(((totals.income - totals.expense) / totals.income) * 100)
        : null,
    expenseChangePct: changePercent(totals.expense, previousTotals.expense),
    incomeChangePct: changePercent(totals.income, previousTotals.income),
    daysInRange: range.days,
    elapsedDays,
    projectedExpense,
  };
}

export function periodLabelKey(period: Period): TranslationKey {
  return `summary.${period}` as TranslationKey;
}

export function insightComparisonKey(diff: number): TranslationKey {
  if (diff > 0) return "summary.moreThanPrevious";
  if (diff < 0) return "summary.lessThanPrevious";
  return "summary.sameAsPrevious";
}

export function currentMonthSpend(transactions: Transaction[], anchorISO: string): {
  spent: number;
  income: number;
  days: number;
} {
  const start = startOfMonth(anchorISO);
  const end = endOfMonth(anchorISO);
  const totals = totalsForRange(transactions, start, end);
  return { spent: totals.expense, income: totals.income, days: totals.activeDays };
}

export function monthlySpendFor(
  transactions: Transaction[],
  monthISO: string,
): { spent: number; income: number } {
  const start = startOfMonth(monthISO);
  const totals = totalsForRange(transactions, start, endOfMonth(start));
  return { spent: totals.expense, income: totals.income };
}

export function categorySpend(
  transactions: Transaction[],
  categoryId: string,
  monthISO: string,
): number {
  const start = startOfMonth(monthISO);
  const end = endOfMonth(start);
  return transactions.reduce((total, transaction) => {
    if (
      transaction.kind === "expense" &&
      transaction.categoryId === categoryId &&
      transaction.occurredOn >= start &&
      transaction.occurredOn <= end
    ) {
      return total + transaction.amountSatang;
    }
    return total;
  }, 0);
}

export function monthKeyOf(iso: string): string {
  return monthKey(iso);
}
