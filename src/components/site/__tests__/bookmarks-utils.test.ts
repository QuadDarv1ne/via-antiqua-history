import { describe, it, expect } from 'vitest'
import {
  parseStoredBookmarks,
  mergeBookmarkLists,
  type BookmarkItem,
} from '@/components/site/bookmarks'

const item = (id: string, title = id): BookmarkItem => ({
  id,
  type: 'city',
  title,
  subtitle: `Subtitle ${id}`,
  href: '#greece',
  region: 'greece',
})

describe('parseStoredBookmarks', () => {
  it('returns [] for null/empty input', () => {
    expect(parseStoredBookmarks(null)).toEqual([])
    expect(parseStoredBookmarks('')).toEqual([])
  })

  it('returns [] for corrupted JSON', () => {
    expect(parseStoredBookmarks('{not json')).toEqual([])
    expect(parseStoredBookmarks('"string"')).toEqual([])
    expect(parseStoredBookmarks('42')).toEqual([])
  })

  it('parses a valid array', () => {
    const list = [item('a'), item('b')]
    expect(parseStoredBookmarks(JSON.stringify(list))).toEqual(list)
  })
})

describe('mergeBookmarkLists', () => {
  it('merges lists deduplicating by id (base wins)', () => {
    const base = [item('a', 'Base A'), item('b')]
    const guest = [item('a', 'Guest A'), item('c')]
    const merged = mergeBookmarkLists(base, guest)
    expect(merged.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(merged[0].title).toBe('Base A')
  })

  it('merges multiple extra lists', () => {
    const merged = mergeBookmarkLists([item('a')], [item('b')], [item('a'), item('c')])
    expect(merged.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns base unchanged when extra lists are empty', () => {
    const base = [item('a')]
    expect(mergeBookmarkLists(base, [], [])).toEqual(base)
  })
})