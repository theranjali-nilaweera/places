import { afterEach, describe, expect, it, vi } from 'vitest'

import type { NominatimResult } from '../api/nominatim/nominatimResponse.schema'

import { mapNominatimResult, mapNominatimResults } from './placeMapper'

const full: NominatimResult = {
  place_id: 1,
  osm_type: 'way',
  osm_id: 42,
  lat: '-37.8142',
  lon: '144.9632',
  name: 'Melbourne Town Hall',
  display_name: 'Melbourne Town Hall, Swanston Street, Melbourne, VIC, Australia',
  category: 'amenity',
  type: 'townhall',
  boundingbox: ['-37.815', '-37.813', '144.962', '144.964'],
  address: { city: 'Melbourne', state: 'Victoria', country: 'Australia' },
  extratags: {
    website: 'https://melbourne.vic.gov.au',
    phone: '+61 3 9658 9658',
    opening_hours: 'Mo-Fr 08:00-17:00',
    wikidata: 'Q1817225',
  },
}

describe('mapNominatimResult', () => {
  it('maps every field on a full result', () => {
    expect(mapNominatimResult(full)).toEqual({
      id: 'way/42',
      name: 'Melbourne Town Hall',
      displayName: full.display_name,
      coordinates: { lat: -37.8142, lon: 144.9632 },
      category: 'amenity',
      type: 'townhall',
      boundingBox: [-37.815, -37.813, 144.962, 144.964],
      address: full.address,
      links: {
        website: 'https://melbourne.vic.gov.au',
        phone: '+61 3 9658 9658',
        openingHours: 'Mo-Fr 08:00-17:00',
        wikidata: 'Q1817225',
      },
    })
  })

  it('tolerates a missing extratags (null and absent)', () => {
    expect(mapNominatimResult({ ...full, extratags: null }).links).toEqual({})
    const { extratags: _drop, ...withoutTags } = full
    expect(mapNominatimResult(withoutTags).links).toEqual({})
  })

  it('tolerates a missing address', () => {
    const { address: _drop, ...withoutAddress } = full
    expect(mapNominatimResult(withoutAddress).address).toBeUndefined()
  })

  it('tolerates a missing boundingbox', () => {
    const { boundingbox: _drop, ...withoutBox } = full
    expect(mapNominatimResult(withoutBox).boundingBox).toBeUndefined()
  })

  it('drops a malformed boundingbox (south > north) instead of throwing', () => {
    expect(
      mapNominatimResult({
        ...full,
        boundingbox: ['-37.813', '-37.815', '144.962', '144.964'],
      }).boundingBox,
    ).toBeUndefined()
  })

  it('falls back to the first display_name segment when name is absent or blank', () => {
    const { name: _drop, ...noName } = full
    expect(mapNominatimResult(noName).name).toBe('Melbourne Town Hall')
    expect(mapNominatimResult({ ...full, name: '   ' }).name).toBe('Melbourne Town Hall')
  })

  it('derives an id from place_id, then coordinates, when osm fields are absent', () => {
    const { osm_type: _t, osm_id: _i, ...noOsm } = full
    expect(mapNominatimResult(noOsm).id).toBe('place/1')
    const { place_id: _p, ...noIds } = noOsm
    expect(mapNominatimResult(noIds).id).toBe('coord/-37.8142,144.9632')
  })

  it('reads website from alternative extratags keys', () => {
    expect(
      mapNominatimResult({ ...full, extratags: { 'contact:website': 'https://x.test' } })
        .links.website,
    ).toBe('https://x.test')
  })

  it('omits a website that is not a valid URL', () => {
    expect(
      mapNominatimResult({ ...full, extratags: { website: 'not a url' } }).links.website,
    ).toBeUndefined()
  })
})

describe('mapNominatimResults', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps an array in order', () => {
    const out = mapNominatimResults([full, { ...full, osm_id: 43 }])
    expect(out.map((p) => p.id)).toEqual(['way/42', 'way/43'])
  })

  it('returns [] for []', () => {
    expect(mapNominatimResults([])).toEqual([])
  })

  it('drops a row with an out-of-range coordinate and keeps the good ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = { ...full, osm_id: 99, lat: '999' } as NominatimResult
    const out = mapNominatimResults([full, bad, { ...full, osm_id: 43 }])
    expect(out.map((p) => p.id)).toEqual(['way/42', 'way/43'])
    expect(warn).toHaveBeenCalledWith(
      '[geocoding] dropped 1 of 3 Nominatim results that failed validation',
    )
  })

  it('drops a row whose address holds a non-string value', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = {
      ...full,
      osm_id: 99,
      address: { city: 'Melbourne', postcode: 3000 },
    } as unknown as NominatimResult
    const out = mapNominatimResults([bad, full])
    expect(out.map((p) => p.id)).toEqual(['way/42'])
  })

  it('returns [] and warns when every row is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = { ...full, lat: 'not-a-number' } as NominatimResult
    expect(mapNominatimResults([bad, { ...bad, osm_id: 2 }])).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      '[geocoding] dropped 2 of 2 Nominatim results that failed validation',
    )
  })

  it('does not warn when every row is valid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mapNominatimResults([full])
    expect(warn).not.toHaveBeenCalled()
  })
})
