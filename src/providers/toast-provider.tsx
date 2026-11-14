"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocale } from "./locale-provider";

type ToastVariant = "success" | "error" | "info";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type Toast = ToastOptions & { id: number };

type ToastContextValue = {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: Check,
  error: TriangleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const { t } = useLocale();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((current) => [...current.slice(-2), { ...options, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <ToastCard
              key={item.id}
              item={item}
              label={t("toast.dismiss")}
              onDismiss={() => dismiss(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  label,
  onDismiss,
}: {
  item: Toast;
  label: string;
  onDismiss: () => void;
}) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[item.variant ?? "success"];

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(onDismiss, item.duration ?? 5200);
    return () => window.clearTimeout(timer);
  }, [item.duration, onDismiss, paused]);

  return (
    <motion.div
      layout
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
      transition={reduce ? { duration: 0.12 } : { type: "spring", stiffness: 420, damping: 32 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border p-3 pr-2 shadow-float backdrop-blur-xl sm:w-auto sm:min-w-80",
        "border-line bg-elevated/95 text-ink",
      )}
      role="status"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          item.variant === "error"
            ? "bg-expense-soft text-expense"
            : item.variant === "info"
              ? "bg-sky-soft text-sky"
              : "bg-primary-soft text-primary",
        )}
      >
        <Icon className="size-4" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
        ) : null}
      </div>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss();
          }}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {item.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={label}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
