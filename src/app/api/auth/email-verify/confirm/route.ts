import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { readJsonBody } from "@/lib/auth/request";
import { hashCode, safeEqual } from "@/lib/auth/two-factor";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };
// Глобальный лимит неверных кодов на аккаунт (ключ БЕЗ IP): 6-значный код
// и распределённый перебор с ботнета по per-IP лимитам почти не ограничен.
// Лимит начисляется только за неверные коды — правильный код легитимного
// пользователя его не расходует
const ACCOUNT_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const body = await readJsonBody(req);
    if (!body) {
      return apiError("Некорректный запрос", 400);
    }
    const { code } = body as { code?: unknown };

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return apiError("Введите 6-значный код из письма", 400);
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(
      `email-verify-confirm:${ip}:${session.userId}`,
      RATE_LIMIT,
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();
    const user = db
      .prepare("SELECT email, email_verified FROM users WHERE id = ?")
      .get(session.userId) as
      | { email: string; email_verified: number }
      | undefined;

    if (!user) {
      return apiError("Не авторизован", 401);
    }
    if (user.email_verified) {
      return apiError("Email уже подтверждён", 400);
    }

    const token = db
      .prepare(
        `SELECT id, code FROM verification_tokens
         WHERE user_id = ? AND type = 'email_verify' AND used = 0 AND expires_at > datetime('now')
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(session.userId) as { id: string; code: string } | undefined;

    const codeMatches = token
      ? safeEqual(token.code, hashCode(code)) ||
        (!token.code.startsWith("sha256:") && safeEqual(token.code, code))
      : false;

    if (!token || !codeMatches) {
      // Аккаунт-лимит начисляется только за неверные коды: распределённый
      // перебор 6-значного кода ограничен, а правильный код жертвы
      // лимит не расходует
      const accountRl = checkRateLimit(
        `email-verify-account:${session.userId}`,
        ACCOUNT_RATE_LIMIT,
      );
      if (!accountRl.allowed) {
        return rateLimitResponse(accountRl.resetMs);
      }
      return apiError("Неверный код", 400);
    }

    // Условное поглощение токена: два параллельных запроса с одним кодом
    // не могут оба пройти — второй получит changes === 0
    const applied = db.transaction(() => {
      const consumed = db
        .prepare(
          "UPDATE verification_tokens SET used = 1 WHERE id = ? AND used = 0",
        )
        .run(token.id);
      if (consumed.changes === 0) return false;

      db.prepare(
        "UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?",
      ).run(session.userId);
      return true;
    })();

    if (!applied) {
      return apiError("Неверный код", 400);
    }

    return apiOk({ message: "Email подтверждён" });
  } catch (err) {
    console.error("POST /api/auth/email-verify/confirm error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}