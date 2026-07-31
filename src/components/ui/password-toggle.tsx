'use client'

import { Eye, EyeOff } from 'lucide-react'

interface PasswordToggleProps {
  visible: boolean
  onToggle: () => void
  className?: string
}

export function PasswordToggle({ visible, onToggle, className }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={className ?? 'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors'}
      tabIndex={-1}
      aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
    >
      {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
