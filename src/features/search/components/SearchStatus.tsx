import type { SearchState } from '../hooks/useGeocodeSearch'

import './SearchStatus.css'

/**
 * Renders the non-result feedback for a search: loading, error, and no-match.
 * Success is handled by the map/marker and the place-info panel, so this
 * component renders nothing in the `idle` and `success` states.
 */

export interface SearchStatusProps {
  state: SearchState
}

export function SearchStatus({ state }: SearchStatusProps) {
  if (state.status === 'idle' || state.status === 'success') return null

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
