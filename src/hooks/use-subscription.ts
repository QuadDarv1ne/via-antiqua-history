"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription(enabled = true) {
  const { user, loading } = useAuth();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !user || loading) {
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
        setHasSubscription(data.ok && data.data?.status === "active");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setHasSubscription(false);
      })
      .finally(() => {
        setSubscriptionLoading(false);
      });

    return () => controller.abort();
  }, [user, loading, enabled]);

  return { hasSubscription, subscriptionLoading };
}
