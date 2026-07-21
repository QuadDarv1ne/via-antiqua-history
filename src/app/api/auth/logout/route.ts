import { NextRequest } from 'next/server'
import { destroySession } from '@/lib/auth/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { validateCsrf } from '@/lib/auth/csrf'

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    await destroySession()
    return apiOk()
  } catch (err) {
    console.error('Logout error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
