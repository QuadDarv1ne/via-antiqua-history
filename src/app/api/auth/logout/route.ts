import { NextRequest } from 'next/server'
import { getSession, destroySession, invalidateSessions } from '@/lib/auth/utils'
import { apiOk, apiError } from '@/lib/auth/api-response'
import { validateCsrf } from '@/lib/auth/csrf'

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    // Инвалидируем сессию на сервере: даже если cookie украден и не был
    // удалён из браузера, JWT перестаёт проходить проверку getSession
    const session = await getSession();
    if (session) {
      await invalidateSessions(session.userId);
    }

    await destroySession()
    return apiOk()
  } catch (err) {
    console.error('Logout error:', err)
    return apiError('Внутренняя ошибка сервера', 500)
  }
}
