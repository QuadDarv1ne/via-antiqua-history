'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users } from 'lucide-react'
import { persons, type Person } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookmarkButton } from '@/components/site/bookmarks'
import { REGION_COLORS, REGION_LABELS } from '@/lib/constants'

const filters: { key: string; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'greece', label: 'Греция' },
  { key: 'rome', label: 'Рим' },
  { key: 'mesopotamia', label: 'Месопотамия' },
  { key: 'kuban', label: 'Кубань' },
]

export function PersonsSection() {
  const [filter, setFilter] = React.useState('all')
  const [active, setActive] = React.useState<Person | null>(null)

  const filtered = persons.filter((p) => filter === 'all' || p.region === filter)

  return (
    <section
      id="persons"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.55 0.1 50 / 0.04) 0%, transparent 100%)',
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
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Исторические деятели
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Ключевые персоналии
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {persons.length} исторических деятелей, определивших судьбы Греции,
            Рима, Месопотамии и Кубани — от Саргона Древнего до князя Владимира.
            Нажмите на карточку, чтобы прочитать подробную биографию.
          </p>
        </motion.div>

        {/* Фильтры */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {filters.map((f) => (
            <button
              type="button"
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                filter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/40'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Сетка персоналий */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, idx) => {
              const color = REGION_COLORS[p.region]
              return (
                <motion.button
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setActive(p)}
                  className="text-left p-5 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold leading-tight">
                        {p.name}
                      </h3>
                      {p.originalName && (
                        <p className="text-xs text-muted-foreground italic mt-0.5 font-body">
                          {p.originalName}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 inline-block px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium"
                      style={{
                        backgroundColor: `oklch(from ${color} l c h / 0.12)`,
                        color,
                      }}
                    >
                      {REGION_LABELS[p.region]}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium mb-2">{p.era}</p>
                  <p className="text-xs text-muted-foreground mb-3 italic">
                    {p.role}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                    {p.shortBio}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Читать биографию →
                  </span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Модальное окно с биографией */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                {active && (
                  <Badge
                    variant="secondary"
                    className="mb-2"
                    style={{
                      backgroundColor: `oklch(from ${REGION_COLORS[active.region]} l c h / 0.15)`,
                      color: REGION_COLORS[active.region],
                    }}
                  >
                    {REGION_LABELS[active.region]} · {active.era}
                  </Badge>
                )}
                <DialogTitle className="font-display text-2xl md:text-3xl">
                  {active?.name}
                </DialogTitle>
                {active?.originalName && (
                  <p className="text-sm text-muted-foreground italic mt-1 font-body">
                    {active.originalName}
                  </p>
                )}
              </div>
              {active && (
                <BookmarkButton
                  item={{
                    id: `person:${active.id}`,
                    type: 'person',
                    title: active.name,
                    subtitle: `${active.role} · ${active.era}`,
                    href: '#persons',
                    region: active.region,
                  }}
                />
              )}
            </div>
            <DialogDescription className="text-base">
              {active?.role}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5">
              <p className="text-base leading-relaxed text-foreground/90">
                {active?.shortBio}
              </p>
              <p className="text-base leading-relaxed text-foreground/85">
                {active?.fullBio}
              </p>

              {active && (
                <div>
                  <h5 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <span
                      className="inline-block h-1 w-6 rounded-full"
                      style={{
                        backgroundColor: REGION_COLORS[active.region],
                      }}
                    />
                    Главные достижения
                  </h5>
                  <ul className="space-y-2">
                    {active.achievements.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm leading-relaxed"
                      >
                        <span
                          className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: REGION_COLORS[active.region],
                          }}
                        />
                        <span className="text-foreground/85">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  )
}
