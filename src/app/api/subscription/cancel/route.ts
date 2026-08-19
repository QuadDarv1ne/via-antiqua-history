import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { validateCsrf } from "@/lib/auth/csrf";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/get-ip";
import { toSqliteDateTime, parseSqliteDateTime } from "@/lib/utils";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(_request);
    if (csrfError) return csrfError;

    const ip = getClientIp(_request);
    const rl = checkRateLimit(`sub-cancel:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();
    const now = toSqliteDateTime(new Date());

    // SELECT + условный UPDATE в одной транзакции: если между чтением и
    // записью статус изменился (истекла/отменена параллельным запросом),
    // UPDATE по условию status = 'active' не сработает — чужие статусы
    // не перезаписываются «отменой»
    const cancelled = db.transaction(() => {
      const result = db
        .prepare(
          `SELECT id FROM subscriptions
         WHERE user_id = ? AND status = 'active' AND expires_at > ?
         LIMIT 1`,
        )
        .get(session.userId, now) as { id: string } | undefined;

      if (!result) return null;

      const updated = db
        .prepare(
          `UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'active'`,
        )
        .run(now, result.id);

      if (updated.changes === 0) return null;

      return db
        .prepare(`SELECT * FROM subscriptions WHERE id = ?`)
        .get(result.id) as Record<string, unknown> | undefined;
    })();

    if (!cancelled) {
      return apiError("Нет активной подписки для отмены", 400);
    }

    const expiresAt = parseSqliteDateTime(cancelled.expires_at as string);

    // Возвращаем обновлённую подписку в том же формате, что и /status:
    // клиент показывает «отменена, доступ до конца периода» без «мигания»
    // в состояние «нет подписки»
    return apiOk({
      id: cancelled.id,
      status: "cancelled",
      isCancelled: true,
      amount: cancelled.amount,
      startedAt: parseSqliteDateTime(cancelled.started_at as string).toISOString(),
      expiresAt: expiresAt.toISOString(),
      daysLeft: Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / 86400000),
      ),
    });
  } catch (err) {
    console.error("POST /api/subscription/cancel error:", err);
    return apiError("Ошибка сервера", 500);
  }
}
