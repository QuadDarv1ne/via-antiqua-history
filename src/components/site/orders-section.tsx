'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Columns3 } from 'lucide-react'
import { architecturalOrders, type ArchitecturalOrder } from '@/lib/history-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookmarkButton } from '@/components/site/bookmarks'

// SVG-схемы капителей для каждого ордера
function DoricCapital() {
  return (
    <svg viewBox="0 0 80 50" className="w-full h-20 sm:h-28 md:h-32" preserveAspectRatio="xMidYMid meet">
      {/* Абака — квадратная плита */}
      <rect x="10" y="5" width="60" height="10" fill="currentColor" opacity="0.85" />
      {/* Эхин — круглая подушка */}
      <ellipse cx="40" cy="20" rx="28" ry="6" fill="currentColor" opacity="0.7" />
      {/* Шейка колонны */}
      <rect x="20" y="26" width="40" height="20" fill="currentColor" opacity="0.4" />
      {/* Каннелюры (3 видимые) */}
      <line x1="30" y1="26" x2="30" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="40" y1="26" x2="40" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="50" y1="26" x2="50" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

function IonicCapital() {
  return (
    <svg viewBox="0 0 80 50" className="w-full h-20 sm:h-28 md:h-32" preserveAspectRatio="xMidYMid meet">
      {/* Абака */}
      <rect x="5" y="8" width="70" height="6" fill="currentColor" opacity="0.85" />
      {/* Левая волюта */}
      <circle cx="14" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="20" r="1.5" fill="currentColor" />
      {/* Правая волюта */}
      <circle cx="66" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="66" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="66" cy="20" r="1.5" fill="currentColor" />
      {/* Центральная декорация */}
      <path d="M 25 16 Q 40 8 55 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Шейка колонны */}
      <rect x="10" y="30" width="60" height="20" fill="currentColor" opacity="0.4" />
      {/* Каннелюры */}
      <line x1="20" y1="30" x2="20" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="30" y1="30" x2="30" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="40" y1="30" x2="40" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="50" y1="30" x2="50" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="60" y1="30" x2="60" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

function CorinthianCapital() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-20 sm:h-28 md:h-32" preserveAspectRatio="xMidYMid meet">
      {/* Абака */}
      <rect x="3" y="5" width="74" height="6" fill="currentColor" opacity="0.85" />
      {/* Маленькие волюты в углах */}
      <circle cx="10" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="70" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Колоколообразное тело капители */}
      <path
        d="M 8 11 L 12 22 Q 14 28 18 30 L 62 30 Q 66 28 68 22 L 72 11 Z"
        fill="currentColor"
        opacity="0.6"
      />
      {/* Листья аканта (схематично) */}
      <path
        d="M 18 30 Q 16 24 20 18 M 24 30 Q 22 22 26 16 M 30 30 Q 28 24 32 18 M 40 30 Q 38 24 42 18 M 50 30 Q 48 24 52 18 M 58 30 Q 56 22 60 16 M 64 30 Q 62 24 66 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Шейка колонны */}
      <rect x="15" y="30" width="50" height="22" fill="currentColor" opacity="0.4" />
      {/* Каннелюры */}
      <line x1="22" y1="30" x2="22" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="32" y1="30" x2="32" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="42" y1="30" x2="42" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="52" y1="30" x2="52" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="62" y1="30" x2="62" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

function Capital({ id }: { id: string }) {
  if (id === 'doric') return <DoricCapital />
  if (id === 'ionic') return <IonicCapital />
  return <CorinthianCapital />
}

export function OrdersSection() {
  const [active, setActive] = React.useState<ArchitecturalOrder | null>(null)

  return (
    <section
      id="orders"
      className="py-20 md:py-28 scroll-mt-20"
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
            <Columns3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Архитектура
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Три архитектурных ордера
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Дорийский, ионический и коринфский — система пропорций и деталей,
            определившая облик античной архитектуры и всю европейскую традицию
            после.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {architecturalOrders.map((order, idx) => {
            const accentColor = ['oklch(0.55 0.13 35)', 'oklch(0.55 0.13 70)', 'oklch(0.6 0.1 50)'][idx]
            return (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => setActive(order)}
                className="text-left p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all flex flex-col"
              >
                <h3 className="font-display text-xl font-semibold mb-1">
                  {order.name}
                </h3>
                <p className="text-xs text-muted-foreground italic font-body mb-4">
                  {order.originalName}
                </p>

                {/* SVG-схема капители */}
                <div
                  className="mb-4 rounded-md bg-muted/30 p-4 flex items-center justify-center"
                  style={{ color: accentColor }}
                >
                  <Capital id={order.id} />
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed mb-3 flex-1">
                  {order.shortDesc}
                </p>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Период:</span>{' '}
                    {order.period}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Происхождение:</span>{' '}
                    {order.origin}
                  </p>
                </div>

                <span
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: accentColor }}
                >
                  Все характеристики →
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Модальное окно с деталями ордера */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <DialogTitle className="font-display text-2xl md:text-3xl">
                  {active?.name}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {active?.originalName} · {active?.period}
                </DialogDescription>
              </div>
              {active && (
                <BookmarkButton
                  item={{
                    id: `order:${active.id}`,
                    type: 'term',
                    title: active.name,
                    subtitle: `${active.originalName} · ${active.period}`,
                    href: '#orders',
                    region: 'general',
                  }}
                />
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5">
              {/* Большая схема капители */}
              {active && (
                <div
                  className="rounded-lg bg-muted/30 p-6 flex items-center justify-center"
                  style={{ color: 'oklch(0.5 0.12 50)' }}
                >
                  <div className="w-full max-w-md">
                    <Capital id={active.id} />
                  </div>
                </div>
              )}

              <p className="text-base leading-relaxed text-foreground/90">
                {active?.shortDesc}
              </p>
              <p className="text-base leading-relaxed text-foreground/85">
                {active?.visualDescription}
              </p>

              {active && (
                <>
                  <div>
                    <h5 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="inline-block h-1 w-6 rounded-full bg-primary" />
                      Характеристики
                    </h5>
                    <ul className="space-y-2">
                      {active.characteristics.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-foreground/85">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="inline-block h-1 w-6 rounded-full bg-primary" />
                      Образцы
                    </h5>
                    <ul className="space-y-2">
                      {active.examples.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-foreground/85">{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  )
}
