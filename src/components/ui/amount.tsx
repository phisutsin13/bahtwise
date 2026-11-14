"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { useFinance } from "@/providers/finance-provider";

function useAnimatedNumber(value: number, animateOnMount: boolean): number {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(animateOnMount ? 0 : value);
  const previous = useRef(animateOnMount ? 0 : value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduce) {
      previous.current = value;
      setDisplay(value);
      return;
    }
    const from = previous.current;
    const delta = value - from;
    if (delta === 0) {
      setDisplay(value);
      return;
    }
    const duration = animateOnMount ? 900 : 520;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + delta * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      previous.current = value;
    };
  }, [value, reduce, animateOnMount]);

  return display;
}

type AmountProps = {
  satang: number;
  className?: string;
  withDecimals?: boolean;
  signDisplay?: "auto" | "always" | "never";
  animateOnMount?: boolean;
  showSign?: boolean;
  hidden?: boolean;
  as?: "span" | "div";
};

export function Amount({
  satang,
  className,
  withDecimals = true,
  animateOnMount = false,
  showSign = false,
  hidden,
  as = "span",
}: AmountProps) {
  const { formatMoney, t } = useLocale();
  const { amountsHidden } = useFinance();
  const shouldHide = hidden ?? amountsHidden;
  const display = useAnimatedNumber(satang, animateOnMount);
  const formatted = formatMoney(display, {
    withDecimals,
    signDisplay: showSign ? "always" : "auto",
  });
  const Tag = as;

  if (shouldHide) {
    return (
      <Tag
        className={cn("tnum tracking-tight", className)}
        aria-label={t("home.privacyOn")}
      >
        ฿••••••
      </Tag>
    );
  }

  return (
    <Tag className={cn("tnum tracking-tight", className)} title={formatted}>
      {formatted}
    </Tag>
  );
}
