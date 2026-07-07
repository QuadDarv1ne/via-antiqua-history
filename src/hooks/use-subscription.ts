'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useSubscription(enabled = true) {
  const { user, loading } = useAuth()
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  useEffect(() => {
    if (!enabled || !user || loading) {
      if (!loading) setSubscriptionLoading(false)
      return
    }

    let cancelled = false

    fetch('/api/subscription/status')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (!cancelled) {
          setHasSubscription(data.ok && data.data?.status === 'active')
        }
      })
      .catch(() => {
        if (!cancelled) setHasSubscription(false)
      })
      .finally(() => {
        if (!cancelled) setSubscriptionLoading(false)
      })

    return () => { cancelled = true }
  }, [user, loading, enabled])

  return { hasSubscription, subscriptionLoading }
}