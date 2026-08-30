import { useState } from 'react'

import './SearchBar.css'

/**
 * The search input. Change-driven: it reports the raw text to `onQueryChange` on
 * every keystroke and does no validation itself — `App` debounces the value and
 * `useGeocodeSearch` owns validation, so the message shown in `SearchStatus`
 * stays the single source of truth. There is no submit button; a short query
 * simply doesn't trigger a request.
 */

export interface SearchBarProps {
  /** Called with the raw input text on every change. */
  onQueryChange: (text: string) => void
  /** Clear the input and dismiss any current results. */
  onClear?: () => void
  /** Prefill, e.g. from a `?q=` URL param (Phase 5). */
  defaultValue?: string
}

export function SearchBar({ onQueryChange, onClear, defaultValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)

  function handleChange(next: string) {
    setValue(next)
    onQueryChange(next)
  }

  function handleClear() {
    setValue('')
    onClear?.()
  }

  return (
    <div className="search-bar" role="search">
      <div className="search-bar__row">
        <input
          className="search-bar__input"
          type="search"
          name="q"
          autoComplete="off"
          aria-label="Search for a place, address or landmark"
          placeholder="Search for a place, address or landmark"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
        />
        {value !== '' && (
          <button
            className="search-bar__clear"
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
