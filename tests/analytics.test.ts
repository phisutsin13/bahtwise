import { describe, expect, it } from "vitest";
import {
  buildBuckets,
  buildSummary,
  categoryTotals,
  periodRange,
  shiftPeriod,
  totalsForRange,
} from "@/lib/analytics";
import { addDays, addMonths, endOfMonth, startOfMonth, startOfWeek } from "@/lib/date";
import type { Category, Transaction } from "@/lib/types";

const food: Category = {
  id: "cat-food",
  slug: "food",
  name: "Food & drinks",
  icon: "🍜",
  color: "coral",
  kind: "expense",
};
const salary: Category = {
  id: "cat-salary",
  slug: "salary",
  name: "Salary",
  icon: "💼",
  color: "emerald",
  kind: "income",
};

function tx(
  id: string,
  kind: "income" | "expense",
  amountSatang: number,
  occurredOn: string,
  categoryId: string | null = null,
): Transaction {
  return {
    id,
    kind,
    amountSatang,
    categoryId,
    note: "",
    occurredOn,
    createdAt: `${occurredOn}T12:00:00.000Z`,
  };
}

const transactions = [
  tx("1", "income", 5_000_000, "2026-03-01", salary.id),
  tx("2", "expense", 120_000, "2026-03-02", food.id),
  tx("3", "expense", 80_000, "2026-03-02", food.id),
  tx("4", "expense", 300_000, "2026-03-15", null),
  tx("5", "expense", 99_900, "2026-02-28", food.id),
  tx("6", "income", 1_000_000, "2026-02-10", salary.id),
];

describe("date helpers", () => {
  it("handles month boundaries without UTC drift", () => {
    expect(startOfMonth("2026-03-18")).toBe("2026-03-01");
    expect(endOfMonth("2026-03-18")).toBe("2026-03-31");
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });

  it("adds months by clamping to the last valid day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });

  it("uses Monday as the start of the week", () => {
    expect(startOfWeek("2026-03-18")).toBe("2026-03-16");
    expect(startOfWeek("2026-03-16")).toBe("2026-03-16");
    expect(startOfWeek("2026-03-22")).toBe("2026-03-16");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("period ranges", () => {
  it("builds day, week, month and year ranges", () => {
    expect(periodRange("day", "2026-03-18", "en")).toMatchObject({
      start: "2026-03-18",
      end: "2026-03-18",
      days: 1,
    });
    expect(periodRange("week", "2026-03-18", "en")).toMatchObject({
      start: "2026-03-16",
      end: "2026-03-22",
      days: 7,
    });
    expect(periodRange("month", "2026-03-18", "en")).toMatchObject({
      start: "2026-03-01",
      end: "2026-03-31",
      days: 31,
    });
    expect(periodRange("year", "2026-03-18", "en")).toMatchObject({
      start: "2026-01-01",
      end: "2026-12-31",
      days: 365,
    });
  });

  it("shifts periods in both directions", () => {
    expect(shiftPeriod("month", "2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftPeriod("week", "2026-03-18", -1)).toBe("2026-03-11");
    expect(shiftPeriod("day", "2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftPeriod("year", "2026-03-18", 1)).toBe("2027-03-18");
  });
});

describe("totals and breakdowns", () => {
  it("totals only transactions inside the range", () => {
    const totals = totalsForRange(transactions, "2026-03-01", "2026-03-31");
    expect(totals.income).toBe(5_000_000);
    expect(totals.expense).toBe(500_000);
    expect(totals.net).toBe(4_500_000);
    expect(totals.count).toBe(4);
    expect(totals.activeDays).toBe(3);
    expect(totals.largestExpense?.id).toBe("4");
  });

  it("groups categories and computes shares", () => {
    const categories = categoryTotals(
      transactions,
      [food, salary],
      "2026-03-01",
      "2026-03-31",
      "expense",
    );
    expect(categories).toHaveLength(2);
    const foodTotal = categories.find((entry) => entry.categoryId === food.id);
    const uncategorized = categories.find((entry) => entry.categoryId === null);
    expect(foodTotal?.amountSatang).toBe(200_000);
    expect(foodTotal?.count).toBe(2);
    expect(uncategorized?.amountSatang).toBe(300_000);
    expect((foodTotal?.share ?? 0) + (uncategorized?.share ?? 0)).toBeCloseTo(1, 10);
  });

  it("builds one bucket per day for a month", () => {
    const { buckets, start, end } = buildBuckets(
      transactions,
      "month",
      "2026-03-18",
      "en",
    );
    expect(start).toBe("2026-03-01");
    expect(end).toBe("2026-03-31");
    expect(buckets).toHaveLength(31);
    expect(buckets[1]).toMatchObject({ income: 0, expense: 200_000, count: 2 });
  });

  it("builds twelve buckets for a year", () => {
    const { buckets } = buildBuckets(transactions, "year", "2026-03-18", "en");
    expect(buckets).toHaveLength(12);
    expect(buckets[2].expense).toBe(500_000);
    expect(buckets[1].expense).toBe(99_900);
  });

  it("summarises the month with previous-period comparisons", () => {
    const summary = buildSummary(
      transactions,
      [food, salary],
      "month",
      "2026-03-18",
      "en",
    );
    expect(summary.range.start).toBe("2026-03-01");
    expect(summary.totals.expense).toBe(500_000);
    expect(summary.previousTotals.expense).toBe(99_900);
    expect(summary.savingsRate).toBe(90);
    expect(summary.expenseChangePct).toBe(401);
    expect(summary.categories[0].categoryId).toBeNull();
  });
});
