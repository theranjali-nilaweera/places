import { useEffect, useRef, useState } from 'react'

import type { Place } from '@/types/place'

import { useGeocodingService } from './config/geocoding'
import { MapView } from './features/map/components/MapView'
import { PlaceInfoPanel } from './features/place-info/components/PlaceInfoPanel'
import { SearchBar } from './features/search/components/SearchBar'
import { SearchResults } from './features/search/components/SearchResults'
import { SearchStatus } from './features/search/components/SearchStatus'
import { useDebouncedValue } from './features/search/hooks/useDebouncedValue'
import { useGeocodeSearch } from './features/search/hooks/useGeocodeSearch'
import { MIN_QUERY_LENGTH } from './features/search/validators/searchInput.schema'
import {
  clearSearchParam,
  useInitialUrlState,
} from './features/url-sync/hooks/useInitialUrlState'

import './App.css'

/**
 * Composition root: a search box over the map. Search results are listed in a
 * dismissible panel; selecting a result frames it on the map (without closing the
 * list) and opens the place-info panel below it.
 *
 * The URL is a read-on-load input channel: `?search=` prefills the box and runs a
 * search; `?lat=&lon=&z=` sets the initial map view. On the user's first edit the
 * loaded `?search=` value is stale, so we collapse it back to the bare affordance.
 * A search that came from `?search=` also auto-selects its first result so the
 * deep link lands on a place; a search the user types never moves the map on its
 * own.
 */
function App() {
  const geocoding = useGeocodingService()
  const { state, search, reset } = useGeocodeSearch(geocoding)

  const initialUrlState = useInitialUrlState()

  // The map only moves when the user explicitly picks a result from the list;
  // running a search populates the list but leaves the current view untouched.
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  // Hold off the geocode call until the user stops typing; the RateLimiter in the
  // geocoding service then spaces the actual requests to Nominatim's 1 req/s cap.
  // Seeded from `?search=` so a deep link runs its search on mount.
  const [query, setQuery] = useState(initialUrlState.search ?? '')
  const debouncedQuery = useDebouncedValue(query)

  // True while the address bar still shows the value we loaded from `?search=`.
  // The first user edit invalidates it; we clear the param once and stop tracking.
  const urlSearchLive = useRef(initialUrlState.search !== undefined)

  // One-shot latch: the `?search=` search auto-selects its first result. Flips to
  // consumed the moment that search resolves (any outcome) or the user touches
  // the box, so later UI searches never move the map on their own.
  const [urlSearchConsumed, setUrlSearchConsumed] = useState(
    initialUrlState.search === undefined,
  )

  // The results panel is derived, not stateful: it shows whenever there is a
  // successful search the user hasn't dismissed. Closing it records the query
  // that was dismissed; typing anything clears that, so the next search reopens.
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null)
  const activeQuery = state.status === 'idle' ? '' : state.query
  const resultsOpen = activeQuery !== dismissedQuery

  useEffect(() => {
    if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
      reset()
      return
    }
    search(debouncedQuery)
  }, [debouncedQuery, search, reset])

  // Auto-select the first result of the `?search=` deep-link search — once.
  // Done while rendering (React's "adjust state on data change" pattern), not in
  // an effect, so there is no extra commit. `idle`/`loading` mean the search
  // hasn't resolved yet; any terminal state consumes the latch.
  if (!urlSearchConsumed && state.status !== 'idle' && state.status !== 'loading') {
    setUrlSearchConsumed(true)
    const [firstResult] = state.status === 'success' ? state.places : []
    if (firstResult) setSelectedPlace(firstResult)
  }

  function dropStaleUrlSearch() {
    setUrlSearchConsumed(true)
    if (!urlSearchLive.current) return
    clearSearchParam()
    urlSearchLive.current = false
  }

  function handleQueryChange(text: string) {
    setQuery(text)
    setDismissedQuery(null)
    dropStaleUrlSearch()
  }

  function handleClear() {
    setQuery('')
    setDismissedQuery(null)
    reset()
    setSelectedPlace(null)
    dropStaleUrlSearch()
  }

  return (
    <div className="app">
      <div className="app__panel">
        <SearchBar
          onQueryChange={handleQueryChange}
          onClear={handleClear}
          defaultValue={initialUrlState.search ?? ''}
        />
        <SearchStatus state={state} query={query} />
        {resultsOpen && state.status === 'success' && state.places.length > 0 && (
          <SearchResults
            places={state.places}
            selectedPlace={selectedPlace}
            onSelect={setSelectedPlace}
            onClose={() => setDismissedQuery(activeQuery)}
          />
        )}
        <PlaceInfoPanel place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      </div>
      <MapView selectedPlace={selectedPlace} initialView={initialUrlState.view} />
    </div>
  )
}

export default App
