import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { SubscriptionSchema, safeParse } from "@/lib/auth/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/get-ip";
import { parseSqliteDateTime } from "@/lib/utils";

// Профиль поллит статус каждые 5 секунд во время оплаты —
// лимит должен пропускать это, но не позволять спамить бесконечно
const RATE_LIMIT = { windowMs: 60 * 1000, max: 60 };

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(`sub-status:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();

    const rawSub = db
      .prepare(
        `
      SELECT * FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
      ORDER BY started_at DESC
      LIMIT 1
    `,
      )
      .get(session.userId);

    const sub = safeParse(SubscriptionSchema, rawSub, "subscription:status");

    // Дублирующая проверка: даже если expires_at не прошёл SQL-фильтр
    // (некорректное значение, конвертация часовых поясов), показываем
    // «нет подписки», а не «0 дней осталось»
    const expiresAt = sub ? parseSqliteDateTime(sub.expires_at) : null;
    const isExpired = !expiresAt || expiresAt.getTime() <= Date.now();

    const data = sub && !isExpired
      ? {
          id: sub.id,
          status: sub.status,
          amount: sub.amount,
          // Единый формат с остальными API: ISO-8601 с Z вместо «сырого»
          // SQLite-значения, которое клиент мог бы распарсить как локальное время
          startedAt: parseSqliteDateTime(sub.started_at).toISOString(),
          expiresAt: expiresAt!.toISOString(),
          // Доля дня округляется вверх (осталось «ещё 1 день» при 23 часах),
          // но истекший/истекающий в ближайшие секунды статус уже отсечён выше
          daysLeft: Math.max(0, Math.ceil((expiresAt!.getTime() - Date.now()) / 86400000)),
        }
      : null;

    return apiOk(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/subscription/status error:", err);
    return apiError("Ошибка сервера", 500);
  }
}
