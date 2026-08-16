import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, randomInt } from "crypto";
import { cookies } from "next/headers";
import { parseSqliteDateTime, toSqliteDateTime } from "@/lib/utils";

let _jwtSecret: string | undefined;

export function getJwtSecret(): string {
  if (_jwtSecret !== undefined) return _jwtSecret;
  const secret = process.env.JWT_SECRET;
  if (secret) {
    _jwtSecret = secret;
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production",
    );
  }
  _jwtSecret =
    "dev-secret-change-in-production-" + randomBytes(16).toString("hex");
  return _jwtSecret;
}

const SESSION_COOKIE = "via_antiqua_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export type SessionPayload = {
  userId: string;
  email: string;
  passwordChangedAt?: string;
  /** Версия сессии: увеличивается при logout — старые токены становятся недействительными */
  tokenVersion?: number;
  iat?: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function generateNumericCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export function signJwt(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_MAX_AGE });
}

export function verifyJwt(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  email: string,
  passwordChangedAt?: string | null,
) {
  const { getDb } = await import("@/lib/auth/db");
  const user = getDb()
    .prepare("SELECT token_version FROM users WHERE id = ?")
    .get(userId) as { token_version: number } | undefined;
  const token = signJwt({
    userId,
    email,
    passwordChangedAt: passwordChangedAt || undefined,
    tokenVersion: user?.token_version ?? 0,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return token;
}

/**
 * Инвалидирует все активные сессии пользователя: увеличивает token_version,
 * из-за чего выпущенные ранее JWT перестают проходить проверку getSession.
 */
export async function invalidateSessions(userId: string) {
  const { getDb } = await import("@/lib/auth/db");
  getDb()
    .prepare(
      "UPDATE users SET token_version = token_version + 1, updated_at = ? WHERE id = ?",
    )
    .run(toSqliteDateTime(new Date()), userId);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const { getDb } = await import("@/lib/auth/db");
  const db = getDb();
  const user = db
    .prepare("SELECT password_changed_at, token_version FROM users WHERE id = ?")
    .get(payload.userId) as Record<string, unknown> | undefined;
  if (!user) return null;
  // Сессии, инвалидированные logout'ом (token_version выше значения в токене),
  // отклоняются, даже если сам JWT ещё не истёк
  if (
    payload.tokenVersion !== undefined &&
    payload.tokenVersion !== user.token_version
  ) {
    return null;
  }
  if (payload.passwordChangedAt) {
    if ((user.password_changed_at || null) !== payload.passwordChangedAt) {
      return null;
    }
  } else if (user.password_changed_at && payload.iat) {
    // Легаси-токен без passwordChangedAt (выпущен до внедрения claim):
    // отклоняем, если пароль менялся позже выпуска токена
    const changedSec = Math.floor(
      parseSqliteDateTime(user.password_changed_at as string).getTime() / 1000,
    );
    if (changedSec > payload.iat) {
      return null;
    }
  }
  return payload;
}
