import type { HttpClient } from '../httpClient'

import { nominatimResponseSchema, type NominatimResult } from './nominatimResponse.schema'

/**
 * Talks to the Nominatim `/search` endpoint. Its only responsibilities are
 * building the request and validating the response against the wire schema — no
 * caching, throttling or domain mapping (those belong to the geocoding service).
 */

export interface NominatimSearchParams {
  query: string
  /** ISO country codes to bias/restrict results, e.g. `['au']`. Omit for global. */
  countryCodes?: string[]
  limit?: number
  signal?: AbortSignal
}

export const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

const DEFAULT_LIMIT = 10

export class NominatimClient {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  buildSearchParams(params: NominatimSearchParams): Record<string, string | number> {
    const search: Record<string, string | number> = {
      q: params.query,
      format: 'jsonv2',
      addressdetails: 1,
      extratags: 1,
      limit: params.limit ?? DEFAULT_LIMIT,
    }
    if (params.countryCodes?.length) {
      search.countrycodes = params.countryCodes.join(',')
    }
    return search
  }

  async search(params: NominatimSearchParams): Promise<NominatimResult[]> {
    const raw = await this.http.getJson('search', {
      params: this.buildSearchParams(params),
      signal: params.signal,
    })
    return nominatimResponseSchema.parse(raw)
  }
}
