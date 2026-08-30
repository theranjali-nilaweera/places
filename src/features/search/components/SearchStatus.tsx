import type { SearchState } from '../hooks/useGeocodeSearch'
import { MIN_QUERY_LENGTH } from '../validators/searchInput.schema'

import './SearchStatus.css'

/**
 * Renders the non-result feedback for a search: the "keep typing" hint, loading,
 * error, and no-match. Success is handled by the map/marker and the place-info
 * panel, so this component renders nothing in the `success` state (nor `idle`,
 * unless the user has typed a too-short query).
 */

export interface SearchStatusProps {
  state: SearchState
  /** The raw (pre-debounce) input, used only for the too-short hint. */
  query?: string
}

export function SearchStatus({ state, query = '' }: SearchStatusProps) {
  if (state.status === 'success') return null

  if (state.status === 'idle') {
    const length = query.trim().length
    if (length === 0 || length >= MIN_QUERY_LENGTH) return null
    return (
      <p className="search-status search-status--hint" role="status">
        Keep typing — enter at least {MIN_QUERY_LENGTH} characters.
      </p>
    )
  }

  if (state.status === 'loading') {
    return (
      <p className="search-status search-status--loading" role="status">
        Searching for “{state.query}”…
      </p>
    )
  }

  if (state.status === 'empty') {
    return (
      <p className="search-status search-status--empty" role="status">
        No matches for “{state.query}”. Try a more specific place or address.
      </p>
    )
  }

  return (
    <p className="search-status search-status--error" role="alert">
      {state.message}
    </p>
  )
}
