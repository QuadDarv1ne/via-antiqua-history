"use client";

import * as React from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { RegionSection } from "@/components/site/region-section";
import { ContentGate } from "@/components/site/content-gate";
import { Footer } from "@/components/site/footer";
import { ReadingProgress } from "@/components/site/reading-progress";
import { SectionDivider } from "@/components/site/section-divider";
import {
  BookmarksFloatingButton,
  BookmarksDialog,
} from "@/components/site/bookmarks";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CardSkeleton, GridSkeleton } from "@/components/ui/skeleton";
import type { Region } from "@/lib/history-data";

interface HeroStats {
  citiesCount: number;
  landmarksCount: number;
  eventsCount: number;
  personsCount: number;
}

interface HomePageClientProps {
  greece: Region;
  rome: Region;
  mesopotamia: Region;
  kuban: Region;
  heroStats: HeroStats;
}

function DynamicSectionSkeleton({
  variant = "card",
}: {
  variant?: "card" | "grid" | "full";
}) {
  if (variant === "grid") return <GridSkeleton count={3} />;
  if (variant === "full")
    return (
      <div className="py-20 md:py-28">
        <CardSkeleton lines={6} />
      </div>
    );
  return <CardSkeleton lines={4} />;
}

const PersonsSection = dynamic(
  () =>
    import("@/components/site/persons-section").then((m) => m.PersonsSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> },
);
const WondersSection = dynamic(
  () =>
    import("@/components/site/wonders-section").then((m) => m.WondersSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> },
);
const TimelineSection = dynamic(
  () =>
    import("@/components/site/timeline-section").then((m) => m.TimelineSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> },
);
const MapSection = dynamic(
  () => import("@/components/site/map-section").then((m) => m.MapSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> },
);
const ComparisonSection = dynamic(
  () =>
    import("@/components/site/comparison-section").then(
      (m) => m.ComparisonSection,
    ),
  { loading: () => <DynamicSectionSkeleton variant="full" /> },
);
const AnalysisSection = dynamic(
  () =>
    import("@/components/site/analysis-section").then((m) => m.AnalysisSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> },
);
const GlossarySection = dynamic(
  () =>
    import("@/components/site/glossary-section").then((m) => m.GlossarySection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> },
);
const OrdersSection = dynamic(
  () => import("@/components/site/orders-section").then((m) => m.OrdersSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> },
);
const EpochsSection = dynamic(
  () => import("@/components/site/epochs-section").then((m) => m.EpochsSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> },
);
const QuizSection = dynamic(
  () => import("@/components/site/quiz-section").then((m) => m.QuizSection),
  { loading: () => <DynamicSectionSkeleton variant="full" /> },
);
const SourcesSection = dynamic(
  () =>
    import("@/components/site/sources-section").then((m) => m.SourcesSection),
  { loading: () => <DynamicSectionSkeleton variant="grid" /> },
);

