"use client";

import { CalendarRange, SearchX, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-primary-soft/60 blur-xl" />
        <div className="relative grid size-14 place-items-center rounded-2xl border border-line bg-surface-2 text-primary shadow-card">
          {icon ?? <Wallet className="size-6" strokeWidth={1.8} />}
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function NoResults({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      icon={<SearchX className="size-6" strokeWidth={1.8} />}
      title={title}
      description={description}
      action={action}
      compact
    />
  );
}

export function NoPeriodData({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <EmptyState
      icon={icon ?? <CalendarRange className="size-6" strokeWidth={1.8} />}
      title={title}
      description={description}
      compact
    />
  );
}
