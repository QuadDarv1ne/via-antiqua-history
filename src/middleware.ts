import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/profile']
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value

  // Basic JWT validation: check it has 3 parts and isn't expired
  const isValidToken = (t: string): boolean => {
    try {
      const parts = t.split('.')
      if (parts.length !== 3) return false
      const payload = JSON.parse(atob(parts[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) return false
      return true
    } catch {
      return false
    }
  }

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token || !isValidToken(token)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (token && isValidToken(token)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
}
