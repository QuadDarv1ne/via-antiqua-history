import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/auth/db";
import { getSession, verifyPassword } from "@/lib/auth/utils";
import { totp } from "@/lib/auth/totp";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { readJsonBody } from "@/lib/auth/request";
import { SITE_NAME } from "@/lib/constants";

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

    // Parse body — may be empty (setup) or contain code+password (confirm)
    const body = (await readJsonBody(req)) ?? {};

    const { code, password } = body as { code?: string; password?: string };
    const isConfirmStep = Boolean(code);

    const db = getDb();

    if (!isConfirmStep) {
      // --- SETUP STEP: generate QR code ---
      const rl = checkRateLimit(`2fa-setup:${ip}:${session.userId}`, RATE_LIMIT);
      if (!rl.allowed) {
        return rateLimitResponse(rl.resetMs);
      }

      const user = db
        .prepare("SELECT totp_enabled FROM users WHERE id = ?")
        .get(session.userId) as Record<string, unknown> | undefined;

      if (user?.totp_enabled) {
        return apiError("2FA уже включена. Сначала отключите её в профиле", 400);
      }

      // Повторный запрос setup (двойной клик): переиспользуем ещё не истёкший
      // секрет, чтобы QR-код и подтверждаемый код относились к одному секрету
      const existing = db
        .prepare("SELECT totp_secret, totp_secret_expires_at FROM users WHERE id = ?")
        .get(session.userId) as
        | { totp_secret: string | null; totp_secret_expires_at: string | null }
        | undefined;

      const existingSecret = existing?.totp_secret;
      const existingExpiresAt = Number(existing?.totp_secret_expires_at || 0);
      if (existingSecret && (!existingExpiresAt || Date.now() < existingExpiresAt)) {
        const uri = totp.toURI({
          label: session.email,
          issuer: SITE_NAME,
          secret: existingSecret,
        });
        const { toDataURL } = await import("qrcode");
        const qrCode = await toDataURL(uri);
        return apiOk({ qrCode });
      }

      const secret = totp.generateSecret();
      const uri = totp.toURI({
        label: session.email,
        issuer: SITE_NAME,
        secret,
      });
      const { toDataURL } = await import("qrcode");
      const qrCode = await toDataURL(uri);

      const secretExpiresAt = Date.now() + 15 * 60 * 1000;
      db.prepare(
        "UPDATE users SET totp_secret = ?, totp_secret_expires_at = ? WHERE id = ?",
      ).run(secret, String(secretExpiresAt), session.userId);

      return apiOk({ qrCode });
    }

    // --- CONFIRM STEP: verify code and enable 2FA ---
    const rl = checkRateLimit(`2fa-confirm:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    if (!code || typeof code !== "string") {
      return apiError("Укажите код", 400);
    }
    if (!/^\d{6}$/.test(code)) {
      return apiError("Код должен содержать 6 цифр", 400);
    }

    if (!password || typeof password !== "string") {
      return apiError("Введите пароль для подтверждения", 400);
    }
    if (password.length > 128) {
      return apiError("Некорректный пароль", 400);
    }

    const user = db
      .prepare(
        "SELECT totp_secret, totp_secret_expires_at, password_hash, totp_enabled FROM users WHERE id = ?",
      )
      .get(session.userId) as Record<string, unknown> | undefined;

    if (!user || !user.totp_secret) {
      return apiError("2FA не настроен. Запросите setup сначала", 400);
    }

    // Повторный confirm при уже включённой 2FA: не перегенерируем recovery-коды,
    // иначе пользователь, не сохранивший новые коды, потеряет доступ к аккаунту
    if (user.totp_enabled) {
      return apiError("2FA уже включена. Сначала отключите её в профиле", 400);
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

    // Включаем 2FA атомарно: условие totp_enabled = 0 защищает от гонки двух
    // параллельных confirm (двойной клик) — иначе каждый сгенерировал бы свой
    // набор recovery-кодов, и коды из первого ответа перестали бы действовать
    const enabled = db
      .prepare(
        "UPDATE users SET totp_enabled = 1, recovery_codes = ?, totp_secret_expires_at = NULL WHERE id = ? AND totp_enabled = 0",
      )
      .run(JSON.stringify(recoveryCodes), session.userId);

    if (enabled.changes === 0) {
      // Параллельный запрос уже включил 2FA (с другим набором кодов)
      return apiError("2FA уже включена. Сначала отключите её в профиле", 400);
    }

    return apiOk({ recoveryCodes });
  } catch (err) {
    console.error("2FA confirm error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
