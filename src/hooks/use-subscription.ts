"use client";

import { useSubscriptionContext } from "@/contexts/SubscriptionContext";

/**
 * Хук доступа к состоянию подписки. Данные единые для всей страницы
 * (SubscriptionProvider делает один запрос к /api/subscription/status).
 * `enabled=false` отключает блокирующее ожидание загрузки.
 */
export function useSubscription(enabled = true) {
  const ctx = useSubscriptionContext();
  if (!enabled) {
    return {
      hasSubscription: ctx.hasSubscription,
      subscriptionLoading: false,
    };
  }
  return {
    hasSubscription: ctx.hasSubscription,
    subscriptionLoading: ctx.subscriptionLoading,
  };
}
