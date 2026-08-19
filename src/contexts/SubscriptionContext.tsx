"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";

type SubscriptionStatus = {
  id: string;
  status: string;
  isCancelled?: boolean;
  amount: number;
  startedAt: string;
  expiresAt: string;
  daysLeft: number;
} | null;

type SubscriptionContextType = {
  hasSubscription: boolean;
  subscriptionLoading: boolean;
  subscription: SubscriptionStatus;
  isCancelled: boolean;
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

  // Пользователь мог оплатить подписку в другом окне/приложении банка:
  // при возврате на вкладку переспрашиваем статус, чтобы гейты контента
  // открылись сразу, а не после ручной перезагрузки
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [refresh]);

  React.useEffect(() => {
    if (!user || loading) {
      // При logout/смене пользователя сбрасываем данные предыдущего аккаунта,
      // чтобы контентные гейты не показали чужие премиум-секции в промежутке
      setSubscription(null);
      // loading=true — авторизация ещё проверяется, статус подписки неизвестен;
      // loading=false — пользователь точно не авторизован, подписки нет
      if (!loading) {
        setSubscriptionLoading(false);
      }
      return;
    }

    // Новый запрос для текущего пользователя — показываем загрузку и
    // не отдаём stale-данные прошлого аккаунта (если user сменился без logout)
    setSubscription(null);
    setSubscriptionLoading(true);

    const controller = new AbortController();

    fetch("/api/subscription/status", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // Только окончательный ответ сервера меняет состояние: успешный
        // ответ с пустыми данными — подписки действительно нет
        if (data.ok && data.data) {
          setSubscription(data.data as NonNullable<SubscriptionStatus>);
        } else {
          setSubscription(null);
        }
      })
      .catch((err) => {
        // Транзиентные сбои (обрыв сети, 5xx при перезапуске сервера)
        // НЕ сбрасывают подписку: иначе подписчик при возврате на вкладку
        // во время сетевой ошибки увидел бы, как все премиум-секции
        // «закрываются» гейтом (refresh на focus/visibilitychange снова
        // запросит статус — и при восстановлении сети доступ вернётся).
        // AbortError — запрос отменён при смене пользователя, это не ошибка
        if (err.name === "AbortError") return;
      })
      .finally(() => {
        // finally срабатывает и для aborted-запроса предыдущего пользователя;
        // защищаемся от ложного снятия loading при быстрой смене аккаунтов
        if (!controller.signal.aborted) {
          setSubscriptionLoading(false);
        }
      });

    return () => controller.abort();
  }, [user, loading, refreshCounter]);

  const value = React.useMemo(
    () => ({
      // Отменённая подписка с неистёкшим сроком тоже даёт доступ —
      // «до конца оплаченного периода» (см. /api/subscription/status)
      hasSubscription: subscription !== null,
      subscriptionLoading,
      subscription,
      isCancelled: subscription?.isCancelled === true,
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
