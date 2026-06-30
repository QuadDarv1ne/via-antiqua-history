'use client'

import * as React from 'react'
import { Navbar } from '@/components/site/navbar'
import { Hero } from '@/components/site/hero'
import { RegionSection } from '@/components/site/region-section'
import { PersonsSection } from '@/components/site/persons-section'
import { TimelineSection } from '@/components/site/timeline-section'
import { MapSection } from '@/components/site/map-section'
import { ComparisonSection } from '@/components/site/comparison-section'
import { AnalysisSection } from '@/components/site/analysis-section'
import { GlossarySection } from '@/components/site/glossary-section'
import { WondersSection } from '@/components/site/wonders-section'
import { OrdersSection } from '@/components/site/orders-section'
import { EpochsSection } from '@/components/site/epochs-section'
import { QuizSection } from '@/components/site/quiz-section'
import { SourcesSection } from '@/components/site/sources-section'
import { ContentGate } from '@/components/site/content-gate'
import { Footer } from '@/components/site/footer'
import { ScrollToTop } from '@/components/site/scroll-to-top'
import { ReadingProgress } from '@/components/site/reading-progress'
import { SectionDivider } from '@/components/site/section-divider'
import {
  BookmarksFloatingButton,
  BookmarksDialog,
} from '@/components/site/bookmarks'
import { greece, rome, mesopotamia, kuban } from '@/lib/history-data'

export default function Home() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-background font-body">
        <ReadingProgress />
        <Navbar />
        <main id="main-content" role="main" className="flex-1">
          <Hero />
          <SectionDivider />

          {/* Раздел: Древняя Греция */}
          <RegionSection region={greece} />
          <SectionDivider />

          {/* Раздел: Римская империя */}
          <RegionSection region={rome} restricted />

          {/* Раздел: Месопотамия */}
          <RegionSection region={mesopotamia} restricted />

          {/* Раздел: Кубань */}
          <RegionSection region={kuban} />

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
        </main>
        <Footer />
        <ScrollToTop />
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
