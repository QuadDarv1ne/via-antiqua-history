'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Info } from 'lucide-react'
import { mapRegions } from '@/lib/history-data'
import { cn } from '@/lib/utils'
import { REGION_COLORS, REGION_LABELS } from '@/lib/constants'

type FilterKey = 'all' | 'greece' | 'rome' | 'mesopotamia' | 'kuban'

export function MapSection() {
  const [filter, setFilter] = React.useState<FilterKey>('all')
  const [hovered, setHovered] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<string | null>(null)

  const visibleRegions = mapRegions.filter(
    (r) => filter === 'all' || r.region === filter
  )

  const selectedRegion = mapRegions.find((r) => r.id === selected)

  return (
    <section
      id="map"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background: `linear-gradient(180deg, transparent 0%, oklch(0.5 0.05 60 / 0.04) 100%)`,
      }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              География античного мира
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">
            Интерактивная карта
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Нажмите на город, чтобы узнать о нём больше. Используйте фильтры
            ниже, чтобы подсветить отдельные регионы.
          </p>
        </motion.div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              filter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:border-primary/40'
            )}
          >
            Все регионы
          </button>
          {(['greece', 'rome', 'mesopotamia', 'kuban'] as const).map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2',
                filter === key
                  ? 'text-white border-transparent'
                  : 'bg-card border-border hover:border-primary/40'
              )}
              style={
                filter === key
                  ? { backgroundColor: REGION_COLORS[key] }
                  : { color: REGION_COLORS[key] }
              }
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    filter === key ? 'white' : REGION_COLORS[key],
                }}
              />
              {REGION_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Карта */}
          <div className="lg:col-span-8">
            <div
              className="relative aspect-[3/2] sm:aspect-[4/3] rounded-xl border border-border bg-card overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '5% 5%',
              }}
            >
              {/* Условная схема: море (фон) + суша (более тёмные блоки) */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 75"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Сухопутные «пятна» — очень условная схема Средиземноморья */}
                <path
                  d="M 30,30 Q 35,25 45,28 L 55,30 Q 60,32 62,38 L 64,42 Q 60,46 55,46 L 48,45 Q 42,44 38,42 L 32,38 Z"
                  fill="oklch(0.7 0.06 70 / 0.25)"
                  stroke="oklch(0.5 0.1 60 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Италия */}
                <path
                  d="M 46,40 L 49,38 L 50,46 L 48,52 L 47,52 L 48,46 L 47,42 Z"
                  fill="oklch(0.65 0.08 50 / 0.3)"
                  stroke="oklch(0.5 0.1 50 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Балканы/Греция */}
                <path
                  d="M 50,38 L 56,38 L 58,44 L 54,50 L 52,48 L 54,42 L 50,42 Z"
                  fill="oklch(0.65 0.08 60 / 0.3)"
                  stroke="oklch(0.5 0.1 60 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Малая Азия */}
                <path
                  d="M 58,40 L 68,38 L 70,44 L 64,46 L 60,44 Z"
                  fill="oklch(0.65 0.08 55 / 0.3)"
                  stroke="oklch(0.5 0.1 50 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Месопотамия */}
                <path
                  d="M 62,42 L 70,42 L 72,48 L 66,50 L 62,48 Z"
                  fill="oklch(0.65 0.08 50 / 0.3)"
                  stroke="oklch(0.5 0.1 45 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Крым / Кубань */}
                <path
                  d="M 58,32 Q 62,30 64,33 L 62,40 L 58,40 Z"
                  fill="oklch(0.65 0.08 145 / 0.3)"
                  stroke="oklch(0.5 0.1 145 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Крит */}
                <ellipse
                  cx="55"
                  cy="51"
                  rx="2"
                  ry="0.6"
                  fill="oklch(0.65 0.08 60 / 0.3)"
                  stroke="oklch(0.5 0.1 60 / 0.4)"
                  strokeWidth="0.2"
                />
                {/* Тонкая сетка-«параллели» */}
                {[15, 30, 45, 60].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="oklch(0.5 0.05 50 / 0.12)"
                    strokeWidth="0.1"
                    strokeDasharray="0.5,0.5"
                  />
                ))}
              </svg>

              {/* Точки городов */}
              {visibleRegions.map((r) => {
                const isSelected = selected === r.id
                const isHovered = hovered === r.id
                const color = REGION_COLORS[r.region]
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    onMouseEnter={() => setHovered(r.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="absolute group flex items-center justify-center"
                    style={{
                      left: `${r.x}%`,
                      top: `${r.y}%`,
                      width: '44px',
                      height: '44px',
                      transform: 'translate(-50%, -50%)',
                    }}
                    aria-label={r.name}
                  >
                    {/* Пульсация */}
                    <span
                      className="absolute rounded-full animate-ping opacity-40 pointer-events-none"
                      style={{
                        backgroundColor: color,
                        width: isSelected || isHovered ? '24px' : '16px',
                        height: isSelected || isHovered ? '24px' : '16px',
                      }}
                    />
                    <span
                      className="relative block rounded-full border-2 border-white shadow-md transition-all pointer-events-none"
                      style={{
                        backgroundColor: color,
                        width: isSelected || isHovered ? '16px' : '11px',
                        height: isSelected || isHovered ? '16px' : '11px',
                      }}
                    />
                    {/* Подпись */}
                    <span
                      className={cn(
                        'absolute left-1/2 -translate-x-1/2 top-full mt-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] sm:text-xs font-medium transition-opacity pointer-events-none',
                        isHovered || isSelected
                          ? 'opacity-100'
                          : 'opacity-70 group-hover:opacity-100'
                      )}
                      style={{
                        backgroundColor: 'oklch(1 0 0 / 0.85)',
                        color: 'oklch(0.2 0 0)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {r.name}
                    </span>
                  </button>
                )
              })}

              {/* Подписи регионов */}
              <div className="absolute top-3 left-3 text-[11px] sm:text-xs text-muted-foreground italic font-body leading-tight">
                Схематическая карта античного мира
              </div>
              <div className="absolute bottom-3 right-3 text-[11px] sm:text-xs text-muted-foreground italic leading-tight">
                Концептуальная схема
              </div>
            </div>
          </div>

          {/* Информация о выбранном городе */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-6 h-full">
              <AnimatePresence mode="wait">
                {selectedRegion ? (
                  <motion.div
                    key={selectedRegion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            REGION_COLORS[selectedRegion.region],
                        }}
                      />
                      <span
                        className="text-xs uppercase tracking-widest font-medium"
                        style={{
                          color: REGION_COLORS[selectedRegion.region],
                        }}
                      >
                        {REGION_LABELS[selectedRegion.region]}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-2">
                      {selectedRegion.name}
                    </h3>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      {selectedRegion.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" /> Сбросить
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Нажмите на точку города, чтобы увидеть его описание
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
