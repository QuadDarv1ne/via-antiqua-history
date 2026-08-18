import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { REGION_COLORS } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRegionColor(region: string, fallback: string = REGION_COLORS.general): string {
  return REGION_COLORS[region] || fallback
}

export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('oklch(')) {
    return color.replace(')', ` / ${alpha})`)
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  if (color.startsWith('hsl(')) {
    return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
  }
  return color
}

export function passwordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Слабый', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Средний', color: 'bg-amber-500' }
  if (score <= 3) return { score, label: 'Хороший', color: 'bg-blue-500' }
  return { score, label: 'Отличный', color: 'bg-green-500' }
}

export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Пароль должен содержать минимум 8 символов'
  if (password.length > 128) return 'Пароль не должен превышать 128 символов'
  // bcrypt использует только первые 72 байта пароля: два пароля, совпадающие
  // в первых 72 байтах, эквивалентны для входа. Проверяем байты, а не
  // символы — кириллица в UTF-8 занимает 2 байта
  if (new TextEncoder().encode(password).length > 72) {
    return 'Пароль не должен превышать 72 байта'
  }
  if (!/[a-z]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную букву'
  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву'
  if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру'
  if (/(.)\1{2,}/.test(password)) return 'Пароль не должен содержать более 2 одинаковых символов подряд'
  return null
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email)) return 'Укажите корректный email'
  return null
}

/** Русское склонение существительного по числу: pluralRu(2, ['день','дня','дней']) → 'дня' */
export function pluralRu(
  n: number,
  labels: readonly [string, string, string],
): string {
  const abs = Math.abs(Math.trunc(n))
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return labels[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return labels[1]
  return labels[2]
}

export function getSectionGradient(opacity = 0.04): string {
  return `linear-gradient(180deg, oklch(0.55 0.1 60 / ${opacity}) 0%, transparent 100%)`
}

/** Format a Date as SQLite datetime('now')-compatible UTC string (YYYY-MM-DD HH:MM:SS). */
export function toSqliteDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/** Parse a SQLite datetime('now') UTC string as a Date. Also accepts ISO 8601 strings. Falls back to current time for invalid input. */
export function parseSqliteDateTime(value: string): Date {
  const normalized = /^\d{4}-\d{2}-\d{2}T/.test(value)
    ? value
    : value.replace(' ', 'T') + 'Z'
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}
