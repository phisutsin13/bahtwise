"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translate, type TranslationKey } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/types";
import {
  formatCompactSatang,
  formatPercent,
  formatSatang,
} from "@/lib/money";
import {
  formatDay,
  formatMonth,
  formatRelativeDay,
  formatWeekRange,
} from "@/lib/date";

type TranslateVars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, vars?: TranslateVars) => string;
  formatMoney: (satang: number, options?: { withDecimals?: boolean; signDisplay?: "auto" | "always" | "never" }) => string;
  formatMoneyCompact: (satang: number) => string;
  formatPercent: (value: number) => string;
  formatDate: (iso: string, variant?: "short" | "long" | "weekday" | "monthShort") => string;
  formatMonthLabel: (iso: string) => string;
  formatWeek: (startISO: string) => string;
  formatRelative: (iso: string, today?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "mymoney.locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let initial: Locale = "en";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "th" || stored === "en") {
        initial = stored;
      } else if (navigator.language.toLowerCase().startsWith("th")) {
        initial = "th";
      }
    } catch {
      // Keep the default.
    }
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Session-only preference.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const t = (key: TranslationKey, vars?: TranslateVars) =>
      translate(locale, key, vars);
    return {
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "th" ? "en" : "th"),
      t,
      formatMoney: (satang, options) => formatSatang(satang, locale, options),
      formatMoneyCompact: (satang) => formatCompactSatang(satang, locale),
      formatPercent: (value) => formatPercent(value, locale),
      formatDate: (iso, variant = "short") => formatDay(iso, locale, variant),
      formatMonthLabel: (iso) => formatMonth(iso, locale),
      formatWeek: (startISO) => formatWeekRange(startISO, locale),
      formatRelative: (iso, today) => formatRelativeDay(iso, locale, today),
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
