import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession } from '@/lib/auth/utils'
import { totp } from '@/lib/auth/totp'
import type { ApiResponse } from '@/lib/auth/types'

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
    const user = db.prepare('SELECT totp_secret, totp_enabled, recovery_codes FROM users WHERE id = ?').get(session.userId) as Record<string, unknown> | undefined

    if (!user || !user.totp_enabled) {
      return NextResponse.json<ApiResponse>({ ok: false, error: '2FA не включён' }, { status: 400 })
    }

    if (user.totp_secret) {
      const result = await totp.verify(code, { secret: user.totp_secret as string })
      if (result.valid) {
        return NextResponse.json<ApiResponse>({ ok: true })
      }
    }

    let recoveryCodes: string[] = []
    try {
      recoveryCodes = JSON.parse((user.recovery_codes as string) || '[]')
    } catch {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный код' }, { status: 401 })
    }
    const idx = recoveryCodes.indexOf(code)
    if (idx !== -1) {
      recoveryCodes.splice(idx, 1)
      db.prepare('UPDATE users SET recovery_codes = ? WHERE id = ?').run(JSON.stringify(recoveryCodes), session.userId)
      return NextResponse.json<ApiResponse>({ ok: true, data: { usedRecoveryCode: true } })
    }

    return NextResponse.json<ApiResponse>({ ok: false, error: 'Неверный код' }, { status: 401 })
  } catch (err) {
    console.error('2FA verify error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const db = getDb()
    db.prepare('UPDATE users SET totp_secret = NULL, totp_enabled = 0, recovery_codes = ? WHERE id = ?').run('[]', session.userId)

    return NextResponse.json<ApiResponse>({ ok: true })
  } catch (err) {
    console.error('2FA disable error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
