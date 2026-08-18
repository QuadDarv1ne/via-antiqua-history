'use client'

import * as React from 'react'

interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useInView<T extends HTMLElement = HTMLDivElement>({ threshold = 0, rootMargin = '0px', triggerOnce = true }: UseInViewOptions = {}) {
  const [ref, setRef] = React.useState<T | null>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (triggerOnce) observer.disconnect()
        } else if (!triggerOnce) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold, rootMargin, triggerOnce])

  return { ref: setRef, inView }
}
