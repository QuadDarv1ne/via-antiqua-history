import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { totp } from '../totp'
import {
  getRecoveryCodes,
  verifySecondFactorCode,
  consumeRecoveryCode,
} from '../two-factor'

describe('getRecoveryCodes', () => {
  it('parses a valid JSON array of strings', () => {
    expect(getRecoveryCodes('["ABCD1234","EFGH5678"]')).toEqual([
      'ABCD1234',
      'EFGH5678',
    ])
  })

  it('returns [] for null/undefined', () => {
    expect(getRecoveryCodes(null)).toEqual([])
    expect(getRecoveryCodes(undefined)).toEqual([])
  })

  it('filters non-string entries', () => {
    expect(getRecoveryCodes('["ABCD1234", 42, null]')).toEqual(['ABCD1234'])
  })

  it('returns [] for corrupted JSON', () => {
    expect(getRecoveryCodes('not json')).toEqual([])
  })
})

describe('verifySecondFactorCode', () => {
  const secret = totp.generateSecret()
  const recoveryCodesRaw = JSON.stringify(['ABCD1234', 'WXYZ9876'])

  it('accepts a valid TOTP code', async () => {
    const epoch = Math.floor(Date.now() / 1000)
    const code = await totp.generate({ secret, epoch })
    const result = await verifySecondFactorCode(
      code,
      secret,
      recoveryCodesRaw,
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('totp')
  })

  it('rejects an invalid 6-digit TOTP code', async () => {
    const result = await verifySecondFactorCode(
      '000000',
      secret,
      recoveryCodesRaw,
    )
    expect(result.ok).toBe(false)
  })

  it('accepts a matching recovery code (case-insensitive)', async () => {
    const result = await verifySecondFactorCode(
      'abcd1234',
      secret,
      recoveryCodesRaw,
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('recovery')
  })

  it('does not throw for 8-char codes not in the list (regression: TokenLengthError)', async () => {
    const result = await verifySecondFactorCode(
      'ZZZZ9999',
      secret,
      recoveryCodesRaw,
    )
    expect(result.ok).toBe(false)
  })

  it('does not throw when secret is missing and code is not a recovery code', async () => {
    const result = await verifySecondFactorCode('123456', null, null)
    expect(result.ok).toBe(false)
  })
})

describe('consumeRecoveryCode', () => {
  it('consumes a matching recovery code and persists the list', () => {
    const db = new Database(':memory:')
    db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, recovery_codes TEXT)')
    db.prepare('INSERT INTO users (id, recovery_codes) VALUES (?, ?)').run(
      'u1',
      JSON.stringify(['AAAA1111', 'BBBB2222']),
    )

    expect(consumeRecoveryCode(db, 'u1', 'aaaa1111')).toBe(true)

    const stored = db
      .prepare('SELECT recovery_codes FROM users WHERE id = ?')
      .get('u1') as { recovery_codes: string }
    expect(JSON.parse(stored.recovery_codes)).toEqual(['BBBB2222'])
  })

  it('returns false for a non-matching code', () => {
    const db = new Database(':memory:')
    db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, recovery_codes TEXT)')
    db.prepare('INSERT INTO users (id, recovery_codes) VALUES (?, ?)').run(
      'u1',
      JSON.stringify(['AAAA1111']),
    )

    expect(consumeRecoveryCode(db, 'u1', 'ZZZZ9999')).toBe(false)
  })

  it('returns false when user has no codes', () => {
    const db = new Database(':memory:')
    db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, recovery_codes TEXT)')
    db.prepare('INSERT INTO users (id, recovery_codes) VALUES (?, NULL)').run(
      'u1',
    )

    expect(consumeRecoveryCode(db, 'u1', 'AAAA1111')).toBe(false)
  })
})
