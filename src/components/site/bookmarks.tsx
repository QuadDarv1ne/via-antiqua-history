'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck, X, Trash2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

export type BookmarkItem = {
  id: string // уникальный ключ — например "city:athens" или "landmark:parthenon"
  type: 'city' | 'landmark' | 'person' | 'term' | 'wonder' | 'epoch' | 'event'
  title: string
  subtitle: string
  href: string
  region: string
}

const STORAGE_KEY = 'historical-labyrinth-bookmarks'

type BookmarksContextType = {
  bookmarks: BookmarkItem[]
  isBookmarked: (id: string) => boolean
  toggle: (item: BookmarkItem) => void
  remove: (id: string) => void
  clear: () => void
}

const BookmarksContext = React.createContext<BookmarksContextType | null>(null)

export function useBookmarks() {
  const ctx = React.useContext(BookmarksContext)
  if (!ctx) {
    // Возвращаем безопасные заглушки если контекст не доступен
    return {
      bookmarks: [] as BookmarkItem[],
      isBookmarked: () => false,
      toggle: () => {},
      remove: () => {},
      clear: () => {},
    }
  }
  return ctx
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        return JSON.parse(raw)
      }
    } catch {
      // ignore
    }
    return []
  })

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      // ignore
    }
  }, [bookmarks])

  const isBookmarked = React.useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  )

  const toggle = React.useCallback((item: BookmarkItem) => {
    setBookmarks((cur) => {
      const exists = cur.some((b) => b.id === item.id)
      if (exists) {
        return cur.filter((b) => b.id !== item.id)
      }
      return [item, ...cur]
    })
  }, [])

  const remove = React.useCallback((id: string) => {
    setBookmarks((cur) => cur.filter((b) => b.id !== id))
  }, [])

  const clear = React.useCallback(() => setBookmarks([]), [])

  const value = React.useMemo(
    () => ({ bookmarks, isBookmarked, toggle, remove, clear }),
    [bookmarks, isBookmarked, toggle, remove, clear]
  )

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  )
}

const typeLabels: Record<BookmarkItem['type'], string> = {
  city: 'Город',
  landmark: 'Памятник',
  person: 'Персоналия',
  term: 'Термин',
  wonder: 'Чудо света',
  epoch: 'Эпоха',
  event: 'Событие',
}

const regionColors: Record<string, string> = {
  greece: 'oklch(0.55 0.13 70)',
  rome: 'oklch(0.55 0.13 35)',
  mesopotamia: 'oklch(0.55 0.13 50)',
  kuban: 'oklch(0.5 0.11 145)',
  egypt: 'oklch(0.6 0.1 60)',
  general: 'oklch(0.5 0.05 60)',
}

// Кнопка-переключатель закладки
export function BookmarkButton({ item }: { item: BookmarkItem }) {
  const { isBookmarked, toggle } = useBookmarks()
  const active = isBookmarked(item.id)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(item)
      }}
      aria-label={active ? 'Убрать из закладок' : 'В закладки'}
      className={cn(
        'inline-flex items-center justify-center h-9 w-9 rounded-full transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background border border-border'
      )}
    >
      {active ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  )
}

// Плавающая кнопка для открытия панели закладок
export function BookmarksFloatingButton({
  onClick,
}: {
  onClick: () => void
}) {
  const { bookmarks } = useBookmarks()
  const count = bookmarks.length

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
      onClick={onClick}
      aria-label="Закладки"
      className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-lg hover:shadow-xl hover:bg-accent/10 transition-all"
    >
      <Bookmark className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          {count}
        </span>
      )}
    </motion.button>
  )
}

// Диалог с закладками
export function BookmarksDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { bookmarks, remove, clear } = useBookmarks()

  const handleNavigate = (href: string) => {
    const id = href.slice(1)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Сохранённые закладки</DialogTitle>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">
              Закладки
            </span>
            <span className="text-xs text-muted-foreground">
              ({bookmarks.length})
            </span>
          </div>
          {bookmarks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Очистить
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {bookmarks.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground mb-2">
                  У вас пока нет закладок
                </p>
                <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                  Нажимайте на иконку закладки рядом с городом, памятником,
                  персоной или термином, чтобы сохранить их здесь.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {bookmarks.map((b) => {
                  const color = regionColors[b.region] || regionColors.general
                  return (
                    <div
                      key={b.id}
                      className="group flex items-start gap-3 p-3 rounded-md hover:bg-accent/5 transition-colors"
                    >
                      <button
                        onClick={() => handleNavigate(b.href)}
                        className="flex items-start gap-3 flex-1 min-w-0 text-left"
                      >
                        <span
                          className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-md"
                          style={{
                            backgroundColor: `oklch(from ${color} l c h / 0.12)`,
                            color,
                          }}
                        >
                          <Bookmark className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">
                              {b.title}
                            </span>
                            <span
                              className="text-[10px] uppercase tracking-wider font-medium"
                              style={{ color }}
                            >
                              {typeLabels[b.type]}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1 block">
                            {b.subtitle}
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        aria-label="Удалить"
                        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
