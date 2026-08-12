import { describe, it, expect, afterAll } from 'vitest'
import { createHmac, randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { NextRequest } from 'next/server'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fastpay-webhook-'))
process.env.DB_PATH = path.join(tmpDir, 'test.db')
process.env.FASTPAY_WEBHOOK_SECRET = 'test-webhook-secret'

const { POST } = await import('../route')
const { getDb } = await import('@/lib/auth/db')

const SECRET = 'test-webhook-secret'

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex')
}

function buildRequest(payload: unknown, signature?: string): NextRequest {
  const raw = JSON.stringify(payload)
  return new NextRequest('http://localhost/api/webhook/fastpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(signature !== undefined ? { 'X-FastPay-Signature': signature } : {}),
    },
    body: raw,
  })
}

async function seedPayment(userId: string, amount = 999) {
  const db = getDb()
  const paymentId = randomUUID()
  const subId = randomUUID()
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, `${userId}@test.local`, 'hash', 'Test User')
  db.prepare(
    `INSERT INTO payments (id, user_id, amount, currency, status, payment_method)
     VALUES (?, ?, ?, 'RUB', 'pending', 'sbp')`,
  ).run(paymentId, userId, amount)
  db.prepare(
    `INSERT INTO subscriptions (id, user_id, status, payment_id, amount, expires_at)
     VALUES (?, ?, 'pending', ?, ?, datetime('now', '+30 days'))`,
  ).run(subId, userId, paymentId, amount)
  return { paymentId, subId }
}

function paymentRow(paymentId: string) {
  return getDb()
    .prepare(`SELECT status, external_payment_id FROM payments WHERE id = ?`)
    .get(paymentId) as { status: string; external_payment_id: string | null }
}

function subscriptionRow(subId: string) {
  return getDb()
    .prepare(
      `SELECT status, expires_at FROM subscriptions WHERE id = ?`,
    )
    .get(subId) as { status: string; expires_at: string }
}

