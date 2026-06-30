import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { verifyPassword, createSession } from '@/lib/auth/utils'
import type { ApiResponse } from '@/lib/auth/types'
import { totp } from '@/lib/auth/totp'

export async function POST(req: NextRequest) {
  try {
    const { email, password, totpCode } = await req.json()

    if (!email || !password) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Заполните все поля' }, { status: 400 })
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as Record<string, unknown> | undefined

    if (!user) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный email или пароль' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash as string)
    if (!valid) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный email или пароль' }, { status: 401 })
    }

    if (user.totp_enabled) {
      if (!totpCode) {
        return NextResponse.json<ApiResponse>({
          ok: true,
          data: { require2fa: true },
        }, { status: 200 })
      }

      const secret = user.totp_secret as string
      const result = await totp.verify(totpCode, { secret })
      if (!result.valid) {
        return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный код 2FA' }, { status: 401 })
      }
    }

    await createSession(user.id as string, user.email as string)

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        totpEnabled: user.totp_enabled,
        createdAt: user.created_at,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
