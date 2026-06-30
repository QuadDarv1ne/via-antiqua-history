'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Landmark, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { passwordStrength } from '@/lib/utils'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = React.useState(searchParams.get('email') || '')
  const [code, setCode] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const strength = React.useMemo(() => passwordStrength(password), [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      const json = await res.json()
      if (json.ok) {
        setDone(true)
      } else {
        setError(json.error || 'Ошибка')
      }
    } catch {
      setError('Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Пароль изменён</h1>
          <p className="text-sm text-muted-foreground mb-6">Теперь вы можете войти с новым паролем.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Войти
          </Link>
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
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Новый пароль</h1>
          <p className="text-sm text-muted-foreground mt-1">Введите код из письма и новый пароль</p>
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

          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1.5">Код из письма</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
              className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-center tracking-[8px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Новый пароль</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full h-11 px-4 pr-11 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">{strength.label}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить пароль
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline underline-offset-2">Вернуться ко входу</Link>
        </p>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
