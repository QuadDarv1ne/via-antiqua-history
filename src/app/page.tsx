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
import { greece, rome, mesopotamia, kuban } from '@/lib/history-data'

const PersonsSection = dynamic(() =>
  import('@/components/site/persons-section').then((m) => m.PersonsSection)
)
const WondersSection = dynamic(() =>
  import('@/components/site/wonders-section').then((m) => m.WondersSection)
)
const TimelineSection = dynamic(() =>
  import('@/components/site/timeline-section').then((m) => m.TimelineSection)
)
const MapSection = dynamic(() =>
  import('@/components/site/map-section').then((m) => m.MapSection)
)
const ComparisonSection = dynamic(() =>
  import('@/components/site/comparison-section').then((m) => m.ComparisonSection)
)
const AnalysisSection = dynamic(() =>
  import('@/components/site/analysis-section').then((m) => m.AnalysisSection)
)
const GlossarySection = dynamic(() =>
  import('@/components/site/glossary-section').then((m) => m.GlossarySection)
)
const OrdersSection = dynamic(() =>
  import('@/components/site/orders-section').then((m) => m.OrdersSection)
)
const EpochsSection = dynamic(() =>
  import('@/components/site/epochs-section').then((m) => m.EpochsSection)
)
const QuizSection = dynamic(() =>
  import('@/components/site/quiz-section').then((m) => m.QuizSection)
)
const SourcesSection = dynamic(() =>
  import('@/components/site/sources-section').then((m) => m.SourcesSection)
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
            <ContentGate title="Архитектурные ордера" subtitle="Дорийский, ионический и коринфский — система пропорций, определившая облик античной архитектуры.">
              <OrdersSection />
            </ContentGate>

            {/* Исторические эпохи */}
            <ContentGate title="Исторические эпохи" subtitle="Восемь ключевых эпох — от шумерских городов до падения Константинополя.">
              <EpochsSection />
            </ContentGate>

            {/* Интерактивная лента времени */}
            <TimelineSection />

            {/* Интерактивная карта */}
            <ContentGate title="Интерактивная карта" subtitle="Нажмите на город, чтобы узнать о нём больше. Используйте фильтры для подсветки регионов.">
              <MapSection />
            </ContentGate>

            {/* Сравнительная таблица цивилизаций */}
            <ContentGate title="Сравнение цивилизаций" subtitle="Сопоставление Древней Греции, Рима, Месопотамии и Кубани по восьми ключевым параметрам.">
              <ComparisonSection />
            </ContentGate>

            {/* Авторский раздел: исторический анализ */}
            <ContentGate title="Исторический анализ" subtitle="Авторские размышления о связях между цивилизациями и их влиянии на современный мир.">
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
