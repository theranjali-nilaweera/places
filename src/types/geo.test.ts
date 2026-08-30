import { describe, expect, it } from 'vitest'

import {
  boundingBoxSchema,
  coordinatesSchema,
  latitudeSchema,
  longitudeSchema,
  zoomSchema,
} from './geo'

describe('latitudeSchema', () => {
  it.each([0, -90, 90, -37.8136])('accepts in-range latitude %p', (value) => {
    expect(latitudeSchema.parse(value)).toBe(value)
  })

  it.each([-90.0001, 90.0001, 1000, Number.NaN])('rejects out-of-range %p', (value) => {
    expect(latitudeSchema.safeParse(value).success).toBe(false)
  })
})

describe('longitudeSchema', () => {
  it.each([0, -180, 180, 144.9631])('accepts in-range longitude %p', (value) => {
    expect(longitudeSchema.parse(value)).toBe(value)
  })

  it.each([-180.5, 180.5, 999])('rejects out-of-range %p', (value) => {
    expect(longitudeSchema.safeParse(value).success).toBe(false)
  })
})

describe('zoomSchema', () => {
  it.each([0, 1, 19])('accepts integer zoom %p', (value) => {
    expect(zoomSchema.parse(value)).toBe(value)
  })

  it.each([-1, 20, 12.5])('rejects %p', (value) => {
    expect(zoomSchema.safeParse(value).success).toBe(false)
  })
})

describe('coordinatesSchema', () => {
  it('parses a valid pair', () => {
    expect(coordinatesSchema.parse({ lat: -37.81, lon: 144.96 })).toEqual({
      lat: -37.81,
      lon: 144.96,
    })
  })

  it('rejects a missing member', () => {
    expect(coordinatesSchema.safeParse({ lat: 0 }).success).toBe(false)
  })

  it('rejects an out-of-range member', () => {
    expect(coordinatesSchema.safeParse({ lat: 0, lon: 200 }).success).toBe(false)
  })
})

describe('boundingBoxSchema', () => {
  it('accepts a well-ordered box', () => {
    const box: [number, number, number, number] = [-38, -37, 144, 145]
    expect(boundingBoxSchema.parse(box)).toEqual(box)
  })

  it('rejects south > north', () => {
    expect(boundingBoxSchema.safeParse([-37, -38, 144, 145]).success).toBe(false)
  })

  it('rejects the wrong arity', () => {
    expect(boundingBoxSchema.safeParse([-38, -37, 144]).success).toBe(false)
  })

  it('rejects an out-of-range edge', () => {
    expect(boundingBoxSchema.safeParse([-38, -37, 144, 999]).success).toBe(false)
  })
})
