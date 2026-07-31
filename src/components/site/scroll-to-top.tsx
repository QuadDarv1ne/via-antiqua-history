'use client'

import * as React from 'react'
import { ChevronUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg hover:shadow-xl hover:bg-accent/10 hover:scale-110 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
      aria-label="Наверх"
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
