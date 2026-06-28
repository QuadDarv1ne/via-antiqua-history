import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { generateNumericCode, generateToken } from '@/lib/auth/utils'
import { sendPasswordResetEmail } from '@/lib/auth/email'
import type { ApiResponse } from '@/lib/auth/types'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Укажите email' }, { status: 400 })
    }

    const db = getDb()
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as Record<string, unknown> | undefined

    if (!user) {
      return NextResponse.json<ApiResponse>({ ok: true, data: { message: 'Если пользователь с таким email существует, код отправлен' } })
    }

    const code = generateNumericCode(6)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    db.prepare(
      `INSERT INTO verification_tokens (id, user_id, type, code, expires_at) VALUES (?, ?, 'password_reset', ?, ?)`
    ).run(generateToken(16), user.id, code, expiresAt)

    await sendPasswordResetEmail(email.toLowerCase(), code)

    const testMode = process.env.NODE_ENV !== 'production' || process.env.EMAIL_TEST_MODE === 'true'

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        message: 'Если пользователь с таким email существует, код отправлен',
        ...(testMode ? { testCode: code } : {}),
      },
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
