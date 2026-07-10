import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { generateNumericCode, generateToken } from "@/lib/auth/utils";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateEmail } from "@/lib/utils";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 };
const USER_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return apiError("Укажите email", 400);
    }
    if (typeof email !== "string") {
      return apiError("Некорректный email", 400);
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return apiError(emailError, 400);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
      return apiOk({ message: "Если пользователь с таким email существует, код отправлен" });
    }

    const code = generateNumericCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const createToken = db.transaction(() => {
      db.prepare(
        "UPDATE verification_tokens SET used = 1 WHERE user_id = ? AND type = 'password_reset' AND used = 0",
      ).run(user.id);
      db.prepare(
        `INSERT INTO verification_tokens (id, user_id, type, code, expires_at) VALUES (?, ?, 'password_reset', ?, ?)`,
      ).run(generateToken(16), user.id, code, expiresAt);
    });
    createToken();

    await sendPasswordResetEmail(email.toLowerCase(), code);

    return apiOk({
      message: "Если пользователь с таким email существует, код отправлен",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
