'use client'

import * as React from 'react'
import { Search, MapPin, Landmark, BookMarked, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  allRegions,
  glossary,
  persons,
  mapRegions,
} from '@/lib/history-data'
import { cn, withAlpha } from '@/lib/utils'
import { REGION_COLORS } from '@/lib/constants'

type SearchResult = {
  type: 'city' | 'landmark' | 'term' | 'person' | 'map-city'
  title: string
  subtitle: string
  region: string
  href?: string
  iconType: 'MapPin' | 'Landmark' | 'BookMarked' | 'Users'
}

const typeLabels: Record<SearchResult['type'], string> = {
  city: 'Город',
  landmark: 'Памятник',
  term: 'Термин',
  person: 'Персоналия',
  'map-city': 'На карте',
}

// Build index lazily on first access
let _searchIndex: SearchResult[] | null = null
function getSearchIndex(): SearchResult[] {
  if (_searchIndex) return _searchIndex
  const items: SearchResult[] = []

  allRegions.forEach((r) => {
    r.cities.forEach((c) => {
      items.push({
        type: 'city',
        title: c.name,
        subtitle: c.summary,
        region: r.id,
        href: `#${r.id}`,
        iconType: 'MapPin',
      })
      c.landmarks.forEach((l) => {
        items.push({
          type: 'landmark',
          title: l.name,
          subtitle: `${c.name} — ${l.shortDesc}`,
          region: r.id,
          href: `#${r.id}`,
          iconType: 'Landmark',
        })
      })
    })
  })

  glossary.forEach((t) => {
    items.push({
      type: 'term',
      title: t.term,
      subtitle: t.definition,
      region: t.origin,
      href: '#glossary',
      iconType: 'BookMarked',
    })
  })

  persons.forEach((p) => {
    items.push({
      type: 'person',
      title: p.name,
      subtitle: `${p.role} · ${p.era}`,
      region: p.region,
      href: '#persons',
      iconType: 'Users',
    })
  })

  mapRegions.forEach((m) => {
    items.push({
      type: 'map-city',
      title: m.name,
      subtitle: m.description,
      region: m.region,
      href: '#map',
      iconType: 'MapPin',
    })
  })

  _searchIndex = items
  return items
}

const iconMap: Record<SearchResult['iconType'], React.ComponentType<{ className: string }>> = {
  MapPin: MapPin,
  Landmark: Landmark,
  BookMarked: BookMarked,
  Users: Users,
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
  const [index, setIndex] = React.useState<SearchResult[]>([])

  // Build search index lazily when dialog first opens
  React.useEffect(() => {
    if (open && index.length === 0) {
      setIndex(getSearchIndex())
    }
  }, [open, index.length])

  const results = React.useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return index
      .filter((r) => {
        const inTitle = r.title.toLowerCase().includes(q)
        const inSubtitle = r.subtitle.toLowerCase().includes(q)
        return inTitle || inSubtitle
      })
      .slice(0, 50)
  }, [query, index])

  React.useEffect(() => {
    setActiveIdx(0)
  }, [query])

  // Scroll active option into view
  React.useEffect(() => {
    if (results.length === 0) return
    const el = document.getElementById(`search-result-${activeIdx}`)
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIdx, results.length])

  // Clear query when dialog closes
  React.useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const handleSelect = (r: SearchResult) => {
    if (r.href) {
      const id = r.href.slice(1)
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    onOpenChange(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIdx]) handleSelect(results[activeIdx])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden mx-4 sm:mx-auto">
        <DialogTitle className="sr-only">Поиск по сайту</DialogTitle>
        <div className="flex items-center gap-2 px-3 sm:px-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Поиск по городам, памятникам, терминам…"
            className="border-0 focus-visible:ring-0 h-12 sm:h-14 text-sm sm:text-base"
            role="combobox"
            aria-expanded={query.trim().length > 0 && results.length > 0}
            aria-controls={query.trim() && results.length > 0 ? "search-results-list" : undefined}
            aria-activedescendant={results.length > 0 ? `search-result-${activeIdx}` : undefined}
            aria-label="Поиск по сайту"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-muted/40 text-muted-foreground shrink-0">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {!query.trim() ? (
              <div className="p-5 sm:p-8 text-center">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-2 sm:mb-3 opacity-40" />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Начните вводить запрос, чтобы найти город, памятник, термин
                  или исторического деятеля.
                </p>
                <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                  {['Парфенон', 'Александр', 'Боспор', 'Хаммурапи', 'Зиккурат', 'Колизей'].map((s) => (
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
                  Найдено результатов: {results.length}
                </div>
                <div id="search-results-list" role="listbox" aria-label="Результаты поиска">
                  {results.map((r, i) => {
                  const color = REGION_COLORS[r.region] || REGION_COLORS.general
                  return (
                    <button
                      type="button"
                      key={`${r.type}-${r.title}`}
                      id={`search-result-${i}`}
                      role="option"
                      aria-selected={activeIdx === i}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={cn(
                        'w-full text-left p-2.5 sm:p-3 rounded-md flex items-start gap-2.5 sm:gap-3 transition-colors',
                        activeIdx === i
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
                          <span className="font-medium text-xs sm:text-sm truncate">{r.title}</span>
                          <span
                            className="text-[10px] sm:text-xs uppercase tracking-wider font-medium shrink-0"
                            style={{ color }}
                          >
                            {typeLabels[r.type]}
                          </span>
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 block">
                          {r.subtitle}
                        </span>
                      </span>
                    </button>
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
