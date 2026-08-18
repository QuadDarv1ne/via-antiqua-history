import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { hashPassword } from '@/lib/auth/utils'
import { validatePassword, validateEmail } from '@/lib/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { validateCsrf } from '@/lib/auth/csrf'
import { getClientIp } from '@/lib/auth/get-ip'
import { readJsonBody } from '@/lib/auth/request'

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 }
// Привязан к IP+email (не глобально к email): иначе 3 запроса с неверным
// кодом с любого IP блокировали бы жертве смену пароля на 15 минут
const USER_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 }

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const body = await readJsonBody(req);
    if (!body) {
      return apiError('Некорректный запрос', 400)
    }
    const { email, code, password } = body as { email?: unknown; code?: unknown; password?: unknown }

    if (!email || !code || !password) {
      return apiError('Заполните все поля', 400)
    }
    if (typeof email !== 'string' || typeof code !== 'string' || typeof password !== 'string') {
      return apiError('Некорректные данные', 400)
    }
    if (email.length > 320 || code.length > 20 || password.length > 128) {
      return apiError('Некорректные данные', 400)
    }

    const emailError = validateEmail(email)
    if (emailError) {
      return apiError(emailError, 400)
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return apiError(passwordError, 400)
    }

    const ip = getClientIp(req)
    const rl = checkRateLimit(`reset:${ip}:${email.toLowerCase()}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const userRl = checkRateLimit(`reset-user:${ip}:${email.toLowerCase()}`, USER_RATE_LIMIT)
    if (!userRl.allowed) {
      return rateLimitResponse(userRl.resetMs)
    }

    const db = getDb()
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as Record<string, unknown> | undefined

    if (!user) {
      return apiError('Неверный код или email', 400)
    }

    const token = db.prepare(
      `SELECT id FROM verification_tokens
       WHERE user_id = ? AND type = 'password_reset' AND code = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`
    ).get(user.id, code) as Record<string, unknown> | undefined

    if (!token) {
      // Единое сообщение для неизвестного email и неверного кода — без перечисления аккаунтов
      return apiError('Неверный код или email', 400)
    }

    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()

    const updateTransactions = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, now, user.id)
      db.prepare('UPDATE verification_tokens SET used = 1 WHERE id = ?').run(token.id)
      db.prepare("UPDATE verification_tokens SET used = 1 WHERE user_id = ? AND type = 'password_reset' AND used = 0").run(user.id)
    })
    updateTransactions()

    return apiOk({ message: 'Пароль успешно изменён' })
  } catch (err) {
    console.error('Reset password error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
