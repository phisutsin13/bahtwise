"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { CategoryTotal } from "@/lib/analytics";
import { categoryColorValue, categoryLabel } from "@/lib/categories";
import { useLocale } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import { useFinance } from "@/providers/finance-provider";
import { cn } from "@/lib/cn";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  data,
  kind,
  className,
}: {
  data: CategoryTotal[];
  kind: "expense" | "income";
  className?: string;
}) {
  const { formatMoney, formatPercent, t, locale } = useLocale();
  const { resolved } = useTheme();
  const { amountsHidden } = useFinance();
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const segments = data.slice(0, 6);
  const rest = data.slice(6);
  const restTotal = rest.reduce((sum, entry) => sum + entry.amountSatang, 0);
  const total = data.reduce((sum, entry) => sum + entry.amountSatang, 0);
  const all = restTotal > 0
    ? [
        ...segments,
        {
          category: null,
          categoryId: "other",
          amountSatang: restTotal,
          count: rest.reduce((sum, entry) => sum + entry.count, 0),
          share: total > 0 ? restTotal / total : 0,
        } as CategoryTotal,
      ]
    : segments;

  if (total <= 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <div className="relative grid size-40 place-items-center rounded-full border-[14px] border-line/60">
          <span className="text-[11px] font-medium text-subtle">
            {t("summary.noBreakdown")}
          </span>
        </div>
        <p className="mt-4 max-w-[220px] text-center text-xs leading-relaxed text-muted">
          {t("summary.noBreakdownDescription")}
        </p>
      </div>
    );
  }

  const offsets = all.map((_, index) => {
    const preceding = all
      .slice(0, index)
      .reduce((sum, entry) => sum + entry.amountSatang, 0);
    return total > 0 ? (preceding / total) * CIRCUMFERENCE : 0;
  });
  const activeEntry = active !== null ? all[active] : null;

  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-7", className)}>
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="13" opacity="0.45" />
          {all.map((entry, index) => {
            const color = entry.category
              ? categoryColorValue(entry.category.color, resolved)
              : "var(--muted)";
            const fraction = total > 0 ? entry.amountSatang / total : 0;
            const gap = fraction > 0.08 ? 1.8 : 0.8;
            const length = Math.max(0, fraction * CIRCUMFERENCE - gap);
            const dashOffset = -offsets[index];
            const isActive = active === index;
            return (
              <motion.circle
                key={entry.categoryId ?? "none"}
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? 17 : 13}
                strokeLinecap="round"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={dashOffset}
                initial={reduce ? false : { opacity: 0, strokeDasharray: `0 ${CIRCUMFERENCE}` }}
                animate={{ opacity: active === null || isActive ? 1 : 0.45, strokeDasharray: `${length} ${CIRCUMFERENCE - length}` }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.65, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }
                }
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                className="cursor-pointer transition-[stroke-width,opacity] duration-200"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {activeEntry ? (
            <>
              <p className="max-w-24 text-[10px] font-semibold leading-tight text-muted">
                {activeEntry.category
                  ? categoryLabel(activeEntry.category, locale)
                  : t("summary.other")}
              </p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                {amountsHidden ? "••••" : formatPercent(activeEntry.share * 100)}
              </p>
              <p className="mt-0.5 text-[10px] text-subtle">
                {amountsHidden ? "฿••••" : formatMoney(activeEntry.amountSatang, { withDecimals: false })}
              </p>
            </>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-subtle">
                {kind === "expense" ? t("summary.expenseTab") : t("summary.incomeTab")}
              </p>
              <p className="mt-1 max-w-28 font-display text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                {amountsHidden ? "฿••••" : formatMoney(total, { withDecimals: false })}
              </p>
              <p className="mt-0.5 text-[9px] text-subtle">{t("summary.donutCenter")}</p>
            </>
          )}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1">
        {all.map((entry, index) => {
          const color = entry.category
            ? categoryColorValue(entry.category.color, resolved)
            : "var(--muted)";
          const isActive = active === index;
          return (
            <li key={entry.categoryId ?? "none"}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors",
                  isActive ? "bg-surface-2" : "hover:bg-surface-2/70",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: color }}
                />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                  {entry.category
                    ? categoryLabel(entry.category, locale)
                    : t("summary.other")}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-muted">
                  {amountsHidden ? "••" : formatPercent(entry.share * 100)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RadialProgress({
  value,
  size = 168,
  stroke = 12,
  children,
  tone = "primary",
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  tone?: "primary" | "expense" | "warning";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    tone === "expense" ? "var(--expense)" : tone === "warning" ? "var(--warning)" : "var(--primary)";

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          opacity={0.55}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={reduce ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
