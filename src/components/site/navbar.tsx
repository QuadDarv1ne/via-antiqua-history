"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  Sun,
  Moon,
  Landmark,
  Search,
  User,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/site/search-dialog";
import { SITE_NAV, PUBLIC_NAV, PROTECTED_NAV } from "@/lib/constants";
import { useSectionProgress } from "@/hooks/use-section-progress";
import { Progress } from "@/components/ui/progress";

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { user, loading: authLoading } = useAuth();

  // Section progress tracking
  const SECTION_IDS = React.useMemo(
    () => [
      "greece",
      "rome",
      "mesopotamia",
      "kuban",
      "persons",
      "wonders",
      "orders",
      "epochs",
      "timeline",
      "map",
      "comparison",
      "analysis",
      "glossary",
      "quiz",
      "sources",
    ],
    [],
  );
  const { progressPercent } = useSectionProgress(SECTION_IDS);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    let rafId: number | null = null;
    let ticking = false;
    const sections = SITE_NAV.map((item) => item.href.substring(1));

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          setScrolled(window.scrollY > 16);

          const scrollPosition = window.scrollY + 120;

          for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i]);
            if (section && section.offsetTop <= scrollPosition) {
              setActiveSection(sections[i]);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = React.useCallback(
    (href: string) => {
      return activeSection === href.substring(1);
    },
    [activeSection],
  );

  const toggleTheme = React.useCallback(() => {
    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  }, [theme, setTheme]);

  const navLinks = user ? SITE_NAV : PUBLIC_NAV;
  const showLoginLink = !user;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            : "bg-background/50 backdrop-blur-md border-b border-transparent",
        )}
      >
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          {/* Row 1: Logo + Actions */}
          <div className="flex h-12 sm:h-14 items-center justify-between gap-2">
            <Link
              href="#top"
              className="flex items-center gap-2.5 group shrink-0"
            >
              <span className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/25 shrink-0">
                <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </span>
              <span className="font-display text-sm sm:text-base lg:text-lg font-semibold tracking-wide truncate hidden sm:inline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Исторический Лабиринт
              </span>
            </Link>

            {/* Индикатор прогресса изучения */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
                Изучено: {progressPercent}%
              </span>
              <Progress value={progressPercent} className="h-1.5 w-24" />
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative hover:bg-accent/60 transition-colors"
                onClick={() => setSearchOpen(true)}
                aria-label="Поиск (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <kbd className="absolute -bottom-0.5 right-0.5 hidden sm:inline-flex items-center justify-center px-1 py-0.5 text-[8px] leading-none rounded border border-border bg-muted/40 text-muted-foreground/50">
                  ⌘K
                </kbd>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8 hover:bg-accent/60 transition-colors"
                onClick={toggleTheme}
                aria-label="Переключить тему"
              >
                {mounted &&
                  (theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  ))}
              </Button>

              {/* Профиль / Вход */}
              {authLoading ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30 animate-pulse" />
              ) : user ? (
                <Link
                  href="/profile"
                  prefetch={false}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-all duration-200 shrink-0 hover:shadow-sm"
                  aria-label="Профиль"
                >
                  <User className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  prefetch={false}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors shrink-0"
                  aria-label="Войти"
                >
                  <User className="h-4 w-4" />
                </Link>
              )}

              {/* Мобильное меню */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden shrink-0 hover:bg-accent/60 transition-colors"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Закрыть меню" : "Меню"}
                aria-expanded={open}
              >
                {open ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Row 2: Navigation (desktop only) */}
          <nav
            className="hidden lg:flex items-center gap-x-0.5 flex-wrap justify-center pb-1.5 pt-px border-t border-border/20"
            aria-label="Основная навигация"
          >
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200 whitespace-nowrap",
                  isActive(item.href)
                    ? "text-foreground bg-accent/12 font-semibold shadow-sm"
                    : "text-foreground/55 hover:text-foreground/85 hover:bg-accent/5",
                )}
              >
                {item.label}
              </Link>
            ))}
            {showLoginLink && (
              <Link
                href="/login"
                prefetch={false}
                className="ml-1.5 px-3 py-1 text-[11px] font-medium rounded-md transition-all duration-200 whitespace-nowrap bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/15 hover:to-accent/15 border border-primary/20 hover:border-primary/30"
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Войти
                </span>
              </Link>
            )}
          </nav>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden animate-slide-down">
            <div className="container mx-auto max-w-7xl px-3 py-3 flex flex-col gap-0.5">
              <nav aria-label="Мобильная навигация">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-accent/10 text-foreground font-semibold"
                        : "hover:bg-accent/4 text-foreground/70",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {!user &&
                  PROTECTED_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium text-muted-foreground/60 hover:bg-accent/4 rounded-lg flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <Lock className="h-3 w-3 text-muted-foreground/40" />
                    </Link>
                  ))}
                {user && (
                  <Link
                    href="/profile"
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 text-sm font-medium hover:bg-accent/4 rounded-lg flex items-center gap-2"
                  >
                    <User className="h-4 w-4" /> Профиль
                  </Link>
                )}
              </nav>
              <div className="my-2 border-t border-border/30" />
              <div className="grid grid-cols-2 gap-1.5 px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-9 text-sm"
                  onClick={() => {
                    setSearchOpen(true);
                    setOpen(false);
                  }}
                >
                  <Search className="h-4 w-4" /> Поиск
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-9 text-sm"
                  onClick={toggleTheme}
                  aria-label={
                    theme === "dark"
                      ? "Переключить на светлую тему"
                      : "Переключить на тёмную тему"
                  }
                >
                  {mounted &&
                    (theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" /> Свет
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" /> Тёмный
                      </>
                    ))}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
