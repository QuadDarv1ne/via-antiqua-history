'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookMarked, Search, X } from 'lucide-react'
import { glossary } from '@/lib/history-data'
import { cn, withAlpha, getSectionGradient } from '@/lib/utils'
import { normalizeQuery, findHighlightRanges } from '@/lib/search'
import { Input } from '@/components/ui/input'
import { BookmarkButton } from '@/components/site/bookmarks'
import { ReadingTime } from '@/components/site/reading-time'
import { REGION_COLORS, REGION_LABELS, FILTER_LABELS } from '@/lib/constants'
import { SectionHeader } from '@/components/site/section-header'

const filterOptions = Object.entries(FILTER_LABELS).map(([key, label]) => ({
  key,
  label,
}))

function getOriginMeta(origin: string) {
  return { label: REGION_LABELS[origin] ?? origin, color: REGION_COLORS[origin] ?? REGION_COLORS.general }
}

export function GlossarySection() {
  const [filter, setFilter] = React.useState('all')
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    // Нормализация «ё/е» и регистра — как в глобальном поиске:
    // «мед» находит «мёд», «Акрополь» == «акрополь»
    const q = normalizeQuery(query)
    return glossary.filter((t) => {
      const matchFilter = filter === 'all' || t.origin === filter
      const matchQuery =
        !q ||
        normalizeQuery(t.term).includes(q) ||
        normalizeQuery(t.definition).includes(q)
      return matchFilter && matchQuery
    })
  }, [filter, query])

  // Подсветка совпадений запроса в термине/определении — единый стиль
  // с глобальным поиском (findHighlightRanges)
  const renderHighlighted = React.useCallback(
    (text: string, prefix: string, idx: number) => {
      const ranges = findHighlightRanges(text, query)
      if (ranges.length === 0) return text
      const nodes: React.ReactNode[] = []
      let pos = 0
      ranges.forEach(([start, end], i) => {
        if (start > pos) nodes.push(text.slice(pos, start))
        nodes.push(
          <mark
            key={`${prefix}-${idx}-${i}`}
            className="bg-primary/15 text-foreground rounded-[2px] px-0.5"
          >
            {text.slice(start, end)}
          </mark>,
        )
        pos = end
      })
      if (pos < text.length) nodes.push(text.slice(pos))
      return nodes
    },
    [query],
  )

  return (
    <section
      id="glossary"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background: getSectionGradient(),
      }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          icon={<BookMarked className="h-3.5 w-3.5 text-primary" />}
          label="Справочный раздел"
          title="Глоссарий ключевых терминов"
          description={`${glossary.length} ключевых понятий античного мира — от архитектурных ордеров до политических институтов. Используйте фильтр и поиск для быстрого доступа.`}
          readingTime={<ReadingTime text={glossary.map((t) => t.definition)} className="justify-center mt-2" />}
        />

        {/* Search + filter */}
        <div className="mb-5 sm:mb-6 flex flex-col gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('')
                  e.currentTarget.blur()
                }
              }}
              placeholder="Поиск термина…"
              className="pl-10 pr-10 h-10 sm:h-11 text-sm"
              aria-label="Поиск по глоссарию"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Очистить поиск"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div
            className="flex flex-wrap gap-1.5 sm:gap-2"
            role="radiogroup"
            aria-label="Фильтр по происхождению"
            onKeyDown={(e) => {
              const currentIdx = filterOptions.findIndex((o) => o.key === filter)
              if (currentIdx === -1) return
              let nextIdx = currentIdx
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                nextIdx = (currentIdx + 1) % filterOptions.length
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                nextIdx = (currentIdx - 1 + filterOptions.length) % filterOptions.length
              } else if (e.key === 'Home') {
                e.preventDefault()
                nextIdx = 0
              } else if (e.key === 'End') {
                e.preventDefault()
                nextIdx = filterOptions.length - 1
              }
              if (nextIdx !== currentIdx) {
                setFilter(filterOptions[nextIdx].key)
                const nextEl = document.querySelector<HTMLElement>(
                  `[data-glossary-filter="${filterOptions[nextIdx].key}"]`,
                )
                nextEl?.focus()
              }
            }}
          >
            {filterOptions.map((opt) => (
              <button
                type="button"
                key={opt.key}
                role="radio"
                aria-checked={filter === opt.key}
                tabIndex={filter === opt.key ? 0 : -1}
                data-glossary-filter={opt.key}
                onClick={() => setFilter(opt.key)}
                className={cn(
                  'px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  filter === opt.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terms grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Ничего не найдено. Попробуйте изменить запрос.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((term, idx) => {
              const meta = getOriginMeta(term.origin)
              return (
                <motion.div
                  key={term.term}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.5) }}
                  className="rounded-lg border border-border bg-card p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-base sm:text-lg font-semibold leading-tight">
                      {renderHighlighted(term.term, 't', idx)}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <BookmarkButton
                        item={{
                          id: `term:${term.term}`,
                          type: 'term',
                          title: term.term,
                          subtitle: term.definition.slice(0, 100),
                          href: '#glossary',
                          region: term.origin,
                        }}
                      />
                      <span
                        className="shrink-0 inline-block px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                        style={{
                          backgroundColor: withAlpha(meta.color, 0.12),
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {renderHighlighted(term.definition, 'd', idx)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={filtered.length}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="mt-6 text-xs text-muted-foreground text-center"
            aria-live="polite"
          >
            Найдено терминов: {filtered.length} из {glossary.length}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
