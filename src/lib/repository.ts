import type {
  Category,
  CategoryBudget,
  NewCategoryInput,
  Profile,
  Transaction,
  TransactionInput,
  DataSourceMode,
} from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDemoSeed, DEMO_USER_ID, type DemoSeed } from "./demo-data";
import { debugError, debugLog } from "./logger";

export interface FinanceRepository {
  readonly mode: DataSourceMode;
  readonly userId: string;
  getProfile(): Promise<Profile>;
  listCategories(): Promise<Category[]>;
  listTransactions(): Promise<Transaction[]>;
  listBudgets(): Promise<CategoryBudget[]>;
  addTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  restoreTransaction(transaction: Transaction): Promise<Transaction>;
  updateProfile(patch: {
    displayName?: string;
    monthlyBudgetSatang?: number | null;
    locale?: "th" | "en";
  }): Promise<Profile>;
  addCategory(input: NewCategoryInput): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  upsertCategoryBudget(
    categoryId: string,
    month: string,
    amountSatang: number,
  ): Promise<CategoryBudget>;
  deleteCategoryBudget(id: string): Promise<void>;
  clearTransactions(): Promise<void>;
  resetDemo?(): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly code: string = "unknown",
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Demo store                                */
/* -------------------------------------------------------------------------- */

const DEMO_KEY_PREFIX = "mymoney.demo.v1.";

type DemoStored = DemoSeed;

export class DemoRepository implements FinanceRepository {
  readonly mode = "demo" as const;
  readonly userId: string;
  private storage: Storage;
  private locale: "th" | "en";
  private state: DemoStored | null = null;

  constructor(
    userId = DEMO_USER_ID,
    storage: Storage = window.localStorage,
    locale: "th" | "en" = "en",
  ) {
    this.userId = userId;
    this.storage = storage;
    this.locale = locale;
  }

  static storageKey(userId: string): string {
    return `${DEMO_KEY_PREFIX}${userId}`;
  }

  private load(): DemoStored {
    if (this.state) return this.state;
    const key = DemoRepository.storageKey(this.userId);
    try {
      const raw = this.storage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoStored;
        if (
          parsed &&
          Array.isArray(parsed.transactions) &&
          Array.isArray(parsed.categories) &&
          parsed.profile
        ) {
          this.state = parsed;
          parsed.profile.id = this.userId;
          return parsed;
        }
      }
    } catch (error) {
      debugError("demo.read_failed", error);
    }
    const seed = createDemoSeed(this.locale);
    seed.profile.id = this.userId;
    this.state = seed;
    this.persist();
    return seed;
  }

  private persist(): void {
    if (!this.state) return;
    try {
      this.storage.setItem(
        DemoRepository.storageKey(this.userId),
        JSON.stringify(this.state),
      );
    } catch (error) {
      debugError("demo.write_failed", error);
      throw new RepositoryError("storage", "store_failed");
    }
  }

  async getProfile(): Promise<Profile> {
    return { ...this.load().profile };
  }

  async listCategories(): Promise<Category[]> {
    return this.load().categories.map((category) => ({ ...category }));
  }

  async listTransactions(): Promise<Transaction[]> {
    return this.load()
      .transactions.map((transaction) => ({ ...transaction }))
      .sort(compareTransactions);
  }

  async listBudgets(): Promise<CategoryBudget[]> {
    return this.load().budgets.map((budget) => ({ ...budget }));
  }