export default function HomePageClient({
  greece,
  rome,
  mesopotamia,
  kuban,
  heroStats,
}: HomePageClientProps) {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-background font-body">
        <ReadingProgress />
        <Navbar />
        <main id="main-content" role="main" className="flex-1">
          <ErrorBoundary>
            <Hero stats={heroStats} />
          </ErrorBoundary>
          <SectionDivider />

          {/* Раздел: Древняя Греция */}
          <ErrorBoundary>
            <RegionSection region={greece} />
          </ErrorBoundary>
          <SectionDivider />

          {/* Раздел: Римская империя */}
          <ErrorBoundary>
            <RegionSection region={rome} restricted />
          </ErrorBoundary>
          <SectionDivider />

          {/* Раздел: Месопотамия */}
          <ErrorBoundary>
            <RegionSection region={mesopotamia} restricted />
          </ErrorBoundary>
          <SectionDivider />

          {/* Раздел: Кубань */}
          <ErrorBoundary>
            <RegionSection region={kuban} />
          </ErrorBoundary>
          <SectionDivider />

          {/* Ключевые персоналии */}
          <ErrorBoundary>
            <Suspense fallback={<DynamicSectionSkeleton variant="grid" />}>
              <PersonsSection />
            </Suspense>
          </ErrorBoundary>

          {/* Семь чудес света */}
          <ErrorBoundary>
            <Suspense fallback={<DynamicSectionSkeleton variant="grid" />}>
              <WondersSection />
            </Suspense>
          </ErrorBoundary>

          {/* Архитектурные ордера */}
          <ErrorBoundary>
            <ContentGate
              title="Архитектурные ордера"
              subtitle="Дорийский, ионический и коринфский — система пропорций, определившая облик античной архитектуры."
              restricted
            >
              <Suspense fallback={<DynamicSectionSkeleton variant="grid" />}>
                <OrdersSection />
              </Suspense>
            </ContentGate>
          </ErrorBoundary>

          {/* Исторические эпохи */}
          <ErrorBoundary>
            <ContentGate
              title="Исторические эпохи"
              subtitle="Восемь ключевых эпох — от шумерских городов до падения Константинополя."
              restricted
            >
              <Suspense fallback={<DynamicSectionSkeleton variant="grid" />}>
                <EpochsSection />
              </Suspense>
            </ContentGate>
          </ErrorBoundary>

          {/* Интерактивная лента времени */}
          <ErrorBoundary>
            <ContentGate
              title="Интерактивная лента времени"
              subtitle="Хронология античных цивилизаций от Древнего Египта до поздней Римской империи."
              restricted
            >
              <Suspense fallback={<DynamicSectionSkeleton variant="full" />}>
                <TimelineSection />
              </Suspense>
            </ContentGate>
          </ErrorBoundary>

          {/* Интерактивная карта */}
          <ErrorBoundary>
            <ContentGate
              title="Интерактивная карта"
              subtitle="Нажмите на город, чтобы узнать о нём больше. Используйте фильтры для подсветки регионов."
              restricted
            >
              <Suspense fallback={<DynamicSectionSkeleton variant="full" />}>
                <MapSection />
              </Suspense>
            </ContentGate>
          </ErrorBoundary>

          {/* Сравнительная таблица цивилизаций */}
          <ErrorBoundary>
            <ContentGate
              title="Сравнение цивилизаций"
              subtitle="Сопоставление Древней Греции, Рима, Месопотамии и Кубани по восьми ключевым параметрам."
              restricted
            >
              <Suspense fallback={<DynamicSectionSkeleton variant="full" />}>
                <ComparisonSection />
              </Suspense>
            </ContentGate>
          </ErrorBoundary>

          {/* Авторский раздел: исторический анализ */}
          <ErrorBoundary>
            <ContentGate
              title="Исторический анализ"
              subtitle="Авторские размышления о связях между цивилизациями и их влиянии на современный мир."
              restricted
            >
              <Suspense fallback={<DynamicSectionSkeleton variant="full" />}>
                <AnalysisSection />
              </Suspense>
            </ContentGate>
          </ErrorBoundary>

          {/* Глоссарий ключевых терминов */}
          <ErrorBoundary>
            <Suspense fallback={<DynamicSectionSkeleton variant="grid" />}>
              <GlossarySection />
            </Suspense>
          </ErrorBoundary>

          {/* Интерактивный квиз */}
          <ErrorBoundary>
            <Suspense fallback={<DynamicSectionSkeleton variant="full" />}>
              <QuizSection />
            </Suspense>
          </ErrorBoundary>

          {/* Источники и ссылки */}
          <ErrorBoundary>
            <Suspense fallback={<DynamicSectionSkeleton variant="grid" />}>
              <SourcesSection />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
        <BookmarksFloatingButtonWithDialog />
      </div>
    </>
  );
}

function BookmarksFloatingButtonWithDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <BookmarksFloatingButton onClick={() => setOpen(true)} />
      <BookmarksDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
