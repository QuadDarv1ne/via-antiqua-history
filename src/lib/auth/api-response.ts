import { NextResponse } from 'next/server'

type ApiResponse<T = unknown> = {
  ok: boolean
  error?: string
  data?: T
}

const NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

export function apiOk<T>(data?: T, init?: ResponseInit) {
  const status = init?.status ?? 200
  const headers = { ...NO_CACHE_HEADERS, ...init?.headers }
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { ...init, headers, status })
}

export function apiError(error: string, status: number, init?: ResponseInit) {
  const headers = { ...NO_CACHE_HEADERS, ...init?.headers }
  return NextResponse.json<ApiResponse>({ ok: false, error }, { ...init, headers, status })
}