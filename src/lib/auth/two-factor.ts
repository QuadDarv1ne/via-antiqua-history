import type Database from "better-sqlite3";
import { totp } from "./totp";

export interface SecondFactorResult {
  ok: boolean;
  reason?: "totp" | "recovery";
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

  if (
    /^[A-Z0-9]{8}$/.test(normalized) &&
    getRecoveryCodes(recoveryCodesRaw).includes(normalized)
  ) {
    return { ok: true, reason: "recovery" };
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
  const idx = codes.indexOf(normalized);
  if (idx === -1) return false;
  codes.splice(idx, 1);
  db.prepare("UPDATE users SET recovery_codes = ? WHERE id = ?").run(
    JSON.stringify(codes),
    userId,
  );
  return true;
}
