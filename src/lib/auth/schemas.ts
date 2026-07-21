import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  password_hash: z.string(),
  email_verified: z.union([z.number(), z.boolean()]),
  totp_enabled: z.union([z.number(), z.boolean()]),
  totp_secret: z.string().nullable().optional(),
  totp_secret_expires_at: z.string().nullable().optional(),
  recovery_codes: z.string().nullable().optional(),
  password_changed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
})

export type ValidatedUser = z.infer<typeof UserSchema>

export const SessionSchema = z.object({
  userId: z.string(),
  email: z.string(),
})

export const BookmarkRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  href: z.string().optional(),
  region: z.string().optional(),
  created_at: z.string(),
})

export type ValidatedBookmarkRow = z.infer<typeof BookmarkRowSchema>

export const SubscriptionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.string(),
  payment_id: z.string().optional(),
  amount: z.number(),
  started_at: z.string(),
  expires_at: z.string(),
  updated_at: z.string().nullable().optional(),
})

export type ValidatedSubscription = z.infer<typeof SubscriptionSchema>

export const PaymentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.string(),
  external_payment_id: z.string().nullable().optional(),
})

export type ValidatedPayment = z.infer<typeof PaymentSchema>

/**
 * Safely parse SQL result with Zod schema.
 * Returns null if parsing fails (logs the error).
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context: string,
): z.infer<T> | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(`Schema validation failed (${context}):`, result.error.flatten())
    return null
  }
  return result.data
}
