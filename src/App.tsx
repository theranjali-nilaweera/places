import { useState } from 'react'

import type { Place } from '@/types/place'

import { useGeocodingService } from './config/geocoding'
import { MapView } from './features/map/components/MapView'
import { SearchBar } from './features/search/components/SearchBar'
import { SearchResults } from './features/search/components/SearchResults'
import { SearchStatus } from './features/search/components/SearchStatus'
import { useGeocodeSearch } from './features/search/hooks/useGeocodeSearch'

import './App.css'

/**
 * Composition root: a search box over the map. Search results are listed in a
 * dismissible panel; selecting a result frames it on the map without closing the
 * panel. Place-info and URL-sync layer on in later phases.
 */
function App() {
  const geocoding = useGeocodingService()
  const { state, search } = useGeocodeSearch(geocoding)

  // The map only moves when the user explicitly picks a result from the list;
  // running a search populates the list but leaves the current view untouched.
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [resultsOpen, setResultsOpen] = useState(true)

  function handleSearch(text: string) {
    setResultsOpen(true)
    search(text)
  }

  return (
    <div className="app">
      <div className="app__panel">
        <SearchBar onSearch={handleSearch} pending={state.status === 'loading'} />
        <SearchStatus state={state} />
        {resultsOpen && state.status === 'success' && state.places.length > 0 && (
          <SearchResults
            places={state.places}
            selectedPlace={selectedPlace}
            onSelect={setSelectedPlace}
            onClose={() => setResultsOpen(false)}
          />
        )}
      </div>
      <MapView selectedPlace={selectedPlace} />
    </div>
  )
}

export default App
