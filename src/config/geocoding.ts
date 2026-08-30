import { createContext, useContext } from 'react'

import { HttpClient } from '@/services/api/httpClient'
import {
  NOMINATIM_BASE_URL,
  NominatimClient,
} from '@/services/api/nominatim/nominatimClient'
import { NominatimGeocodingService } from '@/services/geocoding/geocodingService'
import type { GeocodingService } from '@/services/geocoding/geocodingService.types'
import { RateLimiter } from '@/services/throttle'

import { appConfig } from './app.config'

/**
 * The geocoding wiring, kept out of `providers.tsx` so that file only exports a
 * component (React Fast Refresh constraint). Swapping the provider — self-hosted
 * Nominatim, a commercial API, a test stub — is a change to
 * `createDefaultGeocodingService` and nothing else.
 */

export const GeocodingServiceContext = createContext<GeocodingService | null>(null)

export function createDefaultGeocodingService(): GeocodingService {
  const http = new HttpClient({
    baseUrl: NOMINATIM_BASE_URL,
    // Browsers drop User-Agent; it identifies us when the client runs under Node.
    // Referer is set automatically by the browser.
    headers: {
      'User-Agent': 'pozi-map-challenge (github.com/theranjali-nilaweera/pozi)',
      Accept: 'application/json',
    },
  })
  return new NominatimGeocodingService({
    client: new NominatimClient(http),
    limiter: new RateLimiter(),
    countryCodes: appConfig.defaultCountryCodes,
    limit: appConfig.searchResultLimit,
  })
}

export function useGeocodingService(): GeocodingService {
  const service = useContext(GeocodingServiceContext)
  if (!service) {
    throw new Error('useGeocodingService must be used within <AppProviders>')
  }
  return service
}
