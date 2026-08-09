import { describe, it, expect, afterEach, vi } from 'vitest'
import { sendPasswordResetEmail } from '../email'

const ORIGINAL_VARS = { ...process.env }

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_VARS)) delete process.env[key]
  }
  Object.assign(process.env, ORIGINAL_VARS)
})

describe('sendEmail fallback when SMTP is not configured', () => {
  it('logs instead of failing when SMTP_HOST is missing', async () => {
    delete process.env.SMTP_HOST
    process.env.EMAIL_TEST_MODE = 'false'
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const ok = await sendPasswordResetEmail('user@test.local', '123456')
      expect(ok).toBe(true)
      expect(logSpy).toHaveBeenCalled()
    } finally {
      logSpy.mockRestore()
    }
  })
})