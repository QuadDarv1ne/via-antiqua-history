import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const db = getDb();
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `SELECT id FROM subscriptions
       WHERE user_id = ? AND status = 'active' AND expires_at > ?
       LIMIT 1`,
      )
      .get(session.userId, now) as { id: string } | undefined;

    if (!result) {
      return apiError("Нет активной подписки для отмены", 400);
    }

    db.prepare(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE id = ?`,
    ).run(now, result.id);

    return apiOk({ message: "Подписка отменена" });
  } catch (err) {
    console.error("POST /api/subscription/cancel error:", err);
    return apiError("Ошибка сервера", 500);
  }
}
