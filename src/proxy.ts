import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/profile']
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']

async function isValidToken(t: string, secret: string): Promise<boolean> {
  try {
    const parts = t.split('.')
    if (parts.length !== 3) return false

    const [headerB64, payloadB64, signatureB64] = parts
    const encoder = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const data = encoder.encode(`${headerB64}.${payloadB64}`)
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0))

    const valid = await crypto.subtle.verify('HMAC', key, signature, data)
    if (!valid) return false

    const payload = JSON.parse(atob(payloadB64))
    if (payload.exp && payload.exp * 1000 < Date.now()) return false

    return true
  } catch {
    return false
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value
  const secret = process.env.JWT_SECRET || ''

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token || !(await isValidToken(token, secret))) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (token && await isValidToken(token, secret)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
}
