import { NextRequest } from "next/server";

const MAX_BODY_BYTES = 256 * 1024; // 256 КБ

/**
 * Safely read a JSON request body with a size cap.
 * Returns null for empty/malformed/oversized bodies or non-object JSON.
 */
export async function readJsonBody(
  req: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readBodyText(req);
    if (raw === null) return null;
    const body: unknown = JSON.parse(raw);
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Read the raw request body as UTF-8 text, aborting the stream once it
 * exceeds MAX_BODY_BYTES to avoid buffering arbitrarily large payloads.
 * Returns null if the body is missing or too large.
 */
export async function readBodyText(req: NextRequest): Promise<string | null> {
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return null;

  const reader = req.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const next = total + value.byteLength;
      if (next > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
      total = next;
    }
  } catch {
    return null;
  }

  if (chunks.length === 0) return null;
  return Buffer.concat(chunks).toString("utf8");
}