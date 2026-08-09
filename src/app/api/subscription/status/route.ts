import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { SubscriptionSchema, safeParse } from "@/lib/auth/schemas";
import { parseSqliteDateTime } from "@/lib/utils";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
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
          startedAt: sub.started_at,
          expiresAt: sub.expires_at,
          daysLeft: Math.max(
            1,
            Math.ceil((expiresAt!.getTime() - Date.now()) / 86400000),
          ),
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
