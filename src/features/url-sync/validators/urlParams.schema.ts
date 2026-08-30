import { z } from 'zod'

import { MAX_QUERY_LENGTH } from '@/features/search/validators/searchInput.schema'
import { latitudeSchema, longitudeSchema, zoomSchema } from '@/types/geo'

/**
 * Runtime rules for the URL as an input channel. The app reads these params once
 * on load (see {@link useInitialUrlState}); nothing is written back beyond
 * clearing the `search` affordance. Precedence: a usable `search` wins and the
 * coordinate view is ignored.
 *
 * `search` is passed through verbatim (only trimmed and length-capped) — a
 * too-short value is still prefilled so the existing "keep typing" hint can do
 * its job. It is deliberately *not* run through `searchInputSchema`, which
 * rejects anything under `MIN_QUERY_LENGTH`.
 */

export interface UrlView {
  lat: number
  lon: number
  zoom: number
}

export interface UrlParams {
  search?: string
  view?: UrlView
}

const searchParamSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1).max(MAX_QUERY_LENGTH))

const coordParam = (bound: z.ZodType<number>) =>
  z.preprocess((value) => Number(value), bound)

const viewParamsSchema = z.object({
  lat: coordParam(latitudeSchema),
  lon: coordParam(longitudeSchema),
  z: coordParam(zoomSchema),
})

/** `null`, empty, or whitespace-only → treated as absent. */
function present(value: string | null): string | null {
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Parse a `location.search` string into normalised app state. Never throws —
 * anything malformed or out of range is dropped and `{}` is returned.
 */
export function parseUrlParams(search: string): UrlParams {
  const params = new URLSearchParams(search)

  const rawSearch = params.get('search')
  if (rawSearch !== null) {
    const result = searchParamSchema.safeParse(rawSearch)
    if (result.success) return { search: result.data }
  }

  const lat = present(params.get('lat'))
  const lon = present(params.get('lon'))
  const zoom = present(params.get('z'))
  if (lat !== null && lon !== null && zoom !== null) {
    const result = viewParamsSchema.safeParse({ lat, lon, z: zoom })
    if (result.success) {
      return { view: { lat: result.data.lat, lon: result.data.lon, zoom: result.data.z } }
    }
  }

  return {}
}
