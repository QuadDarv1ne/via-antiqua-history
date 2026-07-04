'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/site/navbar'
import { Hero } from '@/components/site/hero'
import { RegionSection } from '@/components/site/region-section'
import { ContentGate } from '@/components/site/content-gate'
import { Footer } from '@/components/site/footer'
import { ReadingProgress } from '@/components/site/reading-progress'
import { SectionDivider } from '@/components/site/section-divider'
import {
  BookmarksFloatingButton,
  BookmarksDialog,
} from '@/components/site/bookmarks'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { CardSkeleton, GridSkeleton } from '@/components/ui/skeleton'

import { greece, rome, mesopotamia, kuban } from '@/lib/history-data'

// Skeleton loaders for dynamic sections
function DynamicSectionSkeleton({ variant = 'card' }: { variant?: 'card' | 'grid' | 'full' }) {
  if (variant === 'grid') return <GridSkeleton count={3} />
  if (variant === 'full') return <div className="py-20 md:py-28"><CardSkeleton lines={6} /></div>
  return <CardSkeleton lines={4} />
}

const PersonsSection = dynamic(() =>
  import('@/components/site/persons-section').then((m) => m.PersonsSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> }
)
const WondersSection = dynamic(() =>
  import('@/components/site/wonders-section').then((m) => m.WondersSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> }
)
const TimelineSection = dynamic(() =>
  import('@/components/site/timeline-section').then((m) => m.TimelineSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> }
)
const MapSection = dynamic(() =>
  import('@/components/site/map-section').then((m) => m.MapSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> }
)
const ComparisonSection = dynamic(() =>
  import('@/components/site/comparison-section').then((m) => m.ComparisonSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> }
)
const AnalysisSection = dynamic(() =>
  import('@/components/site/analysis-section').then((m) => m.AnalysisSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> }
)
const GlossarySection = dynamic(() =>
  import('@/components/site/glossary-section').then((m) => m.GlossarySection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> }
)
const OrdersSection = dynamic(() =>
  import('@/components/site/orders-section').then((m) => m.OrdersSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> }
)
const EpochsSection = dynamic(() =>
  import('@/components/site/epochs-section').then((m) => m.EpochsSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> }
)
const QuizSection = dynamic(() =>
  import('@/components/site/quiz-section').then((m) => m.QuizSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> }
)
const SourcesSection = dynamic(() =>
  import('@/components/site/sources-section').then((m) => m.SourcesSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> }
)

export default function Home() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-background font-body">
        <ReadingProgress />
        <Navbar />
        <main id="main-content" role="main" className="flex-1">
          <ErrorBoundary>
            <Hero />
            <SectionDivider />

            {/* Раздел: Древняя Греция */}
            <RegionSection region={greece} />
            <SectionDivider />

            {/* Раздел: Римская империя */}
            <RegionSection region={rome} restricted />
            <SectionDivider />

            {/* Раздел: Месопотамия */}
            <RegionSection region={mesopotamia} restricted />
            <SectionDivider />

            {/* Раздел: Кубань */}
            <RegionSection region={kuban} />
            <SectionDivider />

            {/* Ключевые персоналии */}
            <PersonsSection />

            {/* Семь чудес света */}
            <WondersSection />

            {/* Архитектурные ордера */}
            <ContentGate title="Архитектурные ордера" subtitle="Дорийский, ионический и коринфский — система пропорций, определившая облик античной архитектуры." restricted>
              <OrdersSection />
            </ContentGate>

            {/* Исторические эпохи */}
            <ContentGate title="Исторические эпохи" subtitle="Восемь ключевых эпох — от шумерских городов до падения Константинополя." restricted>
              <EpochsSection />
            </ContentGate>

            {/* Интерактивная лента времени */}
            <ContentGate title="Интерактивная лента времени" subtitle="Хронология античных цивилизаций от Древнего Египта до поздней Римской империи." restricted>
              <TimelineSection />
            </ContentGate>

            {/* Интерактивная карта */}
            <ContentGate title="Интерактивная карта" subtitle="Нажмите на город, чтобы узнать о нём больше. Используйте фильтры для подсветки регионов." restricted>
              <MapSection />
            </ContentGate>

            {/* Сравнительная таблица цивилизаций */}
            <ContentGate title="Сравнение цивилизаций" subtitle="Сопоставление Древней Греции, Рима, Месопотамии и Кубани по восьми ключевым параметрам." restricted>
              <ComparisonSection />
            </ContentGate>

            {/* Авторский раздел: исторический анализ */}
            <ContentGate title="Исторический анализ" subtitle="Авторские размышления о связях между цивилизациями и их влиянии на современный мир." restricted>
              <AnalysisSection />
            </ContentGate>

            {/* Глоссарий ключевых терминов */}
            <GlossarySection />

            {/* Интерактивный квиз */}
            <QuizSection />

            {/* Источники и ссылки */}
            <SourcesSection />
          </ErrorBoundary>
        </main>
        <Footer />
        <BookmarksFloatingButtonWithDialog />
      </div>
    </>
  )
}

// Обёртка для управления состоянием диалога закладок
function BookmarksFloatingButtonWithDialog() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <BookmarksFloatingButton onClick={() => setOpen(true)} />
      <BookmarksDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
