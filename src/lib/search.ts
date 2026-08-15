import {
  allRegions,
  glossary,
  persons,
  mapRegions,
  wonders,
  architecturalOrders,
  epochs,
  timeline,
  additionalTimelineEvents,
  authorAnalysis,
} from '@/lib/history-data'
import type { TimelineEvent } from '@/lib/history-data'

export type SearchItemType =
  | 'city'
  | 'landmark'
  | 'term'
  | 'person'
  | 'map-city'
  | 'wonder'
  | 'order'
  | 'epoch'
  | 'event'
  | 'analysis'

export type SearchIconType =
  | 'MapPin'
  | 'Landmark'
  | 'BookMarked'
  | 'Users'
  | 'Building2'
  | 'Columns3'
  | 'CalendarClock'
  | 'Milestone'
  | 'ScrollText'

export type SearchItem = {
  key: string
  type: SearchItemType
  title: string
  subtitle: string
  region: string
  href: string
  iconType: SearchIconType
}

// У timeline-события может быть несколько регионов в одном году — каждый
// становится отдельным результатом поиска с заголовком «год · регион»
type TimelineRegionKey = keyof Pick<
  TimelineEvent,
  'greece' | 'rome' | 'mesopotamia' | 'kuban'
>

const TIMELINE_REGIONS: ReadonlyArray<readonly [TimelineRegionKey, string]> = [
  ['greece', 'Греция'],
  ['rome', 'Рим'],
  ['mesopotamia', 'Месопотамия'],
  ['kuban', 'Кубань'],
]

/**
 * Полный поисковый индекс всего контента: города, памятники, термины,
 * персоналии, города на карте, чудеса света, ордера, эпохи, события
 * ленты времени и эссе авторского анализа.
 *
 * Чистая функция без доступа к DOM/localStorage — можно использовать
 * и в клиентских компонентах, и в тестах.
 */
