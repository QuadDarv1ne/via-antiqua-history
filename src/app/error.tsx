'use client'

import { useEffect } from 'react'

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
        <h1 className="font-display text-4xl font-semibold mb-4">
          Что-то пошло не так
        </h1>
        <p className="text-muted-foreground mb-6">
          Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </main>
  )
}
