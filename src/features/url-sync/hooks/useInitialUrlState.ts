import { useEffect, useState } from 'react'

import { parseUrlParams, type UrlParams } from '../validators/urlParams.schema'

/**
 * The URL is a read-on-load input channel. This hook parses `location.search`
 * once on mount and normalises the address bar:
 *
 * - a usable `?search=` → keep it (canonicalised);
 * - anything else (a coordinate view, junk, or nothing) → collapse to the bare
 *   `?search=` affordance so the param stays discoverable in the address bar.
 *
 * Nothing else is written back. On the user's first edit of the search box the
 * loaded value is stale, so `App` calls {@link clearSearchParam}.
 */

const SEARCH_AFFORDANCE = '?search='

function readSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search
}

function replace(url: string): void {
  if (typeof window === 'undefined' || !window.history) return
  window.history.replaceState(null, '', url)
}

export function useInitialUrlState(): UrlParams {
  const [initial] = useState<UrlParams>(() => parseUrlParams(readSearch()))

  useEffect(() => {
    if (initial.search !== undefined) {
      const params = new URLSearchParams()
      params.set('search', initial.search)
      replace(`?${params.toString()}`)
    } else {
      replace(SEARCH_AFFORDANCE)
    }
    // Runs once — `initial` is frozen for the lifetime of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return initial
}

/** Reset the address bar to the empty `?search=` affordance. */
export function clearSearchParam(): void {
  replace(SEARCH_AFFORDANCE)
}
