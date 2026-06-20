'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, Landmark, BookMarked, Users, CornerDownLeft } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { REGION_COLORS, REGION_LABELS } from '@/lib/constants'

type SearchResult = {
  type: 'city' | 'landmark' | 'term' | 'person' | 'map-city'
  title: string
  subtitle: string
  region: string
  href?: string
  icon: React.ReactNode
}

const typeLabels: Record<SearchResult['type'], string> = {
  city: 'Город',
  landmark: 'Памятник',
  term: 'Термин',
  person: 'Персоналия',
  'map-city': 'На карте',
}

function buildIndex(): SearchResult[] {
  const items: SearchResult[] = []

  allRegions.forEach((r) => {
    r.cities.forEach((c) => {
      items.push({
        type: 'city',
        title: c.name,
        subtitle: c.summary,
        region: r.id,
        href: `#${r.id}`,
        icon: <MapPin className="h-4 w-4" />,
      })
      c.landmarks.forEach((l) => {
        items.push({
          type: 'landmark',
          title: l.name,
          subtitle: `${c.name} — ${l.shortDesc}`,
          region: r.id,
          href: `#${r.id}`,
          icon: <Landmark className="h-4 w-4" />,
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
      icon: <BookMarked className="h-4 w-4" />,
    })
  })

  persons.forEach((p) => {
    items.push({
      type: 'person',
      title: p.name,
      subtitle: `${p.role} · ${p.era}`,
      region: p.region,
      href: '#persons',
      icon: <Users className="h-4 w-4" />,
    })
  })

  mapRegions.forEach((m) => {
    items.push({
      type: 'map-city',
      title: m.name,
      subtitle: m.description,
      region: m.region,
      href: '#map',
      icon: <MapPin className="h-4 w-4" />,
    })
  })

  return items
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

  const [index] = React.useState<SearchResult[]>(() => buildIndex())

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
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Поиск по сайту</DialogTitle>
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Поиск по городам, памятникам, терминам и персоналиям…"
            className="border-0 focus-visible:ring-0 h-14 text-base"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-muted/40 text-muted-foreground">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {!query.trim() ? (
              <div className="p-8 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  Начните вводить запрос, чтобы найти город, памятник, термин
                  или исторического деятеля.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                  {['Парфенон', 'Александр', 'Боспор', 'Хаммурапи', 'Зиккурат', 'Колизей'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-accent/5 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Ничего не найдено по запросу «{query}». Попробуйте изменить
                  формулировку.
                </p>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Найдено результатов: {results.length}
                </div>
                {results.map((r, i) => {
                  const color = REGION_COLORS[r.region] || REGION_COLORS.general
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={cn(
                        'w-full text-left p-3 rounded-md flex items-start gap-3 transition-colors',
                        activeIdx === i
                          ? 'bg-accent/10 ring-1 ring-primary/30'
                          : 'hover:bg-accent/5'
                      )}
                    >
                      <span
                        className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `oklch(from ${color} l c h / 0.12)`,
                          color,
                        }}
                      >
                        {r.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{r.title}</span>
                          <span
                            className="text-[10px] uppercase tracking-wider font-medium"
                            style={{ color }}
                          >
                            {typeLabels[r.type]}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 block">
                          {r.subtitle}
                        </span>
                      </span>
                      {activeIdx === i && (
                        <CornerDownLeft className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      )}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
