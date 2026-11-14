import { categoryLabel } from "./categories";
import { addDays, todayISO } from "./date";
import type { Category, Locale, Transaction, TransactionFilters } from "./types";

export const DEFAULT_FILTERS: TransactionFilters = {
  kind: "all",
  categoryId: "all",
  from: null,
  to: null,
  query: "",
};

export type DatePreset = "any" | "7d" | "30d" | "month";

export function isFilterActive(filters: TransactionFilters): boolean {
  return (
    filters.kind !== "all" ||
    filters.categoryId !== "all" ||
    filters.from !== null ||
    filters.to !== null ||
    filters.query.trim().length > 0
  );
}

export function activeFilterCount(filters: TransactionFilters): number {
  let count = 0;
  if (filters.kind !== "all") count += 1;
  if (filters.categoryId !== "all") count += 1;
  if (filters.from || filters.to) count += 1;
  if (filters.query.trim()) count += 1;
  return count;
}

export function filterDateRange(
  preset: DatePreset,
  today = todayISO(),
): { from: string | null; to: string | null } {
  if (preset === "7d") return { from: addDays(today, -6), to: today };
  if (preset === "30d") return { from: addDays(today, -29), to: today };
  if (preset === "month") {
    return { from: `${today.slice(0, 7)}-01`, to: today };
  }
  return { from: null, to: null };
}

function matchesQuery(
  transaction: Transaction,
  category: Category | null,
  query: string,
  locale: Locale,
): boolean {
  if (!query) return true;
  const haystack = [
    transaction.note,
    category ? categoryLabel(category, locale) : "",
    category?.name ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase(locale === "th" ? "th" : "en");
  return haystack.includes(query.toLocaleLowerCase(locale === "th" ? "th" : "en"));
}

export function applyTransactionFilters(
  transactions: Transaction[],
  categories: Category[],
  filters: TransactionFilters,
  locale: Locale,
): Transaction[] {
  const query = filters.query.trim();
  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  return transactions
    .filter((transaction) => {
      if (filters.kind !== "all" && transaction.kind !== filters.kind) return false;
      if (
        filters.categoryId !== "all" &&
        transaction.categoryId !== filters.categoryId
      ) {
        return false;
      }
      if (filters.from && transaction.occurredOn < filters.from) return false;
      if (filters.to && transaction.occurredOn > filters.to) return false;
      return matchesQuery(
        transaction,
        transaction.categoryId
          ? categoryById.get(transaction.categoryId) ?? null
          : null,
        query,
        locale,
      );
    })
    .sort(compareByDateAndCreatedAt);
}

export function compareByDateAndCreatedAt(
  a: Transaction,
  b: Transaction,
): number {
  if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1;
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export type TransactionGroup = {
  date: string;
  transactions: Transaction[];
  income: number;
  expense: number;
};

export function groupTransactionsByDay(
  transactions: Transaction[],
): TransactionGroup[] {
  const groups = new Map<string, TransactionGroup>();
  for (const transaction of transactions) {
    let group = groups.get(transaction.occurredOn);
    if (!group) {
      group = {
        date: transaction.occurredOn,
        transactions: [],
        income: 0,
        expense: 0,
      };
      groups.set(transaction.occurredOn, group);
    }
    group.transactions.push(transaction);
    if (transaction.kind === "income") {
      group.income += transaction.amountSatang;
    } else {
      group.expense += transaction.amountSatang;
    }
  }
  return [...groups.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
