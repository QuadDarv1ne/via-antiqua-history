import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { hashPassword, generateToken, createSession } from '@/lib/auth/utils'
import type { ApiResponse } from '@/lib/auth/types'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Заполните все поля' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Пароль должен быть не менее 8 символов' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Некорректный email' }, { status: 400 })
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
    if (existing) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Пользователь с таким email уже существует' }, { status: 409 })
    }

    const id = generateToken(16)
    const passwordHash = await hashPassword(password)

    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
      id, email.toLowerCase(), passwordHash, name
    )

    await createSession(id, email.toLowerCase())

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: { id, email: email.toLowerCase(), name, createdAt: new Date().toISOString() },
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
