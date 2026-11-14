"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Category,
  CategoryBudget,
  NewCategoryInput,
  Profile,
  Transaction,
  TransactionInput,
} from "@/lib/types";
import {
  DemoRepository,
  SupabaseRepository,
  type FinanceRepository,
} from "@/lib/repository";
import { debugError, debugLog } from "@/lib/logger";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { useLocale } from "./locale-provider";

type FinanceContextValue = {
  ready: boolean;
  error: string | null;
  profile: Profile | null;
  categories: Category[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  isDemo: boolean;
  amountsHidden: boolean;
  toggleAmountsHidden: () => void;
  reload: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  restoreTransaction: (transaction: Transaction) => Promise<void>;
  setOverallBudget: (amountSatang: number | null) => Promise<void>;
  upsertCategoryBudget: (
    categoryId: string,
    month: string,
    amountSatang: number,
  ) => Promise<void>;
  deleteCategoryBudget: (id: string) => Promise<void>;
  addCategory: (input: NewCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updateLocalePreference: (locale: "th" | "en") => Promise<void>;
  clearTransactions: () => Promise<void>;
  resetDemo: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);
const PRIVACY_KEY = "mymoney.hideAmounts";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemo } = useAuth();
  const { locale } = useLocale();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [amountsHidden, setAmountsHidden] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PRIVACY_KEY);
      if (stored === "1") setAmountsHidden(true);
    } catch {
      // Non-essential preference.
    }
  }, []);

  const repository = useMemo<FinanceRepository | null>(() => {
    if (!user) return null;
    if (user.isDemo) {
      return new DemoRepository(user.id, window.localStorage, locale);
    }
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    return new SupabaseRepository(client, user.id, user.email);
  }, [user, locale]);

  const load = useCallback(async () => {
    if (!repository) {
      setReady(false);
      setProfile(null);
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      return;
    }
    setReady(false);
    setError(null);
    try {
      const [nextProfile, nextCategories, nextTransactions, nextBudgets] =
        await Promise.all([
          repository.getProfile(),
          repository.listCategories(),
          repository.listTransactions(),
          repository.listBudgets(),
        ]);
      if (repository.userId !== user?.id) return;
      setProfile(nextProfile);
      setCategories(nextCategories);
      setTransactions(nextTransactions);
      setBudgets(nextBudgets);
      setReady(true);
      debugLog("finance.loaded", {
        isDemo: repository.mode === "demo",
        categoryCount: nextCategories.length,
        transactionCount: nextTransactions.length,
      });
    } catch (caught) {
      debugError("finance.load_failed", caught);
      setError("load_failed");
    }
  }, [repository, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleAmountsHidden = useCallback(() => {
    setAmountsHidden((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(PRIVACY_KEY, next ? "1" : "0");
      } catch {
        // Session-only change.
      }
      return next;
    });
  }, []);

  const requireRepo = useCallback((): FinanceRepository => {
    if (!repository) throw new Error("No active workspace");
    return repository;
  }, [repository]);

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      const created = await requireRepo().addTransaction(input);
      setTransactions((current) => [created, ...current]);
      return created;
    },
    [requireRepo],
  );

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const updated = await requireRepo().updateTransaction(id, input);
      setTransactions((current) =>
        current.map((transaction) => (transaction.id === id ? updated : transaction)),
      );
      return updated;
    },
    [requireRepo],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await requireRepo().deleteTransaction(id);
      setTransactions((current) =>
        current.filter((transaction) => transaction.id !== id),
      );
    },
    [requireRepo],
  );

  const restoreTransaction = useCallback(
    async (transaction: Transaction) => {
      const restored = await requireRepo().restoreTransaction(transaction);
      setTransactions((current) =>
        current.some((entry) => entry.id === restored.id)
          ? current
          : [restored, ...current],
      );
    },
    [requireRepo],
  );

  const setOverallBudget = useCallback(
    async (amountSatang: number | null) => {
      const updated = await requireRepo().updateProfile({
        monthlyBudgetSatang: amountSatang,
      });
      setProfile(updated);
    },
    [requireRepo],
  );

  const upsertCategoryBudget = useCallback(
    async (categoryId: string, month: string, amountSatang: number) => {
      const budget = await requireRepo().upsertCategoryBudget(
        categoryId,
        month,
        amountSatang,
      );
      setBudgets((current) => {
        const exists = current.some((entry) => entry.id === budget.id);
        return exists
          ? current.map((entry) => (entry.id === budget.id ? budget : entry))
          : [...current, budget];
      });
    },
    [requireRepo],
  );

  const deleteCategoryBudget = useCallback(
    async (id: string) => {
      await requireRepo().deleteCategoryBudget(id);
      setBudgets((current) => current.filter((entry) => entry.id !== id));
    },
    [requireRepo],
  );

  const addCategory = useCallback(
    async (input: NewCategoryInput) => {
      const category = await requireRepo().addCategory(input);
      setCategories((current) => [...current, category]);
      return category;
    },
    [requireRepo],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await requireRepo().deleteCategory(id);
      setCategories((current) => current.filter((entry) => entry.id !== id));
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.categoryId === id
            ? { ...transaction, categoryId: null }
            : transaction,
        ),
      );
      setBudgets((current) => current.filter((entry) => entry.categoryId !== id));
    },
    [requireRepo],
  );

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      const updated = await requireRepo().updateProfile({ displayName });
      setProfile(updated);
    },
    [requireRepo],
  );

  const updateLocalePreference = useCallback(
    async (nextLocale: "th" | "en") => {
      const updated = await requireRepo().updateProfile({ locale: nextLocale });
      setProfile(updated);
    },
    [requireRepo],
  );

  const clearTransactions = useCallback(async () => {
    await requireRepo().clearTransactions();
    setTransactions([]);
  }, [requireRepo]);

  const resetDemo = useCallback(async () => {
    const repo = requireRepo();
    if (!repo.resetDemo) return;
    await repo.resetDemo();
    await load();
  }, [requireRepo, load]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      error,
      profile,
      categories,
      transactions,
      budgets,
      isDemo,
      amountsHidden,
      toggleAmountsHidden,
      reload: load,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      restoreTransaction,
      setOverallBudget,
      upsertCategoryBudget,
      deleteCategoryBudget,
      addCategory,
      deleteCategory,
      updateDisplayName,
      updateLocalePreference,
      clearTransactions,
      resetDemo,
    }),
    [
      ready,
      error,
      profile,
      categories,
      transactions,
      budgets,
      isDemo,
      amountsHidden,
      toggleAmountsHidden,
      load,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      restoreTransaction,
      setOverallBudget,
      upsertCategoryBudget,
      deleteCategoryBudget,
      addCategory,
      deleteCategory,
      updateDisplayName,
      updateLocalePreference,
      clearTransactions,
      resetDemo,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
}

export function useCategoryById(id: string | null): Category | null {
  const { categories } = useFinance();
  return id ? categories.find((category) => category.id === id) ?? null : null;
}
