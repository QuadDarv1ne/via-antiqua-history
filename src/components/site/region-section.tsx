'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Info } from 'lucide-react'
import type { Region, Landmark } from '@/lib/history-data'
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

const regionIconMap: Record<string, React.ReactNode> = {
  temple: <span className="text-xl">🏛️</span>,
  crown: <span className="text-xl">👑</span>,
  tablets: <span className="text-xl">📜</span>,
  amphora: <span className="text-xl">🏺</span>,
}

export function RegionSection({ region }: { region: Region }) {
  const [activeCityId, setActiveCityId] = React.useState(region.cities[0].id)
  const [activeLandmark, setActiveLandmark] = React.useState<Landmark | null>(
    null
  )
  const activeCity = region.cities.find((c) => c.id === activeCityId) ?? region.cities[0]

  return (
    <section
      id={region.id}
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background: `linear-gradient(180deg, transparent 0%, oklch(from ${region.color} l c h / 0.04) 50%, transparent 100%)`,
      }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        {/* Заголовок региона */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card"
              style={{ color: region.color }}
            >
              {regionIconMap[region.icon]}
            </span>
            <div>
              <span
                className="text-xs uppercase tracking-widest font-medium"
                style={{ color: region.color }}
              >
                Раздел
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-semibold">
                {region.name}
              </h2>
            </div>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground italic font-body max-w-3xl">
            {region.tagline}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Левая колонка: переключение городов */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 relative flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scroll pb-2 lg:pb-0">
              <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent lg:hidden" />
              <span className="hidden lg:block text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Города и памятники
              </span>
              {region.cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setActiveCityId(city.id)}
                  className={cn(
                    'text-left whitespace-nowrap lg:whitespace-normal px-4 py-3 rounded-lg border transition-all',
                    activeCityId === city.id
                      ? 'bg-card border-primary shadow-sm'
                      : 'bg-card/50 border-border hover:bg-card hover:border-primary/40'
                  )}
                >
                  <div className="font-display text-base font-semibold">
                    {city.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {city.era}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Правая колонка: контент активного города */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-display text-2xl md:text-3xl font-semibold">
                        {activeCity.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {activeCity.region}
                        </span>
                        {activeCity.modernName && (
                          <span className="flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" />
                            Совр. {activeCity.modernName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {activeCity.era}
                        </span>
                      </div>
                    </div>
                    <BookmarkButton
                      item={{
                        id: `city:${activeCity.id}`,
                        type: 'city',
                        title: activeCity.name,
                        subtitle: `${activeCity.region} — ${activeCity.era}`,
                        href: `#${region.id}`,
                        region: region.id,
                      }}
                    />
                  </div>

                  <p className="text-base md:text-lg leading-relaxed text-foreground/90 mb-6 italic border-l-4 pl-4"
                     style={{ borderColor: region.color }}>
                    {activeCity.summary}
                  </p>

                  <div className="space-y-4">
                    {activeCity.description.map((para, i) => (
                      <p key={i} className="text-base leading-relaxed text-foreground/85">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Достопримечательности */}
                <div className="mt-8">
                  <h4 className="font-display text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
                    <span
                      className="inline-block h-1 w-8 rounded-full"
                      style={{ backgroundColor: region.color }}
                    />
                    Главные достопримечательности
                  </h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    {activeCity.landmarks.map((lm, i) => (
                      <motion.button
                        key={lm.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        onClick={() => setActiveLandmark(lm)}
                        className="text-left p-5 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="font-display text-lg font-semibold">
                            {lm.name}
                          </h5>
                          <Badge
                            variant="secondary"
                            className="shrink-0"
                            style={{
                              backgroundColor: `oklch(from ${region.color} l c h / 0.15)`,
                              color: region.color,
                            }}
                          >
                            {lm.period}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {lm.shortDesc}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          Подробнее →
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Описание региона в конце */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 prose prose-lg max-w-none"
        >
          <h4 className="font-display text-xl md:text-2xl font-semibold mb-4">
            Исторический контекст
          </h4>
          <div className="space-y-4 text-base leading-relaxed text-foreground/85">
            {region.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Модальное окно достопримечательности */}
      <Dialog
        open={!!activeLandmark}
        onOpenChange={(o) => !o && setActiveLandmark(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <Badge
                  variant="secondary"
                  className="mb-2"
                  style={{
                    backgroundColor: `oklch(from ${region.color} l c h / 0.15)`,
                    color: region.color,
                  }}
                >
                  {activeLandmark?.period}
                </Badge>
                <DialogTitle className="font-display text-2xl md:text-3xl">
                  {activeLandmark?.name}
                </DialogTitle>
              </div>
              {activeLandmark && (
                <BookmarkButton
                  item={{
                    id: `landmark:${activeLandmark.id}`,
                    type: 'landmark',
                    title: activeLandmark.name,
                    subtitle: `${activeCity.name} — ${activeLandmark.period}`,
                    href: `#${region.id}`,
                    region: region.id,
                  }}
                />
              )}
            </div>
            <DialogDescription className="text-base">
              {activeLandmark?.shortDesc}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5">
              <p className="text-base leading-relaxed text-foreground/90">
                {activeLandmark?.fullDesc}
              </p>

              <div>
                <h5 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                  <span
                    className="inline-block h-1 w-6 rounded-full"
                    style={{ backgroundColor: region.color }}
                  />
                  Ключевые особенности
                </h5>
                <ul className="space-y-2">
                  {activeLandmark?.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm leading-relaxed"
                    >
                      <span
                        className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="text-foreground/85">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  )
}
