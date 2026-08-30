import { render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { GeocodingService } from '@/services/geocoding/geocodingService.types'

import { createDefaultGeocodingService, useGeocodingService } from './geocoding'
import { AppProviders } from './providers'

describe('createDefaultGeocodingService', () => {
  it('builds a service exposing search()', () => {
    const service = createDefaultGeocodingService()
    expect(typeof service.search).toBe('function')
  })
})

describe('useGeocodingService', () => {
  it('throws when used outside <AppProviders>', () => {
    expect(() => renderHook(() => useGeocodingService())).toThrow(/AppProviders/)
  })

  it('returns the injected service when one is provided', () => {
    const stub: GeocodingService = { search: vi.fn() }
    const { result } = renderHook(() => useGeocodingService(), {
      wrapper: ({ children }) => <AppProviders service={stub}>{children}</AppProviders>,
    })
    expect(result.current).toBe(stub)
  })

  it('provides a default service when none is injected', () => {
    function Probe() {
      const service = useGeocodingService()
      return <span>{typeof service.search}</span>
    }
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    )
    expect(screen.getByText('function')).toBeInTheDocument()
  })
})
