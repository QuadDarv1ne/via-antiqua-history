'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, Play, Pause } from 'lucide-react'
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
  const [autoPlay, setAutoPlay] = React.useState(false)
  const sectionRef = React.useRef<HTMLElement>(null)
  const autoPlayRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const go = React.useCallback((dir: 1 | -1) => {
    setAutoPlay(false)
    setActiveIdx((cur) =>
      Math.min(allTimeline.length - 1, Math.max(0, cur + dir))
    )
  }, [])

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

  // Auto-play interval
  React.useEffect(() => {
    if (!autoPlay || !isInView) {
      clearInterval(autoPlayRef.current)
      return
    }
    autoPlayRef.current = setInterval(() => {
      setActiveIdx((cur) => {
        if (cur >= allTimeline.length - 1) {
          setAutoPlay(false)
          return cur
        }
        return cur + 1
      })
    }, 4000)
    return () => clearInterval(autoPlayRef.current)
  }, [autoPlay, isInView])

  // Keyboard navigation когда секция в видимости
  React.useEffect(() => {
    if (!isInView) return
    const el = sectionRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveIdx((cur) => Math.max(0, cur - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setActiveIdx((cur) => Math.min(allTimeline.length - 1, cur + 1))
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [isInView])

  if (!allTimeline.length) {
    return null
  }

  const event = allTimeline[activeIdx]

  return (
    <section
      id="timeline"
      ref={sectionRef}
      tabIndex={0}
      role="region"
      aria-label="Лента времени"
      className="py-20 md:py-28 scroll-mt-20 outline-none"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 md:mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-3 sm:mb-4">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-medium">
              Параллельная хронология
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 sm:mb-4">
            Лента времени
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
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
                  onClick={() => { setAutoPlay(false); setActiveIdx(i) }}
                  aria-label={`Событие: ${ev.yearLabel}`}
                  aria-current={activeIdx === i ? 'true' : undefined}
                  className={cn(
                    'group relative flex flex-col items-stretch transition-all',
                    'min-w-[110px] sm:min-w-[150px] md:min-w-[190px]'
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
          className="grid md:grid-cols-12 gap-4 sm:gap-6 items-stretch"
        >
          {/* Левая колонка: год и навигация */}
          <div className="md:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 md:p-6 h-full flex flex-col">
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-2">
                {activeIdx + 1} из {allTimeline.length}
              </div>
              <div className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 gold-text">
                {event.yearLabel}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 flex-1">
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
                  className="flex-1 text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1 sm:mr-1" /> Назад
                </Button>
                <Button
                  variant={autoPlay ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoPlay((v) => !v)}
                  disabled={activeIdx === allTimeline.length - 1}
                  className="flex-none text-xs sm:text-sm"
                >
                  {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => go(1)}
                  disabled={activeIdx === allTimeline.length - 1}
                  className="flex-1 text-xs sm:text-sm"
                >
                  Далее <ChevronRight className="h-3.5 w-3.5 ml-1 sm:ml-1" />
                </Button>
              </div>
              <span className="hidden sm:inline text-[11px] text-muted-foreground italic text-center mt-2">
                ← → для навигации
              </span>
            </div>
          </div>

          {/* Правая колонка: события по регионам */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
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
                        'rounded-lg p-3.5 sm:p-4 md:p-5 transition-all',
                        text
                          ? 'border border-border bg-card'
                          : 'border border-border/60 bg-muted/30 opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <span
                          className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.short}
                        </span>
                        <span
                          className="text-xs sm:text-sm font-semibold truncate"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-foreground/85 min-h-[2.5rem] sm:min-h-[3rem]">
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
