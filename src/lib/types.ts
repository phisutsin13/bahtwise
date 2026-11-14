export type TransactionKind = "income" | "expense";

export type Locale = "th" | "en";

export type ThemeMode = "light" | "dark" | "system";

export type CategoryColor =
  | "emerald"
  | "coral"
  | "amber"
  | "sky"
  | "violet"
  | "rose"
  | "lime"
  | "slate";

export type Category = {
  id: string;
  /** Stable key for the built-in categories. Custom categories have `null`. */
  slug: string | null;
  name: string;
  icon: string;
  color: CategoryColor;
  kind: TransactionKind;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amountSatang: number;
  categoryId: string | null;
  note: string;
  /** Local calendar day, formatted as YYYY-MM-DD. */
  occurredOn: string;
  createdAt: string;
};

export type TransactionInput = {
  kind: TransactionKind;
  amountSatang: number;
  categoryId: string | null;
  note: string;
  occurredOn: string;
};

export type CategoryBudget = {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM-01
  amountSatang: number;
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  monthlyBudgetSatang: number | null;
  locale: Locale;
  createdAt: string;
};

export type AppUser = {
  id: string;
  email?: string;
  isDemo: boolean;
};

export type TransactionFilters = {
  kind: "all" | TransactionKind;
  categoryId: "all" | string;
  from: string | null;
  to: string | null;
  query: string;
};

export type NewCategoryInput = {
  name: string;
  icon: string;
  color: CategoryColor;
  kind: TransactionKind;
};

export type BackupData = {
  version: 1;
  exportedAt: string;
  profile: Profile;
  categories: Category[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
};

export type DataSourceMode = "supabase" | "demo";
