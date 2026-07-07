'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ShieldOff, LogOut, Loader2, Copy, Check, Smartphone, Bookmark, AlertTriangle, Crown, CreditCard, QrCode, Clock, CheckCircle2, XCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/components/site/bookmarks'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { passwordStrength, validatePassword } from '@/lib/utils'
import { SUBSCRIPTION_PRICE } from '@/lib/constants'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, logout, refresh } = useAuth()
  const { bookmarks } = useBookmarks()
  const [qrCode, setQrCode] = React.useState('')
  const [totpCode, setTotpCode] = React.useState('')
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([])
  const [showRecovery, setShowRecovery] = React.useState(false)
  const [setupLoading, setSetupLoading] = React.useState(false)
  const [confirmLoading, setConfirmLoading] = React.useState(false)
  const [disableLoading, setDisableLoading] = React.useState(false)
  const [confirmDisable, setConfirmDisable] = React.useState(false)
  const [error2fa, setError2fa] = React.useState('')
  const [copiedIdx, setCopiedIdx] = React.useState(-1)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [totpPassword, setTotpPassword] = React.useState('')

  // Subscription state
  const [subscription, setSubscription] = React.useState<{
    id: string
    status: string
    amount: number
    startedAt: string
    expiresAt: string
    daysLeft: number
  } | null>(null)
  const [subLoading, setSubLoading] = React.useState(true)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [paymentData, setPaymentData] = React.useState<{
    paymentId: string
    amount: number
    phone: string
    qrCodeUrl: string
    qrData: string
    expiresAt: string
  } | null>(null)

  const [cancelLoading, setCancelLoading] = React.useState(false)
  const [confirmCancel, setConfirmCancel] = React.useState(false)
  const [errorSub, setErrorSub] = React.useState('')

  // Change password state
  const [showChangePassword, setShowChangePassword] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('')
  const [changePasswordLoading, setChangePasswordLoading] = React.useState(false)
  const [changePasswordError, setChangePasswordError] = React.useState('')
  const [changePasswordSuccess, setChangePasswordSuccess] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)

  const newPwStrength = React.useMemo(() => passwordStrength(newPassword), [newPassword])

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load subscription status
  React.useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadSub() {
      try {
        const res = await fetch('/api/subscription/status')
        const json = await res.json()
        if (json.ok && !cancelled) {
          setSubscription(json.data)
        }
      } catch {
        // Network error — silently ignore
      } finally {
        if (!cancelled) setSubLoading(false)
      }
    }

    loadSub()
    return () => { cancelled = true }
  }, [user])

  // Poll for payment confirmation (stops after 15 min to match payment expiry)
  React.useEffect(() => {
    if (!paymentData) return
    const startedAt = Date.now()
    const POLL_INTERVAL = 5000
    const MAX_DURATION = 15 * 60 * 1000

    const interval: ReturnType<typeof setInterval> = setInterval(async () => {
      if (Date.now() - startedAt > MAX_DURATION) {
        clearInterval(interval)
        setPaymentData(null)
        setErrorSub('Время оплаты истекло. Создайте новый платёж.')
        return
      }
      try {
        const res = await fetch('/api/subscription/status')
        const json = await res.json()
        if (json.ok && json.data) {
          setSubscription(json.data)
          setPaymentData(null)
          clearInterval(interval)
        }
      } catch {
        // Ignore polling errors
      }
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [paymentData])

  const handleCreateSubscription = async () => {
    setErrorSub('')
    setCreateLoading(true)
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.ok) {
        setPaymentData(json.data)
      } else {
        setErrorSub(json.error || 'Ошибка создания подписки')
      }
    } catch {
      setErrorSub('Ошибка при создании подписки')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        setSubscription(null)
        setConfirmCancel(false)
        refresh()
      } else {
        setErrorSub(json.error || 'Ошибка отмены')
      }
    } catch {
      setErrorSub('Ошибка при отмене подписки')
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!user) return null

  const handleSetup2fa = async () => {
    setError2fa('')
    setSetupLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup')
      const json = await res.json()
      if (json.ok) {
        setQrCode(json.data.qrCode)
      } else {
        setError2fa(json.error || 'Ошибка')
      }
    } catch {
      setError2fa('Ошибка при настройке 2FA')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleConfirm2fa = async () => {
    setError2fa('')
    setConfirmLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode, password: totpPassword }),
      })
      const json = await res.json()
      if (json.ok) {
        setRecoveryCodes(json.data.recoveryCodes)
        setShowRecovery(true)
        setQrCode('')
        setTotpCode('')
        setTotpPassword('')
        await refresh()
      } else {
        setError2fa(json.error || 'Неверный код')
      }
    } catch {
      setError2fa('Ошибка при подтверждении 2FA')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleDisable2fa = async () => {
    setError2fa('')
    setDisableLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: totpPassword }),
      })
      const json = await res.json()
      if (json.ok) {
        setConfirmDisable(false)
        setTotpPassword('')
        await refresh()
      } else {
        setError2fa(json.error || 'Ошибка')
      }
    } catch {
      setError2fa('Ошибка при отключении 2FA')
    } finally {
      setDisableLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      router.push('/login')
    }
  }

  const handleChangePassword = async () => {
    setChangePasswordError('')
    setChangePasswordSuccess(false)

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError('Заполните все поля')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setChangePasswordError(passwordError)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('Новые пароли не совпадают')
      return
    }

    if (currentPassword === newPassword) {
      setChangePasswordError('Новый пароль должен отличаться от текущего')
      return
    }

    setChangePasswordLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if (json.ok) {
        setChangePasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setShowChangePassword(false)
        setTimeout(() => setChangePasswordSuccess(false), 3000)
      } else {
        setChangePasswordError(json.error || 'Ошибка')
      }
    } catch {
      setChangePasswordError('Ошибка при смене пароля')
    } finally {
      setChangePasswordLoading(false)
    }
  }

  const copyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      window.prompt('Скопируйте код вручную:', code)
      return
    }
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(-1), 2000)
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          ← На главную
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-lg sm:text-xl font-semibold border border-border shrink-0">
            {(user.name || 'П')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold truncate">{user.name || 'Пользователь'}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="space-y-6"
        >
          {/* Секция подписки */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            className="relative rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                <h2 className="font-display text-base sm:text-lg font-semibold truncate">Подписка «Исторический Лабиринт»</h2>
              </div>
              {subscription && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  subscription.status === 'active'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {subscription.status === 'active' ? (
                    <><CheckCircle2 className="h-3 w-3" /> Активна</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> Неактивна</>
                  )}
                </span>
              )}
            </div>

            {errorSub && (
              <p className="text-sm text-destructive mb-3">{errorSub}</p>
            )}

            {subLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscription?.status === 'active' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-500/5 dark:to-yellow-500/5 border border-amber-200/30 dark:border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Полный доступ</p>
                      <p className="text-xs text-muted-foreground">Действует до {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Осталось {subscription.daysLeft} дн.</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>{subscription.amount} ₽/мес</span>
                    </div>
                  </div>
                </div>

                {confirmCancel ? (
                  <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Отменить подписку?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Доступ сохранится до конца оплаченного периода.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                      >
                        {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                        Отменить
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        disabled={cancelLoading}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    disabled={cancelLoading}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 disabled:opacity-50 transition-colors text-muted-foreground"
                  >
                    Отменить подписку
                  </button>
                )}
              </div>
            ) : paymentData ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-500/5 dark:to-yellow-500/5 border border-amber-200/30 dark:border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Оплата через СБП</p>
                      <p className="text-xs text-muted-foreground">Отсканируйте QR-код для оплаты</p>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                      {paymentData.amount} ₽
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Срок действия: 15 минут
                    </p>
                  </div>

                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-xl bg-white border-2 border-border/50 shadow-lg">
                      <img
                        src={paymentData.qrCodeUrl}
                        alt="QR-код для оплаты через СБП"
                        className="h-48 w-48"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground text-center">Как оплатить:</p>
                    <ol className="space-y-1.5 text-xs">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium shrink-0">1</span>
                        <span>Откройте приложение вашего банка</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium shrink-0">2</span>
                        <span>Выберите «Оплата по QR» или «СБП»</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium shrink-0">3</span>
                        <span>Наведите камеру на QR-код выше</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium shrink-0">4</span>
                        <span>Подтвердите оплату на {paymentData.phone}</span>
                      </li>
                    </ol>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/5 border border-blue-200/30 dark:border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                      ⏳ Подтверждение оплаты поступит автоматически в течение 1–5 минут
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateSubscription}
                    disabled={createLoading}
                    className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                    Новый QR-код
                  </button>
                  <button
                    onClick={() => setPaymentData(null)}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Полный доступ ко всем разделам</p>
                      <p className="text-xs text-muted-foreground">Рим, Месопотамия, ордера, эпохи, карта и анализ</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{SUBSCRIPTION_PRICE}</span>
                    <span className="text-lg text-muted-foreground">₽/мес</span>
                  </div>
                </div>

                <button
                  onClick={handleCreateSubscription}
                  disabled={createLoading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/30"
                >
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Оформить подписку
                </button>
              </div>
            )}
          </motion.div>

          {/* 2FA секция */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            className="relative rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-primary/40" />
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <h2 className="font-display text-base sm:text-lg font-semibold truncate">Двухфакторная аутентификация</h2>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.totpEnabled ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {user.totpEnabled ? 'Включена' : 'Выключена'}
              </span>
            </div>

            {error2fa && (
              <p className="text-sm text-destructive mb-3">{error2fa}</p>
            )}

            {user.totpEnabled ? confirmDisable ? (
              <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Вы уверены?
                </p>
                <p className="text-xs text-muted-foreground">
                  Отключение 2FA снижает безопасность вашего аккаунта. Вы сможете
                  войти только по паролю.
                </p>
                <div>
                  <label htmlFor="disable-2fa-password" className="block text-xs font-medium mb-1 text-foreground/80">
                    Подтвердите паролем
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input
                      id="disable-2fa-password"
                      type="password"
                      value={totpPassword}
                      onChange={(e) => setTotpPassword(e.target.value)}
                      placeholder="Ваш пароль"
                      autoComplete="current-password"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisable2fa}
                    disabled={disableLoading || !totpPassword}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    {disableLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                    Отключить
                  </button>
                  <button
                    onClick={() => { setConfirmDisable(false); setTotpPassword('') }}
                    disabled={disableLoading}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                disabled={disableLoading}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 disabled:opacity-50 transition-colors"
              >
                <ShieldOff className="h-4 w-4" />
                Отключить 2FA
              </button>
            ) : qrCode ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Яндекс.Ключ и др.)
                </p>
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR-код для настройки двухфакторной аутентификации" width={192} height={192} className="h-48 w-48" loading="lazy" />
                </div>
                <div>
                  <label htmlFor="totp-input" className="block text-sm font-medium mb-1.5">Код из приложения</label>
                  <input
                    id="totp-input"
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-center tracking-[8px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="totp-password" className="block text-sm font-medium mb-1.5">Пароль для подтверждения</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <input
                      id="totp-password"
                      type="password"
                      value={totpPassword}
                      onChange={(e) => setTotpPassword(e.target.value)}
                      placeholder="Ваш пароль"
                      autoComplete="current-password"
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={handleConfirm2fa}
                  disabled={confirmLoading || totpCode.length !== 6 || !totpPassword}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {confirmLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Подтвердить включение 2FA
                </button>
              </div>
            ) : showRecovery ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Коды восстановления</p>
                    <p className="text-xs text-muted-foreground">Сохраните их в надёжном месте. Каждый код можно использовать только один раз.</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryCodes.join('\n'))
                      setCopiedIdx(-2)
                      setTimeout(() => setCopiedIdx(-1), 2000)
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent/10 transition-colors"
                  >
                    {copiedIdx === -2 ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    <span className="hidden sm:inline">{copiedIdx === -2 ? 'Скопировано' : 'Копировать все'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, i) => (
                    <button
                      key={i}
                      onClick={() => copyCode(code, i)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 font-mono text-xs hover:bg-muted transition-colors"
                    >
                      <span>{code}</span>
                      {copiedIdx === i ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={handleSetup2fa}
                disabled={setupLoading}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                Настроить 2FA
              </button>
            )}
          </motion.div>

          {/* Смена пароля */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            className="relative rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-primary/40" />
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <h2 className="font-display text-base sm:text-lg font-semibold truncate">Пароль</h2>
              </div>
            </div>

            {changePasswordSuccess && (
              <div className="mb-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5 text-sm text-green-600 dark:text-green-400">
                Пароль успешно изменён
              </div>
            )}

            {changePasswordError && (
              <p className="text-sm text-destructive mb-3">{changePasswordError}</p>
            )}

            {showChangePassword ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="current-password" className="block text-xs font-medium mb-1 text-foreground/80">
                    Текущий пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Введите текущий пароль"
                      autoComplete="current-password"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium mb-1 text-foreground/80">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      autoComplete="new-password"
                      className="w-full h-9 pl-8 pr-9 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= newPwStrength.score ? newPwStrength.color : 'bg-muted/60'}`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">{newPwStrength.label}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-xs font-medium mb-1 text-foreground/80">
                    Подтвердите новый пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <input
                      id="confirm-new-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      autoComplete="new-password"
                      className={`w-full h-9 pl-8 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 transition-colors ${
                        confirmNewPassword && confirmNewPassword !== newPassword
                          ? 'border-destructive/40 focus:ring-destructive/30'
                          : confirmNewPassword && confirmNewPassword === newPassword
                            ? 'border-green-500/40 focus:ring-green-500/30'
                            : 'border-border focus:ring-primary/30 focus:border-primary'
                      }`}
                    />
                  </div>
                  {confirmNewPassword && confirmNewPassword !== newPassword && (
                    <p className="text-[11px] text-destructive/70 mt-1">Пароли не совпадают</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changePasswordLoading || !currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {changePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Изменить пароль
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmNewPassword('')
                      setChangePasswordError('')
                    }}
                    disabled={changePasswordLoading}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowChangePassword(true)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 transition-colors"
              >
                <Lock className="h-4 w-4" />
                Изменить пароль
              </button>
            )}
          </motion.div>

          {/* Закладки */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            className="relative rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-primary/40" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <h2 className="font-display text-base sm:text-lg font-semibold">Закладки</h2>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{bookmarks.length}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ваши закладки автоматически синхронизируются с сервером при входе в аккаунт.
            </p>
          </motion.div>

          {/* Дата регистрации */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            className="relative rounded-xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-primary/40" />
            <p className="text-sm text-muted-foreground">
              Аккаунт создан: <span className="text-foreground font-medium">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            </p>
          </motion.div>

          {/* Выход */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          >
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-lg border border-border text-sm font-medium hover:bg-accent/10 disabled:opacity-50 transition-colors"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Выйти
            </button>
          </motion.div>
        </motion.div>
      </div>
    </main>
    </ErrorBoundary>
  )
}
