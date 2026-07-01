'use client'

import * as React from 'react'

const STORAGE_KEY = 'via-antiqua-progress'

interface SectionProgress {
  [sectionId: string]: boolean
}

export function useSectionProgress(sectionIds: string[]) {
  const [completed, setCompleted] = React.useState<SectionProgress>({})
  const [hasInteracted, setHasInteracted] = React.useState(false)

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCompleted(JSON.parse(stored))
        setHasInteracted(true)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Mark section as completed when it scrolls into view
  React.useEffect(() => {
    if (!hasInteracted) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id
            if (sectionId && sectionIds.includes(sectionId)) {
              setCompleted((prev) => {
                if (prev[sectionId]) return prev
                const updated = { ...prev, [sectionId]: true }
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                } catch {
                  // Ignore storage errors
                }
                return updated
              })
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sectionIds, hasInteracted])

  // Reset progress
  const resetProgress = React.useCallback(() => {
    setCompleted({})
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }, [])

  const completedCount = Object.values(completed).filter(Boolean).length
  const progressPercent = sectionIds.length > 0
    ? Math.round((completedCount / sectionIds.length) * 100)
    : 0

  return { completed, progressPercent, resetProgress }
}
