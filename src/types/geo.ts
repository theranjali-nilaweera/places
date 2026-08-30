import { z } from 'zod'

/**
 * Shared geographic primitives. Every other schema that carries a coordinate or a
 * zoom level (URL params, map config, API mapping) builds on these so the bounds are
 * defined in exactly one place.
 */

/** Web-map zoom range. OSM raster tiles exist for z0–z19. */
export const MIN_ZOOM = 0
export const MAX_ZOOM = 19

export const latitudeSchema = z.number().min(-90).max(90)
export const longitudeSchema = z.number().min(-180).max(180)
export const zoomSchema = z.number().int().min(MIN_ZOOM).max(MAX_ZOOM)

export const coordinatesSchema = z.object({
  lat: latitudeSchema,
  lon: longitudeSchema,
})

export type Coordinates = z.infer<typeof coordinatesSchema>

/**
 * Bounding box as returned by geocoders, normalised to [south, north, west, east].
 * Used to frame a result on the map via `fitBounds`.
 */
export const boundingBoxSchema = z
  .tuple([latitudeSchema, latitudeSchema, longitudeSchema, longitudeSchema])
  .refine(([south, north]) => south <= north, {
    message: 'south latitude must be <= north latitude',
  })

export type BoundingBox = z.infer<typeof boundingBoxSchema>
