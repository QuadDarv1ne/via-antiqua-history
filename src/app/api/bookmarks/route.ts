import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/auth/db'
import { getSession } from '@/lib/auth/utils'
import type { ApiResponse, BookmarkRow } from '@/lib/auth/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const db = getDb()
    const rows = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(session.userId) as BookmarkRow[]

    return NextResponse.json<ApiResponse>({ ok: true, data: rows })
  } catch (err) {
    console.error('Bookmarks GET error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Не авторизован' }, { status: 401 })
    }

    const { bookmarks } = await req.json()
    if (!Array.isArray(bookmarks) || bookmarks.length > 200) {
      return NextResponse.json<ApiResponse>({ ok: false, error: 'Некорректные данные' }, { status: 400 })
    }

    const VALID_TYPES = ['city', 'landmark', 'term', 'person', 'map-city', 'order']
    const sanitized = bookmarks.map((b: Record<string, unknown>) => ({
      id: String(b.id || '').slice(0, 100),
      type: VALID_TYPES.includes(String(b.type)) ? String(b.type) : 'term',
      title: String(b.title || '').slice(0, 200),
      subtitle: String(b.subtitle || '').slice(0, 500),
      href: String(b.href || '').slice(0, 100),
      region: String(b.region || '').slice(0, 50),
    }))

    const db = getDb()
    const upsert = db.prepare(`
      INSERT INTO bookmarks (id, user_id, type, title, subtitle, href, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, id) DO NOTHING
    `)
    const remove = db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND id = ?')

    const current = db.prepare('SELECT id FROM bookmarks WHERE user_id = ?').all(session.userId) as { id: string }[]
    const currentIds = new Set(current.map((r) => r.id))
    const newIds = new Set(sanitized.map((b) => b.id))

    const toRemove = [...currentIds].filter((id) => !newIds.has(id))
    const toAdd = sanitized.filter((b) => !currentIds.has(b.id))

    const tx = db.transaction(() => {
      for (const id of toRemove) {
        remove.run(session.userId, id)
      }
      for (const b of toAdd) {
        upsert.run(b.id, session.userId, b.type, b.title, b.subtitle, b.href, b.region)
      }
    })
    tx()

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: { added: toAdd.length, removed: toRemove.length },
    })
  } catch (err) {
    console.error('Bookmarks PUT error:', err)
    return NextResponse.json<ApiResponse>({ ok: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
