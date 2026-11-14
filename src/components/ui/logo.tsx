"use client";

import { cn } from "@/lib/cn";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  inverted?: boolean;
  className?: string;
};

const MARK_SIZE = {
  sm: "size-8 rounded-[10px]",
  md: "size-10 rounded-[13px]",
  lg: "size-12 rounded-2xl",
};

const WORD_SIZE = {
  sm: "text-[17px]",
  md: "text-xl",
  lg: "text-2xl",
};

export function Logo({
  size = "md",
  withWordmark = true,
  inverted = false,
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden",
          "bg-hero shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_6px_16px_-8px_rgba(11,60,45,0.7)]",
          MARK_SIZE[size],
        )}
        aria-hidden="true"
      >
        <span className="absolute -right-2 -top-2 size-6 rounded-full bg-accent/25" />
        <svg viewBox="0 0 24 24" fill="none" className="relative size-[62%]">
          <path
            d="M6 18V7.2c0-.8.97-1.2 1.53-.63L12 11l4.47-4.43C17.03 6 18 6.4 18 7.2V18"
            stroke={inverted ? "#0b3c2d" : "#f8f5e7"}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12.2V18"
            stroke="#d7e96b"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withWordmark ? (
        <span
          className={cn(
            "font-display font-semibold leading-none tracking-[-0.02em]",
            WORD_SIZE[size],
            inverted ? "text-hero-ink" : "text-ink",
          )}
        >
          My Money
        </span>
      ) : null}
    </span>
  );
}
