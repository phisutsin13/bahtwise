"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
};

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  icon,
}: SheetProps) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelector<HTMLElement>(
        "[data-autofocus], input:not([type='hidden']), textarea, select, button",
      );
      focusable?.focus();
    }, 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label={t("common.close")}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[rgba(7,18,13,0.5)] backdrop-blur-[3px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            aria-describedby={description ? "sheet-description" : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.99 }}
            transition={
              reduce
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 380, damping: 34, mass: 0.9 }
            }
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line bg-elevated shadow-float sm:max-h-[88dvh] sm:rounded-[26px]",
              SIZES[size],
              className,
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong/70 sm:hidden" />
            <div className="flex items-start gap-3 px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
              {icon ? (
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  {icon}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2
                  id="sheet-title"
                  className="font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink"
                >
                  {title}
                </h2>
                {description ? (
                  <p
                    id="sheet-description"
                    className="mt-1 text-[13px] leading-relaxed text-muted"
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
              {children}
            </div>
            {footer ? (
              <div className="safe-bottom border-t border-line bg-surface/60 px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : (
              <div className="safe-bottom sm:h-2" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
