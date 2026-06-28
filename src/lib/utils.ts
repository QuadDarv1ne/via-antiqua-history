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
