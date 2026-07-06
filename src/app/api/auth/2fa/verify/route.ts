import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession, verifyPassword } from '@/lib/auth/utils'
import { totp } from '@/lib/auth/totp'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 }

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Не авторизован', 401)
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = checkRateLimit(`2fa-verify:${ip}:${session.userId}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const { code } = await req.json()

    if (!code) {
      return apiError('Укажите код', 400)
    }

    const db = getDb()
    const user = db.prepare('SELECT totp_secret, totp_enabled, recovery_codes FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user || !user.totp_enabled) {
      return apiError('2FA не включён', 400)
    }

    if (user.totp_secret) {
      const result = await totp.verify(code, { secret: user.totp_secret as string, epochTolerance: 1 })
      if (result.valid) {
        return apiOk()
      }
    }

    let recoveryCodes: string[] = []
    try {
      recoveryCodes = JSON.parse((user.recovery_codes as string) || '[]')
    } catch {
      return apiError('Неверный код', 401)
    }
    const idx = recoveryCodes.indexOf(code)
    if (idx !== -1) {
      recoveryCodes.splice(idx, 1)
      db.prepare('UPDATE users SET recovery_codes = ? WHERE id = ?').run(JSON.stringify(recoveryCodes), session.userId)
      return apiOk({ usedRecoveryCode: true })
    }

    return apiError('Неверный код', 401)
  } catch (err) {
    console.error('2FA verify error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Не авторизован', 401)
    }

    const { password } = await req.json().catch(() => ({}))
    if (!password) {
      return apiError('Введите пароль для отключения 2FA', 400)
    }

    const db = getDb()
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user) {
      return apiError('Пользователь не найден', 404)
    }

    const valid = await verifyPassword(password, user.password_hash as string)
    if (!valid) {
      return apiError('Неверный пароль', 401)
    }

    db.prepare('UPDATE users SET totp_secret = NULL, totp_enabled = 0, recovery_codes = ? WHERE id = ?').run('[]', session.userId)

    return apiOk()
  } catch (err) {
    console.error('2FA disable error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
