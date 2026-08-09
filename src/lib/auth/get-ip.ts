import { NextRequest } from 'next/server'

/**
 * Extract client IP from request headers.
 * Only X-Real-IP / X-Forwarded-For are honored when the app is explicitly
 * configured (TRUST_PROXY_HEADERS=true) to run behind a trusted reverse
 * proxy (Caddy/Nginx). Otherwise any client could spoof the headers and
 * bypass rate limits.
 */
export function getClientIp(req: NextRequest): string {
  // Читаем env при каждом вызове: значение может меняться между
  // окружениями (dev/prod) и внутри тестов
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'unknown'

  // X-Real-IP is set by the reverse proxy (Caddy) and cannot be spoofed by the client
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // X-Forwarded-For can be spoofed, but use the LAST entry (closest to origin server)
  // when behind a trusted reverse proxy that appends to the header
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map(p => p.trim()).filter(Boolean)
    // Last IP in the chain is the one added by the trusted proxy
    return parts[parts.length - 1] || 'unknown'
  }

  return 'unknown'
}