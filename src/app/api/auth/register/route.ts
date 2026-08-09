import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { hashPassword, generateToken, createSession } from "@/lib/auth/utils";
import { validateEmail, validatePassword, parseSqliteDateTime } from "@/lib/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { readJsonBody } from "@/lib/auth/request";

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const body = await readJsonBody(req);
    if (!body) {
      return apiError("Некорректный запрос", 400);
    }
    const { email, password, name } = body as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
    };

    if (!email || !password || !name) {
      return apiError("Заполните все поля", 400);
    }

    if (typeof email !== "string" || email.length > 320) {
      return apiError("Некорректный email", 400);
    }
    if (typeof password !== "string" || password.length > 128) {
      return apiError("Некорректный пароль", 400);
    }
    if (typeof name !== "string" || name.length > 100) {
      return apiError("Некорректное имя", 400);
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return apiError("Имя должно содержать от 1 до 100 символов", 400);
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return apiError(emailError, 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return apiError(passwordError, 400);
    }

    // Проверка на существующего пользователя ДО хеширования пароля
    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.toLowerCase());
    if (existing) {
      return apiError("Пользователь с таким email уже существует", 409);
    }

    const id = generateToken(16);
    const passwordHash = await hashPassword(password);

    try {
      db.prepare(
        "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
      ).run(id, email.toLowerCase(), passwordHash, trimmedName);
    } catch (err) {
      // Гонка при параллельной регистрации с тем же email — UNIQUE constraint
      if (
        typeof err === "object" &&
        err !== null &&
        (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        return apiError("Пользователь с таким email уже существует", 409);
      }
      throw err;
    }

    await createSession(id, email.toLowerCase());

    // createdAt берём из БД (datetime('now')), а не из системных часов процесса —
    // чтобы ответ совпадал со значением, которое вернут /api/auth/me и /api/auth/login
    const storedUser = db
      .prepare("SELECT created_at FROM users WHERE id = ?")
      .get(id) as { created_at: string } | undefined;

    return apiOk({
      id,
      email: email.toLowerCase(),
      name: trimmedName,
      emailVerified: 0,
      totpEnabled: 0,
      createdAt: storedUser
        ? parseSqliteDateTime(storedUser.created_at).toISOString()
        : new Date().toISOString(),
    });
  } catch (err) {
    console.error("Register error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
