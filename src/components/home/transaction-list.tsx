"use client";

import { Pencil } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Category, Transaction } from "@/lib/types";
import type { TransactionGroup } from "@/lib/filters";
import { categoryColorValue, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useCurrentDate } from "@/providers/current-date-provider";
import { useTheme } from "@/providers/theme-provider";
import { Amount } from "@/components/ui/amount";

export function TransactionGroupList({
  groups,
  categories,
  onEdit,
}: {
  groups: TransactionGroup[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
}) {
  const { formatRelative, t } = useLocale();
  const { today } = useCurrentDate();
  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  return (
    <div className="divide-y divide-line">
      <AnimatePresence initial={false}>
      {groups.map((group) => {
        const net = group.income - group.expense;
        return (
          <motion.section
            key={group.date}
            layout="position"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="py-3 first:pt-1 last:pb-1"
          >
            <header className="mb-1 flex items-center justify-between gap-3 px-1">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-subtle">
                {formatRelative(group.date, today)}
              </h3>
              <div className="flex items-center gap-2 text-[12px] font-medium text-subtle">
                <span>{t("summary.transactionCount", { count: group.transactions.length })}</span>
                {net !== 0 ? (
                  <span
                    className={cn(
                      "tnum rounded-full px-1.5 py-0.5",
                      net > 0
                        ? "bg-income-soft text-income"
                        : "bg-expense-soft text-expense",
                    )}
                  >
                    {net > 0 ? "+" : "−"}
                    <Amount satang={Math.abs(net)} withDecimals={false} />
                  </span>
                ) : null}
              </div>
            </header>
            <div className="space-y-0.5">
              {group.transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={
                    transaction.categoryId
                      ? categoryById.get(transaction.categoryId) ?? null
                      : null
                  }
                  onEdit={onEdit}
                />
              ))}
            </div>
          </motion.section>
        );
      })}
      </AnimatePresence>
    </div>
  );
}

function TransactionRow({
  transaction,
  category,
  onEdit,
}: {
  transaction: Transaction;
  category: Category | null;
  onEdit: (transaction: Transaction) => void;
}) {
  const { resolved } = useTheme();
  const { locale, t } = useLocale();
  const income = transaction.kind === "income";
  const color = category
    ? categoryColorValue(category.color, resolved)
    : "var(--muted)";
  const label = category
    ? categoryLabel(category, locale)
    : t("common.uncategorized");

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={() => onEdit(transaction)}
      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2/80 focus-visible:bg-surface-2 focus-visible:outline-none"
      aria-label={t("a11y.editTransaction", { note: transaction.note || label })}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl text-[18px] transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `${color}16` }}
        aria-hidden="true"
      >
        {category?.icon ?? "·"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">
          {transaction.note || label}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-subtle">
          <span>{label}</span>
          <span aria-hidden="true">·</span>
          <span className={cn(income ? "text-income/80" : "text-expense/80")}>
            {income ? t("home.kindIncome") : t("home.kindExpense")}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "tnum flex shrink-0 items-baseline gap-0.5 text-[15px] font-semibold",
          income ? "text-income" : "text-expense",
        )}
      >
        <span aria-hidden="true">{income ? "+" : "−"}</span>
        <Amount satang={transaction.amountSatang} withDecimals={false} />
      </span>
      <Pencil
        className="size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      />
    </motion.button>
  );
}
