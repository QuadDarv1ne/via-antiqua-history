'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MapPin, Calendar, Hammer, Crown } from 'lucide-react'
import { wonders, type Wonder } from '@/lib/history-data'
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

export function WondersSection() {
  const [active, setActive] = React.useState<Wonder | null>(null)

  return (
    <section
      id="wonders"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.55 0.1 60 / 0.05) 0%, oklch(0.55 0.1 50 / 0.07) 100%)',
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
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Семь чудес света
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Семь чудес древнего мира
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Знаменитый список, составленный эллинистическими греками. Из семи
            чудес до наших дней сохранилась только Пирамида Хеопса.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wonders.map((w, idx) => {
            const color = REGION_COLORS[w.region] || REGION_COLORS.greece
            return (
              <motion.button
                key={w.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => setActive(w)}
                className="text-left p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Большая цифра-номер */}
                <span className="absolute top-2 right-3 font-display text-6xl font-bold opacity-10">
                  {idx + 1}
                </span>

                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold leading-tight">
                        {w.name}
                      </h3>
                      {w.originalName && (
                        <p className="text-xs text-muted-foreground italic mt-0.5 font-body">
                          {w.originalName}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {w.location}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3 line-clamp-3">
                    {w.shortDesc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                      style={{
                        backgroundColor: `oklch(from ${color} l c h / 0.12)`,
                        color,
                      }}
                    >
                      {REGION_LABELS[w.region]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {w.built}
                    </Badge>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Модальное окно */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
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
                    {REGION_LABELS[active.region]} · {active.built}
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
                    id: `wonder:${active.id}`,
                    type: 'wonder',
                    title: active.name,
                    subtitle: `${active.location} · ${active.built}`,
                    href: '#wonders',
                    region: active.region,
                  }}
                />
              )}
            </div>
            <DialogDescription className="text-base">
              {active?.shortDesc}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5">
              {/* Meta: location, builder, destroyed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {active && (
                  <>
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        Локация
                      </div>
                      <div className="text-sm font-medium">{active.location}</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Hammer className="h-3 w-3" />
                        Строитель
                      </div>
                      <div className="text-sm font-medium">{active.builder}</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Судьба
                      </div>
                      <div className="text-sm font-medium">{active.destroyed}</div>
                    </div>
                  </>
                )}
              </div>

              <p className="text-base leading-relaxed text-foreground/85">
                {active?.fullDesc}
              </p>

              {active && (
                <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
                  <div className="flex items-start gap-2">
                    <Crown className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                        Наследие
                      </p>
                      <p className="text-sm text-foreground/85 leading-relaxed italic">
                        {active.legacy}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  )
}
