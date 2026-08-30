import { describe, expect, it } from 'vitest'

import { placeLinksSchema, placeSchema } from './place'

const minimalPlace = {
  id: 'node/240109189',
  name: 'Melbourne Town Hall',
  displayName: 'Melbourne Town Hall, 90-130 Swanston Street, Melbourne, VIC 3000',
  coordinates: { lat: -37.8149, lon: 144.9666 },
}

describe('placeSchema', () => {
  it('parses a minimal place and defaults links to an empty object', () => {
    const place = placeSchema.parse(minimalPlace)
    expect(place.links).toEqual({})
    expect(place.category).toBeUndefined()
  })

  it('parses a fully populated place', () => {
    const place = placeSchema.parse({
      ...minimalPlace,
      category: 'amenity',
      type: 'townhall',
      boundingBox: [-37.815, -37.814, 144.966, 144.967],
      address: { road: 'Swanston Street', city: 'Melbourne', postcode: '3000' },
      links: { website: 'https://example.com', phone: '+61 3 9658 9658' },
    })
    expect(place.links.website).toBe('https://example.com')
    expect(place.address?.city).toBe('Melbourne')
  })

  it.each([
    ['missing id', { ...minimalPlace, id: undefined }],
    ['empty name', { ...minimalPlace, name: '' }],
    ['missing coordinates', { ...minimalPlace, coordinates: undefined }],
    ['out-of-range coordinate', { ...minimalPlace, coordinates: { lat: 200, lon: 0 } }],
    ['non-string address value', { ...minimalPlace, address: { postcode: 3000 } }],
    ['malformed bounding box', { ...minimalPlace, boundingBox: [1, 2, 3] }],
  ])('rejects %s', (_label, input) => {
    expect(placeSchema.safeParse(input).success).toBe(false)
  })
})

describe('placeLinksSchema', () => {
  it('accepts an empty object', () => {
    expect(placeLinksSchema.parse({})).toEqual({})
  })

  it('rejects a non-URL website', () => {
    expect(placeLinksSchema.safeParse({ website: 'not a url' }).success).toBe(false)
  })

  it('keeps only the provided keys', () => {
    expect(placeLinksSchema.parse({ phone: '000' })).toEqual({ phone: '000' })
  })
})
