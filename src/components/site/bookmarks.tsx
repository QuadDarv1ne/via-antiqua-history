'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck, X, Trash2, BookOpen, Check, Undo2 } from 'lucide-react'
import { cn, withAlpha, getRegionColor } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export type BookmarkItem = {
  id: string
  type: 'city' | 'landmark' | 'person' | 'term' | 'wonder' | 'epoch' | 'event' | 'map-city' | 'order'
  title: string
  subtitle: string
  href: string
  region: string
}

export function createBookmarkItem(
  id: string,
  type: BookmarkItem['type'],
  title: string,
  subtitle: string,
  href: string,
  region: string,
): BookmarkItem {
  return { id, type, title, subtitle, href, region }
}

const GUEST_STORAGE_KEY = 'historical-labyrinth-bookmarks'
// Ключ хранилища привязан к пользователю, чтобы закладки одного аккаунта
// не «протекали» в другой аккаунт на том же устройстве
const storageKeyFor = (userId: string | null | undefined) =>
  userId ? `${GUEST_STORAGE_KEY}:${userId}` : GUEST_STORAGE_KEY
const TOAST_DURATION = 2000

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

const serverToItem = (row: { id: string; type: string; title: string; subtitle: string; href: string; region: string }): BookmarkItem => ({
  id: row.id,
  type: row.type as BookmarkItem['type'],
  title: row.title,
  subtitle: row.subtitle,
  href: row.href,
  region: row.region,
})

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([])
  const [hydrated, setHydrated] = React.useState(false)
  // Ключ localStorage привязан к пользователю: при смене аккаунта хранилище переключается,
  // чтобы закладки одного пользователя не «протекали» в другой аккаунт
  const storageKey = React.useMemo(
    () => storageKeyFor(user?.id),
    [user?.id],
  )
  // Ключ, из которого загружено текущее состояние bookmarks.
  // Пишем в localStorage, только если state соответствует текущему ключу.
  const [loadedForKey, setLoadedForKey] = React.useState<string>(storageKey)
  // Актуальный снимок bookmarks для логики «добавить/удалить» при быстрых кликах
  const bookmarksRef = React.useRef<BookmarkItem[]>([])

  const syncRemote = React.useCallback(
    (method: 'POST' | 'DELETE', payload: unknown) => {
      // Одна ретрай-попытка при сетевой ошибке: не теряем закладку молча
      const attempt = (retry: boolean) => {
        fetch('/api/bookmarks', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {
          if (retry) {
            setTimeout(() => attempt(false), 1500)
          } else {
            // Network error — silently ignore
          }
        })
      }
      attempt(true)
    },
    [],
  )

  // Загрузка из localStorage при монтировании и при смене пользователя
  React.useEffect(() => {
    let next: BookmarkItem[] = []
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) next = parsed
      }
    } catch {
      // Corrupted data — start fresh
    }
    setBookmarks(next)
    setLoadedForKey(storageKey)
    setHydrated(true)
  }, [storageKey])

  // Первичная загрузка: объединяем локальные закладки с серверными
  React.useEffect(() => {
    if (!hydrated) return
    if (!user) return
    const sync = async () => {
      try {
        const res = await fetch('/api/bookmarks')
        if (!res.ok) return
        const json = await res.json()
        if (json.ok && Array.isArray(json.data)) {
          const server = json.data.map(serverToItem)
          setBookmarks((local) => {
            const localIds = new Map(local.map((b) => [b.id, b]))
            for (const s of server) {
              if (!localIds.has(s.id)) {
                localIds.set(s.id, s)
              }
            }
            return [...localIds.values()]
          })
        }
      } catch {
        // Network error — silently ignore
      }
    }
    sync()
  }, [user, hydrated])

  React.useEffect(() => {
    if (!hydrated) return
    // Пишем только в хранилище текущего пользователя
    if (loadedForKey !== storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(bookmarks))
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [bookmarks, hydrated, storageKey, loadedForKey])

  const isBookmarked = React.useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  )

  React.useEffect(() => {
    bookmarksRef.current = bookmarks
  }, [bookmarks])

  const [toast, setToast] = React.useState<{ show: boolean; title: string; added: boolean }>({ show: false, title: '', added: false })
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = React.useCallback((title: string, added: boolean) => {
    setToast({ show: true, title, added })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), TOAST_DURATION)
  }, [])

  const toggle = React.useCallback((item: BookmarkItem) => {
    // Актуальное состояние из ref — защита от stale closure при быстрых кликах.
    // next вычисляется ДО setBookmarks (не внутри апдейтера), чтобы ref
    // обновлялся синхронно и без побочных эффектов в функции-апдейтере
    const exists = bookmarksRef.current.some((b) => b.id === item.id)
    const next = exists
      ? bookmarksRef.current.filter((b) => b.id !== item.id)
      : [item, ...bookmarksRef.current]
    bookmarksRef.current = next
    setBookmarks(next)
    showToast(item.title, !exists)
    if (!user) return
    if (exists) {
      syncRemote('DELETE', { ids: [item.id] })
    } else {
      syncRemote('POST', { item })
    }
  }, [showToast, user, syncRemote])

  const remove = React.useCallback((id: string) => {
    const next = bookmarksRef.current.filter((b) => b.id !== id)
    bookmarksRef.current = next
    setBookmarks(next)
    if (user) {
      syncRemote('DELETE', { ids: [id] })
    }
  }, [user, syncRemote])

  const clear = React.useCallback(() => {
    if (user && bookmarksRef.current.length > 0) {
      syncRemote('DELETE', { ids: bookmarksRef.current.map((b) => b.id) })
    }
    bookmarksRef.current = []
    setBookmarks([])
  }, [user, syncRemote])

  const value = React.useMemo(
    () => ({ bookmarks, isBookmarked, toggle, remove, clear }),
    [bookmarks, isBookmarked, toggle, remove, clear]
  )

  return (
    <BookmarksContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 z-60 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-lg"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {toast.added ? (
              <Check className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Undo2 className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium">
              {toast.added ? 'Добавлено в закладки' : 'Убрано из закладок'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
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
  'map-city': 'Город на карте',
  order: 'Архитектурный ордер',
}

// Кнопка-переключатель закладки
export const BookmarkButton = React.memo(function BookmarkButton({ item }: { item: BookmarkItem | null }) {
  const { isBookmarked, toggle } = useBookmarks()

  if (!item) return null

  const active = isBookmarked(item.id)

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(item)
      }}
      aria-label={active ? 'Убрать из закладок' : 'В закладки'}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-colors shrink-0',
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
    </motion.button>
  )
})

