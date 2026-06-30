'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ShieldOff, LogOut, Loader2, Copy, Check, Smartphone, Bookmark, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/components/site/bookmarks'

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
  const [error, setError] = React.useState('')
  const [copiedIdx, setCopiedIdx] = React.useState(-1)
  const [loggingOut, setLoggingOut] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!user) return null

  const handleSetup2fa = async () => {
    setError('')
    setSetupLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup')
      const json = await res.json()
      if (json.ok) {
        setQrCode(json.data.qrCode)
      } else {
        setError(json.error || 'Ошибка')
      }
    } catch {
      setError('Ошибка при настройке 2FA')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleConfirm2fa = async () => {
    setError('')
    setConfirmLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      })
      const json = await res.json()
      if (json.ok) {
        setRecoveryCodes(json.data.recoveryCodes)
        setShowRecovery(true)
        setQrCode('')
        setTotpCode('')
        await refresh()
      } else {
        setError(json.error || 'Неверный код')
      }
    } catch {
      setError('Ошибка при подтверждении 2FA')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleDisable2fa = async () => {
    setError('')
    setDisableLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', { method: 'DELETE' })
      const json = await res.json()
      if (json.ok) {
        setConfirmDisable(false)
        await refresh()
      } else {
        setError(json.error || 'Ошибка')
      }
    } catch {
      setError('Ошибка при отключении 2FA')
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
      router.push('/')
    }
  }

  const copyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(-1), 2000)
    } catch {
      // Clipboard access denied or unavailable
    }
  }

  return (
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

            {error && (
              <p className="text-sm text-destructive mb-3">{error}</p>
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
                <div className="flex gap-2">
                  <button
                    onClick={handleDisable2fa}
                    disabled={disableLoading}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    {disableLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                    Отключить
                  </button>
                  <button
                    onClick={() => setConfirmDisable(false)}
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
                  <img src={qrCode} alt="QR Code" className="h-48 w-48" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Код из приложения</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="flex-1 h-11 px-4 rounded-lg border border-border bg-background text-sm text-center tracking-[8px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    <button
                      onClick={handleConfirm2fa}
                      disabled={confirmLoading || totpCode.length !== 6}
                      className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                    >
                      {confirmLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Подтвердить
                    </button>
                  </div>
                </div>
              </div>
            ) : showRecovery ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Коды восстановления</p>
                <p className="text-xs text-muted-foreground">Сохраните их в надёжном месте. Каждый код можно использовать только один раз.</p>
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
  )
}
