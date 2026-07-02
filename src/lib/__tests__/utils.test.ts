import { describe, it, expect } from 'vitest'
import { cn, withAlpha, passwordStrength, validateEmail, validatePassword } from '../utils'

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
})
