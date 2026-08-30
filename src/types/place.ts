import { z } from 'zod'

import { boundingBoxSchema, coordinatesSchema } from './geo'

/**
 * The app's internal representation of a location. Produced by the geocoding layer
 * (`services/geocoding/placeMapper`) from whatever the provider returns, so the rest
 * of the app never sees a raw API shape.
 */

/** Curated external references shown in the place-info panel. */
export const placeLinksSchema = z.object({
  website: z.url().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
  wikidata: z.string().optional(),
})

export type PlaceLinks = z.infer<typeof placeLinksSchema>

export const placeSchema = z.object({
  /** Stable identifier from the provider, e.g. "node/12345". */
  id: z.string().min(1),
  /** Short label for the marker / popup heading. */
  name: z.string().min(1),
  /** Full human-readable address line. */
  displayName: z.string().min(1),
  coordinates: coordinatesSchema,
  /** Broad classification, e.g. "tourism", "highway". */
  category: z.string().optional(),
  /** Specific classification, e.g. "attraction", "residential". */
  type: z.string().optional(),
  boundingBox: boundingBoxSchema.optional(),
  /** Structured address parts, provider-dependent keys. */
  address: z.record(z.string(), z.string()).optional(),
  links: placeLinksSchema.default({}),
})

export type Place = z.infer<typeof placeSchema>
