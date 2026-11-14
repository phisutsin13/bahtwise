import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  applyTransactionFilters,
  filterDateRange,
  groupTransactionsByDay,
  isFilterActive,
} from "@/lib/filters";
import type { Category, Transaction } from "@/lib/types";

const food: Category = {
  id: "food-id",
  slug: "food",
  name: "Food & drinks",
  icon: "🍜",
  color: "coral",
  kind: "expense",
};
const salary: Category = {
  id: "salary-id",
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
  categoryId: string | null,
  note = "",
): Transaction {
  return {
    id,
    kind,
    amountSatang,
    categoryId,
    note,
    occurredOn,
    createdAt: `${occurredOn}T10:00:00.000Z`,
  };
}

const rows = [
  tx("1", "expense", 5500, "2026-03-18", food.id, "Khao soi"),
  tx("2", "income", 500_000, "2026-03-01", salary.id, "March salary"),
  tx("3", "expense", 2000, "2026-03-17", null, "Coffee"),
  tx("4", "expense", 9900, "2026-02-20", food.id, "Groceries"),
];

describe("filter state", () => {
  it("detects active filters", () => {
    expect(isFilterActive(DEFAULT_FILTERS)).toBe(false);
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(
      isFilterActive({ ...DEFAULT_FILTERS, kind: "expense", query: "ramen" }),
    ).toBe(true);
    expect(
      activeFilterCount({
        ...DEFAULT_FILTERS,
        kind: "expense",
        categoryId: food.id,
        from: "2026-03-01",
        query: "ramen",
      }),
    ).toBe(4);
  });

  it("computes presets relative to a fixed today", () => {
    expect(filterDateRange("any", "2026-03-18")).toEqual({ from: null, to: null });
    expect(filterDateRange("7d", "2026-03-18")).toEqual({
      from: "2026-03-12",
      to: "2026-03-18",
    });
    expect(filterDateRange("30d", "2026-03-18")).toEqual({
      from: "2026-02-17",
      to: "2026-03-18",
    });
    expect(filterDateRange("month", "2026-03-18")).toEqual({
      from: "2026-03-01",
      to: "2026-03-18",
    });
  });
});

describe("applyTransactionFilters", () => {
  it("returns everything sorted newest first by default", () => {
    const result = applyTransactionFilters(rows, [food, salary], DEFAULT_FILTERS, "en");
    expect(result.map((row) => row.id)).toEqual(["1", "3", "2", "4"]);
  });

  it("filters by kind and category", () => {
    const expenses = applyTransactionFilters(
      rows,
      [food, salary],
      { ...DEFAULT_FILTERS, kind: "expense" },
      "en",
    );
    expect(expenses.map((row) => row.id)).toEqual(["1", "3", "4"]);

    const foodOnly = applyTransactionFilters(
      rows,
      [food, salary],
      { ...DEFAULT_FILTERS, categoryId: food.id },
      "en",
    );
    expect(foodOnly.map((row) => row.id)).toEqual(["1", "4"]);
  });

  it("filters by inclusive date bounds", () => {
    const result = applyTransactionFilters(
      rows,
      [food, salary],
      { ...DEFAULT_FILTERS, from: "2026-03-01", to: "2026-03-17" },
      "en",
    );
    expect(result.map((row) => row.id)).toEqual(["3", "2"]);
  });

  it("matches notes and localized category labels", () => {
    expect(
      applyTransactionFilters(
        rows,
        [food, salary],
        { ...DEFAULT_FILTERS, query: "khao" },
        "en",
      ).map((row) => row.id),
    ).toEqual(["1"]);

    expect(
      applyTransactionFilters(
        rows,
        [food, salary],
        { ...DEFAULT_FILTERS, query: "อาหาร" },
        "th",
      ).map((row) => row.id),
    ).toEqual(["1", "4"]);
  });
});

describe("groupTransactionsByDay", () => {
  it("groups rows, sums each day and sorts newest first", () => {
    const groups = groupTransactionsByDay(rows);
    expect(groups.map((group) => group.date)).toEqual([
      "2026-03-18",
      "2026-03-17",
      "2026-03-01",
      "2026-02-20",
    ]);
    const marchSecond = groups[0];
    expect(marchSecond.expense).toBe(5500);
    expect(marchSecond.income).toBe(0);
    expect(groups[2].income).toBe(500_000);
  });
});
