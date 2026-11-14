"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "secondary"
  | "accent"
  | "ghost"
  | "outline"
  | "danger";

type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-contrast shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_20px_-12px_var(--primary)] hover:bg-primary-strong hover:shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_12px_26px_-14px_var(--primary)]",
  secondary:
    "bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-elevated",
  accent:
    "bg-accent text-accent-ink shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] hover:brightness-[1.03]",
  ghost: "text-muted hover:bg-primary-soft hover:text-primary",
  outline:
    "border border-line-strong bg-transparent text-ink hover:border-primary/50 hover:bg-primary-soft/50",
  danger:
    "bg-expense text-white hover:brightness-110 shadow-[0_8px_20px_-14px_var(--expense)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-[10px]",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-[14px]",
  icon: "size-11 rounded-xl",
  "icon-sm": "size-9 rounded-[10px]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center font-semibold tracking-[-0.005em]",
        "transition-[background-color,color,box-shadow,border-color,transform,filter] duration-200",
        "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
