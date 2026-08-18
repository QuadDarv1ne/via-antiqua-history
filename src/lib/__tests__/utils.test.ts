import { describe, it, expect } from 'vitest'
import { cn, withAlpha, passwordStrength, validateEmail, validatePassword, pluralRu, getSectionGradient, getRegionColor, toSqliteDateTime, parseSqliteDateTime } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })
})

describe('withAlpha', () => {
  it('adds alpha to oklch colors', () => {
    expect(withAlpha('oklch(0.5 0.1 50)', 0.12)).toBe('oklch(0.5 0.1 50 / 0.12)')
  })

  it('returns non-oklch colors unchanged', () => {
    expect(withAlpha('#fff', 0.5)).toBe('#fff')
  })
})

describe('passwordStrength', () => {
  it('returns empty for empty password', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: '', color: '' })
  })

  it('scores weak passwords', () => {
    const result = passwordStrength('short')
    expect(result.score).toBeLessThanOrEqual(1)
    expect(result.label).toBe('Слабый')
  })

  it('scores strong passwords', () => {
    const result = passwordStrength('Str0ng!Pass')
    expect(result.score).toBeGreaterThanOrEqual(4)
    expect(result.label).toBe('Отличный')
  })

  it('requires both uppercase and lowercase for case score', () => {
    const onlyUpper = passwordStrength('ABCDEFGH1!')
    const onlyLower = passwordStrength('abcdefgh1!')
    const mixed = passwordStrength('AbcdEfgh1!')
    expect(mixed.score).toBeGreaterThan(onlyUpper.score)
    expect(mixed.score).toBeGreaterThan(onlyLower.score)
  })
})

describe('validateEmail', () => {
  it('returns null for valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull()
    expect(validateEmail('test.name@domain.co')).toBeNull()
  })

  it('returns error for invalid email', () => {
    expect(validateEmail('')).not.toBeNull()
    expect(validateEmail('notanemail')).not.toBeNull()
    expect(validateEmail('@domain.com')).not.toBeNull()
    expect(validateEmail('user@')).not.toBeNull()
    expect(validateEmail('user @example.com')).not.toBeNull()
  })
})

describe('validatePassword', () => {
  it('returns null for valid password', () => {
    expect(validatePassword('MyP4ssw0rd')).toBeNull()
    expect(validatePassword('Str0ng!Pass')).toBeNull()
  })

  it('requires minimum 8 characters', () => {
    expect(validatePassword('Ab1')).toContain('8 символов')
    expect(validatePassword('Abcdef1')).toContain('8 символов')
  })

  it('requires at least one lowercase letter', () => {
    expect(validatePassword('12345678')).toContain('строчную')
    expect(validatePassword('ABCDEFGH1')).toContain('строчную')
  })

  it('requires at least one uppercase letter', () => {
    expect(validatePassword('abcdefgh1')).toContain('заглавную')
    expect(validatePassword('abc12345')).toContain('заглавную')
  })

  it('requires at least one digit', () => {
    expect(validatePassword('Abcdefgh')).toContain('цифру')
    expect(validatePassword('AbcdEfgH')).toContain('цифру')
  })

  it('rejects passwords with 3+ repeated characters', () => {
    expect(validatePassword('Aabbb1cd')).toContain('одинаковых символов')
    expect(validatePassword('Ab1111ef')).toContain('одинаковых символов')
  })

  it('allows passwords with 2 repeated characters', () => {
    expect(validatePassword('Aabb1cde')).toBeNull()
  })

  it('rejects passwords longer than 128 characters', () => {
    expect(validatePassword('A'.repeat(130) + '1')).toContain('128 символов')
  })

  it('rejects passwords exceeding 72 bytes (bcrypt truncation)', () => {
    // 73 символа «а» в UTF-8 = 146 байт — bcrypt молча обрезал бы пароль,
    // сделав эквивалентными пароли с одинаковыми первыми 72 байтами
    const multibyte = 'А'.repeat(37) + 'b1' // 74 байта
    expect(new TextEncoder().encode(multibyte).length).toBeGreaterThan(72)
    expect(validatePassword(multibyte)).toContain('72 байта')
  })

  it('allows passwords up to 72 bytes', () => {
    const ascii = 'Ab1'.repeat(10) + 'B1' // 32 байта, без троек подряд
    expect(validatePassword(ascii)).toBeNull()
    // 71 байт без троек подряд: 'Ab1' * 23 (69 байт) + 'Xy'
    const boundary = 'Ab1'.repeat(23) + 'Xy'
    expect(boundary.length).toBe(71)
    expect(new TextEncoder().encode(boundary).length).toBe(71)
    expect(validatePassword(boundary)).toBeNull()
  })
})

