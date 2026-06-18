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
import { Footer } from '@/components/site/footer'
import { ScrollToTop } from '@/components/site/scroll-to-top'
import { ReadingProgress } from '@/components/site/reading-progress'
import {
  BookmarksProvider,
  BookmarksFloatingButton,
  BookmarksDialog,
} from '@/components/site/bookmarks'
import { greece, rome, mesopotamia, kuban } from '@/lib/history-data'

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "История Древнего Пути",
  "description": "Интерактивная историческая энциклопедия античного мира",
  "url": "https://via-antiqua-history.vercel.app",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "author": {
    "@type": "Person",
    "name": "Дуплей Максим Игоревич"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "RUB"
  }
};

export default function Home() {
  return (
    <BookmarksProvider>
      <div className="min-h-screen flex flex-col bg-background font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ReadingProgress />
        <Navbar />
        <main id="main-content" className="flex-1">
          <Hero />

          {/* Раздел: Древняя Греция */}
          <RegionSection region={greece} />

          {/* Раздел: Римская империя */}
          <RegionSection region={rome} />

          {/* Раздел: Месопотамия */}
          <RegionSection region={mesopotamia} />

          {/* Раздел: Кубань */}
          <RegionSection region={kuban} />

          {/* Ключевые персоналии */}
          <PersonsSection />

          {/* Семь чудес света */}
          <WondersSection />

          {/* Архитектурные ордера */}
          <OrdersSection />

          {/* Исторические эпохи */}
          <EpochsSection />

          {/* Интерактивная лента времени */}
          <TimelineSection />

          {/* Интерактивная карта */}
          <MapSection />

          {/* Сравнительная таблица цивилизаций */}
          <ComparisonSection />

          {/* Авторский раздел: исторический анализ */}
          <AnalysisSection />

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
    </BookmarksProvider>
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
