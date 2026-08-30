import { z } from 'zod'

import { coordinatesSchema, zoomSchema } from '@/types/geo'

/**
 * Runtime validation for the basemap config in `map.config.ts`. It builds on the
 * shared geo primitives so the coordinate/zoom bounds are defined in one place,
 * and guards the tile URL template that Leaflet will interpolate.
 */

/** A Leaflet tile URL template: HTTPS and carrying the `{z}/{x}/{y}` placeholders. */
export const tileUrlSchema = z
  .string()
  .startsWith('https://', { message: 'tile URL must be served over HTTPS' })
  .refine((url) => ['{z}', '{x}', '{y}'].every((token) => url.includes(token)), {
    message: 'tile URL must contain the {z}, {x} and {y} placeholders',
  })

export const tileLayerConfigSchema = z.object({
  url: tileUrlSchema,
  attribution: z.string().min(1, 'tile layer attribution is required'),
})

export const mapViewConfigSchema = z.object({
  center: coordinatesSchema,
  zoom: zoomSchema,
  tileLayer: tileLayerConfigSchema,
})

export type MapViewConfig = z.infer<typeof mapViewConfigSchema>
