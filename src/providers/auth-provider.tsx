"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppUser } from "@/lib/types";
import { DEMO_USER_ID } from "@/lib/demo-data";
import { DEMO_SESSION_KEY, isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { debugError, debugLog } from "@/lib/logger";

type AuthStatus = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  user: AppUser | null;
  isDemo: boolean;
  supabaseConfigured: boolean;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

type StoredDemoSession = {
  userId: string;
  startedAt: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readDemoSession(): StoredDemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDemoSession;
    if (parsed && typeof parsed.userId === "string" && parsed.userId) return parsed;
  } catch {
    // Ignore malformed local demo sessions.
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AppUser | null>(null);

  const bootstrap = useCallback(async () => {
    const demo = readDemoSession();
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email ?? undefined,
            isDemo: false,
          });
          setStatus("signedIn");
          debugLog("auth.session_restored", { isDemo: false });
          return;
        }
      } catch (error) {
        debugError("auth.session_read_failed", error);
      }
    }

    if (demo) {
      setUser({ id: demo.userId, isDemo: true });
      setStatus("signedIn");
      debugLog("auth.session_restored", { isDemo: true });
      return;
    }

    setUser(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog("auth.state_changed", { event, hasSession: Boolean(session) });
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          isDemo: false,
        });
        setStatus("signedIn");
      } else if (!readDemoSession()) {
        setUser(null);
        setStatus("signedOut");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInDemo = useCallback(() => {
    const session: StoredDemoSession = {
      userId: DEMO_USER_ID,
      startedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      debugError("auth.demo_session_write_failed", error);
    }
    setUser({ id: DEMO_USER_ID, isDemo: true });
    setStatus("signedIn");
    debugLog("auth.demo_signed_in");
  }, []);

  const signOut = useCallback(async () => {
    try {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        debugError("auth.signout_failed", error);
      }
    }
    setUser(null);
    setStatus("signedOut");
    debugLog("auth.signed_out");
  }, []);

  const refreshSession = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isDemo: Boolean(user?.isDemo),
      supabaseConfigured: isSupabaseConfigured,
      signInDemo,
      signOut,
      refreshSession,
    }),
    [status, user, signInDemo, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
