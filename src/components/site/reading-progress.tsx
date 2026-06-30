'use client'

import * as React from 'react'
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })
  const [percentage, setPercentage] = React.useState(0)
  const lastPercentRef = React.useRef(0)

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = Math.round(latest * 100)
    if (next !== lastPercentRef.current) {
      lastPercentRef.current = next
      setPercentage(next)
    }
  })

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-[40] origin-left bg-primary"
        style={{ scaleX }}
      />
      <AnimatePresence>
        {percentage > 5 && (
          <motion.div
            className="fixed top-12 sm:top-14 right-2 sm:right-3 h-5 sm:h-6 text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-card border border-border px-1 sm:px-1.5 py-0.5 rounded shadow-sm z-40 leading-none flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {percentage}%
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
