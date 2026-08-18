import type Database from "better-sqlite3";
import { createHash } from "crypto";
import { totp } from "./totp";

export interface SecondFactorResult {
  ok: boolean;
  reason?: "totp" | "recovery";
}

// Recovery-коды хранятся в виде SHA-256 хэшей (префикс 'sha256:') — при
// утечке БД коды не читаются напрямую. Plaintext-значения из старых баз
// продолжают приниматься (fallback в проверке), пока не израсходованы.
// Тот же формат используется для кодов сброса пароля (verification_tokens)
const HASH_PREFIX = "sha256:";

export function hashCode(code: string): string {
  return `${HASH_PREFIX}${createHash("sha256").update(code).digest("hex")}`;
}

/** Константное по времени сравнение двух строк (защита от timing-атак) */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

/** Хэширование списка recovery-кодов для хранения в БД */
export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map(hashCode);
}

export function getRecoveryCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((c): c is string => typeof c === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Verify a second-factor code: 6-digit TOTP or 8-char recovery code.
 * Never throws — malformed tokens simply fail verification.
 */
export async function verifySecondFactorCode(
  code: string,
  secret: string | null | undefined,
  recoveryCodesRaw: string | null | undefined,
): Promise<SecondFactorResult> {
  const normalized = code.trim().toUpperCase();

  if (/^\d{6}$/.test(normalized) && secret) {
    try {
      const result = await totp.verify(normalized, {
        secret,
        epochTolerance: 1,
      });
      if (result.valid) return { ok: true, reason: "totp" };
    } catch {
      // Malformed token (e.g. wrong length) — fall through to recovery check
    }
  }

  if (/^[A-Z0-9]{8}$/.test(normalized)) {
    const stored = getRecoveryCodes(recoveryCodesRaw);
    // Хэш текущего формата + plaintext-коды из старых баз
    if (
      stored.includes(hashCode(normalized)) ||
      stored.includes(normalized)
    ) {
      return { ok: true, reason: "recovery" };
    }
  }

  return { ok: false };
}

/** Remove and persist a used recovery code. Returns true if it matched. */
export function consumeRecoveryCode(
  db: Database.Database,
  userId: string,
  code: string,
): boolean {
  const user = db
    .prepare("SELECT recovery_codes FROM users WHERE id = ?")
    .get(userId) as { recovery_codes?: string | null } | undefined;
  const codes = getRecoveryCodes(user?.recovery_codes);
  const normalized = code.trim().toUpperCase();
  const hashed = hashCode(normalized);
  const idx = codes.findIndex((c) => c === hashed || c === normalized);
  if (idx === -1) return false;
  codes.splice(idx, 1);
  const next = JSON.stringify(codes);
  // Условный UPDATE: если параллельный запрос (другой инстанс) уже
  // поглотил код, исходная строка не совпадёт, changes === 0 — и код
  // не будет израсходован дважды
  const res = db
    .prepare(
      "UPDATE users SET recovery_codes = ? WHERE id = ? AND recovery_codes = ?",
    )
    .run(next, userId, user?.recovery_codes ?? null);
  return res.changes > 0;
}
