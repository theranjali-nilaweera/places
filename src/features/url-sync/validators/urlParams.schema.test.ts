import { describe, expect, it } from 'vitest'

import { MAX_QUERY_LENGTH } from '@/features/search/validators/searchInput.schema'

import { parseUrlParams } from './urlParams.schema'

describe('parseUrlParams', () => {
  it('returns nothing for an empty query string', () => {
    expect(parseUrlParams('')).toEqual({})
  })

  it('ignores unknown params', () => {
    expect(parseUrlParams('?foo=bar&baz=1')).toEqual({})
  })

  describe('search', () => {
    it('reads and trims a normal value', () => {
      expect(parseUrlParams('?search=%20Melbourne%20Town%20Hall%20')).toEqual({
        search: 'Melbourne Town Hall',
      })
    })

    it('treats an empty value as absent', () => {
      expect(parseUrlParams('?search=')).toEqual({})
    })

    it('treats a whitespace-only value as absent', () => {
      expect(parseUrlParams('?search=%20%20%20')).toEqual({})
    })

    it('keeps a 1-2 character value verbatim (hint is the UI’s job)', () => {
      expect(parseUrlParams('?search=Me')).toEqual({ search: 'Me' })
    })

    it('ignores a value past the maximum length', () => {
      const long = 'a'.repeat(MAX_QUERY_LENGTH + 1)
      expect(parseUrlParams(`?search=${long}`)).toEqual({})
    })

    it('keeps a value at exactly the maximum length', () => {
      const max = 'a'.repeat(MAX_QUERY_LENGTH)
      expect(parseUrlParams(`?search=${max}`)).toEqual({ search: max })
    })
  })

  describe('coordinate view', () => {
    it('reads a full lat/lon/z view', () => {
      expect(parseUrlParams('?lat=-37.8136&lon=144.9631&z=15')).toEqual({
        view: { lat: -37.8136, lon: 144.9631, zoom: 15 },
      })
    })

    it('drops the view when z is missing', () => {
      expect(parseUrlParams('?lat=-37.8136&lon=144.9631')).toEqual({})
    })

    it('drops the view when only lat is present', () => {
      expect(parseUrlParams('?lat=-37.8136')).toEqual({})
    })

    it('drops the view when a coord is empty', () => {
      expect(parseUrlParams('?lat=-37.8&lon=&z=15')).toEqual({})
    })

    it('drops the view when a coord is non-numeric', () => {
      expect(parseUrlParams('?lat=abc&lon=144.96&z=15')).toEqual({})
    })

    it.each([
      ['lat out of range', '?lat=91&lon=144.96&z=15'],
      ['lon out of range', '?lat=-37.8&lon=181&z=15'],
      ['zoom out of range', '?lat=-37.8&lon=144.96&z=25'],
      ['zoom not an integer', '?lat=-37.8&lon=144.96&z=12.5'],
    ])('drops the view when %s', (_label, query) => {
      expect(parseUrlParams(query)).toEqual({})
    })

    it('accepts boundary coordinates', () => {
      expect(parseUrlParams('?lat=-90&lon=180&z=0')).toEqual({
        view: { lat: -90, lon: 180, zoom: 0 },
      })
    })
  })

  describe('precedence', () => {
    it('prefers a usable search over a coordinate view', () => {
      expect(parseUrlParams('?search=Sydney&lat=-37.8&lon=144.96&z=15')).toEqual({
        search: 'Sydney',
      })
    })

    it('falls back to the view when search is present but unusable', () => {
      expect(parseUrlParams('?search=&lat=-37.8&lon=144.96&z=15')).toEqual({
        view: { lat: -37.8, lon: 144.96, zoom: 15 },
      })
    })
  })
})
