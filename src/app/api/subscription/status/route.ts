import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession } from '@/lib/auth/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Не авторизован', 401)
    }

    const db = getDb()
    const now = new Date().toISOString()

    const sub = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(session.userId, now) as {
      id: string
      status: string
      amount: number
      started_at: string
      expires_at: string
    } | undefined

    const data = sub ? {
      id: sub.id,
      status: sub.status,
      amount: sub.amount,
      startedAt: sub.started_at,
      expiresAt: sub.expires_at,
      daysLeft: Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000)),
    } : null

    return apiOk(data, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } })
  } catch (err) {
    console.error('GET /api/subscription/status error:', err)
    return apiError('Ошибка сервера', 500)
  }
}
