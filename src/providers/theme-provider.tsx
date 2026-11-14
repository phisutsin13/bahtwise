"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemeMode } from "@/lib/types";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "mymoney.theme";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode): "light" | "dark" {
  const resolved = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    let stored: ThemeMode = "system";
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value === "light" || value === "dark" || value === "system") {
        stored = value;
      }
    } catch {
      // Storage can be unavailable in private windows; system theme still works.
    }
    setModeState(stored);
    setResolved(applyTheme(stored));

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setModeState((current) => {
        if (current === "system") setResolved(applyTheme("system"));
        return current;
      });
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setResolved(applyTheme(next));
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference is still applied for this session.
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export const themeInitScript = `(function(){try{var k='mymoney.theme';var s=localStorage.getItem(k);var d=s==='dark'||((!s||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;
