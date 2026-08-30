import { useEffect, useState } from 'react'

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

import './App.css'

/**
 * Composition root: a search box over the map. Search results are listed in a
 * dismissible panel; selecting a result frames it on the map (without closing the
 * list) and opens the place-info panel below it. URL-sync layers on in Phase 5.
 */
function App() {
  const geocoding = useGeocodingService()
  const { state, search, reset } = useGeocodeSearch(geocoding)

  // The map only moves when the user explicitly picks a result from the list;
  // running a search populates the list but leaves the current view untouched.
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  // Hold off the geocode call until the user stops typing; the RateLimiter in the
  // geocoding service then spaces the actual requests to Nominatim's 1 req/s cap.
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)

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

  function handleQueryChange(text: string) {
    setQuery(text)
    setDismissedQuery(null)
  }

  function handleClear() {
    setQuery('')
    setDismissedQuery(null)
    reset()
    setSelectedPlace(null)
  }

  return (
    <div className="app">
      <div className="app__panel">
        <SearchBar onQueryChange={handleQueryChange} onClear={handleClear} />
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
      <MapView selectedPlace={selectedPlace} />
    </div>
  )
}

export default App
