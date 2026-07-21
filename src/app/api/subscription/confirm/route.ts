import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession } from '@/lib/auth/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { validateCsrf } from '@/lib/auth/csrf'
import { getClientIp } from '@/lib/auth/get-ip'

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 }

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Не авторизован', 401)
    }

    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request)
    const rl = checkRateLimit(`sub-confirm:${ip}:${session.userId}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const db = getDb()
    const now = new Date().toISOString()

    const activeSub = db.prepare(`
      SELECT id FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > ?
      LIMIT 1
    `).get(session.userId, now)

    if (activeSub) {
      return apiError('Подписка уже активна', 400)
    }

    const paidSub = db.prepare(`
      SELECT id FROM subscriptions
      WHERE user_id = ? AND status = 'pending' AND payment_id IN (
        SELECT id FROM payments WHERE user_id = ? AND status = 'paid'
      )
      LIMIT 1
    `).get(session.userId, session.userId) as { id: string } | undefined

    if (!paidSub) {
      return apiError('Нет оплаченной подписки для активации', 400)
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    db.transaction(() => {
      db.prepare(`
        UPDATE subscriptions SET status = 'active', updated_at = ?, expires_at = ?
        WHERE id = ?
      `).run(now, expiresAt, paidSub.id)
    })()

    return apiOk({ message: 'Подписка активирована', expiresAt })
  } catch (err) {
    console.error('POST /api/subscription/confirm error:', err)
    return apiError('Ошибка сервера', 500)
  }
}
