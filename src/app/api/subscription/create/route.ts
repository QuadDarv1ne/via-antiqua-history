import { NextRequest } from "next/server";
import { getDb } from "@/lib/auth/db";
import { getSession } from "@/lib/auth/utils";
import { SUBSCRIPTION_PRICE, SITE_NAME } from "@/lib/constants";
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
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

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

    // Очищаем зависшие незавершённые платежи старше 30 минут.
    // НЕ используем статус 'expired': CHECK-ограничение таблицы payments
    // допускает только ('pending','paid','failed','refunded') — иначе транзакция упадёт с SQLITE_CONSTRAINT и подписку нельзя будет купить.
    db.transaction(() => {
      db.prepare(
        `
        UPDATE payments SET status = 'failed', updated_at = datetime('now')
        WHERE user_id = ? AND status = 'pending' AND created_at <= datetime('now', '-30 minutes')
      `,
      ).run(session.userId);
      db.prepare(
        `
        UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now')
        WHERE user_id = ? AND status = 'pending' AND payment_id IN (
          SELECT id FROM payments WHERE status = 'failed' AND user_id = ?
        )
      `,
      ).run(session.userId, session.userId);
    })();

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
      // Возвращаем предыдущий QR-код, а не битую заглушку
      const prev = db
        .prepare(
          "SELECT id, amount, sbp_phone, sbp_qr_data FROM payments WHERE id = ?",
        )
        .get(pendingPayment.id) as
        | {
            id: string;
            amount: number;
            sbp_phone: string | null;
            sbp_qr_data: string | null;
          }
        | undefined;

      if (prev?.sbp_qr_data) {
        const { toDataURL } = await import("qrcode");
        const qrCodeUrl = await toDataURL(prev.sbp_qr_data, {
          width: 300,
          margin: 2,
        });
        return apiOk({
          paymentId: prev.id,
          amount: prev.amount,
          phone: prev.sbp_phone || "",
          qrCodeUrl,
          qrData: prev.sbp_qr_data,
          expiresAt,
          message: "Используйте предыдущий QR-код",
        });
      }

      return apiOk({
        paymentId: pendingPayment.id,
        qrData: null,
        message: "Используйте предыдущий QR-код",
      });
    }

    const paymentId = randomUUID();
    // Единый источник цены — константа SUBSCRIPTION_PRICE (она же показывается в UI),
    // чтобы сумма в QR-коде всегда совпадала с отображаемой ценой
    const amount = SUBSCRIPTION_PRICE;
    const phone = process.env.FASTPAY_SBP_PHONE || "";

    const sbpQrData = JSON.stringify({
      type: "sbp",
      phone,
      amount,
      currency: "RUB",
      description: `Подписка «${SITE_NAME}» — образовательный контент`,
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

    const { toDataURL } = await import("qrcode");
    const qrCodeUrl = await toDataURL(sbpQrData, { width: 300, margin: 2 });

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
