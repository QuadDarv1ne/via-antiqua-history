import { NextRequest } from "next/server";

/**
 * Safely read a JSON request body.
 * Returns null for empty/malformed bodies or non-object JSON.
 */
export async function readJsonBody(
  req: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
