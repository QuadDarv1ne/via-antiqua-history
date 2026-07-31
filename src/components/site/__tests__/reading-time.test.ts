import { describe, it, expect } from 'vitest'
import { computeReadingTime } from '../reading-time'

describe('computeReadingTime', () => {
  it('returns 0 minutes and 0 words for empty string', () => {
    const result = computeReadingTime('')
    expect(result.minutes).toBe(0)
    expect(result.wordCount).toBe(0)
  })

  it('counts a single word', () => {
    const result = computeReadingTime('Привет')
    expect(result.wordCount).toBe(1)
  })

  it('counts multiple words', () => {
    const result = computeReadingTime('Афины великий город')
    expect(result.wordCount).toBe(3)
  })

  it('counts ~400 words as ~3 minutes', () => {
    const text = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ')
    const result = computeReadingTime(text)
    expect(result.wordCount).toBe(400)
    expect(result.minutes).toBe(3)
  })

  it('handles text with extra whitespace', () => {
    const result = computeReadingTime('  hello   world  ')
    expect(result.wordCount).toBe(2)
  })

  it('returns at least 1 minute for any content', () => {
    const result = computeReadingTime('a')
    expect(result.minutes).toBe(1)
  })

  it('handles very large text proportionally', () => {
    const text = Array.from({ length: 2000 }, (_, i) => `word${i}`).join(' ')
    const result = computeReadingTime(text)
    expect(result.wordCount).toBe(2000)
    expect(result.minutes).toBe(11)
  })
})