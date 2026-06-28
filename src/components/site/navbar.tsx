'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Menu, X, Sun, Moon, Landmark, Search, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchDialog } from '@/components/site/search-dialog'
import { SITE_NAV } from '@/lib/constants'

export function Navbar() {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const { user } = useAuth()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    let rafId: number | null = null
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          setScrolled(window.scrollY > 24)
          
          // Determine active section based on scroll position
          const sections = SITE_NAV.map(item => item.href.substring(1))
          const scrollPosition = window.scrollY + 100
          
          for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i])
            if (section && section.offsetTop <= scrollPosition) {
              setActiveSection(sections[i])
              break
            }
          }
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Global hotkeys: Ctrl/Cmd+K → search; Esc → close
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (href: string) => {
    const section = href.substring(1)
    return activeSection === section
  }

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-background/60 backdrop-blur-sm'
      )}
    >
      <div className="container mx-auto max-w-7xl px-3 sm:px-4">
        {/* Row 1: Logo + Actions */}
        <div className="flex h-12 sm:h-14 items-center justify-between gap-2">
          <Link href="#top" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-12 shrink-0">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="font-display text-base lg:text-lg font-semibold tracking-wide truncate hidden sm:inline">
              Исторический Лабиринт
            </span>
          </Link>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex h-8 w-8"
              onClick={() => setSearchOpen(true)}
              aria-label="Поиск"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex h-8 w-8"
              onClick={() => {
                if (theme === 'system') {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                  setTheme(prefersDark ? 'light' : 'dark')
                } else {
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                }
              }}
              aria-label="Переключить тему"
            >
              {mounted &&
                (theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                ))}
            </Button>
            <Link
              href={user ? '/profile' : '/login'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
              aria-label={user ? 'Профиль' : 'Войти'}
            >
              <User className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Меню"
              aria-expanded={open}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Row 2: Navigation (desktop only, wraps into rows) */}
        <div className="hidden lg:flex items-center gap-x-0.5 gap-y-0.5 flex-wrap justify-center pb-2 pt-0.5">
          {SITE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap",
                isActive(item.href)
                  ? "text-foreground bg-accent/10 font-semibold"
                  : "text-foreground/60 hover:text-foreground hover:bg-accent/10"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {open && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {SITE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-medium hover:bg-accent/10 rounded-md"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border my-1" />
            <div className="flex flex-col gap-1 px-3 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 sm:hidden"
                onClick={() => { setSearchOpen(true); setOpen(false) }}
              >
                <Search className="h-4 w-4" /> Поиск
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
              onClick={() => {
                if (theme === 'system') {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                  setTheme(prefersDark ? 'light' : 'dark')
                } else {
                  setTheme(theme === 'dark' ? 'light' : 'dark')
                }
              }}
              >
                {mounted && (theme === 'dark' ? <><Sun className="h-4 w-4" /> Светлая тема</> : <><Moon className="h-4 w-4" /> Тёмная тема</>)}
              </Button>
              <Link
                href={user ? '/profile' : '/login'}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/10"
              >
                <User className="h-4 w-4" /> {user ? 'Профиль' : 'Войти'}
              </Link>
            </div>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
