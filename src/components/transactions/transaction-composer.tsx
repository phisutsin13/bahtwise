"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Trash2 } from "lucide-react";
import type { Transaction, TransactionKind } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import { addDays, todayISO } from "@/lib/date";
import { normalizeAmountInput, parseBahtToSatang, satangToBahtString } from "@/lib/money";
import { cn } from "@/lib/cn";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useToast } from "@/providers/toast-provider";
import { useTheme } from "@/providers/theme-provider";
import { categoryColorValue, categorySoftColor } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import type { TranslationKey } from "@/i18n/dictionaries";
import { debugError } from "@/lib/logger";

type ComposerContextValue = {
  openNew: (kind?: TransactionKind) => void;
  openEdit: (transaction: Transaction) => void;
  close: () => void;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);
const LAST_CATEGORY_KEY = "bahtwise.lastCategory.";

export function TransactionComposerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [initialKind, setInitialKind] = useState<TransactionKind>("expense");

  const openNew = useCallback((kind: TransactionKind = "expense") => {
    setEditing(null);
    setInitialKind(kind);
    setOpen(true);
  }, []);

  const openEdit = useCallback((transaction: Transaction) => {
    setEditing(transaction);
    setInitialKind(transaction.kind);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openNew, openEdit, close }),
    [openNew, openEdit, close],
  );

  return (
    <ComposerContext.Provider value={value}>
      {children}
      <TransactionComposer
        open={open}
        editing={editing}
        initialKind={initialKind}
        onClose={close}
      />
    </ComposerContext.Provider>
  );
}

export function useTransactionComposer(): ComposerContextValue {
  const context = useContext(ComposerContext);
  if (!context) {
    throw new Error("useTransactionComposer must be used within TransactionComposerProvider");
  }
  return context;
}

