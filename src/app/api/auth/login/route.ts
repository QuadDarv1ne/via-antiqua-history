import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { verifyPassword, createSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { UserSchema, safeParse } from "@/lib/auth/schemas";
import { readJsonBody } from "@/lib/auth/request";
import { parseSqliteDateTime } from "@/lib/utils";
import {
  verifySecondFactorCode,
  consumeRecoveryCode,
} from "@/lib/auth/two-factor";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };
// Дополнительный лимит на IP — защита от перебора аккаунтов с одного адреса
const IP_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 40 };

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const body = await readJsonBody(req);
    if (!body) {
      return apiError("Некорректный запрос", 400);
    }
    const { email, password, totpCode } = body as {
      email?: unknown;
      password?: unknown;
      totpCode?: unknown;
    };

    if (!email || !password) {
      return apiError("Заполните все поля", 400);
    }

    if (typeof email !== "string" || email.length > 320) {
      return apiError("Некорректный email", 400);
    }
    if (typeof password !== "string" || password.length > 128) {
      return apiError("Некорректный пароль", 400);
    }
    if (password.length < 8) {
      return apiError("Пароль должен содержать минимум 8 символов", 400);
    }
    if (
      totpCode !== undefined &&
      (typeof totpCode !== "string" ||
        (!/^\d{6}$/.test(totpCode) && !/^[a-zA-Z0-9]{8}$/.test(totpCode)))
    ) {
      return apiError("Некорректный код 2FA", 400);
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`login:${ip}:${email.toLowerCase()}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }
    const ipRl = checkRateLimit(`login-ip:${ip}`, IP_RATE_LIMIT);
    if (!ipRl.allowed) {
      return rateLimitResponse(ipRl.resetMs);
    }

    const db = getDb();
    const rawUser = db
      .prepare(
        "SELECT id, email, password_hash, name, email_verified, totp_secret, totp_enabled, recovery_codes, password_changed_at, created_at FROM users WHERE email = ?",
      )
      .get(email.toLowerCase());

    const user = safeParse(UserSchema, rawUser, "login:user");
    if (!user) {
      return apiError("Неверный email или пароль", 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return apiError("Неверный email или пароль", 401);
    }

    if (user.totp_enabled) {
      if (!totpCode) {
        return apiOk({ require2fa: true });
      }

      const result = await verifySecondFactorCode(
        totpCode,
        (user.totp_secret as string | null) ?? null,
        (user.recovery_codes as string | null) ?? null,
      );
      if (!result.ok) {
        return apiError("Неверный код 2FA", 401);
      }
      if (result.reason === "recovery") {
        // Поглощение кода должно пройти успешно — иначе код уже был использован
        if (!consumeRecoveryCode(db, user.id, totpCode)) {
          return apiError("Неверный код 2FA", 401);
        }
      }
    }

    await createSession(
      user.id,
      user.email,
      user.password_changed_at || undefined,
    );

    return apiOk({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.email_verified,
      totpEnabled: user.totp_enabled,
      createdAt: parseSqliteDateTime(user.created_at).toISOString(),
    });
  } catch (err) {
    console.error("Login error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
