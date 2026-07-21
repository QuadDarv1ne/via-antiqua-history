import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/auth/db";
import { getSession, verifyPassword } from "@/lib/auth/utils";
import { totp } from "@/lib/auth/totp";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 };

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const db = getDb();
    const user = db
      .prepare("SELECT totp_enabled, totp_secret FROM users WHERE id = ?")
      .get(session.userId) as Record<string, unknown> | undefined;

    if (user?.totp_enabled) {
      return apiError("2FA уже включена. Сначала отключите её в профиле", 400);
    }

    const secret = totp.generateSecret();
    const uri = totp.toURI({
      label: session.email,
      issuer: "Исторический Лабиринт",
      secret,
    });
    const { toDataURL } = await import("qrcode");
    const qrCode = await toDataURL(uri);

    // Сохраняем secret с меткой времени — удаляем через 15 минут если не подтверждён
    const secretExpiresAt = Date.now() + 15 * 60 * 1000;
    db.prepare(
      "UPDATE users SET totp_secret = ?, totp_secret_expires_at = ? WHERE id = ?",
    ).run(secret, String(secretExpiresAt), session.userId);

    return apiOk({ qrCode });
  } catch (err) {
    console.error("2FA setup error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const ip = getClientIp(req);
    const rl = checkRateLimit(`2fa-setup:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const { code, password } = await req.json();
    if (!code) {
      return apiError("Укажите код", 400);
    }

    if (!password) {
      return apiError("Введите пароль для подтверждения", 400);
    }

    const db = getDb();
    const user = db
      .prepare(
        "SELECT totp_secret, totp_secret_expires_at, password_hash FROM users WHERE id = ?",
      )
      .get(session.userId) as Record<string, unknown> | undefined;

    if (!user || !user.totp_secret) {
      return apiError("2FA не настроен. Запросите setup сначала", 400);
    }

    // Проверяем что secret не истёк (15 минут на подтверждение)
    const expiresAt = Number(user.totp_secret_expires_at || 0);
    if (expiresAt && Date.now() > expiresAt) {
      // Очищаем истёкший secret
      db.prepare(
        "UPDATE users SET totp_secret = NULL, totp_secret_expires_at = NULL WHERE id = ?",
      ).run(session.userId);
      return apiError("Код QR-кода истёк. Запросите настройку заново", 400);
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return apiError("Неверный пароль", 401);
    }

    const result = await totp.verify(code, {
      secret: user.totp_secret as string,
      epochTolerance: 1,
    });
    if (!result.valid) {
      return apiError("Неверный код", 400);
    }

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString("hex").toUpperCase(),
    );

    db.prepare(
      "UPDATE users SET totp_enabled = 1, recovery_codes = ? WHERE id = ?",
    ).run(JSON.stringify(recoveryCodes), session.userId);

    return apiOk({ recoveryCodes });
  } catch (err) {
    console.error("2FA confirm error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
