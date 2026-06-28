'use client'

import * as React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
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
            <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">{title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          </div>
          <div className="h-48 rounded-xl bg-muted/30 animate-pulse" />
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
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>

        <div className="relative rounded-xl border border-border bg-card overflow-hidden">
          <div className="blur-sm opacity-40 pointer-events-none h-48 overflow-hidden">
            {children}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </span>
            <p className="font-display text-xl font-semibold mb-2">
              Доступ только для авторизованных
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Войдите или зарегистрируйтесь, чтобы читать раздел «{title}»
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
