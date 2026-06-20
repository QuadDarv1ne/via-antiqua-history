'use client'

import * as React from 'react'
import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'

export function ScrollToTop() {
  const { scrollYProgress } = useScroll()
  const [visible, setVisible] = React.useState(false)

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  React.useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setVisible(latest > 0.15)
    })
  }, [scrollYProgress])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={() =>
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          aria-label="Наверх"
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors group relative"
        >
          {/* Progress ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 48 48"
          >
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - scrollYProgress.get() * 100)}`}
              strokeLinecap="round"
              className="opacity-30"
              style={{ color: 'inherit' }}
            />
          </svg>
          <ArrowUp className="h-5 w-5 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
