import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/services/api/errors'
import type { GeocodingService } from '@/services/geocoding/geocodingService.types'
import type { Place } from '@/types/place'

import { validateSearchInput } from '../validators/searchInput.schema'

/**
 * Drives one geocode search: input validation, loading / error / empty / success
 * states, and cancellation of a superseded request. The `GeocodingService` is
 * injected (the app passes the one from context) so the hook stays testable.
 */

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | {
      status: 'success'
      query: string
      places: Place[]
      fellBackToGlobal: boolean
    }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; message: string }

export interface UseGeocodeSearch {
  state: SearchState
  /** Validate `text` and run a search, cancelling any in-flight one. */
  search: (text: string) => void
  /** Cancel any in-flight request and return to `idle`. */
  reset: () => void
}

const GENERIC_ERROR = 'Something went wrong with the search. Please try again.'

/** A user-facing message for whatever the service threw. */
export function messageForError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return GENERIC_ERROR
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function useGeocodeSearch(service: GeocodingService): UseGeocodeSearch {
  const [state, setState] = useState<SearchState>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  const cancelInFlight = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  const search = useCallback(
    (text: string) => {
      const validation = validateSearchInput(text)
      if (!validation.ok || validation.value === undefined) {
        cancelInFlight()
        setState({
          status: 'error',
          query: text.trim(),
          message: validation.error ?? GENERIC_ERROR,
        })
        return
      }

      const query = validation.value
      cancelInFlight()
      const controller = new AbortController()
      controllerRef.current = controller
      setState({ status: 'loading', query })

      service
        .search({ text: query, signal: controller.signal })
        .then((result) => {
          if (controller.signal.aborted) return
          setState(
            result.places.length === 0
              ? { status: 'empty', query }
              : {
                  status: 'success',
                  query,
                  places: result.places,
                  fellBackToGlobal: result.fellBackToGlobal,
                },
          )
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || isAbortError(error)) return
          setState({ status: 'error', query, message: messageForError(error) })
        })
        .finally(() => {
          if (controllerRef.current === controller) controllerRef.current = null
        })
    },
    [service, cancelInFlight],
  )

  const reset = useCallback(() => {
    cancelInFlight()
    setState({ status: 'idle' })
  }, [cancelInFlight])

  // Abort a pending request if the component using the hook unmounts.
  useEffect(() => cancelInFlight, [cancelInFlight])

  return { state, search, reset }
}
