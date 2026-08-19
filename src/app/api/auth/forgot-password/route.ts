import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { generateNumericCode, generateToken } from "@/lib/auth/utils";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateEmail, toSqliteDateTime } from "@/lib/utils";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { readJsonBody } from "@/lib/auth/request";
import { createHash } from "crypto";
import { hashCode } from "@/lib/auth/two-factor";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 };
// Лимит привязан к IP+email, а не к глобальному email: глобальный ключ
// позволял бы атакующему с одного IP заблокировать сброс пароля жертве
// (3-5 запросов с неверным кодом — и она не может получить код час)
const USER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };
// Глобальный лимит на email (ключ БЕЗ IP): без него ботнет с N адресов
// мог бы бесконечно бомбить чужие ящики письмами сброса и убивать
// действующие коды жертвы (каждый запрос инвалидирует предыдущие).
// Обратная сторона — атакующий может сам израсходовать лимит и лишить
// жертву сброса на час, но это всё же ограниченный ущерб по сравнению
// с неограниченным флудом
const ACCOUNT_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

// Хэш для логов: user_id в логах — не перечисление аккаунтов
function hashForLog(id: string): string {
  return createHash("sha256").update(id).digest("hex").slice(0, 12);
}

// Ответ одинаков для существующего и несуществующего email: сообщение об
// ошибке (или иное отличие) позволило бы перечислить зарегистрированные адреса
const GENERIC_MESSAGE =
  "Если пользователь с таким email существует, код отправлен";

// Реальное SMTP-письмо идёт сотни миллисекунд — выравниваем время ответа
// до фиксированного минимума на обоих путях (существующий/несуществующий
// email), чтобы по задержке нельзя было перечислить аккаунты
const MIN_RESPONSE_MS = 800;

async function alignResponseTime(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  if (elapsed >= MIN_RESPONSE_MS) return;
  await new Promise((resolve) =>
    setTimeout(resolve, MIN_RESPONSE_MS - elapsed),
  );
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;
    const startedAt = Date.now();

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
      `forgot-user:${ip}:${email.toLowerCase()}`,
      USER_RATE_LIMIT,
    );
    if (!userRl.allowed) {
      return rateLimitResponse(userRl.resetMs);
    }

    const accountRl = checkRateLimit(
      `forgot-account:${email.toLowerCase()}`,
      ACCOUNT_RATE_LIMIT,
    );
    if (!accountRl.allowed) {
      return rateLimitResponse(accountRl.resetMs);
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.toLowerCase()) as Record<string, unknown> | undefined;

    if (!user) {
      // Выравниваем время ответа: для несуществующего email выполняем
      // сопоставимую по длительности работу, чтобы нельзя было перечислить
      // зарегистрированные адреса по задержке (реальное SMTP-письмо внизу
      // идёт сотни миллисекунд). Письмо НЕ отправляем — иначе любой мог бы
      // бомбить чужие ящики.
      await alignResponseTime(startedAt);
      return apiOk({ message: GENERIC_MESSAGE });
    }

    const code = generateNumericCode(6);
    const expiresAt = toSqliteDateTime(
      new Date(Date.now() + 15 * 60 * 1000),
    );
    const tokenId = generateToken(16);

    // Создание токена и инвалидация старых — в ОДНОЙ транзакции: при
    // параллельных запросах (двойной клик, атакующий + жертва) иначе
    // был бы промежуток, когда первый токен уже создан, а его инвалидация
    // ещё не выполнена — и второй запрос пометил бы его used, после чего
    // первая инвалидация «добила» бы токен второго. Оба кода стали бы
    // мёртвыми. В транзакции запросы сериализуются: последний побеждает,
    // но хотя бы один код всегда остаётся валидным.
    // Плата за атомарность: при сбое SMTP старые коды уже помечены used
    // (новый токен откатывается ниже) — пользователь просто запросит код
    // ещё раз, рассинхронизации «письмо есть, код мёртв» не возникает.
    // Код хранится хэшированным (sha256:) — при утечке БД коды сброса
    // пароля не читаются напрямую (как recovery-коды 2FA)
    db.transaction(() => {
      // Ленивая чистка истёкших токенов — таблица не разрастается бесконечно
      db.prepare(
        "DELETE FROM verification_tokens WHERE expires_at <= datetime('now')",
      ).run();
      db.prepare(
        "UPDATE verification_tokens SET used = 1 WHERE user_id = ? AND type = 'password_reset' AND used = 0",
      ).run(user.id);
      db.prepare(
        `INSERT INTO verification_tokens (id, user_id, type, code, expires_at) VALUES (?, ?, 'password_reset', ?, ?)`,
      ).run(tokenId, user.id, hashCode(code), expiresAt);
    })();

    const sent = await sendPasswordResetEmail(email.toLowerCase(), code);

    if (!sent) {
      // Откатываем новый токен (старые коды в этой транзакции уже помечены
      // used — при сбое SMTP пользователь просто запросит код ещё раз).
      // Ошибку логируем, но отвечаем тем же общим сообщением: иначе сбой
      // SMTP раскрывал бы, какие адреса зарегистрированы
      db.prepare("DELETE FROM verification_tokens WHERE id = ?").run(tokenId);
      // Email в лог не пишем: перечисление адресов через логи — такой же
      // вектор, как и через ответы (зарегистрированные адреса, которым
      // отправка «успешна», в логи не попадают)
      console.error(
        `Password reset email send failed (user: ${hashForLog(user.id as string)})`,
      );
      // Выравниваем время ответа: путь сбоя не должен отличаться по
      // задержке от успешной отправки/несуществующего email
      await alignResponseTime(startedAt);
      return apiOk({ message: GENERIC_MESSAGE });
    }

    // Реальное SMTP-письмо может идти быстрее фиксированного минимума —
    // выравниваем время ответа на ВСЕХ путях, чтобы задержка не
    // раскрывала факт существования аккаунта (в test-режиме отправка
    // мгновенная, поэтому здесь выравнивание нужно всегда)
    await alignResponseTime(startedAt);

    return apiOk({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
