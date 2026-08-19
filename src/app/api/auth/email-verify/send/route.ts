import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession, generateNumericCode, generateToken } from "@/lib/auth/utils";
import { sendEmailVerificationCode } from "@/lib/auth/email";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { toSqliteDateTime } from "@/lib/utils";
import { hashCode } from "@/lib/auth/two-factor";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const ip = getClientIp(req);
    const rl = checkRateLimit(
      `email-verify-send:${ip}:${session.userId}`,
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

    const code = generateNumericCode(6);
    const expiresAt = toSqliteDateTime(
      new Date(Date.now() + 15 * 60 * 1000),
    );
    const tokenId = generateToken(16);

    // Создание и инвалидация старых кодов — в одной транзакции (см.
    // forgot-password): параллельные запросы не оставляют «мёртвых» кодов
    db.transaction(() => {
      db.prepare(
        "DELETE FROM verification_tokens WHERE expires_at <= datetime('now')",
      ).run();
      db.prepare(
        "UPDATE verification_tokens SET used = 1 WHERE user_id = ? AND type = 'email_verify' AND used = 0",
      ).run(session.userId);
      db.prepare(
        `INSERT INTO verification_tokens (id, user_id, type, code, expires_at) VALUES (?, ?, 'email_verify', ?, ?)`,
      ).run(tokenId, session.userId, hashCode(code), expiresAt);
    })();

    const sent = await sendEmailVerificationCode(user.email, code);

    if (!sent) {
      db.prepare("DELETE FROM verification_tokens WHERE id = ?").run(tokenId);
      console.error(
        `Email verification send failed (user: ${session.userId})`,
      );
      return apiError("Не удалось отправить код. Попробуйте позже", 500);
    }

    return apiOk({ message: "Код отправлен на email" });
  } catch (err) {
    console.error("POST /api/auth/email-verify/send error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}