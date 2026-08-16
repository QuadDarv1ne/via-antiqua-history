'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { FAQ_DATA } from '@/lib/history-data'
import { cn, getSectionGradient } from '@/lib/utils'
import { ReadingTime } from '@/components/site/reading-time'
import { SectionHeader } from '@/components/site/section-header'

export const FaqSection = React.memo(function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)
  // Индекс кнопки, на которой сейчас фокус: стрелки двигают фокус, а не
  // раскрытие. Отслеживаем через onFocus, а не openIndex, иначе после
  // первого ArrowDown фокус «застревает» (openIndex не меняется)
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  // Клавиатурная навигация по аккордеону (ARIA APG): ↑/↓, Home/End.
  // Фокус перемещается между кнопками, раскрытие — отдельным Enter/Space.
  const handleContainerKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const current = focusedIndex
      let next = current
      if (e.key === 'ArrowDown') {
        next = (current + 1) % FAQ_DATA.length
      } else if (e.key === 'ArrowUp') {
        next = (current - 1 + FAQ_DATA.length) % FAQ_DATA.length
      } else if (e.key === 'Home') {
        next = 0
      } else if (e.key === 'End') {
        next = FAQ_DATA.length - 1
      } else {
        return
      }
      e.preventDefault()
      document.getElementById(`faq-button-${next}`)?.focus()
    },
    [focusedIndex],
  )

  return (
    <section
      id="faq"
      aria-label="Частые вопросы"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background: getSectionGradient(),
      }}
    >
      <div className="container mx-auto max-w-4xl px-4">
        <SectionHeader
          icon={<HelpCircle className="h-3.5 w-3.5 text-primary" />}
          label="Справочный раздел"
          title="Частые вопросы"
          description="Короткие ответы на главные вопросы о проекте — от списка цивилизаций до значения Pax Romana и Кодекса Хаммурапи."
          readingTime={<ReadingTime text={FAQ_DATA.map((f) => f.answer)} className="justify-center mt-2" />}
        />

        <div
          className="space-y-2.5 sm:space-y-3"
          role="group"
          aria-label="Навигация по вопросам"
          onKeyDown={handleContainerKeyDown}
        >
          {FAQ_DATA.map((item, idx) => {
            const open = openIndex === idx
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
                className={cn(
                  'rounded-lg border transition-colors',
                  open
                    ? 'border-primary/40 bg-card'
                    : 'border-border bg-card/60 hover:border-primary/25',
                )}
              >
                <button
                  type="button"
                  id={`faq-button-${idx}`}
                  // Roving tabindex: таб-остановка следует за фокусом. Без этого при
                  // закрытом аккордеоне (openIndex = null) весь список
                  // был бы недоступен с клавиатуры
                  tabIndex={focusedIndex === idx ? 0 : -1}
                  onFocus={() => {
                    setFocusedIndex(idx)
                  }}
                  onClick={() => setOpenIndex(open ? null : idx)}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${idx}`}
                  className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <span className="font-display text-sm sm:text-base md:text-lg font-semibold leading-snug">
                    {item.question}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border transition-colors',
                      open
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200',
                        open && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`faq-panel-${idx}`}
                      role="region"
                      aria-labelledby={`faq-button-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm sm:text-base leading-relaxed text-foreground/80 border-t border-border/60 pt-3">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
})
