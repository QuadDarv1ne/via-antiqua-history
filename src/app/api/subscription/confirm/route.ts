import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession } from '@/lib/auth/utils'
export async function POST(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const db = getDb()
    const now = new Date().toISOString()

    // Check if user already has active subscription
    const activeSub = db.prepare(`
      SELECT id FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > ?
      LIMIT 1
    `).get(session.userId, now)

    if (activeSub) {
      return NextResponse.json({ ok: false, error: 'Подписка уже активна' }, { status: 400 })
    }

    // Check if there's a paid subscription ready to activate
    const paidSub = db.prepare(`
      SELECT id FROM subscriptions
      WHERE user_id = ? AND status = 'pending' AND payment_id IN (
        SELECT id FROM payments WHERE user_id = ? AND status = 'paid'
      )
      LIMIT 1
    `).get(session.userId, session.userId) as { id: string } | undefined

    if (!paidSub) {
      return NextResponse.json({ ok: false, error: 'Нет оплаченной подписки для активации' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    db.prepare(`
      UPDATE subscriptions SET status = 'active', updated_at = ?, expires_at = ?
      WHERE id = ?
    `).run(now, expiresAt, paidSub.id)

    return NextResponse.json({
      ok: true,
      data: { message: 'Подписка активирована', expiresAt },
    })
  } catch (err) {
    console.error('POST /api/subscription/confirm error:', err)
    return NextResponse.json({ ok: false, error: 'Ошибка сервера' }, { status: 500 })
  }
}
