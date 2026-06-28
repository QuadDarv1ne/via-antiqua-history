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
  BookmarksFloatingButton,
  BookmarksDialog,
} from '@/components/site/bookmarks'
import { greece, rome, mesopotamia, kuban } from '@/lib/history-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://via-antiqua-history.vercel.app'

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "История Древнего Пути",
      "description": "Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань как единое культурное пространство.",
      "url": siteUrl,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript",
      "author": {
        "@type": "Person",
        "name": "Дуплей Максим Игоревич"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "RUB"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "{search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebSite",
      "name": "История Древнего Пути",
      "url": siteUrl,
      "description": "Интерактивный исторический лабиринт античного мира",
      "publisher": {
        "@type": "Person",
        "name": "Дуплей Максим Игоревич"
      },
      "inLanguage": "ru"
    },
    {
      "@type": "EducationalOrganization",
      "name": "История Древнего Пути",
      "description": "Образовательный проект об античных цивилизациях",
      "url": siteUrl,
      "knowsAbout": [
        "Древняя Греция",
        "Римская империя",
        "Месопотамия",
        "Боспорское царство",
        "Античность",
        "Классическая археология"
      ]
    }
  ]
};

export default function Home() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-background font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ReadingProgress />
        <Navbar />
        <main id="main-content" role="main" className="flex-1">
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
