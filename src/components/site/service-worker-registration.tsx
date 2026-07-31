'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((registrationError) => {
          console.error('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return null
}
