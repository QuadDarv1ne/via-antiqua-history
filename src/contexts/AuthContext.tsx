"use client";

import * as React from "react";
import type { User } from "@/lib/auth/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    totpCode?: string,
  ) => Promise<{ ok: boolean; error?: string; require2fa?: boolean }>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshAbortRef = React.useRef<AbortController | null>(null);
  const refreshVersionRef = React.useRef(0);

  const refresh = React.useCallback(async (signal?: AbortSignal) => {
    const version = ++refreshVersionRef.current;
    try {
      refreshAbortRef.current?.abort();
      const controller = new AbortController();
      refreshAbortRef.current = controller;
      const effectiveSignal = signal ?? controller.signal;

      // Ретраи при транзиентных сетевых ошибках: мгновенный «логаут»
      // из-за обрыва сети (или перезапуска сервера) крайне нежелателен
      const RETRIES = 3;
      const RETRY_DELAY_MS = 800;

      let res: Response | null = null;
      for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
          res = await fetch("/api/auth/me", { signal: effectiveSignal });
          break;
        } catch (err) {
          if (signal?.aborted || controller.signal.aborted || attempt === RETRIES) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        }
      }

      if (res!.status === 429) {
        // Rate limit на /api/auth/me — не разлогиниваем пользователя
        return;
      }
      const json = await res!.json();
      if (refreshVersionRef.current !== version) return;
      if (json.ok && json.data) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      // Сетевая ошибка (после ретраев): не разлогиниваем пользователя,
      // сохраняем текущее состояние — при следующем refresh() восстановится
      if (refreshVersionRef.current === version) setLoading(false);
    } finally {
      if (refreshVersionRef.current === version) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    return () => { refreshAbortRef.current?.abort(); };
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const login = React.useCallback(
    async (email: string, password: string, totpCode?: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, totpCode }),
        });
        const json = await res.json();

        if (!json.ok) {
          return { ok: false, error: json.error || "Ошибка входа" };
        }

        if (json.data?.require2fa) {
          return { ok: true, require2fa: true };
        }

        // Fetch canonical user data from /api/auth/me to ensure correct field mapping
        await refresh();

        return { ok: true };
      } catch {
        return { ok: false, error: "Ошибка сети. Проверьте подключение." };
      }
    },
    [refresh],
  );

  const register = React.useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const json = await res.json();

        if (json.ok && json.data) {
          await refresh();
        }

        return { ok: json.ok, error: json.error };
      } catch {
        return { ok: false, error: "Ошибка сети. Проверьте подключение." };
      }
    },
    [refresh],
  );

  const logout = React.useCallback(async () => {
    try {
      refreshAbortRef.current?.abort();
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
