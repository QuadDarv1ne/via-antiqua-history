'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Что-то пошло не так
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Произошла непредвиденная ошибка. Возможно, это временный сбой — попробуйте
          обновить страницу или вернуться на главную.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Попробовать снова
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-border bg-card hover:bg-accent/10 transition-colors font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  )
}
