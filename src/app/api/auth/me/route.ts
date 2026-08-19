import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import type { User } from "@/lib/auth/types";
import { parseSqliteDateTime } from "@/lib/utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/get-ip";

const RATE_LIMIT = { windowMs: 60 * 1000, max: 30 };

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`me:${ip}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const db = getDb();
    const user = db
      .prepare(
        "SELECT id, email, name, email_verified, totp_enabled, created_at FROM users WHERE id = ?",
      )
      .get(session.userId) as Record<string, unknown> | undefined;

    if (!user) {
      // Единый код для отсутствующей сессии и отсутствующего пользователя:
      // различие (404 vs 401) позволило бы проверять существование userId
      return apiError("Не авторизован", 401);
    }

    return apiOk<User>({
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      emailVerified: Boolean(user.email_verified),
      totpEnabled: Boolean(user.totp_enabled),
      createdAt: parseSqliteDateTime(user.created_at as string).toISOString(),
    });
  } catch (err) {
    console.error("Me error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
