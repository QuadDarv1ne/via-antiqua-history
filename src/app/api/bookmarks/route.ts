import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { BookmarkRowSchema, type ValidatedBookmarkRow } from "@/lib/auth/schemas";

const RATE_LIMIT = { windowMs: 60 * 1000, max: 20 };
const CACHE_HEADERS = { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" };

const VALID_TYPES = [
  "city",
  "landmark",
  "term",
  "person",
  "map-city",
  "order",
  "wonder",
  "epoch",
  "event",
];

interface SanitizedBookmark {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
  region: string;
}

function sanitizeBookmark(raw: Record<string, unknown>): SanitizedBookmark | null {
  const id = String(raw.id || "").slice(0, 100);
  if (!id) return null;
  return {
    id,
    type: VALID_TYPES.includes(String(raw.type)) ? String(raw.type) : "term",
    title: String(raw.title || "").slice(0, 200),
    subtitle: String(raw.subtitle || "").slice(0, 500),
    href: String(raw.href || "").slice(0, 100),
    region: String(raw.region || "").slice(0, 50),
  };
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const ip = getClientIp(_req);
    const rl = checkRateLimit(
      `bookmarks-get:${ip}:${session.userId}`,
      RATE_LIMIT,
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();
    const rawRows = db
      .prepare(
        "SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(session.userId);

    const rows = rawRows
      .map((r) => BookmarkRowSchema.safeParse(r))
      .filter((r) => r.success)
      .map((r) => r.data) as ValidatedBookmarkRow[];

    // Не отдаём внутренние колонки (user_id, created_at) клиенту
    const publicRows = rows.map(({ user_id: _userId, created_at: _createdAt, ...rest }) => rest);

    return apiOk(publicRows, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Bookmarks GET error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}

// Добавление/обновление одной закладки (точечная синхронизация без перезаписи чужого списка)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const ip = getClientIp(req);
    const rl = checkRateLimit(`bookmarks:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const body = await req.json().catch(() => null);
    const rawItem = body && typeof body === "object" ? (body as Record<string, unknown>).item : null;
    if (!rawItem || typeof rawItem !== "object") {
      return apiError("Некорректные данные", 400);
    }

    const item = sanitizeBookmark(rawItem as Record<string, unknown>);
    if (!item) {
      return apiError("Некорректные данные", 400);
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO bookmarks (id, user_id, type, title, subtitle, href, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, id) DO UPDATE SET
        type = excluded.type,
        title = excluded.title,
        subtitle = excluded.subtitle,
        href = excluded.href,
        region = excluded.region
    `).run(
      item.id,
      session.userId,
      item.type,
      item.title,
      item.subtitle,
      item.href,
      item.region,
    );

    return apiOk({ upserted: true });
  } catch (err) {
    console.error("Bookmarks POST error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}

// Удаление конкретных закладок по id (не трогает закладки с других устройств)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const ip = getClientIp(req);
    const rl = checkRateLimit(`bookmarks:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const body = await req.json().catch(() => null);
    const ids =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).ids
        : null;
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > 200 ||
      ids.some((id) => typeof id !== "string" || id.trim().length === 0)
    ) {
      return apiError("Некорректные данные", 400);
    }

    const normalizedIds = (ids as string[]).map((id) => id.slice(0, 100));
    const placeholders = normalizedIds.map(() => "?").join(", ");

    const db = getDb();
    const result = db
      .prepare(
        `DELETE FROM bookmarks WHERE user_id = ? AND id IN (${placeholders})`,
      )
      .run(session.userId, ...normalizedIds);

    return apiOk({ removed: result.changes });
  } catch (err) {
    console.error("Bookmarks DELETE error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
