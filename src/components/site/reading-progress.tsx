'use client'

import * as React from 'react'

export function ReadingProgress() {
  const [percentage, setPercentage] = React.useState(0)
  const lastPercentRef = React.useRef(0)

  React.useEffect(() => {
    let rafId: number | null = null
    let ticking = false
    let cachedScrollHeight = document.documentElement.scrollHeight - window.innerHeight

    const recalcScrollHeight = () => {
      cachedScrollHeight = document.documentElement.scrollHeight - window.innerHeight
    }

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          // Ленивая загрузка контента (next/dynamic, картинки) меняет высоту
          // документа — замеряем каждый кадр, чтобы прогресс не «залипал»
          // ниже 100% и не превышал диапазон
          const scrollHeight = document.documentElement.scrollHeight
          cachedScrollHeight = scrollHeight - window.innerHeight
          if (cachedScrollHeight > 0) {
            const next = Math.round((window.scrollY / cachedScrollHeight) * 100)
            if (next !== lastPercentRef.current) {
              lastPercentRef.current = next
              setPercentage(next)
            }
          }
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', recalcScrollHeight, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', recalcScrollHeight)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const isVisible = percentage > 5

  return (
    <div className="reading-progress">
      <div
        className="fixed top-0 left-0 right-0 h-1 z-[40] origin-left bg-primary transition-[transform] duration-150 ease-out"
        style={{ transform: `scaleX(${percentage / 100})` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Прогресс чтения"
      />
      {isVisible && (
        <div
          className="fixed top-12 sm:top-14 right-2 sm:right-3 h-5 sm:h-6 text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-card border border-border px-1 sm:px-1.5 py-0.5 rounded shadow-sm z-40 leading-none flex items-center"
          role="status"
          aria-label={`Прочитано ${percentage}%`}
        >
          {percentage}%
        </div>
      )}
    </div>
  )
}
