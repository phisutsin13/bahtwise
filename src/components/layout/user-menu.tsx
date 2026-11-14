"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings2, UserRound } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useFinance } from "@/providers/finance-provider";
import { useLocale } from "@/providers/locale-provider";
import { Avatar } from "@/components/ui/avatar";
import { DemoBadge } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export function UserMenu({ placement = "up" }: { placement?: "up" | "down" }) {
  const { user, isDemo, signOut } = useAuth();
  const { profile } = useFinance();
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = profile?.displayName || profile?.username || user?.email || "You";
  const handle = profile?.username ? `@${profile.username}` : user?.email;

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t("a11y.userMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open ? "bg-surface-2" : "",
        )}
      >
        <Avatar name={name} size="sm" />
        <span className="hidden max-w-32 truncate text-[12px] font-semibold text-ink xl:block">
          {name}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-50 w-60 overflow-hidden rounded-2xl border border-line bg-elevated p-1.5 shadow-lift",
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
              {handle ? (
                <p className="truncate text-[11px] text-subtle">{handle}</p>
              ) : null}
              {isDemo ? <DemoBadge className="mt-1.5" /> : null}
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Settings2 className="size-4" />
            {t("nav.settings")}
          </Link>
          {!profile ? (
            <span className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-subtle">
              <UserRound className="size-4" />
              {t("common.loading")}
            </span>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.replace("/sign-in");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-expense transition-colors hover:bg-expense-soft"
          >
            <LogOut className="size-4" />
            {t("nav.signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
