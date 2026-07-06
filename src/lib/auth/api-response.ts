import { NextResponse } from 'next/server'

type ApiResponse<T = unknown> = {
  ok: boolean
  error?: string
  data?: T
}

export function apiOk<T>(data?: T, init?: ResponseInit) {
  const status = init?.status ?? 200
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { ...init, status })
}

export function apiError(error: string, status: number) {
  return NextResponse.json<ApiResponse>({ ok: false, error }, { status })
}