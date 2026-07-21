import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { SUBSCRIPTION_PRICE } from "@/lib/constants";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { getClientIp } from "@/lib/auth/get-ip";
import { randomUUID } from "crypto";

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Не авторизован", 401);
    }

    const csrfError = validateCsrf(_request);
    if (csrfError) return csrfError;

    const ip = getClientIp(_request);
    const rl = checkRateLimit(`sub-create:${ip}:${session.userId}`, RATE_LIMIT);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetMs);
    }

    const db = getDb();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const existingSub = db
      .prepare(
        `
      SELECT id FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
      LIMIT 1
    `,
      )
      .get(session.userId);

    if (existingSub) {
      return apiError("У вас уже есть активная подписка", 400);
    }

    const pendingPayment = db
      .prepare(
        `
      SELECT id FROM payments
      WHERE user_id = ? AND status = 'pending' AND created_at > datetime('now', '-30 minutes')
      LIMIT 1
    `,
      )
      .get(session.userId) as { id: string } | undefined;

    if (pendingPayment) {
      return apiOk({
        paymentId: pendingPayment.id,
        qrData: null,
        message: "Используйте предыдущий QR-код",
      });
    }

    const paymentId = randomUUID();
    const amount = Number(process.env.SUBSCRIPTION_PRICE) || SUBSCRIPTION_PRICE;
    const phone = process.env.FASTPAY_SBP_PHONE || "";

    const sbpQrData = JSON.stringify({
      type: "sbp",
      phone,
      amount,
      currency: "RUB",
      description: "Подписка «Исторический Лабиринт» — образовательный контент",
      paymentId,
    });

    db.prepare(
      `
      INSERT INTO payments (id, user_id, amount, currency, status, payment_method, sbp_phone, sbp_qr_data)
      VALUES (?, ?, ?, ?, 'pending', 'sbp', ?, ?)
    `,
    ).run(paymentId, session.userId, amount, "RUB", phone, sbpQrData);

    const subId = randomUUID();

    db.prepare(
      `
      INSERT INTO subscriptions (id, user_id, status, payment_id, amount, started_at, expires_at)
      VALUES (?, ?, 'pending', ?, ?, datetime('now'), datetime('now', '+30 days'))
    `,
    ).run(subId, session.userId, paymentId, amount);

    const qrApiBase =
      process.env.QR_CODE_API_URL ||
      "https://api.qrserver.com/v1/create-qr-code/";
    const qrCodeUrl = `${qrApiBase}?size=300x300&data=${encodeURIComponent(sbpQrData)}`;

    return apiOk({
      paymentId,
      subId,
      amount,
      phone,
      qrCodeUrl,
      qrData: sbpQrData,
      expiresAt,
    });
  } catch (err) {
    console.error("POST /api/subscription/create error:", err);
    return apiError("Ошибка сервера", 500);
  }
}
