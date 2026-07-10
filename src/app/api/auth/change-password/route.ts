import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession, verifyPassword, hashPassword, createSession } from '@/lib/auth/utils'
import { validatePassword } from '@/lib/utils'
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
    const rl = checkRateLimit(`change-pw:${ip}:${session.userId}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return apiError('Заполните все поля', 400)
    }
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return apiError('Некорректные данные', 400)
    }

    if (currentPassword === newPassword) {
      return apiError('Новый пароль должен отличаться от текущего', 400)
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return apiError(passwordError, 400)
    }

    const db = getDb()
    const user = db.prepare('SELECT id, password_hash, email FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user) {
      return apiError('Пользователь не найден', 404)
    }

    const valid = await verifyPassword(currentPassword, user.password_hash as string)
    if (!valid) {
      return apiError('Неверный текущий пароль', 401)
    }

    const passwordHash = await hashPassword(newPassword)
    const now = new Date().toISOString()

    db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, now, session.userId)

    await createSession(session.userId, user.email as string, now)

    return apiOk({ message: 'Пароль успешно изменён' })
  } catch (err) {
    console.error('Change password error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
