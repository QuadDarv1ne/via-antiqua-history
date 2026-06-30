'use client'

import * as React from 'react'
import Link from 'next/link'
import { Lock, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function ContentGate({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="py-20 md:py-28 scroll-mt-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-10 md:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-semibold mb-3 sm:mb-4">{title}</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          </div>
          <div className="h-64 rounded-xl bg-muted/30 animate-pulse" />
        </div>
      </section>
    )
  }

  if (user) {
    return <>{children}</>
  }

  return (
    <section className="py-20 md:py-28 scroll-mt-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 md:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-semibold mb-3 sm:mb-4">{title}</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>

        <div className="relative rounded-xl border border-border bg-card overflow-hidden min-h-[420px] md:min-h-[480px]">
          <div className="blur-sm opacity-30 pointer-events-none overflow-hidden">
            {children}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-card/70 via-card/85 to-card/95 backdrop-blur-[2px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
              <Lock className="h-7 w-7 text-primary" />
            </span>
            <p className="font-display text-2xl md:text-3xl font-semibold mb-3 text-center px-4">
              {title}
            </p>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md text-center px-4">
              Войдите или зарегистрируйтесь, чтобы получить полный доступ к этому разделу
            </p>
            <div className="flex flex-col sm:flex-row gap-3 px-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-7 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base"
              >
                <BookOpen className="h-4 w-4" />
                Войти
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-7 rounded-lg border border-border bg-card/60 font-medium hover:bg-accent/10 transition-colors text-sm sm:text-base"
              >
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