// Плавающая кнопка для открытия панели закладок
export function BookmarksFloatingButton({
  onClick,
}: {
  onClick: () => void
}) {
  const { bookmarks } = useBookmarks()
  const count = bookmarks.length

  return (
    <motion.button type="button"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
      onClick={onClick}
      aria-label="Закладки"
      className="bookmarks-floating-button fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-card border border-border text-foreground shadow-lg hover:shadow-xl hover:bg-accent/10 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Bookmark className="h-5 w-5" aria-hidden="true" />
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
      <DialogContent className="max-w-xl max-h-[80vh] p-0 gap-0 overflow-hidden mx-4 sm:mx-auto">
        <DialogTitle className="sr-only">Сохранённые закладки</DialogTitle>
        <div className="flex items-center justify-between px-3 sm:px-4 h-12 sm:h-14 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
            <span className="font-display text-base sm:text-lg font-semibold">
              Закладки
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              ({bookmarks.length})
            </span>
          </div>
          {bookmarks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              aria-label="Очистить все закладки"
              className="text-muted-foreground hover:text-destructive h-8 px-2 text-xs sm:text-sm"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Очистить</span>
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {bookmarks.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-2 sm:mb-3 opacity-40" aria-hidden="true" />
                <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                  У вас пока нет закладок
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground/70 max-w-xs mx-auto leading-relaxed">
                  Нажимайте на иконку закладки рядом с городом, памятником,
                  персоной или термином, чтобы сохранить их здесь.
                </p>
              </div>
            ) : (
                <div className="space-y-0.5">
                {bookmarks.map((b) => {
                  const color = getRegionColor(b.region)
                  return (
                    <div
                      key={b.id}
                      className="group flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-md hover:bg-accent/5 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleNavigate(b.href)}
                        className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0 text-left"
                      >
                        <span
                          className="shrink-0 mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md"
                          style={{
                            backgroundColor: withAlpha(color, 0.12),
                            color,
                          }}
                        >
                          <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                            <span className="font-medium text-xs sm:text-sm truncate">
                              {b.title}
                            </span>
                            <span
                              className="text-[10px] sm:text-xs uppercase tracking-wider font-medium shrink-0"
                              style={{ color }}
                            >
                              {typeLabels[b.type]}
                            </span>
                          </span>
                          <span className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 block">
                            {b.subtitle}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(b.id)}
                        aria-label="Удалить"
                        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
