"use client";

import { useEffect, useState } from "react";
import { Target, Trash2 } from "lucide-react";
import type { Category, CategoryBudget } from "@/lib/types";
import { categoryLabel } from "@/lib/categories";
import {
  normalizeAmountInput,
  parseBahtToSatang,
  satangToBahtString,
} from "@/lib/money";
import { cn } from "@/lib/cn";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";

export function BudgetSheet({
  open,
  onClose,
  month,
  overall,
  editingBudget,
  categories,
  budgetedCategoryIds,
}: {
  open: boolean;
  onClose: () => void;
  month: string;
  overall: boolean;
  editingBudget: CategoryBudget | null;
  categories: Category[];
  budgetedCategoryIds: string[];
}) {
  const {
    profile,
    setOverallBudget,
    upsertCategoryBudget,
    deleteCategoryBudget,
  } = useFinance();
  const { t, locale } = useLocale();
  const { toast } = useToast();

  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setConfirmingRemove(false);
    setError(null);
    if (overall) {
      setAmount(
        profile?.monthlyBudgetSatang
          ? satangToBahtString(profile.monthlyBudgetSatang)
          : "",
      );
      return;
    }
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAmount(satangToBahtString(editingBudget.amountSatang));
      return;
    }
    const available = categories.find(
      (category) =>
        category.kind === "expense" &&
        !budgetedCategoryIds.includes(category.id),
    );
    setCategoryId(available?.id ?? "");
    setAmount("");
  }, [
    open,
    overall,
    editingBudget,
    categories,
    budgetedCategoryIds,
    profile?.monthlyBudgetSatang,
  ]);

  const expenseCategories = categories.filter(
    (category) =>
      category.kind === "expense" &&
      (!budgetedCategoryIds.includes(category.id) ||
        category.id === editingBudget?.categoryId),
  );

  const save = async () => {
    const satang = parseBahtToSatang(amount);
    if (satang === null) {
      setError(t("errors.budgetInvalid"));
      return;
    }
    if (!overall && !categoryId) {
      setError(t("budgets.noCategory"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (overall) {
        await setOverallBudget(satang);
        toast({ title: t("budgets.overallSaved") });
      } else {
        await upsertCategoryBudget(categoryId, month, satang);
        toast({ title: t("budgets.categorySaved") });
      }
      onClose();
    } catch {
      setError(t("errors.generic"));
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editingBudget) return;
    setSaving(true);
    try {
      await deleteCategoryBudget(editingBudget.id);
      toast({ title: t("budgets.removed") });
      onClose();
    } catch {
      setError(t("errors.generic"));
      toast({ title: t("toast.error"), variant: "error" });
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={overall ? t("budgets.setOverall") : t("budgets.addCategory")}
      description={overall ? t("budgets.setOverallDescription") : t("budgets.categoryDescription")}
      icon={<Target className="size-5" />}
      size="sm"
      footer={
        confirmingRemove ? (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[12px] font-medium text-expense">
              {t("budgets.remove")}?
            </p>
            <Button variant="secondary" onClick={() => setConfirmingRemove(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" loading={saving} onClick={() => void remove()}>
              {t("common.delete")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!overall && editingBudget ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("budgets.remove")}
                className="text-expense hover:bg-expense-soft hover:text-expense"
                onClick={() => setConfirmingRemove(true)}
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
              className="flex-1"
              loading={saving}
              onClick={() => void save()}
              disabled={!overall && expenseCategories.length === 0}
            >
              {t("budgets.save")}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4 pb-2">
        {!overall ? (
          <Field label={t("common.category")} htmlFor="budget-category">
            <Select
              id="budget-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setError(null);
              }}
              disabled={Boolean(editingBudget)}
            >
              <option value="">{t("budgets.noCategory")}</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {categoryLabel(category, locale)}
                </option>
              ))}
            </Select>
            {expenseCategories.length === 0 ? (
              <p className="text-xs text-subtle">
                {locale === "th"
                  ? "ทุกหมวดมีงบประมาณแล้วในเดือนนี้"
                  : "Every expense category already has a budget this month."}
              </p>
            ) : null}
          </Field>
        ) : null}

        <Field
          label={t("budgets.amountLabel")}
          htmlFor="budget-amount"
          error={error}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-lg text-subtle">
              ฿
            </span>
            <input
              id="budget-amount"
              data-autofocus
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(normalizeAmountInput(event.target.value));
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save();
                }
              }}
              placeholder="0.00"
              className={cn(
                "tnum h-12 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-lg font-semibold text-ink",
                "focus:border-primary/60 focus:bg-elevated focus:outline-none focus:ring-4 focus:ring-primary/10",
              )}
            />
          </div>
        </Field>

        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="text-[11px] leading-relaxed text-muted">
            {locale === "th"
              ? "งบประมาณคือขีดจำกัด ไม่ใช่เป้าหมายการใช้จ่าย คุณปรับได้ทุกเดือน"
              : "A budget is a guardrail, not a spending target. You can adjust it any month."}
          </p>
        </div>
      </div>
    </Sheet>
  );
}
