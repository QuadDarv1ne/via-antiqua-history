import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { totp } from '../totp'
import {
  getRecoveryCodes,
  hashRecoveryCodes,
  verifySecondFactorCode,
  consumeRecoveryCode,
  hashCode,
  safeEqual,
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

  it('returns false on the second consume of the same code (single-use)', () => {
    const db = new Database(':memory:')
    db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, recovery_codes TEXT)')
    db.prepare('INSERT INTO users (id, recovery_codes) VALUES (?, ?)').run(
      'u1',
      JSON.stringify(['AAAA1111']),
    )

    expect(consumeRecoveryCode(db, 'u1', 'AAAA1111')).toBe(true)
    expect(consumeRecoveryCode(db, 'u1', 'AAAA1111')).toBe(false)
  })
})

describe('hashed recovery codes (sha256 storage)', () => {
  const codes = ['ABCD1234', 'WXYZ9876']
  const hashedRaw = JSON.stringify(hashRecoveryCodes(codes))

  it('hashRecoveryCodes не возвращает plaintext-значения', () => {
    const hashed = hashRecoveryCodes(codes)
    expect(hashed).not.toContain('ABCD1234')
    expect(hashed[0]).toMatch(/^sha256:[0-9a-f]{64}$/)
    // Детерминированность: тот же код → тот же хэш
    expect(hashRecoveryCodes(codes)).toEqual(hashed)
  })

  it('verify принимает код из хэшированного хранилища', async () => {
    const result = await verifySecondFactorCode('abcd1234', null, hashedRaw)
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('recovery')
  })

  it('verify отклоняет неизвестный код из хэшированного хранилища', async () => {
    const result = await verifySecondFactorCode('ZZZZ9999', null, hashedRaw)
    expect(result.ok).toBe(false)
  })

  it('consume находит и удаляет хэшированный код', () => {
    const db = new Database(':memory:')
    db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, recovery_codes TEXT)')
    db.prepare('INSERT INTO users (id, recovery_codes) VALUES (?, ?)').run(
      'u1',
      hashedRaw,
    )

    expect(consumeRecoveryCode(db, 'u1', 'WXYZ9876')).toBe(true)

    const stored = db
      .prepare('SELECT recovery_codes FROM users WHERE id = ?')
      .get('u1') as { recovery_codes: string }
    expect(JSON.parse(stored.recovery_codes)).toEqual([hashRecoveryCodes(['ABCD1234'])[0]])
  })
})

describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true)
  })

  it('returns false for different strings of equal length', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false)
  })

  it('returns false for different lengths (no crash)', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('', 'a')).toBe(false)
  })

  it('works with sha256 hex digests (reset-code comparison path)', () => {
    const a = hashCode('483920')
    const b = hashCode('483920')
    const c = hashCode('483921')
    expect(safeEqual(a, b)).toBe(true)
    expect(safeEqual(a, c)).toBe(false)
  })
})
