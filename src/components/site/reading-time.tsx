'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const WORDS_PER_SECOND = 3.3
const SECONDS_PER_MINUTE = 60

interface ReadingTimeProps {
  text: string | string[]
  className?: string
}

const MINUTE_LABELS = ['минут', 'минута', 'минуты'] as const
const WORD_LABELS = ['слов', 'слово', 'слова'] as const

function pluralize(n: number, labels: readonly [string, string, string]): string {
  return labels[n % 10 === 1 && n % 100 !== 11 ? 1 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 2 : 0]
}

export function computeReadingTime(raw: string) {
  const wordCount = raw.trim() === '' ? 0 : raw.trim().split(/\s+/).length
  const minutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / (WORDS_PER_SECOND * SECONDS_PER_MINUTE)))
  return { wordCount, minutes }
}

export const ReadingTime = React.memo(function ReadingTime({ text, className }: ReadingTimeProps) {
  const raw = Array.isArray(text) ? text.join(' ') : text
  const { wordCount, minutes } = computeReadingTime(raw)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground/70',
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>
        ~{minutes} {pluralize(minutes, MINUTE_LABELS)} · {wordCount} {pluralize(wordCount, WORD_LABELS)}
      </span>
    </div>
  )
})
