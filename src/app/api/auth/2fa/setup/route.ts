import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { toDataURL } from 'qrcode'
import { getDb } from '@/lib/auth/db'
import { getSession } from '@/lib/auth/utils'
import { totp } from '@/lib/auth/totp'
import type { ApiResponse } from '@/lib/auth/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const secret = totp.generateSecret()
    const uri = totp.toURI({ label: session.email, issuer: 'Исторический Лабиринт', secret })
    const qrCode = await toDataURL(uri)

    const db = getDb()
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, session.userId)

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: { secret, qrCode },
    })
  } catch (err) {
    console.error('2FA setup error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Укажите код' }, { status: 400 })
    }

    const db = getDb()
    const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user || !user.totp_secret) {
      return NextResponse.json<ApiResponse>({ ok: false, error: '2FA не настроен. Запросите setup сначала' }, { status: 400 })
    }

    const result = await totp.verify(code, { secret: user.totp_secret as string })
    if (!result.valid) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный код' }, { status: 400 })
    }

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase()
    )

    db.prepare('UPDATE users SET totp_enabled = 1, recovery_codes = ? WHERE id = ?').run(
      JSON.stringify(recoveryCodes), session.userId
    )

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: { recoveryCodes },
    })
  } catch (err) {
    console.error('2FA confirm error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
