import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession, verifyPassword } from '@/lib/auth/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { validateCsrf } from '@/lib/auth/csrf'
import { getClientIp } from '@/lib/auth/get-ip'
import { readJsonBody } from '@/lib/auth/request'
import {
  verifySecondFactorCode,
  consumeRecoveryCode,
} from '@/lib/auth/two-factor'

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 }
// Аккаунт-лимит (ключ по userId без IP): неудачные попытки со всех IP
// суммируются — распределённый перебор 6-значного TOTP не проходит
const ACCOUNT_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 }

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Не авторизован', 401)
    }

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const ip = getClientIp(req)
    const rl = checkRateLimit(`2fa-verify:${ip}:${session.userId}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }
    const accountRl = checkRateLimit(
      `2fa-verify-account:${session.userId}`,
      ACCOUNT_RATE_LIMIT,
    )
    if (!accountRl.allowed) {
      return rateLimitResponse(accountRl.resetMs)
    }

    const body = await readJsonBody(req)
    if (!body) {
      return apiError('Некорректный запрос', 400)
    }
    const { code } = body as { code?: unknown }

    if (!code || typeof code !== 'string') {
      return apiError('Укажите код', 400)
    }
    if (code.length > 20) {
      return apiError('Некорректный код', 400)
    }

    const db = getDb()
    const user = db.prepare('SELECT totp_secret, totp_enabled, recovery_codes FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user || !user.totp_enabled) {
      return apiError('2FA не включён', 400)
    }

    const result = await verifySecondFactorCode(
      code,
      (user.totp_secret as string | null) ?? null,
      (user.recovery_codes as string | null) ?? null,
    )
    if (!result.ok) {
      return apiError('Неверный код', 401)
    }

    if (result.reason === 'recovery') {
      // Поглощение кода должно пройти успешно — иначе код уже был использован
      if (!consumeRecoveryCode(db, session.userId, code)) {
        return apiError('Неверный код', 401)
      }
      return apiOk({ usedRecoveryCode: true })
    }

    return apiOk()
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

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const ip = getClientIp(req)
    const rl = checkRateLimit(`2fa-disable:${ip}:${session.userId}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const body = await readJsonBody(req)
    const { password } = body ?? {}
    if (!password || typeof password !== 'string') {
      return apiError('Введите пароль для отключения 2FA', 400)
    }
    if (password.length > 128) {
      return apiError('Некорректный пароль', 400)
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

    // Чистим и секрет, и его срок: иначе после повторного setup-запроса
    // переиспользовался бы старый (истёкший или «висящий») секрет
    db.prepare(
      "UPDATE users SET totp_secret = NULL, totp_secret_expires_at = NULL, totp_enabled = 0, recovery_codes = ? WHERE id = ?",
    ).run('[]', session.userId)

    return apiOk()
  } catch (err) {
    console.error('2FA disable error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
