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
