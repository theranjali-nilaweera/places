import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError, RateLimitError, TimeoutError } from '@/services/api/errors'
import type { GeocodingService } from '@/services/geocoding/geocodingService.types'
import type { Place } from '@/types/place'

import { messageForError, useGeocodeSearch } from './useGeocodeSearch'

const place: Place = {
  id: 'way/42',
  name: 'Melbourne Town Hall',
  displayName: 'Melbourne Town Hall, Melbourne, VIC, Australia',
  coordinates: { lat: -37.8142, lon: 144.9632 },
  links: {},
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('messageForError', () => {
  it.each([new RateLimitError(), new ForbiddenError(), new TimeoutError()])(
    'passes through the message of a typed ApiError',
    (error) => {
      expect(messageForError(error)).toBe(error.message)
    },
  )

  it('returns a generic message for an unknown throwable', () => {
    expect(messageForError(new Error('kaboom'))).toMatch(/went wrong/i)
  })
})

describe('useGeocodeSearch', () => {
  it('starts idle', () => {
    const service: GeocodingService = { search: vi.fn() }
    const { result } = renderHook(() => useGeocodeSearch(service))
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('rejects invalid input without calling the service', () => {
    const service: GeocodingService = { search: vi.fn() }
    const { result } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('ab'))

    expect(service.search).not.toHaveBeenCalled()
    expect(result.current.state).toMatchObject({ status: 'error' })
  })

  it('goes loading → success and passes the trimmed query to the service', async () => {
    const service: GeocodingService = {
      search: vi.fn().mockResolvedValue({ places: [place], fellBackToGlobal: false }),
    }
    const { result } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('  melbourne town hall  '))
    expect(result.current.state).toEqual({
      status: 'loading',
      query: 'melbourne town hall',
    })

    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(result.current.state).toMatchObject({ status: 'success', places: [place] })
    expect(service.search).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'melbourne town hall' }),
    )
  })

  it('reports an empty result set distinctly from success', async () => {
    const service: GeocodingService = {
      search: vi.fn().mockResolvedValue({ places: [], fellBackToGlobal: false }),
    }
    const { result } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('nowhere at all'))
    await waitFor(() => expect(result.current.state.status).toBe('empty'))
  })

  it.each([
    ['rate limit', new RateLimitError()],
    ['forbidden', new ForbiddenError()],
    ['timeout', new TimeoutError()],
  ])('maps a %s failure to an error state with its message', async (_label, error) => {
    const service: GeocodingService = { search: vi.fn().mockRejectedValue(error) }
    const { result } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('melbourne'))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    expect(result.current.state).toMatchObject({
      status: 'error',
      message: error.message,
    })
  })

  it('aborts the previous request when a new search starts', async () => {
    const first = deferred<{ places: Place[]; fellBackToGlobal: boolean }>()
    const signals: AbortSignal[] = []
    const service: GeocodingService = {
      search: vi.fn().mockImplementation(({ signal }: { signal: AbortSignal }) => {
        signals.push(signal)
        return signals.length === 1
          ? first.promise
          : Promise.resolve({ places: [place], fellBackToGlobal: false })
      }),
    }
    const { result } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('first query'))
    act(() => result.current.search('second query'))

    expect(signals[0]!.aborted).toBe(true)

    // Late resolution of the superseded request must not clobber the state.
    await act(async () => {
      first.resolve({ places: [], fellBackToGlobal: false })
    })
    await waitFor(() =>
      expect(result.current.state).toMatchObject({ query: 'second query' }),
    )
    expect(result.current.state.status).toBe('success')
  })

  it('reset() cancels in-flight work and returns to idle', async () => {
    const pending = deferred<{ places: Place[]; fellBackToGlobal: boolean }>()
    let captured: AbortSignal | undefined
    const service: GeocodingService = {
      search: vi.fn().mockImplementation(({ signal }: { signal: AbortSignal }) => {
        captured = signal
        return pending.promise
      }),
    }
    const { result } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('melbourne'))
    act(() => result.current.reset())

    expect(captured?.aborted).toBe(true)
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('aborts a pending request on unmount', () => {
    const pending = deferred<{ places: Place[]; fellBackToGlobal: boolean }>()
    let captured: AbortSignal | undefined
    const service: GeocodingService = {
      search: vi.fn().mockImplementation(({ signal }: { signal: AbortSignal }) => {
        captured = signal
        return pending.promise
      }),
    }
    const { result, unmount } = renderHook(() => useGeocodeSearch(service))

    act(() => result.current.search('melbourne'))
    unmount()
    expect(captured?.aborted).toBe(true)
  })
})