function TransactionComposer({
  open,
  editing,
  initialKind,
  onClose,
}: {
  open: boolean;
  editing: Transaction | null;
  initialKind: TransactionKind;
  onClose: () => void;
}) {
  const {
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
  } = useFinance();
  const { t, locale } = useLocale();
  const { resolved } = useTheme();
  const { toast } = useToast();

  const [kind, setKind] = useState<TransactionKind>(initialKind);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmingDelete(false);
    setError(null);
    setSaving(false);
    if (editing) {
      setKind(editing.kind);
      setAmount(satangToBahtString(editing.amountSatang));
      setCategoryId(editing.categoryId);
      setNote(editing.note);
      setOccurredOn(editing.occurredOn);
      return;
    }
    setKind(initialKind);
    setAmount("");
    setNote("");
    setOccurredOn(todayISO());
    let last: string | null = null;
    try {
      last = window.localStorage.getItem(`${LAST_CATEGORY_KEY}${initialKind}`);
    } catch {
      last = null;
    }
    const match = categories.find(
      (category) => category.id === last && category.kind === initialKind,
    );
    setCategoryId(match?.id ?? null);
  }, [open, editing, initialKind, categories]);

  const options = categories.filter((category) => category.kind === kind);
  const satang = parseBahtToSatang(amount);

  const handleKindChange = (next: TransactionKind) => {
    setKind(next);
    setCategoryId(null);
    setError(null);
  };

  const handleSave = async () => {
    const parsed = parseBahtToSatang(amount);
    if (parsed === null) {
      setError(amount.trim() && /^\d/.test(amount.trim()) ? "home.invalidAmount" : "home.amountRequired");
      return;
    }
    if (!occurredOn) {
      setError("home.dateRequired");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateTransaction(editing.id, {
          kind,
          amountSatang: parsed,
          categoryId,
          note: note.trim(),
          occurredOn,
        });
        toast({ title: t("home.transactionUpdated") });
      } else {
        await addTransaction({
          kind,
          amountSatang: parsed,
          categoryId,
          note: note.trim(),
          occurredOn,
        });
        toast({ title: t("home.transactionSaved") });
      }
      if (categoryId) {
        try {
          window.localStorage.setItem(`${LAST_CATEGORY_KEY}${kind}`, categoryId);
        } catch {
          // Optional convenience only.
        }
      }
      onClose();
    } catch (caught) {
      debugError("composer.save_failed", caught);
      setError("errors.generic");
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const snapshot = editing;
    setSaving(true);
    try {
      await deleteTransaction(snapshot.id);
      onClose();
      toast({
        title: t("home.deleted"),
        description: t("home.deleteUndoHint"),
        action: {
          label: t("home.undo"),
          onClick: async () => {
            try {
              await restoreTransaction(snapshot);
              toast({ title: t("home.restored") });
            } catch (caught) {
              debugError("composer.undo_failed", caught);
              toast({ title: t("toast.error"), variant: "error" });
            }
          },
        },
      });
    } catch (caught) {
      debugError("composer.delete_failed", caught);
      toast({ title: t("toast.error"), variant: "error" });
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? t("home.editTransaction") : t("home.newTransaction")}
      description={
        editing
          ? t("home.deleteUndoHint")
          : locale === "th"
            ? "บันทึกไว ๆ ในไม่กี่วินาที"
            : "Log it in a few seconds. Every baht counts."
      }
      icon={
        kind === "income" ? (
          <ArrowDownLeft className="size-5" />
        ) : (
          <ArrowUpRight className="size-5" />
        )
      }
      footer={
        confirmingDelete ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] font-medium text-expense">
              {locale === "th" ? "ลบรายการนี้?" : "Delete this transaction?"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none"
                onClick={() => setConfirmingDelete(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                className="flex-1 sm:flex-none"
                loading={saving}
                onClick={handleDelete}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {editing ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmingDelete(true)}
                aria-label={t("home.deleteTransaction")}
                className="text-expense hover:bg-expense-soft hover:text-expense"
              >
                <Trash2 className="size-[18px]" />
              </Button>
            ) : null}
            <Button
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={onClose}
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              loading={saving}
              onClick={handleSave}
            >
              {editing ? t("common.save") : t("home.addTransaction")}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5 pb-1">
        <Segmented
          fullWidth
          ariaLabel={t("home.filterKind")}
          value={kind}
          onChange={handleKindChange}
          options={[
            {
              value: "expense",
              label: t("home.kindExpense"),
              icon: <ArrowUpRight className="size-3.5" />,
            },
            {
              value: "income",
              label: t("home.kindIncome"),
              icon: <ArrowDownLeft className="size-3.5" />,
            },
          ]}
        />

        <div
          className={cn(
            "relative rounded-2xl border p-4 pb-3 transition-colors",
            kind === "income"
              ? "border-income/25 bg-income-soft/60"
              : "border-expense/20 bg-expense-soft/50",
          )}
        >
          <label
            htmlFor="transaction-amount"
            className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
          >
            {t("common.amount")}
          </label>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "font-display text-3xl font-medium",
                kind === "income" ? "text-income" : "text-expense",
              )}
            >
              ฿
            </span>
            <input
              id="transaction-amount"
              data-autofocus
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => {
                setAmount(normalizeAmountInput(event.target.value));
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSave();
                }
              }}
              placeholder="0.00"
              className="tnum min-w-0 flex-1 bg-transparent font-display text-[42px] font-semibold leading-none tracking-[-0.03em] text-ink outline-none placeholder:text-ink/20"
              aria-describedby="amount-preview"
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
              THB
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p id="amount-preview" className="text-[11px] text-muted">
              {satang !== null
                ? locale === "th"
                  ? `= ${satang.toLocaleString("th-TH")} สตางค์`
                  : `= ${satang.toLocaleString("en-US")} satang`
                : t("common.amount")}
            </p>
            <div className="flex gap-1">
              {[60, 100, 250, 500].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => {
                    setAmount(String(quick));
                    setError(null);
                  }}
                  className="rounded-lg border border-line bg-elevated/80 px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-primary/30 hover:text-primary"
                >
                  +{quick}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">
              {t("common.category")}
            </p>
            <span className="text-[11px] text-subtle">{t("common.optional")}</span>
          </div>
          <div className="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-4">
            {options.map((category) => {
              const selected = category.id === categoryId;
              const color = categoryColorValue(category.color, resolved);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(selected ? null : category.id);
                    setError(null);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 text-center transition-all duration-200",
                    selected
                      ? "border-transparent shadow-card"
                      : "border-line bg-surface-2/70 hover:border-line-strong hover:bg-surface-2",
                  )}
                  style={selected ? { backgroundColor: categorySoftColor(category.color), borderColor: `${color}55` } : undefined}
                  aria-pressed={selected}
                >
                  <span
                    className="grid size-8 place-items-center rounded-lg text-base"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    {category.icon}
                  </span>
                  <span
                    className="line-clamp-2 text-[10px] font-semibold leading-tight"
                    style={{ color: selected ? color : undefined }}
                  >
                    {categoryLabel(category, locale)}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2.5 text-center transition-all duration-200",
                categoryId === null
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-dashed border-line bg-transparent text-subtle hover:border-line-strong hover:text-muted",
              )}
            >
              <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-base">
                ·
              </span>
              <span className="text-[10px] font-semibold leading-tight">
                {t("common.uncategorized")}
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("common.date")} htmlFor="transaction-date">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="transaction-date"
                type="date"
                value={occurredOn}
                onChange={(event) => setOccurredOn(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-10 pr-3 text-sm text-ink focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setOccurredOn(todayISO())}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary-soft"
              >
                {t("common.today")}
              </button>
              <button
                type="button"
                onClick={() => setOccurredOn(addDays(todayISO(), -1))}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:bg-surface-2 hover:text-ink"
              >
                {t("common.yesterday")}
              </button>
            </div>
          </Field>

          <Field label={t("common.note")} htmlFor="transaction-note">
            <TextInput
              id="transaction-note"
              value={note}
              maxLength={140}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("home.notePlaceholder")}
              className="h-11"
            />
            <p className="text-[10px] text-subtle">{note.length}/140</p>
          </Field>
        </div>

        {error ? (
          <p className="rounded-lg bg-expense-soft px-3 py-2 text-xs font-medium text-expense" role="alert">
            {t(error)}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
