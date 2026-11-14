"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-colors placeholder:text-subtle hover:border-line-strong focus:border-primary/60 focus:bg-elevated focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50";

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  optionalLabel?: string;
};

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
  optionalLabel,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-ink"
        >
          <span>{label}</span>
          {optionalLabel ? (
            <span className="text-[11px] font-medium text-subtle">{optionalLabel}</span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-expense" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(inputClass, "h-auto min-h-24 resize-none py-2.5", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        inputClass,
        "appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%23657069%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function useFieldId(provided?: string): string {
  const generated = useId();
  return provided ?? generated;
}
