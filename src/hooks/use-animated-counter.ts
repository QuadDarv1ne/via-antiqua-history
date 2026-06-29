'use client'

import * as React from 'react'

/**
 * Анимирует число от 0 до `target` при монтировании.
 * Возвращает текущее значение для отрисовки.
 */
export function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = React.useState(0)
  const rafRef = React.useRef<number | null>(null)
  const startRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (target <= 0) return

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startRef.current = null
    }
  }, [target, duration])

  return value
}
