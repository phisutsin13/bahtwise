"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Option<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

type SegmentedProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
  fullWidth?: boolean;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
  fullWidth = false,
}: SegmentedProps<T>) {
  const layoutId = useId();
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1",
        fullWidth ? "flex w-full" : "",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-[13px]",
              active ? "text-primary" : "text-muted hover:text-ink",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 520, damping: 38 }
                }
                className="absolute inset-0 rounded-[9px] border border-line bg-elevated shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                aria-hidden="true"
              />
            ) : null}
            {option.icon ? <span className="relative">{option.icon}</span> : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
