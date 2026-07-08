"use client";

import * as React from "react";
import { MapPin, Calendar, Info, Lock } from "lucide-react";
import type { Region, Landmark } from "@/lib/history-data";
import { cn, withAlpha } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookmarkButton } from "@/components/site/bookmarks";
import { ShareButton } from "@/components/site/share-button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";

export function RegionSection({
  region,
  restricted,
}: {
  region: Region;
  restricted?: boolean;
}) {
  const regionIconMap = React.useMemo<Record<string, React.ReactNode>>(
    () => ({
      temple: <span className="text-xl">🏛️</span>,
      crown: <span className="text-xl">👑</span>,
      tablets: <span className="text-xl">📜</span>,
      amphora: <span className="text-xl">🏺</span>,
    }),
    [],
  );

  const [activeCityId, setActiveCityId] = React.useState(region.cities[0]?.id);
  const [activeLandmark, setActiveLandmark] = React.useState<Landmark | null>(
    null,
  );
  const activeCity =
    region.cities.find((c) => c.id === activeCityId) ?? region.cities[0];
  const { user } = useAuth();
  const { hasSubscription } = useSubscription(!!restricted);

  if (!region.cities.length) {
    return null;
  }

  return (
    <section
      id={region.id}
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background: `linear-gradient(180deg, transparent 0%, ${withAlpha(region.color, 0.04)} 50%, transparent 100%)`,
      }}
    >
      <div className="container mx-auto max-w-7xl px-4">
        {/* Заголовок региона */}
        <div className="mb-8 sm:mb-10 md:mb-14 animate-fade-slide-up">
          <div
            className="h-0.5 w-12 rounded-full mb-4 sm:mb-5"
            style={{ backgroundColor: region.color }}
          />
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <span
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg border border-border bg-card shrink-0"
              style={{ color: region.color }}
            >
              {regionIconMap[region.icon]}
            </span>
            <div className="min-w-0">
              <span
                className="text-[10px] sm:text-xs uppercase tracking-widest font-medium"
                style={{ color: region.color }}
              >
                Раздел
              </span>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight truncate">
                {region.name}
              </h2>
            </div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground italic font-body max-w-3xl">
            {region.tagline}
          </p>
        </div>

        {restricted && (!user || !hasSubscription) ? (
          <div className="relative rounded-xl border border-border bg-card overflow-hidden min-h-[360px] sm:min-h-[420px] md:min-h-[480px]">
            <div className="blur-[3px] opacity-25 pointer-events-none overflow-hidden">
              <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 p-5 sm:p-8">
                <div className="lg:col-span-3">
                  {region.cities.slice(0, 3).map((city) => (
                    <div
                      key={city.id}
                      className="px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-border bg-card/50 mb-2"
                    >
                      <div className="font-display text-sm sm:text-base font-semibold">
                        {city.name}
                      </div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        {city.era}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-9">
                  <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                    <div className="h-6 w-48 sm:w-56 bg-muted/50 rounded mb-3 sm:mb-4" />
                    <div className="h-3 sm:h-4 w-full bg-muted/30 rounded mb-1.5 sm:mb-2" />
                    <div className="h-3 sm:h-4 w-5/6 bg-muted/30 rounded mb-1.5 sm:mb-2" />
                    <div className="h-3 sm:h-4 w-3/4 bg-muted/30 rounded mb-4 sm:mb-6" />
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="h-20 sm:h-24 bg-muted/20 rounded-lg" />
                      <div className="h-20 sm:h-24 bg-muted/20 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-card/80 via-card/90 to-card/95 backdrop-blur-sm px-4">
              <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 mb-4 sm:mb-5">
                <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </span>
              <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 text-center">
                {region.name}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-5 sm:mb-6 max-w-sm text-center">
                Города, памятники и исторический контекст доступны
                авторизованным пользователям
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 sm:px-7 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 sm:px-7 rounded-lg border border-border bg-card/60 font-medium hover:bg-accent/10 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Зарегистрироваться
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Левая колонка: переключение городов */}
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-24 relative flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scroll pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                  <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent lg:hidden" />
                  <span className="hidden lg:block text-xs uppercase tracking-widest text-muted-foreground mb-3 shrink-0">
                    Города и памятники
                  </span>
                  {region.cities.map((city) => (
                    <button
                      type="button"
                      key={city.id}
                      onClick={() => setActiveCityId(city.id)}
                      aria-current={
                        activeCityId === city.id ? "true" : undefined
                      }
                      className={cn(
                        "text-left whitespace-nowrap lg:whitespace-normal pl-4 pr-3 py-3 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 shrink-0 lg:shrink relative overflow-hidden",
                        activeCityId === city.id
                          ? "bg-card border-primary shadow-sm"
                          : "bg-card/50 border-border hover:bg-card hover:border-primary/40",
                      )}
                    >
                      {activeCityId === city.id && (
                        <motion.span
                          layoutId={`activeCity-${region.id}`}
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                          style={{ backgroundColor: region.color }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                      <div className="font-display text-base font-semibold">
                        {city.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {city.era}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

          {/* Правая колонка: контент активного города */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCityId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 md:p-6 lg:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold leading-tight">
                        {activeCity.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {activeCity.region}
                        </span>
                        {activeCity.modernName && (
                          <span className="flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" />
                            Совр. {activeCity.modernName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {activeCity.era}
                        </span>
                      </div>
                    </div>
                    <BookmarkButton
                      item={{
                        id: `city:${activeCity.id}`,
                        type: "city",
                        title: activeCity.name,
                        subtitle: `${activeCity.region} — ${activeCity.era}`,
                        href: `#${region.id}`,
                        region: region.id,
                      }}
                    />
                  </div>

                      <div className="relative mb-5 sm:mb-7">
                        <span
                          className="absolute -top-1 -left-1 text-3xl sm:text-4xl leading-none select-none"
                          style={{ color: withAlpha(region.color, 0.2) }}
                        >
                          &ldquo;
                        </span>
                        <p
                          className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground/90 italic border-l-[3px] sm:border-l-4 pl-4 sm:pl-5 ml-0.5"
                          style={{ borderColor: region.color }}
                        >
                          {activeCity.summary}
                        </p>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {activeCity.description.map((para, i) => (
                          <p
                            key={i}
                            className="text-sm sm:text-base leading-relaxed text-foreground/85"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Достопримечательности */}
                    <div className="mt-10 sm:mt-12">
                      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                        <span
                          className="inline-block h-[3px] w-6 sm:w-8 rounded-full"
                          style={{ backgroundColor: region.color }}
                        />
                        <h4 className="font-display text-lg sm:text-xl md:text-2xl font-semibold">
                          Главные достопримечательности
                        </h4>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        {activeCity.landmarks.map((lm, i) => (
                          <motion.button
                            key={lm.id}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ duration: 0.35, delay: i * 0.06 }}
                            whileHover={{ y: -3, scale: 1.01 }}
                            onClick={() => setActiveLandmark(lm)}
                            className="group text-left p-4 sm:p-5 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                              <h5 className="font-display text-base sm:text-lg font-semibold leading-tight group-hover:text-primary transition-colors duration-200">
                                {lm.name}
                              </h5>
                              <Badge
                                variant="secondary"
                                className="shrink-0 text-[10px] sm:text-xs transition-colors duration-200"
                                style={{
                                  backgroundColor: withAlpha(
                                    region.color,
                                    0.15,
                                  ),
                                  color: region.color,
                                }}
                              >
                                {lm.period}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {lm.shortDesc}
                            </p>
                            <span className="mt-2 sm:mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                              Подробнее →
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Описание региона в конце */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-10 sm:mt-12 md:mt-16"
            >
              <div
                className="h-px w-16 mb-4 sm:mb-5 rounded-full"
                style={{ backgroundColor: region.color }}
              />
              <h4 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">
                Исторический контекст
              </h4>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed text-foreground/85">
                {region.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Модальное окно достопримечательности */}
      <Dialog
        open={!!activeLandmark}
        onOpenChange={(o) => !o && setActiveLandmark(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh]">
          <div
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
            style={{ backgroundColor: region.color }}
          />
          <DialogHeader className="pb-2 sm:pb-3 pt-1">
            <div className="flex items-start justify-between gap-2 sm:gap-3 pr-8">
              <div className="min-w-0 flex-1">
                <Badge
                  variant="secondary"
                  className="mb-2 text-[10px] sm:text-xs"
                  style={{
                    backgroundColor: withAlpha(region.color, 0.15),
                    color: region.color,
                  }}
                >
                  {activeLandmark?.period}
                </Badge>
                <DialogTitle className="font-display text-xl sm:text-2xl md:text-3xl leading-tight">
                  {activeLandmark?.name}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {activeLandmark && (
                  <ShareButton
                    title={activeLandmark.name}
                    href={`#${region.id}`}
                  />
                )}
                {activeLandmark && (
                  <BookmarkButton
                    item={{
                      id: `landmark:${activeLandmark.id}`,
                      type: "landmark",
                      title: activeLandmark.name,
                      subtitle: `${activeCity.name} — ${activeLandmark.period}`,
                      href: `#${region.id}`,
                      region: region.id,
                    }}
                  />
                )}
              </div>
            </div>
            <DialogDescription className="text-xs sm:text-base">
              {activeLandmark?.shortDesc}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] sm:max-h-[60vh] pr-3 sm:pr-4">
            <div className="space-y-4 sm:space-y-5">
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                {activeLandmark?.fullDesc}
              </p>

              <div>
                <h5 className="font-display text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <span
                    className="inline-block h-1 w-5 sm:w-6 rounded-full"
                    style={{ backgroundColor: region.color }}
                  />
                  Ключевые особенности
                </h5>
                <ul className="space-y-1.5 sm:space-y-2">
                  {activeLandmark?.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed"
                    >
                      <span
                        className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="text-foreground/85">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  );
}
