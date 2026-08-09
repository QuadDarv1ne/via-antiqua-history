import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { readJsonBody } from '../request'

function buildRequest(body: string | null): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ?? undefined,
  })
}

describe('readJsonBody', () => {
  it('parses a valid JSON object', async () => {
    const parsed = await readJsonBody(buildRequest('{"a":1,"b":"x"}'))
    expect(parsed).toEqual({ a: 1, b: 'x' })
  })

  it('returns null for an empty body', async () => {
    expect(await readJsonBody(buildRequest(null))).toBeNull()
  })

  it('returns null for malformed JSON', async () => {
    expect(await readJsonBody(buildRequest('not json'))).toBeNull()
  })

  it('returns null for non-object JSON (array/string/number)', async () => {
    expect(await readJsonBody(buildRequest('"str"'))).toBeNull()
    expect(await readJsonBody(buildRequest('42'))).toBeNull()
    expect(await readJsonBody(buildRequest('[1,2,3]'))).toBeNull()
  })

  it('returns null when Content-Length exceeds the cap', async () => {
    const req = buildRequest('{"x":"y"}')
    req.headers.set('content-length', String(300 * 1024))
    expect(await readJsonBody(req)).toBeNull()
  })

  it('returns null for a body larger than the cap', async () => {
    const big = JSON.stringify({ data: 'x'.repeat(300 * 1024) })
    expect(await readJsonBody(buildRequest(big))).toBeNull()
  })

  it('accepts bodies right at the cap boundary', async () => {
    const payload = { data: 'x'.repeat(255 * 1024) }
    const parsed = await readJsonBody(buildRequest(JSON.stringify(payload)))
    expect(parsed).toEqual(payload)
  })
})