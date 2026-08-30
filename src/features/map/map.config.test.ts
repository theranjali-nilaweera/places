import { describe, expect, it } from 'vitest'

import { latitudeSchema, longitudeSchema } from '@/types/geo'

import { mapConfig } from './map.config'
import { mapViewConfigSchema } from './validators/mapView.schema'

describe('mapConfig', () => {
  it('satisfies the map view config schema', () => {
    expect(() => mapViewConfigSchema.parse(mapConfig)).not.toThrow()
  })

  it('centres on a valid coordinate inside the southern hemisphere (Australia)', () => {
    expect(() => latitudeSchema.parse(mapConfig.center.lat)).not.toThrow()
    expect(() => longitudeSchema.parse(mapConfig.center.lon)).not.toThrow()
    expect(mapConfig.center.lat).toBeLessThan(0)
    expect(mapConfig.center.lon).toBeGreaterThan(100)
    expect(mapConfig.center.lon).toBeLessThan(160)
  })

  it('uses a continent-framing zoom', () => {
    expect(Number.isInteger(mapConfig.zoom)).toBe(true)
    expect(mapConfig.zoom).toBeGreaterThanOrEqual(3)
    expect(mapConfig.zoom).toBeLessThanOrEqual(6)
  })

  it('points at an HTTPS OSM tile template with Leaflet placeholders', () => {
    expect(mapConfig.tileLayer.url).toMatch(/^https:\/\//)
    for (const token of ['{z}', '{x}', '{y}']) {
      expect(mapConfig.tileLayer.url).toContain(token)
    }
    expect(mapConfig.tileLayer.attribution).toMatch(/OpenStreetMap/)
  })
})
