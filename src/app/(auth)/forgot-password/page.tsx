'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Landmark, Loader2, AlertCircle, MailCheck, Mail, KeyRound } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { validateEmail } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Укажите email')
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.ok) {
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

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  if (sent) {
    return (
      <ErrorBoundary>
        <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.07 }}
              transition={{ duration: 1.5 }}
              className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.7 0.13 70) 0%, transparent 70%)' }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm relative z-10"
          >
            <motion.div variants={item} className="text-center mb-7">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
                className="flex justify-center mb-5"
              >
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25">
                  <MailCheck className="h-7 w-7" />
                  <span className="absolute inset-0 rounded-2xl bg-white/10" />
                </span>
              </motion.div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Письмо отправлено
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Код восстановления отправлен на {email}
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-black/[0.03]"
            >
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <motion.div variants={item} className="text-center">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-sm shadow-primary/20"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Ввести код
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={item} className="mt-6 text-center">
              <Link href="/login" prefetch={false} className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors underline underline-offset-3">
                Вернуться ко входу
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.07 }}
            transition={{ duration: 1.5 }}
            className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, oklch(0.7 0.13 70) 0%, transparent 70%)' }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
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
          <motion.div variants={item} className="text-center mb-7">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <motion.span
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
              >
                <Landmark className="h-6 w-6" />
                <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              </motion.span>
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Восстановление пароля
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Введите email, привязанный к аккаунту
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-black/[0.03]"
          >
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  role="alert"
                  className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}

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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Отправить код
                </button>
              </motion.div>
            </form>
          </motion.div>

          <motion.div variants={item} className="mt-6 text-center">
            <Link href="/login" prefetch={false} className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors underline underline-offset-3">
              Вернуться ко входу
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </ErrorBoundary>
  )
}
