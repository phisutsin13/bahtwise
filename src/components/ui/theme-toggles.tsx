"use client";

import { motion, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const { locale } = useLocale();
  const reduce = useReducedMotion();
  const label = locale === "th" ? "สลับโหมดสว่าง/มืด" : "Toggle light or dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-9 place-items-center overflow-hidden rounded-[11px] border border-line bg-surface-2 text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <motion.span
        key={resolved}
        initial={reduce ? false : { rotate: -35, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }}
        className="grid place-items-center"
      >
        {resolved === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </motion.span>
    </button>
  );
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLocale();
  const label = locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 min-w-9 place-items-center rounded-[11px] border border-line bg-surface-2 px-2 text-[11px] font-bold tracking-wide text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {locale === "th" ? "EN" : "TH"}
    </button>
  );
}
