'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { timeline, additionalTimelineEvents } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { REGION_COLORS, REGION_LABELS, REGION_SHORT } from '@/lib/constants'

// Объединяем и сортируем события по году
const allTimeline = [...timeline, ...additionalTimelineEvents].sort(
  (a, b) => a.year - b.year
)

export function TimelineSection() {
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [isInView, setIsInView] = React.useState(false)
  const sectionRef = React.useRef<HTMLElement>(null)
  const event = allTimeline[activeIdx]

  const go = (dir: 1 | -1) => {
    setActiveIdx((cur) =>
      Math.min(allTimeline.length - 1, Math.max(0, cur + dir))
    )
  }

  // Отслеживаем, в зоне видимости ли секция
  React.useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keyboard navigation когда секция в видимости
  React.useEffect(() => {
    if (!isInView) return
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isInView, activeIdx])

  return (
    <section
      id="timeline"
      ref={sectionRef}
      className="py-20 md:py-28 scroll-mt-20"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Параллельная хронология
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Лента времени
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Проследите, как одновременно развивались четыре региона — от
            шумерских городов до падения Константинополя. Нажимайте на события
            или используйте стрелки.
          </p>
        </motion.div>

        {/* Лента снизу — дорожка с событиями */}
        <div className="mb-8">
          <div className="relative overflow-x-auto custom-scroll pb-4">
            <div className="flex items-stretch gap-0 min-w-max px-2">
              {allTimeline.map((ev, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Событие: ${ev.yearLabel}`}
                  className={cn(
                    'group relative flex flex-col items-stretch transition-all',
                    'min-w-[100px] sm:min-w-[140px] md:min-w-[180px]'
                  )}
                >
                  {/* Точки на дорожке */}
                  <div className="h-12 flex items-center">
                    <div className="flex-1 h-px bg-border" />
                    <div
                      className={cn(
                        'mx-1 flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all',
                        activeIdx === i
                          ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-lg'
                          : 'border-border bg-card group-hover:border-primary/50 group-hover:scale-105'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          activeIdx === i ? 'bg-primary-foreground' : 'bg-primary/50'
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        'flex-1 h-px',
                        i === allTimeline.length - 1 ? 'opacity-0' : 'bg-border'
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      'px-2 text-center text-xs leading-tight transition-colors',
                      activeIdx === i
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground group-hover:text-foreground/80'
                    )}
                  >
                    {ev.yearLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Активное событие */}
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-12 gap-6 items-stretch"
        >
          {/* Левая колонка: год и навигация */}
          <div className="md:col-span-4">
            <div className="rounded-xl border border-border bg-card p-6 h-full flex flex-col">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {activeIdx + 1} из {allTimeline.length}
              </div>
              <div className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 gold-text">
                {event.yearLabel}
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                {event.greece || event.rome || event.mesopotamia || event.kuban
                  ? 'События этого периода:'
                  : 'Событие этого периода'}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => go(-1)}
                  disabled={activeIdx === 0}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => go(1)}
                  disabled={activeIdx === allTimeline.length - 1}
                  className="flex-1"
                >
                  Далее <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <span className="hidden sm:inline text-[11px] text-muted-foreground italic text-center mt-2">
                ← → для навигации
              </span>
            </div>
          </div>

          {/* Правая колонка: события по регионам */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {(['greece', 'rome', 'mesopotamia', 'kuban'] as const).map(
                (regionKey) => {
                  const text = event[regionKey]
                  const meta = {
                    label: REGION_LABELS[regionKey] ?? regionKey,
                    color: REGION_COLORS[regionKey] ?? REGION_COLORS.general,
                    short: REGION_SHORT[regionKey] ?? regionKey.toUpperCase(),
                  }
                  return (
                    <div
                      key={regionKey}
                      className={cn(
                        'rounded-lg border p-5 transition-all',
                        text
                          ? 'bg-card border-border'
                          : 'bg-muted/30 border-border/60 opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.short}
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/85 min-h-[3rem]">
                        {text || '— нет заметных событий в этот период'}
                      </p>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
