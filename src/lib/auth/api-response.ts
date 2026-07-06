import { NextResponse } from 'next/server'
import type { ApiResponse } from './types'

export function apiOk<T>(data?: T, init?: ResponseInit) {
  const status = init?.status ?? 200
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { ...init, status })
}

export function apiError(error: string, status: number) {
  return NextResponse.json<ApiResponse>({ ok: false, error }, { status })
}