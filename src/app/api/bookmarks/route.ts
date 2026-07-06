import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import type { BookmarkRow } from "@/lib/auth/types";

const RATE_LIMIT = { windowMs: 60 * 1000, max: 20 };
const CACHE_HEADERS = { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" };

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const ip =
      _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(
      `bookmarks-get:${ip}:${session.userId}`,
      RATE_LIMIT,
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();
    const rows = db
      .prepare(
        "SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(session.userId) as BookmarkRow[];

    return apiOk(rows, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Bookmarks GET error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`bookmarks:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const { bookmarks } = await req.json();
    if (!Array.isArray(bookmarks) || bookmarks.length > 200) {
      return apiError("Некорректные данные", 400);
    }

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
    const sanitized = bookmarks.map((b: Record<string, unknown>) => ({
      id: String(b.id || "").slice(0, 100),
      type: VALID_TYPES.includes(String(b.type)) ? String(b.type) : "term",
      title: String(b.title || "").slice(0, 200),
      subtitle: String(b.subtitle || "").slice(0, 500),
      href: String(b.href || "").slice(0, 100),
      region: String(b.region || "").slice(0, 50),
    }));

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO bookmarks (id, user_id, type, title, subtitle, href, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, id) DO NOTHING
    `);
    const remove = db.prepare(
      "DELETE FROM bookmarks WHERE user_id = ? AND id = ?",
    );

    const current = db
      .prepare("SELECT id FROM bookmarks WHERE user_id = ?")
      .all(session.userId) as { id: string }[];
    const currentIds = new Set(current.map((r) => r.id));
    const newIds = new Set(sanitized.map((b) => b.id));

    const toRemove = [...currentIds].filter((id) => !newIds.has(id));
    const toAdd = sanitized.filter((b) => !currentIds.has(b.id));

    const tx = db.transaction(() => {
      for (const id of toRemove) {
        remove.run(session.userId, id);
      }
      for (const b of toAdd) {
        upsert.run(
          b.id,
          session.userId,
          b.type,
          b.title,
          b.subtitle,
          b.href,
          b.region,
        );
      }
    });
    tx();

    return apiOk({ added: toAdd.length, removed: toRemove.length });
  } catch (err) {
    console.error("Bookmarks PUT error:", err);
    return apiError("Внутренняя ошибка сервера", 500);
  }
}
