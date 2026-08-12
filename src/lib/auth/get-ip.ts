import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_IP_LENGTH = 64

/**
 * Нормализует адрес для использования в ключах rate limit:
 * - IPv4-mapped IPv6 (::ffff:127.0.0.1) приводится к IPv4, иначе
 *   один клиент попадает в два разных bucket'а в зависимости от
 *   того, как прокси передаёт заголовок;
 * - длина ограничивается, чтобы мусорные заголовки не раздували Map.
 */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim().slice(0, MAX_IP_LENGTH)
  if (trimmed.startsWith('::ffff:')) {
    const v4 = trimmed.slice(7)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v4)) return v4
  }
  return trimmed
}

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
  if (process.env.TRUST_PROXY_HEADERS !== 'true') {
    if (process.env.NODE_ENV === 'production') {
      // Пром-окружение без доверенного прокси: предупреждаем один раз и
      // используем ПЕР-ЗАПРОСНЫЙ ключ вместо общего 'unknown'. Общий bucket
      // позволил бы одному атакующему исчерпать лимиты регистрации/входа
      // для ВСЕХ пользователей сайта (сайт-wide DoS).
      if (!getClientIp.warned) {
        getClientIp.warned = true;
        console.error(
          '[get-ip] TRUST_PROXY_HEADERS не включён в production — реальный IP клиента ' +
          'недоступен, IP-базированный rate limit отключён. Установите ' +
          'TRUST_PROXY_HEADERS=true за доверенным reverse-proxy (Caddy/Nginx).',
        );
      }
      return `unknown:${randomUUID()}`;
    }
    return 'unknown'
  }

  // X-Real-IP is set by the reverse proxy (Caddy) and cannot be spoofed by the client
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return normalizeIp(realIp)

  // X-Forwarded-For can be spoofed, but use the LAST entry (closest to origin server)
  // when behind a trusted reverse proxy that appends to the header
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map(p => p.trim()).filter(Boolean)
    // Last IP in the chain is the one added by the trusted proxy
    return normalizeIp(parts[parts.length - 1] || 'unknown')
  }

  return 'unknown'
}

// Одноразовый флаг, чтобы предупреждение о неверной конфигурации
// не засоряло логи на каждый запрос
getClientIp.warned = false;