describe('pluralRu', () => {
  const DAYS = ['день', 'дня', 'дней'] as const

  it('picks the one form', () => {
    expect(pluralRu(1, DAYS)).toBe('день')
    expect(pluralRu(21, DAYS)).toBe('день')
    expect(pluralRu(101, DAYS)).toBe('день')
  })

  it('picks the few form', () => {
    expect(pluralRu(2, DAYS)).toBe('дня')
    expect(pluralRu(3, DAYS)).toBe('дня')
    expect(pluralRu(24, DAYS)).toBe('дня')
  })

  it('picks the many form', () => {
    expect(pluralRu(5, DAYS)).toBe('дней')
    expect(pluralRu(11, DAYS)).toBe('дней')
    expect(pluralRu(12, DAYS)).toBe('дней')
    expect(pluralRu(25, DAYS)).toBe('дней')
    expect(pluralRu(100, DAYS)).toBe('дней')
  })

  it('handles zero and fractional values', () => {
    expect(pluralRu(0, DAYS)).toBe('дней')
    expect(pluralRu(1.4, DAYS)).toBe('день')
  })
})

describe('getSectionGradient', () => {
  it('returns a linear-gradient string', () => {
    expect(getSectionGradient()).toContain('linear-gradient')
  })

  it('uses the default opacity of 0.04', () => {
    const result = getSectionGradient()
    expect(result).toContain('0.04')
  })

  it('accepts custom opacity', () => {
    const result = getSectionGradient(0.1)
    expect(result).toContain('0.1')
  })
})

describe('getRegionColor', () => {
  it('returns color from REGION_COLORS for known region', () => {
    const result = getRegionColor('greece')
    expect(result).toBeTruthy()
    expect(result).toMatch(/^oklch\(/)
  })

  it('returns fallback for unknown region', () => {
    const result = getRegionColor('unknown', '#ff0000')
    expect(result).toBe('#ff0000')
  })

  it('returns general color for unknown region without fallback', () => {
    const result = getRegionColor('unknown')
    expect(result).toMatch(/^oklch\(/)
  })
})

describe('toSqliteDateTime', () => {
  it('formats a Date as SQLite-compatible UTC string', () => {
    expect(toSqliteDateTime(new Date('2026-07-31T15:15:00.000Z'))).toBe(
      '2026-07-31 15:15:00',
    )
  })

  it('produces datetime(now)-comparable format', () => {
    const value = toSqliteDateTime(new Date())
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('strips milliseconds and timezone suffix', () => {
    expect(toSqliteDateTime(new Date('2026-01-02T03:04:05.678Z'))).toBe(
      '2026-01-02 03:04:05',
    )
  })
})

describe('parseSqliteDateTime', () => {
  it('parses SQLite UTC strings as UTC, not local time', () => {
    const parsed = parseSqliteDateTime('2026-07-31 15:15:00')
    expect(parsed.toISOString()).toBe('2026-07-31T15:15:00.000Z')
  })

  it('round-trips with toSqliteDateTime', () => {
    const original = new Date('2026-01-02T03:04:05.000Z')
    expect(parseSqliteDateTime(toSqliteDateTime(original)).toISOString()).toBe(
      original.toISOString(),
    )
  })

  it('also accepts ISO 8601 strings', () => {
    expect(parseSqliteDateTime('2026-07-31T15:15:00.000Z').toISOString()).toBe(
      '2026-07-31T15:15:00.000Z',
    )
  })

  it('returns current time for invalid input instead of Invalid Date', () => {
    const before = Date.now()
    const parsed = parseSqliteDateTime('not-a-date')
    expect(parsed.getTime()).toBeGreaterThanOrEqual(before)
    expect(Number.isNaN(parsed.getTime())).toBe(false)
  })
})
