'use client'

import * as React from 'react'
import { Share2, Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const COPIED_DURATION = 2000

interface ShareButtonProps {
  title: string
  href?: string
  className?: string
}

export function ShareButton({ title, href, className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const shareUrl = React.useMemo(
    () => typeof window !== 'undefined' ? (href ? new URL(href, window.location.origin).href : window.location.href) : '',
    [href]
  )
  const shareData = React.useMemo(() => ({
    title,
    text: `Посмотри: ${title}`,
    url: shareUrl,
  }), [title, shareUrl])

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      window.prompt('Скопируйте ссылку вручную:', shareUrl)
      return
    }
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), COPIED_DURATION)
  }, [shareUrl])

  const socials = [
    {
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareData.text)}`,
      color: '#26A5E4',
    },
    {
      name: 'VK',
      url: `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareData.title)}`,
      color: '#0077FF',
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareUrl)}`,
      color: '#25D366',
    },
  ]

  if (!mounted) {
    return <span className="inline-block h-8 w-8" aria-hidden="true" />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0 shrink-0', className)}
          aria-label="Поделиться"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">Отправить</p>
          <div className="grid grid-cols-3 gap-1.5">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent/50 transition-colors text-xs"
                style={{ color: s.color }}
              >
                {s.name}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
              copied ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'hover:bg-accent/50'
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {copied ? 'Скопировано' : 'Копировать ссылку'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