afterAll(() => {
  getDb().close()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('POST /api/webhook/fastpay', () => {
  it('rejects requests without a signature (401)', async () => {
    const res = await POST(buildRequest({ event: 'payment.completed', data: {} }))
    expect(res.status).toBe(401)
  })

  it('rejects requests with an invalid signature (401)', async () => {
    const res = await POST(
      buildRequest(
        { event: 'payment.completed', data: {} },
        'invalid-signature',
      ),
    )
    expect(res.status).toBe(401)
  })

  it('activates subscription on a valid payment.completed', async () => {
    const userId = randomUUID()
    const { paymentId, subId } = await seedPayment(userId)
    const payload = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-1',
        externalPaymentId: paymentId,
        amount: 999,
        currency: 'RUB',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('paid')
    expect(paymentRow(paymentId).external_payment_id).toBe('fastpay-1')
    expect(subscriptionRow(subId).status).toBe('active')
  })

  it('is idempotent: duplicate payment.completed does not re-extend expiry', async () => {
    const userId = randomUUID()
    const { paymentId, subId } = await seedPayment(userId)
    const payload = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-2',
        externalPaymentId: paymentId,
        amount: 999,
        currency: 'RUB',
      },
    }
    const body = JSON.stringify(payload)
    const sig = sign(body)
    await POST(buildRequest(payload, sig))
    const expiresAfterFirst = subscriptionRow(subId).expires_at
    await POST(buildRequest(payload, sig))
    expect(paymentRow(paymentId).status).toBe('paid')
    expect(subscriptionRow(subId).expires_at).toBe(expiresAfterFirst)
  })

  it('throws on amount mismatch so FastPay retries (payment stays pending)', async () => {
    const userId = randomUUID()
    const { paymentId } = await seedPayment(userId)
    const payload = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-3',
        externalPaymentId: paymentId,
        amount: 1,
        currency: 'RUB',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(500)
    expect(paymentRow(paymentId).status).toBe('pending')
  })

  it('rejects payment.completed for an unknown payment (500, retry)', async () => {
    const payload = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-4',
        externalPaymentId: 'no-such-payment',
        amount: 999,
        currency: 'RUB',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(500)
  })

  it('marks pending payment as failed on payment.failed', async () => {
    const userId = randomUUID()
    const { paymentId } = await seedPayment(userId)
    const payload = {
      event: 'payment.failed',
      data: {
        paymentId: 'fastpay-5',
        externalPaymentId: paymentId,
        reason: 'cancelled_by_user',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('failed')
  })

  it('cancels the pending subscription on payment.failed', async () => {
    const userId = randomUUID()
    const { paymentId, subId } = await seedPayment(userId)
    const payload = {
      event: 'payment.failed',
      data: {
        paymentId: 'fastpay-5b',
        externalPaymentId: paymentId,
        reason: 'expired',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('failed')
    expect(subscriptionRow(subId).status).toBe('cancelled')
  })

  it('restores a payment marked failed by cleanup when it actually completed', async () => {
    const userId = randomUUID()
    const { paymentId, subId } = await seedPayment(userId)
    const db = getDb()
    // Имитируем 30-минутную очистку из /api/subscription/create:
    // платёж и подписка помечены failed/cancelled, но пользователь оплатил QR.
    db.prepare(
      `UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE id = ?`,
    ).run(paymentId)
    db.prepare(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`,
    ).run(subId)

    const payload = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-5c',
        externalPaymentId: paymentId,
        amount: 999,
        currency: 'RUB',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('paid')
    expect(paymentRow(paymentId).external_payment_id).toBe('fastpay-5c')
    expect(subscriptionRow(subId).status).toBe('active')
  })

  it('ignores stale payment.failed after a completed payment', async () => {
    const userId = randomUUID()
    const { paymentId } = await seedPayment(userId)
    const completed = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-6',
        externalPaymentId: paymentId,
        amount: 999,
        currency: 'RUB',
      },
    }
    await POST(buildRequest(completed, sign(JSON.stringify(completed))))
    const failed = {
      event: 'payment.failed',
      data: { paymentId: 'fastpay-6', externalPaymentId: paymentId },
    }
    const res = await POST(buildRequest(failed, sign(JSON.stringify(failed))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('paid')
  })

  it('throws on payment.failed for an unknown payment (500, retry)', async () => {
    const payload = {
      event: 'payment.failed',
      data: {
        paymentId: 'fastpay-7',
        externalPaymentId: 'no-such-payment',
      },
    }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(500)
  })

  it('cancels subscription and marks refunded on payment.refunded', async () => {
    const userId = randomUUID()
    const { paymentId, subId } = await seedPayment(userId)
    const completed = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-8',
        externalPaymentId: paymentId,
        amount: 999,
        currency: 'RUB',
      },
    }
    await POST(buildRequest(completed, sign(JSON.stringify(completed))))
    const refunded = {
      event: 'payment.refunded',
      data: {
        paymentId: 'fastpay-8',
        externalPaymentId: paymentId,
        refundAmount: 999,
      },
    }
    const res = await POST(buildRequest(refunded, sign(JSON.stringify(refunded))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('refunded')
    expect(subscriptionRow(subId).status).toBe('cancelled')
  })

  it('is idempotent: duplicate payment.refunded is skipped', async () => {
    const userId = randomUUID()
    const { paymentId } = await seedPayment(userId)
    const refunded = {
      event: 'payment.refunded',
      data: {
        paymentId: 'fastpay-9',
        externalPaymentId: paymentId,
        refundAmount: 999,
      },
    }
    const body = JSON.stringify(refunded)
    const sig = sign(body)
    const first = await POST(buildRequest(refunded, sig))
    expect(first.status).toBe(200)
    const second = await POST(buildRequest(refunded, sig))
    expect(second.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('refunded')
  })

  it('ignores payment.completed after refunded (replay protection)', async () => {
    const userId = randomUUID()
    const { paymentId } = await seedPayment(userId)
    const refunded = {
      event: 'payment.refunded',
      data: {
        paymentId: 'fastpay-10',
        externalPaymentId: paymentId,
        refundAmount: 999,
      },
    }
    await POST(buildRequest(refunded, sign(JSON.stringify(refunded))))
    const replayed = {
      event: 'payment.completed',
      data: {
        paymentId: 'fastpay-10',
        externalPaymentId: paymentId,
        amount: 999,
        currency: 'RUB',
      },
    }
    const res = await POST(buildRequest(replayed, sign(JSON.stringify(replayed))))
    expect(res.status).toBe(200)
    expect(paymentRow(paymentId).status).toBe('refunded')
  })

  it('returns 200 for unknown events without changing state', async () => {
    const payload = { event: 'unknown.event', data: {} }
    const res = await POST(buildRequest(payload, sign(JSON.stringify(payload))))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})

describe('verifyWebhookSignature edge cases', () => {
  it('rejects valid signature when secret is missing', async () => {
    const saved = process.env.FASTPAY_WEBHOOK_SECRET
    delete process.env.FASTPAY_WEBHOOK_SECRET
    try {
      const payload = { event: 'payment.completed', data: {} }
      const body = JSON.stringify(payload)
      const res = await POST(buildRequest(payload, sign(body)))
      expect(res.status).toBe(401)
    } finally {
      process.env.FASTPAY_WEBHOOK_SECRET = saved
    }
  })
})