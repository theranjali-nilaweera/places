import { describe, expect, it, vi } from 'vitest'

import { HttpClient } from '../httpClient'

import { NominatimClient } from './nominatimClient'

function clientWith(body: unknown) {
  const fetchFn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
  const http = new HttpClient({ baseUrl: 'https://nominatim.test', fetchFn })
  return { nominatim: new NominatimClient(http), fetchFn }
}

const result = {
  lat: '-37.8142',
  lon: '144.9632',
  display_name: 'Melbourne Town Hall, Melbourne, VIC, Australia',
}

describe('NominatimClient.buildSearchParams', () => {
  const { nominatim } = clientWith([])

  it('sets the required fixed params', () => {
    expect(nominatim.buildSearchParams({ query: 'melbourne' })).toMatchObject({
      q: 'melbourne',
      format: 'jsonv2',
      addressdetails: 1,
      extratags: 1,
      limit: 10,
    })
  })

  it('joins countryCodes into a comma list', () => {
    expect(
      nominatim.buildSearchParams({ query: 'x', countryCodes: ['au', 'nz'] })
        .countrycodes,
    ).toBe('au,nz')
  })

  it('omits countrycodes when none are given', () => {
    expect(nominatim.buildSearchParams({ query: 'x' })).not.toHaveProperty('countrycodes')
  })

  it('honours an explicit limit', () => {
    expect(nominatim.buildSearchParams({ query: 'x', limit: 1 }).limit).toBe(1)
  })
})

describe('NominatimClient.search', () => {
  it('sends the built query string', async () => {
    const { nominatim, fetchFn } = clientWith([result])
    await nominatim.search({ query: 'melbourne', countryCodes: ['au'] })
    const url = new URL(fetchFn.mock.calls[0]![0] as string)
    expect(url.pathname).toBe('/search')
    expect(url.searchParams.get('q')).toBe('melbourne')
    expect(url.searchParams.get('format')).toBe('jsonv2')
    expect(url.searchParams.get('countrycodes')).toBe('au')
  })

  it('returns the validated results', async () => {
    const { nominatim } = clientWith([result])
    const out = await nominatim.search({ query: 'melbourne' })
    expect(out).toHaveLength(1)
    expect(out[0]!.display_name).toBe(result.display_name)
  })

  it('returns [] for no matches', async () => {
    const { nominatim } = clientWith([])
    await expect(nominatim.search({ query: 'zzzz' })).resolves.toEqual([])
  })

  it('throws when the payload does not match the wire schema', async () => {
    const { nominatim } = clientWith([{ lat: '0' }])
    await expect(nominatim.search({ query: 'x' })).rejects.toThrow()
  })

  it('forwards the abort signal to the http layer', async () => {
    const controller = new AbortController()
    const fetchFn = vi
      .fn()
      .mockImplementation(
        (_url, init: RequestInit) =>
          new Promise((_res, rej) =>
            init.signal?.addEventListener('abort', () =>
              rej(new DOMException('Aborted', 'AbortError')),
            ),
          ),
      )
    const http = new HttpClient({ baseUrl: 'https://nominatim.test', fetchFn })
    const nominatim = new NominatimClient(http)
    const promise = nominatim.search({ query: 'x', signal: controller.signal })
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
  })
})
