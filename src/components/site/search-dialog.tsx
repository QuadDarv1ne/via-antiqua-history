'use client'

import * as React from 'react'
import { Search, MapPin, Landmark, BookMarked, Users, Building2, Columns3, CalendarClock, Milestone, ScrollText, MessageCircleQuestion } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  buildSearchIndex,
  searchIndex,
  findHighlightRanges,
  type SearchItem,
} from '@/lib/search'
import { cn, withAlpha, getRegionColor } from '@/lib/utils'

const typeLabels: Record<SearchItem['type'], string> = {
  city: 'Город',
  landmark: 'Памятник',
  term: 'Термин',
  person: 'Персоналия',
  'map-city': 'На карте',
  wonder: 'Чудо света',
  order: 'Ордер',
  epoch: 'Эпоха',
  event: 'Событие',
  analysis: 'Анализ',
  faq: 'Вопрос',
}

// Build index lazily on first access
let _searchIndex: SearchItem[] | null = null
function getSearchIndex(): SearchItem[] {
  if (!_searchIndex) _searchIndex = buildSearchIndex()
  return _searchIndex
}

const iconMap: Record<SearchItem['iconType'], React.ComponentType<{ className: string }>> = {
  MapPin: MapPin,
  Landmark: Landmark,
  BookMarked: BookMarked,
  Users: Users,
  Building2: Building2,
  Columns3: Columns3,
  CalendarClock: CalendarClock,
  Milestone: Milestone,
  ScrollText: ScrollText,
  MessageCircleQuestion: MessageCircleQuestion,
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [query, setQuery] = React.useState('')
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [index, setIndex] = React.useState<SearchItem[]>([])
  // Уведомление о недоступном разделе (результат ведёт за гейт подписки)
  const [blockedNotice, setBlockedNotice] = React.useState<string | null>(null)

  // Build search index lazily when dialog first opens
  React.useEffect(() => {
    if (open && index.length === 0) {
      setIndex(getSearchIndex())
    }
  }, [open, index.length])

  const { items: results, total } = React.useMemo(
    () => searchIndex(index, query),
    [query, index],
  )

  // Подсветка совпадений запроса в заголовке/подзаголовке результата
  const renderHighlighted = React.useCallback(
    (text: string, prefix: string, resultIdx: number) => {
      const ranges = findHighlightRanges(text, query)
      if (ranges.length === 0) return text
      const nodes: React.ReactNode[] = []
      let pos = 0
      ranges.forEach(([start, end], i) => {
        if (start > pos) nodes.push(text.slice(pos, start))
        nodes.push(
          <mark
            key={`${prefix}-${resultIdx}-${i}`}
            className="bg-primary/15 text-foreground rounded-[2px] px-0.5"
          >
            {text.slice(start, end)}
          </mark>,
        )
        pos = end
      })
      if (pos < text.length) nodes.push(text.slice(pos))
      return nodes
    },
    [query],
  )

  React.useEffect(() => {
    setActiveIdx(0)
    // Смена запроса снимает уведомление о недоступном разделе — оно относится
    // к предыдущему результату, а не к тому, что пользователь набирает сейчас
    setBlockedNotice(null)
  }, [query])

  // Синхронный «безопасный» индекс: не может выйти за пределы текущего
  // списка результатов (актуально между сменой query и сбросом activeIdx)
  const safeIdx =
    results.length === 0 ? 0 : Math.min(activeIdx, results.length - 1)

  // Scroll active option into view
  React.useEffect(() => {
    if (results.length === 0) return
    const el = document.getElementById(`search-result-${safeIdx}`)
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [safeIdx, results.length])

  // Clear query when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery('')
      setBlockedNotice(null)
    }
  }, [open])

  const handleSelect = React.useCallback((r: SearchItem) => {
    if (r.href) {
      const id = r.href.slice(1)
      const scrollTo = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          onOpenChange(false)
          setQuery('')
          setBlockedNotice(null)
          return true
        }
        return false
      }
      if (scrollTo()) return

      // Секции за гейтом подгружаются лениво (next/dynamic) — элемент
      // может просто ещё не успеть смонтироваться, даже если доступ есть.
      // Пробуем ещё пару раз с короткой задержкой, и только потом решаем,
      // что секция недоступна
      let attempts = 0
      const retry = window.setInterval(() => {
        attempts++
        if (scrollTo() || attempts >= 3) {
          window.clearInterval(retry)
          if (attempts >= 3 && !document.getElementById(id)) {
            setBlockedNotice(
              'Этот раздел доступен после входа в аккаунт или оформления подписки',
            )
          }
        }
      }, 300)
      return
    }
    onOpenChange(false)
    setQuery('')
    setBlockedNotice(null)
  }, [onOpenChange])

  const onKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) =>
        results.length === 0 ? 0 : Math.min(results.length - 1, i + 1),
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[safeIdx]) handleSelect(results[safeIdx])
    }
  }, [results, safeIdx, handleSelect])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden mx-4 sm:mx-auto">
        <DialogTitle className="sr-only">Поиск по сайту</DialogTitle>
        <DialogDescription className="sr-only">
          Мгновенный поиск по городам, памятникам, терминам и событиям сайта
        </DialogDescription>
        <div className="flex items-center gap-2 px-3 sm:px-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Поиск по городам, памятникам, терминам, событиям…"
            className="border-0 focus-visible:ring-2 focus-visible:ring-primary h-12 sm:h-14 text-sm sm:text-base"
            role="combobox"
            aria-expanded={query.trim().length > 0 && results.length > 0}
            aria-controls={query.trim() && results.length > 0 ? "search-results-list" : undefined}
            aria-activedescendant={results.length > 0 ? `search-result-${safeIdx}` : undefined}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-label="Поиск по сайту"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-muted/40 text-muted-foreground shrink-0">
            ESC
          </kbd>
        </div>

        {blockedNotice && (
          <div
            className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-500/30"
            role="status"
            aria-live="polite"
          >
            {blockedNotice}
          </div>
        )}

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {!query.trim() ? (
              <div className="p-5 sm:p-8 text-center">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-2 sm:mb-3 opacity-40" aria-hidden="true" />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Начните вводить запрос, чтобы найти город, памятник, термин,
                  персоналию, чудо света, эпоху или историческое событие.
                </p>
                <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                  {['Парфенон', 'Александр', 'Боспор', 'Хаммурапи', 'Зиккурат', 'Колизей', 'Висячие сады', 'Эллинизм'].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-accent/5 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-5 sm:p-8 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ничего не найдено по запросу «{query}». Попробуйте изменить
                  формулировку.
                </p>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
                  {total > results.length
                    ? `Показано ${results.length} из ${total}`
                    : `Найдено результатов: ${total}`}
                </div>
                <div id="search-results-list" role="listbox" aria-label="Результаты поиска">
                  {results.map((r, i) => {
                  const color = getRegionColor(r.region)
                  return (
                    <div
                      role="option"
                      key={r.key}
                      id={`search-result-${i}`}
                      aria-selected={safeIdx === i}
                      tabIndex={-1}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={cn(
                        'w-full text-left p-2.5 sm:p-3 rounded-md flex items-start gap-2.5 sm:gap-3 transition-colors cursor-pointer',
                        safeIdx === i
                          ? 'bg-accent/10 ring-1 ring-primary/30'
                          : 'hover:bg-accent/5'
                      )}
                    >
                      <span
                        className="shrink-0 mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: withAlpha(color, 0.12),
                          color,
                        }}
                      >
                        {React.createElement(iconMap[r.iconType], { className: 'h-3.5 w-3.5 sm:h-4 sm:w-4' })}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {renderHighlighted(r.title, 't', i)}
                          </span>
                          <span
                            className="text-[10px] sm:text-xs uppercase tracking-wider font-medium shrink-0"
                            style={{ color }}
                          >
                            {typeLabels[r.type]}
                          </span>
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 block">
                          {renderHighlighted(r.subtitle, 's', i)}
                        </span>
                      </span>
                    </div>
                  )
                })}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
