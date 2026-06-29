'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, BookOpen, Map as MapIcon, Landmark, Building2, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { allRegions, timeline, persons } from '@/lib/history-data'
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
    { icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, value: citiesCount, label: 'городов' },
    { icon: <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, value: landmarksCount, label: 'памятников' },
    { icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, value: timeline.length, label: 'событий' },
    { icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, value: persons.length, label: 'персоналий' },
  ]

  return (
    <section
      id="top"
      className="relative overflow-hidden parchment-bg"
    >
      {/* Декоративные круги */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1.6 }}
          className="absolute -top-40 -left-40 h-64 w-64 sm:h-80 sm:w-80 md:h-[28rem] md:w-[28rem] rounded-full"
          style={{
            background:
              'radial-gradient(circle, oklch(0.7 0.13 60 / 0.15) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.2 }}
          className="absolute -bottom-40 -right-40 h-64 w-64 sm:h-80 sm:w-80 md:h-[28rem] md:w-[28rem] rounded-full"
          style={{
            background:
              'radial-gradient(circle, oklch(0.5 0.12 145 / 0.12) 0%, transparent 70%)',
          }}
        />
        {/* Нижний разделитель */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-4 pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14 md:pb-18">
        {/* Автор — компактная полоса */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 sm:mb-7"
        >
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm">
            <img
              src="/img/dupley_maxim.jpg"
              alt="Дуплей Максим Игоревич"
              width={28}
              height={28}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-primary/15 shrink-0"
            />
            <span className="text-[11px] sm:text-xs font-medium text-foreground/70">
              Дуплей М.И.
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/70">
              Образовательный ресурс
            </span>
          </div>
        </motion.div>

        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.08] tracking-tight">
            <span className="block">Исторический Лабиринт</span>
            <span className="block gold-text mt-1.5 sm:mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-normal">
              От Эллады до Римских Пределов
            </span>
          </h1>
        </motion.div>

        {/* Описание */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base md:text-[17px] text-muted-foreground leading-relaxed font-body"
        >
          Интерактивная историческая энциклопедия античного мира — Древняя
          Греция, Римская империя, Месопотамия и Кубань как части единого
          культурно-экономического пространства.
        </motion.p>

        {/* Регионы + статистика + кнопки */}
        <div className="mt-5 sm:mt-7 flex flex-col gap-4 sm:gap-5">
          {/* Чипсы регионов */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap gap-1.5 sm:gap-2"
          >
            {regionChips.map((chip, i) => {
              const sectionIds = ['#greece', '#rome', '#mesopotamia', '#kuban']
              return (
                <Link
                  key={chip.label}
                  href={sectionIds[i]}
                  className="group px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border border-border/60 bg-card/40 backdrop-blur-sm flex items-center gap-1.5 hover:border-primary/30 hover:bg-card/70 transition-all duration-200"
                  style={{ color: chip.color }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 sm:h-[6px] sm:w-[6px] rounded-full transition-transform group-hover:scale-125"
                    style={{ backgroundColor: chip.color }}
                  />
                  {chip.label}
                </Link>
              )
            })}
          </motion.div>

          {/* Статистика + кнопки */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {stats.map((s, i) => (
                <StatCard key={i} icon={s.icon} value={s.value} label={s.label} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 sm:ml-auto shrink-0">
              <Link
                href="#greece"
                className="group inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium text-[13px] sm:text-sm shadow-sm shadow-primary/20"
              >
                <BookOpen className="h-3.5 w-3.5 transition-transform group-hover:-rotate-6" />
                Начать путешествие
              </Link>
              <Link
                href="#map"
                className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/70 hover:border-border transition-all duration-200 font-medium text-[13px] sm:text-sm"
              >
                <MapIcon className="h-3.5 w-3.5" />
                Открыть карту
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Скролл вниз */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 sm:mt-12 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/40" aria-hidden="true" />
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
    <div className="rounded-lg border border-border/50 bg-card/35 backdrop-blur-sm px-2 sm:px-2.5 py-1.5 sm:py-2">
      <div className="flex items-center justify-center gap-1 text-primary/80 mb-px">
        {icon}
        <span className="font-display text-base sm:text-lg md:text-xl font-bold gold-text tabular-nums">
          {animatedValue}
        </span>
      </div>
      <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 text-center">{label}</div>
    </div>
  )
}
