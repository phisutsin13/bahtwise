"use client";

import { useEffect, useState } from "react";
import { CalendarRange, SlidersHorizontal } from "lucide-react";
import type {
  Category,
  TransactionFilters,
  TransactionKind,
} from "@/lib/types";
import {
  DEFAULT_FILTERS,
  filterDateRange,
  type DatePreset,
} from "@/lib/filters";
import { categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useCurrentDate } from "@/providers/current-date-provider";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";

const PRESETS: { id: DatePreset; labelKey: "home.filterAny" | "home.last7Days" | "home.last30Days" | "home.thisMonthFilter" }[] = [
  { id: "any", labelKey: "home.filterAny" },
  { id: "7d", labelKey: "home.last7Days" },
  { id: "30d", labelKey: "home.last30Days" },
  { id: "month", labelKey: "home.thisMonthFilter" },
];

export function FilterSheet({
  open,
  onClose,
  filters,
  categories,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  categories: Category[];
  onApply: (filters: TransactionFilters) => void;
}) {
  const { t, locale } = useLocale();
  const { today } = useCurrentDate();
  const [draft, setDraft] = useState<TransactionFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const presetForRange = (): DatePreset => {
    if (!draft.from && !draft.to) return "any";
    for (const preset of ["7d", "30d", "month"] as DatePreset[]) {
      const range = filterDateRange(preset, today);
      if (range.from === draft.from && range.to === draft.to) return preset;
    }
    return "any";
  };

  const activePreset = presetForRange();
  const categoryOptions = categories.filter(
    (category) => draft.kind === "all" || category.kind === draft.kind,
  );

  const applyPreset = (preset: DatePreset) => {
    const range = filterDateRange(preset, today);
    setDraft((current) => ({ ...current, ...range }));
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("home.filters")}
      description={locale === "th" ? "จำกัดรายการให้เห็นเฉพาะที่ต้องการ" : "Narrow the list to exactly what you need."}
      icon={<SlidersHorizontal className="size-5" />}
      size="sm"
      footer={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="flex-1 sm:flex-none"
            onClick={() => setDraft(DEFAULT_FILTERS)}
          >
            {t("common.reset")}
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply({
                ...draft,
                query: filters.query,
              });
              onClose();
            }}
          >
            {t("common.apply")}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">
            {t("home.filterKind")}
          </p>
          <Segmented
            fullWidth
            ariaLabel={t("home.filterKind")}
            value={draft.kind}
            onChange={(kind) =>
              setDraft((current) => ({
                ...current,
                kind: kind as TransactionFilters["kind"],
                categoryId: "all",
              }))
            }
            options={[
              { value: "all", label: t("common.all") },
              { value: "expense", label: t("home.expenseLabel") },
              { value: "income", label: t("home.incomeLabel") },
            ]}
          />
        </div>

        <Field label={t("home.filterCategory")} htmlFor="filter-category">
          <Select
            id="filter-category"
            value={draft.categoryId}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                categoryId: event.target.value,
              }))
            }
          >
            <option value="all">{t("common.all")}</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {categoryLabel(category, locale)}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">
            {t("home.filterDate")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-primary/30 bg-primary-soft text-primary"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {t(preset.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("home.filterFrom")} htmlFor="filter-from">
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="filter-from"
                type="date"
                value={draft.from ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    from: event.target.value || null,
                  }))
                }
                className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-2 text-xs text-ink focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </Field>
          <Field label={t("home.filterTo")} htmlFor="filter-to">
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="filter-to"
                type="date"
                value={draft.to ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    to: event.target.value || null,
                  }))
                }
                className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-2 text-xs text-ink focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </Field>
        </div>

        {draft.from && draft.to && draft.from > draft.to ? (
          <p className="rounded-lg bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
            {locale === "th"
              ? "วันเริ่มต้นต้องอยู่ก่อนวันสิ้นสุด"
              : "The start date must come before the end date."}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

export function CategoryOptions({
  categories,
  kind,
}: {
  categories: Category[];
  kind: TransactionKind;
}) {
  const { locale } = useLocale();
  return (
    <>
      {categories
        .filter((category) => category.kind === kind)
        .map((category) => (
          <option key={category.id} value={category.id}>
            {category.icon} {categoryLabel(category, locale)}
          </option>
        ))}
    </>
  );
}
