'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Landmark, Loader2, AlertCircle, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { validateEmail } from '@/lib/utils'
import { PasswordToggle } from '@/components/ui/password-toggle'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [totpCode, setTotpCode] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [require2fa, setRequire2fa] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Заполните все поля')
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)

    try {
      const result = await login(email, password, totpCode || undefined)
      if (result.require2fa && !totpCode) {
        setRequire2fa(true)
        return
      }
      if (result.ok) {
        router.push('/')
      } else {
        setError(result.error || 'Ошибка входа')
      }
    } catch {
      setError('Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Фоновые декорации */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, oklch(0.7 0.13 70) 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, oklch(0.6 0.12 145) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Логотип */}
        <motion.div variants={item} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
            <motion.span
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
            >
              <Landmark className="h-6 w-6" aria-hidden="true" />
              <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            </motion.span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {require2fa ? 'Двухфакторная аутентификация' : 'Добро пожаловать'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {require2fa
              ? 'Введите код из приложения-аутентификатора'
              : 'Войдите в свой аккаунт, чтобы продолжить'}
          </p>
        </motion.div>

        {/* Карточка формы */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-black/[0.03]"
        >
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                {error}
              </motion.div>
            )}

            {!require2fa ? (
              <>
                <motion.div variants={item}>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground/80">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/60 bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                </motion.div>
                <motion.div variants={item}>
                  <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground/80">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="current-password"
                      className="w-full h-11 px-4 pr-11 rounded-xl border border-border/60 bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                    />
                    <PasswordToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                    />
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div variants={item}>
                <label htmlFor="totp" className="block text-sm font-medium mb-2 text-foreground/80">
                  Код 2FA
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" aria-hidden="true" />
                  <input
                    id="totp"
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/60 bg-background/60 text-sm text-center text-lg tracking-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
                <p className="text-xs text-muted-foreground/60 mt-2 text-center">
                  Откройте приложение-аутентификатор и введите код
                </p>
              </motion.div>
            )}

            <motion.div variants={item}>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {require2fa ? 'Подтвердить' : 'Войти'}
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Ссылки */}
        <motion.div variants={item} className="mt-6 text-center space-y-2.5">
          {!require2fa ? (
            <>
              <Link
                href="/forgot-password"
                prefetch={false}
                className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors underline underline-offset-3"
              >
                Забыли пароль?
              </Link>
              <p className="text-sm text-muted-foreground/60">
                Нет аккаунта?{' '}
                <Link href="/register" prefetch={false} className="text-primary hover:text-primary/80 hover:underline underline-offset-3 font-medium transition-colors">
                  Зарегистрироваться
                </Link>
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setRequire2fa(false); setTotpCode(''); setError('') }}
              className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors underline underline-offset-3"
            >
              Назад ко входу
            </button>
          )}
        </motion.div>
      </motion.div>
    </main>
    </ErrorBoundary>
  )
}
