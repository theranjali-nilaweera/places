import { z } from 'zod'

/**
 * The wire shape of a single Nominatim `/search` result (`format=jsonv2`,
 * `addressdetails=1`, `extratags=1`). Only the fields the app consumes are
 * described; unknown keys are tolerated. This DTO never leaves `services/` — the
 * geocoding layer maps it to the domain `Place`.
 */

/** Nominatim sends every coordinate and id as a string. */
const numericString = z
  .string()
  .refine((s) => s.trim() !== '' && Number.isFinite(Number(s)), {
    message: 'expected a numeric string',
  })

/** `boundingbox` is `[southLat, northLat, westLon, eastLon]`, all as strings. */
export const nominatimBoundingBoxSchema = z.tuple([
  numericString,
  numericString,
  numericString,
  numericString,
])

export const nominatimResultSchema = z.object({
  place_id: z.union([z.number(), z.string()]).optional(),
  osm_type: z.enum(['node', 'way', 'relation']).optional(),
  osm_id: z.union([z.number(), z.string()]).optional(),
  lat: numericString,
  lon: numericString,
  name: z.string().optional(),
  display_name: z.string().min(1),
  category: z.string().optional(),
  type: z.string().optional(),
  boundingbox: nominatimBoundingBoxSchema.optional(),
  address: z.record(z.string(), z.string()).optional(),
  extratags: z.record(z.string(), z.string()).nullable().optional(),
})

export type NominatimResult = z.infer<typeof nominatimResultSchema>

/** The endpoint returns a bare array of results. */
export const nominatimResponseSchema = z.array(nominatimResultSchema)

export type NominatimResponse = z.infer<typeof nominatimResponseSchema>
