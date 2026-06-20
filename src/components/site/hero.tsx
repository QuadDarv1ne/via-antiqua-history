'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, BookOpen, Map as MapIcon, Sparkles, Landmark, Building2, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { allRegions, timeline, glossary, persons } from '@/lib/history-data'
import { useAnimatedCounter } from '@/hooks/use-animated-counter'
import { REGION_COLORS } from '@/lib/constants'

const regionChips = [
  { label: 'Греция', color: REGION_COLORS.greece },
  { label: 'Рим', color: REGION_COLORS.rome },
  { label: 'Месопотамия', color: REGION_COLORS.mesopotamia },
  { label: 'Кубань', color: REGION_COLORS.kuban },
]

export function Hero() {
  const citiesCount = allRegions.reduce(
    (acc, r) => acc + r.cities.length,
    0
  )
  const landmarksCount = allRegions.reduce(
    (acc, r) => acc + r.cities.reduce((a, c) => a + c.landmarks.length, 0),
    0
  )

  const stats = [
    { icon: <Building2 className="h-4 w-4" />, value: citiesCount, label: 'городов' },
    { icon: <Landmark className="h-4 w-4" />, value: landmarksCount, label: 'памятников' },
    { icon: <Calendar className="h-4 w-4" />, value: timeline.length, label: 'событий' },
    { icon: <Users className="h-4 w-4" />, value: persons.length, label: 'персоналий' },
  ]

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden parchment-bg"
    >
      {/* Декоративные круги / античная сетка */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.6 }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, oklch(0.7 0.13 60 / 0.22) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.2 }}
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, oklch(0.5 0.12 145 / 0.18) 0%, transparent 70%)',
          }}
        />
        {/* Тонкий меандр сверху и снизу */}
        <div className="absolute top-24 left-0 right-0 meander-border text-primary" />
        <div className="absolute bottom-24 left-0 right-0 meander-border text-primary" />
      </div>

      <div className="container mx-auto max-w-5xl px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Образовательный ресурс · Автор: Дуплей Максим Игоревич
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight tracking-tight">
            <span className="block">Исторический Лабиринт</span>
            <span className="block gold-text mt-2">
              От Эллады до Римских Пределов
            </span>
          </h1>

          <p className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed font-body">
            Интерактивная историческая энциклопедия античного мира — Древняя
            Греция, Римская империя, Месопотамия и Кубань как части единого
            культурно-экономического пространства. Города, памятники и авторский
            анализ того, как эти территории тысячелетиями были связаны общими
            торговыми путями, языком и культурой.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {regionChips.map((chip) => (
              <span
                key={chip.label}
                className="px-4 py-2 rounded-full text-sm font-medium border border-border bg-card/60 backdrop-blur-sm flex items-center gap-2"
                style={{ color: chip.color }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: chip.color }}
                />
                {chip.label}
              </span>
            ))}
          </div>

          {/* Статистика */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
          >
            {stats.map((s, i) => (
              <StatCard key={i} icon={s.icon} value={s.value} label={s.label} />
            ))}
          </motion.div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="#greece"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <BookOpen className="h-4 w-4" />
              Начать путешествие
            </Link>
            <Link
              href="#map"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-border bg-card/60 backdrop-blur-sm hover:bg-accent/10 transition-colors font-medium"
            >
              <MapIcon className="h-4 w-4" />
              Открыть карту
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-16 flex justify-center"
          >
            <ChevronDown className="h-6 w-6 text-muted-foreground animate-bounce" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  const animatedValue = useAnimatedCounter(value, 1400)
  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm px-3 py-3">
      <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
        {icon}
        <span className="font-display text-2xl md:text-3xl font-bold gold-text tabular-nums">
          {animatedValue}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
