'use client'

import * as React from 'react'
import Link from 'next/link'
import { Lock, BookOpen, CreditCard, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/use-subscription'
import { SUBSCRIPTION_PRICE } from '@/lib/constants'

interface ContentGateProps {
  title: string
  subtitle: string
  children: React.ReactNode
  restricted?: boolean // Если true, требуется подписка, а не просто авторизация
}

export function ContentGate({
  title,
  subtitle,
  children,
  restricted = false,
}: ContentGateProps) {
  const { user, loading } = useAuth()
  const { hasSubscription, subscriptionLoading } = useSubscription()

  const isLoading = loading || (user && restricted && subscriptionLoading)

  if (isLoading) {
    return (
      <section className="py-20 md:py-28 scroll-mt-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-10 md:mb-14">
            <div className="h-0.5 w-12 rounded-full bg-primary/30 mb-4" />
            <div className="h-8 w-48 bg-muted/50 rounded mb-2" />
            <div className="h-5 w-96 bg-muted/30 rounded" />
          </div>
          <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </section>
    )
  }

  // Если нужна только авторизация и пользователь авторизован
  if (user && !restricted) {
    return <>{children}</>
  }

  // Если нужна подписка и она активна
  if (user && restricted && hasSubscription) {
    return <>{children}</>
  }

  return (
    <section className="py-20 md:py-28 scroll-mt-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 md:mb-14">
            <div className="h-0.5 w-12 rounded-full bg-primary/30 mb-4" />
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-semibold mb-3 sm:mb-4">{title}</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>

        <div className="relative rounded-xl border border-border bg-card overflow-hidden min-h-[420px] md:min-h-[480px]">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40" />
          <div className="blur-sm opacity-30 pointer-events-none overflow-hidden" aria-hidden="true">
            {children}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-card/70 via-card/85 to-card/95 backdrop-blur-[2px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
              {restricted ? <Crown className="h-7 w-7 text-primary" /> : <Lock className="h-7 w-7 text-primary" />}
            </span>
            <p className="font-display text-2xl md:text-3xl font-semibold mb-3 text-center px-4">
              {title}
            </p>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md text-center px-4">
              {restricted 
                ? 'Требуется активная подписка для доступа к этому разделу'
                : 'Войдите или зарегистрируйтесь, чтобы получить полный доступ'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 px-4 w-full max-w-xs sm:max-w-sm">
              {restricted ? (
                <>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-7 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium hover:from-amber-600 hover:to-yellow-600 transition-colors text-sm sm:text-base flex-1"
                  >
                    <CreditCard className="h-4 w-4" />
                    Оформить подписку
                  </Link>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Всего {SUBSCRIPTION_PRICE} ₽/мес • Полный доступ ко всем разделам
                  </p>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-7 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base flex-1"
                  >
                    <BookOpen className="h-4 w-4" />
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 sm:px-7 rounded-lg border border-border bg-card/60 font-medium hover:bg-accent/10 transition-colors text-sm sm:text-base flex-1"
                  >
                    Зарегистрироваться
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
