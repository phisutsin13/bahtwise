"use client";

import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary ring-1 ring-primary/10",
        size === "sm" ? "size-8 text-[11px]" : size === "lg" ? "size-12 text-base" : "size-10 text-sm",
        className,
      )}
      aria-hidden="true"
    >
      {initials || "M"}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-accent/60 bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-ink/80 dark:text-accent",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t("common.demo")}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "income" | "expense" | "warning" | "primary";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted border-line",
    income: "bg-income-soft text-income border-transparent",
    expense: "bg-expense-soft text-expense border-transparent",
    warning: "bg-warning-soft text-warning border-transparent",
    primary: "bg-primary-soft text-primary border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
