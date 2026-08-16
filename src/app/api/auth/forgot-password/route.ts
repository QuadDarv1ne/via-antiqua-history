import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { generateNumericCode, generateToken } from "@/lib/auth/utils";
import { sendPasswordResetEmail, isEmailTestMode } from "@/lib/auth/email";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateEmail, toSqliteDateTime } from "@/lib/utils";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { readJsonBody } from "@/lib/auth/request";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 };
const USER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };

// Ответ одинаков для существующего и несуществующего email: сообщение об
// ошибке (или иное отличие) позволило бы перечислить зарегистрированные адреса
const GENERIC_MESSAGE =
  "Если пользователь с таким email существует, код отправлен";

// Выравнивание времени ответа между существующим и несуществующим email
function dummyDelay(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, 300 + Math.random() * 300),
  );
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const body = await readJsonBody(req);
    if (!body) {
      return apiError("Некорректный запрос", 400);
    }
    const { email } = body as { email?: unknown };

    if (!email) {
      return apiError("Укажите email", 400);
    }
    if (typeof email !== "string") {
      return apiError("Некорректный email", 400);
    }
    if (email.length > 320) {
      return apiError("Некорректный email", 400);
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return apiError(emailError, 400);
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(
      `forgot:${ip}:${email.toLowerCase()}`,
      RATE_LIMIT,
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const userRl = checkRateLimit(
      `forgot-user:${email.toLowerCase()}`,
      USER_RATE_LIMIT,
    );
    if (!userRl.allowed) {
      return rateLimitResponse(userRl.resetMs);
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.toLowerCase()) as Record<string, unknown> | undefined;

    if (!user) {
      // Выравниваем время ответа: для несуществующего email выполняем
      // сопоставимую по длительности «dummy» работу (как dummy-bcrypt в login),
      // чтобы нельзя было перечислить зарегистрированные адреса по задержке.
      // Письмо НЕ отправляем — иначе любой мог бы бомбить чужие ящики.
      await dummyDelay();
      return apiOk({ message: GENERIC_MESSAGE });
    }

    const code = generateNumericCode(6);
    const expiresAt = toSqliteDateTime(
      new Date(Date.now() + 15 * 60 * 1000),
    );
    const tokenId = generateToken(16);

    // Сначала создаём новый токен, но НЕ инвалидируем старые:
    // если отправка письма упадёт, пользователь не потеряет действующий код
    db.transaction(() => {
      // Ленивая чистка истёкших токенов — таблица не разрастается бесконечно
      db.prepare(
        "DELETE FROM verification_tokens WHERE expires_at <= datetime('now')",
      ).run();
      db.prepare(
        `INSERT INTO verification_tokens (id, user_id, type, code, expires_at) VALUES (?, ?, 'password_reset', ?, ?)`,
      ).run(tokenId, user.id, code, expiresAt);
    })();

    const sent = await sendPasswordResetEmail(email.toLowerCase(), code);

    if (!sent) {
      // Откатываем новый токен — старые коды остаются валидными. Ошибку
      // логируем, но отвечаем тем же общим сообщением: иначе сбой SMTP
      // раскрывал бы, какие адреса зарегистрированы
      db.prepare("DELETE FROM verification_tokens WHERE id = ?").run(tokenId);
      console.error(
        `Password reset email send failed for ${email.toLowerCase()}`,
      );
      return apiOk({ message: GENERIC_MESSAGE });
    }

    db.prepare(
      "UPDATE verification_tokens SET used = 1 WHERE user_id = ? AND type = 'password_reset' AND used = 0 AND id != ?",
    ).run(user.id, tokenId);

    // В test-режиме отправка мгновенная — добавляем ту же задержку, что
    // и для несуществующего email, чтобы время ответа не раскрывало аккаунт
    if (isEmailTestMode()) {
      await dummyDelay();
    }

    return apiOk({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