export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = []

  allRegions.forEach((r) => {
    r.cities.forEach((c) => {
      items.push({
        key: `city-${r.id}-${c.id}`,
        type: 'city',
        title: c.name,
        subtitle: c.summary,
        region: r.id,
        href: `#${r.id}`,
        iconType: 'MapPin',
      })
      c.landmarks.forEach((l) => {
        items.push({
          key: `landmark-${r.id}-${c.id}-${l.id}`,
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
      key: `term-${t.term}`,
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
      key: `person-${p.id}`,
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
      key: `map-city-${m.id}`,
      type: 'map-city',
      title: m.name,
      subtitle: m.description,
      region: m.region,
      href: '#map',
      iconType: 'MapPin',
    })
  })

  wonders.forEach((w) => {
    items.push({
      key: `wonder-${w.id}`,
      type: 'wonder',
      title: w.name,
      subtitle: `${w.location} · ${w.built}`,
      region: w.region,
      href: '#wonders',
      iconType: 'Building2',
    })
  })

  architecturalOrders.forEach((o) => {
    items.push({
      key: `order-${o.id}`,
      type: 'order',
      title: o.name,
      subtitle: o.shortDesc,
      region: 'greece',
      href: '#orders',
      iconType: 'Columns3',
    })
  })

  epochs.forEach((e) => {
    items.push({
      key: `epoch-${e.id}`,
      type: 'epoch',
      title: e.name,
      subtitle: `${e.period} — ${e.shortDesc}`,
      region: e.regions[0] ?? 'general',
      href: '#epochs',
      iconType: 'CalendarClock',
    })
  })

  // Все события ленты времени, включая дополнительные (Марафон, Коринф, Акциум)
  // — порядок как в секции ленты (по году)
  ;[...timeline, ...additionalTimelineEvents]
    .sort((a, b) => a.year - b.year)
    .forEach((ev) => {
      TIMELINE_REGIONS.forEach(([region, label]) => {
        const text = ev[region]
        if (!text) return
        items.push({
          key: `event-${ev.year}-${region}`,
          type: 'event',
          title: `${ev.yearLabel} · ${label}`,
          subtitle: text,
          region,
          href: '#timeline',
          iconType: 'Milestone',
        })
      })
    })

  authorAnalysis.sections.forEach((s) => {
    items.push({
      key: `analysis-${s.id}`,
      type: 'analysis',
      title: s.title,
      subtitle: s.thesis,
      region: 'general',
      href: '#analysis',
      iconType: 'ScrollText',
    })
  })

  return items
}

/**
 * Ранжирование результата: чем меньше очков, тем выше в выдаче.
 * Точное совпадение заголовка важнее, чем начало, а начало — чем вхождение.
 * Совпадения в подзаголовке идут после заголовочных.
 */
function scoreItem(item: SearchItem, q: string): number {
  const title = normalizeQuery(item.title)
  const subtitle = normalizeQuery(item.subtitle)
  if (title === q) return 0
  if (title.startsWith(q)) return 1
  if (title.includes(q)) return 2
  if (subtitle === q) return 3
  if (subtitle.startsWith(q)) return 4
  if (subtitle.includes(q)) return 5
  return 6
}

export type SearchResult = {
  items: SearchItem[]
  total: number
}

/**
 * Нормализация запроса для регистронезависимого поиска: нижний регистр
 * и сведение «ё» к «е» (пользователи часто печатают «мед» вместо «мёд»).
 * Замена сохраняет длину строки — индексы совпадений валидны и для оригинала.
 */
export function normalizeQuery(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е')
}

/**
 * Фильтрация индекса по запросу с ранжированием и подсчётом всех совпадений.
 *
 * - Регистронезависимо (с учётом «ё/е»); запрос разбивается на слова — каждое
 *   слово должно встретиться в заголовке или подзаголовке (многословные запросы
 *   вроде «храм артемиды» находят цель целиком, а не по частям).
 * - Результаты сортируются: точное совпадение заголовка → начало → вхождение
 *   в заголовок → подзаголовок.
 * - `items` ограничен `limit` для производительности, `total` — полное число
 *   совпадений (для честного счётчика в интерфейсе).
 */
export function searchIndex(
  index: SearchItem[],
  query: string,
  limit = 50,
): SearchResult {
  const q = normalizeQuery(query)
  if (!q) return { items: [], total: 0 }
  const tokens = q.split(/\s+/)
  const scored: { item: SearchItem; score: number }[] = []
  for (const item of index) {
    const haystack = normalizeQuery(`${item.title} ${item.subtitle}`)
    if (!tokens.every((t) => haystack.includes(t))) continue
    scored.push({ item, score: scoreItem(item, q) })
  }
  // Array.prototype.sort стабилен: внутри одной группы сохраняется
  // исходный (порядок секций сайта) порядок результатов
  scored.sort((a, b) => a.score - b.score)
  return {
    items: scored.slice(0, limit).map((s) => s.item),
    total: scored.length,
  }
}

/** Упрощённый вариант `searchIndex` — только ограниченный список результатов. */
export function searchItems(
  index: SearchItem[],
  query: string,
  limit = 50,
): SearchItem[] {
  return searchIndex(index, query, limit).items
}

/**
 * Диапазоны совпадений токенов запроса в тексте — для подсветки результатов
 * поиска. Токены ищутся регистронезависимо; пересекающиеся диапазоны
 * объединяются, чтобы не вкладывать <mark> друг в друга.
 *
 * Возвращает пары [start, end) в порядке возрастания.
 */
export function findHighlightRanges(
  text: string,
  query: string,
): Array<[number, number]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  // Нормализация сохраняет длину строки («ё»→«е»), поэтому индексы валидны
  // и для исходного текста
  const lower = normalizeQuery(text)
  const ranges: Array<[number, number]> = []
  for (const token of tokens) {
    let idx = lower.indexOf(token)
    while (idx !== -1) {
      ranges.push([idx, idx + token.length])
      idx = lower.indexOf(token, idx + 1)
    }
  }
  if (ranges.length === 0) return []
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const merged: Array<[number, number]> = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1])
    } else {
      merged.push([range[0], range[1]])
    }
  }
  return merged
}
