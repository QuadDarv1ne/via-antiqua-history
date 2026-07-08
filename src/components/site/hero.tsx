"use client";

import * as React from "react";
import Image from "next/image";
import {
  ChevronDown,
  BookOpen,
  Map as MapIcon,
  Landmark,
  Building2,
  Calendar,
  Users,
} from "lucide-react";
import Link from "next/link";
import { REGION_COLORS } from "@/lib/constants";
import { ShareButton } from "@/components/site/share-button";

const regionChips = [
  { label: "Греция", color: REGION_COLORS.greece },
  { label: "Рим", color: REGION_COLORS.rome },
  { label: "Месопотамия", color: REGION_COLORS.mesopotamia },
  { label: "Кубань", color: REGION_COLORS.kuban },
];

const sectionIds = ["#greece", "#rome", "#mesopotamia", "#kuban"];

interface HeroStats {
  citiesCount: number;
  landmarksCount: number;
  eventsCount: number;
  personsCount: number;
}

export function Hero({ stats: heroStats }: { stats?: HeroStats }) {
  const stats = React.useMemo(
    () => [
      {
        icon: <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        value: heroStats?.citiesCount ?? 0,
        label: "городов",
      },
      {
        icon: <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        value: heroStats?.landmarksCount ?? 0,
        label: "памятников",
      },
      {
        icon: <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        value: heroStats?.eventsCount ?? 0,
        label: "событий",
      },
      {
        icon: <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
        value: heroStats?.personsCount ?? 0,
        label: "персоналий",
      },
    ],
    [heroStats],
  );

  return (
    <section id="top" className="relative overflow-hidden parchment-bg">
      {/* Бэкграунд-декорации */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Основное свечение слева вверху */}
        <div
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.13 60 / 0.18) 0%, transparent 70%)",
          }}
          className="absolute -top-48 -left-48 h-[30rem] w-[30rem] rounded-full blur-3xl animate-fade-scale"
        />
        {/* Дополнительное свечение справа снизу */}
        <div
          style={{
            background:
              "radial-gradient(circle, oklch(0.5 0.12 145 / 0.12) 0%, transparent 70%)",
          }}
          className="absolute -bottom-48 -right-48 h-[26rem] w-[26rem] rounded-full blur-3xl animate-fade-scale-delayed"
        />
        {/* Центральное мягкое свечение */}
        <div
          style={{
            background:
              "radial-gradient(circle, oklch(0.6 0.1 80) 0%, transparent 70%)",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[20rem] rounded-full blur-2xl opacity-[0.06]"
        />
        {/* Декоративные колонны (очень тонкие) */}
        <div className="absolute right-[8%] top-[15%] h-40 w-px bg-gradient-to-b from-transparent via-primary/5 to-transparent hidden md:block" />
        <div className="absolute right-[12%] top-[20%] h-32 w-px bg-gradient-to-b from-transparent via-primary/4 to-transparent hidden md:block" />
        <div className="absolute left-[5%] bottom-[20%] h-28 w-px bg-gradient-to-b from-transparent via-primary/4 to-transparent hidden lg:block" />
        {/* Нижний разделитель */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-4 pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14 md:pb-18">
        {/* Автор — компактная полоса */}
        <div className="mb-5 sm:mb-7 animate-fade-slide-down">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm">
            <Image
              src="/img/dupley_maxim.jpg"
              alt="Дуплей Максим Игоревич"
              width={28}
              height={28}
              priority
              className="rounded-full object-cover ring-2 ring-primary/15 shrink-0"
            />
            <span className="text-[11px] sm:text-xs font-medium text-foreground/70">
              Дуплей М.И.
            </span>
            <span className="text-border">·</span>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/70">
              Образовательный ресурс
            </span>
            <span className="text-border">·</span>
            <ShareButton title="Исторический Лабиринт — От Эллады до Римских Пределов" />
          </div>
        </div>

        {/* Заголовок */}
        <div className="animate-fade-slide-up">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.08] tracking-tight">
            <span className="block tracking-wide">Исторический Лабиринт</span>
            <span className="relative inline-block mt-1 sm:mt-1.5">
              <span className="block gold-text text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-normal">
                От Эллады до Римских Пределов
              </span>
              <span className="absolute -bottom-1.5 sm:-bottom-2 left-0 right-0 h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-full" />
            </span>
          </h1>
        </div>

        {/* Описание */}
        <p className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base md:text-[17px] text-muted-foreground leading-relaxed font-body animate-fade-slide-up-delayed">
          Интерактивная историческая энциклопедия античного мира — Древняя
          Греция, Римская империя, Месопотамия и Кубань как части единого
          культурно-экономического пространства.
        </p>

        {/* Регионы + статистика + кнопки */}
        <div className="mt-5 sm:mt-7 flex flex-col gap-4 sm:gap-5">
          {/* Чипсы регионов */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 animate-fade-slide-up-delayed-2">
            {regionChips.map((chip, i) => {
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
              );
            })}
          </div>

          {/* Статистика + кнопки */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 animate-fade-slide-up-delayed-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {stats.map((s, i) => (
                <StatCard
                  key={i}
                  icon={s.icon}
                  value={s.value}
                  label={s.label}
                />
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
          </div>
        </div>

        {/* Скролл вниз */}
        <div className="mt-10 sm:mt-12 flex justify-center animate-fade-opacity">
          <div className="animate-bounce-subtle">
            <ChevronDown
              className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/40"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (value <= 0) return;
    let start: number | null = null;
    const duration = 1400;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
    return () => {};
  }, [value]);

  return (
    <div className="rounded-lg border border-border/50 bg-card/40 backdrop-blur-sm px-2 sm:px-2.5 py-1.5 sm:py-2 text-center transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md">
      <div className="flex items-center justify-center gap-1 text-primary/80 mb-px">
        {icon}
        <span className="font-display text-base sm:text-lg md:text-xl font-bold gold-text tabular-nums">
          {displayValue}
        </span>
      </div>
      <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 text-center">
        {label}
      </div>
    </div>
  );
}
