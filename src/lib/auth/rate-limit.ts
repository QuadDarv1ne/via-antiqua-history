import { apiError } from "./api-response";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
// Верхний предел размера store: без него пром-окружение без доверенного
// прокси (уникальный per-request ключ вместо IP) неограниченно раздувало бы
// память при флуде. При переполнении вытесняем самые старые записи.
const MAX_ENTRIES = 10_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
  if (store.size > MAX_ENTRIES) {
    // Map хранит записи в порядке вставки — первые ключи самые старые
    let overflow = store.size - MAX_ENTRIES;
    for (const key of store.keys()) {
      if (overflow <= 0) break;
      store.delete(key);
      overflow--;
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetMs: config.windowMs,
    };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetMs: entry.resetAt - now };
  }

  entry.count++;

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetMs: entry.resetAt - now,
  };
}

export function rateLimitResponse(resetMs: number): Response {
  const retryAfter = Math.ceil(resetMs / 1000);
  return apiError(
    `Слишком много попыток. Попробуйте через ${retryAfter} сек.`,
    429,
    { headers: { "Retry-After": String(retryAfter) } },
  );
}

/** Очистить store rate limiter (для тестов) */
export function clearRateLimitStore() {
  store.clear();
  lastCleanup = Date.now();
}
