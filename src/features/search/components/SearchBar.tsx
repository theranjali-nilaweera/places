import { useState, type FormEvent } from 'react'

import './SearchBar.css'

/**
 * The search input. Submit-driven (Enter or the button); it hands the raw text to
 * `onSearch` and does no validation itself — `useGeocodeSearch` owns that so the
 * message shown in `SearchStatus` stays the single source of truth.
 */

export interface SearchBarProps {
  onSearch: (text: string) => void
  /** Prefill, e.g. from a `?q=` URL param (Phase 5). */
  defaultValue?: string
  /** Disable while a request is in flight. */
  pending?: boolean
}

export function SearchBar({
  onSearch,
  defaultValue = '',
  pending = false,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(value)
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <div className="search-bar__row">
        <input
          className="search-bar__input"
          type="search"
          name="q"
          autoComplete="off"
          aria-label="Search for a place, address or landmark"
          placeholder="Search for a place, address or landmark"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="search-bar__submit" type="submit" disabled={pending}>
          {pending ? '…' : 'Go'}
        </button>
      </div>
    </form>
  )
}