  async addTransaction(input: TransactionInput): Promise<Transaction> {
    const state = this.load();
    const transaction: Transaction = {
      ...input,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    state.transactions.push(transaction);
    this.persist();
    debugLog("demo.transaction_added", { kind: input.kind, occurredOn: input.occurredOn });
    return { ...transaction };
  }

  async updateTransaction(
    id: string,
    input: TransactionInput,
  ): Promise<Transaction> {
    const state = this.load();
    const index = state.transactions.findIndex((transaction) => transaction.id === id);
    if (index === -1) throw new RepositoryError("Transaction not found", "not_found");
    const updated: Transaction = {
      ...state.transactions[index],
      ...input,
      id,
    };
    state.transactions[index] = updated;
    this.persist();
    return { ...updated };
  }

  async deleteTransaction(id: string): Promise<void> {
    const state = this.load();
    state.transactions = state.transactions.filter(
      (transaction) => transaction.id !== id,
    );
    this.persist();
    debugLog("demo.transaction_deleted", { id });
  }

  async restoreTransaction(transaction: Transaction): Promise<Transaction> {
    const state = this.load();
    if (!state.transactions.some((entry) => entry.id === transaction.id)) {
      state.transactions.push({ ...transaction });
      this.persist();
    }
    return { ...transaction };
  }

  async updateProfile(patch: {
    displayName?: string;
    monthlyBudgetSatang?: number | null;
    locale?: "th" | "en";
  }): Promise<Profile> {
    const state = this.load();
    state.profile = { ...state.profile, ...patch };
    this.persist();
    return { ...state.profile };
  }

  async addCategory(input: NewCategoryInput): Promise<Category> {
    const state = this.load();
    const name = input.name.trim();
    if (!name) throw new RepositoryError("Category name required", "validation");
    const exists = state.categories.some(
      (category) =>
        category.kind === input.kind &&
        category.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (exists) throw new RepositoryError("Duplicate category", "duplicate");
    const category: Category = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cat-${Date.now()}`,
      slug: null,
      name,
      icon: input.icon,
      color: input.color,
      kind: input.kind,
    };
    state.categories.push(category);
    this.persist();
    return { ...category };
  }

  async deleteCategory(id: string): Promise<void> {
    const state = this.load();
    const category = state.categories.find((entry) => entry.id === id);
    if (!category) return;
    if (category.slug) {
      throw new RepositoryError("Built-in categories cannot be deleted", "forbidden");
    }
    state.categories = state.categories.filter((entry) => entry.id !== id);
    state.transactions = state.transactions.map((transaction) =>
      transaction.categoryId === id
        ? { ...transaction, categoryId: null }
        : transaction,
    );
    state.budgets = state.budgets.filter((budget) => budget.categoryId !== id);
    this.persist();
  }

  async upsertCategoryBudget(
    categoryId: string,
    month: string,
    amountSatang: number,
  ): Promise<CategoryBudget> {
    const state = this.load();
    const existing = state.budgets.find(
      (budget) => budget.categoryId === categoryId && budget.month === month,
    );
    if (existing) {
      existing.amountSatang = amountSatang;
      this.persist();
      return { ...existing };
    }
    const budget: CategoryBudget = {
      id: `budget-${categoryId}-${month}`,
      categoryId,
      month,
      amountSatang,
    };
    state.budgets.push(budget);
    this.persist();
    return { ...budget };
  }

  async deleteCategoryBudget(id: string): Promise<void> {
    const state = this.load();
    state.budgets = state.budgets.filter((budget) => budget.id !== id);
    this.persist();
  }

  async clearTransactions(): Promise<void> {
    const state = this.load();
    state.transactions = [];
    this.persist();
  }

  async resetDemo(): Promise<void> {
    const seed = createDemoSeed(this.locale);
    seed.profile.id = this.userId;
    this.state = seed;
    this.persist();
  }
}

export function compareTransactions(a: Transaction, b: Transaction): number {
  if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

/* -------------------------------------------------------------------------- */
/*                              Supabase repository                           */
/* -------------------------------------------------------------------------- */

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  monthly_budget_satang: number | null;
  locale: string | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  slug: string | null;
  name: string;
  icon: string;
  color: string;
  kind: string;
};

type TransactionRow = {
  id: string;
  kind: string;
  amount_satang: number;
  category_id: string | null;
  note: string | null;
  occurred_on: string;
  created_at: string;
};

type BudgetRow = {
  id: string;
  category_id: string;
  month: string;
  amount_satang: number;
};

type SupabaseLike = SupabaseClient;

function mapProfile(row: ProfileRow, email?: string): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    email,
    monthlyBudgetSatang: row.monthly_budget_satang,
    locale: row.locale === "th" ? "th" : "en",
    createdAt: row.created_at,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    color: (row.color || "slate") as Category["color"],
    kind: row.kind === "income" ? "income" : "expense",
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    kind: row.kind === "income" ? "income" : "expense",
    amountSatang: Number(row.amount_satang),
    categoryId: row.category_id,
    note: row.note ?? "",
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
  };
}

function mapBudget(row: BudgetRow): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.category_id,
    month: row.month,
    amountSatang: Number(row.amount_satang),
  };
}

function throwDb(error: { message?: string; code?: string } | null): never {
  debugError("supabase.request_failed", error);
  throw new RepositoryError(error?.message || "Database request failed", error?.code || "db");
}

export class SupabaseRepository implements FinanceRepository {
  readonly mode = "supabase" as const;
  readonly userId: string;
  private client: SupabaseLike;
  private email?: string;

  constructor(client: SupabaseLike, userId: string, email?: string) {
    this.client = client;
    this.userId = userId;
    this.email = email;
  }

  async getProfile(): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", this.userId)
      .maybeSingle();
    if (error) throwDb(error);
    if (!data) {
      const fallback: Profile = {
        id: this.userId,
        username: this.email?.split("@")[0] || "user",
        displayName: this.email?.split("@")[0] || "User",
        email: this.email,
        monthlyBudgetSatang: null,
        locale: "th",
        createdAt: new Date().toISOString(),
      };
      return fallback;
    }
    return mapProfile(data as ProfileRow, this.email);
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.client
      .from("categories")
      .select("id,slug,name,icon,color,kind")
      .order("created_at", { ascending: true });
    if (error) throwDb(error);
    return ((data ?? []) as CategoryRow[]).map(mapCategory);
  }

  async listTransactions(): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from("transactions")
      .select("id,kind,amount_satang,category_id,note,occurred_on,created_at")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throwDb(error);
    return ((data ?? []) as TransactionRow[]).map(mapTransaction);
  }

  async listBudgets(): Promise<CategoryBudget[]> {
    const { data, error } = await this.client
      .from("category_budgets")
      .select("id,category_id,month,amount_satang");
    if (error) throwDb(error);
    return ((data ?? []) as BudgetRow[]).map(mapBudget);
  }

  async addTransaction(input: TransactionInput): Promise<Transaction> {
    const { data, error } = await this.client
      .from("transactions")
      .insert({
        user_id: this.userId,
        kind: input.kind,
        amount_satang: input.amountSatang,
        category_id: input.categoryId,
        note: input.note,
        occurred_on: input.occurredOn,
      })
      .select("id,kind,amount_satang,category_id,note,occurred_on,created_at")
      .single();
    if (error) throwDb(error);
    debugLog("supabase.transaction_added", { kind: input.kind });
    return mapTransaction(data as TransactionRow);
  }

  async updateTransaction(
    id: string,
    input: TransactionInput,
  ): Promise<Transaction> {
    const { data, error } = await this.client
      .from("transactions")
      .update({
        kind: input.kind,
        amount_satang: input.amountSatang,
        category_id: input.categoryId,
        note: input.note,
        occurred_on: input.occurredOn,
      })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select("id,kind,amount_satang,category_id,note,occurred_on,created_at")
      .single();
    if (error) throwDb(error);
    return mapTransaction(data as TransactionRow);
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await this.client
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throwDb(error);
  }

  async restoreTransaction(transaction: Transaction): Promise<Transaction> {
    const { data, error } = await this.client
      .from("transactions")
      .insert({
        user_id: this.userId,
        kind: transaction.kind,
        amount_satang: transaction.amountSatang,
        category_id: transaction.categoryId,
        note: transaction.note,
        occurred_on: transaction.occurredOn,
      })
      .select("id,kind,amount_satang,category_id,note,occurred_on,created_at")
      .single();
    if (error) throwDb(error);
    return mapTransaction(data as TransactionRow);
  }

  async updateProfile(patch: {
    displayName?: string;
    monthlyBudgetSatang?: number | null;
    locale?: "th" | "en";
  }): Promise<Profile> {
    const row: Record<string, unknown> = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName.trim();
    if (patch.monthlyBudgetSatang !== undefined) {
      row.monthly_budget_satang = patch.monthlyBudgetSatang;
    }
    if (patch.locale !== undefined) row.locale = patch.locale;
    row.updated_at = new Date().toISOString();
    const { data, error } = await this.client
      .from("profiles")
      .update(row)
      .eq("id", this.userId)
      .select("*")
      .single();
    if (error) throwDb(error);
    return mapProfile(data as ProfileRow, this.email);
  }

  async addCategory(input: NewCategoryInput): Promise<Category> {
    const { data, error } = await this.client
      .from("categories")
      .insert({
        user_id: this.userId,
        slug: null,
        name: input.name.trim(),
        icon: input.icon,
        color: input.color,
        kind: input.kind,
      })
      .select("id,slug,name,icon,color,kind")
      .single();
    if (error) throwDb(error);
    return mapCategory(data as CategoryRow);
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId)
      .is("slug", null);
    if (error) throwDb(error);
  }

  async upsertCategoryBudget(
    categoryId: string,
    month: string,
    amountSatang: number,
  ): Promise<CategoryBudget> {
    const { data, error } = await this.client
      .from("category_budgets")
      .upsert(
        {
          user_id: this.userId,
          category_id: categoryId,
          month,
          amount_satang: amountSatang,
        },
        { onConflict: "user_id,category_id,month" },
      )
      .select("id,category_id,month,amount_satang")
      .single();
    if (error) throwDb(error);
    return mapBudget(data as BudgetRow);
  }

  async deleteCategoryBudget(id: string): Promise<void> {
    const { error } = await this.client
      .from("category_budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);
    if (error) throwDb(error);
  }

  async clearTransactions(): Promise<void> {
    const { error } = await this.client
      .from("transactions")
      .delete()
      .eq("user_id", this.userId);
    if (error) throwDb(error);
  }
}
