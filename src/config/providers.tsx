import { useMemo, type ReactNode } from 'react'

import type { GeocodingService } from '@/services/geocoding/geocodingService.types'

import { createDefaultGeocodingService, GeocodingServiceContext } from './geocoding'

/**
 * The single place the app tree is wired to its services. Consumers read the
 * geocoding service via `useGeocodingService()` (see `./geocoding`).
 */

export interface AppProvidersProps {
  children: ReactNode
  /** Override the geocoding service (tests, future provider swap). */
  service?: GeocodingService
}

export function AppProviders({ children, service }: AppProvidersProps) {
  const value = useMemo(() => service ?? createDefaultGeocodingService(), [service])
  return (
    <GeocodingServiceContext.Provider value={value}>
      {children}
    </GeocodingServiceContext.Provider>
  )
}
