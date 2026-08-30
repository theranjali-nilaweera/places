import { describe, expect, it } from 'vitest'

import {
  nominatimResponseSchema,
  nominatimResultSchema,
} from './nominatimResponse.schema'

const validResult = {
  place_id: 123,
  osm_type: 'way',
  osm_id: 456,
  lat: '-37.8142',
  lon: '144.9632',
  name: 'Melbourne Town Hall',
  display_name: 'Melbourne Town Hall, 90-130, Swanston Street, Melbourne, VIC, Australia',
  category: 'amenity',
  type: 'townhall',
  boundingbox: ['-37.815', '-37.813', '144.962', '144.964'],
  address: { city: 'Melbourne', state: 'Victoria', country: 'Australia' },
  extratags: { website: 'https://example.test', wheelchair: 'yes' },
}

describe('nominatimResultSchema', () => {
  it('accepts a fully-populated result', () => {
    expect(nominatimResultSchema.parse(validResult)).toMatchObject({
      display_name: validResult.display_name,
    })
  })

  it('accepts a minimal result (only lat/lon/display_name)', () => {
    const parsed = nominatimResultSchema.parse({
      lat: '0',
      lon: '0',
      display_name: 'Null Island',
    })
    expect(parsed.boundingbox).toBeUndefined()
    expect(parsed.address).toBeUndefined()
  })

  it('tolerates a null extratags', () => {
    expect(
      nominatimResultSchema.parse({ ...validResult, extratags: null }).extratags,
    ).toBeNull()
  })

  it('ignores unknown keys', () => {
    const parsed = nominatimResultSchema.parse({ ...validResult, importance: 0.7 })
    expect(parsed).not.toHaveProperty('importance')
  })

  it.each([
    ['missing display_name', { lat: '0', lon: '0' }],
    ['empty display_name', { lat: '0', lon: '0', display_name: '' }],
    ['non-numeric lat', { lat: 'north', lon: '0', display_name: 'x' }],
    ['empty lat string', { lat: '', lon: '0', display_name: 'x' }],
    ['numeric lat (wrong type)', { lat: 0, lon: 0, display_name: 'x' }],
    [
      'short boundingbox',
      { lat: '0', lon: '0', display_name: 'x', boundingbox: ['0', '0', '0'] },
    ],
    ['bad osm_type', { lat: '0', lon: '0', display_name: 'x', osm_type: 'planet' }],
  ])('rejects %s', (_label, payload) => {
    expect(nominatimResultSchema.safeParse(payload).success).toBe(false)
  })
})

describe('nominatimResponseSchema', () => {
  it('accepts an empty array (no matches)', () => {
    expect(nominatimResponseSchema.parse([])).toEqual([])
  })

  it('accepts an array of results', () => {
    expect(nominatimResponseSchema.parse([validResult])).toHaveLength(1)
  })

  it('rejects a non-array payload', () => {
    expect(nominatimResponseSchema.safeParse({ results: [] }).success).toBe(false)
  })

  it('rejects an array with one malformed member', () => {
    expect(nominatimResponseSchema.safeParse([validResult, { lat: '0' }]).success).toBe(
      false,
    )
  })
})
