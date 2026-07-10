import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/auth/db";
import { apiOk, apiError } from "@/lib/auth/api-response";

/**
 * Вебхук для обработки платежей от FastPay Connect
 *
 * Этот endpoint должен быть указан в настройках FastPay Connect
 * для получения уведомлений о статусе платежей.
 *
 * FastPay Connect будет отправлять POST запросы на этот endpoint
 * при изменении статуса платежа.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const signature = request.headers.get("X-FastPay-Signature") || "";

    // Проверка подписи webhook (защита от поддельных запросов)
    const isValidSignature = verifyWebhookSignature(rawBody, signature);

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return apiError("Invalid signature", 401);
    }

    const { event, data } = payload;

    // Обрабатываем разные типы событий
    switch (event) {
      case "payment.completed":
        await handlePaymentCompleted(data);
        break;

      case "payment.failed":
        await handlePaymentFailed(data);
        break;

      case "payment.refunded":
        await handlePaymentRefunded(data);
        break;

      default:
        console.warn(`Unhandled webhook event: ${event}`, data);
    }

    return apiOk({ message: "Webhook processed" });
  } catch (err) {
    console.error("POST /api/webhook/fastpay error:", err);
    return apiError("Internal server error", 500);
  }
}

/**
 * Проверка подписи webhook (HMAC-SHA256)
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.FASTPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(
      "FASTPAY_WEBHOOK_SECRET not configured — webhook rejected",
    );
    return false;
  }

  try {
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (received.length !== expected.length) return false;

    return timingSafeEqual(received, expected);
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

interface PaymentData {
  paymentId: string;
  externalPaymentId: string;
  amount?: number;
  currency?: string;
  reason?: string;
  refundAmount?: number;
  metadata?: unknown;
}

function isValidPaymentData(data: unknown): data is PaymentData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).paymentId === 'string' &&
    typeof (data as Record<string, unknown>).externalPaymentId === 'string'
  );
}

/**
 * Обработка успешного платежа
 */
async function handlePaymentCompleted(data: unknown) {
  if (!isValidPaymentData(data)) {
    console.error('Invalid payment.completed payload:', data);
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const paymentData = data;

  // Ищем платеж по externalPaymentId (наш payment_id)
  const payment = db
    .prepare(
      `
    SELECT id, user_id FROM payments 
    WHERE id = ? OR external_payment_id = ?
  `,
    )
    .get(paymentData.externalPaymentId, paymentData.paymentId) as
    | {
        id: string;
        user_id: string;
      }
    | undefined;

  if (!payment) {
    console.error(
      `Payment not found: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    );
    return;
  }

  // Обновляем статус платежа и активируем подписку атомарно
  db.transaction(() => {
    db.prepare(
      `
      UPDATE payments 
      SET status = 'paid', 
          external_payment_id = ?, 
          updated_at = ? 
      WHERE id = ?
    `,
    ).run(paymentData.paymentId, now, payment.id);

    db.prepare(
      `
      UPDATE subscriptions
      SET status = 'active',
          payment_id = ?,
          updated_at = ?,
          expires_at = ?
      WHERE user_id = ? AND status = 'pending' AND payment_id = ?
    `,
    ).run(payment.id, now, expiresAt, payment.user_id, payment.id);
  })();

  console.warn(`Subscription activated for user ${payment.user_id}`);

  // Здесь можно добавить отправку email уведомления
  // или другие действия после успешной оплаты
}

/**
 * Обработка неудачного платежа
 */
async function handlePaymentFailed(data: unknown) {
  if (!isValidPaymentData(data)) {
    console.error('Invalid payment.failed payload:', data);
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();

  const paymentData = data;

  db.prepare(
    `
    UPDATE payments 
    SET status = 'failed', 
        updated_at = ? 
    WHERE id = ? OR external_payment_id = ?
  `,
  ).run(now, paymentData.externalPaymentId, paymentData.paymentId);

  console.warn(
    `Payment failed: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    { reason: paymentData.reason },
  );
}

/**
 * Обработка возврата средств
 */
async function handlePaymentRefunded(data: unknown) {
  if (!isValidPaymentData(data)) {
    console.error('Invalid payment.refunded payload:', data);
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();

  const paymentData = data;

  // Look up the payment to get the internal ID
  const payment = db
    .prepare(
      `
    SELECT id FROM payments 
    WHERE id = ? OR external_payment_id = ?
  `,
    )
    .get(paymentData.externalPaymentId, paymentData.paymentId) as
    | { id: string }
    | undefined;

  if (!payment) {
    console.error(
      `Refund: payment not found: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    );
    return;
  }

  // Обновляем статус платежа и отменяем подписку атомарно
  db.transaction(() => {
    db.prepare(
      `
      UPDATE payments 
      SET status = 'refunded', 
          updated_at = ? 
      WHERE id = ?
    `,
    ).run(now, payment.id);

    db.prepare(
      `
      UPDATE subscriptions
      SET status = 'cancelled',
          updated_at = ?
      WHERE payment_id = ? AND status = 'active'
    `,
    ).run(now, payment.id);
  })();

  console.warn(
    `Payment refunded: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    { refundAmount: paymentData.refundAmount },
  );
}
