import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession, verifyPassword, hashPassword, createSession } from '@/lib/auth/utils'
import { validatePassword } from '@/lib/utils'
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import type { ApiResponse } from '@/lib/auth/types'

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 }

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = checkRateLimit(`change-pw:${ip}:${session.userId}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Заполните все поля' }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Новый пароль должен отличаться от текущего' }, { status: 400 })
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return NextResponse.json<ApiResponse>({ ok: false, error: passwordError }, { status: 400 })
    }

    const db = getDb()
    const user = db.prepare('SELECT id, password_hash, email FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Пользователь не найден' }, { status: 404 })
    }

    const valid = await verifyPassword(currentPassword, user.password_hash as string)
    if (!valid) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный текущий пароль' }, { status: 401 })
    }

    const passwordHash = await hashPassword(newPassword)
    const now = new Date().toISOString()

    db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, now, session.userId)

    await createSession(session.userId, user.email as string, now)

    return NextResponse.json<ApiResponse>({ ok: true, data: { message: 'Пароль успешно изменён' } })
  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
