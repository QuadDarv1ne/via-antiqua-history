'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BookMarked, Search } from 'lucide-react'
import { glossary } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { BookmarkButton } from '@/components/site/bookmarks'
import { REGION_COLORS, REGION_LABELS, FILTER_LABELS } from '@/lib/constants'

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

  const filtered = glossary.filter((t) => {
    const matchFilter = filter === 'all' || t.origin === filter
    const matchQuery =
      !query ||
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.definition.toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  return (
    <section
      id="glossary"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.55 0.1 60 / 0.04) 0%, transparent 100%)',
      }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
            <BookMarked className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Справочный раздел
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Глоссарий ключевых терминов
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            22 основных понятия античного мира — от архитектурных ордеров до
            политических институтов. Используйте фильтр и поиск для быстрого
            доступа.
          </p>
        </motion.div>

        {/* Search + filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск термина или определения…"
              className="pl-10"
              aria-label="Поиск по глоссарию"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap',
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((term, idx) => {
              const meta = getOriginMeta(term.origin)
              return (
                <motion.div
                  key={term.term}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.03 }}
                  className="rounded-lg border border-border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-lg font-semibold leading-tight">
                      {term.term}
                    </h3>
                    <div className="flex items-center gap-1.5">
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
                        className="shrink-0 inline-block px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium"
                        style={{
                          backgroundColor: `oklch(from ${meta.color} l c h / 0.12)`,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {term.definition}
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="mt-6 text-xs text-muted-foreground text-center">
          Найдено терминов: {filtered.length} из {glossary.length}
        </div>
      </div>
    </section>
  )
}
