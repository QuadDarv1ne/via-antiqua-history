import { NextRequest } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { hashPassword, generateToken, createSession } from '@/lib/auth/utils'
import { validateEmail, validatePassword } from '@/lib/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 }

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return apiError('Заполните все поля', 400)
    }

    if (typeof email !== 'string' || email.length > 320) {
      return apiError('Некорректный email', 400)
    }
    if (typeof password !== 'string' || password.length > 128) {
      return apiError('Некорректный пароль', 400)
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = checkRateLimit(`register:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs)
    }

    const trimmedName = name.trim()
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return apiError('Имя должно содержать от 1 до 100 символов', 400)
    }

    const emailError = validateEmail(email)
    if (emailError) {
      return apiError(emailError, 400)
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return apiError(passwordError, 400)
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
    if (existing) {
      return apiError('Пользователь с таким email уже существует', 409)
    }

    const id = generateToken(16)
    const passwordHash = await hashPassword(password)

    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
      id, email.toLowerCase(), passwordHash, trimmedName
    )

    await createSession(id, email.toLowerCase())

    return apiOk({
      id,
      email: email.toLowerCase(),
      name: trimmedName,
      emailVerified: 0,
      totpEnabled: 0,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Register error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
