'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Hourglass } from 'lucide-react'
import { epochs } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import { REGION_COLORS, REGION_LABELS } from '@/lib/constants'

const regionColors = REGION_COLORS
const regionLabels = REGION_LABELS

export function EpochsSection() {
  return (
    <section
      id="epochs"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.5 0.05 60 / 0.04) 0%, transparent 100%)',
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
            <Hourglass className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Исторические эпохи
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Карта эпох античности
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Восемь ключевых эпох — от шумерских городов до падения
            Константинополя. Цветными метками отмечены регионы, затронутые
            каждой эпохой.
          </p>
        </motion.div>

        {/* Таймлайн эпох */}
        <div className="relative">
          {/* Вертикальная линия */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />

          <div className="space-y-8">
            {epochs.map((epoch, idx) => {
              const isLeft = idx % 2 === 0
              return (
                <motion.div
                  key={epoch.id}
                  initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    'relative flex flex-col md:flex-row gap-4',
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  )}
                >
                  {/* Точка на линии */}
                  <div className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 z-10">
                    <span className="block h-4 w-4 rounded-full bg-primary border-2 border-background shadow-md" />
                  </div>

                  {/* Карточка эпохи */}
                  <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                    <div className="rounded-lg border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <h3 className="font-display text-xl font-semibold leading-tight">
                          {epoch.name}
                        </h3>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {epoch.period}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                        {epoch.shortDesc}
                      </p>

                      {/* Регионы */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {epoch.regions.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `oklch(from ${regionColors[r]} l c h / 0.12)`,
                              color: regionColors[r],
                            }}
                          >
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: regionColors[r] }}
                            />
                            {regionLabels[r]}
                          </span>
                        ))}
                      </div>

                      {/* Highlights */}
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {epoch.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Пустая половина для зигзага на десктопе */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
