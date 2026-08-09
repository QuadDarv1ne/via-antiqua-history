import { NextRequest } from 'next/server'

const BASE_TRUSTED = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
])

// Доверенные origin'ы берутся ИСКЛЮЧИТЕЛЬНО из явной конфигурации:
// NEXT_PUBLIC_SITE_URL + CSRF_TRUSTED_ORIGINS (через запятую).
// Никаких суффикс-матчингов домена — иначе любой поддомен с XSS
// сможет выполнять CSRF-запросы.
function getTrustedOrigins(): Set<string> {
  const origins = new Set(BASE_TRUSTED)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin)
    } catch { /* ignore malformed env */ }
  }
  const extra = process.env.CSRF_TRUSTED_ORIGINS
  if (extra) {
    for (const item of extra.split(',')) {
      const trimmed = item.trim()
      if (!trimmed) continue
      try {
        origins.add(new URL(trimmed).origin)
      } catch { /* ignore malformed origin */ }
    }
  }
  return origins
}

// Вычисляем каждый раз: env может отличаться между окружениями/тестами
function isTrusted(originOrReferer: string): boolean {
  try {
    const url = new URL(originOrReferer)
    return getTrustedOrigins().has(url.origin)
  } catch {
    return false
  }
}

/**
 * Validate Origin/Referer headers to prevent CSRF attacks.
 * Returns null if valid, or an error Response if invalid.
 */
export function validateCsrf(req: NextRequest): Response | null {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  if (origin) {
    if (!isTrusted(origin)) {
      return new Response(JSON.stringify({ ok: false, error: 'CSRF: неверный origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
    return null
  }

  if (referer) {
    if (!isTrusted(referer)) {
      return new Response(JSON.stringify({ ok: false, error: 'CSRF: неверный referer' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
    return null
  }

  // Neither Origin nor Referer present — allow for non-browser clients (API consumers)
  return null
}