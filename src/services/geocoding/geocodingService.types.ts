import type { Place } from '@/types/place'

/**
 * The contract the UI depends on. Any provider (Nominatim now, a self-hosted
 * instance or a commercial geocoder later) is a one-file swap in
 * `config/providers.tsx` as long as it implements this.
 */

export interface GeocodeQuery {
  /** Raw text from the search box. The service validates it. */
  text: string
  signal?: AbortSignal
}

export interface GeocodeResult {
  /** Matches, best-first. Empty when nothing was found. */
  places: Place[]
  /**
   * True when the AU-biased search found nothing and results came from a global
   * retry instead. Wired up in Phase 6; always `false` for now.
   */
  fellBackToGlobal: boolean
}

export interface GeocodingService {
  search(query: GeocodeQuery): Promise<GeocodeResult>
}
