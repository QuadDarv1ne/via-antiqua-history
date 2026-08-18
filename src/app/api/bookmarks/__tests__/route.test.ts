import { describe, it, expect, afterAll, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { NextRequest } from 'next/server'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bookmarks-route-'))
process.env.DB_PATH = path.join(tmpDir, 'test.db')

// Мок next/headers: маршрут читает сессионную cookie через cookies()
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

const { POST, GET, DELETE } = await import('../route')
const { getDb } = await import('@/lib/auth/db')
const { signJwt } = await import('@/lib/auth/utils')

const SESSION_COOKIE = 'via_antiqua_session'
const USER_ID = 'user-books-test'

function authRequest(
  method: 'GET' | 'POST' | 'DELETE',
  body?: unknown,
): NextRequest {
  return new NextRequest('http://localhost/api/bookmarks', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function bookmarkItem(id: string, title?: string) {
  return {
    id,
    type: 'city',
    title: title ?? `City ${id}`,
    subtitle: `Subtitle ${id}`,
    href: '#greece',
    region: 'greece',
  }
}

async function loginAs(userId: string) {
  cookieStore.clear()
  const db = getDb()
  db.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, `${userId}@test.local`, 'hash', 'Test User')
  cookieStore.set(
    SESSION_COOKIE,
    signJwt({ userId, email: `${userId}@test.local`, tokenVersion: 0 }),
  )
}

afterAll(() => {
  getDb().close()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('POST /api/bookmarks', () => {
  it('rejects without a session (401)', async () => {
    cookieStore.clear()
    const res = await POST(authRequest('POST', { item: bookmarkItem('a') }))
    expect(res.status).toBe(401)
  })

  it('rejects when neither item nor items provided (400)', async () => {
    await loginAs(USER_ID)
    const res = await POST(authRequest('POST', { foo: 1 }))
    expect(res.status).toBe(400)
  })

  it('rejects when all items are invalid (400)', async () => {
    await loginAs(USER_ID)
    const res = await POST(
      authRequest('POST', { items: [{ id: '', type: 'city' }] }),
    )
    expect(res.status).toBe(400)
  })

  it('upserts a single item', async () => {
    await loginAs(USER_ID)
    const res = await POST(authRequest('POST', { item: bookmarkItem('single') }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data.upserted).toBe(1)

    const rows = getDb()
      .prepare('SELECT id, title FROM bookmarks WHERE user_id = ?')
      .all(USER_ID) as Array<{ id: string; title: string }>
    expect(rows.some((r) => r.id === 'single' && r.title === 'City single')).toBe(
      true,
    )
  })

  it('upserts a batch of items in one transaction', async () => {
    await loginAs(USER_ID)
    const items = ['b1', 'b2', 'b3'].map((id) => bookmarkItem(id))
    const res = await POST(authRequest('POST', { items }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.upserted).toBe(3)

    const rows = getDb()
      .prepare('SELECT id FROM bookmarks WHERE user_id = ?')
      .all(USER_ID) as Array<{ id: string }>
    expect(rows.map((r) => r.id).sort()).toEqual(
      ['b1', 'b2', 'b3', 'single'].sort(),
    )
  })

  it('caps the batch at 100 items', async () => {
    await loginAs(USER_ID)
    const items = Array.from({ length: 150 }, (_, i) =>
      bookmarkItem(`cap-${i}`),
    )
    const res = await POST(authRequest('POST', { items }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.upserted).toBe(100)
  })

  it('sanitizes fields (truncates long title, rejects unknown type)', async () => {
    await loginAs(USER_ID)
    const longTitle = 'X'.repeat(500)
    const res = await POST(
      authRequest('POST', {
        item: bookmarkItem('sane', longTitle),
      }),
    )
    expect(res.status).toBe(200)
    const row = getDb()
      .prepare('SELECT title, type FROM bookmarks WHERE user_id = ? AND id = ?')
      .get(USER_ID, 'sane') as { title: string; type: string }
    expect(row.title.length).toBe(200)
    expect(row.type).toBe('city')
  })
})

describe('GET /api/bookmarks', () => {
  it('returns bookmarks without internal columns', async () => {
    await loginAs(USER_ID)
    const res = await GET(authRequest('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)
    const first = json.data[0]
    expect(first.user_id).toBeUndefined()
    expect(first.created_at).toBeUndefined()
    expect(first.id).toBeDefined()
  })

  it('rejects without a session (401)', async () => {
    cookieStore.clear()
    const res = await GET(authRequest('GET'))
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/bookmarks', () => {
  it('removes only the requested ids', async () => {
    await loginAs(USER_ID)
    const res = await DELETE(authRequest('DELETE', { ids: ['b1', 'missing'] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.removed).toBe(1)

    const rows = getDb()
      .prepare('SELECT id FROM bookmarks WHERE user_id = ? AND id = ?')
      .get(USER_ID, 'b1')
    expect(rows).toBeUndefined()
  })

  it('rejects empty id lists (400)', async () => {
    await loginAs(USER_ID)
    const res = await DELETE(authRequest('DELETE', { ids: [] }))
    expect(res.status).toBe(400)
  })
})