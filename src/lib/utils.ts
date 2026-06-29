import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('oklch(')) {
    return color.replace(')', ` / ${alpha})`)
  }
  return color
}

export function passwordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Слабый', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Средний', color: 'bg-amber-500' }
  if (score <= 3) return { score, label: 'Хороший', color: 'bg-blue-500' }
  return { score, label: 'Отличный', color: 'bg-green-500' }
}
