'use client'

import * as React from 'react'
import Link from 'next/link'
import { Landmark, Loader2, AlertCircle, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [code, setCode] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.ok) {
        setCode(json.data?.testCode || '')
        setSent(true)
      } else {
        setError(json.error || 'Ошибка')
      }
    } catch {
      setError('Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Письмо отправлено</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Если пользователь с email <strong className="text-foreground">{email}</strong> существует,
            мы отправили на него код для восстановления пароля. Проверьте почту.
          </p>
          {code && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Режим разработки — код сброса:</p>
              <p className="text-2xl font-bold tracking-widest text-primary">{code}</p>
            </div>
          )}
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Ввести код
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline underline-offset-2">Вернуться ко входу</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Восстановление пароля</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Введите email, привязанный к аккаунту
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Отправить код
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline underline-offset-2">Вернуться ко входу</Link>
        </p>
      </div>
    </main>
  )
}
