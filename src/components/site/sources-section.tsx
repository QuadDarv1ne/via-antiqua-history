'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, BookOpen, Landmark, Globe, Scroll, BookText } from 'lucide-react'
import { sources, type SourceRef } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import { ReadingTime } from '@/components/site/reading-time'
import { SectionHeader } from '@/components/site/section-header'

const categoryMeta: Record<
  SourceRef['category'],
  { label: string; icon: React.ReactNode; color: string }
> = {
  primary: {
    label: 'Первичные источники',
    icon: <Scroll className="h-4 w-4" />,
    color: 'oklch(0.55 0.15 45)',
  },
  literature: {
    label: 'Исследовательская литература',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'oklch(0.5 0.12 260)',
  },
  web: {
    label: 'Веб-источники',
    icon: <Globe className="h-4 w-4" />,
    color: 'oklch(0.6 0.15 180)',
  },
  museum: {
    label: 'Музеи и заповедники',
    icon: <Landmark className="h-4 w-4" />,
    color: 'oklch(0.55 0.1 80)',
  },
}

const categoryOrder: SourceRef['category'][] = [
  'web',
  'primary',
  'literature',
  'museum',
]

export function SourcesSection() {
  return (
    <section
      id="sources"
      className="py-20 md:py-28 scroll-mt-20"
    >
      <div className="container mx-auto max-w-5xl px-4">
        <SectionHeader
          icon={<BookText className="h-3.5 w-3.5 text-primary" />}
          label="Библиография"
          title="Источники и ссылки"
          description="Литература, первоисточники и музеи, использованные при подготовке материалов сайта. Стартовая точка проекта — статья о прогулке по афинскому Акрополю из «Яндекс.Путешествий»."
          readingTime={<ReadingTime text={sources.map((s) => `${s.title} ${s.description}`)} className="justify-center mt-2" />}
        />

        <div className="space-y-10">
          {categoryOrder.map((cat) => {
            const items = sources.filter((s) => s.category === cat)
            if (items.length === 0) return null
            const meta = categoryMeta[cat]
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-border bg-card text-primary shrink-0">
                    {meta.icon}
                  </span>
                  {meta.label}
                </h3>
                <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {items.map((src) => {
                    const card = (
                      <div
                        key={src.title}
                        className={cn(
                          'rounded-lg border border-border bg-card p-3 sm:p-4 transition-shadow hover:shadow-sm relative overflow-hidden',
                          src.url && 'cursor-pointer'
                        )}
                        style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-display font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                            {src.title}
                          </h4>
                          {src.url && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                          )}
                        </div>
                        {src.author && (
                          <p className="text-xs sm:text-sm text-primary font-medium mb-1.5 sm:mb-2">
                            {src.author}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed line-clamp-2">
                          {src.description}
                        </p>
                      </div>
                    )
                    return src.url ? (
                      <a
                        key={src.title}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contents"
                      >
                        {card}
                      </a>
                    ) : card
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
