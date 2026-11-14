"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import type { CategoryColor, TransactionKind } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";

const ICONS = [
  "🍜",
  "☕",
  "🚇",
  "🚗",
  "🏠",
  "🛍️",
  "💊",
  "🎬",
  "🧾",
  "📚",
  "👨‍👩‍👧",
  "💼",
  "💻",
  "📈",
  "🎁",
  "✈️",
  "🐶",
  "🌱",
  "✨",
  "🏷️",
];

const COLORS = Object.keys(CATEGORY_COLORS) as CategoryColor[];

export function CategorySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addCategory, categories } = useFinance();
  const { t, locale } = useLocale();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState<CategoryColor>("emerald");
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setIcon("🏷️");
    setColor("emerald");
    setKind("expense");
    setError(null);
    setSaving(false);
  }, [open]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("errors.categoryName"));
      return;
    }
    const duplicate = categories.some(
      (category) =>
        category.kind === kind &&
        category.name.trim().toLocaleLowerCase() ===
          trimmed.toLocaleLowerCase(),
    );
    if (duplicate) {
      setError(t("errors.categoryDuplicate"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addCategory({ name: trimmed, icon, color, kind });
      toast({ title: t("settings.categoryAdded") });
      onClose();
    } catch {
      setError(t("errors.generic"));
      toast({ title: t("toast.error"), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("settings.newCategory")}
      description={
        locale === "th"
          ? "สร้างป้ายของคุณเองเพื่อให้เห็นการใช้จ่ายชัดขึ้น"
          : "Create your own label to see spending more clearly."
      }
      icon={<Tag className="size-5" />}
      size="sm"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="hidden sm:inline-flex" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" loading={saving} onClick={() => void save()}>
            {t("settings.addCategory")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <Segmented
          fullWidth
          ariaLabel={t("settings.categoryType")}
          value={kind}
          onChange={(next) => {
            setKind(next);
            setError(null);
          }}
          options={[
            { value: "expense", label: t("home.kindExpense") },
            { value: "income", label: t("home.kindIncome") },
          ]}
        />

        <Field
          label={t("settings.categoryName")}
          htmlFor="category-name"
          error={error}
        >
          <TextInput
            id="category-name"
            data-autofocus
            value={name}
            maxLength={32}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void save();
              }
            }}
            placeholder={locale === "th" ? "เช่น คาเฟ่" : "e.g. Coffee"}
          />
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">
            {t("settings.categoryIcon")}
          </p>
          <div className="grid grid-cols-10 gap-1">
            {ICONS.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setIcon(entry)}
                aria-pressed={icon === entry}
                className={cn(
                  "grid size-8 place-items-center rounded-lg border text-base transition-colors",
                  icon === entry
                    ? "border-primary/40 bg-primary-soft"
                    : "border-line bg-surface-2 hover:border-line-strong",
                )}
              >
                {entry}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">
            {t("settings.categoryColor")}
          </p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setColor(entry)}
                aria-label={entry}
                aria-pressed={color === entry}
                className={cn(
                  "grid size-8 place-items-center rounded-full border-2 transition-transform",
                  color === entry ? "scale-110 border-ink" : "border-transparent",
                )}
                style={{ backgroundColor: CATEGORY_COLORS[entry].light }}
              >
                {color === entry ? (
                  <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
          <span
            className="grid size-10 place-items-center rounded-xl text-lg"
            style={{ backgroundColor: CATEGORY_COLORS[color].soft }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-ink">
              {name.trim() || t("settings.categoryName")}
            </p>
            <p className="text-[10px] text-subtle">
              {kind === "income" ? t("home.kindIncome") : t("home.kindExpense")}
            </p>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
