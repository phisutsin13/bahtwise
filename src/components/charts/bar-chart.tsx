"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Bucket } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/cn";

type BarPairChartProps = {
  buckets: Bucket[];
  height?: number;
  className?: string;
  labelEvery?: number;
  showNet?: boolean;
};

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function BarPairChart({
  buckets,
  height = 220,
  className,
  labelEvery,
  showNet = false,
}: BarPairChartProps) {
  const { formatMoney, formatMoneyCompact, locale, t } = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const max = useMemo(
    () => niceMax(Math.max(1, ...buckets.flatMap((bucket) => [bucket.income, bucket.expense]))),
    [buckets],
  );

  const spacing = labelEvery ?? (buckets.length > 20 ? 5 : buckets.length > 14 ? 2 : 1);
  const activeBucket = active !== null ? buckets[active] : null;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[3px] bg-income" />
          {t("summary.income")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[3px] bg-expense" />
          {t("summary.expenses")}
        </span>
        {showNet ? (
          <span className="ml-auto hidden items-center gap-1.5 sm:inline-flex">
            <span className="h-px w-4 bg-ink/40" />
            {t("summary.netShort")}
          </span>
        ) : null}
      </div>

      <div className="relative" style={{ height }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
            <div key={fraction} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right text-[9px] font-medium tabular-nums text-subtle">
                {formatMoneyCompact(Math.round((max * fraction) / 100) * 100)}
              </span>
              <span className="h-px flex-1 bg-line/70" />
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 right-0 left-14 flex items-stretch gap-0.5">
          {buckets.map((bucket, index) => {
            const isActive = active === index;
            const incomeHeight = Math.max(bucket.income > 0 ? 2 : 0, (bucket.income / max) * 100);
            const expenseHeight = Math.max(bucket.expense > 0 ? 2 : 0, (bucket.expense / max) * 100);
            const hasData = bucket.income > 0 || bucket.expense > 0;
            return (
              <button
                key={bucket.key}
                type="button"
                aria-label={`${bucket.label}: ${t("summary.income")} ${formatMoney(bucket.income)}, ${t("summary.expenses")} ${formatMoney(bucket.expense)}`}
                onClick={() => setActive(isActive ? null : index)}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className={cn(
                  "group relative flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-t-md px-[1px] pb-7 outline-none transition-colors",
                  isActive ? "bg-primary/[0.045]" : "hover:bg-primary/[0.03]",
                )}
              >
                <span className="relative flex h-[calc(100%-1.75rem)] w-full items-end justify-center gap-[2px]">
                  <motion.span
                    className="w-full max-w-[10px] rounded-t-[2px] bg-gradient-to-t from-income/80 to-income"
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: `${incomeHeight}%` }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 0.55, delay: Math.min(index * 0.012, 0.25), ease: [0.22, 1, 0.36, 1] }
                    }
                    style={{ opacity: hasData ? 1 : 0 }}
                  />
                  <motion.span
                    className="w-full max-w-[10px] rounded-t-[2px] bg-gradient-to-t from-expense/80 to-expense"
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: `${expenseHeight}%` }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 0.55, delay: Math.min(index * 0.012 + 0.03, 0.28), ease: [0.22, 1, 0.36, 1] }
                    }
                    style={{ opacity: hasData ? 1 : 0 }}
                  />
                </span>
                <span
                  className={cn(
                    "absolute bottom-0 w-full truncate text-center text-[9px] font-medium tabular-nums",
                    isActive ? "text-ink" : "text-subtle",
                    index % spacing === 0 ? "opacity-100" : "opacity-0",
                  )}
                >
                  {bucket.label}
                </span>
                {activeBucket && isActive ? (
                  <span
                    className="pointer-events-none absolute bottom-full z-20 mb-1 w-max -translate-x-1/2 rounded-xl border border-line bg-elevated px-3 py-2 text-left shadow-lift"
                    style={{
                      left: `${((index + 0.5) / buckets.length) * 100}%`,
                    }}
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                      {activeBucket.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-income">
                      +{formatMoney(activeBucket.income)}
                    </span>
                    <span className="block text-xs font-semibold text-expense">
                      −{formatMoney(activeBucket.expense)}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sr-only">
        <table>
          <caption>{t("a11y.incomeExpenseChart")}</caption>
          <thead>
            <tr>
              <th>{t("summary.category")}</th>
              <th>{t("summary.income")}</th>
              <th>{t("summary.expenses")}</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket.key}>
                <td>{bucket.label}</td>
                <td>{formatMoney(bucket.income)}</td>
                <td>{formatMoney(bucket.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-subtle">
        <span>{buckets[0]?.label}</span>
        <span>
          {locale === "th" ? "แตะแท่งกราฟเพื่อดูรายละเอียด" : "Tap a bar for details"}
        </span>
        <span>{buckets[buckets.length - 1]?.label}</span>
      </div>
    </div>
  );
}
