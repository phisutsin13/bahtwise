"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { Logo } from "@/components/ui/logo";

export function AppGate() {
  const { status } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (status === "signedIn") router.replace("/home");
    if (status === "signedOut") router.replace("/sign-in");
  }, [status, router]);

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--glow-a),transparent_65%)]" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-5"
      >
        <Logo size="lg" />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="size-1.5 rounded-full bg-primary"
              animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 1.1, repeat: Infinity, delay: index * 0.14 }
              }
            />
          ))}
        </div>
        <p className="text-xs text-subtle">{t("auth.checkingSession")}</p>
      </motion.div>
    </div>
  );
}
