"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { todayISO } from "@/lib/date";

type CurrentDateValue = {
  /** Local calendar day, YYYY-MM-DD. Non-empty once the provider is ready. */
  today: string;
  now: Date;
};

const CurrentDateContext = createContext<CurrentDateValue | null>(null);

/**
 * Current time is a client-only concern. Reading it during the first render
 * would both break prerendering and risk a hydration mismatch, so the value is
 * published from an effect and refreshed once a minute (covering midnight).
 */
export function CurrentDateProvider({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [value, setValue] = useState<CurrentDateValue | null>(null);

  useEffect(() => {
    const update = () => setValue({ today: todayISO(), now: new Date() });
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!value) return <>{fallback}</>;
  return (
    <CurrentDateContext.Provider value={value}>
      {children}
    </CurrentDateContext.Provider>
  );
}

export function useCurrentDate(): CurrentDateValue {
  const value = useContext(CurrentDateContext);
  if (!value) {
    throw new Error("useCurrentDate must be used inside CurrentDateProvider");
  }
  return value;
}
