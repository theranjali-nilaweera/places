import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, ForbiddenError, RateLimitError, TimeoutError } from './errors'
import { HttpClient } from './httpClient'

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('HttpClient.buildUrl', () => {
  const client = new HttpClient({ baseUrl: 'https://example.test/api/' })

  it('joins the base URL and path without doubling slashes', () => {
    expect(client.buildUrl('/search')).toBe('https://example.test/api/search')
  })

  it('appends params and skips undefined ones', () => {
    const url = new URL(
      client.buildUrl('search', { q: 'melbourne', limit: 5, x: undefined }),
    )
    expect(url.searchParams.get('q')).toBe('melbourne')
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.has('x')).toBe(false)
  })
})

describe('HttpClient.getJson', () => {
  it('sends the configured headers and returns parsed JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([{ ok: true }]))
    const client = new HttpClient({
      baseUrl: 'https://example.test',
      headers: { 'User-Agent': 'pozi-test' },
      fetchFn,
    })

    const body = await client.getJson('search', { params: { q: 'x' } })

    expect(body).toEqual([{ ok: true }])
    const [, init] = fetchFn.mock.calls[0]!
    expect(init.headers).toEqual({ 'User-Agent': 'pozi-test' })
  })

  it.each([
    [429, RateLimitError],
    [403, ForbiddenError],
  ])('maps status %p to a typed error', async (status, ctor) => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('', { status }))
    const client = new HttpClient({ baseUrl: 'https://example.test', fetchFn })
    await expect(client.getJson('search')).rejects.toBeInstanceOf(ctor)
  })

  it('maps an unrecognised non-ok status to a generic ApiError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('', { status: 500 }))
    const client = new HttpClient({ baseUrl: 'https://example.test', fetchFn })
    await expect(client.getJson('search')).rejects.toBeInstanceOf(ApiError)
  })

  it('wraps invalid JSON in an ApiError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response('not json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const client = new HttpClient({ baseUrl: 'https://example.test', fetchFn })
    await expect(client.getJson('search')).rejects.toBeInstanceOf(ApiError)
  })

  it('wraps a network failure in an ApiError with the cause', async () => {
    const cause = new TypeError('Failed to fetch')
    const fetchFn = vi.fn().mockRejectedValue(cause)
    const client = new HttpClient({ baseUrl: 'https://example.test', fetchFn })
    await expect(client.getJson('search')).rejects.toMatchObject({ cause })
  })

  describe('cancellation and timeout', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('throws TimeoutError when the request outlasts timeoutMs', async () => {
      const fetchFn = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      )
      const client = new HttpClient({
        baseUrl: 'https://example.test',
        timeoutMs: 1000,
        fetchFn: fetchFn as unknown as typeof fetch,
      })

      const promise = client.getJson('search')
      const assertion = expect(promise).rejects.toBeInstanceOf(TimeoutError)
      await vi.advanceTimersByTimeAsync(1001)
      await assertion
    })

    it('propagates a caller abort unchanged (not as a timeout)', async () => {
      const controller = new AbortController()
      const fetchFn = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      )
      const client = new HttpClient({
        baseUrl: 'https://example.test',
        fetchFn: fetchFn as unknown as typeof fetch,
      })

      const promise = client.getJson('search', { signal: controller.signal })
      const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' })
      controller.abort()
      await assertion
    })
  })
})
