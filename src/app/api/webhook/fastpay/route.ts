import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/auth/db";
import { apiOk, apiError } from "@/lib/auth/api-response";
import { toSqliteDateTime } from "@/lib/utils";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

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
    if (rawBody.length === 0 || rawBody.length > MAX_WEBHOOK_BODY_BYTES) {
      return apiError("Invalid JSON body", 400);
    }
    let payload: { event: string; data: Record<string, unknown> };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return apiError("Invalid JSON body", 400);
    }
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
    console.error("FASTPAY_WEBHOOK_SECRET not configured — webhook rejected");
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
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).paymentId === "string" &&
    typeof (data as Record<string, unknown>).externalPaymentId === "string"
  );
}

/**
 * Обработка успешного платежа
 */
async function handlePaymentCompleted(data: unknown) {
  if (!isValidPaymentData(data)) {
    console.error("Invalid payment.completed payload:", data);
    return;
  }

  const db = getDb();
  const now = toSqliteDateTime(new Date());
  const expiresAt = toSqliteDateTime(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );

  const paymentData = data;

  // Ищем платеж по externalPaymentId (наш payment_id)
  const payment = db
    .prepare(
      `
    SELECT id, user_id, amount, currency, status FROM payments 
    WHERE id = ? OR external_payment_id = ?
  `,
    )
    .get(paymentData.externalPaymentId, paymentData.paymentId) as
    | {
        id: string;
        user_id: string;
        amount: number;
        currency: string;
        status: string;
      }
    | undefined;

  if (!payment) {
    console.error(
      `Payment not found: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    );
    throw new Error("Payment not found — FastPay will retry");
  }

  // Идемпотентность: повторная доставка payment.completed не должна
  // «перезаписывать» уже обработанное/возвращённое состояние
  if (payment.status === "paid") {
    console.warn(`Duplicate payment.completed for ${payment.id} — skipped`);
    return;
  }
  if (payment.status === "refunded") {
    console.error(
      `payment.completed after refund for ${payment.id} — ignored (replay or inconsistent FastPay state)`,
    );
    return;
  }

  // Сверяем сумму и валюту: подпись HMAC подтверждает отправителя,
  // но не защищает от неверной суммы в данных платежа
  const expectedAmount = payment.amount;
  const actualAmount =
    typeof paymentData.amount === "number"
      ? paymentData.amount
      : typeof paymentData.amount === "string"
        ? parseFloat(paymentData.amount)
        : NaN;
  const expectedCurrency = payment.currency || "RUB";
  const actualCurrency = (paymentData.currency as string | undefined) || "RUB";

  const amountMatches =
    Number.isFinite(actualAmount) &&
    Math.abs(actualAmount - expectedAmount) < 0.005;
  const currencyMatches = actualCurrency.toUpperCase() === expectedCurrency.toUpperCase();

  if (!amountMatches || !currencyMatches) {
    console.error(
      `Payment amount/currency mismatch for ${payment.id}: expected ${expectedAmount} ${expectedCurrency}, got ${actualAmount} ${actualCurrency}`,
    );
    throw new Error(
      "Payment amount/currency mismatch — FastPay will retry",
    );
  }

  // Обновляем статус платежа и активируем подписку атомарно.
  // Условие status = 'pending' защищает от гонки с другими вебхуками.
  const tx = db.transaction(() => {
    const paid = db
      .prepare(
        `
      UPDATE payments 
      SET status = 'paid', 
          external_payment_id = ?, 
          updated_at = ? 
      WHERE id = ? AND status = 'pending'
    `,
      )
      .run(paymentData.paymentId, now, payment.id);

    if (paid.changes === 0) {
      return;
    }

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
  });

  tx();

  // Subscription activated — extend or add webhook notifications here
}

/**
 * Обработка неудачного платежа
 */
async function handlePaymentFailed(data: unknown) {
  if (!isValidPaymentData(data)) {
    console.error("Invalid payment.failed payload:", data);
    return;
  }

  const db = getDb();
  const now = toSqliteDateTime(new Date());

  const paymentData = data;

  const payment = db
    .prepare(
      `
    SELECT id, status FROM payments 
    WHERE id = ? OR external_payment_id = ?
  `,
    )
    .get(paymentData.externalPaymentId, paymentData.paymentId) as
    | { id: string; status: string }
    | undefined;

  if (!payment) {
    console.error(
      `Payment not found: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    );
    throw new Error("Payment not found — FastPay will retry");
  }

  // Событие пришло позже успешной оплаты или возврата — состояние не трогаем
  if (payment.status === "paid" || payment.status === "refunded") {
    console.warn(
      `Stale payment.failed for ${payment.id} (status: ${payment.status}) — ignored`,
    );
    return;
  }

  db.prepare(
    `
    UPDATE payments 
    SET status = 'failed', 
        updated_at = ? 
    WHERE id = ? AND status = 'pending'
  `,
  ).run(now, payment.id);

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
    console.error("Invalid payment.refunded payload:", data);
    return;
  }

  const db = getDb();
  const now = toSqliteDateTime(new Date());

  const paymentData = data;

  // Look up the payment to get the internal ID
  const payment = db
    .prepare(
      `
    SELECT id, status FROM payments 
    WHERE id = ? OR external_payment_id = ?
  `,
    )
    .get(paymentData.externalPaymentId, paymentData.paymentId) as
    | { id: string; status: string }
    | undefined;

  if (!payment) {
    console.error(
      `Refund: payment not found: ${paymentData.externalPaymentId} / ${paymentData.paymentId}`,
    );
    throw new Error("Payment not found — FastPay will retry");
  }

  // Идемпотентность: повторный refund ничего не меняет
  if (payment.status === "refunded") {
    console.warn(`Duplicate payment.refunded for ${payment.id} — skipped`);
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
