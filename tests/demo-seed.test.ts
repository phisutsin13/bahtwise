import { describe, expect, it } from "vitest";
import { createDemoSeed, DEMO_USER_ID } from "@/lib/demo-data";
import { endOfMonth, startOfMonth } from "@/lib/date";

describe("demo seed", () => {
  const today = "2026-03-18";
  const seed = createDemoSeed("en", today);

  it("is deterministic for a given day", () => {
    const again = createDemoSeed("en", today);
    expect(again.transactions).toEqual(seed.transactions);
    expect(again.budgets).toEqual(seed.budgets);
  });

  it("provides a year of realistic history", () => {
    expect(seed.categories).toHaveLength(16);
    expect(seed.transactions.length).toBeGreaterThan(300);
    expect(seed.transactions[0].occurredOn).toBe("2025-03-18");
    expect(seed.transactions.at(-1)?.occurredOn).toBe(today);
    expect(seed.transactions.every((row) => Number.isInteger(row.amountSatang))).toBe(
      true,
    );
    expect(seed.transactions.every((row) => row.amountSatang > 0)).toBe(true);
  });

  it("keeps the current month inside the overall budget", () => {
    const month = startOfMonth(today);
    const rows = seed.transactions.filter(
      (row) =>
        row.occurredOn >= month && row.occurredOn <= endOfMonth(today),
    );
    const income = rows
      .filter((row) => row.kind === "income")
      .reduce((sum, row) => sum + row.amountSatang, 0);
    const expense = rows
      .filter((row) => row.kind === "expense")
      .reduce((sum, row) => sum + row.amountSatang, 0);
    expect(expense).toBeGreaterThan(0);
    expect(expense).toBeLessThan(2_800_000);
    expect(income).toBeGreaterThanOrEqual(4_850_000);
  });

  it("seeds six months of category budgets", () => {
    expect(seed.budgets).toHaveLength(30);
    expect(new Set(seed.budgets.map((row) => row.month)).size).toBe(6);
    expect(seed.budgets.every((row) => Number.isInteger(row.amountSatang))).toBe(true);
  });

  it("stamps the demo profile with the requesting id", () => {
    expect(seed.profile.id).toBe(DEMO_USER_ID);
    expect(seed.profile.monthlyBudgetSatang).toBe(2_800_000);
    expect(seed.profile.locale).toBe("en");
  });
});
