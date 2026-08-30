import { describe, expect, it } from 'vitest'

import { mapViewConfigSchema, tileUrlSchema } from './mapView.schema'

const VALID_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const validConfig = {
  center: { lat: -25.27, lon: 133.77 },
  zoom: 4,
  tileLayer: {
    url: VALID_TILE_URL,
    attribution: '&copy; OpenStreetMap contributors',
  },
}

describe('tileUrlSchema', () => {
  it('accepts an HTTPS template with {z}/{x}/{y}', () => {
    expect(tileUrlSchema.parse(VALID_TILE_URL)).toBe(VALID_TILE_URL)
  })

  it.each([
    ['http (not https)', 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'],
    ['missing {z}', 'https://tile.osm.org/{x}/{y}.png'],
    ['missing {x} and {y}', 'https://tile.osm.org/{z}.png'],
    ['no placeholders at all', 'https://tile.osm.org/tiles.png'],
    ['empty string', ''],
  ])('rejects %s', (_label, url) => {
    expect(tileUrlSchema.safeParse(url).success).toBe(false)
  })

  it('rejects a non-string', () => {
    expect(tileUrlSchema.safeParse(42).success).toBe(false)
  })
})

describe('mapViewConfigSchema', () => {
  it('parses a well-formed config', () => {
    expect(mapViewConfigSchema.parse(validConfig)).toEqual(validConfig)
  })

  it.each([
    ['latitude out of range', { ...validConfig, center: { lat: -120, lon: 133 } }],
    ['longitude out of range', { ...validConfig, center: { lat: -25, lon: 200 } }],
    ['zoom below range', { ...validConfig, zoom: -1 }],
    ['zoom above range', { ...validConfig, zoom: 25 }],
    ['non-integer zoom', { ...validConfig, zoom: 4.5 }],
    ['missing center', { zoom: 4, tileLayer: validConfig.tileLayer }],
    ['missing tileLayer', { center: validConfig.center, zoom: 4 }],
    [
      'blank attribution',
      { ...validConfig, tileLayer: { ...validConfig.tileLayer, attribution: '' } },
    ],
  ])('rejects %s', (_label, config) => {
    expect(mapViewConfigSchema.safeParse(config).success).toBe(false)
  })
})
