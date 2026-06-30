'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { GitCompareArrows } from 'lucide-react'
import { comparisonRows } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import { REGION_COLORS, REGION_LABELS } from '@/lib/constants'

const columns = [
  { key: 'greece', label: REGION_LABELS.greece, color: REGION_COLORS.greece },
  { key: 'rome', label: REGION_LABELS.rome, color: REGION_COLORS.rome },
  { key: 'mesopotamia', label: REGION_LABELS.mesopotamia, color: REGION_COLORS.mesopotamia },
  { key: 'kuban', label: REGION_LABELS.kuban, color: REGION_COLORS.kuban },
] as const

export function ComparisonSection() {
  const [activeCol, setActiveCol] = React.useState<string | null>(null)

  return (
    <section
      id="comparison"
      className="py-20 md:py-28 scroll-mt-20"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 md:mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-3 sm:mb-4">
            <GitCompareArrows className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-medium">
              Сравнительный анализ
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 sm:mb-4">
            Четыре цивилизации бок о бок
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Сопоставление Древней Греции, Рима, Месопотамии и Кубани по восьми
            ключевым параметрам. Наведите на колонку, чтобы её подсветить.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <caption className="sr-only">Сравнение четырёх цивилизаций: Греция, Рим, Месопотамия и Кубань по восьми ключевым параметрам</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left p-3 sm:p-4 font-display font-semibold sticky left-0 bg-card z-10 min-w-[140px] sm:min-w-[160px]">
                    Критерий
                  </th>
                  {columns.map((col) => (
                    <th
                      scope="col"
                      key={col.key}
                      onMouseEnter={() => setActiveCol(col.key)}
                      onMouseLeave={() => setActiveCol(null)}
                      onFocus={() => setActiveCol(col.key)}
                      onBlur={() => setActiveCol(null)}
                      tabIndex={0}
                      className={cn(
                        'text-left p-3 sm:p-4 font-display font-semibold transition-colors cursor-default min-w-[180px] sm:min-w-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                        activeCol === col.key ? 'bg-muted/40' : 'bg-card'
                      )}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        <span style={{ color: col.color }}>{col.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.criterion}
                    className={cn(
                      'border-b border-border/60 transition-colors',
                      idx % 2 === 0 ? 'bg-card/50' : 'bg-card'
                    )}
                  >
                    <td className="p-3 sm:p-4 font-medium sticky left-0 bg-inherit z-10 text-xs sm:text-sm">
                      {row.criterion}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        onMouseEnter={() => setActiveCol(col.key)}
                        onMouseLeave={() => setActiveCol(null)}
                        className={cn(
                          'p-3 sm:p-4 text-foreground/85 transition-colors text-xs sm:text-sm',
                          activeCol === col.key && 'bg-muted/40'
                        )}
                      >
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden divide-y divide-border">
            {comparisonRows.map((row) => (
              <div key={row.criterion} className="p-4 sm:p-5">
                <h3 className="font-display font-semibold mb-3 text-sm sm:text-base">
                  {row.criterion}
                </h3>
                <div className="space-y-3">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="flex gap-2 text-sm"
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: col.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className="font-medium text-xs sm:text-sm block"
                          style={{ color: col.color }}
                        >
                          {col.label}
                        </span>
                        <span className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                          {row[col.key]}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
