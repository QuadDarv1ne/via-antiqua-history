import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { verifyPassword, createSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { totp } from "@/lib/auth/totp";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };

export async function POST(req: NextRequest) {
  try {
    const { email, password, totpCode } = await req.json();

    if (!email || !password) {
      return apiError("Заполните все поля", 400);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`login:${ip}:${email.toLowerCase()}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();
    const user = db
      .prepare(
        "SELECT id, email, password_hash, name, email_verified, totp_secret, totp_enabled, password_changed_at, created_at FROM users WHERE email = ?",
      )
      .get(email.toLowerCase()) as Record<string, unknown> | undefined;

    if (!user) {
      return apiError("Неверный email или пароль", 401);
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return apiError("Неверный email или пароль", 401);
    }

    if (user.totp_enabled) {
      if (!totpCode) {
        return apiOk({ require2fa: true });
      }

      const secret = user.totp_secret as string;
      const result = await totp.verify(totpCode, { secret, epochTolerance: 1 });
      if (!result.valid) {
        return apiError("Неверный код 2FA", 401);
      }
    }

    await createSession(
      user.id as string,
      user.email as string,
      (user.password_changed_at as string | null) || undefined,
    );

    return apiOk({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.email_verified,
      totpEnabled: user.totp_enabled,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("Login error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
