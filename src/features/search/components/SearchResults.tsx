import type { Place } from '@/types/place'

import './SearchResults.css'

export interface SearchResultsProps {
  places: Place[]
  selectedPlace?: Place | null
  onSelect: (place: Place) => void
  onClose: () => void
}

export function SearchResults({
  places,
  selectedPlace,
  onSelect,
  onClose,
}: SearchResultsProps) {
  if (places.length === 0) {
    return null
  }

  return (
    <div className="search-results">
      <div className="search-results__header">
        <button
          type="button"
          className="search-results__close"
          aria-label="Close results"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <ul className="search-results__list">
        {places.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              className={`search-results__item ${selectedPlace?.id === place.id ? 'search-results__item--selected' : ''}`}
              onClick={() => onSelect(place)}
            >
              {place.displayName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
