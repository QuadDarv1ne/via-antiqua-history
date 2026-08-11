"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";

type SubscriptionStatus = {
  id: string;
  status: string;
  amount: number;
  startedAt: string;
  expiresAt: string;
  daysLeft: number;
} | null;

type SubscriptionContextType = {
  hasSubscription: boolean;
  subscriptionLoading: boolean;
  subscription: SubscriptionStatus;
  refresh: () => void;
};

const SubscriptionContext =
  React.createContext<SubscriptionContextType | null>(null);

/**
 * Единый источник данных о подписке. На главной странице сразу несколько
 * ContentGate/RegionSection запрашивают /api/subscription/status — без общего
 * состояния это давало бы до 10 идентичных запросов на загрузку страницы.
 * Провайдер делает один запрос на смену пользователя и раздаёт результат
 * через контекст.
 */
export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [subscription, setSubscription] = React.useState<SubscriptionStatus>(
    null,
  );
  const [subscriptionLoading, setSubscriptionLoading] =
    React.useState(true);
  const [refreshCounter, setRefreshCounter] = React.useState(0);

  const refresh = React.useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  React.useEffect(() => {
    if (!user || loading) {
      if (!loading) setSubscriptionLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch("/api/subscription/status", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.ok && data.data) {
          setSubscription(data.data as NonNullable<SubscriptionStatus>);
        } else {
          setSubscription(null);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setSubscription(null);
      })
      .finally(() => {
        setSubscriptionLoading(false);
      });

    return () => controller.abort();
  }, [user, loading, refreshCounter]);

  const value = React.useMemo(
    () => ({
      hasSubscription: subscription?.status === "active",
      subscriptionLoading,
      subscription,
      refresh,
    }),
    [subscription, subscriptionLoading, refresh],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const ctx = React.useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscriptionContext must be used within SubscriptionProvider",
    );
  }
  return ctx;
}
