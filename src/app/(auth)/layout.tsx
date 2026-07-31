import type { Metadata } from 'next'
import Link from 'next/link'
import { Landmark } from 'lucide-react'
import { SITE_FULL_NAME, SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE_FULL_NAME}`,
    default: `${SITE_FULL_NAME} — Интерактивный исторический лабиринт`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          <nav className="flex h-14 sm:h-16 items-center" aria-label="Навигация авторизации">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/25 shrink-0">
                <Landmark className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-sm sm:text-base font-semibold tracking-wide truncate hidden sm:inline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {SITE_NAME}
              </span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="pt-14 sm:pt-16" id="main-content">
        {children}
      </main>
    </div>
  )
}
