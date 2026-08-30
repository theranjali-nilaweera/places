import { z } from 'zod'

import type { NominatimClient } from '../api/nominatim/nominatimClient'
import type { RateLimiter } from '../throttle'

import type {
  GeocodeQuery,
  GeocodeResult,
  GeocodingService,
} from './geocodingService.types'
import { mapNominatimResults } from './placeMapper'

/**
 * The default {@link GeocodingService}: guard the input at the boundary,
 * rate-limit the outgoing call, hit Nominatim, map the DTOs to domain `Place`s.
 * No cache by design — debounce (in the UI) plus the limiter keep us inside the
 * 1req/s policy, and every distinct query goes to the API.
 *
 * The search feature owns the richer, user-facing input schema
 * (`features/search/validators`); the boundary rule keeps `services/` from
 * importing it, so this is the minimal "is this even a query" check.
 */

/** Nominatim rejects blank queries; require a trimmed, non-trivial string. */
const queryTextSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, 'search query must not be empty'))

export interface NominatimGeocodingOptions {
  client: NominatimClient
  limiter: RateLimiter
  /** ISO country codes to bias results toward. `['au']` by default. */
  countryCodes?: string[]
  limit?: number
}

export class NominatimGeocodingService implements GeocodingService {
  private readonly client: NominatimClient
  private readonly limiter: RateLimiter
  private readonly countryCodes: string[]
  private readonly limit: number

  constructor(options: NominatimGeocodingOptions) {
    this.client = options.client
    this.limiter = options.limiter
    this.countryCodes = options.countryCodes ?? ['au']
    this.limit = options.limit ?? 5
  }

  async search(query: GeocodeQuery): Promise<GeocodeResult> {
    const text = queryTextSchema.parse(query.text)

    const results = await this.limiter.schedule(() =>
      this.client.search({
        query: text,
        countryCodes: this.countryCodes,
        limit: this.limit,
        signal: query.signal,
      }),
    )

    return {
      places: mapNominatimResults(results),
      fellBackToGlobal: false,
    }
  }
}
