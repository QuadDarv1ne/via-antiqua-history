import { NextRequest } from 'next/server'

/**
 * Extract client IP from request headers.
 * Uses X-Real-IP first (set by Caddy/nginx), falls back to X-Forwarded-For.
 * X-Real-IP is harder to spoof because the reverse proxy overwrites it.
 */
export function getClientIp(req: NextRequest): string {
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
