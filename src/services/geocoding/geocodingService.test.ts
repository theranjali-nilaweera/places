import { describe, expect, it, vi } from 'vitest'

import { RateLimitError, TimeoutError } from '../api/errors'
import type { NominatimClient } from '../api/nominatim/nominatimClient'
import { RateLimiter } from '../throttle'

import { NominatimGeocodingService } from './geocodingService'

function makeService(searchImpl: NominatimClient['search']) {
  const client = { search: vi.fn(searchImpl) } as unknown as NominatimClient
  const limiter = new RateLimiter({
    minIntervalMs: 1000,
    now: () => 0,
    sleep: vi.fn().mockResolvedValue(undefined),
  })
  const schedule = vi.spyOn(limiter, 'schedule')
  const service = new NominatimGeocodingService({ client, limiter })
  return { service, client, schedule }
}

const rawResult = {
  osm_type: 'way' as const,
  osm_id: 42,
  lat: '-37.8142',
  lon: '144.9632',
  name: 'Melbourne Town Hall',
  display_name: 'Melbourne Town Hall, Melbourne, VIC, Australia',
}

describe('NominatimGeocodingService.search', () => {
  it('validates and trims the query text before calling the client', async () => {
    const { service, client } = makeService(async () => [rawResult])
    await service.search({ text: '  melbourne town hall  ' })
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'melbourne town hall',
        countryCodes: ['au'],
        limit: 5,
      }),
    )
  })

  it.each(['', '   ', '\n\t'])(
    'rejects a blank query %j without calling the client',
    async (text) => {
      const { service, client } = makeService(async () => [])
      await expect(service.search({ text })).rejects.toThrow()
      expect(client.search).not.toHaveBeenCalled()
    },
  )

  it('routes the call through the rate limiter', async () => {
    const { service, schedule } = makeService(async () => [rawResult])
    await service.search({ text: 'melbourne' })
    expect(schedule).toHaveBeenCalledOnce()
  })

  it('maps DTOs to domain places and never leaks the raw shape', async () => {
    const { service } = makeService(async () => [rawResult])
    const { places, fellBackToGlobal } = await service.search({ text: 'melbourne' })
    expect(fellBackToGlobal).toBe(false)
    expect(places).toEqual([
      expect.objectContaining({
        id: 'way/42',
        name: 'Melbourne Town Hall',
        coordinates: { lat: -37.8142, lon: 144.9632 },
      }),
    ])
    expect(places[0]).not.toHaveProperty('display_name')
  })

  it('returns an empty list for no matches', async () => {
    const { service } = makeService(async () => [])
    await expect(service.search({ text: 'zzzzzzz' })).resolves.toEqual({
      places: [],
      fellBackToGlobal: false,
    })
  })

  it('forwards the abort signal to the client', async () => {
    const controller = new AbortController()
    const { service, client } = makeService(async () => [rawResult])
    await service.search({ text: 'melbourne', signal: controller.signal })
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it.each([
    ['rate limit', new RateLimitError()],
    ['timeout', new TimeoutError()],
  ])('propagates a %s error from the client', async (_label, error) => {
    const { service } = makeService(async () => {
      throw error
    })
    await expect(service.search({ text: 'melbourne' })).rejects.toBe(error)
  })

  it('honours custom countryCodes and limit', async () => {
    const client = { search: vi.fn(async () => []) } as unknown as NominatimClient
    const limiter = new RateLimiter({ now: () => 0, sleep: vi.fn() })
    const service = new NominatimGeocodingService({
      client,
      limiter,
      countryCodes: [],
      limit: 1,
    })
    await service.search({ text: 'paris' })
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ countryCodes: [], limit: 1 }),
    )
  })
})
