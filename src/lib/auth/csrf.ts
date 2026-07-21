import { NextRequest } from 'next/server'

const TRUSTED_ORIGINS = new Set([
  'https://via-antiqua.maestro7it.ru',
  'http://localhost:3000',
  'http://localhost:3001',
])

/**
 * Validate Origin/Referer headers to prevent CSRF attacks.
 * Returns null if valid, or an error Response if invalid.
 */
export function validateCsrf(req: NextRequest): Response | null {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  if (origin) {
    try {
      const originUrl = new URL(origin)
      const originHost = originUrl.host
      if (!TRUSTED_ORIGINS.has(origin) && !originHost.endsWith('.maestro7it.ru')) {
        return new Response(JSON.stringify({ ok: false, error: 'CSRF: неверный origin' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
      }
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'CSRF: некорректный origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
    return null
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererHost = refererUrl.host
      if (!TRUSTED_ORIGINS.has(referer) && !refererHost.endsWith('.maestro7it.ru')) {
        return new Response(JSON.stringify({ ok: false, error: 'CSRF: неверный referer' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
      }
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'CSRF: некорректный referer' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
    return null
  }

  // Neither Origin nor Referer present — allow for non-browser clients (API consumers)
  return null
}
