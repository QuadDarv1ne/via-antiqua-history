import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes, randomInt } from 'crypto'
import { cookies } from 'next/headers'

let _jwtSecret: string | undefined

export function getJwtSecret(): string {
  if (_jwtSecret !== undefined) return _jwtSecret
  const secret = process.env.JWT_SECRET
  if (secret) {
    _jwtSecret = secret
    return secret
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  _jwtSecret = 'dev-secret-change-in-production-' + randomBytes(16).toString('hex')
  return _jwtSecret
}

const SESSION_COOKIE = 'session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export type SessionPayload = {
  userId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

export function generateNumericCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString()
  }
  return code
}

export function signJwt(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_MAX_AGE })
}

export function verifyJwt(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, email: string) {
  const token = signJwt({ userId, email })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return token
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyJwt(token)
}
