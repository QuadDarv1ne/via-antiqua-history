import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { NextRequest } from 'next/server'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-verify-route-'))
process.env.DB_PATH = path.join(tmpDir, 'test.db')
process.env.JWT_SECRET = 'test-jwt-secret-email-verify'

const { cookieStore } = vi.hoisted(() => {
  const store = new Map<string, string>()
  return {
    cookieStore: {
      get: (name: string) => store.get(name),
      set: (name: string, value: string) => {
        store.set(name, value)
      },
      clear: () => store.clear(),
    },
  }
})

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value)
    },
  })),
}))

const { POST: sendPost } = await import('../send/route')
const { POST: confirmPost } = await import('../confirm/route')
const { getDb } = await import('@/lib/auth/db')
const { signJwt, hashPassword } = await import('@/lib/auth/utils')
const { clearRateLimitStore } = await import('@/lib/auth/rate-limit')

const SESSION_COOKIE = 'via_antiqua_session'
const USER_ID = 'user-verify-test'

function buildRequest(url: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function seedUser(emailVerified = 0) {
  const db = getDb()
  const hash = await hashPassword('password123')
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, email_verified)
     VALUES (?, ?, ?, 'Test User', ?)`,
  ).run(USER_ID, 'verify@test.local', hash, emailVerified)
  cookieStore.set(SESSION_COOKIE, signJwt({ userId: USER_ID, email: 'verify@test.local', tokenVersion: 0 }))
}

afterAll(() => {
  getDb().close()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

beforeEach(() => {
  clearRateLimitStore()
  cookieStore.clear()
  getDb().prepare('DELETE FROM users').run()
})

describe('POST /api/auth/email-verify/send', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await sendPost(buildRequest('/api/auth/email-verify/send'))
    expect(res.status).toBe(401)
  })

  it('rejects when email is already verified', async () => {
    await seedUser(1)
    const res = await sendPost(buildRequest('/api/auth/email-verify/send'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('подтверждён')
  })

  it('creates an email_verify token and returns ok', async () => {
    await seedUser(0)
    const res = await sendPost(buildRequest('/api/auth/email-verify/send'))
    expect(res.status).toBe(200)
    const db = getDb()
    const token = db
      .prepare(
        `SELECT id, type, used FROM verification_tokens WHERE user_id = ? AND type = 'email_verify'`,
      )
      .get(USER_ID) as { id: string; type: string; used: number } | undefined
    expect(token).toBeDefined()
    expect(token!.type).toBe('email_verify')
    expect(token!.used).toBe(0)
  })

  it('invalidates previous email_verify tokens when sending a new one', async () => {
    await seedUser(0)
    const db = getDb()
    db.prepare(
      `INSERT INTO verification_tokens (id, user_id, type, code, expires_at)
       VALUES ('old-token', ?, 'email_verify', 'sha256:old', datetime('now', '+15 minutes'))`,
    ).run(USER_ID)

    await sendPost(buildRequest('/api/auth/email-verify/send'))
    const used = db
      .prepare(
        `SELECT used FROM verification_tokens WHERE id = 'old-token'`,
      )
      .get() as { used: number }
    expect(used.used).toBe(1)
  })
})

describe('POST /api/auth/email-verify/confirm', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await confirmPost(buildRequest('/api/auth/email-verify/confirm', { code: '123456' }))
    expect(res.status).toBe(401)
  })

  it('rejects a malformed code', async () => {
    await seedUser(0)
    const res = await confirmPost(buildRequest('/api/auth/email-verify/confirm', { code: 'abc' }))
    expect(res.status).toBe(400)
  })

  it('verifies email with a correct code', async () => {
    await seedUser(0)
    const db = getDb()
    // Прямо кладём код (хеш) в БД, как это сделал бы /send
    db.prepare(
      `INSERT INTO verification_tokens (id, user_id, type, code, expires_at)
       VALUES ('verify-token', ?, 'email_verify', 'sha256:8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', datetime('now', '+15 minutes'))`,
    ).run(USER_ID)

    const res = await confirmPost(
      buildRequest('/api/auth/email-verify/confirm', { code: '123456' }),
    )
    expect(res.status).toBe(200)
    const user = db
      .prepare('SELECT email_verified FROM users WHERE id = ?')
      .get(USER_ID) as { email_verified: number }
    expect(user.email_verified).toBe(1)
  })

  it('rejects a wrong code', async () => {
    await seedUser(0)
    const db = getDb()
    db.prepare(
      `INSERT INTO verification_tokens (id, user_id, type, code, expires_at)
       VALUES ('verify-token-2', ?, 'email_verify', 'sha256:8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', datetime('now', '+15 minutes'))`,
    ).run(USER_ID)

    const res = await confirmPost(
      buildRequest('/api/auth/email-verify/confirm', { code: '999999' }),
    )
    expect(res.status).toBe(400)
    const user = db
      .prepare('SELECT email_verified FROM users WHERE id = ?')
      .get(USER_ID) as { email_verified: number }
    expect(user.email_verified).toBe(0)
  })

  it('consumes the token so it cannot be reused', async () => {
    await seedUser(0)
    const db = getDb()
    db.prepare(
      `INSERT INTO verification_tokens (id, user_id, type, code, expires_at)
       VALUES ('verify-token-3', ?, 'email_verify', 'sha256:8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', datetime('now', '+15 minutes'))`,
    ).run(USER_ID)

    await confirmPost(
      buildRequest('/api/auth/email-verify/confirm', { code: '123456' }),
    )
    const used = db
      .prepare(`SELECT used FROM verification_tokens WHERE id = 'verify-token-3'`)
      .get() as { used: number }
    expect(used.used).toBe(1)
  })
})