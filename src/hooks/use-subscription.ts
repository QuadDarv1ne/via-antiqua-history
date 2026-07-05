'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useSubscription() {
  const { user, loading } = useAuth()
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  useEffect(() => {
    if (!user || loading) {
      if (!loading) setSubscriptionLoading(false)
      return
    }

    let cancelled = false

    fetch('/api/subscription/status')
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setHasSubscription(data.ok && data.data?.status === 'active')
          setSubscriptionLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasSubscription(false)
          setSubscriptionLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user, loading])

  return { hasSubscription, subscriptionLoading }
}